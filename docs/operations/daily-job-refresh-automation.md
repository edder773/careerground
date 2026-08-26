# CareerGround 채용 공고 검증기 동기화 자동화

이 문서는 ChatGPT Work 예약 작업이 CareerGround 운영 DB를 갱신할 때 따르는 단일 실행 절차다. 공고 발견·상세 검증·마감 판정은 별도의 `채용 공고 검증기`가 담당한다. 자동화는 채용 사이트를 직접 탐색하지 않고, ChatGPT 라이브러리의 최종 JSON과 같은 날짜의 병합 감사 파일만 소비한다.

## 1. 최우선 실행 게이트

1. 날짜와 시간은 `Asia/Seoul` 기준으로 판단한다.
2. 토요일·일요일 또는 대한민국 공휴일·대체공휴일이면 라이브러리, 라이브 DB, 저장소에 접근하지 않고 즉시 종료한다.
3. 평일의 공휴일 여부는 대한민국 정부 또는 공공기관의 공식 자료로 확인한다. 공식 근거에 접근하지 못하거나 휴일 여부가 불확실하면 fail-closed로 종료한다.
4. 이 게이트를 통과한 비공휴일 평일에만 아래 단계를 수행한다.

## 2. 유일한 입력

1. 라이브러리에서 파일명이 정확히 `careerground-jobs-live-YYYY-MM-DD-final.json`인 파일만 찾는다. 가장 최근 날짜를 선택하고, 같은 날짜 파일이 여러 개면 `modified_at`이 가장 최근인 하나를 선택한다.
2. 같은 날짜의 `careerground-merge-audit-YYYY-MM-DD.json`을 반드시 함께 선택한다.
3. 두 파일의 검색 결과 메타데이터나 요약만 사용하지 않고 실제 파일 전체를 읽거나 materialize한다.
4. 최종 JSON 또는 같은 날짜 감사 파일이 없으면 다른 파일을 대체 입력으로 쓰지 않고 종료한다. `(1)`, `(2)`, `(3)`, `latest`, `draft`, `uncertain`, `review` 파일은 대체 입력으로 금지한다.
5. 공휴일 확인 외에는 채용 플랫폼, 기업 채용 페이지, 검색 엔진 또는 공고 URL에 접근하지 않는다. 공고를 직접 검색·추론·보완하거나 상태를 재판정하지 않는다.

## 3. 라이브 DB 기준선

1. 기존 Sites 프로젝트 `careerground-workspace`만 편집 모드로 연다. 새 사이트를 만들지 않는다.
2. 운영 D1 `jobs`를 첫 페이지부터 `next_offset`이 없을 때까지 전부 읽는다.
3. 한 페이지라도 `truncated`, `omitted_rows`, `omitted_columns`, `truncated_values`가 있으면 중단한다.
4. 전체 행을 당일 작업 폴더의 `baseline.json`에 저장한다.
5. 기준선의 `id`, canonical `source_url`, `fingerprint` 중복과 누락을 검사한다. 충돌이 있으면 배포하지 않는다.
6. `saved_jobs` 행 수를 기록하며 이 작업 전후에 내용과 행 수가 바뀌지 않아야 한다.

## 4. 최종 JSON과 감사 파일 검증

### 4.1 최종 JSON

- `version=1.0`, `timezone=Asia/Seoul`, `project=careerground-workspace`, `databaseBinding=DB`, `table=jobs`여야 한다.
- 파일명 날짜는 `exportedAt`의 서울 날짜와 같고 `exportedAt`은 실행 시각보다 미래일 수 없다.
- `rowCount`, `statusCounts`, `columns`와 모든 `items` 필드는 실제 내용과 일치해야 한다.
- `id`는 canonical `source_url`의 SHA-256 앞 24자리 기반 `job-<24 hex>`여야 한다.
- 파일 내부의 `id`, canonical `source_url`, `fingerprint`는 각각 고유해야 한다.
- 신규 `ACTIVE`는 `NEW_GRAD_ONLY` 또는 `NEW_GRAD_ELIGIBLE`, 비어 있지 않은 `career_evidence`, 미래 `deadline_at` 또는 `rolling=1`을 가져야 한다.
- 신규 `ACTIVE`의 `last_verified_at` 서울 날짜는 `exportedAt`과 같아야 한다.
- 검증기가 `exportedAt`을 초 단위로 직렬화하고 `last_verified_at`은 밀리초를 보존한 경우에만, 두 값이 같은 초 안에 있고 차이가 999ms 이하인 것을 정밀도 차이로 허용한다. 적용 건수와 이유를 reconciliation에 기록한다. 다음 초이거나 1,000ms 이상이면 실패한다.

### 4.2 병합 감사 파일

- `artifactType=CAREERGROUND_MERGE_AUDIT`, 날짜·timezone·최종 파일명이 최종 JSON과 일치해야 한다.
- `finalOutput.sha256`는 읽은 최종 JSON 원본 바이트의 SHA-256과 일치해야 한다.
- `blockingErrors`와 `existingFinalRecheckFailed`는 비어 있어야 한다.
- 최상위 `qualityGates.overall=PASS`, `baseline.hashMatched=true`, `existingCoverage.passed=true`, `crossPartitionDedup.completed=true`여야 한다.
- 세 partition이 모두 존재하고 각 `blockingErrors`가 비어 있으며 각 품질 게이트가 `PASS` 계열이어야 한다.
- 감사 파일에 없는 기존 필드 차이는 자동 동기화하지 않는다.

## 5. 변경 결정

### 5.1 신규 행

1. canonical `source_url`이 기준선에 있으면 신규 등록하지 않는다.
2. 새 URL이 기준선 `id` 또는 `fingerprint`와 충돌하면 전체 배포를 중단한다.
3. 기준선에 없는 `ACTIVE` 중 4절을 통과한 행만 INSERT한다.
4. 신규 `DEADLINE_UNKNOWN`, `NEEDS_REVIEW`, `EXPIRED`, `REMOVED`와 실행 시점에 마감된 `ACTIVE`는 제외 파일에 기록하고 INSERT하지 않는다.

### 5.2 기존 행

1. 자동 UPDATE는 감사 파일의 `existingStatusChanges` 또는 `existingOtherFieldChanges`에 명시된 행만 허용한다.
2. 각 항목은 `finalRecheckStatus=CONFIRMED`, 비어 있지 않은 현재 증거, 기준선의 before 값 일치, 최종 JSON의 after 값 일치를 모두 충족해야 한다.
3. 허용 UPDATE 필드는 `status`, `deadline_at`, `rolling`, `summary`, `last_verified_at`, `updated_at`뿐이다.
4. `id`, `source_url`, `fingerprint`, 회사·직무 식별 필드는 UPDATE하지 않는다.
5. `RETAINED_UNCONFIRMED`, 접근 실패 또는 감사 항목이 없는 기존 차이는 변경하지 않는다.
6. WHERE 절에 `id`, `source_url`, 기존 before 값을 모두 넣어 동시 변경이나 오래된 기준선이면 UPDATE가 적용되지 않게 한다.

### 5.3 영구 금지

- `DELETE FROM jobs`를 사용하지 않는다.
- `saved_jobs`를 INSERT·UPDATE·DELETE하지 않는다.
- 감사 근거 없이 기존 행을 전체 스냅샷 값으로 덮어쓰지 않는다.

## 6. 날짜별 산출물

`data/imports/job-validator-sync-YYYY-MM-DD/`에 다음을 만든다.

- `baseline.json`
- `library-source-final.json`
- `merge-audit.json`
- `new-active.json`
- `existing-updates.json`
- `excluded-new-non-active.json`
- `reconciliation.json`

Library 안정 식별자, 원본 SHA-256, 선택 기준, 정밀도 허용 적용 수, 신규·업데이트·제외·충돌·삭제 수를 reconciliation에 기록한다. 인증 정보와 임시 다운로드 URL은 기록하지 않는다.

## 7. forward-only 마이그레이션

1. `drizzle/`의 가장 큰 네 자리 번호 다음 번호를 사용하고 기존 파일을 수정하지 않는다.
2. 다음 명령을 사용한다.

```bash
pnpm jobs:validator:sync \
  --library data/imports/job-validator-sync-YYYY-MM-DD/library-source-final.json \
  --library-name careerground-jobs-live-YYYY-MM-DD-final.json \
  --library-file-id <stable-library-file-id> \
  --audit data/imports/job-validator-sync-YYYY-MM-DD/merge-audit.json \
  --audit-name careerground-merge-audit-YYYY-MM-DD.json \
  --audit-file-id <stable-audit-file-id> \
  --baseline data/imports/job-validator-sync-YYYY-MM-DD/baseline.json \
  --new-active data/imports/job-validator-sync-YYYY-MM-DD/new-active.json \
  --existing-updates data/imports/job-validator-sync-YYYY-MM-DD/existing-updates.json \
  --excluded data/imports/job-validator-sync-YYYY-MM-DD/excluded-new-non-active.json \
  --report data/imports/job-validator-sync-YYYY-MM-DD/reconciliation.json \
  --migration drizzle/NNNN_sync_validator_jobs_YYYYMMDD.sql \
  --batch-id catalog-jobs-YYYYMMDD-validator-confirmed \
  --run-at <Asia/Seoul ISO timestamp>
```

3. SQL에는 감사 확인 UPDATE, 신규 ACTIVE `INSERT ... ON CONFLICT(source_url) DO NOTHING`, `import_batches` INSERT, `app_schema_migrations` INSERT, `PRAGMA optimize`만 허용한다.
4. `DELETE FROM jobs`, `saved_jobs`, 식별 필드 UPDATE가 있으면 배포하지 않는다.

## 8. 테스트·빌드·배포

1. 최소 다음을 통과한다.

```bash
pnpm exec vitest run \
  scripts/daily-job-refresh-policy.test.ts \
  scripts/generate-library-job-insert-migration.test.ts \
  scripts/generate-validator-job-sync-migration.test.ts \
  deployment/sites/runtime-schema.test.ts
pnpm sites:build
```

2. 입력 부재, 해시·스키마·감사 실패, DB 페이지 누락, 충돌, 마이그레이션 번호 충돌, 테스트·빌드 실패, 데이터 무결성 위험이면 배포하지 않는다.
3. 안전 게이트를 통과하고 INSERT 또는 감사 확인 UPDATE가 1건 이상이면 기존 CareerGround production checkpoint를 즉시 배포한다.
4. 성공 후 운영 `jobs`, `saved_jobs`, `import_batches`, `app_schema_migrations`를 다시 읽는다. 신규 URL의 ACTIVE 단일 존재, UPDATE after 값, 총 jobs 증가량, `saved_jobs` 불변, batch와 migration ledger를 확인한다.

## 9. 실행 보고

사용한 최종 JSON과 감사 파일, `exportedAt`, 기준선·라이브러리 행 수, 기존 건너뜀, 신규 ACTIVE, 감사 확인 UPDATE, 신규 비활성·불확실 제외, 삭제 0, 정밀도 허용 적용, 테스트·빌드·배포와 사후 검증 결과를 보고한다. 변경이 없으면 DB와 배포를 변경하지 않는다.
