# CareerGround 라이브러리 기반 신규 공고 반영 자동화

이 문서는 ChatGPT Work 예약 작업이 CareerGround 운영 DB에 신규 공고를 반영할 때 따르는 단일 실행 절차다. 채용공고의 발견·상세 검증·마감 판정은 별도의 `CareerGround 채용공고 수집` 대화가 담당한다. 이 자동화는 채용 사이트를 직접 탐색하거나 기존 공고를 재검증하지 않고, ChatGPT 라이브러리에 저장된 가장 최근 최종 JSON만 입력으로 사용한다.

## 1. 최우선 실행 게이트

1. 현재 날짜와 시간은 `Asia/Seoul` 기준으로 판단한다.
2. 토요일·일요일 또는 대한민국 공휴일·대체공휴일이면 라이브러리, 라이브 DB, 저장소에 접근하지 않고 즉시 작업을 종료한다.
3. 평일의 공휴일 여부는 대한민국 정부 또는 공공기관의 공식 자료로 확인한다. 공식 근거에 접근하지 못하거나 휴일 여부가 불확실하면 fail-closed로 종료한다.
4. 이 게이트를 통과한 비공휴일 평일에만 아래 단계를 수행한다.

## 2. 허용 입력과 금지 사항

### 2.1 유일한 공고 입력

1. ChatGPT 라이브러리에서 제목이 정확히 `careerground-jobs-live-YYYY-MM-DD-final.json` 형식인 JSON을 찾는다.
2. 파일명의 날짜가 가장 최근인 최종 파일을 선택한다. 같은 날짜의 `-final.json`이 여러 개면 라이브러리의 `modified_at`이 가장 최근인 한 파일만 선택한다.
3. 최종 파일이 없으면 다른 이름의 JSON을 대체 입력으로 사용하지 않고 DB를 변경하지 않는다.
4. `(1)`, `(2)`, `(3)`, `draft`, `uncertain`, `review`가 붙은 파일은 최종 파일의 대체 입력으로 사용하지 않는다.
5. 검색 결과의 제목·요약만으로 처리하지 않고 선택한 라이브러리 파일의 실제 JSON 전체를 읽어 검증한다.

### 2.2 금지 사항

- 채용 플랫폼, 기업 채용 페이지, 검색 엔진에서 신규 공고를 직접 찾지 않는다.
- 라이브러리 JSON의 공고 URL을 다시 열어 상태를 재판정하지 않는다.
- 라이브러리 파일에 없는 공고를 추론·보완·생성하지 않는다.
- 기존 `jobs` 행을 `UPDATE`·`DELETE`하지 않는다.
- `saved_jobs`를 `INSERT`·`UPDATE`·`DELETE`하지 않는다.
- 기존 공고의 상태, 마감일, 상시 여부, 검증 시각을 변경하지 않는다.
- 라이브러리 JSON의 `DEADLINE_UNKNOWN`, `NEEDS_REVIEW`, `EXPIRED`, `REMOVED` 행을 신규 등록하지 않는다.

## 3. 라이브 DB 기준선

1. Sites의 기존 프로젝트 `careerground-workspace`를 편집 모드로 연다. 새 사이트를 만들지 않는다.
2. 운영 D1의 `jobs` 테이블을 첫 페이지부터 `next_offset`이 없어질 때까지 순서대로 모두 읽는다.
3. 한 페이지라도 `truncated`, `omitted_rows`, `omitted_columns`, `truncated_values`가 있으면 DB를 변경하지 않는다.
4. 읽은 전체 행을 당일 작업 폴더의 `baseline.json`에 저장한다.
5. 기준선의 `id`, canonical `source_url`, `fingerprint` 중복 여부를 검사한다. 중복 또는 누락이 있으면 데이터 무결성 실패로 중단한다.

## 4. 라이브러리 JSON 검증

선택한 파일은 다음 조건을 모두 만족해야 한다.

- `version`은 `1.0`이다.
- `timezone`은 `Asia/Seoul`이다.
- `project`는 `careerground-workspace`다.
- `databaseBinding`은 `DB`, `table`은 `jobs`다.
- `exportedAt`은 실행 시각보다 미래가 아니며 서울 날짜가 파일명의 `YYYY-MM-DD`와 같다.
- `rowCount`는 실제 `items.length`와 같다.
- `statusCounts`는 실제 상태별 집계와 정확히 일치한다.
- 모든 행이 `docs/operations/job-import-schema.md`의 의미와 운영 `jobs` 스키마를 만족한다.
- `id`는 canonical `source_url`의 SHA-256 앞 24자리로 만든 `job-<24 hex>`와 일치한다.
- 파일 내부의 `id`와 canonical `source_url`은 각각 고유하다.
- 신규 `ACTIVE` 행은 `NEW_GRAD_ONLY` 또는 `NEW_GRAD_ELIGIBLE`이며, `career_evidence`가 비어 있지 않다.
- 신규 `ACTIVE` 행은 미래 `deadline_at`이 있거나 `rolling = 1`이어야 한다.
- 신규 `ACTIVE` 행의 `last_verified_at` 서울 날짜는 `exportedAt`의 서울 날짜와 같고 `exportedAt`보다 미래가 아니어야 한다.

검증 실패 시 임의 보정하지 않는다. 파일 전체를 배포 대상에서 제외하고 실패 원인을 보고한다.

## 5. 신규 공고 결정

1. 라이브러리의 각 행을 canonical `source_url`로 운영 기준선과 비교한다.
2. 운영 기준선에 같은 canonical URL이 있으면 `EXISTING_SKIPPED`로 기록하고 어떤 필드도 변경하지 않는다.
3. 운영 기준선에 URL은 없지만 같은 `id` 또는 `fingerprint`가 있으면 `CONFLICT_REVIEW_REQUIRED`로 기록하고 배포를 중단한다.
4. 운영 기준선에 없는 행 중 `status === ACTIVE`이고 4절 검증을 통과한 행만 `NEW_ACTIVE`로 결정한다.
5. 운영 기준선에 없는 비활성·불확실 행은 `NON_ACTIVE_EXCLUDED`로 기록하고 마이그레이션에 넣지 않는다.
6. `NEW_ACTIVE`가 0건이면 마이그레이션과 배포를 만들지 않고 변경 없음으로 종료한다.

이 작업의 허용 변경은 `NEW_ACTIVE`의 `INSERT`뿐이다. 라이브러리 JSON이 전체 스냅샷이더라도 운영 DB를 라이브러리 상태와 동기화하지 않는다.

## 6. 날짜별 산출물

`data/imports/job-library-import-YYYY-MM-DD/`에 다음 파일을 만든다.

- `baseline.json`: 실행 시작 시 운영 DB 전체 행
- `library-source-final.json`: 선택한 라이브러리 최종 JSON의 원본 사본
- `new-active.json`: 실제 INSERT 대상만 포함
- `excluded-new-non-active.json`: 운영 DB에 없지만 상태가 ACTIVE가 아니어서 제외한 행과 이유
- `reconciliation.json`: 입력 파일명·시각, 기준선 수, 기존 일치 수, 신규 수, 등록 수, 제외 수, 충돌 수, 업데이트 0, 삭제 0을 기록

라이브러리 파일의 안정적인 식별 정보와 선택 근거는 `reconciliation.json`에 기록하되 인증 정보나 임시 다운로드 URL은 기록하지 않는다.

## 7. INSERT 전용 마이그레이션

1. `drizzle/`의 가장 큰 네 자리 번호 다음 번호를 사용한다. 기존 파일을 수정하거나 덮어쓰지 않는다.
2. 다음 명령 형식으로 마이그레이션과 reconciliation 파일을 생성한다.

```bash
pnpm jobs:library:insert \
  --library data/imports/job-library-import-YYYY-MM-DD/library-source-final.json \
  --library-name careerground-jobs-live-YYYY-MM-DD-final.json \
  --library-file-id <stable-library-file-id> \
  --baseline data/imports/job-library-import-YYYY-MM-DD/baseline.json \
  --new-active data/imports/job-library-import-YYYY-MM-DD/new-active.json \
  --excluded data/imports/job-library-import-YYYY-MM-DD/excluded-new-non-active.json \
  --report data/imports/job-library-import-YYYY-MM-DD/reconciliation.json \
  --migration drizzle/NNNN_import_library_jobs_YYYYMMDD.sql \
  --batch-id catalog-jobs-YYYYMMDD-library-active \
  --run-at 2026-08-24T06:00:00+09:00
```

3. 생성 SQL에는 다음만 허용한다.
   - 신규 `ACTIVE` 행의 `INSERT INTO jobs ... ON CONFLICT(source_url) DO NOTHING`
   - `import_batches` INSERT
   - `app_schema_migrations` INSERT
   - `PRAGMA optimize`
4. `UPDATE jobs`, `DELETE FROM jobs`, `saved_jobs` 문자열이 있으면 배포하지 않는다.

## 8. 검증과 배포

1. 최소한 다음 테스트와 프로덕션 빌드를 통과시킨다.

```bash
pnpm exec vitest run \
  scripts/daily-job-refresh-policy.test.ts \
  scripts/generate-library-job-insert-migration.test.ts \
  deployment/sites/runtime-schema.test.ts
pnpm sites:build
```

2. 라이브러리 파일 부재·날짜 불일치·스키마 실패·페이지 누락·중복 충돌·마이그레이션 번호 충돌·테스트 실패·빌드 실패·데이터 무결성 위험이면 배포하지 않는다.
3. 안전 게이트를 통과하고 `NEW_ACTIVE`가 1건 이상이면 기존 CareerGround의 새 production checkpoint를 배포한다. 검증된 INSERT 전용 배포는 승인된 것으로 간주한다.
4. 배포 성공 후 운영 `jobs`, `import_batches`, `app_schema_migrations`의 모든 관련 페이지를 다시 읽는다.
5. 신규 URL이 모두 `ACTIVE`로 한 번씩 존재하고 총 행 수가 정확히 등록 건수만큼 증가했는지 확인한다.

## 9. 실행 보고

다음을 간결하게 보고한다.

- 사용한 라이브러리 최종 JSON 파일명과 `exportedAt`
- 운영 기준선 수와 라이브러리 행 수
- 기존 URL로 건너뛴 수
- 신규 `ACTIVE` 등록 수와 회사·공고명·링크
- 신규 비활성·불확실 제외 수
- 업데이트 0건, 삭제 0건
- 테스트·빌드·배포·라이브 DB 사후 검증 결과

신규 등록이 없으면 DB와 배포를 변경하지 않았음을 보고한다.
