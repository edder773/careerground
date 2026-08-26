---
title: 운영 SLO 정적 헤더 오탐과 readiness 중복 조회
date: 2026-08-26
tags: [audit, operations, slo, sites, d1, observability]
generatedByAI: false
pr: 60
commit: 400b8ca8b79246b8530dfa19a906699aab584c52
evidence: docs/evidence/stage4-operational-observability-2026-08-26.json
---

# 운영 SLO 정적 헤더 오탐과 readiness 중복 조회

## 현상

`Production SLO smoke` 예약 실행은 2026-08-24부터 25일까지 확인 가능한 최근 8회가 모두
실패했다. 같은 시각 운영 `/health/ready`는 HTTP 200, D1 원장 일치, 공통 catalog canary 정상인데
workflow는 구체적인 실패 항목 없이 `exit code 1`만 남겼다.

운영 응답을 같은 순서로 분해해 확인한 결과는 다음과 같았다.

- 정적 `/`: HTTP 200이고 CSP·referrer `meta`가 있지만 CSP와 nosniff 응답 헤더는 없다.
- Worker `/api/v1/health/ready`: HTTP 200이고 CSP, frame, permissions, referrer, nosniff 헤더가 모두 있다.
- D1: expected/applied migration `0035`가 일치하고 jobs 147, problems 427, learning 102,
  search rows 679였다.
- 5회 readiness 외부 왕복은 첫 표본 3,317.7ms, 후속 표본 714.3~818.5ms였다.

즉 데이터베이스 장애가 아니라 Sites 전달 경계와 성능 표본을 잘못 모델링한 모니터의 오탐이었다.

## 근본 원인

### 1. 플랫폼이 소유하는 정적 cache와 Worker 응답을 같은 것으로 봤다

Worker 코드는 asset 응답에도 보안 헤더를 붙이지만, Sites의 정적 asset cache hit는 Worker 래퍼를
우회한다. 기존 bash는 `/`의 HTTP 헤더에 CSP와 nosniff가 반드시 있다고 가정했다. 브라우저가 받는
HTML에는 이미 CSP·referrer meta fallback이 있었는데도 이를 검사하지 않았다.

보안 정책은 실제 전달 주체에 맞춰 검증해야 한다.

```text
Sites 정적 cache → HTML CSP/referrer meta
Worker API        → CSP/frame/permissions/nosniff/referrer 응답 헤더
```

정적 HTML에서 지원되지 않는 header-only 정책을 가짜로 통과시키지 않는다. API 경계에서는 전체
헤더를 요구하고, 정적 경계에서는 실제 브라우저가 적용할 수 있는 fallback을 요구한다.

### 2. 첫 표본과 warm 표본을 하나의 latency로 섞었다

첫 readiness에는 Worker/D1 초기화와 edge 상태가 반영되고 뒤이은 요청은 warm 경로를 탄다. 하나의
표본이나 첫 표본을 포함한 작은 표본 p95는 정상 warm 성능과 cold-start를 구분하지 못한다.

새 검사기는 첫 표본을 5초 cold-start budget으로, 뒤이은 4개 표본을 2.5초 warm p95 budget으로
각각 판정한다. 앞선 운영 표본을 이 모델로 해석하면 cold-start 3,317.7ms와 warm p95 818.5ms가
서로 독립된 신호가 된다.

### 3. readiness 한 요청에서 schema inventory를 반복했다

Worker gate가 `ensureRuntimeSchema()`를 호출한 뒤 readiness route가 다시
`inspectRuntimeSchema()`를 호출했다. warm isolate에서도 schema inventory 3개 쿼리와 canary 1개,
총 4개 D1 query가 필요했다.

`readRuntimeSchema()`가 database binding별 read-only Promise를 공유하도록 변경해 gate와 route가
같은 결과를 사용한다. 준비된 isolate의 readiness는 canary query 1개만 실행한다. LocalD1 회귀
테스트 기준 query 4→1, 75% 감소다. schema 불일치 시 cache를 제거하고 기존처럼 503 fail-closed를
유지한다.

## 관측성과 장애 수명주기

긴 bash 파이프라인을 테스트 가능한 Node 검사기로 교체했다. 각 계약은 고유 ID, 판정, 실제 값을
JSON으로 남기며 실패가 있어도 가능한 다음 검사를 계속 수행한다.

```json
{
  "passed": true,
  "latency": {
    "readinessColdStartMs": 3317.7,
    "readinessWarmP95Ms": 818.5
  },
  "failures": []
}
```

GitHub Actions는 이 JSON을 실행별 artifact로 30일 보관한다. 실패하면 같은 제목의 열린 incident를
찾아 댓글을 추가하고, 없을 때만 새 이슈를 만든다. 정상화된 첫 실행은 복구 근거를 댓글로 남기고
incident를 닫는다. 모니터 자체가 같은 장애 이슈를 반복 생성하지 않도록 한 것이다.

감사의 route bundle 예산 누락도 같은 단계에서 막았다. production web build의 실제 gzip 크기를
계산해 개별 JavaScript 110KB, CSS 30KB, 초기 route 합계 180KB를 넘으면 CI를 실패시킨다. 현재
초기 route는 147,773 bytes, 최대 JavaScript chunk는 95,410 bytes, 최대 CSS는 22,548 bytes다.

## 전후 비교

| 항목                    | 변경 전                      | 변경 후                                   |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| 최근 예약 실행          | 확인 가능한 8회 연속 오탐    | 전달 경계별 계약 판정                     |
| warm readiness D1 query | 4                            | 1                                         |
| latency 신호            | 단일 표본                    | cold-start 1개 + warm 표본 4개            |
| 실패 위치               | bash `exit code 1`           | 검사 ID·실제 값·전체 실패 목록            |
| 실행 증거               | 만료되는 console log         | 구조화 JSON artifact, 30일                |
| 같은 장애의 incident    | 실행마다 Actions 실패만 누적 | 열린 이슈 1개에 이력 누적, 복구 자동 종료 |
| production web 예산     | 없음                         | 초기 route·개별 JS/CSS gzip CI gate       |

## 회귀 검증

- 정적 응답에 보안 헤더가 없어도 올바른 CSP·referrer meta가 있으면 통과한다.
- 정적 CSP fallback 누락, catalog canary 0, cold/warm budget 초과를 각각 실패로 판정한다.
- 첫 PR CodeQL은 Google script URL을 문자열 부분 일치로 검사한 코드를 high severity
  `Incomplete URL substring sanitization`으로 차단했다. CSP를 directive별 source token으로 파싱해
  정확히 일치시키고, 악성 host 뒤에 Google URL 문자열을 붙인 회귀 fixture가 실패하는지 검증했다.
- 한 endpoint가 timeout이어도 인증 경계 등 나머지 증거를 계속 수집한다.
- 준비된 D1 binding의 readiness가 schema inventory를 다시 실행하지 않고 canary query 1개만
  실행하는지 검사한다.
- schema 원장 누락과 checksum 불일치는 계속 503이며 개인 데이터 변경 SQL을 실행하지 않는다.
- 작은 fixture로 초기 route와 lazy chunk 분리를 검증하고 실제 production web build가 gzip 예산을
  통과하는지 검사한다.

검증 과정에서 Slack digest API나 webhook은 호출하지 않는다.

최종 로컬 검증은 format, lint, typecheck, 40개 파일의 unit/integration 167개, production build,
bundle budget, 성능 budget, 복구 drill을 통과했다. Playwright는 Chromium·375px mobile
Chromium·Firefox·WebKit에서 56개가 통과했다. 첫 E2E 시도는 sandbox의 로컬
`127.0.0.1:4000` bind 제한으로 앱 기동 전에 `EPERM`이 발생했고, 로컬 포트 권한으로 같은 명령을
재실행해 56/56 통과했다.

합성 성능은 jobs cursor p95 4.72ms, search p95 39.81ms였고 예산 실패는 없었다. 격리 복구는
1,908,736 bytes snapshot을 2.05ms에 복원했으며 foreign key 위반과 checksum 차이가 없었다. 이
수치는 LocalD1 기준이며 운영 D1의 RTO로 해석하지 않는다.

## 남은 경계

- Sites 정적 cache에 `X-Frame-Options`, `Permissions-Policy`, nosniff를 강제하는 설정 surface는
  현재 제공되지 않는다. API에는 해당 정책이 적용돼 있다.
- GitHub incident는 저장소 운영 경보다. 별도 on-call paging 서비스와 브라우저 RUM은 연결하지 않았다.
- 실제 Google 로그인 synthetic은 통제된 테스트 계정이 없으므로 401 경계와 로컬 Google session
  회귀 테스트로 대체한다.
- 운영 D1 export/restore는 Sites 관리 연결이 제공하지 않아 이 단계에서도 완료로 주장하지 않는다.
