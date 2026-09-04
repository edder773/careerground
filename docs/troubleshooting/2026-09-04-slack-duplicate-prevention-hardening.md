---
title: Slack 채용공고 중복 방지 경계 강화
date: 2026-09-04
tags: [slack, d1, deduplication, idempotency, concurrency]
generatedByAI: false
---

# Slack 채용공고 중복 방지 경계 강화

## 현상과 남아 있던 경계

기존 구현은 같은 일자의 `delivery_key`와 과거 `SENT` 이력을 대조했지만 두 경계가 남아 있었다.

1. 일일 실행과 스냅샷 복구가 서로 다른 delivery key로 거의 동시에 claim하면, 어느 쪽도 아직 `SENT`
   이력을 만들기 전이어서 같은 `job_id`를 각각 payload에 포함할 수 있었다.
2. 같은 채용 캠페인이 다른 플랫폼에서 다시 수집되면서 접수 시작일뿐 아니라 마감일도 정정되면,
   마감일 완전 일치 규칙을 벗어나 같은 공고가 신규로 판단될 수 있었다.

즉 날짜 단위 멱등성과 완료 후 의미 중복 제거는 있었지만, 외부 Slack 호출 직전의 공고 단위 동시성
제어가 없었다.

## 개선 구조

### 1. 수집 게시 경계

운영 DB의 현재 ACTIVE 행뿐 아니라 모든 신입 공고 이력을 회사·캠페인·직무 기준으로 비교한다. 같은
공고가 비활성화된 뒤 다른 URL과 정정된 마감일로 다시 들어와도 DB INSERT 전에 제외한다.

### 2. 메시지 후보 경계

`slack_digest_items`와 구 delivery payload의 전체 `SENT` 이력을 읽어 현재 후보 및 같은 payload 안의
후보와 다시 비교한다. 억제 결과는 `duplicateAudit.suppressedJobs`에 판정 사유와 비교 대상을 남긴다.

### 3. 외부 호출 직전 원자 예약

`slack_digest_job_reservations`를 추가했다. delivery claim과 payload의 모든 `job_id` 예약을 하나의 D1
transaction으로 실행하며, 활성 예약에는 `job_id` 전역 unique index를 적용한다. 일일·스냅샷 실행이
겹치면 한 transaction만 성공하고 다른 실행은 Slack을 호출하기 전에 `job-already-reserved`로 종료한다.

### 4. 결과별 재시도 정책

- `SENT`: 예약을 영구 보존하고 같은 공고를 다시 claim하지 않는다.
- `UNCERTAIN`: Slack 수신 여부를 알 수 없으므로 예약을 유지하고 자동 재전송하지 않는다.
- `FAILED`: Slack이 명시적으로 거부한 경우에만 예약을 `RELEASED`해 안전한 재시도를 허용한다.

## 판정 보정과 오탐 방지

같은 회사·동등 제목은 접수 시작일 1일 차이와, 같은 시작일 기준 최대 31일의 마감일 정정·연장을
같은 캠페인으로 본다. 단 제목의 연도 또는 상·하반기/분기가 서로 다르면 별도 캠페인으로 유지한다.
동일 회사의 iOS·Android, 백엔드·프론트엔드 같은 서로 다른 전문 직무도 기존처럼 분리한다.

## 전후 비교

| 항목                        | 변경 전                               | 변경 후                                      |
| --------------------------- | ------------------------------------- | -------------------------------------------- |
| 서로 다른 delivery key 경합 | 둘 다 외부 호출 전 단계까지 진입 가능 | 공고별 unique 예약으로 한 transaction만 성공 |
| 비활성 과거 공고 재수집     | 게시 비교 대상에서 제외될 수 있음     | 전체 신입 공고 이력과 INSERT 전 대조         |
| 마감일 정정                 | 날짜 불일치로 별도 캠페인 가능        | 시작일·캠페인 판별 후 제한 범위 내 흡수      |
| 명시적 Slack 실패           | delivery 재시도                       | 예약 해제 후에만 재시도                      |
| 네트워크 결과 불명          | `UNCERTAIN` delivery만 보존           | delivery와 공고 예약을 함께 보존             |

## 회귀 검증

- 같은 `job_id`의 일일·스냅샷 claim 충돌
- `FAILED` 예약 해제와 재claim
- `UNCERTAIN` 자동 재전송 차단
- 국민은행 법인명·IT 부문 띄어쓰기·접수일 1일·마감일 정정 조합
- 상반기와 하반기 캠페인 분리
- 비활성 과거 캠페인의 다른 URL 재게시 차단
- migration checksum, runtime table/index inventory, 복구 드릴 대상 검증

검증 과정은 mock 응답과 로컬 D1-compatible SQLite만 사용하며 실제 Slack webhook은 호출하지 않는다.
