---
title: Slack 채용공고 반복 전송과 예약 지연 무결성 개선
date: 2026-08-31
tags: [slack, d1, github-actions, deduplication, observability]
generatedByAI: false
---

# Slack 채용공고 반복 전송과 예약 지연 무결성 개선

## 현상

2026-08-31 일일 알림은 18개 공고를 전송했지만, 이전 알림과 같은 채용 캠페인을 다른 채용 플랫폼 URL로 다시 수집한 항목이 포함됐다. 같은 날 08:01과 08:31 예약은 각각 10:04와 10:27 KST에 실행됐고 `job-import-not-ready` 경보를 만들었다.

확인한 대표 반복은 미래에셋자산운용 OMS, 넥슨 넥토리얼, 우리은행 TECH/IT, LG에너지솔루션 하반기 IT/SW/AI 캠페인이다. 원본 실행은 GitHub Actions `33344130318`, 지연 실행은 `33346437592`와 `33347622004`에 보존돼 있다.

## 핵심 이론과 원인

### URL 식별자와 비즈니스 식별자는 다르다

기존 신규 판단은 `jobs.created_at`과 개별 `source_url`을 사용했다. 같은 채용이 공식 사이트, 사람인, 잡코리아에 각각 올라오면 URL과 DB 행은 서로 달라도 사용자 관점에서는 같은 캠페인이다. 따라서 전송 중복 방지는 다음 세 층을 분리해야 한다.

1. 회사 정규화: 법인 표기와 알려진 별칭을 하나의 회사 키로 합친다.
2. 캠페인 정규화: 접수 시작일·마감일·고유 캠페인 이름으로 채용 단위를 만든다.
3. 직무 정규화: iOS, Android, 데이터 분석처럼 같은 캠페인 안에서 실제로 다른 직무는 별도로 유지한다.

### 완료 원장은 현재 공고 상태보다 강한 근거다

기존 휴리스틱은 현재 `ACTIVE` 공고만 비교했다. 과거에 전송한 행이 만료되거나 비활성화되면 비교 대상에서 사라질 수 있다. `slack_digest_items`는 실제 `SENT` 완료 시점의 공고 식별자를 보존하므로 현재 상태와 무관하게 반복 전송을 차단한다. 이전 버전의 `slack_digest_deliveries.payload`도 호환 이력으로 읽어 migration 직후부터 과거 알림을 비교한다.

### 멱등성 확인은 최신성 확인보다 먼저다

지연된 fallback은 이미 같은 날 발송이 완료됐는데도 새 import가 있는지 먼저 검사했다. 새 import가 없으면 `job-import-not-ready`가 되어 정상 완료를 장애로 오판했다. 새 순서는 `daily:YYYY-MM-DD`의 `SENT`를 먼저 확인하고, 아직 보내지 않은 경우에만 import 최신성을 검사한다.

### GitHub 예약은 정확한 시각 보장이 아니다

GitHub 예약 이벤트는 실행 인프라 부하에 따라 지연될 수 있다. 애플리케이션이 이를 제거할 수는 없으므로 08:01 뒤 10분 간격의 독립 fallback, 시간당 Production SLO 완료 이벤트, v5 게시 완료 `repository_dispatch`를 함께 사용한다. 모든 경로는 같은 D1 delivery key를 claim하므로 실제 메시지는 하루 한 번만 전송된다.

## 전후 비교

| 항목               | 변경 전                         | 변경 후 계약                                          |
| ------------------ | ------------------------------- | ----------------------------------------------------- |
| 오늘 전송 후보     | 18개 행                         | 회사·캠페인·직무와 과거 SENT 원장 비교 후 후보        |
| 확인된 반복 캠페인 | 최소 4개                        | 같은 캠페인·같은 직무 또는 umbrella면 억제            |
| 서로 다른 직무     | 단순 캠페인 유사도로 오탐 가능  | iOS·Android·데이터·Flutter role key를 별도 유지       |
| 완료 이력          | delivery payload만 존재         | delivery + 공고별 `slack_digest_items` 원장           |
| 예약 기동 신호     | 08:01, 08:31, 09:17, SLO 완료   | 08:01~08:51 10분 fallback, 09:17, SLO 완료, 게시 완료 |
| 08:31 지연 계산    | 08:01 기준 146분으로 오측정     | 각 cron 자체 시각 기준 116분                          |
| dry-run            | snapshot과 fresh gate 충돌 가능 | dry-run에 fresh gate를 강제하지 않음                  |
| 배포 출처          | 스키마만 확인                   | readiness에서 feature version과 commit SHA 확인       |

## 회귀 검증

- `deployment/sites/job-dedup.test.ts`: 실제 반복 4종과 서로 다른 직무 3종을 고정 fixture로 검사한다.
- `deployment/sites/d1-api.test.ts`: 과거 payload 호환, 공고별 SENT 원장, 같은 캠페인의 후속 source 억제, `already-sent` 우선순위를 검사한다.
- `scripts/operations/check-schedule-delay.test.mjs`: 각 fallback의 cron 시각으로 지연을 계산한다.
- `scripts/operations/check-production-slo.test.mjs`: 배포 feature/commit provenance 불일치를 실패로 처리한다.
- 검증 과정에서 Slack webhook은 호출하지 않는다.

## 운영 한계

GitHub Actions만으로 08:01 정각 실행을 수학적으로 보장할 수는 없다. 이번 변경은 독립 기동 신호와 짧은 fallback 간격으로 누락 가능성을 줄이고, 실제 전송은 D1 멱등성 원장으로 한 번만 허용한다. 정각 보장이 필수라면 향후 GitHub 외부의 관리형 cron을 추가하되 동일 claim API를 호출해야 한다.
