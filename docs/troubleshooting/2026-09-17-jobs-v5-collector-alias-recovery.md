---
title: 채용 수집 계약 표현형 확장과 9월 17일 발송 복구
date: 2026-09-17
tags: [jobs-v5, data-contract, slack, incident]
generatedByAI: false
---

# 채용 수집 계약 표현형 확장과 9월 17일 발송 복구

## 증상

2026-09-16 기준 수집 파티션 3개는 모두 도착했지만 Actions 실행
`35078083338`이 `DISCOVERY_POLICY_INVALID`로 종료됐다. fail-closed 정책에 따라 27개
공고 전체가 운영 D1과 Slack에 반영되지 않았다.

## 원인

수집기가 계약 enum 대신 `경력무관(1년 이상 경력 우대)`,
`계약직(3~6개월, 신입 6개월 후 정규직 전환 검토)`, `51~300명 이하` 같은 설명을
19개 필드에 기록했다. 기존 정책은 검토하지 않은 값을 추측하지 않고 차단했지만, 실제
원문의 의미가 명확한 표현을 canonical 값으로 바꾸는 경계가 부족했다.

## 수정 원칙

- 신입 또는 최근 졸업자 지원 가능성이 명시된 경우만 `NEW_GRAD_ELIGIBLE`로 변환한다.
- 계약직임이 명확하고 전환은 가능성으로만 제시되면 `CONTRACT`로 유지한다.
- 정규직·계약직, 신입·경력직처럼 복수 형태를 하나로 확정할 수 없으면 `UNCONFIRMED`로 둔다.
- `인턴(6개월)`, `체험형 인턴(6개월)`처럼 유형이 명시된 경우만 `INTERNSHIP`으로 변환한다.
- 직원 수와 직원 수 범위는 기업규모 분류 근거로 추정하지 않고 `UNCLASSIFIED`로 둔다.

## 전후 검증

동일한 불변 blob 3개를 내려받아 다시 검증했다.

| 항목                | 변경 전 | 변경 후 |
| ------------------- | ------: | ------: |
| 미지원 enum 필드    |      19 |       0 |
| 검증 행             |       0 |      27 |
| 묶음 내부 잠재 중복 | 판정 전 |       0 |
| 운영 DB 변경        |       0 |       0 |
| Slack 발송          |       0 |       0 |

상세 근거는 `docs/evidence/jobs-v5-collector-alias-recovery-2026-09-17.json`에 기록했다.

## 재현

```bash
pnpm exec vitest run scripts/jobs-v5/canonical-policy.test.mjs
pnpm jobs:v5:validate-discovery \
  --target-as-of-date 2026-09-16 \
  --run-id CG-2026-09-16-A1-local-review \
  --partition1 work/jobs-v5/handoff-sep16/careerground-partition-1-2026-09-16.json \
  --partition2 work/jobs-v5/handoff-sep16/careerground-partition-2-2026-09-16.json \
  --partition3 work/jobs-v5/handoff-sep16/careerground-partition-3-2026-09-16.json \
  --output work/jobs-v5/discovery-sep16
```
