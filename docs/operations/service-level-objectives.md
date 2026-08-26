# 운영 서비스 수준 목표

CareerGround 운영 기준은 Sites Worker + D1 단일 경로다. GitHub Actions의
`Production SLO smoke`가 6시간마다 운영 경계를 확인한다. 실패하면 같은 제목의 열린 GitHub
incident를 새로 만들거나 갱신하고, 정상화된 첫 실행이 해당 incident를 닫는다. 같은 장애로
이슈를 계속 늘리지 않는다.

| 신호                   | 목표                      | 자동 게이트                                               |
| ---------------------- | ------------------------- | --------------------------------------------------------- |
| readiness 가용성       | 예약 점검 모두 성공       | HTTP 200, schema 원장 일치, D1 catalog canary 4종 양수    |
| readiness 초기 응답    | 5초 이하                  | 첫 표본의 외부 왕복 시간                                  |
| readiness warm p95     | 2.5초 이하                | 뒤이은 4개 표본의 nearest-rank p95                        |
| 정적 보안 정책         | CSP·referrer fallback     | 배포 HTML의 `meta` 정책                                   |
| API 보안·관측 헤더     | 필수 정책·request ID 존재 | CSP, frame, permissions, nosniff, referrer, server-timing |
| 비로그인 개인 API 경계 | 항상 거부                 | `/auth/me` HTTP 401 + `UNAUTHORIZED` 계약                 |
| 합성 API p95           | endpoint별 150~250ms 이하 | `pnpm performance:budget`                                 |
| cursor 응답 크기       | 40~80KB 이하              | `pnpm performance:budget`                                 |
| 운영 웹 초기 gzip      | 180KB 이하                | `pnpm bundle:budget`                                      |
| 운영 웹 JS/CSS chunk   | JS 110KB, CSS 30KB 이하   | `pnpm bundle:budget`                                      |

Sites의 정적 asset cache는 Worker 응답 래퍼를 우회할 수 있다. 따라서 정적 HTML에는 브라우저가
지원하는 CSP와 referrer `meta`를 검사하고, header-only인 frame·permissions·nosniff 정책은 Worker가
소유하는 API 응답에서 검사한다. 정적 응답에 존재하지 않는 헤더를 요구해 정상 서비스를 장애로
판정하지 않는다.

운영 Worker는 모든 API 응답에 `x-request-id`, `server-timing`, `x-response-time-ms`를 넣고
구조화된 완료/실패 로그를 남긴다. 배포 후 smoke 실패는 완료로 간주하지 않으며, 요청 ID와
배포 SHA를 기준으로 Sites 로그를 대조한다. 매 실행의 전체 검사 결과와 latency 표본은
`production-slo-<run id>` JSON artifact로 30일간 보관한다.

로컬 또는 배포 직후 같은 검사를 재현할 때는 아래 명령을 사용한다. 이 명령은 읽기 전용이며
로그인이나 Slack webhook을 호출하지 않는다.

```bash
pnpm slo:check
```

외부 왕복 측정은 실행 runner와 edge 위치의 영향을 받는다. 첫 표본은 cold-start 경계로 분리하고,
후속 표본만 warm p95로 계산한다. 브라우저 LCP·INP·CLS와 실제 로그인 synthetic은 이 검사 범위가
아니므로 별도의 RUM 또는 통제된 테스트 계정이 마련되기 전까지 완료로 주장하지 않는다.
