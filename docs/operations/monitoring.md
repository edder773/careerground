# 운영 감시와 사고 이슈

CareerGround 운영 감시는 비밀값이나 개인정보를 외부 관측 도구로 복제하지 않고 GitHub Actions의
구조화 artifact와 단일 incident 이슈를 사용한다. 같은 장애의 이슈를 계속 만들지 않으며 정상화된
첫 실행이 기존 이슈를 닫는다.

| 자동화                      | 주기                        | 실패 이슈                                  | 보존 |
| --------------------------- | --------------------------- | ------------------------------------------ | ---- |
| Production SLO smoke        | 매시간 17분                 | `[운영 경보] Production SLO smoke 실패`    | 30일 |
| Daily Slack digest          | 평일 08:01 KST, 공휴일 제외 | `[운영 경보] Daily Slack digest 전송 실패` | 로그 |
| Daily digest schedule lag   | 예약 digest 실행마다        | `[운영 경보] Daily Slack digest 예약 지연` | 30일 |
| D1-compatible restore drill | 월요일 04:41 KST            | `[운영 경보] D1 복구 훈련 실패`            | 30일 |

## 신호별 대응

- SLO 실패: readiness의 HTTP·schema·catalog canary·latency와 Google 인증 구성/JWKS 결과를 먼저
  확인하고 같은 실행의 request ID를 Sites Worker log와 대조한다.
- 예약 지연: Slack 전송 성공 여부와 분리한다. digest가 전송되었으면 queue 지연 incident만 유지한다.
- digest 실패: D1 delivery 원장의 `FAILED`, `UNCERTAIN`, `SENT` 상태를 먼저 확인해 중복 전송을
  피한다.
- 복구 훈련 실패: 운영 DB를 덮어쓰지 않는다. migration, FK violation, count mismatch를 격리
  환경에서 재현한 뒤 forward fix를 만든다.

실제 Google 계정 로그인과 운영 D1 export/restore는 현재 자동 감시 범위가 아니다. 전자는 통제된
테스트 계정이 없고, 후자는 Sites 관리 API가 export/restore 작업을 노출하지 않기 때문이다. 이 두
항목은 자동 점검 성공만으로 완료라고 표시하지 않는다.
