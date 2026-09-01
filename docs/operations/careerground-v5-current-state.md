# CareerGround 채용 자동화 v5 전환 전 상태

이 문서는 운영 데이터를 복제하지 않고 저장소의 코드·워크플로·문서에서 확인한 사실만 기록한다. 2026-08-28 자동 게시 전환 이후 상태를 기준으로 한다.

## 현재 아키텍처와 데이터 흐름

1. 저장소 밖의 ChatGPT 예약 작업 3개가 평일 18:00에 담당 출처의 schema 5.1 신규 후보 delta를 수집하고 임시 Git blob과 Issue 포인터로 전달한다.
2. `.github/workflows/careerground-v5-handoff.yml`이 세 포인터를 모아 blob 크기·SHA-256·출처 소유권·정책·중복을 검증하고 ID·canonical key·fingerprint를 결정적으로 만든다.
3. 검증 성공 시 GitHub Actions가 별도 Bearer token으로 Sites의 `/api/v1/internal/jobs-v5/publish`를 호출한다. endpoint가 운영 D1 기준선과 다시 대조하고 신규 ACTIVE만 stage/publish한다.
4. 게시 과정은 `workflow_runs`, `workflow_staged_jobs`, `workflow_publications`, `workflow_pointers`, `import_batches`에 원장을 남긴다. 기존 `jobs` UPDATE·DELETE와 모든 `saved_jobs` mutation은 금지한다.
5. `.github/workflows/daily-slack-digest.yml`이 평일 08:01~08:51의 10분 fallback과 09:17(Asia/Seoul), Production SLO 완료, v5 게시 완료 이벤트에서 배포 API를 호출한다. 08:51부터는 채용 import 지연 여부와 무관하게 코딩 문제 알림을 보장하고, `scripts/slack/send-daily-digest.mjs`가 응답을 Slack Webhook으로 전송한다.
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
- `workflow_runs`, 파티션 staging, publication, last-success pointer와 idempotency ledger는 migration 0037로 운영 스키마에 포함된다.

## Slack 데이터 소스와 실패 경로

Slack은 직전 성공 발송 이후 `created_at` window를 사용하며 08:01·08:31에는 같은 window 안에 새로 `COMMITTED`된 `jobs` 또는 `jobs-v5` import를 준비 신호로 확인한다. 따라서 전날 저녁 게시도 다음 영업일 오전의 정상 준비 신호가 된다. 발송 자체는 `daily:YYYY-MM-DD` claim으로 중복 방지되며 v5 publish workflow에서는 Slack을 직접 호출하지 않는다.

주요 실패 경로는 Library 입력 부재, 파일명·날짜 불일치, raw hash 불일치, audit gate 실패, 기준선 충돌, migration 적용 실패, digest API 준비 지연, Slack 4xx/불확실 응답이다. 현재 각 실패는 하나의 workflow run ledger에 누적되지 않는다.

## 기존 예약과 workflow

- `daily-slack-digest.yml`: 평일 08:01~08:51/09:17 digest, 게시 완료 wake-up과 incident 관리.
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

- 파일/채팅 이름이 아닌 `workflowId + runGroupKey + runId + partitionId` 계약을 적용했다.
- 실패, 무변경, verified, published를 분리한 상태 머신과 원자 게시·last-success 포인터를 적용했다.
- raw/canonical hash 검증과 명시적 Git blob 입력 adapter를 적용했다.
- Pro/Work 수동 전달은 필수 경로에서 제거했고 필요 시 읽기 전용 보조 감사로만 사용한다.
- 실제 웹 조사는 여전히 외부 ChatGPT 예약 작업이 수행한다. 2026-08-28부터 예약 작업은 운영 기준선과 File Library 전체 파일을 읽지 않고 담당 출처의 신규 후보 delta만 만든다. 파티션별 17개 출처는 `config/careerground-partition-sources.json`으로 유지한다. schema 2.0 자동 전달 수신기는 세 Git blob의 크기·SHA-256을 GitHub에서 계산하고 `scripts/jobs-v5/discovery-delta.mjs`로 출처 소유권·정책·중복을 검증한다. 기존 schema 1.0 5파일 v4 adapter는 롤백 호환 경로로 유지한다.

## 문서와 구현 차이

기존 v4 문서의 Library final/audit와 forward-only migration 절차는 롤백 호환 경로다. 현재 schema 2.0 운영 경로는 Library 파일을 검색하지 않으며 검증된 discovery bundle을 보호된 D1 endpoint에 직접 게시한다. 공휴일 판정은 외부 예약 수집 프롬프트와 Slack의 한국 영업일 정책이 각각 fail-closed로 수행한다.
