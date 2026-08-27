---
title: Slack 08:01 예약 누락과 채용 갱신 순서 보강
date: 2026-08-27
tags: [slack, github-actions, schedule, d1, jobs, resilience]
generatedByAI: false
pr: 68
commit: fd56cffca3e3b8b979d40db2fc2a962006ac8490
evidence: docs/evidence/slack-schedule-resilience-2026-08-27.json
---

# Slack 08:01 예약 누락과 채용 갱신 순서 보강

## 현상

2026년 8월 27일 08:01 KST에 예정된 `Daily CareerGround Slack digest` 예약 run이 생성되지
않았다. workflow 로그에서 실패한 것이 아니라 run 자체가 없었고, 09:16 KST 수동 실행은 11초 만에
성공해 D1 `daily:2026-08-27` delivery가 `SENT`가 됐다.

같은 날 채용 import는 08:28:52 KST에야 `COMMITTED`됐다. 따라서 08:01 run이 정상 생성됐더라도
당시 DB에는 새 공고 10건과 기존 공고 수정 4건이 아직 반영되지 않은 상태였다. 예약 누락과 별개로
`채용 갱신 → Slack 발송` 순서가 코드로 강제되지 않은 두 번째 문제가 있었다.

## 원인

GitHub 상태 기록의 Actions 장애 시작은 22:56:31 UTC, 예약 목표는 23:01:00 UTC로 269초 차이다.
GitHub 문서도 `schedule` event가 높은 부하에서 지연되거나 일부 작업이 누락될 수 있다고 명시한다.
당일 Actions API에는 해당 workflow의 schedule run이 없고 장애 종료 후 수동 run은 성공했으므로,
애플리케이션 인증·Slack webhook·D1 claim 실패가 이번 08:01 누락의 실행 경로 원인은 아니다.

다만 GitHub 장애 보고의 PR-triggered run 지연·미실행 비율을 이 schedule 한 건의 확률로 해석하지
않는다. 확인 가능한 사실은 장애 시간대가 겹쳤고 CareerGround schedule run이 생성되지 않았다는
것이다.

## 핵심 이론 1: 같은 scheduler의 감시 코드는 자기 run 부재를 감지할 수 없다

기존 지연 검사는 workflow가 시작된 다음 `현재 시각 - 08:01`을 계산했다. run이 생성되지 않으면
검사 코드도 실행되지 않는다. 이를 완전히 해결하려면 별도 공급자의 외부 heartbeat가 필요하지만,
저장소 내부에서는 서로 다른 분의 독립 예약을 여러 개 두는 것이 직접 적용 가능한 복원력이다.

```text
08:01 primary ─┐
08:31 fallback ├─ D1 daily:YYYY-MM-DD claim ─ 첫 성공 1건만 Slack
09:17 fallback ┘
```

최근 세 예약의 실제 지연은 26.42분, 18.90분, 21.65분이었다. fallback을 정각 부근이 아닌 31분과
17분에 배치해 GitHub 문서가 경고하는 시간대 시작점의 부하 집중도 피했다. 예약 trigger 수는
1개에서 3개가 됐지만 외부 scheduler의 정확한 실행 시각 자체는 여전히 보장하지 않는다.

## 핵심 이론 2: 발송 readiness와 exactly-once claim은 순서가 중요하다

08:01과 08:31 요청은 먼저 같은 KST 날짜의 `import_batches(kind='jobs', status='COMMITTED')`를
확인한다. `committed_at`에는 `Z`와 `+09:00` 형식이 함께 존재하므로 문자열 비교가 아니라 SQLite
`julianday()`로 같은 절대 시각 축에서 비교한다.

준비되지 않았으면 `not-ready`를 반환하고 `slack_digest_deliveries` 행을 만들지 않는다. 그래야
08:31 fallback이 같은 날짜를 다시 claim할 수 있다. 준비된 뒤에는 기존 D1 원자 claim을 그대로
사용해 세 run이 겹쳐도 실제 Slack 호출은 하나만 허용한다.

09:17은 당일 신규 공고가 없어 import batch가 만들어지지 않는 경우까지 고려한 최종 안전망이다.
이때는 freshness gate를 풀어 코딩 문제는 전달한다. 뒤늦게 추가된 공고는 직전 성공 delivery 이후
window에 남아 다음 일일 알림에서 선택된다.

## 전후 비교

| 항목                             |           변경 전 |           변경 후 |
| -------------------------------- | ----------------: | ----------------: |
| 평일 schedule trigger            |               1개 |               3개 |
| 채용 import 완료를 확인하는 예약 |               0개 |               2개 |
| 준비 전 D1 delivery claim        |              가능 |               0개 |
| run 미생성 시 저장소 내부 재시도 |              없음 |       08:31·09:17 |
| 동일 날짜 Slack 최대 발송        | D1 claim 기준 1건 | D1 claim 기준 1건 |

변경 전 같은 명령은 3개 파일 60개 테스트, 변경 후는 3개 파일 63개 테스트를 통과했다. 추가한
회귀 테스트는 오래된 import가 readiness를 만족하지 않는지, `+09:00` 시각의 당일 COMMITTED
batch 뒤에만 claim되는지, `not-ready`일 때 webhook을 부르지 않는지, workflow output이 민감정보
없이 후속 incident 단계로 전달되는지를 검증한다. 이 검증 중 실제 Slack 메시지는 0건이다.

전체 E2E 첫 실행에서는 56개 중 52개가 통과하고 같은 visual test가 네 브라우저에서 실패했다.
테스트가 회사 검색을 검증하면서 `NAVER`를 고정했지만 해당 로컬 fixture의 마감일이 현재 시각을
지나 ACTIVE 목록에서 사라진 것이 원인이었다. 화면 코드는 바꾸지 않고 첫 번째 현재 노출 공고의
회사명을 읽어 검색하도록 시계 의존성을 제거했다. 해당 테스트 4/4 재검증 뒤 Chromium, 375px
모바일 Chromium, Firefox, WebKit 전체 E2E 56/56이 통과했다.

Sites 전용 소스의 정확한 HEAD에는 GitHub보다 앞서 적용된 `0036` 채용 migration이 있었고, 이
migration의 당일 import batch 때문에 readiness 테스트의 최초 요청이 예상한 `not-ready` 대신
`claimed`가 됐다. 운영 쿼리 오류가 아니라 LocalD1 테스트가 seed 상태에 의존한 문제였다. 해당
테스트 시작 시 `kind='jobs'` import fixture만 삭제한 뒤 오래된 batch와 당일 batch를 직접 구성하도록
격리했다. 사용자·공고·운영 D1 행은 변경하지 않았다.

최종 검증은 format, lint, typecheck, production build와 unit/integration 148개가 통과했다. docs
build에는 기존 500 kB 초과 chunk 경고가 남지만 종료 코드는 성공이며 이번 Slack/D1 경로와 무관하다.
합성 LocalD1 성능 예산은 jobs cursor p95 5.81ms, 검색 p95 41.58ms로 실패 0건이었다. bundle 예산도
초기 route gzip 147,350 bytes, 최대 JavaScript 95,339 bytes, 최대 CSS 22,572 bytes로 통과했다.
격리 복구 훈련은 2,015,232 bytes snapshot을 5.45ms에 복원했고 foreign key 위반과 table count
불일치가 없었다. 이 수치는 운영 D1 또는 GitHub Actions scheduler 성능으로 해석하지 않는다.

## 남은 경계

- GitHub Actions 장애가 세 예약 모두에 걸치면 같은 공급자 안의 fallback도 실행되지 않을 수 있다.
- 09:17 이후 반영된 공고는 그날 이미 전송된 delivery에 추가할 수 없고 다음 일일 window로 넘어간다.
- 별도 공급자의 heartbeat/on-call paging은 현재 연결하지 않았으므로, run 자체 부재의 독립 감지는
  아직 운영자와 GitHub Status 확인이 필요하다.
