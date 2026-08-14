# 운영 서비스 수준 목표

CareerGround 운영 기준은 Sites Worker + D1 단일 경로다. GitHub Actions의
`Production SLO smoke`가 6시간마다 공개 readiness endpoint를 확인하며, 실패하면 저장소의
Actions 알림 채널로 전달된다.

| 신호                | 목표                      | 자동 게이트                          |
| ------------------- | ------------------------- | ------------------------------------ |
| readiness 가용성    | 예약 점검 100% 성공       | HTTP 200, `status=ok`, `database=d1` |
| 외부 readiness 응답 | 2.5초 이하                | `curl time_total`                    |
| 합성 API p95        | endpoint별 150~250ms 이하 | `pnpm performance:budget`            |
| cursor 응답 크기    | 40~80KB 이하              | `pnpm performance:budget`            |

운영 Worker는 모든 API 응답에 `x-request-id`, `server-timing`, `x-response-time-ms`를 넣고
구조화된 완료/실패 로그를 남긴다. 배포 후 smoke 실패는 완료로 간주하지 않으며, 요청 ID와
배포 SHA를 기준으로 Sites 로그를 대조한다. 합성 성능 수치는 운영 네트워크 지연으로
해석하지 않는다.
