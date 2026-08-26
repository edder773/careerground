# Slack 일일 요약 운영

CareerGround는 GitHub Actions에서 평일 오전 8시 1분(Asia/Seoul, 대한민국 공휴일 제외)에 운영 Sites API를 조회하고 Slack Incoming Webhook으로 요약을 전송한다. 실행 장비가 GitHub이므로 개인 Mac이 꺼져 있어도 동작한다.

GitHub Actions 예약 실행은 정확한 시각을 보장하지 않으므로 실제 시작 시각을 08:01과 비교한다.
15분을 초과하면 메시지 전송은 계속 시도하되 `[운영 경보] Daily Slack digest 예약 지연` 이슈를
하나만 열거나 갱신한다. 이후 15분 이내에 시작한 첫 예약 실행이 이슈를 자동으로 닫는다. 측정
JSON은 `daily-schedule-delay-<run id>` artifact로 30일간 보관한다.

## 전송 내용

- 오늘의 코딩 테스트 4개(Lv.1·Lv.2 알고리즘, 도전 Lv.3 알고리즘, SQL Lv.3~4)와 각 프로그래머스 원문 링크
- 해당 KST 날짜에 CareerGround에 처음 등록된, 마감일이 명확한 신입 채용공고 전체
- 상시채용, 마감 공고, 경력직 전용 공고는 제외
- 신규 공고가 0개면 채용 섹션 자체를 생략
- 최상단에 `YYYY년 M월 D일 기준 새로운 알림`을 표시
- 코딩테스트와 채용공고는 한 메시지 안에서 구분선으로 분리
- Slack 섹션 제한에 여유를 두고 긴 채용 목록만 내부 섹션으로 나누되 공고를 누락하지 않음

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
전송 실패는 `[운영 경보] Daily Slack digest 전송 실패` 이슈로 누적되고 다음 성공 시 자동으로
닫힌다. 수동 실행도 전송 실패 감시 대상이지만 예약 지연 계산에서는 제외한다.

발송 전에 Sites API가 `daily:YYYY-MM-DD` 또는 `snapshot:<createdAt>:jobs` 키를 D1에 원자적으로 claim한다. Slack이 명시적으로 거부한 경우만 `FAILED`로 기록해 재시도를 허용한다. 네트워크 timeout처럼 Slack 수신 여부를 알 수 없는 경우는 `UNCERTAIN`으로 기록하고 자동 재전송을 막는다. Slack 전송 성공 뒤 완료 API가 실패하더라도 기존 claim이 남으므로 다음 실행에서 같은 메시지를 다시 보내지 않는다.

| 증상                              | 확인할 항목                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `DIGEST_AUTH_NOT_CONFIGURED`(503) | Sites에 `DIGEST_API_TOKEN`이 설정됐는지 확인                    |
| `DIGEST_UNAUTHORIZED`(401)        | Sites token과 GitHub `CAREERGROUND_DIGEST_TOKEN`이 같은지 확인  |
| Slack 4xx                         | webhook 폐기·채널 권한·GitHub `SLACK_WEBHOOK_URL`을 확인        |
| 채용 섹션 없음                    | 정상일 수 있음. 당일 신규 비상시 공고가 없으면 코딩 문제만 전송 |
| `delivery-blocked`                | 이전 실행이 `CLAIMED` 또는 `UNCERTAIN`인지 운영 원장을 확인     |
| `already-sent`                    | 같은 기준일·스냅샷이 이미 전송된 정상적인 중복 차단             |
| 예약 실행 15분 초과               | schedule delay artifact와 GitHub Actions queue 상태를 확인      |

구현은 [daily-slack-digest.yml](../../.github/workflows/daily-slack-digest.yml), [send-daily-digest.mjs](../../scripts/slack/send-daily-digest.mjs), Sites의 `/api/v1/internal/slack-digest/claim`, `/complete`, `/fail`에 있다.
