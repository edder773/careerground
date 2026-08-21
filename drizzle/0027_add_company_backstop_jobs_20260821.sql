INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-a01145b7998cfa5061a6b281', 'SK하이닉스', 'LARGE', 'SK Careers의 SK하이닉스 공식 기술사무직 신입 공고로 확인함', 'SK Careers', 'R261762', 'https://www.skcareers.com/Recruit/Detail/R261762', '[''26년 하반기] Talent hy-way 기술사무직 신입', 'MULTI_IT_ROLES', 'NEW_GRAD_ONLY', 'SK Careers 공식 공고 제목과 모집 구분에 신입(New)이 명시되고 2027년 1월부터 정규 근무 가능한 지원자를 모집함', 'FULL_TIME', '이천·분당·서울·용인·청주', 0, '["System Architecture","Software Solution","IT"]', '2026-08-19T15:00:00.000Z', '2026-08-19T15:00:00.000Z', '2026-08-26T08:00:00.000Z', 0, 'SK하이닉스 기술사무직 신입 통합채용으로 IT, System Architecture·SW Solution, Solution SW 직무가 포함되어 있다.', 'ACTIVE', '951b04b21cf5782d207edddd911d3c3675ebbf7b98e7bfc4cf3ade64239f7d77', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z')
ON CONFLICT(source_url) DO UPDATE SET
  company_name = excluded.company_name,
  company_size = excluded.company_size,
  company_size_evidence = excluded.company_size_evidence,
  source_name = excluded.source_name,
  source_posting_id = excluded.source_posting_id,
  title = excluded.title,
  category = excluded.category,
  career_scope = excluded.career_scope,
  career_evidence = excluded.career_evidence,
  employment_type = excluded.employment_type,
  region = excluded.region,
  remote = excluded.remote,
  tech_stack = excluded.tech_stack,
  published_at = excluded.published_at,
  application_start_at = excluded.application_start_at,
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  fingerprint = excluded.fingerprint,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-81c90fd3b33b9e40a2404d9b', '한국전력거래소', 'PUBLIC', '공공기관 채용정보시스템 JOB-ALIO의 한국전력거래소 공고로 확인함', 'JOB-ALIO', '303880', 'https://job.alio.go.kr/recruitview.do?idx=303880', '2026년 하반기 일반직 신입직 공개채용', 'MULTI_IT_ROLES', 'NEW_GRAD_ONLY', '현재 채용 상세에 신입·정규직·학력무관이 명시되고 채용홈 지원 링크가 활성 상태임', 'FULL_TIME', '전남 나주·제주·충북 청주·경기 의왕', 0, '["Software Engineering","Information Systems","Network","AI/AX"]', '2026-08-12T15:00:00.000Z', '2026-08-12T15:00:00.000Z', '2026-08-28T01:00:00.000Z', 0, '한국전력거래소 일반직 신입 공개채용으로 소프트웨어, 시스템, 네트워크, 웹서비스기획, AI·AX 직무가 포함되어 있다.', 'ACTIVE', '94ecfc46f9a48dcdf566279e1bc1cf063c212dea7330670ef20b3e0e694dc9a2', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z')
ON CONFLICT(source_url) DO UPDATE SET
  company_name = excluded.company_name,
  company_size = excluded.company_size,
  company_size_evidence = excluded.company_size_evidence,
  source_name = excluded.source_name,
  source_posting_id = excluded.source_posting_id,
  title = excluded.title,
  category = excluded.category,
  career_scope = excluded.career_scope,
  career_evidence = excluded.career_evidence,
  employment_type = excluded.employment_type,
  region = excluded.region,
  remote = excluded.remote,
  tech_stack = excluded.tech_stack,
  published_at = excluded.published_at,
  application_start_at = excluded.application_start_at,
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  fingerprint = excluded.fingerprint,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260821-company-backstop', 'jobs', '00e3e79c52f7c9eb0981c0a8e10a942421e2ebefeb81aababd1c195bc9680d80', 'COMMITTED',
   2, 0, '{"existingItems":0,"incomingItems":2,"matchedItems":0,"addedItems":2,"expiredByDeadlineItems":0,"removedItems":0,"retainedUnconfirmedItems":0,"retainedExistingRollingItems":0,"storedItemsAfter":2,"visibleItemsAfter":2,"snapshotMode":"DELTA","policy":"delta-upsert; explicit-deadline-expiry; verified-rolling-retention"}', '2026-08-21T00:28:35.000Z', '2026-08-21T00:28:35.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0027_add_company_backstop_jobs_20260821', 'sha256:00e3e79c52f7c9eb0981c0a8e10a942421e2ebefeb81aababd1c195bc9680d80', '2026-08-21T00:28:35.000Z');
--> statement-breakpoint
PRAGMA optimize;
