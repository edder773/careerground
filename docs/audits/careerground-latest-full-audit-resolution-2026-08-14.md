# CareerGround 최신 전수 감사 조치 결과 — 2026-08-14

## 범위

- 감사 원문: `careerground_latest_full_audit_2026-08-14.md`
- 감사 기준 commit: `764e9873d8856e2dcecbb6723130c853e4353470`
- 감사 항목: P0 8, P1 81, P2 143, 총 232개
- 운영 기준: Sites Worker + D1

상태는 `구현`, `부분 완화`, `제품 결정`, `외부 검증`, `구조적 후속`으로 구분한다. 자동 테스트가
통과했다는 이유만으로 외부 운영 능력이나 실기기 결과를 `구현`으로 바꾸지 않는다.

## P0 처리

| ID        | 상태      | 조치와 남은 경계                                                                                                                                      |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPS-001   | 외부 검증 | 로컬 격리 snapshot/restore, checksum/FK/integrity drill과 runbook은 구현. Sites가 운영 D1 export/restore를 제공하지 않아 운영 RTO/RPO는 미검증.       |
| OPS-002   | 구현      | schema version/column/index/trigger/FTS readiness와 배포 후 canary를 추가.                                                                            |
| OPS-003   | 구현      | `migration-authority.ts`가 archive 목록과 최신 version/checksum의 단일 권위다. build·stage·runtime이 같은 목록을 사용하고 누락·미등록 SQL을 거부한다. |
| CODE-001  | 구현      | `userId + v2 + problemId` 초안 namespace, 계정 전환 격리 테스트.                                                                                      |
| LEARN-001 | 구현      | question type/choices migration, import, API와 객관식 UI/채점 연결.                                                                                   |
| NOTE-001  | 구현      | user/note/baseRevision 초안과 409 conflict diff/retry.                                                                                                |
| ADMIN-001 | 구현      | 전체 preview pagination, JSON diff download, reviewed row count와 전체 검토 확인.                                                                     |
| ADMIN-002 | 부분 완화 | 제거 전체 목록, 별도 확인, 건수 대조, 서버 임계치 차단. 조직의 독립된 2인 승인 주체는 Sites 권한 모델에 없어 동일 관리자 이중 확인으로 구현.          |

## P1 코드 조치

아래 항목은 해당 위험을 제거하거나 사용자 흐름까지 연결했다.

- 운영/인증: `OPS-005`, `OPS-006`, `OPS-010`, `OPS-012`, `OPS-013`, `AUTH-002`,
  `AUTH-003`, `AUTH-008`
- 셸/API: `SHELL-001`, `SHELL-003`, `SHELL-004`, `SHELL-014`, `API-001`, `API-003`
- 홈/채용: `HOME-003`, `HOME-004`, `HOME-007`, `HOME-010`, `HOME-011`, `JOB-002`,
  `JOB-009`, `JOB-011`
- 코딩/학습/노트: `CODE-002`, `CODE-003`, `CODE-005`, `CODE-006`, `CODE-008`,
  `LEARN-003`, `LEARN-004`, `LEARN-016`, `NOTE-002`, `NOTE-003`, `NOTE-007`
- 풀이/알림: `SOL-001`, `SOL-002`, `SOL-004`, `SOL-005`, `SOL-007`, `SOL-008`,
  `SOL-009`, `SOL-012`, `NOTIF-001`, `NOTIF-003`, `NOTIF-004`, `NOTIF-006`, `NOTIF-010`
- 랭킹/관리자/DB: `SET-002`, `ADMIN-003`, `ADMIN-004`, `ADMIN-011`, `ADMIN-013`,
  `ADMIN-017`, `ADMIN-018`, `ADMIN-019`, `DB-001`, `DB-015`, `PERF-005`, `QA-008`

`API-001`은 주요 GET과 이번에 변경한 mutation 계약을 구체 schema로 검사한다. 아직 모든 legacy
mutation을 개별 Zod schema로 바꾼 것은 아니므로 장기적으로 generated Worker contract로 통합해야 한다.

## P2 코드 조치

감사에서 제시한 세부 위험 중 이번 변경과 직접 연결된 다음 항목도 회귀 테스트와 함께 처리했다.

- 셸: `SHELL-002`, `SHELL-006`, `SHELL-007`, `SHELL-008`, `SHELL-009`, `SHELL-016`
- API/홈: `API-003`, `API-004`의 import timeout, `HOME-005`, `HOME-009`, `HOME-012`,
  `HOME-018`
- 채용/코딩: `JOB-010`, `JOB-012`, `CODE-007`, `CODE-009`, `CODE-016`
- 학습/노트: `LEARN-010`, `LEARN-013`, `NOTE-004`, `NOTE-005`, `NOTE-006`,
  `NOTE-010`, `NOTE-011`, `NOTE-014`
- 풀이/알림: `SOL-006`, `SOL-010`, `SOL-011`, `SOL-017`, `SOL-018`, `NOTIF-005`,
  `NOTIF-008`, `NOTIF-009`
- 랭킹/관리자/DB/QA: `SET-006`, `SET-007`, `ADMIN-012`, `DB-007`, `QA-003`

## 명시적 제품 결정

다음은 누락 기능이 아니라 사용자의 최신 요구가 감사의 일반 권고보다 우선하는 항목이다.

| 감사 ID                     | 결정                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-006, CODE-014, SOL-019 | 풀이 기록은 저장 시점부터 인증된 멤버에게 보인다. 별도 비공개/공유 opt-in을 두지 않고 온보딩·저장 화면에서 범위를 고지한다.           |
| SET-001                     | 코딩 랭킹은 저장된 SOLVED 기록으로 자동 반영하며 거부권을 두지 않는다.                                                                |
| LEARN-002                   | 사용자가 제거를 요청한 이해도 1~5 UI는 복원하지 않는다. 완료와 복습 예정 흐름만 제공한다.                                             |
| SET-011, SET-013            | 데이터 삭제 요청과 export UI는 사용자의 명시적 요구에 따라 제공하지 않는다. 계정/데이터 정책이 바뀌면 별도 법무·제품 검토가 필요하다. |

랭킹은 실행 검증 점수가 아니라는 점을 숨기지 않도록 `selfReported: true`, 사용자·문제별 1회,
삭제 풀이/관리자 제외 산식을 UI와 API에 표시한다.

## 부분 완화 또는 구조적 후속

아래는 이번 배포의 핵심 기능을 막지는 않지만 감사의 완료 조건 전체를 충족했다고 주장하지 않는다.

- `OPS-004`: 요청 경로의 runtime DDL과 데이터 정리를 제거했다. 요청은 migration 원장과 schema를
  읽기 전용으로 검사하며 불일치하면 503으로 닫힌다.
- `OPS-007`, `OPS-008`, `OPS-009`, `API-002`: Worker/D1을 canonical로 유지한다. D1 API의 인증,
  일일 문제·Slack, import와 공통 계약을 독립 모듈로 분리해 메인 라우터를 177,482B에서
  126,401B로 줄였고 운영 Worker가 Nest/Prisma reference를 import하지 않는 구조 테스트를 추가했다.
  Nest/Prisma source 자체 제거와 대형 page/CSS 추가 분할은 별도 구조 변경이다.
- `OPS-014`, `OPS-015`: 운영 synthetic이 cold-start와 warm p95, schema/canary, 인증·보안 경계를
  구조화 JSON으로 보관한다. 실패 incident는 중복 없이 갱신되고 복구 시 닫힌다. 브라우저 RUM과
  외부 paging 연동은 아직 없다.
- `PERF-007`: 운영 웹의 개별 JS/CSS gzip과 초기 route gzip 예산을 build 뒤 CI gate로 적용했다.
- `PERF-003`, `PERF-004`, `PERF-008`: API 합성 budget은 유지하지만 materialized ranking과
  브라우저 long-task 수집은 별도 후속이다.
- `AUTH-004`, `AUTH-005`: 가입 상한은 원자화했지만 운영 필수 env fail-closed와 IdP 이름의
  사용자 수정 여부 추적 column은 별도 schema 정책이 필요하다.
- `NOTIF-011`, `NOTIF-012`, `DB-013`: unread GET의 write는 제거했지만 인증 rate-limit hot table과
  cron 기반 정리는 분산 edge rate limiter가 제공될 때 교체해야 한다.
- `ADMIN-005`, `ADMIN-006`, `ADMIN-007`, `ADMIN-008`, `ADMIN-014`, `ADMIN-015`,
  `ADMIN-016`, `ADMIN-020`: 전체 preview 안전장치는 구현했지만 rollback UI, field diff,
  audit/import batch 상세 pagination과 동시 preview 분리는 후속 관리자 도구다.
- `DB-002`–`DB-006`, `DB-008`–`DB-014`: API validation, 정규화 보조 table, audit와
  integrity drill로 완화했으나 legacy table rebuild가 필요한 모든 CHECK/복합 FK/보관 정책을 이번
  순방향 additive migration에 묶지 않았다.
- `HOME-013`, `HOME-015`, `HOME-016`, `HOME-017`, `HOME-019`, `JOB-013`, `NOTE-008`,
  `NOTE-009`, `NOTE-013`, `SOL-015`, `SOL-016`: 현재 MVP 데이터 규모에서는 bounded하지만
  virtualization, 영구 삭제 정책, list payload 축소와 server-side filter가 필요한 확장성 항목이다.
- `QA-012`: API/Worker 응답의 CSP, referrer, permissions, frame, nosniff 정책과 자동 검사는 구현했다.
  다만 Sites 정적 asset cache가 Worker를 우회하는 HTML 응답에는 header가 붙지 않아 CSP/referrer를
  HTML meta fallback으로도 적용했다. `X-Frame-Options`와 `Permissions-Policy` 같은 header-only 정책을
  정적 응답에 강제하는 기능은 현재 Sites 설정 surface에 없다. 운영 SLO 검사는 이 전달 경계를
  구분해 정적 meta와 API header를 각각 검증한다.

## 현재 환경에서 실행할 수 없는 검증

| ID               | 이유                                                                          | 대체 증거                                                                         |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| OPS-001          | Sites connector에 운영 D1 export/restore operation 없음                       | `pnpm recovery:drill`, checksum/FK/integrity, `docs/operations/backup-restore.md` |
| OPS-011          | Sites connector에 cron registration/last-run API 없음                         | Worker `scheduled()`, lease/dedupe와 producer 회귀 테스트                         |
| AUTH-001, QA-009 | 테스트 계정의 실제 Google handshake/운영 authenticated synthetic session 없음 | auth boundary 401, mock session E2E, 운영 공개 화면 canary                        |
| QA-001, QA-002   | NVDA/VoiceOver/TalkBack 및 실기기 한글 IME 장비 없음                          | axe, keyboard, 200% reflow, Chromium/Firefox/WebKit, 320/375 px tests             |

## 릴리스 판정

코드로 재현 가능한 P0 데이터 격리·학습 유실·초안 충돌·import 승인 위험은 수정했다. 운영 D1
실데이터 복구와 Sites cron은 플랫폼 기능이 없어 release 완료로 허위 표기하지 않는다. 전체 자동
검증, exact-SHA 배포, 공개 URL HTTP canary와 Worker log 확인 결과를 PR 본문 및 이 문서에 최종 기록한다.
