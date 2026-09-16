---
title: 채용 수집 표현형 enum 재발과 보수적 정규화 확장
date: 2026-09-16
tags: [jobs-v5, data-contract, slack, incident]
generatedByAI: false
---

# 채용 수집 표현형 enum 재발과 보수적 정규화 확장

## 증상

2026-09-15 수집 파티션 3개는 모두 GitHub에 도착했지만 Actions 실행
`34950865952`가 `DISCOVERY_POLICY_INVALID`로 종료됐다. 따라서 운영 D1과 Slack에는
아무 변경도 적용되지 않았다.

## 원인

수집기는 계약 enum 대신 `신입/경력 중 신입 트랙`, `정규직·계약직`,
`Public corporation` 같은 사람이 읽는 표현을 15개 필드에 기록했다. 입력이 하나라도
계약 밖이면 전체 묶음을 막는 fail-closed 정책은 정상 동작했지만, 의미가 명확한 표현까지
경계에서 변환하지 못해 26개 공고 전체가 지연됐다.

## 수정 원칙

- 신입 지원이 명시된 혼합 경력 표현은 `NEW_GRAD_ELIGIBLE`로 변환한다.
- 계약 유형이 혼합되거나 직급만 설명하면 계약을 추측하지 않고 `UNCONFIRMED`로 둔다.
- `Full-time internship`, `청년인턴(채용형)`처럼 유형이 명시된 경우에만 인턴 enum으로 변환한다.
- 숫자만 있는 직원 수는 규모 근거로 쓰지 않고 `UNCLASSIFIED`로 둔다.
- `Large enterprise`, `Mid-sized enterprise`, `Public corporation`처럼 분류가 직접 명시된 경우만 해당 enum으로 변환한다.

## 전후 검증

동일한 불변 blob 3개를 다시 내려받아 같은 run ID로 검증했다.

| 항목                | 변경 전 | 변경 후 |
| ------------------- | ------: | ------: |
| 미지원 enum 필드    |      15 |       0 |
| 검증 행             |       0 |      26 |
| 묶음 내부 잠재 중복 | 판정 전 |       0 |
| 운영 DB 변경        |       0 |       0 |
| Slack 발송          |       0 |       0 |

회귀 테스트는 새 표현형을 모두 포함하며, `경력자 우대`, `프리랜서`, `대기업 추정` 같은
모호한 표현은 계속 거부한다. 상세 수치는
`docs/evidence/jobs-v5-collector-alias-recovery-2026-09-16.json`에 기록했다.

## 재현

```bash
pnpm exec vitest run scripts/jobs-v5/canonical-policy.test.mjs
pnpm jobs:v5:validate-discovery \
  --target-as-of-date 2026-09-15 \
  --run-id CG-2026-09-15-A1-discovery \
  --partition1 work/jobs-v5/handoff-sep15/careerground-partition-1-2026-09-15.json \
  --partition2 work/jobs-v5/handoff-sep15/careerground-partition-2-2026-09-15.json \
  --partition3 work/jobs-v5/handoff-sep15/careerground-partition-3-2026-09-15.json \
  --output work/jobs-v5/discovery-sep15
```
