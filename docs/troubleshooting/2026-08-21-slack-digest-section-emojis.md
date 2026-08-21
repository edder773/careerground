---
title: Slack 요약 섹션 이모지 복원
date: 2026-08-21
tags: [slack, digest, notification, regression]
generatedByAI: false
---

# Slack 요약 섹션 이모지 복원

## 문제와 기준선

Slack 요약을 한 메시지로 합치는 과정에서 섹션 제목의 이모지가 모두 제거됐다. 날짜와 링크 구조는 유지됐지만 코딩 테스트와 채용 공고의 시각적 구분이 약해졌다. 변경 전 동일한 fixture로 Slack formatter·sender 테스트 8/8이 통과하는 기준선을 남겼다.

## 핵심 이론

장식 요소는 항목마다 반복하지 않고 정보 위계를 구분하는 섹션 제목에만 둔다. 코딩 테스트 제목에는 `🔥`, 채용 알림 제목에는 `💼`를 한 번씩 사용한다. 채용 공고가 없는 날에는 채용 섹션 자체를 만들지 않으므로 `💼`도 출력하지 않는다.

## 변경 전후

| 조건                                           | 변경 전 | 변경 후 |
| ---------------------------------------------- | ------: | ------: |
| 코딩 테스트만 있는 메시지의 이모지             |     0개 |     1개 |
| 코딩 테스트와 채용 공고가 있는 메시지의 이모지 |     0개 |     2개 |
| 항목별 반복 이모지                             |     0개 |     0개 |
| 검증 중 실제 Slack 전송                        |     0건 |     0건 |

## 검증 결과

- Slack formatter·sender 집중 테스트 8/8 통과
- 전체 unit·component·runtime 테스트 143/143 통과
- Playwright E2E 56/56 통과: Chromium, 모바일 Chromium, Firefox, WebKit
- format, lint, typecheck, production build, Sites build 통과
- 실제 webhook과 운영 채널을 호출하지 않고 mock 응답으로 검증
- 공고 없음: `🔥`만 포함하고 `💼`는 미포함
- 공고 있음: 메시지 전체에 `🔥`, `💼`가 각각 한 번만 포함

이번 변경은 메시지 payload 포맷만 수정하며 예약 시각, 평일·공휴일 판단, API 인증, webhook 전송 횟수에는 영향을 주지 않는다.
