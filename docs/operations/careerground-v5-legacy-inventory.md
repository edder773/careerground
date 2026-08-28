# CareerGround legacy 자동화 인벤토리

## 저장소에서 확인된 항목

| 유형                 | 확인 결과                               | 근거/상태                                    |
| -------------------- | --------------------------------------- | -------------------------------------------- |
| PARTITION 1·2·3 예약 | 프롬프트·표본 확인, 공식 Task ID 미확인 | 외부 ChatGPT 예약 작업, 평일 18:00           |
| Pro 검증기           | 프롬프트·final·audit 확인               | 예약이 아닌 수동 병합·검증                   |
| Work DB 갱신         | 프롬프트 확인, 저장소 workflow 없음     | Library→migration→Sites 배포                 |
| Slack 예약           | 존재                                    | `.github/workflows/daily-slack-digest.yml`   |
| watchdog             | digest incident, production smoke 존재  | GitHub issue 기반 경보                       |
| Codex heartbeat      | CareerGround 항목 없음                  | 로컬 automation TOML 읽기 전용 확인          |
| 채팅 제목/과거 제목  | 저장소에 없음                           | 제목만으로 대상 판정 금지, `MANUAL_REQUIRED` |

## 확인 가능한 Library 계보

저장소에는 2026-08-25와 2026-08-26 validator sync 산출물이 있다. 마지막 저장소 내 final은 2026-08-26 export, 211행이며 audit의 final raw SHA-256은 `7cac83e0fdde4aea580feb118862e1851a887e99fdc793b9e22e05a5548da775`다. 운영 행은 이 문서에 복제하지 않는다. 이것이 실제 마지막 운영 성공임은 DB `PUBLISHED` ledger가 없어 판정할 수 없다.

## 동시 실행 위험

기존 Work 수집/검증/DB 갱신과 신규 GitHub v5가 동시에 PUBLISH되면 같은 날짜를 서로 다른 입력으로 처리할 수 있다. 새 workflow는 초기에는 `workflow_dispatch`와 DRY_RUN만 제공하고, legacy를 일시 중지한 뒤 별도 승인으로 schedule/PUBLISH를 활성화한다.

파티션 출처 소유권과 공통 포함·제외 정책은 `config/careerground-partition-sources.json` 및 `careerground-v4-collector-contract.md`로 이전했다. 실제 Scheduled Task ID·상태 확인과 Library에서 GitHub artifact로 전달하는 자동 연결은 `MANUAL_REQUIRED`다. 기존 Scheduled Task와 채팅은 이 작업에서 중지·삭제하지 않는다.
