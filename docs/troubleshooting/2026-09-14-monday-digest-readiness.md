---
title: 월요일 채용 알림 사전 점검과 수집 enum 복구
date: 2026-09-14
tags: [jobs-v5, slack, recovery, validation]
generatedByAI: true
---

# 월요일 채용 알림 사전 점검과 수집 enum 복구

근거: [비식별 검증 기록](../evidence/monday-digest-readiness-2026-09-14.json).

## 현상과 원인

금요일 저녁 수집된 세 파티션 35건의 고용형태·경력·회사규모 값 중 21개 필드가
canonical enum 계약에 맞지 않았다. 전체 bundle이 DB 게시 전에 중단됐으며 월요일
사전 dry-run은 코딩 4문제와 채용 0건을 반환했다. 수집 Issue 도착과 DB 게시 완료는 다르다.

## 핵심 이론과 수정

경계에서 정규화하는 adapter는 의미가 명확한 동의어만 변환해야 한다.
`정규직 신입`과 `정규직(기간의 정함이 없는 근로계약)`은 `FULL_TIME`,
`경력무관(신입 포함)`은 `NEW_GRAD_ELIGIBLE`로 정규화한다.
`신입(계약형태 미표기)`는 `UNCONFIRMED`, 인원수가 붙은 `미분류`는
`UNCLASSIFIED`로 유지한다. 신입 여부나 직원 수로 계약형태·회사규모를 추측하지 않는다.
검토하지 않은 복합 표현은 계속 거부하며 raw 값을 운영 DB에 그대로 보내지 않는다.

중복은 URL 일치만으로 판단하지 않았다. 다른 채용 플랫폼에 재게시된 공고도 회사,
채용 차수, 직무, 접수 기간과 기존 DB·발송 이력을 대조했다. 같은 회사의 다른 인턴
차수나 다른 직무는 단순 회사명 중복으로 제거하지 않았다. 원본 attempt를 수정하지 않고
원래 기준일을 보존한 새 attempt로 검토 결과를 전달했다.

원문 재확인에서 명시된 마감 시각은 복구 입력에 반영했다. 기존 DB 행은 덮어쓰지 않았다.

## 측정된 결과

| 항목                                | 변경 전 | 복구 후 |
| ----------------------------------- | ------: | ------: |
| 같은 35건의 지원하지 않는 enum 필드 |      21 |       0 |
| 운영 DB 행                          |     307 |     316 |
| 기존 행 변경·삭제                   |       0 |       0 |
| 신규 중 마감 확정 / 상시            |  미반영 |   8 / 1 |

기존 공고 중복 또는 마감 26건을 복구 대상에서 제외했다. 기존 307행이 모두 불변이고,
신규 9개 ID가 각각 한 번 존재하며 복구 import가 COMMITTED임을 전수 확인했다.
상시채용은 일일 Slack 대상에서 제외한다.

## 준비 검증이 성공을 가장하지 않도록

- 수동 workflow의 `require_fresh_jobs=true`로 아침과 같은 갱신 조건을 검사할 수 있다.
- `dry_run=true`에서는 `preview` 응답만 허용한다. DB 미준비나 예상 밖 응답은 오류로
  종료하고 webhook 또는 발송 확정 API를 호출하지 않는다.
- dry-run 실패도 GitHub workflow 실패로 표시한다. 운영 알림 Issue를 만들지 않는 것과
  테스트 실패를 숨기는 것은 별개다.

재현: 수동 Daily Slack workflow에서 `dry_run=true`, `require_fresh_jobs=true`,
`snapshot_created_at` 비움으로 실행한다. 합격 로그의 코딩·채용 수를 확인하고
당일 delivery와 reservation이 생성되지 않았는지 확인한다. 실제 발송 검증으로 대체하지 않는다.

로컬 회귀 검증은 `pnpm exec vitest run scripts/jobs-v5/canonical-policy.test.mjs
scripts/jobs-v5/discovery-delta.test.mjs scripts/slack/send-daily-digest.test.mjs`로 실행한다.

## 남는 운영 경계

현재 목표는 기존 설정인 08:01 KST다. 07:55 runner 선점, 08:31 감시,
게시·SLO 이벤트가 같은 일일 claim을 사용한다. 입력과 DB가 준비됐다는 것은
GitHub 스케줄러의 정각 실행을 보증한다는 뜻이 아니다. 외부 queue 지연 가능성은 남는다.
