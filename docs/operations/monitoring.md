# 운영 감시와 사고 이슈

CareerGround 운영 감시는 비밀값이나 개인정보를 외부 관측 도구로 복제하지 않고 GitHub Actions의
구조화 artifact와 단일 incident 이슈를 사용한다. 같은 장애의 이슈를 계속 만들지 않으며 정상화된
첫 실행이 기존 이슈를 닫는다.

| 자동화                      | 주기                                        | 실패 이슈                                  | 보존 |
| --------------------------- | ------------------------------------------- | ------------------------------------------ | ---- |
| Production SLO smoke        | 매시간 17분                                 | `[운영 경보] Production SLO smoke 실패`    | 30일 |
| Daily Slack digest          | 평일 08:01 목표·08:31 감시 KST, 공휴일 제외 | `[운영 경보] Daily Slack digest 전송 실패` | 로그 |
| Daily digest schedule lag   | 예약 digest 및 SLO 완료 watchdog            | `[운영 경보] Daily Slack digest 예약 지연` | 30일 |
| Jobs import readiness       | 08:01 목표 실행 및 게시·SLO 이벤트 시       | `[운영 경보] 채용 DB 갱신 지연`            | 로그 |
| D1-compatible restore drill | 월요일 04:41 KST                            | `[운영 경보] D1 복구 훈련 실패`            | 30일 |

## 신호별 대응

- SLO 실패: readiness의 HTTP·schema·채용·코딩 catalog canary·latency를 먼저 확인하고 같은 실행의
  request ID를 Sites Worker log와 대조한다.
- 예약 지연: Slack 전송 성공 여부와 분리한다. digest가 전송되었으면 queue 지연 incident만 유지한다.
- 채용 갱신 지연: 직전 성공한 일일 Slack 알림 이후 `jobs`/`jobs-v5` `COMMITTED` import가 있는지 확인한다. 08:01 목표 실행은
  준비 전이면 delivery를 claim하지 않으며 08:31 감시 실행이 코딩 문제를 포함한 최종 복구를 담당한다.
- digest 실패: D1 delivery 원장의 `FAILED`, `UNCERTAIN`, `SENT` 상태를 먼저 확인해 중복 전송을
  피한다.
- 복구 훈련 실패: 운영 DB를 덮어쓰지 않는다. migration, FK violation, count mismatch를 격리
  환경에서 재현한 뒤 forward fix를 만든다.

운영 D1 export/restore는 Sites 관리 API가 해당 작업을 노출하지 않아 현재 자동 감시 범위가 아니다.
자동 점검 성공만으로 백업 복구까지 완료됐다고 표시하지 않는다.

GitHub Actions workflow 안의 검사는 생성된 run에서만 실행된다. provider가 예약 event 자체를
누락하면 같은 workflow가 그 부재를 직접 보고할 수 없으므로, 선점 예약·감시 예약·독립 SLO·게시
완료 이벤트와 D1 발송 멱등성을 결합해 단일 예약 의존도를 낮춘다.
