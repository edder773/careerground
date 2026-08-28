# CareerGround 채용 자동화 v5 전환 전 상태

기준 커밋은 `4810dd9bbc9c43facc346451486552459bf6fc2a`다. 이 문서는 운영 데이터를 복제하지 않고 저장소의 코드·워크플로·문서에서 확인한 사실만 기록한다.

## 현재 아키텍처와 데이터 흐름

1. 저장소 밖의 ChatGPT Work/Library 과정이 세 파티션을 수집·병합·검증한다. 실제 웹 수집기와 파티션 프롬프트는 저장소에 없다.
2. `docs/operations/daily-job-refresh-automation.md`는 정확한 날짜별 `final.json`과 `merge-audit.json`을 Library에서 고르는 절차를 운영 규칙으로 정의한다. 선택은 파일명, 날짜, `modified_at`에 의존한다.
3. `scripts/generate-validator-job-sync-migration.mjs`가 전체 기준선, final, merge-audit을 검증하고 허용된 INSERT/UPDATE와 `import_batches`, `app_schema_migrations` 기록을 담은 forward-only SQL을 생성한다.
4. 생성된 migration은 Sites/D1 배포 경로에서 적용된다. 운영 DB 직접 변경은 이 전환 작업의 범위에서 수행하지 않는다.
5. `.github/workflows/daily-slack-digest.yml`이 평일 08:01, 08:31, 09:17(Asia/Seoul)에 배포 API를 호출한다. `scripts/slack/send-daily-digest.mjs`가 응답을 Slack Webhook으로 전송한다.
6. 공휴일은 `scripts/slack/korean-business-day.mjs`의 2026 고정 목록으로 판정한다.

## 의존 지점

- 채팅: 저장소 코드가 채팅 제목을 직접 참조하지는 않지만, 운영 문서가 외부 `채용 공고 검증기`와 Library 작업을 전제로 한다.
- Library: 최종 입력과 감사 입력이 Library에만 있을 수 있다. stable file id를 migration 보고서에 전달하지만 검색·선택은 외부 실행 절차다.
- 파일명: `careerground-jobs-live-YYYY-MM-DD-final.json`과 같은 날짜의 audit가 필수다. 다운로드 접미사는 거부할 뿐 의미와 콘텐츠를 분리하는 Manifest가 없다.
- 날짜: 기존 생성기는 파일명 날짜와 `exportedAt`을 결합한다. 실패 날짜 재개를 나타내는 별도 실행 식별자가 없다.

## DB 변경 지점

- `jobs`: 감사로 확인한 제한 필드 UPDATE와 신규 ACTIVE INSERT만 허용한다.
- `import_batches`, `app_schema_migrations`: 적용 이력과 checksum을 기록한다.
- `saved_jobs`: 참조도 변경도 금지한다. 기존 생성기는 생성 SQL에 `saved_jobs` 또는 `DELETE FROM jobs`가 포함되면 실패한다.
- 현재는 `workflow_runs`, 파티션 staging, publish pointer, idempotency ledger가 없다.

## Slack 데이터 소스와 실패 경로

Slack은 배포 API가 고른 당일 import snapshot을 사용한다. v5 실행의 `PUBLISHED` 상태가 아니라 import 준비 시각과 delivery claim을 기준으로 하므로 미완료/이전 실행과 게시 실행을 동일한 `runId`로 추적할 수 없다. Slack 실패는 별도 incident로 기록되지만 수집·검증 실패와 신규 0건을 공통 상태 모델로 구분하지 않는다.

주요 실패 경로는 Library 입력 부재, 파일명·날짜 불일치, raw hash 불일치, audit gate 실패, 기준선 충돌, migration 적용 실패, digest API 준비 지연, Slack 4xx/불확실 응답이다. 현재 각 실패는 하나의 workflow run ledger에 누적되지 않는다.

## 기존 예약과 workflow

- `daily-slack-digest.yml`: 평일 08:01/08:31/09:17 digest와 incident 관리.
- `production-smoke.yml`: 매시 17분 운영 smoke.
- `recovery-drill.yml`: 월요일 04:41 복구 훈련.
- `security.yml`: 월요일 18:17 보안 검사.
- 로컬 Codex heartbeat에는 CareerGround 작업이 발견되지 않았다. `배움집 검색 반영 점검`, `블로그 일일 포스팅·단계별 SEO 개선`만 존재한다.

## 보존 대상

- 기존 `jobs`, `saved_jobs`, `import_batches`, `app_schema_migrations`와 forward-only migration 규칙.
- 신규 ACTIVE만 INSERT, 증거가 있는 기존 행의 제한 필드만 조건부 UPDATE.
- `DELETE FROM jobs`와 모든 `saved_jobs` mutation 금지.
- Asia/Seoul, 평일 18:00 수집 목표, 파티션 1·2·3, 공식 출처 우선, 신입/인턴/경력무관 IT 정책.
- 기존 아침 digest 메시지 구성과 delivery 중복 방지 기능은 v5 PUBLISHED 소비 경로 뒤에서 호환한다.

## 개선 대상과 저장소 밖 구성요소

- 파일/채팅 이름이 아닌 `workflowId + runGroupKey + runId + partitionId` 계약.
- 실패, skip, 무변경, quarantine, verified, published를 분리한 상태 머신.
- raw/canonical hash를 모두 검증하는 Manifest와 명시적 입력 adapter.
- 파티션 병렬 수집, merge, validate, stage/publish, notify의 책임 분리.
- 원자적 게시와 last-success 포인터.
- 실제 파티션 수집기, 파티션별 출처 소유권의 전체 목록, 기존 ChatGPT Scheduled Task와 채팅 목록은 저장소에 없다. 이들은 `MANUAL_REQUIRED`이며 구현이 완료되었다고 간주하지 않는다.

## 문서와 구현 차이

기존 문서는 공휴일을 실행 때마다 공식 자료로 확인한다고 설명하지만 실제 Slack 코드는 2026 고정 Map만 사용한다. 문서는 Library에서 전체 파일을 materialize한다고 설명하지만 그 검색/다운로드 구현은 저장소에 없다. 문서는 DB 반영과 사후 검증을 단일 운영 절차로 설명하지만 GitHub Actions에는 채용 수집·검증·게시 오케스트레이터가 없고 Slack만 별도 예약되어 있다.
