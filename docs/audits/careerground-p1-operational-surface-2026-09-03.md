# CareerGround P1 운영 경로 경량화 결과

## 범위

P0에서 사용자 화면과 번들을 줄인 뒤, P1은 운영 중인 채용 schema 2.0 handoff와 필수 검증만
남겼다. 운영 D1 schema와 데이터, Slack 전송 설정, 공개 화면은 변경하지 않았다.

- 제거: v4 final/audit·File Library import·SQL 생성기와 pre-cutover fixture workflow
- 제거: 더 이상 참조되지 않는 v5 prototype CLI·manifest·baseline pipeline과 schema fixture
- 제거: migration에 이미 반영된 원본 import JSON 61개
- 단일화: GitHub handoff는 schema 2.0의 `PARTITION_1`~`PARTITION_3`만 수신
- 통합: PR의 정적 검증과 Playwright를 `CI / validate` 한 경로에서 수행
- 제거: 동일 PR에서 다시 lint/typecheck/test/build/e2e를 실행하던 증거 workflow

## 운영 전환 확인

GitHub Actions와 handoff Issue를 읽어 2026-08-28 이후 운영 인입이 schema 2.0을 사용하고 있음을
확인했다. 최신 2026-09-02 A2의 세 Issue도 `schemaVersion=2.0`이고, 세 파티션이 모인 실행은
운영 publish까지 성공했다. 이 확인 뒤에만 schema 1.0 수신과 변환기를 제거했다.

## 동일 기준 전후 수치

| 항목                          |    수정 전 |   수정 후 |          변화 |
| ----------------------------- | ---------: | --------: | ------------: |
| tracked 파일                  |        516 |       409 | -107 (-20.7%) |
| tracked 바이트                | 13,161,985 | 9,732,633 |  -3,429,352 B |
| 원본 import JSON              |         61 |         0 |         -100% |
| 원본 import JSON 바이트       |  3,155,078 |         0 |         -100% |
| root `jobs:*` 명령            |         16 |         3 |        -81.3% |
| GitHub Actions workflow       |         11 |         8 |        -27.3% |
| PR당 `pnpm install`           |          4 |         2 |        -50.0% |
| PR당 전체 E2E 실행            |          2 |         1 |        -50.0% |
| CI의 Sites production build   |          2 |         1 |        -50.0% |
| `scripts`+workflow 소스 줄 수 |     12,083 |     6,363 |        -47.3% |

tracked 전체 바이트 차이에는 새 회귀 테스트와 이 문서가 포함되므로, 삭제된 파일의 원본 바이트
합계 3,417,060 B와는 다르다. 과거 troubleshooting의 정량 근거는 문서와 Git 이력으로 재현하고,
운영 경로가 더 이상 원본 JSON을 직접 참조하지 않도록 했다.

## 회귀 방지

- handoff parser가 schema 1.0과 `LEGACY_FINAL`을 명시적으로 거부한다.
- workflow 계약이 v4 변환, legacy artifact, Slack secret의 재유입을 막는다.
- repository surface 테스트가 삭제한 generator·prototype workflow의 복원을 실패 처리한다.
- CI topology 테스트가 별도 E2E·증거 workflow와 중복 Sites build의 재유입을 막는다.
- D1 discovery 테스트가 staging batch 실패 시 jobs·run·publication이 모두 원복되는지 확인한다.

전체 lint, format, typecheck, unit/integration, recovery drill, production build, bundle budget,
다중 브라우저 E2E와 운영 SLO 결과는 이 변경의 PR 본문에 기록한다.
