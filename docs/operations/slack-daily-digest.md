# Slack 일일 요약 운영

CareerGround는 GitHub Actions에서 평일 오전 8시 1분(Asia/Seoul, 대한민국 공휴일 제외)을 목표로 운영 Sites API를 조회하고 Slack Incoming Webhook으로 요약을 전송한다. 08:11부터 08:51까지 10분 간격 fallback과 09:17 최종 시도, Production SLO 완료, v5 게시 완료 이벤트가 같은 D1 claim을 재확인한다. 실행 장비가 GitHub이므로 개인 Mac이 꺼져 있어도 동작한다.

GitHub Actions 예약 실행은 정확한 시각을 보장하지 않고 높은 부하에서는 지연되거나 누락될 수
있다. 단일 예약 실패가 하루 알림 누락으로 이어지지 않도록 08:31과 09:17에도 독립 fallback을
등록한다. 세 실행은 모두 D1의 같은 `daily:YYYY-MM-DD` 발송 키를 claim하므로 먼저 성공한 한 번만
Slack을 호출한다.

예약 workflow run 자체가 누락되는 경우를 대비해 독립적으로 실행되는 `Production SLO smoke`의
성공 완료 이벤트도 watchdog 입력으로 사용한다. watchdog은 08:01~10:30 KST에만 동작한다. 09:17
전에는 신규 jobs import를 요구하고, 이후에는 정기 workflow의 최종 fallback과 마찬가지로 준비
gate 없이 시도한다. 모든 경로가 같은 D1 발송 키를 사용하므로 실제 Slack 전송은 하루 한 번이다.

- 08:01~08:51 fallback: 직전 성공한 일일 Slack 알림 이후 `jobs` 또는 v5 `jobs-v5` import가 새로
  `COMMITTED`됐는지 먼저 확인한다. 전날 저녁 수집 결과도 정상적인 신규 import로 인정한다. 준비되지
  않았으면 발송 키를 만들지 않고 다음 fallback에 맡긴다.
- 09:17: 그날 수집 결과가 0건이거나 외부 수집이 계속 지연돼도 코딩 문제 알림을 잃지 않도록
  준비 상태 gate 없이 최종 시도한다. 늦게 반영된 공고는 다음 일일 window에 포함된다.

실제로 메시지를 보냈거나 DB 준비 전 상태를 감지한 예약만 시작 시각을 08:01과 비교한다. 15분을
초과하면 `[운영 경보] Daily Slack digest 예약 지연` 이슈를 하나만 열거나 갱신한다. 당일 import가
준비되지 않으면 `[운영 경보] 채용 DB 갱신 지연`을 열고, 후속 실행의 `sent` 또는 `already-sent`
상태가 이를 닫는다. 측정 JSON은 `daily-schedule-delay-<run id>` artifact로 30일간 보관한다.

## 전송 내용

- 오늘의 코딩 테스트 4개(Lv.1·Lv.2 알고리즘, 도전 Lv.3 알고리즘, SQL Lv.3~4)와 각 프로그래머스 원문 링크
- 직전 성공한 일일 알림 이후 CareerGround에 처음 등록된, 마감일이 명확한 신입 채용공고 전체
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

Slack을 보내지 않는 운영 점검은 `force=true`, `dry_run=true`, 빈 snapshot으로 실행한다. dry-run은
운영 `DIGEST_API_TOKEN`으로 직전 발송 이후의 최신 import를 확인하고 실제 D1 payload를 읽어 Slack
메시지 블록까지 생성·검증한다. 응답 상태는 `dry-run-passed`이며, `slack_digest_deliveries` claim을
생성하지 않고 `SLACK_WEBHOOK_URL`을 호출하지 않는다.

1. workflow의 `Send CareerGround digest` 단계가 성공한다.
2. `#테스트채널`에 발신자 `채용공고알리미`로 메시지가 도착한다.
3. 코딩 문제 링크는 프로그래머스 원문으로, 채용 링크는 각 채용 원문으로 이동한다.

실패 시 Actions 로그의 HTTP 상태와 오류 코드만 확인한다. secret 원문을 출력하는 진단 코드는 추가하지 않는다.
전송 실패는 `[운영 경보] Daily Slack digest 전송 실패` 이슈로 누적되고 다음 성공 시 자동으로
닫힌다. 수동 실행도 전송 실패 감시 대상이지만 예약 지연 계산에서는 제외한다.

발송 전에 Sites API가 `daily:YYYY-MM-DD` 또는 `snapshot:<createdAt>:jobs` 키를 D1에 원자적으로 claim한다. 이미 `SENT`이면 import 최신성보다 먼저 `already-sent`를 반환한다. 성공 완료 시 공고별 회사·캠페인·직무 키를 `slack_digest_items`에 기록하고, 이후 다른 source URL로 수집된 같은 캠페인·직무를 억제한다. Slack이 명시적으로 거부한 경우만 `FAILED`로 기록해 재시도를 허용한다. 네트워크 timeout처럼 Slack 수신 여부를 알 수 없는 경우는 `UNCERTAIN`으로 기록하고 자동 재전송을 막는다.

| 증상                              | 확인할 항목                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `DIGEST_AUTH_NOT_CONFIGURED`(503) | Sites에 `DIGEST_API_TOKEN`이 설정됐는지 확인                                   |
| `DIGEST_UNAUTHORIZED`(401)        | Sites token과 GitHub `CAREERGROUND_DIGEST_TOKEN`이 같은지 확인                 |
| Slack 4xx                         | webhook 폐기·채널 권한·GitHub `SLACK_WEBHOOK_URL`을 확인                       |
| 채용 섹션 없음                    | 정상일 수 있음. 당일 신규 비상시 공고가 없으면 코딩 문제만 전송                |
| `delivery-blocked`                | 이전 실행이 `CLAIMED` 또는 `UNCERTAIN`인지 운영 원장을 확인                    |
| `already-sent`                    | 같은 기준일·스냅샷이 이미 전송된 정상적인 중복 차단                            |
| `job-import-not-ready`            | 직전 성공 알림 이후 채용 import 미완료. 발송 키 없이 다음 fallback이 재확인    |
| 예약 실행 15분 초과               | schedule delay artifact와 GitHub Actions queue 상태를 확인                     |
| 예약 run 자체가 없음              | `Production SLO smoke` 완료 watchdog run과 D1의 `daily:YYYY-MM-DD` 상태를 확인 |

구현은 [daily-slack-digest.yml](../../.github/workflows/daily-slack-digest.yml), [send-daily-digest.mjs](../../scripts/slack/send-daily-digest.mjs), Sites의 `/api/v1/internal/slack-digest/claim`, `/complete`, `/fail`에 있다.
