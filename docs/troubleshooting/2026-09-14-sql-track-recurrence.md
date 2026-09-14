---
title: SQL 추천 재발 — DB 분류를 검증 근거로 재사용한 오류
date: 2026-09-14
tags: [coding-test, sql, data-integrity, slack]
generatedByAI: false
---

# SQL 문제가 알고리즘 Lv.1로 다시 추천된 이유

근거: [검증 기록](../evidence/sql-track-recurrence-2026-09-14.json).

## 핵심 원인: 같은 잘못된 값을 두 번 검사한 것은 이중 검증이 아니다

`track = 'ALGORITHM'`이라는 추천 조건 자체가 빠진 것이 아니다. 원본 catalog의
132203이 잘못 분류되어 있었다. 8월 25일 수정은 당시 발견한 네 ID만 SQL로
바꿨으며 132203은 빠져 있었다. 추천 후보, 저장된 오늘의 문제, Slack 발송 전
검사가 모두 같은 DB track 값을 믿어 SQL이 정상 알고리즘으로 통과했다.

[문제 원문](https://school.programmers.co.kr/learn/courses/30/lessons/132203)은
SQL 작성을 요구하며, 공식 페이지의 두 유형 속성도 모두 `database`이다.
제목에 특정 단어가 있는지를 추측하는 방식은 사용하지 않았다.

## 전후 구조

```text
이전: DB track → 추천 → 같은 track으로 검사 → Slack
이후: 공식 페이지 유형·레벨 → 검증 catalog
                              ├─ 추천 후보와 저장된 추천 검사
                              ├─ 운영 DB 조건부 정정
                              └─ Slack 원문 URL·유형·레벨 재검사
```

```ts
// 이전: DB가 SQL을 ALGORITHM이라고 잘못 적으면 통과
row.track === 'ALGORITHM' && row.level === 1;

// 이후: 원문 URL에 대응하는 독립 검증 정보와도 일치해야 함
isVerifiedCodingProblem(row) && row.track === 'ALGORITHM' && row.level === 1;
```

기존 catalog 427개 각각의 공식 페이지를 조회했다. `data-challenge-category`와
`data-challengeable-type`이 서로 일치해야 하며, 레벨도 공식 속성에서 확인한다.
누락·실패·충돌이 하나라도 있으면 새 검증 catalog 전체 생성을 실패시킨다.

| 측정 대상          | 수정 전 fixture |     원문 검증 기준 |
| ------------------ | --------------: | -----------------: |
| 전체 문제          |             427 |                427 |
| 알고리즘           |             361 |                360 |
| SQL                |              66 |                 67 |
| 확인된 유형 불일치 |               1 | 0 (정정 테스트 후) |
| 확인된 레벨 불일치 |               0 |                  0 |

## 재발 방지 경계

- 오늘의 Lv.1·2와 Slack 전용 Lv.3 모두 검증 catalog에 있는 알고리즘만 선택한다.
- SQL 슬롯은 검증된 SQL Lv.3·4만 허용한다. 미등록 원문은 알고리즘으로 추정하지 않는다.
- 이미 저장된 잘못된 추천도 재검사하고 해당 슬롯만 다시 선정한다.
- 최근 출제 제외 기간을 완화해도 유형·레벨 검사는 완화하지 않는다.
- 서버 응답의 라벨이 틀리거나, 문제 URL이 미검증이거나, 같은 문제가 중복되면
  Slack 요청 전에 차단한다. 실제 전송 전 실패임이 확실하므로 claim을 FAILED로
  종료해 불필요한 UNCERTAIN 잠금을 남기지 않는다.
- DB 정정은 별도 인증된 운영 작업으로만 수행한다. 서버에 포함된 검증 정보만
  사용하며 id·URL·기존 유형·레벨 조건이 일치할 때만 UPDATE한다. 공개 조회에서
  catalog를 덮어쓰지 않으며, 완료된 발송 이력과 채용 데이터도 변경하지 않는다.

## 재현과 검증

수정 전 동일 로컬 fixture에서 저장 추천 재사용과 Slack 포맷 허용 두 실패를
재현했다. 같은 두 재현은 수정 후 통과했다. 원문 메타데이터 파싱, 427개 catalog,
후보 소진, 반복 제외 완화, Lv.3 캐시 오염, 미검증 URL, 인증·조건부 정정·재실행,
Slack 요청 0회와 claim 해제도 자동 검사한다.

```sh
pnpm exec vitest run deployment/sites/d1-verified-challenges.test.ts scripts/coding scripts/slack/send-daily-digest.test.mjs deployment/sites/d1-slack-digest-delivery.test.ts
pnpm lint
pnpm typecheck
pnpm test
PLAYWRIGHT_API_PORT=4168 PLAYWRIGHT_WEB_PORT=5268 pnpm test:e2e --workers=2
```

검증 기록에는 최초 5-worker E2E 실행의 시각 테스트 3건 시간 초과도 남겼다.
사이트 UI 변경은 없으므로 화면 이미지를 분류 정확성의 근거로 사용하지 않는다.
이 변경의 속도 개선 수치는 **정량 측정 불가**다.

## 운영 절차와 한계

`Verify coding catalog` 작업은 기본 검사 전용이며 불일치가 있으면 실패한다.
승인된 정정은 apply=true로 실행하고, 다시 검사해 차이 0건인지 확인한다.
이 작업에는 Slack webhook 자격증명이 없고 메시지를 보내는 코드도 없다.

새 문제를 추가할 때는 공식 원문 검증 catalog도 갱신해야 추천에 참여할 수 있다.
실시간 원문 변경을 매 발송 시 크롤링하지는 않는다. 검증된 catalog를 배포하므로
출처 장애 때문에 매일 발송이 중단되는 추가 의존성은 만들지 않았다.
