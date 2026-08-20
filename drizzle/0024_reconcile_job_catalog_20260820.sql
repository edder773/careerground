INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b049ef1ee835be195dbaf3e6', '렉스코드', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시됨', 'JobKorea', '49716823', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716823', '렉스코드 백엔드 개발자 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시되고 상세 페이지에서 현재 즉시지원이 가능함', 'FULL_TIME', '서울 서초구', 0, '[]', NULL, '2026-08-03T15:00:00.000Z', '2026-09-03T14:59:59.000Z', 0, '서울 서초구에서 백엔드 개발자를 모집하는 경력무관 정규직 공고다.', 'ACTIVE', '2504cead15c2ad873b4aca411725e6debb0d2e14b20cec0e6b7b5316f04bf770', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z')
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
VALUES ('job-4860052a88eef7a4e93f6b5c', '㈜세인티', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시됨', 'JobKorea', '49749703', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49749703', '[신입/경력] Web 프론트엔드 개발자 모집(스마트팩토리, AI 솔루션)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '모집 대상이 신입·경력으로 명시되고 상세 페이지의 즉시지원 버튼이 활성 상태임', 'FULL_TIME_OR_CONTRACT', '서울 강서구', 0, '[]', NULL, '2026-08-09T15:00:00.000Z', '2026-09-09T14:59:59.000Z', 1, '스마트팩토리·AI 솔루션의 웹 프론트엔드 개발자를 모집하며 신입 지원이 가능하다.', 'ACTIVE', 'd972b851f6dc5dca1b39b88fbb3b4bc652e735d59e458980e1cbe569f0ec5ad8', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z')
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
VALUES ('job-da71d2a468af202f6c766966', '㈜원시', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49788950', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49788950', '신규 웹서비스를 함께 만들어갈 백엔드 개발자 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '모집 구분에 신입·경력이 명시되고 현재 잡코리아 즉시지원이 가능함', 'FULL_TIME', '제주 제주시', 0, '["NestJS"]', NULL, '2026-08-13T15:00:00.000Z', '2026-09-13T14:59:59.000Z', 0, '제주 근무의 신규 웹서비스 백엔드 개발자로, 신입과 경력 모두 지원할 수 있다.', 'ACTIVE', 'f567462845c9867696c494ce04abf159b58965ee503c402531cb96a1831ba311', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z')
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
VALUES ('job-8b31259da419f601018ce278', '와커스(WACUS)', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49783772', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49783772', '[웹에이전시 WACUS] 웹 프론트엔드 개발자 채용', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시되고 현재 잡코리아 즉시지원이 가능함', 'FULL_TIME', '서울 송파구', 0, '[]', NULL, '2026-08-13T15:00:00.000Z', '2026-09-13T14:59:59.000Z', 0, '웹에이전시에서 프론트엔드 개발자를 모집하는 경력무관 정규직 공고다.', 'ACTIVE', '89efac978c9330c4b4eb82dbc75c3d4ef002662318df4473aa977cd8d610bd3b', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z')
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
VALUES ('job-3a2d616453bbdd3c00fae610', '㈜플레이웍스', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49803832', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49803832', 'AI 및 라이브 기반 반려동물 양육 플랫폼 프론트엔드 개발자 채용', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '프론트엔드 모집 분야가 신입·경력으로 명시되고 즉시지원 버튼이 활성 상태임', 'FULL_TIME', '서울 강남구', 0, '[]', NULL, '2026-08-17T15:00:00.000Z', '2026-09-17T14:59:59.000Z', 0, 'AI·라이브 기능을 활용하는 반려동물 양육 플랫폼의 프론트엔드 개발자 공고다.', 'ACTIVE', '6ff91757d53de74b78b4722cf9f10e228f965c980bde9666549404e56353863d', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:46.000Z')
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
VALUES ('job-cdb129a17846b17574504c4b', '㈜무브', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49724108', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49724108', 'MOVV 백엔드 개발자 신규채용', 'BACKEND', 'NEW_GRAD_ONLY', '지원자격에 신입이 명시되고 현재 잡코리아 즉시지원 버튼이 활성 상태임', 'FULL_TIME', '광주 북구', 0, '[]', NULL, '2026-08-04T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, 'MOVV 서비스의 백엔드 개발을 담당할 신입 정규직 공고다.', 'ACTIVE', 'c961f9561f0ee80032efaa0fed01eec766ed2d94921e1e2ba27d87369592114a', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z')
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
VALUES ('job-b70a5b1588e30ad9afa48780', '모그포그', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49779691', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49779691', '[MOGG FOGG] Shopify 프론트엔드 개발자 채용 (신입·경력)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '신입·경력 공고이며 졸업예정자 지원 가능과 현재 즉시지원 상태가 함께 확인됨', 'FULL_TIME_OR_FREELANCE', '서울 성북구', 1, '["반응형웹","웹개발","Shopify"]', NULL, '2026-08-12T15:00:00.000Z', '2026-09-12T14:59:59.000Z', 0, 'Shopify 기반 프론트엔드 개발자를 모집하며 신입과 졸업예정자도 지원할 수 있다.', 'ACTIVE', '1e8ad606b5385e80807c0e64695e19e2323ccd7ed5071d71c1338d7cb14d507a', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z')
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
VALUES ('job-6dff8dc0dbfb53990362a530', '㈜아이셋디엑스', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49722786', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49722786', '산업용 C# 소프트웨어 개발자 채용', 'INDUSTRIAL_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시되고 현재 잡코리아 즉시지원이 가능함', 'FULL_TIME', '경기 이천시', 0, '["C#"]', NULL, '2026-08-04T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, '산업용 설비에 사용되는 C# 소프트웨어를 개발하는 경력무관 정규직 공고다.', 'ACTIVE', 'a4754b5962aeafea6d3488a5c2ab0ea0018a66c6f57227aec90c327df1cccb13', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z')
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
VALUES ('job-b82d38e7c4fe7de751b8bdc3', '㈜해양정보기술', 'SMALL', '잡코리아 기업정보에 51~300명 중소기업으로 표시됨', 'JobKorea', '49716925', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716925', '해양수치모델링 개발 분야 정규직 채용', 'DATA_SCIENCE', 'NEW_GRAD_ELIGIBLE', '경력무관 및 졸업예정자 지원 가능이 명시되고 현재 즉시지원이 가능함', 'FULL_TIME', '서울 금천구', 0, '[]', NULL, '2026-08-04T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, '해양 수치모델링과 관련 개발 업무를 수행하는 경력무관 정규직 공고다.', 'ACTIVE', '4c3d3b4f4212ef35be6324d05ccdaaf00edfdccf397b57749e46541acb709c4d', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z')
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
VALUES ('job-d5201fd05ffa7b2a582bff0e', '㈜픽셀', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49607918', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49607918', '㈜픽셀 2026년 검사 설비 S/W 개발자 채용', 'INDUSTRIAL_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '모집 대상에 신입·경력이 구분되어 있고 현재 즉시지원 버튼이 활성 상태임', 'FULL_TIME', '경기 평택시', 0, '[]', NULL, '2026-07-19T15:00:00.000Z', '2026-09-18T14:59:59.000Z', 0, '검사 설비용 소프트웨어를 개발하는 신입·경력 정규직 공고다.', 'ACTIVE', 'e6c467c31189609448f4e68327c7680b995f599e0d20de26c54d4c26d80dc6ed', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:50.000Z')
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
VALUES ('job-99dedfeaa23be244be3f1bea', '주식회사 사운드마인드', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159008', 'https://www.rocketpunch.com/jobs/159008', '웹/앱 프론트엔드 개발자 (React/Next.js)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입·주니어가 포함되고 상세 페이지의 간편 지원하기가 활성 상태임', 'FULL_TIME', '미확인', 0, '["TypeScript","React","Next.js","Zustand","TanStack Query","Tailwind CSS","Axios","React Native","Vitest","MariaDB","Redis","Docker","Spring Boot"]', NULL, NULL, '2026-09-01T14:59:59.000Z', 0, 'React·Next.js 기반 웹과 앱 프론트엔드를 개발하는 신입 지원 가능 정규직 공고다.', 'ACTIVE', 'defa9570ac91b7c7f93c8f72c68b8a7a8b716fbe7efa320cbcdcebc991faee37', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z')
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
VALUES ('job-99c8b5ed42f5ce78ead46daa', 'Concentrix', 'FOREIGN', '공고의 회사 소개에 글로벌 상장 기업으로 안내됨', 'RocketPunch', '159157', 'https://www.rocketpunch.com/jobs/159157', 'LLM/Agent Engineer 인턴', 'AI_ENGINEERING', 'NEW_GRAD_ONLY', '신입·졸업예정자 대상 6개월 채용전환형 인턴이며 간편 지원하기가 활성 상태임', 'INTERN_TO_FULL_TIME', '서울 강남구', 0, '["Python","LangGraph","FastAPI","OpenAI API","Gemini API","REST API","LLM","RAG"]', NULL, NULL, '2026-09-01T14:59:59.000Z', 0, 'LLM 기반 에이전트와 관련 API를 개발하는 6개월 채용전환형 인턴 공고다.', 'ACTIVE', '9b9b7f36e080b2db595eb8cc922675bf70d976e522c36598cfa5d5c93588007f', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z')
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
VALUES ('job-044ae79f96e4ea4efa3366d4', '블리츠다이나믹스', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159145', 'https://www.rocketpunch.com/jobs/159145', '데이터 엔지니어 인턴 모집', 'DATA_ENGINEERING', 'NEW_GRAD_ONLY', '데이터 엔지니어 인턴으로 신입 대상이 명시되고 간편 지원하기가 활성 상태임', 'INTERN_OR_CONTRACT', '미확인', 0, '["SQL","API","Database"]', NULL, NULL, '2026-08-22T14:59:59.000Z', 0, 'SQL과 API·데이터베이스를 활용하는 데이터 엔지니어 인턴 공고다.', 'ACTIVE', '896c28eb983629e79e718a68e1eb33f10db35be79c62cd93c5e310bbdd533abe', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z')
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
VALUES ('job-761583e713477c72f0f50c82', '팀카이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '158834', 'https://www.rocketpunch.com/jobs/158834', 'Agent Engineer (계약직)', 'AI_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입·주니어·미들이 포함되고 간편 지원하기가 활성 상태임', 'CONTRACT', '서울 강남구 도곡동', 1, '["LLM","TypeScript","Node.js","API","LLM-as-Judge"]', NULL, NULL, '2026-09-14T14:59:59.000Z', 0, 'LLM 에이전트의 개발과 평가를 담당하는 신입 지원 가능 계약직 공고다.', 'ACTIVE', 'dc185271a209d70c88788f4d0b3510d829375b4806392c717930306d68dd512a', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z')
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
VALUES ('job-292d372adafc184df16346ee', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156011', 'https://www.rocketpunch.com/jobs/156011', '[캐시워크] 백엔드 개발 채용전환형 인턴', 'BACKEND', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["Express","NestJS","REST API","GraphQL","MySQL","DynamoDB","PostgreSQL","Elasticsearch","AWS"]', NULL, NULL, NULL, 1, '캐시워크 서비스의 백엔드 개발을 수행하는 3개월 채용전환형 인턴 공고다.', 'ACTIVE', '9897e4ab7f536004581cd10166737c2967bb0f21804a43133ca3509e76290758', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:55.000Z')
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
VALUES ('job-6b340835b24ffbec68f5a685', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156013', 'https://www.rocketpunch.com/jobs/156013', '[캐시워크] 안드로이드 개발 채용전환형 인턴', 'ANDROID', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["Kotlin","Android","Coroutines","Flow","Jetpack","ViewModel","LiveData","Room"]', NULL, NULL, NULL, 1, '캐시워크 안드로이드 앱을 개발하는 3개월 채용전환형 인턴 공고다.', 'ACTIVE', 'eb625b4083f54699ed83a8ebffeda45d903e32bdc1ea49285a454c20a7361cec', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z')
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
VALUES ('job-f892f6cd2470eb623ab8592e', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156008', 'https://www.rocketpunch.com/jobs/156008', '[캐시워크] 데이터분석 담당 채용전환형 인턴', 'DATA_ANALYTICS', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["SQL","Python","Tableau","AWS DynamoDB","AWS EC2","AWS RDS","GCP BigQuery","Google Analytics"]', NULL, NULL, NULL, 1, '캐시워크 데이터 분석과 지표 운영을 담당하는 채용전환형 인턴 공고다.', 'ACTIVE', 'fb8140f076a360c83a61f46808cf3b56ca8d4abb94365a7653f79f6713c980d0', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z')
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
VALUES ('job-df5e34979bfbf507def5d086', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156014', 'https://www.rocketpunch.com/jobs/156014', '[캐시워크] 프론트엔드 개발 채용전환형 인턴', 'FRONTEND', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["Next.js","AWS","React Query","Zustand","Recoil","REST API","GraphQL"]', NULL, NULL, NULL, 1, '캐시워크 웹 서비스의 프론트엔드를 개발하는 채용전환형 인턴 공고다.', 'ACTIVE', '4c0c850e43be3b763d2a00122662cf5b23d0efc26c298c07d53c1d5c31449e84', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z')
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
VALUES ('job-7e34fd3cafd209aacaa76086', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156007', 'https://www.rocketpunch.com/jobs/156007', '[캐시워크] iOS 개발 채용전환형 인턴', 'IOS', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["RxSwift","ReactorKit","SwiftUI","TCA","Tuist","Fastlane","SwiftLint","Xcode Cloud","CI/CD"]', NULL, NULL, NULL, 1, '캐시워크 iOS 앱을 개발하는 3개월 채용전환형 인턴 공고다.', 'ACTIVE', '24ddfb0c40b38b05998e6f54a92b9f0e3b0c8c6f4b0aced9aa0ca309279e4282', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z')
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
VALUES ('job-a0c3a0ef5f1591aa18de7634', '팀스파르타', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '157706', 'https://www.rocketpunch.com/jobs/157706', 'AI Agent Engineer (인턴)', 'AI_ENGINEERING', 'NEW_GRAD_ONLY', '신입 대상 6개월 채용전환형 인턴이며 실제 지원 페이지와 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["AI Agent","MCP","Frontend","Backend"]', NULL, NULL, NULL, 1, 'AI 에이전트와 MCP 기반 기능을 개발하는 6개월 채용전환형 인턴 공고다.', 'ACTIVE', '950db9fb68cc03f204dd665205112b54b1617ed44dafa10114c41a77f7ceeb9d', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:52:59.000Z')
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
VALUES ('job-a302ddedc942a2e920897231', '미지웍스', 'STARTUP', '공고의 회사 소개에서 초기 스타트업 구성원 모집으로 안내됨', 'RocketPunch', '158841', 'https://www.rocketpunch.com/jobs/158841', '프론트엔드 엔지니어 채용', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '자격요건에 경력 3년 이상 또는 신입 지원 가능이 명시되고 간편 지원하기가 활성 상태임', 'FULL_TIME', '서울 성동구', 0, '["React Native","Flutter","React","Vue","TypeScript","Claude","Cursor","GitHub Copilot"]', NULL, NULL, '2027-01-01T14:59:59.000Z', 0, '모바일과 웹 프론트엔드를 개발하는 신입 지원 가능 정규직 공고다.', 'ACTIVE', '24ce60590ab661ee49b7597d1cd1cb19d1f8c0faa7449c609de7b672336c7e41', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z')
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
VALUES ('job-111d0e230cf5cda2c1a4de6b', '허드슨에이아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156625', 'https://www.rocketpunch.com/jobs/156625', 'Fullstack Engineer', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입·미들·시니어가 포함되고 지원 페이지 이동과 상시채용 상태가 확인됨', 'FULL_TIME', '미확인', 0, '["PostgreSQL","MongoDB","Python","JavaScript","TypeScript","Django","Nginx","gRPC","React","GCP","Docker"]', NULL, NULL, NULL, 1, 'AI 서비스의 프론트엔드와 백엔드를 함께 개발하는 풀스택 정규직 공고다.', 'ACTIVE', '5cadf09e472c6ec4c820461e121de13beef18fc2384738d38e07763b7e706bf0', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z')
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
VALUES ('job-01376e71d3ad0f1ec0c88dbb', '이스트게임즈', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156305', 'https://www.rocketpunch.com/jobs/156305', '웹 개발자 (Java, Spring, TypeScript, Next.js)', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '신입과 경력 트랙이 함께 명시되고 지원 페이지 이동과 상시채용 상태가 확인됨', 'FULL_TIME', '서울 서초구', 0, '["React","TypeScript","JavaScript","HTML","CSS","Java","Kotlin","Spring Framework","Spring Boot","Python","MSSQL","MySQL","Apache","Tomcat","GitLab","Jenkins","JPA","Hibernate","REST API","GraphQL","AWS"]', NULL, NULL, NULL, 1, '게임·웹 서비스의 프론트엔드와 백엔드를 함께 개발하는 신입 지원 가능 공고다.', 'ACTIVE', '91ba7b23d7ab4022a467d2948e8a63bc67d34ec49ad1e641e9b9eb6b5f339209', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z')
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
VALUES ('job-81439a5923b20570d21b4df3', '이스트게임즈', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156303', 'https://www.rocketpunch.com/jobs/156303', 'DevOps 엔지니어', 'DEVOPS', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입이 포함되고 지원 페이지 이동과 상시채용 상태가 확인됨', 'FULL_TIME', '서울 서초구', 0, '["Linux","Windows","TCP/IP","Bash","Python","Terraform","Ansible","Docker","Kubernetes","GitLab CI/CD","Jenkins","AWS"]', NULL, NULL, NULL, 1, '게임 서비스 인프라와 배포 자동화를 담당하는 신입 지원 가능 DevOps 공고다.', 'ACTIVE', 'b9ba5c2c7744a49dd54ed1061558de06f728aec38268aa3641f240babc39b0e6', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z')
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
VALUES ('job-ca52b46a86b57d2e55c2debb', 'GC메디아이', 'PUBLIC', '공고의 기업정보에서 상장기업으로 안내됨', 'RocketPunch', '158917', 'https://www.rocketpunch.com/jobs/158917', 'AI-Native Engineer(인턴)', 'AI_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '경력무관 6개월 채용전환형 인턴이며 실제 지원 페이지와 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["ChatGPT","Claude","Microservices","JavaScript","TypeScript","Git"]', NULL, NULL, NULL, 1, '생성형 AI를 활용한 제품 기능을 개발하는 6개월 채용전환형 인턴 공고다.', 'ACTIVE', '2e8132875953ff060d816ef30b591173ad26662b94401eaf2ee3d6332ab424e2', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:03.000Z')
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
VALUES ('job-5d8534469c7555a478e69266', '코드비전', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159184', 'https://www.rocketpunch.com/jobs/159184', 'AI Research Engineer (석사 이상)', 'AI_RESEARCH', 'NEW_GRAD_ELIGIBLE', '석사 졸업예정자·신입 지원 가능이 명시되고 간편 지원하기가 활성 상태임', 'INTERN_TO_FULL_TIME', '미확인', 0, '["Python","PyTorch","OpenCV","Computer Vision","Deep Learning","LLM","Multimodal AI","AI Agent","TensorFlow"]', NULL, NULL, '2026-09-19T14:59:59.000Z', 0, '컴퓨터 비전·멀티모달 AI를 연구개발하는 석사급 채용연계형 인턴 공고다.', 'ACTIVE', '7de40b24fd2501db93ebfd0777ca1b3b58600a4f16972d48cc194fe65b6bccc3', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:31.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T00:53:31.000Z')
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
VALUES ('job-a682ee1dd5ac993d64e10cab', 'NAVER', 'UNCLASSIFIED', '해당 공식 공고에서 기업 규모 분류 근거를 별도로 수집하지 않음', 'NAVER Careers', '30005300', 'https://recruit.navercorp.com/rcrt/view.do?annoId=30005300', '[NAVER] 인공지능 기반 실시간 진료기록 생성 기술 연구 개발 (체험형 인턴)', 'AI_RESEARCH', 'NEW_GRAD_ONLY', '공식 페이지에서 New hire·Intern으로 표시되고 Apply 링크가 활성 상태임', 'INTERN', '미확인', 0, '["AI","Machine Learning","NLP","Generative AI","LLM","RAG","Python","PyTorch","Knowledge Extraction"]', NULL, '2026-08-17T15:00:00.000Z', '2026-08-27T01:00:00.000Z', 0, '실시간 진료 대화를 의료기록으로 변환하는 AI 모델을 연구개발하는 체험형 인턴 공고다.', 'ACTIVE', '4e9cedd15127014191cd51de851289a146f4dd7fb9c9b91d9f6aa6b988664852', '2026-08-20T00:52:05.000Z', '2026-08-20T00:53:09.000Z', '2026-08-20T00:52:05.000Z', '2026-08-20T00:53:09.000Z')
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
VALUES ('job-3d0141c93bbea11460474a94', 'KCC', 'UNCLASSIFIED', '해당 공식 공고에서 기업 규모 분류 근거를 별도로 수집하지 않음', 'KCC Careers', '14192', 'https://recruit.kccworld.co.kr/recruit/recruitMain?SEQ=14192&SiteType=A', '2026년 3분기 부문별 대졸 신입 수시채용 - IT', 'CORPORATE_IT', 'NEW_GRAD_ONLY', '대졸 신입 통합채용에 IT 직무가 명시되고 공식 채용 사이트의 지원하기 메뉴가 활성 상태임', 'UNCONFIRMED', '미확인', 0, '[]', NULL, '2026-08-18T14:00:00.000Z', '2026-08-30T05:59:00.000Z', 0, 'KCC 대졸 신입 수시채용에 포함된 IT 직무 공고다.', 'ACTIVE', 'aa58e2b2e41d0f6c79901e69f20dcb93e2a9abe6510894d96ab6920998eb9563', '2026-08-20T00:52:05.000Z', '2026-08-20T00:53:09.000Z', '2026-08-20T00:52:05.000Z', '2026-08-20T00:53:09.000Z')
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
VALUES ('job-1fb646e8cf0b365708f54cd9', '한국예탁결제원', 'PUBLIC', '공식 채용 페이지에서 공공 금융 인프라 기관 채용으로 확인됨', '한국예탁결제원 채용', NULL, 'https://ksd-recruit.co.kr/', '2026년 신입직원 채용공고 - IT', 'CORPORATE_IT', 'NEW_GRAD_ONLY', '공식 페이지에 IT 신입 직렬과 지원하기 링크가 있으며 학력·전공 제한 없이 지원 가능함', 'INTERN_TO_FULL_TIME', '미확인', 0, '[]', NULL, '2026-08-17T16:00:00.000Z', '2026-09-01T00:00:00.000Z', 0, '한국예탁결제원 IT 직렬의 신입 채용형 청년인턴 공고로, 평가 후 90% 이상 정규직 전환 예정이다.', 'ACTIVE', '443082dd0193e750e8fc269f06020eb6e998978ce396cf45fdfdf5a959ec2e70', '2026-08-20T00:52:05.000Z', '2026-08-20T00:53:09.000Z', '2026-08-20T00:52:05.000Z', '2026-08-20T00:53:09.000Z')
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
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49705317'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://recruit.naverlabs.com/rcrt/view.do?annoId=30005258&lang=ko'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://toss.im/career/job-detail?job_id=7816881003'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49631880'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49588410'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49379347'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://jasoseol.com/recruit/105543'
  AND rolling = 0
  AND deadline_at < '2026-08-20T00:57:30.000Z';
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-20T04:13:48.000Z', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49649110'
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-20T04:13:48.000Z', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49748610'
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-20T04:13:48.000Z', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49746362'
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-20T04:13:48.000Z', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://www.rocketpunch.com/jobs/157754'
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-20T04:13:48.000Z', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://www.rocketpunch.com/jobs/156469'
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-20T04:13:48.000Z', updated_at = '2026-08-20T04:13:48.000Z'
WHERE source_url = 'https://recruit.dreamuscompany.com/pages/careers_view.jsp?id=227074&jobName=All&title='
  AND rolling = 1
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260820-delta', 'jobs', '3f9f362df1123a94c4ce64d8a4509d75a261fb13b7406b3cdc7578bc3d5cd017', 'COMMITTED',
   29, 0, '{"existingItems":51,"incomingItems":29,"matchedItems":13,"addedItems":16,"expiredByDeadlineItems":7,"retainedExistingRollingItems":7,"storedItemsAfter":67,"visibleItemsAfter":60,"snapshotMode":"DELTA","policy":"delta-upsert; explicit-deadline-expiry; verified-rolling-retention"}', '2026-08-20T04:13:48.000Z', '2026-08-20T04:13:48.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0024_reconcile_job_catalog_20260820', 'sha256:3f9f362df1123a94c4ce64d8a4509d75a261fb13b7406b3cdc7578bc3d5cd017', '2026-08-20T04:13:48.000Z');
--> statement-breakpoint
PRAGMA optimize;
