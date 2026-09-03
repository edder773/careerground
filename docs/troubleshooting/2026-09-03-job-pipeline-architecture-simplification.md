---
title: 채용 검증 정책 중복과 Slack 다중 예약 단순화
date: 2026-09-03
tags: [jobs-v5, slack, architecture, reliability]
generatedByAI: false
pr: 132
commit: c2b6aa05c09e5e84468f2a1950cba28d0485104a
evidence: docs/evidence/jobs-pipeline-simplification-2026-09-03.json
---

# 채용 검증 정책 중복과 Slack 다중 예약 단순화

## 증상과 기준선

운영 정상 경로는 수집, 검증, 게시, 알림 네 단계였지만 구현상 enum 정책이 수집기와 보호 API 두
파일에 각각 정의돼 있었다. 이전 장애에서는 한쪽만 새 alias를 알게 되어 수집 검증은 통과했지만
게시 API가 422를 반환했다. Slack workflow도 예약 누락을 보완하는 과정에서 평일 cron이 9개까지
늘어나 운영 흐름을 읽기 어려웠다.

변경 전 기준선은 아래 명령으로 재현했다.

```bash
rg -n "cron:" .github/workflows/daily-slack-digest.yml
rg -n "ALLOWED_CAREER_SCOPES|ALLOWED_EMPLOYMENT_TYPES|ALLOWED_COMPANY_SIZES" \
  scripts/jobs-v5/discovery-delta.mjs deployment/sites/d1-jobs-v5-discovery-contract.ts
pnpm exec vitest run scripts/jobs-v5/discovery-delta.test.mjs \
  scripts/jobs-v5/workflow-policy.test.mjs scripts/slack/send-daily-digest.test.mjs \
  deployment/sites/d1-jobs-v5-discovery.test.ts \
  scripts/operations/check-schedule-delay.test.mjs \
  scripts/operations/hold-until-kst.test.mjs
```

- Slack 평일 cron: 9개
- canonical enum 값 정의: 2곳
- 집중 회귀 기준선: 6개 파일, 73개 테스트 통과

## 핵심 이론

정규화와 신뢰 경계 검증은 역할이 다르다. 외부 수집기는 알려진 한글·legacy alias를 한 곳에서
canonical 값으로 정규화할 수 있어야 한다. 반면 운영 DB 직전의 보호 API는 정규화를 다시 수행해
조용히 허용하면 안 되며, 이미 canonical인 값만 받아야 검증 우회를 막을 수 있다.

예약 신뢰성도 cron 개수만으로 얻지 않는다. 서로 다른 원인의 신호를 결합하고 최종 부작용을 DB의
원자 claim으로 한 번만 허용하는 것이 핵심이다. 따라서 선점 예약, 감시 예약, 게시 완료 이벤트,
독립 SLO 이벤트가 모두 같은 `daily:YYYY-MM-DD`를 claim하도록 유지했다.

## 변경

enum 값·alias·정규화·위반 보고를 `scripts/jobs-v5/canonical-policy.mjs` 한 파일로 옮겼다.
수집기는 이 정책으로 alias를 정규화하고, 보호 API는 같은 검사 결과에서 `changes`가 하나라도 있으면
비canonical 입력으로 거부한다.

```text
변경 전: collector policy ── 별도 변경 ── API policy
변경 후: canonical policy ─┬─ collector: alias 정규화 허용
                            └─ API: canonical 값만 허용
```

Slack 예약은 07:55 선점 후 08:01까지 대기하는 본 실행과 08:31 감시 실행만 남겼다. 게시 완료와
Production SLO 완료 이벤트는 그대로 유지한다. 07:55 실행의 예약 지연은 cron 원시 시각이 아니라
실제 목표인 08:01을 기준으로 측정한다. 세 종류의 incident에서 반복하던 GitHub Issue 생성·댓글·종료
코드는 `.github/actions/sync-incident/action.yml`로 통합했다.

## 전후 비교

| 항목                       | 변경 전 | 변경 후 | 변화                   |
| -------------------------- | ------: | ------: | ---------------------- |
| 평일 cron                  |       9 |       2 | 7개 감소, 77.8% 축소   |
| canonical enum 정책 원천   |       2 |       1 | 단일 진실 공급원       |
| digest workflow 본문       |   280줄 |   169줄 | 111줄 감소, 39.6% 축소 |
| 게시 완료 이벤트 감시      |       1 |       1 | 유지                   |
| Production SLO 이벤트 감시 |       1 |       1 | 유지                   |
| D1 일일 발송 claim         |       1 |       1 | 원자 중복 방지 유지    |

단순화는 데이터 정책을 완화하지 않는다. URL·ID·fingerprint 충돌 차단, 신규 ACTIVE 전용 게시,
기존 jobs와 saved_jobs 불변, `SENT` 재전송 차단, `UNCERTAIN` 자동 재시도 금지는 유지된다.

## 회귀 방지

- canonical 정책 단위 테스트가 alias 정규화, 알 수 없는 값 위치 보고, 값 catalog 불변성을 검증한다.
- 보호 API 회귀 테스트가 알려진 alias도 최종 경계에서는 422로 거부되는지 검증한다.
- Slack workflow 테스트가 cron 2개, 07:55 hold, 08:31 watchdog, 이벤트 감시, 08:01 지연 기준을
  고정하고 여섯 incident 분기가 공통 adapter를 사용하는지 확인한다.
- 실제 2026-09-02 세 파티션 37행을 공유 정책으로 재검증해 63개 alias 정규화와 잠재 중복 0건을
  동일하게 재현했다.
- 이 변경의 검증 과정에서는 Slack Webhook을 호출하거나 운영 D1을 변경하지 않는다.

운영 흐름과 경계는 `docs/architecture/jobs-notification-pipeline.md`를 기준으로 한다.
