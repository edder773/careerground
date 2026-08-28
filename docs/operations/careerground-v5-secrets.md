# CareerGround v5 Secret 계약

실제 값은 코드, 문서, fixture, artifact, 로그에 기록하지 않는다.

| 이름                         | 용도                              | 최소 권한                        |
| ---------------------------- | --------------------------------- | -------------------------------- |
| `CAREERGROUND_PUBLISH_TOKEN` | 승인된 내부 D1 게시 endpoint 인증 | v5 stage/publish endpoint 호출만 |
| `CAREERGROUND_DIGEST_TOKEN`  | PUBLISHED digest 조회·claim       | digest claim/complete만          |
| `SLACK_WEBHOOK_URL`          | 최종 운영 Slack 전송              | 지정 채널 Incoming Webhook만     |
| `HOLIDAY_API_SERVICE_KEY`    | 공식 공휴일 cache 갱신(연결 시)   | 공휴일 조회 API read-only        |

GitHub environment `careerground-production`에 reviewer를 두고 PUBLISH job만 접근하게 한다. DRY_RUN과 PR에는 위 값을 전달하지 않는다. 외부 파티션 수집기가 별도 credential을 요구하면 partition별 read-only Secret을 분리하고 공통 artifact에 노출하지 않는다.
