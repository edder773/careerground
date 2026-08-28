---
title: VERIFIED_DISCOVERY에서 운영 D1까지 끊긴 자동화 연결
date: 2026-08-28
tags: [automation, d1, github-actions, idempotency, slack]
generatedByAI: false
---

# VERIFIED_DISCOVERY에서 운영 D1까지 끊긴 자동화 연결

## 증상과 기준선

세 ChatGPT 파티션이 Git blob과 Issue 포인터를 전달하면 GitHub Actions는 `VERIFIED_DISCOVERY` artifact까지 만들었지만 그 뒤 운영 반영 단계가 없었다. `.github/workflows/careerground-v5-handoff.yml`의 동작은 검증·artifact 업로드·Issue 종료로 끝났고, `careerground-jobs-v5.yml`의 publish job은 의도적으로 실패하는 pre-cutover guard였다.

오전 Slack 준비 확인도 다음 조건만 사용했다.

```sql
WHERE kind = 'jobs' AND status = 'COMMITTED'
```

따라서 v5가 `kind='jobs-v5'`로 import 원장을 기록하더라도 08:01·08:31 실행은 이를 준비 완료로 판단할 수 없었다.

## 원인과 핵심 이론

원인은 수집·검증과 운영 쓰기 사이에 명시적인 trust boundary가 없었던 것이다. ChatGPT 결과를 그대로 D1에 쓰는 것은 위험하고, 반대로 artifact만 보관하면 수동 Pro·Work 전달 의존성이 남는다.

해결 원칙은 다음과 같다.

1. GitHub는 blob의 무결성·출처 소유권·수집 계약을 검증한다.
2. Sites endpoint는 운영 DB 직전에서 날짜·결정적 runId·ID·URL·canonical key·fingerprint·경력 증거·마감일을 다시 검증한다.
3. 운영 기준선에 이미 있는 URL은 건너뛰고, 새 URL이 기존 식별자와 충돌하면 전체 실행을 중단한다.
4. stage와 publish는 기존 D1 원자 batch와 idempotency ledger를 재사용한다.
5. 기존 `jobs` UPDATE·DELETE와 `saved_jobs` mutation은 수행하지 않는다.

## 변경 전후

| 항목                             | 변경 전                              | 변경 후                           |
| -------------------------------- | ------------------------------------ | --------------------------------- |
| handoff의 운영 게시 호출         | 0                                    | 보호된 endpoint 1회               |
| 수동 필수 중계                   | Pro 검증 + Work DB 반영              | 0, Pro는 선택적 읽기 전용 감사    |
| Slack이 인정하는 import kind     | `jobs` 1종                           | `jobs`, `jobs-v5` 2종             |
| 같은 bundle 재실행               | 운영 게시 경로 없음                  | `ALREADY_PUBLISHED`               |
| 같은 runId의 다른 bundle         | 판정 경로 없음                       | source checksum 불일치로 차단     |
| 신규 URL의 기존 fingerprint 충돌 | 후속 수동 검증에 의존                | endpoint에서 fail-closed          |
| 일일 Sites 재배포                | 수동 DB 반영 과정에 결합될 수 있었음 | 없음, 배포된 endpoint가 D1만 갱신 |

핵심 연결은 다음과 같다.

```text
18:00 ChatGPT partition 3개
  → Git blob + trusted Issue pointer
  → GitHub schema 5.1 검증/정규화
  → Bearer 보호 Sites endpoint
  → D1 stage + atomic publish + last-success
  → 다음 평일 08:01 Slack digest
```

## 안전장치

- `PUBLISH_API_TOKEN`과 `CAREERGROUND_PUBLISH_TOKEN`은 동일 난수값이지만 digest token과 분리했다.
- token은 Authorization header에만 들어가며 request body, artifact, stdout에 기록하지 않는다.
- 요청 본문은 실제 UTF-8 3MB를 초과하면 거부한다.
- target date는 실행 시점의 Asia/Seoul 날짜와 같아야 한다.
- 한 실행의 신규 INSERT는 D1 atomic batch 한도 여유를 위해 75건 이하로 제한한다.
- 신규 공고의 `created_at`은 서버 게시 시각으로 고정해 다음 Slack window에서 누락되지 않게 한다.
- 게시 성공과 사후 jobs 증가량·saved_jobs 불변·publication/import batch 단일 존재를 확인한 뒤에만 Issue를 닫는다.

## 검증

- 집중 회귀: 81/81 통과.
- workflow·endpoint 경계 회귀: 61/61 통과.
- 전체 unit: contracts 10, web 23, root 175로 총 208 통과.
- lint, typecheck, Sites production build 통과.
- E2E: Chromium·Firefox·WebKit·375px 모바일 포함 34/34 통과.
- 실제 Slack 전송: 0건. 이번 변경은 오전 digest의 입력 준비 판정만 확장했다.

첫 E2E 시도는 sandbox가 `127.0.0.1:4000` listen을 `EPERM`으로 차단해 애플리케이션 테스트 전에 종료됐다. 동일 커밋을 로컬 테스트 서버 권한으로 재실행해 34개가 모두 통과했으므로 제품 결함으로 계산하지 않는다.
