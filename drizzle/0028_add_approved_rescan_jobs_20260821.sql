INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b05541da0aed537c6db043f3', '연합인포맥스', 'UNCLASSIFIED', '공개 상세만으로 기업 규모 분류를 확정하지 않았다.', '자소설닷컴', '105724', 'https://jasoseol.com/recruit/105724', '영업 부문(경력) 및 IT개발직(신입) 채용 - IT개발', 'SOFTWARE_DEVELOPMENT', 'NEW_GRAD_ONLY', '현재 상세의 모집 직무에서 IT개발을 신입으로 명시한다.', 'FULL_TIME', '서울', 0, '["Software Development","IT"]', NULL, '2026-08-19T16:00:00.000Z', '2026-08-30T05:59:00.000Z', 0, '연합인포맥스의 신입 IT개발 직무로, 2026년 8월 30일 14시 59분(KST)까지 지원하는 기간제 공고다.', 'ACTIVE', 'a28148692100bd6243df15578256c4b39e5c68488f47ac3d8fa0a69078126d29', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-4cf68e2af025e2d7aad02e6c', '한국석유공사', 'PUBLIC', 'NCS 공정채용에 등록된 공공기관 채용이다.', 'NCS 공정채용', '28690', 'https://jasoseol.com/recruit/105651', '2026년 신입직원 채용 - 기술 IT', 'PUBLIC_ICT', 'NEW_GRAD_ONLY', '6급 대졸수준 공개채용의 기술_IT 모집 단위로 확인했다.', 'FULL_TIME', '울산·전국', 0, '["IT","Information Systems"]', '2026-08-12T15:00:00.000Z', '2026-08-12T15:00:00.000Z', '2026-08-28T14:59:59.000Z', 0, '한국석유공사 6급 대졸수준 신입 공개채용의 기술 IT 모집 단위다. 공개 목록의 8월 28일 마감일은 날짜 말로 정규화했다.', 'ACTIVE', '7e440383a95ca980c5ea62b5efede29ea1f2433e79af86db01522e971b51226f', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-5045ab95b218b523cc20f803', 'iMBC', 'MID', '현재 공개 상세가 중견기업으로 표시한다.', '인비원', '174848', 'https://office.invione.com/jobs/recruitment/open/detail/174848', '웹개발(신입)', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 상세가 웹개발 신입 정규직을 명시한다.', 'FULL_TIME', '서울', 0, '["Web Development"]', '2026-08-17T15:00:00.000Z', '2026-08-17T15:00:00.000Z', '2026-08-28T14:59:59.000Z', 0, 'iMBC 웹개발 신입 정규직 공고로 공식 Careerlink 접수 링크가 연결된다. 공개된 8월 28일 마감일은 날짜 말로 정규화했다.', 'ACTIVE', '324f310e42b6b32cfeccfbf6824b5b0cb749881e8c4d0b701e75d5a06d396e6a', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-45f7898244ff71abe006c11a', 'NAVER Cloud', 'LARGE', 'NAVER Cloud 공식 채용 페이지의 공고다.', 'NAVER Cloud Careers', '30005293', 'https://recruit.navercloudcorp.com/rcrt/view.do?annoId=30005293&lang=ko', 'LLM 평가 및 학습 데이터 파이프라인 개발 (체험형 인턴)', 'AI_DATA_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '모집 경력 신입이며 재학생 또는 기졸업자가 지원 가능하다.', 'INTERNSHIP', '경기 성남', 0, '["Python","PyTorch","TensorFlow","LLM","Data Pipeline"]', '2026-08-17T15:00:00.000Z', '2026-08-17T15:00:00.000Z', '2026-08-26T09:00:00.000Z', 0, 'LLM 평가와 학습 데이터 합성·검증 파이프라인 개발을 지원하는 약 3개월 체험형 인턴이다.', 'ACTIVE', '15d0f09a7d1bc502b6f2f97dd61ecf7f793fa035e45a907f6d7861bd14ecf461', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-aef0f9664ab30c3b711ec493', '스타픽시 스튜디오', 'STARTUP', '공식 회사 소개와 채용 페이지를 근거로 스타트업으로 분류했다.', '스타픽시 스튜디오 Careers', 'gameplay-programmer', 'https://starpixie.studio/recruit/gameplay-programmer', '게임 플레이 프로그래머', 'GAME_DEVELOPMENT', 'NEW_GRAD_ONLY', '공식 페이지가 개발 정규직 신입으로 표시한다.', 'FULL_TIME', '경기', 0, '["Lua","Node.js","Redis","PostgreSQL"]', NULL, NULL, NULL, 1, 'Lua 기반 게임 클라이언트·서버 기능을 개발하는 신입 정규직으로 공식 지원 페이지가 열려 있는 채용 시 마감 공고다.', 'ACTIVE', '9e54d78d5e013ece2da80ecf56464040c6ccea28dd0e0ae64562d05e354833f1', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-856b65c06063f216d97cfb80', '스타픽시 스튜디오', 'STARTUP', '공식 회사 소개와 채용 페이지를 근거로 스타트업으로 분류했다.', '스타픽시 스튜디오 Careers', 'ui-content-programmer', 'https://starpixie.studio/recruit/ui-content-programmer', 'UI 컨텐츠 프로그래머', 'GAME_DEVELOPMENT', 'NEW_GRAD_ONLY', '공식 페이지가 개발 정규직 신입으로 표시한다.', 'FULL_TIME', '경기', 0, '["Lua","TypeScript","Python","Game UI"]', NULL, NULL, NULL, 0, '게임 UI를 구현하는 신입 정규직으로 현재 공식 지원 링크는 열려 있으나 별도 마감일 또는 상시 문구가 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', '662edb3d6072570f1821aa6bc6b40452aa2d168dc2acf61d0350237f383fed0a', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-35b9be034d8ba7236ef2a07e', '한국관세정보원', 'PUBLIC', '한국관세정보원 공식 채용 페이지의 공공기관 채용이다.', '한국관세정보원 채용', '14508', 'https://kcits.hubst.co.kr/applicantMain/goJobOpeningDetailPage.do?boardType=1&nextPage=&opnIdx=14508&orgIdx=5197&postIdx=', '2026년도 제2차 직원 채용 - 전산설비·전산OP(신입)', 'PUBLIC_ICT', 'NEW_GRAD_ONLY', '전산설비와 전산OP 모집 단위가 신입이며 제한사항 없음으로 표시된다.', 'PERMANENT_CONTRACT', '충남 천안·인천', 0, '["Information Systems","System Operations","IT Infrastructure"]', '2026-08-11T15:00:00.000Z', '2026-08-12T01:00:00.000Z', '2026-08-26T09:00:00.000Z', 0, '전산설비 운영과 관세정보시스템 모니터링을 담당하는 신입 무기계약직 공고다.', 'ACTIVE', '5069c9fd45404b1b7c97794ee1d9e15a757991fdd8ac6ecb0b3963a12b65e845', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-3bf7ac60d4d7da66e3aaa4d7', 'Nota AI', 'STARTUP', '공개 기업 소개를 근거로 AI 스타트업으로 분류했다.', '인디스워크', '387549', 'https://inthiswork.com/archives/387549', '2026 R&D Internship', 'AI_SOFTWARE', 'NEW_GRAD_ELIGIBLE', 'AI·소프트웨어 분야 7개 인턴 모집 단위와 인턴 지원 조건을 상세에서 확인했다.', 'INTERNSHIP', '서울', 0, '["Python","LLM","RAG","FastAPI","Django","SQL","Docker"]', NULL, NULL, '2026-08-23T14:59:00.000Z', 0, 'Nota AI의 AI 연구·데이터·소프트웨어 관련 2026 R&D 인턴 통합 공고다.', 'ACTIVE', '009a8ba706f496a6c0af49213378b379213d34eec1f0965b27b097c60ea2c3dc', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-d29f93c382e89246833258f7', 'LG AI Research', 'LARGE', 'LG AI Research 공식 채용 페이지의 공고다.', 'LG AI Research Careers', '161', 'https://www.lgresearch.ai/careers/view?seq=161', 'NLP Research Scientist Internship', 'AI_RESEARCH', 'NEW_GRAD_ELIGIBLE', '인턴십 직무이며 학위·기술 요건만 있고 필수 경력을 요구하지 않는다.', 'INTERNSHIP', '서울', 0, '["NLP","LLM","RAG","Python","PyTorch","TensorFlow"]', NULL, NULL, NULL, 0, '자연어처리·LLM·RAG 연구개발 인턴으로 공식 지원 폼은 열려 있으나 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', '87d0512928ee8c41afdfb3845c34fafb1b09c1671a8f4c26fb5b79edab1f5425', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-0cd8d5aac97691273171cf36', 'LG AI Research', 'LARGE', 'LG AI Research 공식 채용 페이지의 공고다.', 'LG AI Research Careers', '250', 'https://www.lgresearch.ai/careers/view?seq=250', 'Software Engineer Internship (Business Intelligence AI)', 'AI_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '컴퓨터공학 관련 재학생·졸업생을 대상으로 한 인턴십이다.', 'INTERNSHIP', '서울', 0, '["Python","Linux","LLM","Data Engineering","Kubernetes","Airflow"]', NULL, NULL, NULL, 0, '비즈니스 인텔리전스 AI 소프트웨어를 개발하는 인턴으로 공식 지원 폼은 열려 있으나 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', '86a6dcb7927c7ec19b48d357462a02e4745e753a953ab785ad6b2f539a5a888e', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-c9c4d2b305c8ce069f598a62', 'LG AI Research', 'LARGE', 'LG AI Research 공식 채용 페이지의 공고다.', 'LG AI Research Careers', '258', 'https://www.lgresearch.ai/careers/view?seq=258', 'Protein Design Research Engineer Internship', 'AI_RESEARCH', 'NEW_GRAD_ELIGIBLE', '인턴십이며 필수 경력 요건 없이 ML 개발 역량을 요구한다.', 'INTERNSHIP', '서울', 0, '["PyTorch","Keras","TensorFlow","Protein AI"]', NULL, NULL, NULL, 0, '단백질 구조·서열·결합친화도 예측 모델을 개발하는 AI 연구 인턴으로 마감일 미정 상태다.', 'DEADLINE_UNKNOWN', 'a7170282159f55321e991bc23015e5a950304a3ea95d66e6d25d2016fd44aac9', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-b3c524e3c0222cf8ad78e2a3', 'Superb AI', 'STARTUP', '공식 채용 페이지와 기업 소개를 근거로 스타트업으로 분류했다.', 'Superb AI Careers', 'MneaI5ph', 'https://careers.superb-ai.com/job_posting/MneaI5ph', 'Machine Learning Engineer (Physical AI)', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '공식 페이지가 경력 사항을 경력 무관으로 명시한다.', 'FULL_TIME', '서울', 0, '["Machine Learning","Vision-Language-Action","Reinforcement Learning","Diffusion"]', NULL, NULL, NULL, 1, 'Physical AI의 로봇·월드 파운데이션 모델을 개발하는 경력무관 정규직으로 채용 시 마감이다.', 'ACTIVE', 'e8fa8fe8fee296e7236419e3ad2d5720d151474f64f8391728caf264b76351e5', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-ca12b2109cb786f22968d7a3', 'FADU', 'MID', '공개 채용 상세와 기업 정보를 근거로 중견기업으로 분류했다.', '자소설닷컴', '105567', 'https://jasoseol.com/recruit/105567', '2026 FADU Junior Talent - Firmware Engineer', 'EMBEDDED_SOFTWARE', 'NEW_GRAD_ELIGIBLE', 'Firmware Engineer 모집 단위가 신입/경력으로 표시된다.', 'FULL_TIME', '경기 성남', 0, '["Firmware","C","Embedded Software"]', NULL, '2026-08-09T15:00:00.000Z', '2026-08-23T14:59:59.000Z', 0, 'FADU Junior Talent의 신입 지원 가능 펌웨어 개발 직무로 8월 23일까지 모집한다.', 'ACTIVE', 'cc6f3330cbeb8d5d4d10b0fab6af1aa8ad99eed52283a6de8b197bb366f3d563', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-7c8a085009d4d613f42ae196', '펄어비스', 'LARGE', '펄어비스 공식 채용 페이지의 공고다.', 'Pearl Abyss Careers', '829', 'https://www.pearlabyss.com/Company/Careers/detail?_jobOpeningNo=829', '가을 인턴십 - 엔지니어링 게임 개발 엔지니어', 'GAME_DEVELOPMENT', 'NEW_GRAD_ONLY', '공식 최신 채용 목록이 신입 인턴 프로그래밍 직무로 표시한다.', 'INTERNSHIP', '경기 과천', 0, '["Game Development","Programming"]', '2026-08-09T15:00:00.000Z', '2026-08-09T15:00:00.000Z', '2026-08-24T14:59:59.000Z', 0, '펄어비스 가을 채용연계형 인턴십의 신입 게임 개발 엔지니어 공고다.', 'ACTIVE', '595e7ff0edf37283677e568e6e43d4a2f9155adf63bc86da1378e4a08d54ce3d', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-7cfdbfa9f65abd468b757d08', '펄어비스', 'LARGE', '펄어비스 공식 채용 페이지의 공고다.', 'Pearl Abyss Careers', '830', 'https://www.pearlabyss.com/Company/Careers/detail?_jobOpeningNo=830', '가을 인턴십 - 엔지니어링 모바일플랫폼', 'MOBILE_DEVELOPMENT', 'NEW_GRAD_ONLY', '공식 최신 채용 목록이 신입 인턴 프로그래밍 직무로 표시한다.', 'INTERNSHIP', '경기 과천', 0, '["Mobile Platform","Programming"]', '2026-08-09T15:00:00.000Z', '2026-08-09T15:00:00.000Z', '2026-08-24T14:59:59.000Z', 0, '펄어비스 가을 채용연계형 인턴십의 신입 모바일플랫폼 개발 공고다.', 'ACTIVE', 'e70429511bb8b30a31f59bbff54c047ffa081f00ff50c598c413c09aad4b9dc1', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-cbd29ccd09b3c0b18859f019', '펄어비스', 'LARGE', '펄어비스 공식 채용 페이지의 공고다.', 'Pearl Abyss Careers', '831', 'https://www.pearlabyss.com/Company/Careers/detail?_jobOpeningNo=831', '가을 인턴십 - 엔지니어링 빌드시스템개발', 'DEVOPS_BUILD_SYSTEM', 'NEW_GRAD_ONLY', '공식 최신 채용 목록이 신입 인턴 프로그래밍 직무로 표시한다.', 'INTERNSHIP', '경기 과천', 0, '["Build System","DevOps","Programming"]', '2026-08-09T15:00:00.000Z', '2026-08-09T15:00:00.000Z', '2026-08-24T14:59:59.000Z', 0, '펄어비스 가을 채용연계형 인턴십의 신입 빌드시스템 개발 공고다.', 'ACTIVE', 'a75db4a53339e98e9232b3b8f7a5f30b40c570e2e861fbf839bbbc2790d932c3', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-996cd3a3846c31817ad82eef', 'SGI서울보증', 'PUBLIC', '공공 성격의 보증보험 기관 공개채용으로 분류했다.', '링커리어', '342806', 'https://linkareer.com/activity/342806', '2027년 신입사원(4급) - 전산 정보기술', 'FINANCIAL_IT', 'NEW_GRAD_ONLY', '신입 채용의 전산-정보기술 모집 단위이며 정보보호 모집 단위는 포함하지 않았다.', 'FULL_TIME', '서울 종로', 0, '["Information Technology","Financial IT"]', '2026-08-12T15:00:00.000Z', '2026-08-12T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, 'SGI서울보증 2027년 신입사원 채용의 전산 정보기술 모집 단위다. 공개된 9월 4일 마감일은 날짜 말로 정규화했다.', 'ACTIVE', '9c6fbed06c467b431065f36b5eeca31517eceda9d75c62cff7c73c7eeddabc39', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-5dcaba9f6fc75d86b61fc86f', 'Amazon Korea', 'FOREIGN', 'Amazon 공식 채용 페이지의 한국 근무 공고다.', 'Amazon Jobs', '10469995', 'https://www.amazon.jobs/en/jobs/10469995/2026-career-enhanced-re-start-program-data-center-operation-trainee-dco-data-center-operations', 'Career Enhanced Re-Start Program - Data Center Operation Trainee', 'DATA_CENTER_INFRASTRUCTURE', 'NEW_GRAD_ELIGIBLE', 'IT 분야 재진입·전환 지원자를 위한 DCO 트레이니 프로그램이다.', 'TRAINEE_CONTRACT', '서울', 0, '["Linux","Server","Network","Data Center"]', NULL, NULL, NULL, 0, '데이터센터 서버·네트워크 운영을 배우는 재취업·직무전환 트레이니 공고로 지원 버튼은 열려 있으나 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', '1f783ceb554e8815b4f203bc9fa940c1d82070d99391c53935fed521aacc2709', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-8395fc2b1e31314591bc2169', '크레비스파트너스', 'UNCLASSIFIED', '공개 상세만으로 기업 규모를 확정하지 않았다.', '인디스워크', '388006', 'https://inthiswork.com/archives/388006', 'SaaS Software Engineer 전환형 인턴', 'FULL_STACK_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '대학교 졸업예정자 또는 학사학위 보유자가 지원 가능한 전환형 인턴이다.', 'INTERNSHIP', '서울 성동', 0, '["SaaS","Web Development","Cloud","Container"]', '2026-08-18T15:00:00.000Z', '2026-08-18T15:00:00.000Z', '2026-09-01T14:59:59.000Z', 0, 'SaaS 제품을 개발하고 3개월 후 정규직 전환평가를 진행하는 소프트웨어 엔지니어 인턴이다.', 'ACTIVE', 'e0c552efd14550df935c434b4e28464d94ec848398193739dcee08ed775f3f8a', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-be239987b5a4426f35ffc1a4', '디사일로', 'STARTUP', '공식 기업 소개를 근거로 딥테크 스타트업으로 분류했다.', '디사일로 Careers', 'rJPrp0Dz', 'https://careers.desilo.ai/job_posting/rJPrp0Dz', 'System Software Engineer Intern', 'SYSTEM_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '전산 관련 학사 졸업자 및 졸업예정자가 지원 가능한 6개월 인턴이다.', 'INTERNSHIP', '서울', 0, '["C++","Python","System Software","Homomorphic Encryption"]', NULL, NULL, NULL, 1, '동형암호 라이브러리와 API를 개발하는 6개월 시스템 소프트웨어 인턴으로 채용 시 마감이다.', 'ACTIVE', '1b15f0f001e765f7c2f43c9d960329899fbdd8ea6c75f3e46fa7d922c4ef5eed', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-2f553a812750f65ac6b23c0d', 'Dalpha', 'STARTUP', '공개 기업 소개를 근거로 AI 스타트업으로 분류했다.', '인디스워크', '388671', 'https://inthiswork.com/archives/388671', 'AI Engineer (인턴/정규직)', 'AI_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '현재 상세가 학부 재학생도 지원 가능한 6개월 인턴 최소 자격 요건을 명시한다.', 'INTERNSHIP_OR_FULL_TIME', '서울 관악', 0, '["AI Agent","LLM","RAG","Data Pipeline","Vector DB"]', NULL, NULL, NULL, 0, 'AI 에이전트와 데이터 파이프라인을 구축하는 인턴·정규직 공고다. 현재 인디스워크 상세와 지원 링크는 있으나 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', '287a2d6f56345447fb035f221b37cd06c499483e571304ac1f0408632d96cd59', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-2f74b8b1777d83f86ab95f4c', 'VNTG', 'UNCLASSIFIED', '공개 상세만으로 기업 규모를 확정하지 않았다.', '인디스워크', '388409', 'https://inthiswork.com/archives/388409', '네트워크 및 인프라(서버/기타 전산시스템) 담당자', 'IT_INFRASTRUCTURE', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록에서 신입/인턴과 주니어경력 대상으로 분류된다.', 'FULL_TIME', '대한민국', 0, '["Network","Server","IT Infrastructure","Information Systems"]', NULL, NULL, NULL, 0, '네트워크·서버·전산시스템을 담당하는 신입 지원 가능 공고로 현재 인디스워크 지원 링크는 있으나 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', 'cb7a7cc5a2460da080f0fdb4ed8838e31bb8c355f031a3843f67a25ef1b843c2', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-e0c4a7fd9b33b32501729366', 'KOG', 'MID', '공개 회사 정보와 채용 상세를 근거로 중견 규모 게임사로 분류했다.', '인디스워크', '388304', 'https://inthiswork.com/archives/388304', 'DBA (상시채용)', 'DATABASE', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록에서 신입/인턴과 주니어경력 대상으로 분류된다.', 'FULL_TIME', '대구', 0, '["DBA","Database","SQL"]', NULL, NULL, NULL, 1, '게임 서비스 데이터베이스를 운영하는 신입 지원 가능 DBA 상시채용 공고다.', 'ACTIVE', '5e61dff8135e2cd18890b340a2a13e299defc66bf43e73f8dd84a7a513e43050', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-2d2177bcbd0fba04cc2a8f07', 'VoyagerX', 'STARTUP', '공개 회사 소개를 근거로 AI 스타트업으로 분류했다.', '인디스워크', '388295', 'https://inthiswork.com/archives/388295', '개발 인턴 채용', 'SOFTWARE_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 상세가 학생 또는 경력 6개월 미만 지원자를 대상으로 개발 인턴을 모집한다.', 'INTERNSHIP', '서울', 0, '["Software Development","Deep Learning","Programming"]', NULL, NULL, NULL, 0, '소프트웨어·딥러닝 개발 인턴 공고로 현재 인디스워크 상세는 유효하지만 별도 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', '7f18fe19dd318d3cb6832bb91d35b0862888da5f19cefd1f5e91f72ff3f48216', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-4bec4343ff1bbdfa9e3c850b', '금융감독원', 'PUBLIC', '금융감독원 공개채용 공고다.', '인디스워크', '388237', 'https://inthiswork.com/archives/388237', '2027년도 종합직원(5급) 채용 - 정보기술(IT)', 'FINANCIAL_IT', 'NEW_GRAD_ONLY', '공개경쟁 신입채용으로 학력·연령·전공 제한 없이 정보기술 분야 17명을 모집한다.', 'FULL_TIME', '서울', 0, '["Information Technology","Financial IT"]', '2026-08-17T15:00:00.000Z', '2026-08-18T15:00:00.000Z', '2026-09-07T03:00:00.000Z', 0, '금융감독원 2027년도 신입 종합직원 공개채용의 정보기술 분야로 17명을 모집하며 9월 7일 12시(KST) 마감이다.', 'ACTIVE', '6c31bfe0bfc16cc94f3cc85062095f2eed59fc67e6025bcdcb56a01d5b3d1dcb', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-f52b7a2648335df2274d1340', 'Upstage', 'STARTUP', '공개 회사 소개를 근거로 AI 스타트업으로 분류했다.', '인디스워크', '387562', 'https://inthiswork.com/archives/387562', 'AI DevOps Internship (정규직 전환형)', 'DEVOPS', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록이 정규직 전환형 인턴으로 분류한다.', 'INTERNSHIP', '대한민국', 1, '["DevOps","CI/CD","Cloud","Database","Monitoring"]', NULL, NULL, NULL, 0, 'AI 서비스의 배포 자동화와 운영 체계를 개발하는 정규직 전환형 인턴으로 마감일 미정 상태다.', 'DEADLINE_UNKNOWN', 'ae21044c54693324e39fd66f2626630677e1d3b9ce8a251784671ec040f125a8', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-d2f180c0ae1524c3becae618', 'Upstage', 'STARTUP', '공개 회사 소개를 근거로 AI 스타트업으로 분류했다.', '인디스워크', '387559', 'https://inthiswork.com/archives/387559', 'AI Research Engineer - Post-training Internship (체험형)', 'AI_RESEARCH', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록이 AI 연구 체험형 인턴으로 분류한다.', 'INTERNSHIP', '대한민국', 1, '["LLM","Post-training","Machine Learning","Python"]', NULL, NULL, NULL, 0, 'LLM 포스트트레이닝을 연구하는 체험형 AI 인턴으로 마감일 미정 상태다.', 'DEADLINE_UNKNOWN', '6cfd190c4f2963118f6707504cbc2ddcc10a9e80340523c4fdf91f40395233a3', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-d196c49b17a3ff90b7aa4583', 'Upstage', 'STARTUP', '공개 회사 소개를 근거로 AI 스타트업으로 분류했다.', '인디스워크', '387553', 'https://inthiswork.com/archives/387553', 'Full-Stack Product Engineer Internship (체험형)', 'FULL_STACK_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록이 풀스택 제품 개발 체험형 인턴으로 분류한다.', 'INTERNSHIP', '대한민국', 1, '["TypeScript","Python","Next.js","Full Stack","RAG"]', NULL, NULL, NULL, 0, 'AI 제품의 UI·워크플로우·데이터 시각화를 개발하는 체험형 풀스택 인턴으로 마감일 미정 상태다.', 'DEADLINE_UNKNOWN', '9884d3990188479dc07d962bf5006bfec03f2c8f73c89818b7f5a77b7fbeba10', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
VALUES ('job-b90de28e1df00e504acd6188', 'SmileShark', 'STARTUP', '공개 기업 소개를 근거로 클라우드 스타트업으로 분류했다.', '인디스워크', '387513', 'https://inthiswork.com/archives/387513', 'AWS 클라우드 엔지니어 채용전환형 인턴', 'CLOUD_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록이 신입/인턴 대상 채용전환형 인턴으로 분류한다.', 'INTERNSHIP', '서울', 0, '["AWS","Cloud","Linux","Network","Infrastructure"]', NULL, NULL, NULL, 0, 'AWS 클라우드 환경을 운영하는 채용전환형 인턴으로 현재 목록에 노출되지만 마감일이 없어 마감일 미정으로 구분했다.', 'DEADLINE_UNKNOWN', 'f635282adaa157d0250b0ab2b60cdc5a2cae1eedaa8dfe18db5931867a24e2f1', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z')
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
  ('catalog-jobs-20260821-approved-rescan', 'jobs', '391df07df2d84c9a0d49e960028dee39bfa1bbd905f3d405238297275ffb56f7', 'COMMITTED',
   29, 0, '{"existingItems":0,"incomingItems":29,"matchedItems":0,"addedItems":29,"expiredByDeadlineItems":0,"removedItems":0,"retainedUnconfirmedItems":0,"retainedExistingRollingItems":0,"storedItemsAfter":29,"visibleItemsAfter":29,"snapshotMode":"DELTA","policy":"delta-upsert; explicit-deadline-expiry; verified-rolling-retention"}', '2026-08-21T02:51:23.000Z', '2026-08-21T02:51:23.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0028_add_approved_rescan_jobs_20260821', 'sha256:391df07df2d84c9a0d49e960028dee39bfa1bbd905f3d405238297275ffb56f7', '2026-08-21T02:51:23.000Z');
--> statement-breakpoint
PRAGMA optimize;
