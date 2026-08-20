# Slack 일일 요약 운영

CareerGround는 GitHub Actions에서 매일 오전 7시(Asia/Seoul)에 운영 Sites API를 조회하고 Slack Incoming Webhook으로 요약을 전송한다. 실행 장비가 GitHub이므로 개인 Mac이 꺼져 있어도 동작한다.

## 전송 내용

- 오늘의 코딩 테스트 3개와 각 프로그래머스 원문 링크
- 해당 KST 날짜에 CareerGround에 처음 등록된, 마감일이 명확한 신입 채용공고 전체
- 상시채용, 마감 공고, 경력직 전용 공고는 제외
- 신규 공고가 0개면 채용 섹션 자체를 생략
- Slack 한 메시지 제한에 여유를 두고 3,800자 단위로 분할하되 공고를 누락하지 않음

신규 여부는 수집 시각이 아니라 `created_at`을 사용한다. 기존 공고를 다시 수집해 `collected_at`이 갱신되더라도 신규 알림으로 재전송하지 않기 위해서다.

## 비밀값

원문은 코드, 로그, PR, 문서에 남기지 않는다.

| 위치                  | 이름                        | 용도                              |
| --------------------- | --------------------------- | --------------------------------- |
| Sites 운영 환경       | `DIGEST_API_TOKEN`          | 내부 요약 API Bearer 인증         |
| GitHub Actions secret | `CAREERGROUND_DIGEST_TOKEN` | 위 토큰과 같은 값                 |
| GitHub Actions secret | `SLACK_WEBHOOK_URL`         | `채용공고알리미` Incoming Webhook |

Webhook URL이 화면·로그 등에 노출되면 Slack 앱의 Incoming Webhooks에서 즉시 삭제하고 새 URL을 만든 뒤 GitHub secret만 교체한다. API token 노출 시에는 새 난수값을 Sites와 GitHub 양쪽에 원자적으로 교체한다.

## 수동 실행과 확인

GitHub 저장소의 **Actions → Daily CareerGround Slack digest → Run workflow**로 즉시 실행할 수 있다. 성공 조건은 다음과 같다.

1. workflow의 `Send daily digest` 단계가 성공한다.
2. `#테스트채널`에 발신자 `채용공고알리미`로 메시지가 도착한다.
3. 코딩 문제 링크는 프로그래머스 원문으로, 채용 링크는 각 채용 원문으로 이동한다.

실패 시 Actions 로그의 HTTP 상태와 오류 코드만 확인한다. secret 원문을 출력하는 진단 코드는 추가하지 않는다.

| 증상                              | 확인할 항목                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `DIGEST_AUTH_NOT_CONFIGURED`(503) | Sites에 `DIGEST_API_TOKEN`이 설정됐는지 확인                    |
| `DIGEST_UNAUTHORIZED`(401)        | Sites token과 GitHub `CAREERGROUND_DIGEST_TOKEN`이 같은지 확인  |
| Slack 4xx                         | webhook 폐기·채널 권한·GitHub `SLACK_WEBHOOK_URL`을 확인        |
| 채용 섹션 없음                    | 정상일 수 있음. 당일 신규 비상시 공고가 없으면 코딩 문제만 전송 |

구현은 [daily-slack-digest.yml](../../.github/workflows/daily-slack-digest.yml), [send-daily-digest.mjs](../../scripts/slack/send-daily-digest.mjs), Sites의 `/api/v1/internal/slack-digest`에 있다.
