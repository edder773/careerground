---
title: 운영 버전 94 검증과 알림·딥링크 복구
date: 2026-08-31
tags: [sites, slack, github-actions, routing, handoff]
generatedByAI: false
---

# 운영 버전 94 검증과 알림·딥링크 복구

## 현상

2026-08-31 09:13 KST 기준 Sites 최신 운영 버전은 94였고 D1 readiness와 공개 API는 정상이었다. 그러나 다음 운영 결함이 함께 확인됐다.

- `/jobs`, `/coding`, `/learning` 직접 접근이 HTTP 307로 `/`에 이동했다.
- 08:01과 08:31 Slack 예약 run 자체가 생성되지 않았다.
- 운영에만 있던 중복 공고 억제 커밋이 GitHub `main`에 없었다.
- 성공한 PARTITION_1 A3에 대체된 A2 handoff Issue #85가 열려 있었다.

## 핵심 원인

### SPA fallback

Worker가 존재하지 않는 HTML 경로에서 `/index.html`을 다시 요청했다. Sites 정적 자산 계층은 이 요청을 `/`로 canonical redirect하므로 React Router가 원래 경로를 받지 못했다. fallback 대상은 redirect되는 파일명이 아니라 앱 셸을 직접 반환하는 `/`이어야 한다.

### Slack 예약 누락

단일 GitHub workflow 안에 08:01·08:31·09:17 fallback이 있었지만 workflow run 자체가 생성되지 않으면 내부 지연 감지와 재시도 로직도 실행되지 않는다. 독립적으로 실행되는 `Production SLO smoke` 완료 이벤트를 두 번째 기동 신호로 사용하고, 08:01~10:30 KST에만 digest를 시도하도록 제한했다. 09:17 전에는 신규 import를 요구하고 이후에는 코딩 문제만으로도 최종 시도한다. D1의 `daily:YYYY-MM-DD` claim이 중복 Slack 전송을 막는다.

### Handoff 잔여 이슈

완료 처리 단계가 선택된 최신 포인터만 닫고 더 낮은 재시도 포인터는 남겼다. READY bundle이 성공한 뒤 같은 날짜·artifact kind의 이전 attempt도 `supersededIssueNumbers`로 함께 종료하도록 변경했다.

## 수치 검증

| 항목                  | 변경 전                              | 검증·변경 후                               |
| --------------------- | ------------------------------------ | ------------------------------------------ |
| 운영 D1               | jobs 166, problems 427, learning 102 | 동일, 데이터 삭제 없음                     |
| 오늘자 digest preview | 예약 run 없음                        | 4 challenges, 18 jobs, 12 blocks           |
| 실제 Slack            | 미전송                               | 메시지 1개 전송 완료                       |
| 직접 경로             | 307 → `/`                            | Worker 회귀 테스트에서 200 + 원 경로 앱 셸 |
| 집중 테스트           | 결함 미포착                          | 92 passed                                  |
| 잔여 handoff          | Issue #85 open                       | 근거 댓글 후 completed                     |

## 재현과 회귀 방지

- Worker 테스트는 `/jobs`, `/coding`, `/learning`의 HTML 요청이 원 경로에서 앱 셸을 받는지 검사한다.
- Production SLO는 응답의 `redirected`, 최종 pathname, React mount node를 함께 검사한다.
- Slack 단위 테스트는 SLO 완료 watchdog의 KST window와 09:17 freshness 전환을 검사한다.
- Handoff 테스트는 최신 retry가 선택되면 이전 포인터가 superseded로 분류되는지 검사한다.

## 안전성

- Slack 실제 전송 전에 claim을 만들지 않는 dry-run으로 오늘자 D1 payload를 검증했다.
- 실제 전송은 D1 claim을 거쳐 한 번만 수행했다.
- jobs 및 saved_jobs 삭제·수정은 수행하지 않았다.
- 운영 전용 중복 억제 코드는 GitHub 기준 소스에 포함해 다음 배포에서 유실되지 않게 했다.
