# CareerGround legacy 자동화 인벤토리

## 저장소에서 확인된 항목

| 유형                 | 확인 결과                              | 근거/상태                                              |
| -------------------- | -------------------------------------- | ------------------------------------------------------ |
| PARTITION 1·2·3 예약 | 저장소에 없음                          | 외부 ChatGPT Work 구성으로 추정, `MANUAL_REQUIRED`     |
| 검증기 예약          | 저장소에 없음                          | `daily-job-refresh-automation.md`가 외부 검증기를 전제 |
| DB 갱신 예약         | 저장소에 workflow 없음                 | Library→migration→Sites 배포 절차만 문서화             |
| Slack 예약           | 존재                                   | `.github/workflows/daily-slack-digest.yml`             |
| watchdog             | digest incident, production smoke 존재 | GitHub issue 기반 경보                                 |
| Codex heartbeat      | CareerGround 항목 없음                 | 로컬 automation TOML 읽기 전용 확인                    |
| 채팅 제목/과거 제목  | 저장소에 없음                          | 제목만으로 대상 판정 금지, `MANUAL_REQUIRED`           |

## 확인 가능한 Library 계보

저장소에는 2026-08-25와 2026-08-26 validator sync 산출물이 있다. 마지막 저장소 내 final은 2026-08-26 export, 211행이며 audit의 final raw SHA-256은 `7cac83e0fdde4aea580feb118862e1851a887e99fdc793b9e22e05a5548da775`다. 운영 행은 이 문서에 복제하지 않는다. 이것이 실제 마지막 운영 성공임은 DB `PUBLISHED` ledger가 없어 판정할 수 없다.

## 동시 실행 위험

기존 Work 수집/검증/DB 갱신과 신규 GitHub v5가 동시에 PUBLISH되면 같은 날짜를 서로 다른 입력으로 처리할 수 있다. 새 workflow는 초기에는 `workflow_dispatch`와 DRY_RUN만 제공하고, legacy를 일시 중지한 뒤 별도 승인으로 schedule/PUBLISH를 활성화한다.

채팅 또는 Library에만 있는 파티션 출처 소유권, 프롬프트, 예외 목록은 저장소 이전 전까지 `MANUAL_REQUIRED`다. 기존 Scheduled Task와 채팅은 이 작업에서 중지·삭제하지 않는다.
