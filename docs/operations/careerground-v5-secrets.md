# CareerGround v5 Secret 계약

실제 값은 코드, 문서, fixture, artifact, 로그에 기록하지 않는다.

| 이름                         | 용도                              | 최소 권한                        |
| ---------------------------- | --------------------------------- | -------------------------------- |
| `CAREERGROUND_PUBLISH_TOKEN` | 승인된 내부 D1 게시 endpoint 인증 | v5 stage/publish endpoint 호출만 |
| `CAREERGROUND_DIGEST_TOKEN`  | PUBLISHED digest 조회·claim       | digest claim/complete만          |
| `SLACK_WEBHOOK_URL`          | 최종 운영 Slack 전송              | 지정 채널 Incoming Webhook만     |
| `HOLIDAY_API_SERVICE_KEY`    | 공식 공휴일 cache 갱신(연결 시)   | 공휴일 조회 API read-only        |

`CAREERGROUND_PUBLISH_TOKEN`은 Sites 운영 환경의 `PUBLISH_API_TOKEN`과 GitHub Actions repository secret에 같은 난수값으로 저장한다. Issue 이벤트의 신뢰된 OWNER/MEMBER/COLLABORATOR 포인터가 schema 2.0 검증을 모두 통과한 publish 단계에서만 사용하며 PR에는 전달하지 않는다. 값은 요청 body, artifact, stdout에 포함하지 않는다.

`CAREERGROUND_DIGEST_TOKEN`은 Sites의 `DIGEST_API_TOKEN`과 짝을 이룬다. publish token과 digest token은 서로 재사용하지 않는다. 외부 파티션 수집기가 별도 credential을 요구하면 partition별 read-only Secret을 분리하고 공통 artifact에 노출하지 않는다.
