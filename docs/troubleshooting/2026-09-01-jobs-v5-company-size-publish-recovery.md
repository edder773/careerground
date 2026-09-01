---
title: Jobs v5 회사 규모 계약 불일치와 Slack 누락 복구
date: 2026-09-01
tags: [jobs-v5, slack, github-actions, sites, d1, resilience]
generatedByAI: false
pr: 107
commit: 151a89118b6654ec6e66f878b738f9b1d8bc4069
evidence: docs/evidence/jobs-v5-publish-recovery-2026-09-01.json
---

# Jobs v5 회사 규모 계약 불일치와 Slack 누락 복구

## 현상

- 2026-08-31 18:06:48 KST의 v5 handoff 실행은 세 파티션 23건을 모두 검증했지만 운영 게시 API에서 HTTP 500으로 종료됐다.
- 2026-09-01 오전 GitHub 예약 실행이 생성되지 않았고, 08:50 KST의 Production SLO 완료 watchdog은 신규 import가 없다는 `job-import-not-ready`만 반환했다.
- D1의 마지막 성공 게시 스냅샷은 2026-08-28이었고 `daily:2026-09-01` 발송 원장도 생성되지 않았다.

## 핵심 이론

외부 수집 산출물과 운영 API 사이의 enum은 하나의 계약이다. 입력 어댑터가 모든 관측 별칭을 운영 canonical 값으로 바꾸고, 운영 경계는 canonical 값만 받아야 한다. 잘못된 enum은 재시도로 해결되지 않는 영구 오류이므로 4xx로 구분하고, 네트워크 오류와 5xx만 제한적으로 재시도해야 한다.

GitHub cron은 지정 시각에 실행을 보장하지 않는다. 따라서 독립 fallback과 이벤트 기반 watchdog을 함께 사용하되, 마지막 fallback은 채용 import가 지연돼도 코딩 문제 알림을 보낼 수 있어야 한다. 모든 경로는 D1의 동일한 일일 발송 키로 중복을 차단한다.

## 원인

수집 산출물의 첫 항목은 `companySize: MID_SIZED_ENTERPRISE`를 사용했다. GitHub 어댑터에는 `MID_SIZED` 별칭만 있었으므로 값이 그대로 운영 API에 전달됐다. 운영 API가 허용하는 값은 `LARGE`, `PUBLIC`, `MID`, `SMALL`, `STARTUP`, `FOREIGN`, `UNCLASSIFIED`뿐이어서 게시 전에 실패했다. 검증 예외가 일반 DB 오류 경로로 처리되어 실제 원인이 HTTP 500으로 가려졌다.

알림 workflow의 이벤트 기반 watchdog은 09:17까지 신규 import를 요구했다. 08:50 watchdog이 살아 있었음에도 게시 실패 때문에 발송을 보류했고, 이 실행 경로는 채용 DB 갱신 지연 이슈도 열지 않았다.

## 전후 비교

| 항목                    | 변경 전                    | 변경 후                                             |
| ----------------------- | -------------------------- | --------------------------------------------------- |
| 회사 규모 별칭          | `MID_SIZED`만 `MID`로 변환 | `MID_SIZED_ENTERPRISE`도 `MID`로 변환               |
| 알 수 없는 규모 값      | 운영 API까지 통과 가능     | GitHub 어댑터에서 `DISCOVERY_POLICY_INVALID`로 차단 |
| 운영 계약 오류 응답     | 일반 `DATABASE_ERROR` 500  | `PUBLISH_VALIDATION_FAILED` 422와 필드 원인         |
| 게시 재시도             | 1회                        | 네트워크·5xx에 한해 최대 3회, 1초·2초 backoff       |
| import 없는 마지막 알림 | 09:17까지 대기             | 08:51부터 코딩 문제 알림 가능                       |
| readiness incident      | 예약 실행만 생성           | 수동 dry-run 외 예약·watchdog 모두 생성             |

## 재현과 검증

```bash
pnpm exec vitest run \
  scripts/jobs-v5/discovery-delta.test.mjs \
  scripts/jobs-v5/publish-discovery.test.mjs \
  deployment/sites/d1-jobs-v5-discovery.test.ts \
  scripts/slack/send-daily-digest.test.mjs
```

회귀 테스트는 별칭 정규화, 미지원 enum의 사전 차단, 5xx 재시도, 422 비재시도, 운영 API의 typed 422, 08:51 freshness fallback을 각각 검증한다. 운영 복구에서는 실패한 handoff artifact를 그대로 재사용해 새 수집 없이 게시하고, D1 import 원장·jobs 증가량·Slack 일일 원장을 사후 대조한다.

## 예방 규칙

1. 새 enum 별칭은 어댑터의 alias map과 허용 canonical set을 같은 변경에서 갱신한다.
2. 운영 서버는 계약 실패를 422로 반환하고 저장소나 Slack에 부작용을 만들지 않는다.
3. 게시 클라이언트는 4xx를 재시도하지 않고 네트워크·5xx만 최대 3회 재시도한다.
4. 08:51과 09:17 fallback은 import 유무와 관계없이 일일 코딩 문제 알림을 보장한다.
5. 모든 예약·watchdog 경로는 같은 D1 발송 키를 사용해 실제 Slack 호출을 하루 한 번으로 제한한다.
