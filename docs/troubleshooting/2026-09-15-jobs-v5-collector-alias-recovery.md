---
title: 채용 수집 자유 서술 enum으로 인한 전체 게시 차단 복구
date: 2026-09-15
tags: [jobs-v5, validation, normalization, slack]
generatedByAI: true
---

# 채용 수집 자유 서술 enum으로 인한 전체 게시 차단 복구

근거: [비식별 검증 기록](../evidence/jobs-v5-collector-alias-recovery-2026-09-15.json).

## 현상과 원인

세 파티션 28건은 모두 도착했지만 회사 규모, 고용 형태, 신입 지원 범위에 괄호 설명이 붙은
27개 필드를 canonical enum 경계가 거부했다. 일부 파티션만 반영하는 대신 전체 bundle을
`FAILED_DISCOVERY`로 차단했기 때문에 운영 DB에는 새 import가 없었고 일일 Slack 발송도
`job-import-not-ready`로 보류됐다.

## 핵심 이론과 수정

외부 수집기는 사람이 읽는 설명을 만들 수 있지만 운영 경계는 유한한 enum만 받아야 한다.
adapter는 원문에 직접 드러난 의미만 canonical 값으로 바꾼다.

- 명시된 정규직과 기간의 정함이 없는 근로계약은 `FULL_TIME`으로 정규화한다.
- 정규직 전환이 명시된 인턴은 `INTERN_TO_FULL_TIME`, 체험형 인턴은 `INTERNSHIP`으로
  정규화한다.
- 신입 전용 표현은 `NEW_GRAD_ONLY`, 신입도 지원 가능한 혼합 표현은
  `NEW_GRAD_ELIGIBLE`로 구분한다.
- `중견기업(...)`과 `중소기업(...)`은 명시된 분류만 보존하고 괄호 속 인원 설명을 버린다.
  인원 수만 있는 값은 규모를 추론하지 않고 `UNCLASSIFIED`로 둔다.

알 수 없는 계약 형태, 경력자 전용 표현, 추정 규모는 이전처럼 거부한다. 운영 DB 게시와 Slack
전송은 로컬 검증에서 호출하지 않았다.

## 동일 입력 비교

| 항목                                |            변경 전 |              변경 후 |
| ----------------------------------- | -----------------: | -------------------: |
| 동일 28건의 지원하지 않는 enum 필드 |                 27 |                    0 |
| 검증 상태                           | `FAILED_DISCOVERY` | `VERIFIED_DISCOVERY` |
| bundle 내부 잠재 중복               |       측정 전 중단 |                    0 |
| 검증 중 Slack 전송                  |                  0 |                    0 |

회귀 테스트는 검토한 표현의 변환 결과와 함께 `경력자 우대`, `근무 조건 협의`처럼 모호한 값이
계속 차단되는지 확인한다. 게시 단계에서는 운영 DB 전체를 다시 읽고 ID, URL, canonical key,
fingerprint와 회사·채용차수·직무·접수기간을 대조한 뒤 신규 행만 원자적으로 반영한다.
