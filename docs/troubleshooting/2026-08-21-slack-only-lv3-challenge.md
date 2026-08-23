---
title: Slack 전용 Lv.3 도전 문제 분리
date: 2026-08-21
tags: [slack, digest, coding-test, daily-challenge]
generatedByAI: false
pr: 50
commit: 46c8c692d99243d444ade276fc0b133e4701efad
evidence: docs/evidence/slack-digest-lv3-challenge-2026-08-21.json
---

# Slack 전용 Lv.3 도전 문제 분리

## 요구사항과 기준선

CareerGround 화면에는 Lv.1·Lv.2 알고리즘과 SQL 문제까지 기존 세 문제만 유지하면서, Slack 알림에는 Lv.2와 SQL 사이에 알고리즘 Lv.3 문제를 하나 더 제공해야 했다. 변경 전 같은 fixture의 D1 API·Slack formatter 집중 테스트는 46/46이 통과했고, Slack 문제 수와 사이트 문제 수는 모두 3개였다.

## 핵심 이론

화면용 응답 배열에 문제를 추가하면 사이트의 오늘의 문제까지 네 개로 바뀐다. 따라서 Slack 전용 Lv.3 문제는 `level_slot = 3`으로 날짜별 선정 결과만 보관하고, 사이트 공통 조회는 기존 `1, 2, 34` 슬롯만 읽도록 경계를 유지했다. Slack 보호 API만 전용 슬롯을 Lv.1·Lv.2와 SQL 사이에 조립한다.

선정은 기존 문제와 같은 날짜 기반 seed를 사용한다. 같은 날 재실행해도 저장된 문제를 다시 반환하며, 반복 제외 기간과 완화 설정도 기존 일일 문제 정책을 따른다. 동시 요청은 날짜와 슬롯의 고유 제약 및 upsert로 하나의 결과에 수렴한다. 저장된 후보가 비활성화돼도 같은 슬롯을 새 활성 후보로 복구할 수 있다.

## 변경 전후

| 지표                            | 변경 전 |         변경 후 |
| ------------------------------- | ------: | --------------: |
| Slack 코딩 문제                 |     3개 |             4개 |
| 사이트 오늘의 코딩테스트        |     3개 |             3개 |
| Lv.3 도전 문제의 Slack 내 위치  |    없음 | Lv.2와 SQL 사이 |
| 검증 중 실제 Slack webhook 호출 |     0건 |             0건 |

도전 문제 링크에는 `(도전 문제) 문제명`을 사용하고, 두 번째 줄은 기존 메타데이터 형식인 `알고리즘 · Lv.3`을 유지한다.

## 회귀 방지와 검증

- Slack 보호 API가 `Lv.1 → Lv.2 → 도전 Lv.3 → SQL` 순서로 네 문제를 반환하는지 검증
- 같은 날짜에 두 번 조회해도 동일한 Lv.3 문제를 반환하는지 검증
- Slack 조회 후에도 사이트 일일 문제 API가 `1, 2, 34` 슬롯 세 개만 반환하는지 검증
- 잘못된 개수 또는 순서를 formatter가 전송 전에 거부하는지 검증
- 집중 테스트 47/47, 전체 unit·component·runtime 테스트 144/144 통과
- Playwright E2E 56/56, format, lint, typecheck, production build와 Sites build 통과
- 운영 webhook 대신 mock fetch와 로컬 formatter만 사용해 실제 Slack 알림 0건

DB schema migration은 필요하지 않다. 기존 일일 문제의 정수 슬롯과 날짜·슬롯 고유 제약을 그대로 사용한다.
