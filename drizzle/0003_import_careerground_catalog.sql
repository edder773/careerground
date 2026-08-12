ALTER TABLE `jobs` ADD `company_size_evidence` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD `source_posting_id` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD `career_scope` text DEFAULT 'NEW_GRAD_ELIGIBLE' NOT NULL;
--> statement-breakpoint
ALTER TABLE `jobs` ADD `career_evidence` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `jobs` ADD `employment_type` text DEFAULT 'FULL_TIME' NOT NULL;
--> statement-breakpoint
ALTER TABLE `jobs` ADD `collected_at` text;
--> statement-breakpoint
DELETE FROM collection_items WHERE (item_type = 'JOB_POSTING' AND target_id IN ('job-platform-backend', 'job-data-engineer')) OR (item_type = 'LEARNING_UNIT' AND target_id IN ('unit-http', 'unit-database'));
--> statement-breakpoint
DELETE FROM saved_jobs WHERE job_id IN ('job-platform-backend', 'job-data-engineer');
--> statement-breakpoint
DELETE FROM jobs WHERE id IN ('job-platform-backend', 'job-data-engineer') OR source_url LIKE 'https://example.com/jobs/%';
--> statement-breakpoint
DELETE FROM learning_progress WHERE unit_id IN ('unit-http', 'unit-database');
--> statement-breakpoint
DELETE FROM flashcards WHERE unit_id IN ('unit-http', 'unit-database');
--> statement-breakpoint
DELETE FROM learning_questions WHERE unit_id IN ('unit-http', 'unit-database');
--> statement-breakpoint
DELETE FROM learning_units WHERE id IN ('unit-http', 'unit-database');
--> statement-breakpoint
DELETE FROM learning_sources WHERE id = 'source-web-foundations';
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-ed759847a9e3b74d9225cbef', '콩콩프렌즈', 'SMALL', '공고의 사업장 정보에서 소규모 인원 규모를 확인', '고용24', '51257089', 'https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?infoTypeCd=CJK&infoTypeGroup=tb_workinfogubun&wantedAuthNo=51257089', '이벤트 엔지니어 채용 - Next.js·Supabase 기반 EventTech 개발', '이벤트테크 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '고용24 공고의 경력 조건이 신입·경력으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Next.js","Supabase","Frontend"]', '2026-08-13T23:59:59+09:00', 0, 'Next.js와 Supabase 기반 이벤트테크 서비스의 프론트엔드·플랫폼 기능을 개발하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-111d0e230cf5cda2c1a4de6b', 'Hudson AI', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '로켓펀치', '156625', 'https://www.rocketpunch.com/jobs/156625', 'Fullstack Engineer', 'AI 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '포지션의 경력 수준에 신입이 포함되고 상시 채용으로 표시됨', 'FULL_TIME', '미정', 0, '["Python","JavaScript","TypeScript","Django","PostgreSQL","MongoDB","React","GCP","Docker"]', NULL, 1, 'AI 서비스의 Django 백엔드와 React 프론트엔드, 데이터 저장소와 클라우드 환경을 함께 개발하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-3e35026a85e7fb9e6806a923', '페이타랩', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '로켓펀치', '156995', 'https://www.rocketpunch.com/jobs/156995', 'DevOps Engineer', 'DevOps·클라우드', 'NEW_GRAD_ELIGIBLE', '포지션의 스킬 레벨에 신입이 포함되고 상시 채용으로 표시됨', 'FULL_TIME', '서울', 0, '["AWS","Jenkins","Kubernetes","Argo CD","Terraform","Helm","ELK","Datadog","Prometheus"]', NULL, 1, '클라우드 인프라, 컨테이너 오케스트레이션, 배포 자동화와 모니터링 체계를 담당하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-f862766eb93686c04823b945', '제너레잇', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '리멤버', '318412', 'https://career.rememberapp.co.kr/job/posting/318412', 'Python Algorithm Engineer', '알고리즘·백엔드', 'NEW_GRAD_ELIGIBLE', '공고의 경력 조건이 경력 무관이며 채용 시 마감으로 표시됨', 'FULL_TIME', '서울 영등포구', 0, '["Python","Shapely","NumPy","NetworkX","SciPy","Rust","C","C++","Django","Celery","RabbitMQ"]', NULL, 1, 'Python 기반 공간·최적화 알고리즘과 백엔드 작업 파이프라인을 개발하는 경력무관 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-1970d918a225e0826495871a', '경기도 공공기관', 'PUBLIC', '공사 또는 공공기관 통합채용 공고로 확인', '링커리어', '337888', 'https://linkareer.com/activity/337888', '2026년 하반기 경기도 공공기관 통합채용 - IT/개발 분야', '공공기관 IT', 'NEW_GRAD_ONLY', '통합채용의 모집 유형이 신입이며 직무 분류에 IT/개발이 포함됨', 'FULL_TIME', '경기', 0, '["IT","Development"]', '2026-08-14T17:00:00+09:00', 0, '경기도 산하 공공기관의 IT·개발 관련 신입 직무를 포함한 통합채용.', 'NEEDS_REVIEW', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-ca4d022580f4712800b9dd74', '한국주택금융공사', 'PUBLIC', '공사 또는 공공기관 통합채용 공고로 확인', '링커리어', '339732', 'https://linkareer.com/activity/339732', '2026년도 신입직원 채용 - IT/개발 분야', '공공기관 IT', 'NEW_GRAD_ONLY', '모집 구분이 신입이며 직무 목록에 IT/개발 분야가 포함됨', 'FULL_TIME', '부산', 0, '["IT","Information Systems"]', '2026-08-20T23:59:59+09:00', 0, '주택금융 업무를 지원하는 정보시스템·IT 직군의 공공기관 신입 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-4e207cbf81ccbdc1c20b11b6', '트윔', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '사람인', '54628715', 'https://www.saramin.co.kr/zf_user/jobs/relay/pop-view?rec_idx=54628715', 'AI 플랫폼 백엔드 개발자(전문연구요원 가능)', 'AI 플랫폼 백엔드', 'NEW_GRAD_ELIGIBLE', '사람인 현재 채용 추천 영역에서 신입/경력 공고로 표시됨', 'FULL_TIME', '미정', 0, '["Backend","AI Platform"]', '2026-08-31T23:59:59+09:00', 0, 'AI 플랫폼의 서버·API와 데이터 처리 기능을 개발하는 백엔드 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-6cd4d0473952c060e351a601', '블루젠트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '사람인', '54605272', 'https://www.saramin.co.kr/zf_user/jobs/relay/pop-view?rec_idx=54605272', '차량 제어 SW 개발 연구원 모집(신입/경력)', '차량 제어 소프트웨어', 'NEW_GRAD_ELIGIBLE', '사람인 현재 채용 추천 영역에서 신입/경력으로 표시됨', 'FULL_TIME', '미정', 0, '["Automotive Software","Control Software"]', '2026-09-28T23:59:59+09:00', 0, '차량 제어 기능과 관련 소프트웨어를 연구·개발하는 신입·경력 통합 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-2067735cb74a62f3430165f5', '피트윈', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '사람인', '54584002', 'https://www.saramin.co.kr/zf_user/jobs/relay/pop-view?rec_idx=54584002', 'AI 네이티브 풀스택 개발자', 'AI 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '경력무관 공고로 표시되어 신입 지원 가능으로 판정함', 'FULL_TIME', '미정', 0, '["AI","Full Stack"]', NULL, 1, 'AI 기능을 내장한 웹 서비스의 프론트엔드와 백엔드를 개발하는 경력무관 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-4ac261e70f496b88d43fad95', '111퍼센트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '39698', 'https://www.wanted.co.kr/wd/39698', '클라이언트 개발자(신입)', '게임 클라이언트', 'NEW_GRAD_ONLY', '공고 제목과 포지션 정보에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '["Unity","C#"]', NULL, 1, '모바일 게임 클라이언트 기능과 콘텐츠를 구현하는 신입 개발자 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-5fbcd7610f61fe3d0f4670f2', '널리소프트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '239630', 'https://www.wanted.co.kr/wd/239630', '프론트엔드 개발자 (신입)', '프론트엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '["Frontend"]', NULL, 1, '웹 서비스 프론트엔드 기능과 사용자 인터페이스를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-3bcded7ce05f99bd096c3c7e', '넷커스터마이즈', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '208508', 'https://www.wanted.co.kr/wd/208508', '임베디드 SW 개발자 (신입)', '임베디드 소프트웨어', 'NEW_GRAD_ONLY', '공고 제목과 경력 항목에 신입이 명시됨', 'FULL_TIME', '대전 유성구', 0, '["C","C++","Embedded"]', NULL, 1, '임베디드 장치용 소프트웨어와 제어 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-bbf940fdb604a02b4e3fc532', '뉴링크', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '88317', 'https://www.wanted.co.kr/wd/88317', 'DevOps Engineer - 신입', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목과 경력 구분에서 신입 지원 가능이 확인됨', 'FULL_TIME', '서울', 0, '["Linux","Windows","Cloud"]', NULL, 1, '클라우드·서버 환경의 배포 자동화와 운영 기반을 담당하는 신입 DevOps 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-bcd0a596acd2a5c5dcaeeb7d', '데브시스터즈', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '86413', 'https://www.wanted.co.kr/wd/86413', '[데브시스터즈] DevOps Engineer (신입)', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목과 경력 조건에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["DevOps","Cloud"]', NULL, 1, '게임·서비스 개발 조직의 클라우드 인프라와 자동화 환경을 담당하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-31978cd9150076a986825ac4', '룰루랩', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '28556', 'https://www.wanted.co.kr/wd/28556', 'AI 알고리즘 신입 (전문연구요원)', 'AI 알고리즘', 'NEW_GRAD_ONLY', '공고 제목에 신입 및 전문연구요원 지원 가능이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["AI","Algorithm"]', NULL, 1, 'AI 알고리즘을 연구·개발하고 제품 기능에 적용하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-a886975904c559d2976a593b', '말달리자', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '290851', 'https://www.wanted.co.kr/wd/290851', '프론트엔드 개발자(신입)', '프론트엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 개발자 채용이 명시됨', 'FULL_TIME', '경북 경산시', 0, '["Frontend"]', NULL, 1, '웹 서비스 사용자 화면과 프론트엔드 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-3794e2da82ae30b6921047a6', '바딧', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '267193', 'https://www.wanted.co.kr/wd/267193', '백엔드 개발자 (신입)', '백엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 백엔드 개발자 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Backend"]', NULL, 1, '서비스 API와 서버 애플리케이션을 개발하는 신입 백엔드 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-204077a32c233c1783f996b9', '비모소프트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '228691', 'https://www.wanted.co.kr/wd/228691', '백엔드 개발자(신입)', '백엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 백엔드 개발자 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Backend"]', NULL, 1, '서비스 서버와 API를 구현하는 신입 백엔드 개발자 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-3505b0bffd524c8ca5a2d7b4', '비하베스트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '115012', 'https://www.wanted.co.kr/wd/115012', '블록체인 DevOps (신입/주니어)', '블록체인·DevOps', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/주니어 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["Blockchain","DevOps"]', NULL, 1, '블록체인 서비스의 노드·인프라 운영과 배포 자동화를 담당하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-b4b54e408f2cfee9ac40a11f', '아데나소프트웨어', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '284408', 'https://www.wanted.co.kr/wd/284408', 'DevOps Engineer(신입)', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목에 신입 채용이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["DevOps"]', NULL, 1, '소프트웨어 서비스의 인프라 자동화와 배포·운영 환경을 담당하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-ccf4308b4bb8fdf030c95c99', '와이즐리컴퍼니', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '286969', 'https://www.wanted.co.kr/wd/286969', '신입 백엔드/프론트엔드 개발자', '풀스택 웹 개발', 'NEW_GRAD_ONLY', '공고 제목에 신입 백엔드/프론트엔드 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Backend","Frontend"]', NULL, 1, '커머스 서비스의 프론트엔드와 백엔드 제품 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-665b0d4397546e7943c38b2a', '위블링', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '63937', 'https://www.wanted.co.kr/wd/63937', 'AI 연구개발 (신입 가능)', 'AI 연구개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["AI","Machine Learning"]', NULL, 1, 'AI 모델과 응용 기능을 연구·개발하고 서비스에 적용하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-150208056cfaa53321a87770', '잇마플', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '210620', 'https://www.wanted.co.kr/wd/210620', '백엔드 개발자(신입)', '백엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '["PHP","Laravel"]', NULL, 1, 'PHP·Laravel 기반 서비스 서버와 API를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-3b1134104dc4ff39d14dbea9', '쿼리파이', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '261083', 'https://www.wanted.co.kr/wd/261083', 'DevOps Engineer (신입)', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목에 신입 채용이 명시됨', 'FULL_TIME', '서울 강서구', 0, '["Terraform","CI/CD","Infrastructure as Code"]', NULL, 1, 'IaC와 CI/CD를 활용해 서비스 인프라와 배포 체계를 구축하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-15d21bedc3dc049192a2c397', '파이오링크', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '281772', 'https://www.wanted.co.kr/wd/281772', '[전문연구요원] 클라우드 개발자 (백엔드/DevOps)', '클라우드·백엔드·DevOps', 'NEW_GRAD_ONLY', '공고의 경력 구분에서 신입 지원 가능이 확인됨', 'FULL_TIME', '서울 금천구', 0, '["C","Python","Go","Cloud"]', NULL, 1, '클라우드 플랫폼의 백엔드 기능과 DevOps 도구를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-5add41d6fd23f43d3d6feb1c', '프리모리스엔젯리미티드(IKC)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '262811', 'https://www.wanted.co.kr/wd/262811', '[신입] 웹 프론트엔드/백엔드 개발자', '풀스택 웹 개발', 'NEW_GRAD_ONLY', '공고 제목에 신입 프론트엔드/백엔드 개발자 채용이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["Frontend","Backend"]', NULL, 1, '웹 서비스의 프론트엔드와 백엔드 기능을 함께 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-9f4282a35a8994cdba508655', '다우데이타', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '인디스워크', '384074', 'https://inthiswork.com/archives/384074', '[신입] Autodesk 솔루션 엔지니어 채용', 'IT 솔루션 엔지니어', 'NEW_GRAD_ONLY', '공고 제목이 신입이며 고용형태가 채용전제형 인턴으로 명시됨', 'CONVERSION_INTERN', '서울 마포구', 0, '["Autodesk","Revit","Inventor","Generative AI"]', '2026-08-24T23:59:00+09:00', 0, 'Autodesk 솔루션의 기술 요구사항 분석, 교육, 기술지원과 프로젝트 수행을 담당하는 전환형 인턴.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-6304fb620db419d3e21b57d3', 'Superb AI', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '383998', 'https://inthiswork.com/archives/383998', '[R&D] Forward Deployed Engineer (경력 무관)', '응용 AI·솔루션 엔지니어링', 'NEW_GRAD_ELIGIBLE', '자격요건에 연차 무관 및 신입 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["Computer Vision","VLM","Docker","Kubernetes","TensorRT","ONNX Runtime","OpenCV"]', NULL, 1, '비전 AI 모델과 시스템 컴포넌트를 개발하고 클라우드·엣지 환경에 배포하는 경력무관 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-b2e3d09b066ab0ecce30961c', 'Superb AI', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '383995', 'https://inthiswork.com/archives/383995', '[R&D] Machine Learning Engineer (경력 무관)', '머신러닝 연구개발', 'NEW_GRAD_ELIGIBLE', '인디스워크 목록에서 신입/인턴·주니어 태그가 표시되고 공고 제목이 경력 무관으로 안내됨', 'FULL_TIME', '미정', 0, '["Python","PyTorch","Computer Vision","VLM","MLOps","Physical AI"]', NULL, 1, 'Vision AI·파운데이션 모델·MLOps·Physical AI를 연구하고 산업 솔루션으로 제품화하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-b74a0629d475dbac71453884', '메가존클라우드', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '인디스워크', '383944', 'https://inthiswork.com/archives/383944', 'Data Engineer Junior', '데이터 엔지니어링', 'NEW_GRAD_ELIGIBLE', '포지션 정보에 경력 범위가 신입부터 8년 미만까지로 명시됨', 'FULL_TIME', '경기 과천', 0, '["SQL","Python","Spark","Databricks","Snowflake","AWS Glue","Airflow"]', NULL, 0, '클라우드 데이터 수집·정제·적재 파이프라인과 AI 데이터 기반을 설계·개발하는 주니어 포지션.', 'DEADLINE_UNKNOWN', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-15d4525c2ce3db571fc50863', '오픈엣지테크놀로지', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '384040', 'https://inthiswork.com/archives/384040', '[NPU] Firmware Engineer (전문연구요원 가능)', 'NPU 펌웨어', 'NEW_GRAD_ELIGIBLE', '인디스워크 목록에서 신입/인턴 태그가 표시되고 공고에는 연차 필수조건 없이 관련 학사 이상 요건이 제시됨', 'FULL_TIME', '서울', 0, '["C","C++","Embedded","NPU","CUDA","RISC-V"]', NULL, 0, 'NPU 연산 커널과 임베디드 펌웨어를 개발하고 성능을 분석·최적화하는 포지션.', 'DEADLINE_UNKNOWN', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-01841638bff0b1d6a5f7ca2c', '인티그레이션(메디스트림)', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '384351', 'https://inthiswork.com/archives/384351', '[클리닉 운영 플랫폼(ClinicOps)] 백엔드 엔지니어 인턴', '백엔드·데이터 플랫폼', 'NEW_GRAD_ONLY', '공고 제목이 백엔드 엔지니어 인턴이며 프로젝트 경험 중심 자격요건으로 확인됨', 'INTERN', '미정', 0, '["TypeScript","Node.js","Fastify","PostgreSQL","Redis","AWS","Kubernetes"]', NULL, 0, 'EMR·CRM 데이터 마이그레이션과 운영 백오피스를 개발하는 백엔드 엔지니어 인턴.', 'DEADLINE_UNKNOWN', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-11ecc45db71b9aaf9e3347bc', 'Cake', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '자소설닷컴', '52843', 'https://jasoseol.com/recruit/52843', '[Cake] AI/ML 개발자 모집 (신입/경력)', 'AI·머신러닝', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 정보에 신입/경력 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["AI","Machine Learning"]', NULL, 1, 'AI·머신러닝 기반 제품과 기능을 개발하는 신입·경력 통합 채용 공고.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-7186d1f5c1141a48919c2067', 'Ericsson-LG', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '54826', 'https://jasoseol.com/recruit/54826', '5G R&D 소프트웨어 개발자 (Developer) 채용', '통신 소프트웨어', 'NEW_GRAD_ELIGIBLE', '모집 직군이 신입/경력으로 표시되고 채용 시 마감 공고로 확인됨', 'FULL_TIME', '미정', 0, '["5G","R&D"]', NULL, 1, '5G 이동통신 제품 연구개발과 소프트웨어 구현을 담당하는 개발자 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-55e0e53c38fae8fcc611545f', 'Ericsson-LG', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '65700', 'https://jasoseol.com/recruit/65700', '5G RAN R&D 소프트웨어 개발자 신입/경력', '무선통신 소프트웨어', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 정보에 신입/경력 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["5G","RAN"]', NULL, 1, '5G 무선접속망 제품의 연구개발과 소프트웨어 개발을 담당하는 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-1c65ab344f97871d2dee7d62', 'Ericsson-LG', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '86227', 'https://jasoseol.com/recruit/86227', 'Packet Core R&D 소프트웨어 개발자 신입 및 경력사원 하반기 채용', '통신 코어 소프트웨어', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 정보에 신입 및 경력 채용이 명시됨', 'FULL_TIME', '미정', 0, '["5G","Packet Core"]', NULL, 1, '5G 패킷 코어 영역의 연구개발과 소프트웨어 구현을 수행하는 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-25c7e476c88c391bf036a147', '백패커(아이디어스)', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '자소설닷컴', '66828', 'https://jasoseol.com/recruit/66828', 'iOS 개발자 (신입 ~ 경력 3년 미만)', 'iOS 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입부터 경력 3년 미만까지 지원 가능하다고 명시됨', 'FULL_TIME', '미정', 0, '["iOS"]', NULL, 1, '아이디어스 모바일 서비스의 iOS 기능을 개발하는 신입·주니어 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-57751b96c59aa3dfea1b4a25', '에이스아메리칸화재해상보험', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '65011', 'https://jasoseol.com/recruit/65011', 'IT 개발자 모집 (신입)', '기업 IT 개발', 'NEW_GRAD_ONLY', '공고 제목과 지원 구분에 신입 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Enterprise IT"]', NULL, 1, '보험 업무 시스템과 사내 IT 서비스를 개발·운영하는 신입 개발자 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-22a2bb911529855b5d836781', '엔피씨', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '자소설닷컴', '58573', 'https://jasoseol.com/recruit/58573', '연구소 신입/경력 개발자 모집', '웹·앱·IoT 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 연구소 개발자 신입/경력 모집이 명시됨', 'FULL_TIME', '미정', 0, '["Web","App","IoT"]', NULL, 1, '웹·앱 프로그램과 스마트 물류·IoT 관련 시스템을 개발하는 연구소 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-7c3564d766900764b0f15501', '스콘에이아이', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '잡코리아', '49495962', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49495962', 'AI 통역 서비스 프론트엔드 개발자 채용(신입 및 경력)', '프론트엔드·AI 서비스', 'NEW_GRAD_ELIGIBLE', '공고 제목과 경력 조건에 신입 및 경력 지원 가능이 명시됨', 'CONTRACT_TO_FULL_TIME', '서울', 0, '["Frontend","AI"]', NULL, 1, 'AI 통역 서비스의 웹 프론트엔드와 사용자 기능을 개발하는 신입·경력 통합 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-f7d29644e488a7bdb96bd822', '에스에이치랩(SHLab)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '잡코리아', '49580624', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49580624', 'AI·임베디드·IoT 신입/경력 사원 모집', 'AI·임베디드·IoT', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/경력 모집이 명시되고 기업 채용 페이지에서 채용중으로 표시됨', 'FULL_TIME', '서울', 0, '["AI","Embedded","IoT"]', NULL, 1, 'AI와 임베디드·IoT 기술을 활용한 제품·서비스 개발을 담당하는 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-cdcd855f103a68d4b18f1166', '에스에이치랩(SHLab)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '잡코리아', '49366713', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49366713', 'C#·파이썬 소프트웨어 개발자 모집', '응용 소프트웨어 개발', 'NEW_GRAD_ELIGIBLE', '기업 채용 페이지에서 현재 모집중인 소프트웨어 개발 공고로 확인되고 신입 지원 가능 범주에 노출됨', 'FULL_TIME', '서울', 0, '["C#","Python"]', NULL, 1, 'C#과 Python을 활용해 응용 소프트웨어와 서비스 기능을 개발하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-b772e5643980a446275c7b5a', '에스에이치랩(SHLab)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '잡코리아', '49431728', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49431728', '웹/소프트웨어 개발자 신입/경력 모집', '웹·소프트웨어 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/경력 지원 가능이 명시되고 기업 채용 페이지에서 채용중으로 표시됨', 'FULL_TIME', '서울', 0, '["Web","Software"]', NULL, 1, '웹 애플리케이션과 업무 소프트웨어를 개발하는 신입·경력 통합 채용.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-96cda262a73d7d24922167e9', '나무기술', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '점핏', '54486073', 'https://jumpit.saramin.co.kr/position/54486073', '[신입] Citrix 네트워크 엔지니어', '네트워크 엔지니어', 'NEW_GRAD_ONLY', '경력 항목과 자격요건에 신입·경력무관이 명시됨', 'FULL_TIME', '서울 강서구', 0, '["VPN","L7","Citrix Gateway","TCP/IP"]', '2026-08-14T23:59:59+09:00', 0, 'Citrix 네트워크 제품 구축 프로젝트와 L7·게이트웨이 기술지원을 담당하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-7be6eb856fa0f3bf9e6df455', '비에이치에스티', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '점핏', '54485299', 'https://jumpit.saramin.co.kr/position/54485299', '설비 펌웨어 개발 엔지니어(신입)', '펌웨어·장비 소프트웨어', 'NEW_GRAD_ONLY', '경력 항목에 신입이 명시됨', 'FULL_TIME', '충남 아산시', 0, '["C","C++","C#","Embedded","MFC"]', '2026-08-16T23:59:59+09:00', 0, '반도체·디스플레이 장비의 펌웨어, Windows 애플리케이션, 제어 로직을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-bcf76b4bc65a01015ef37c1d', '지니수', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '점핏', '54503227', 'https://jumpit.saramin.co.kr/position/54503227', '[인턴] 프롭테크 플랫폼 서비스 개발', '프롭테크 풀스택 개발', 'NEW_GRAD_ONLY', '경력 항목에 신입이 명시되고 정규직 전환형 개발 인턴으로 안내됨', 'CONVERSION_INTERN', '대전 유성구', 0, '["Next.js","TypeScript","Zustand","Tailwind CSS","Supabase","GitHub"]', '2026-08-18T23:59:59+09:00', 0, 'Next.js·TypeScript·Supabase 기반 프롭테크 서비스를 리팩터링하고 신규 기능을 개발하는 전환형 인턴.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-bf2413afda23e641340c417f', '비스텔리젼스', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '점핏', '54556241', 'https://jumpit.saramin.co.kr/position/54556241', 'AI Engineer (신입)', 'AI 에이전트 개발', 'NEW_GRAD_ONLY', '경력 항목에 신입이 명시됨', 'FULL_TIME', '서울 서초구', 0, '["Git","NumPy","Pandas","Python","SQL","RAG","LangChain"]', '2026-08-22T23:59:59+09:00', 0, 'Python·RAG·에이전트 프레임워크를 활용해 제조 분야 AI 에이전트와 응용 서비스를 개발하는 포지션.', 'ACTIVE', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
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
  deadline_at = excluded.deadline_at,
  rolling = excluded.rolling,
  summary = excluded.summary,
  status = excluded.status,
  collected_at = excluded.collected_at,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120803', 'https://school.programmers.co.kr/learn/courses/30/lessons/120803', '두 수의 차', 0, '[]', 0, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120804', 'https://school.programmers.co.kr/learn/courses/30/lessons/120804', '두 수의 곱', 0, '[]', 1, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120805', 'https://school.programmers.co.kr/learn/courses/30/lessons/120805', '몫 구하기', 0, '[]', 2, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120806', 'https://school.programmers.co.kr/learn/courses/30/lessons/120806', '두 수의 나눗셈', 0, '[]', 3, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120807', 'https://school.programmers.co.kr/learn/courses/30/lessons/120807', '숫자 비교하기', 0, '[]', 4, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120808', 'https://school.programmers.co.kr/learn/courses/30/lessons/120808', '분수의 덧셈', 0, '[]', 5, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120809', 'https://school.programmers.co.kr/learn/courses/30/lessons/120809', '배열 두배 만들기', 0, '[]', 6, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120810', 'https://school.programmers.co.kr/learn/courses/30/lessons/120810', '나머지 구하기', 0, '[]', 7, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120813', 'https://school.programmers.co.kr/learn/courses/30/lessons/120813', '짝수는 싫어요', 0, '[]', 8, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120814', 'https://school.programmers.co.kr/learn/courses/30/lessons/120814', '피자 나눠 먹기 (1)', 0, '[]', 9, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120815', 'https://school.programmers.co.kr/learn/courses/30/lessons/120815', '피자 나눠 먹기 (2)', 0, '[]', 10, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120818', 'https://school.programmers.co.kr/learn/courses/30/lessons/120818', '옷가게 할인 받기', 0, '[]', 11, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120819', 'https://school.programmers.co.kr/learn/courses/30/lessons/120819', '아이스 아메리카노', 0, '[]', 12, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120820', 'https://school.programmers.co.kr/learn/courses/30/lessons/120820', '나이 출력', 0, '[]', 13, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120823', 'https://school.programmers.co.kr/learn/courses/30/lessons/120823', '직각삼각형 출력하기', 0, '[]', 14, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120824', 'https://school.programmers.co.kr/learn/courses/30/lessons/120824', '짝수 홀수 개수', 0, '[]', 15, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120826', 'https://school.programmers.co.kr/learn/courses/30/lessons/120826', '특정 문자 제거하기', 0, '[]', 16, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120830', 'https://school.programmers.co.kr/learn/courses/30/lessons/120830', '양꼬치', 0, '[]', 17, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120833', 'https://school.programmers.co.kr/learn/courses/30/lessons/120833', '배열 자르기', 0, '[]', 18, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120834', 'https://school.programmers.co.kr/learn/courses/30/lessons/120834', '외계행성의 나이', 0, '[]', 19, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120838', 'https://school.programmers.co.kr/learn/courses/30/lessons/120838', '모스부호 (1)', 0, '[]', 20, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120839', 'https://school.programmers.co.kr/learn/courses/30/lessons/120839', '가위 바위 보', 0, '[]', 21, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120840', 'https://school.programmers.co.kr/learn/courses/30/lessons/120840', '구슬을 나누는 경우의 수', 0, '[]', 22, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120842', 'https://school.programmers.co.kr/learn/courses/30/lessons/120842', '2차원으로 만들기', 0, '[]', 23, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120843', 'https://school.programmers.co.kr/learn/courses/30/lessons/120843', '공 던지기', 0, '[]', 24, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120846', 'https://school.programmers.co.kr/learn/courses/30/lessons/120846', '합성수 찾기', 0, '[]', 25, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120847', 'https://school.programmers.co.kr/learn/courses/30/lessons/120847', '최댓값 만들기 (1)', 0, '[]', 26, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120848', 'https://school.programmers.co.kr/learn/courses/30/lessons/120848', '팩토리얼', 0, '[]', 27, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120849', 'https://school.programmers.co.kr/learn/courses/30/lessons/120849', '모음 제거', 0, '[]', 28, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120850', 'https://school.programmers.co.kr/learn/courses/30/lessons/120850', '문자열 정렬하기 (1)', 0, '[]', 29, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120851', 'https://school.programmers.co.kr/learn/courses/30/lessons/120851', '숨어있는 숫자의 덧셈 (1)', 0, '[]', 30, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120852', 'https://school.programmers.co.kr/learn/courses/30/lessons/120852', '소인수분해', 0, '[]', 31, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120853', 'https://school.programmers.co.kr/learn/courses/30/lessons/120853', '컨트롤 제트', 0, '[]', 32, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120860', 'https://school.programmers.co.kr/learn/courses/30/lessons/120860', '직사각형 넓이 구하기', 0, '[]', 33, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120861', 'https://school.programmers.co.kr/learn/courses/30/lessons/120861', '캐릭터의 좌표', 0, '[]', 34, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120863', 'https://school.programmers.co.kr/learn/courses/30/lessons/120863', '다항식 더하기', 0, '[]', 35, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120864', 'https://school.programmers.co.kr/learn/courses/30/lessons/120864', '숨어있는 숫자의 덧셈 (2)', 0, '[]', 36, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120866', 'https://school.programmers.co.kr/learn/courses/30/lessons/120866', '안전지대', 0, '[]', 37, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120868', 'https://school.programmers.co.kr/learn/courses/30/lessons/120868', '삼각형의 완성조건 (2)', 0, '[]', 38, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120869', 'https://school.programmers.co.kr/learn/courses/30/lessons/120869', '외계어 사전', 0, '[]', 39, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120871', 'https://school.programmers.co.kr/learn/courses/30/lessons/120871', '저주의 숫자 3', 0, '[]', 40, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120882', 'https://school.programmers.co.kr/learn/courses/30/lessons/120882', '등수 매기기', 0, '[]', 41, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120883', 'https://school.programmers.co.kr/learn/courses/30/lessons/120883', '로그인 성공?', 0, '[]', 42, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120884', 'https://school.programmers.co.kr/learn/courses/30/lessons/120884', '치킨 쿠폰', 0, '[]', 43, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120885', 'https://school.programmers.co.kr/learn/courses/30/lessons/120885', '이진수 더하기', 0, '[]', 44, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120886', 'https://school.programmers.co.kr/learn/courses/30/lessons/120886', 'A로 B 만들기', 0, '[]', 45, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120888', 'https://school.programmers.co.kr/learn/courses/30/lessons/120888', '중복된 문자 제거', 0, '[]', 46, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120889', 'https://school.programmers.co.kr/learn/courses/30/lessons/120889', '삼각형의 완성조건 (1)', 0, '[]', 47, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120890', 'https://school.programmers.co.kr/learn/courses/30/lessons/120890', '가까운 수', 0, '[]', 48, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120891', 'https://school.programmers.co.kr/learn/courses/30/lessons/120891', '369게임', 0, '[]', 49, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120894', 'https://school.programmers.co.kr/learn/courses/30/lessons/120894', '영어가 싫어요', 0, '[]', 50, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120896', 'https://school.programmers.co.kr/learn/courses/30/lessons/120896', '한 번만 등장한 문자', 0, '[]', 51, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120897', 'https://school.programmers.co.kr/learn/courses/30/lessons/120897', '약수 구하기', 0, '[]', 52, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120898', 'https://school.programmers.co.kr/learn/courses/30/lessons/120898', '편지', 0, '[]', 53, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120899', 'https://school.programmers.co.kr/learn/courses/30/lessons/120899', '가장 큰 수 찾기', 0, '[]', 54, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120902', 'https://school.programmers.co.kr/learn/courses/30/lessons/120902', '문자열 계산하기', 0, '[]', 55, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120903', 'https://school.programmers.co.kr/learn/courses/30/lessons/120903', '배열의 유사도', 0, '[]', 56, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120904', 'https://school.programmers.co.kr/learn/courses/30/lessons/120904', '숫자 찾기', 0, '[]', 57, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120906', 'https://school.programmers.co.kr/learn/courses/30/lessons/120906', '자릿수 더하기', 0, '[]', 58, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120908', 'https://school.programmers.co.kr/learn/courses/30/lessons/120908', '문자열안에 문자열', 0, '[]', 59, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120909', 'https://school.programmers.co.kr/learn/courses/30/lessons/120909', '제곱수 판별하기', 0, '[]', 60, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120911', 'https://school.programmers.co.kr/learn/courses/30/lessons/120911', '문자열 정렬하기 (2)', 0, '[]', 61, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120912', 'https://school.programmers.co.kr/learn/courses/30/lessons/120912', '7의 개수', 0, '[]', 62, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120913', 'https://school.programmers.co.kr/learn/courses/30/lessons/120913', '잘라서 배열로 저장하기', 0, '[]', 63, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120922', 'https://school.programmers.co.kr/learn/courses/30/lessons/120922', '종이 자르기', 0, '[]', 64, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120924', 'https://school.programmers.co.kr/learn/courses/30/lessons/120924', '다음에 올 숫자', 0, '[]', 65, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-120956', 'https://school.programmers.co.kr/learn/courses/30/lessons/120956', '옹알이 (1)', 0, '[]', 66, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181829', 'https://school.programmers.co.kr/learn/courses/30/lessons/181829', '이차원 배열 대각선 순회하기', 0, '[]', 67, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181830', 'https://school.programmers.co.kr/learn/courses/30/lessons/181830', '정사각형으로 만들기', 0, '[]', 68, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181831', 'https://school.programmers.co.kr/learn/courses/30/lessons/181831', '특별한 이차원 배열 2', 0, '[]', 69, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181832', 'https://school.programmers.co.kr/learn/courses/30/lessons/181832', '정수를 나선형으로 배치하기', 0, '[]', 70, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181833', 'https://school.programmers.co.kr/learn/courses/30/lessons/181833', '특별한 이차원 배열 1', 0, '[]', 71, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181834', 'https://school.programmers.co.kr/learn/courses/30/lessons/181834', 'l로 만들기', 0, '[]', 72, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181835', 'https://school.programmers.co.kr/learn/courses/30/lessons/181835', '조건에 맞게 수열 변환하기 3', 0, '[]', 73, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181836', 'https://school.programmers.co.kr/learn/courses/30/lessons/181836', '그림 확대', 0, '[]', 74, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181837', 'https://school.programmers.co.kr/learn/courses/30/lessons/181837', '커피 심부름', 0, '[]', 75, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181838', 'https://school.programmers.co.kr/learn/courses/30/lessons/181838', '날짜 비교하기', 0, '[]', 76, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181839', 'https://school.programmers.co.kr/learn/courses/30/lessons/181839', '주사위 게임 1', 0, '[]', 77, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181840', 'https://school.programmers.co.kr/learn/courses/30/lessons/181840', '정수 찾기', 0, '[]', 78, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181841', 'https://school.programmers.co.kr/learn/courses/30/lessons/181841', '꼬리 문자열', 0, '[]', 79, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181842', 'https://school.programmers.co.kr/learn/courses/30/lessons/181842', '부분 문자열', 0, '[]', 80, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181843', 'https://school.programmers.co.kr/learn/courses/30/lessons/181843', '부분 문자열인지 확인하기', 0, '[]', 81, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181844', 'https://school.programmers.co.kr/learn/courses/30/lessons/181844', '배열의 원소 삭제하기', 0, '[]', 82, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181845', 'https://school.programmers.co.kr/learn/courses/30/lessons/181845', '문자열로 변환', 0, '[]', 83, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181846', 'https://school.programmers.co.kr/learn/courses/30/lessons/181846', '두 수의 합', 0, '[]', 84, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181847', 'https://school.programmers.co.kr/learn/courses/30/lessons/181847', '0 떼기', 0, '[]', 85, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181849', 'https://school.programmers.co.kr/learn/courses/30/lessons/181849', '문자열 정수의 합', 0, '[]', 86, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181850', 'https://school.programmers.co.kr/learn/courses/30/lessons/181850', '정수 부분', 0, '[]', 87, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181851', 'https://school.programmers.co.kr/learn/courses/30/lessons/181851', '전국 대회 선발 고사', 0, '[]', 88, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181852', 'https://school.programmers.co.kr/learn/courses/30/lessons/181852', '뒤에서 5등 위로', 0, '[]', 89, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181853', 'https://school.programmers.co.kr/learn/courses/30/lessons/181853', '뒤에서 5등까지', 0, '[]', 90, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181854', 'https://school.programmers.co.kr/learn/courses/30/lessons/181854', '배열의 길이에 따라 다른 연산하기', 0, '[]', 91, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181855', 'https://school.programmers.co.kr/learn/courses/30/lessons/181855', '문자열 묶기', 0, '[]', 92, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181856', 'https://school.programmers.co.kr/learn/courses/30/lessons/181856', '배열 비교하기', 0, '[]', 93, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181857', 'https://school.programmers.co.kr/learn/courses/30/lessons/181857', '배열의 길이를 2의 거듭제곱으로 만들기', 0, '[]', 94, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181858', 'https://school.programmers.co.kr/learn/courses/30/lessons/181858', '무작위로 K개의 수 뽑기', 0, '[]', 95, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181859', 'https://school.programmers.co.kr/learn/courses/30/lessons/181859', '배열 만들기 6', 0, '[]', 96, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181860', 'https://school.programmers.co.kr/learn/courses/30/lessons/181860', '빈 배열에 추가, 삭제하기', 0, '[]', 97, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181861', 'https://school.programmers.co.kr/learn/courses/30/lessons/181861', '배열의 원소만큼 추가하기', 0, '[]', 98, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181862', 'https://school.programmers.co.kr/learn/courses/30/lessons/181862', '세 개의 구분자', 0, '[]', 99, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181863', 'https://school.programmers.co.kr/learn/courses/30/lessons/181863', 'rny_string', 0, '[]', 100, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181864', 'https://school.programmers.co.kr/learn/courses/30/lessons/181864', '문자열 바꿔서 찾기', 0, '[]', 101, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181865', 'https://school.programmers.co.kr/learn/courses/30/lessons/181865', '간단한 식 계산하기', 0, '[]', 102, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181866', 'https://school.programmers.co.kr/learn/courses/30/lessons/181866', '문자열 잘라서 정렬하기', 0, '[]', 103, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181867', 'https://school.programmers.co.kr/learn/courses/30/lessons/181867', 'x 사이의 개수', 0, '[]', 104, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181868', 'https://school.programmers.co.kr/learn/courses/30/lessons/181868', '공백으로 구분하기 2', 0, '[]', 105, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181869', 'https://school.programmers.co.kr/learn/courses/30/lessons/181869', '공백으로 구분하기 1', 0, '[]', 106, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181870', 'https://school.programmers.co.kr/learn/courses/30/lessons/181870', 'ad 제거하기', 0, '[]', 107, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181871', 'https://school.programmers.co.kr/learn/courses/30/lessons/181871', '문자열이 몇 번 등장하는지 세기', 0, '[]', 108, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181872', 'https://school.programmers.co.kr/learn/courses/30/lessons/181872', '특정 문자열로 끝나는 가장 긴 부분 문자열 찾기', 0, '[]', 109, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181873', 'https://school.programmers.co.kr/learn/courses/30/lessons/181873', '특정한 문자를 대문자로 바꾸기', 0, '[]', 110, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181874', 'https://school.programmers.co.kr/learn/courses/30/lessons/181874', 'A 강조하기', 0, '[]', 111, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181875', 'https://school.programmers.co.kr/learn/courses/30/lessons/181875', '배열에서 문자열 대소문자 변환하기', 0, '[]', 112, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181877', 'https://school.programmers.co.kr/learn/courses/30/lessons/181877', '대문자로 바꾸기', 0, '[]', 113, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181878', 'https://school.programmers.co.kr/learn/courses/30/lessons/181878', '원하는 문자열 찾기', 0, '[]', 114, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181879', 'https://school.programmers.co.kr/learn/courses/30/lessons/181879', '길이에 따른 연산', 0, '[]', 115, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181880', 'https://school.programmers.co.kr/learn/courses/30/lessons/181880', '1로 만들기', 0, '[]', 116, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181881', 'https://school.programmers.co.kr/learn/courses/30/lessons/181881', '조건에 맞게 수열 변환하기 2', 0, '[]', 117, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181882', 'https://school.programmers.co.kr/learn/courses/30/lessons/181882', '조건에 맞게 수열 변환하기 1', 0, '[]', 118, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181883', 'https://school.programmers.co.kr/learn/courses/30/lessons/181883', '수열과 구간 쿼리 1', 0, '[]', 119, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181884', 'https://school.programmers.co.kr/learn/courses/30/lessons/181884', 'n보다 커질 때까지 더하기', 0, '[]', 120, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181885', 'https://school.programmers.co.kr/learn/courses/30/lessons/181885', '할 일 목록', 0, '[]', 121, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181886', 'https://school.programmers.co.kr/learn/courses/30/lessons/181886', '5명씩', 0, '[]', 122, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181887', 'https://school.programmers.co.kr/learn/courses/30/lessons/181887', '홀수 vs 짝수', 0, '[]', 123, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181888', 'https://school.programmers.co.kr/learn/courses/30/lessons/181888', 'n개 간격의 원소들', 0, '[]', 124, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181889', 'https://school.programmers.co.kr/learn/courses/30/lessons/181889', 'n 번째 원소까지', 0, '[]', 125, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181890', 'https://school.programmers.co.kr/learn/courses/30/lessons/181890', '왼쪽 오른쪽', 0, '[]', 126, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181891', 'https://school.programmers.co.kr/learn/courses/30/lessons/181891', '순서 바꾸기', 0, '[]', 127, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181892', 'https://school.programmers.co.kr/learn/courses/30/lessons/181892', 'n 번째 원소부터', 0, '[]', 128, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181893', 'https://school.programmers.co.kr/learn/courses/30/lessons/181893', '배열 조각하기', 0, '[]', 129, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181894', 'https://school.programmers.co.kr/learn/courses/30/lessons/181894', '2의 영역', 0, '[]', 130, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181895', 'https://school.programmers.co.kr/learn/courses/30/lessons/181895', '배열 만들기 3', 0, '[]', 131, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181896', 'https://school.programmers.co.kr/learn/courses/30/lessons/181896', '첫 번째로 나오는 음수', 0, '[]', 132, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181897', 'https://school.programmers.co.kr/learn/courses/30/lessons/181897', '리스트 자르기', 0, '[]', 133, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181898', 'https://school.programmers.co.kr/learn/courses/30/lessons/181898', '가까운 1 찾기', 0, '[]', 134, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181899', 'https://school.programmers.co.kr/learn/courses/30/lessons/181899', '카운트 다운', 0, '[]', 135, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181900', 'https://school.programmers.co.kr/learn/courses/30/lessons/181900', '글자 지우기', 0, '[]', 136, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181901', 'https://school.programmers.co.kr/learn/courses/30/lessons/181901', '배열 만들기 1', 0, '[]', 137, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181902', 'https://school.programmers.co.kr/learn/courses/30/lessons/181902', '문자 개수 세기', 0, '[]', 138, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181903', 'https://school.programmers.co.kr/learn/courses/30/lessons/181903', 'qr code', 0, '[]', 139, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181904', 'https://school.programmers.co.kr/learn/courses/30/lessons/181904', '세로 읽기', 0, '[]', 140, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181905', 'https://school.programmers.co.kr/learn/courses/30/lessons/181905', '문자열 뒤집기', 0, '[]', 141, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181906', 'https://school.programmers.co.kr/learn/courses/30/lessons/181906', '접두사인지 확인하기', 0, '[]', 142, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181907', 'https://school.programmers.co.kr/learn/courses/30/lessons/181907', '문자열의 앞의 n글자', 0, '[]', 143, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181908', 'https://school.programmers.co.kr/learn/courses/30/lessons/181908', '접미사인지 확인하기', 0, '[]', 144, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181909', 'https://school.programmers.co.kr/learn/courses/30/lessons/181909', '접미사 배열', 0, '[]', 145, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181910', 'https://school.programmers.co.kr/learn/courses/30/lessons/181910', '문자열의 뒤의 n글자', 0, '[]', 146, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181911', 'https://school.programmers.co.kr/learn/courses/30/lessons/181911', '부분 문자열 이어 붙여 문자열 만들기', 0, '[]', 147, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181912', 'https://school.programmers.co.kr/learn/courses/30/lessons/181912', '배열 만들기 5', 0, '[]', 148, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181913', 'https://school.programmers.co.kr/learn/courses/30/lessons/181913', '문자열 여러 번 뒤집기', 0, '[]', 149, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181914', 'https://school.programmers.co.kr/learn/courses/30/lessons/181914', '9로 나눈 나머지', 0, '[]', 150, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181915', 'https://school.programmers.co.kr/learn/courses/30/lessons/181915', '글자 이어 붙여 문자열 만들기', 0, '[]', 151, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181916', 'https://school.programmers.co.kr/learn/courses/30/lessons/181916', '주사위 게임 3', 0, '[]', 152, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181917', 'https://school.programmers.co.kr/learn/courses/30/lessons/181917', '간단한 논리 연산', 0, '[]', 153, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181918', 'https://school.programmers.co.kr/learn/courses/30/lessons/181918', '배열 만들기 4', 0, '[]', 154, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181919', 'https://school.programmers.co.kr/learn/courses/30/lessons/181919', '콜라츠 수열 만들기', 0, '[]', 155, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181920', 'https://school.programmers.co.kr/learn/courses/30/lessons/181920', '카운트 업', 0, '[]', 156, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181921', 'https://school.programmers.co.kr/learn/courses/30/lessons/181921', '배열 만들기 2', 0, '[]', 157, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181922', 'https://school.programmers.co.kr/learn/courses/30/lessons/181922', '수열과 구간 쿼리 4', 0, '[]', 158, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181923', 'https://school.programmers.co.kr/learn/courses/30/lessons/181923', '수열과 구간 쿼리 2', 0, '[]', 159, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181924', 'https://school.programmers.co.kr/learn/courses/30/lessons/181924', '수열과 구간 쿼리 3', 0, '[]', 160, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181925', 'https://school.programmers.co.kr/learn/courses/30/lessons/181925', '수 조작하기 2', 0, '[]', 161, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181926', 'https://school.programmers.co.kr/learn/courses/30/lessons/181926', '수 조작하기 1', 0, '[]', 162, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181927', 'https://school.programmers.co.kr/learn/courses/30/lessons/181927', '마지막 두 원소', 0, '[]', 163, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181928', 'https://school.programmers.co.kr/learn/courses/30/lessons/181928', '이어 붙인 수', 0, '[]', 164, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181929', 'https://school.programmers.co.kr/learn/courses/30/lessons/181929', '원소들의 곱과 합', 0, '[]', 165, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181931', 'https://school.programmers.co.kr/learn/courses/30/lessons/181931', '등차수열의 특정한 항만 더하기', 0, '[]', 166, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181933', 'https://school.programmers.co.kr/learn/courses/30/lessons/181933', 'flag에 따라 다른 값 반환하기', 0, '[]', 167, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181935', 'https://school.programmers.co.kr/learn/courses/30/lessons/181935', '홀짝에 따라 다른 값 반환하기', 0, '[]', 168, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181937', 'https://school.programmers.co.kr/learn/courses/30/lessons/181937', 'n의 배수', 0, '[]', 169, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181938', 'https://school.programmers.co.kr/learn/courses/30/lessons/181938', '두 수의 연산값 비교하기', 0, '[]', 170, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181939', 'https://school.programmers.co.kr/learn/courses/30/lessons/181939', '더 크게 합치기', 0, '[]', 171, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181940', 'https://school.programmers.co.kr/learn/courses/30/lessons/181940', '문자열 곱하기', 0, '[]', 172, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181941', 'https://school.programmers.co.kr/learn/courses/30/lessons/181941', '문자 리스트를 문자열로 변환하기', 0, '[]', 173, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181942', 'https://school.programmers.co.kr/learn/courses/30/lessons/181942', '문자열 섞기', 0, '[]', 174, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181943', 'https://school.programmers.co.kr/learn/courses/30/lessons/181943', '문자열 겹쳐쓰기', 0, '[]', 175, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181944', 'https://school.programmers.co.kr/learn/courses/30/lessons/181944', '홀짝 구분하기', 0, '[]', 176, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181945', 'https://school.programmers.co.kr/learn/courses/30/lessons/181945', '문자열 돌리기', 0, '[]', 177, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181946', 'https://school.programmers.co.kr/learn/courses/30/lessons/181946', '문자열 붙여서 출력하기', 0, '[]', 178, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181947', 'https://school.programmers.co.kr/learn/courses/30/lessons/181947', '덧셈식 출력하기', 0, '[]', 179, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181948', 'https://school.programmers.co.kr/learn/courses/30/lessons/181948', '특수문자 출력하기', 0, '[]', 180, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181949', 'https://school.programmers.co.kr/learn/courses/30/lessons/181949', '대소문자 바꿔서 출력하기', 0, '[]', 181, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181951', 'https://school.programmers.co.kr/learn/courses/30/lessons/181951', 'a와 b 출력하기', 0, '[]', 182, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-181952', 'https://school.programmers.co.kr/learn/courses/30/lessons/181952', '문자열 출력하기', 0, '[]', 183, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-250132', 'https://school.programmers.co.kr/learn/courses/30/lessons/250132', '[PCCE 기출문제] 2번 / 피타고라스의 정리', 0, '["PCCE"]', 184, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-340200', 'https://school.programmers.co.kr/learn/courses/30/lessons/340200', '[PCCE 기출문제] 8번 / 닉네임 규칙', 0, '["PCCE"]', 185, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-1845', 'https://school.programmers.co.kr/learn/courses/30/lessons/1845', '폰켓몬', 1, '[]', 186, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12901', 'https://school.programmers.co.kr/learn/courses/30/lessons/12901', '2016년', 1, '[]', 187, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12903', 'https://school.programmers.co.kr/learn/courses/30/lessons/12903', '가운데 글자 가져오기', 1, '[]', 188, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12906', 'https://school.programmers.co.kr/learn/courses/30/lessons/12906', '같은 숫자는 싫어', 1, '[]', 189, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12910', 'https://school.programmers.co.kr/learn/courses/30/lessons/12910', '나누어 떨어지는 숫자 배열', 1, '[]', 190, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12912', 'https://school.programmers.co.kr/learn/courses/30/lessons/12912', '두 정수 사이의 합', 1, '[]', 191, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12915', 'https://school.programmers.co.kr/learn/courses/30/lessons/12915', '문자열 내 마음대로 정렬하기', 1, '[]', 192, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12916', 'https://school.programmers.co.kr/learn/courses/30/lessons/12916', '문자열 내 p와 y의 개수', 1, '[]', 193, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12917', 'https://school.programmers.co.kr/learn/courses/30/lessons/12917', '문자열 내림차순으로 배치하기', 1, '[]', 194, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12918', 'https://school.programmers.co.kr/learn/courses/30/lessons/12918', '문자열 다루기 기본', 1, '[]', 195, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12919', 'https://school.programmers.co.kr/learn/courses/30/lessons/12919', '서울에서 김서방 찾기', 1, '[]', 196, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12921', 'https://school.programmers.co.kr/learn/courses/30/lessons/12921', '소수 찾기', 1, '[]', 197, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12922', 'https://school.programmers.co.kr/learn/courses/30/lessons/12922', '수박수박수박수박수박수?', 1, '[]', 198, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12925', 'https://school.programmers.co.kr/learn/courses/30/lessons/12925', '문자열을 정수로 바꾸기', 1, '[]', 199, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12926', 'https://school.programmers.co.kr/learn/courses/30/lessons/12926', '시저 암호', 1, '[]', 200, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12928', 'https://school.programmers.co.kr/learn/courses/30/lessons/12928', '약수의 합', 1, '[]', 201, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12930', 'https://school.programmers.co.kr/learn/courses/30/lessons/12930', '이상한 문자 만들기', 1, '[]', 202, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12931', 'https://school.programmers.co.kr/learn/courses/30/lessons/12931', '자릿수 더하기', 1, '[]', 203, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12932', 'https://school.programmers.co.kr/learn/courses/30/lessons/12932', '자연수 뒤집어 배열로 만들기', 1, '[]', 204, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12933', 'https://school.programmers.co.kr/learn/courses/30/lessons/12933', '정수 내림차순으로 배치하기', 1, '[]', 205, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12934', 'https://school.programmers.co.kr/learn/courses/30/lessons/12934', '정수 제곱근 판별', 1, '[]', 206, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12935', 'https://school.programmers.co.kr/learn/courses/30/lessons/12935', '제일 작은 수 제거하기', 1, '[]', 207, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12937', 'https://school.programmers.co.kr/learn/courses/30/lessons/12937', '짝수와 홀수', 1, '[]', 208, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12940', 'https://school.programmers.co.kr/learn/courses/30/lessons/12940', '최대공약수와 최소공배수', 1, '[]', 209, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12943', 'https://school.programmers.co.kr/learn/courses/30/lessons/12943', '콜라츠 추측', 1, '[]', 210, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12944', 'https://school.programmers.co.kr/learn/courses/30/lessons/12944', '평균 구하기', 1, '[]', 211, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12947', 'https://school.programmers.co.kr/learn/courses/30/lessons/12947', '하샤드 수', 1, '[]', 212, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12948', 'https://school.programmers.co.kr/learn/courses/30/lessons/12948', '핸드폰 번호 가리기', 1, '[]', 213, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12950', 'https://school.programmers.co.kr/learn/courses/30/lessons/12950', '행렬의 덧셈', 1, '[]', 214, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12954', 'https://school.programmers.co.kr/learn/courses/30/lessons/12954', 'x만큼 간격이 있는 n개의 숫자', 1, '[]', 215, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12969', 'https://school.programmers.co.kr/learn/courses/30/lessons/12969', '직사각형 별찍기', 1, '[]', 216, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12977', 'https://school.programmers.co.kr/learn/courses/30/lessons/12977', '소수 만들기', 1, '[]', 217, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12982', 'https://school.programmers.co.kr/learn/courses/30/lessons/12982', '예산', 1, '[]', 218, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17681', 'https://school.programmers.co.kr/learn/courses/30/lessons/17681', '[1차] 비밀지도', 1, '[]', 219, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17682', 'https://school.programmers.co.kr/learn/courses/30/lessons/17682', '[1차] 다트 게임', 1, '[]', 220, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42576', 'https://school.programmers.co.kr/learn/courses/30/lessons/42576', '완주하지 못한 선수', 1, '[]', 221, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42748', 'https://school.programmers.co.kr/learn/courses/30/lessons/42748', 'K번째수', 1, '[]', 222, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42840', 'https://school.programmers.co.kr/learn/courses/30/lessons/42840', '모의고사', 1, '[]', 223, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42862', 'https://school.programmers.co.kr/learn/courses/30/lessons/42862', '체육복', 1, '[]', 224, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42889', 'https://school.programmers.co.kr/learn/courses/30/lessons/42889', '실패율', 1, '[]', 225, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59034', 'https://school.programmers.co.kr/learn/courses/30/lessons/59034', '모든 레코드 조회하기', 1, '[]', 226, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59035', 'https://school.programmers.co.kr/learn/courses/30/lessons/59035', '역순 정렬하기', 1, '[]', 227, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59036', 'https://school.programmers.co.kr/learn/courses/30/lessons/59036', '아픈 동물 찾기', 1, '[]', 228, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59037', 'https://school.programmers.co.kr/learn/courses/30/lessons/59037', '어린 동물 찾기', 1, '[]', 229, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59039', 'https://school.programmers.co.kr/learn/courses/30/lessons/59039', '이름이 없는 동물의 아이디', 1, '[]', 230, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59403', 'https://school.programmers.co.kr/learn/courses/30/lessons/59403', '동물의 아이디와 이름', 1, '[]', 231, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59404', 'https://school.programmers.co.kr/learn/courses/30/lessons/59404', '여러 기준으로 정렬하기', 1, '[]', 232, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59405', 'https://school.programmers.co.kr/learn/courses/30/lessons/59405', '상위 n개 레코드', 1, '[]', 233, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59407', 'https://school.programmers.co.kr/learn/courses/30/lessons/59407', '이름이 있는 동물의 아이디', 1, '[]', 234, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-68644', 'https://school.programmers.co.kr/learn/courses/30/lessons/68644', '두 개 뽑아서 더하기', 1, '[]', 235, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-68935', 'https://school.programmers.co.kr/learn/courses/30/lessons/68935', '3진법 뒤집기', 1, '[]', 236, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-70128', 'https://school.programmers.co.kr/learn/courses/30/lessons/70128', '내적', 1, '[]', 237, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-72410', 'https://school.programmers.co.kr/learn/courses/30/lessons/72410', '신규 아이디 추천', 1, '[]', 238, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-76501', 'https://school.programmers.co.kr/learn/courses/30/lessons/76501', '음양 더하기', 1, '[]', 239, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-77484', 'https://school.programmers.co.kr/learn/courses/30/lessons/77484', '로또의 최고 순위와 최저 순위', 1, '[]', 240, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-77884', 'https://school.programmers.co.kr/learn/courses/30/lessons/77884', '약수의 개수와 덧셈', 1, '[]', 241, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-81301', 'https://school.programmers.co.kr/learn/courses/30/lessons/81301', '숫자 문자열과 영단어', 1, '[]', 242, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-82612', 'https://school.programmers.co.kr/learn/courses/30/lessons/82612', '부족한 금액 계산하기', 1, '[]', 243, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-86051', 'https://school.programmers.co.kr/learn/courses/30/lessons/86051', '없는 숫자 더하기', 1, '[]', 244, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-86491', 'https://school.programmers.co.kr/learn/courses/30/lessons/86491', '최소직사각형', 1, '[]', 245, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-87389', 'https://school.programmers.co.kr/learn/courses/30/lessons/87389', '나머지가 1이 되는 수 찾기', 1, '[]', 246, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131112', 'https://school.programmers.co.kr/learn/courses/30/lessons/131112', '강원도에 위치한 생산공장 목록 출력하기', 1, '[]', 247, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131114', 'https://school.programmers.co.kr/learn/courses/30/lessons/131114', '경기도에 위치한 식품창고 목록 출력하기', 1, '[]', 248, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131528', 'https://school.programmers.co.kr/learn/courses/30/lessons/131528', '나이 정보가 없는 회원 수 구하기', 1, '[]', 249, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131535', 'https://school.programmers.co.kr/learn/courses/30/lessons/131535', '조건에 맞는 회원수 구하기', 1, '[]', 250, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131697', 'https://school.programmers.co.kr/learn/courses/30/lessons/131697', '가장 비싼 상품 구하기', 1, '[]', 251, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131705', 'https://school.programmers.co.kr/learn/courses/30/lessons/131705', '삼총사', 1, '[]', 252, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-132201', 'https://school.programmers.co.kr/learn/courses/30/lessons/132201', '12세 이하인 여자 환자 목록 출력하기', 1, '[]', 253, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-132203', 'https://school.programmers.co.kr/learn/courses/30/lessons/132203', '흉부외과 또는 일반외과 의사 목록 출력하기', 1, '[]', 254, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-132267', 'https://school.programmers.co.kr/learn/courses/30/lessons/132267', '콜라 문제', 1, '[]', 255, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-133024', 'https://school.programmers.co.kr/learn/courses/30/lessons/133024', '인기있는 아이스크림', 1, '[]', 256, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-133025', 'https://school.programmers.co.kr/learn/courses/30/lessons/133025', '과일로 만든 아이스크림 고르기', 1, '[]', 257, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-133499', 'https://school.programmers.co.kr/learn/courses/30/lessons/133499', '옹알이 (2)', 1, '[]', 258, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-134240', 'https://school.programmers.co.kr/learn/courses/30/lessons/134240', '푸드 파이트 대회', 1, '[]', 259, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-135808', 'https://school.programmers.co.kr/learn/courses/30/lessons/135808', '과일 장수', 1, '[]', 260, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-136798', 'https://school.programmers.co.kr/learn/courses/30/lessons/136798', '기사단원의 무기', 1, '[]', 261, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-138477', 'https://school.programmers.co.kr/learn/courses/30/lessons/138477', '명예의 전당 (1)', 1, '[]', 262, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-140108', 'https://school.programmers.co.kr/learn/courses/30/lessons/140108', '문자열 나누기', 1, '[]', 263, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-142086', 'https://school.programmers.co.kr/learn/courses/30/lessons/142086', '가장 가까운 같은 글자', 1, '[]', 264, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-144853', 'https://school.programmers.co.kr/learn/courses/30/lessons/144853', '조건에 맞는 도서 리스트 출력하기', 1, '[]', 265, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-147355', 'https://school.programmers.co.kr/learn/courses/30/lessons/147355', '크기가 작은 부분문자열', 1, '[]', 266, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-150370', 'https://school.programmers.co.kr/learn/courses/30/lessons/150370', '개인정보 수집 유효기간', 1, '[]', 267, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-151136', 'https://school.programmers.co.kr/learn/courses/30/lessons/151136', '평균 일일 대여 요금 구하기', 1, '[]', 268, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-155652', 'https://school.programmers.co.kr/learn/courses/30/lessons/155652', '둘만의 암호', 1, '[]', 269, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-159994', 'https://school.programmers.co.kr/learn/courses/30/lessons/159994', '카드 뭉치', 1, '[]', 270, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-160586', 'https://school.programmers.co.kr/learn/courses/30/lessons/160586', '대충 만든 자판', 1, '[]', 271, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-161989', 'https://school.programmers.co.kr/learn/courses/30/lessons/161989', '덧칠하기', 1, '[]', 272, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-161990', 'https://school.programmers.co.kr/learn/courses/30/lessons/161990', '바탕화면 정리', 1, '[]', 273, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-164673', 'https://school.programmers.co.kr/learn/courses/30/lessons/164673', '조건에 부합하는 중고거래 댓글 조회하기', 1, '[]', 274, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-172928', 'https://school.programmers.co.kr/learn/courses/30/lessons/172928', '공원 산책', 1, '[]', 275, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-176963', 'https://school.programmers.co.kr/learn/courses/30/lessons/176963', '추억 점수', 1, '[]', 276, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-250137', 'https://school.programmers.co.kr/learn/courses/30/lessons/250137', '[PCCP 기출문제] 1번 / 붕대 감기', 1, '["PCCP"]', 277, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-258712', 'https://school.programmers.co.kr/learn/courses/30/lessons/258712', '가장 많이 받은 선물', 1, '[]', 278, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-293258', 'https://school.programmers.co.kr/learn/courses/30/lessons/293258', '잔챙이 잡은 수 구하기', 1, '[]', 279, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-298515', 'https://school.programmers.co.kr/learn/courses/30/lessons/298515', '잡은 물고기 중 가장 큰 물고기의 길이 구하기', 1, '[]', 280, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-340199', 'https://school.programmers.co.kr/learn/courses/30/lessons/340199', '[PCCE 기출문제] 9번 / 지폐 접기', 1, '["PCCE"]', 281, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-340213', 'https://school.programmers.co.kr/learn/courses/30/lessons/340213', '[PCCP 기출문제] 1번 / 동영상 재생기', 1, '["PCCP"]', 282, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-1844', 'https://school.programmers.co.kr/learn/courses/30/lessons/1844', '게임 맵 최단거리', 2, '[]', 283, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12909', 'https://school.programmers.co.kr/learn/courses/30/lessons/12909', '올바른 괄호', 2, '[]', 284, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12911', 'https://school.programmers.co.kr/learn/courses/30/lessons/12911', '다음 큰 숫자', 2, '[]', 285, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12913', 'https://school.programmers.co.kr/learn/courses/30/lessons/12913', '땅따먹기', 2, '[]', 286, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12914', 'https://school.programmers.co.kr/learn/courses/30/lessons/12914', '멀리 뛰기', 2, '[]', 287, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12924', 'https://school.programmers.co.kr/learn/courses/30/lessons/12924', '숫자의 표현', 2, '[]', 288, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12939', 'https://school.programmers.co.kr/learn/courses/30/lessons/12939', '최댓값과 최솟값', 2, '[]', 289, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12941', 'https://school.programmers.co.kr/learn/courses/30/lessons/12941', '최솟값 만들기', 2, '[]', 290, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12945', 'https://school.programmers.co.kr/learn/courses/30/lessons/12945', '피보나치 수', 2, '[]', 291, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12949', 'https://school.programmers.co.kr/learn/courses/30/lessons/12949', '행렬의 곱셈', 2, '[]', 292, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12951', 'https://school.programmers.co.kr/learn/courses/30/lessons/12951', 'JadenCase 문자열 만들기', 2, '[]', 293, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12953', 'https://school.programmers.co.kr/learn/courses/30/lessons/12953', 'N개의 최소공배수', 2, '[]', 294, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12973', 'https://school.programmers.co.kr/learn/courses/30/lessons/12973', '짝지어 제거하기', 2, '[]', 295, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12980', 'https://school.programmers.co.kr/learn/courses/30/lessons/12980', '점프와 순간 이동', 2, '[]', 296, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12981', 'https://school.programmers.co.kr/learn/courses/30/lessons/12981', '영어 끝말잇기', 2, '[]', 297, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12985', 'https://school.programmers.co.kr/learn/courses/30/lessons/12985', '예상 대진표', 2, '[]', 298, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17677', 'https://school.programmers.co.kr/learn/courses/30/lessons/17677', '[1차] 뉴스 클러스터링', 2, '[]', 299, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17680', 'https://school.programmers.co.kr/learn/courses/30/lessons/17680', '[1차] 캐시', 2, '[]', 300, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17684', 'https://school.programmers.co.kr/learn/courses/30/lessons/17684', '[3차] 압축', 2, '[]', 301, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17686', 'https://school.programmers.co.kr/learn/courses/30/lessons/17686', '[3차] 파일명 정렬', 2, '[]', 302, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17687', 'https://school.programmers.co.kr/learn/courses/30/lessons/17687', '[3차] n진수 게임', 2, '[]', 303, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42577', 'https://school.programmers.co.kr/learn/courses/30/lessons/42577', '전화번호 목록', 2, '[]', 304, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42578', 'https://school.programmers.co.kr/learn/courses/30/lessons/42578', '의상', 2, '[]', 305, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42584', 'https://school.programmers.co.kr/learn/courses/30/lessons/42584', '주식가격', 2, '[]', 306, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42586', 'https://school.programmers.co.kr/learn/courses/30/lessons/42586', '기능개발', 2, '[]', 307, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42587', 'https://school.programmers.co.kr/learn/courses/30/lessons/42587', '프로세스', 2, '[]', 308, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42626', 'https://school.programmers.co.kr/learn/courses/30/lessons/42626', '더 맵게', 2, '[]', 309, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42746', 'https://school.programmers.co.kr/learn/courses/30/lessons/42746', '가장 큰 수', 2, '[]', 310, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42747', 'https://school.programmers.co.kr/learn/courses/30/lessons/42747', 'H-Index', 2, '[]', 311, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42839', 'https://school.programmers.co.kr/learn/courses/30/lessons/42839', '소수 찾기', 2, '[]', 312, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42842', 'https://school.programmers.co.kr/learn/courses/30/lessons/42842', '카펫', 2, '[]', 313, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42860', 'https://school.programmers.co.kr/learn/courses/30/lessons/42860', '조이스틱', 2, '[]', 314, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42883', 'https://school.programmers.co.kr/learn/courses/30/lessons/42883', '큰 수 만들기', 2, '[]', 315, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42885', 'https://school.programmers.co.kr/learn/courses/30/lessons/42885', '구명보트', 2, '[]', 316, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43165', 'https://school.programmers.co.kr/learn/courses/30/lessons/43165', '타겟 넘버', 2, '[]', 317, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-49993', 'https://school.programmers.co.kr/learn/courses/30/lessons/49993', '스킬트리', 2, '[]', 318, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-49994', 'https://school.programmers.co.kr/learn/courses/30/lessons/49994', '방문 길이', 2, '[]', 319, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59038', 'https://school.programmers.co.kr/learn/courses/30/lessons/59038', '최솟값 구하기', 2, '[]', 320, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59040', 'https://school.programmers.co.kr/learn/courses/30/lessons/59040', '고양이와 개는 몇 마리 있을까', 2, '[]', 321, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59041', 'https://school.programmers.co.kr/learn/courses/30/lessons/59041', '동명 동물 수 찾기', 2, '[]', 322, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59046', 'https://school.programmers.co.kr/learn/courses/30/lessons/59046', '루시와 엘라 찾기', 2, '[]', 323, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59047', 'https://school.programmers.co.kr/learn/courses/30/lessons/59047', '이름에 el이 들어가는 동물 찾기', 2, '[]', 324, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59406', 'https://school.programmers.co.kr/learn/courses/30/lessons/59406', '동물 수 구하기', 2, '[]', 325, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59408', 'https://school.programmers.co.kr/learn/courses/30/lessons/59408', '중복 제거하기', 2, '[]', 326, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59409', 'https://school.programmers.co.kr/learn/courses/30/lessons/59409', '중성화 여부 파악하기', 2, '[]', 327, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59410', 'https://school.programmers.co.kr/learn/courses/30/lessons/59410', 'NULL 처리하기', 2, '[]', 328, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59412', 'https://school.programmers.co.kr/learn/courses/30/lessons/59412', '입양 시각 구하기(1)', 2, '[]', 329, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59414', 'https://school.programmers.co.kr/learn/courses/30/lessons/59414', 'DATETIME에서 DATE로 형 변환', 2, '[]', 330, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-64065', 'https://school.programmers.co.kr/learn/courses/30/lessons/64065', '튜플', 2, '[]', 331, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-68936', 'https://school.programmers.co.kr/learn/courses/30/lessons/68936', '쿼드압축 후 개수 세기', 2, '[]', 332, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-70129', 'https://school.programmers.co.kr/learn/courses/30/lessons/70129', '이진 변환 반복하기', 2, '[]', 333, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-76502', 'https://school.programmers.co.kr/learn/courses/30/lessons/76502', '괄호 회전하기', 2, '[]', 334, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-84512', 'https://school.programmers.co.kr/learn/courses/30/lessons/84512', '모음 사전', 2, '[]', 335, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-86971', 'https://school.programmers.co.kr/learn/courses/30/lessons/86971', '전력망을 둘로 나누기', 2, '[]', 336, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-87390', 'https://school.programmers.co.kr/learn/courses/30/lessons/87390', 'n^2 배열 자르기', 2, '[]', 337, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-87946', 'https://school.programmers.co.kr/learn/courses/30/lessons/87946', '피로도', 2, '[]', 338, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-92335', 'https://school.programmers.co.kr/learn/courses/30/lessons/92335', 'k진수에서 소수 개수 구하기', 2, '[]', 339, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-92341', 'https://school.programmers.co.kr/learn/courses/30/lessons/92341', '주차 요금 계산', 2, '[]', 340, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-118667', 'https://school.programmers.co.kr/learn/courses/30/lessons/118667', '두 큐 합 같게 만들기', 2, '[]', 341, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131115', 'https://school.programmers.co.kr/learn/courses/30/lessons/131115', '가격이 제일 비싼 식품의 정보 출력하기', 2, '[]', 342, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131120', 'https://school.programmers.co.kr/learn/courses/30/lessons/131120', '3월에 태어난 여성 회원 목록 출력하기', 2, '[]', 343, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131127', 'https://school.programmers.co.kr/learn/courses/30/lessons/131127', '할인 행사', 2, '[]', 344, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131529', 'https://school.programmers.co.kr/learn/courses/30/lessons/131529', '카테고리 별 상품 개수 구하기', 2, '[]', 345, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131530', 'https://school.programmers.co.kr/learn/courses/30/lessons/131530', '가격대 별 상품 개수 구하기', 2, '[]', 346, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131533', 'https://school.programmers.co.kr/learn/courses/30/lessons/131533', '상품 별 오프라인 매출 구하기', 2, '[]', 347, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131536', 'https://school.programmers.co.kr/learn/courses/30/lessons/131536', '재구매가 일어난 상품과 회원 리스트 구하기', 2, '[]', 348, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131701', 'https://school.programmers.co.kr/learn/courses/30/lessons/131701', '연속 부분 수열 합의 개수', 2, '[]', 349, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131704', 'https://school.programmers.co.kr/learn/courses/30/lessons/131704', '택배상자', 2, '[]', 350, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-132202', 'https://school.programmers.co.kr/learn/courses/30/lessons/132202', '진료과별 총 예약 횟수 출력하기', 2, '[]', 351, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-132265', 'https://school.programmers.co.kr/learn/courses/30/lessons/132265', '롤케이크 자르기', 2, '[]', 352, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-133026', 'https://school.programmers.co.kr/learn/courses/30/lessons/133026', '성분으로 구분한 아이스크림 총 주문량', 2, '[]', 353, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-138476', 'https://school.programmers.co.kr/learn/courses/30/lessons/138476', '귤 고르기', 2, '[]', 354, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-144854', 'https://school.programmers.co.kr/learn/courses/30/lessons/144854', '조건에 맞는 도서와 저자 리스트 출력하기', 2, '[]', 355, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-148653', 'https://school.programmers.co.kr/learn/courses/30/lessons/148653', '마법의 엘리베이터', 2, '[]', 356, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-150369', 'https://school.programmers.co.kr/learn/courses/30/lessons/150369', '택배 배달과 수거하기', 2, '[]', 357, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-151137', 'https://school.programmers.co.kr/learn/courses/30/lessons/151137', '자동차 종류 별 특정 옵션이 포함된 자동차 수 구하기', 2, '[]', 358, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-154538', 'https://school.programmers.co.kr/learn/courses/30/lessons/154538', '숫자 변환하기', 2, '[]', 359, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-154539', 'https://school.programmers.co.kr/learn/courses/30/lessons/154539', '뒤에 있는 큰 수 찾기', 2, '[]', 360, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-159993', 'https://school.programmers.co.kr/learn/courses/30/lessons/159993', '미로 탈출', 2, '[]', 361, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-160585', 'https://school.programmers.co.kr/learn/courses/30/lessons/160585', '혼자서 하는 틱택토', 2, '[]', 362, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-164672', 'https://school.programmers.co.kr/learn/courses/30/lessons/164672', '조건에 부합하는 중고거래 상태 조회하기', 2, '[]', 363, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-250135', 'https://school.programmers.co.kr/learn/courses/30/lessons/250135', '[PCCP 기출문제] 3번 / 아날로그 시계', 2, '["PCCP"]', 364, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-250136', 'https://school.programmers.co.kr/learn/courses/30/lessons/250136', '[PCCP 기출문제] 2번 / 석유 시추', 2, '["PCCP"]', 365, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-273709', 'https://school.programmers.co.kr/learn/courses/30/lessons/273709', '조건에 맞는 아이템들의 가격의 총합 구하기', 2, '[]', 366, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-284530', 'https://school.programmers.co.kr/learn/courses/30/lessons/284530', '연도 별 평균 미세먼지 농도 조회하기', 2, '[]', 367, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-293257', 'https://school.programmers.co.kr/learn/courses/30/lessons/293257', '물고기 종류 별 잡은 수 구하기', 2, '[]', 368, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-301647', 'https://school.programmers.co.kr/learn/courses/30/lessons/301647', '부모의 형질을 모두 가지는 대장균 찾기', 2, '[]', 369, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-340211', 'https://school.programmers.co.kr/learn/courses/30/lessons/340211', '[PCCP 기출문제] 3번 / 충돌위험 찾기', 2, '["PCCP"]', 370, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-340212', 'https://school.programmers.co.kr/learn/courses/30/lessons/340212', '[PCCP 기출문제] 2번 / 퍼즐 게임 챌린지', 2, '["PCCP"]', 371, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-389480', 'https://school.programmers.co.kr/learn/courses/30/lessons/389480', '완전범죄', 2, '[]', 372, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12927', 'https://school.programmers.co.kr/learn/courses/30/lessons/12927', '야근 지수', 3, '[]', 373, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12938', 'https://school.programmers.co.kr/learn/courses/30/lessons/12938', '최고의 집합', 3, '[]', 374, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12971', 'https://school.programmers.co.kr/learn/courses/30/lessons/12971', '스티커 모으기(2)', 3, '[]', 375, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12979', 'https://school.programmers.co.kr/learn/courses/30/lessons/12979', '기지국 설치', 3, '[]', 376, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12987', 'https://school.programmers.co.kr/learn/courses/30/lessons/12987', '숫자 게임', 3, '[]', 377, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42579', 'https://school.programmers.co.kr/learn/courses/30/lessons/42579', '베스트앨범', 3, '[]', 378, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42628', 'https://school.programmers.co.kr/learn/courses/30/lessons/42628', '이중우선순위큐', 3, '[]', 379, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42861', 'https://school.programmers.co.kr/learn/courses/30/lessons/42861', '섬 연결하기', 3, '[]', 380, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42884', 'https://school.programmers.co.kr/learn/courses/30/lessons/42884', '단속카메라', 3, '[]', 381, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42895', 'https://school.programmers.co.kr/learn/courses/30/lessons/42895', 'N으로 표현', 3, '[]', 382, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42898', 'https://school.programmers.co.kr/learn/courses/30/lessons/42898', '등굣길', 3, '[]', 383, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43105', 'https://school.programmers.co.kr/learn/courses/30/lessons/43105', '정수 삼각형', 3, '[]', 384, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43162', 'https://school.programmers.co.kr/learn/courses/30/lessons/43162', '네트워크', 3, '[]', 385, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43163', 'https://school.programmers.co.kr/learn/courses/30/lessons/43163', '단어 변환', 3, '[]', 386, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43164', 'https://school.programmers.co.kr/learn/courses/30/lessons/43164', '여행경로', 3, '[]', 387, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43238', 'https://school.programmers.co.kr/learn/courses/30/lessons/43238', '입국심사', 3, '[]', 388, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-49189', 'https://school.programmers.co.kr/learn/courses/30/lessons/49189', '가장 먼 노드', 3, '[]', 389, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59042', 'https://school.programmers.co.kr/learn/courses/30/lessons/59042', '없어진 기록 찾기', 3, '[]', 390, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59043', 'https://school.programmers.co.kr/learn/courses/30/lessons/59043', '있었는데요 없었습니다', 3, '[]', 391, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59044', 'https://school.programmers.co.kr/learn/courses/30/lessons/59044', '오랜 기간 보호한 동물(1)', 3, '[]', 392, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59411', 'https://school.programmers.co.kr/learn/courses/30/lessons/59411', '오랜 기간 보호한 동물(2)', 3, '[]', 393, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-64062', 'https://school.programmers.co.kr/learn/courses/30/lessons/64062', '징검다리 건너기', 3, '[]', 394, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-64064', 'https://school.programmers.co.kr/learn/courses/30/lessons/64064', '불량 사용자', 3, '[]', 395, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-67258', 'https://school.programmers.co.kr/learn/courses/30/lessons/67258', '[카카오 인턴] 보석 쇼핑', 3, '["KAKAO"]', 396, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-77487', 'https://school.programmers.co.kr/learn/courses/30/lessons/77487', '헤비 유저가 소유한 장소', 3, '[]', 397, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131113', 'https://school.programmers.co.kr/learn/courses/30/lessons/131113', '조건별로 분류하여 주문상태 출력하기', 3, '[]', 398, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131123', 'https://school.programmers.co.kr/learn/courses/30/lessons/131123', '즐겨찾기가 가장 많은 식당 정보 출력하기', 3, '[]', 399, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-144855', 'https://school.programmers.co.kr/learn/courses/30/lessons/144855', '카테고리 별 도서 판매량 집계하기', 3, '[]', 400, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-150367', 'https://school.programmers.co.kr/learn/courses/30/lessons/150367', '표현 가능한 이진트리', 3, '[]', 401, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-157341', 'https://school.programmers.co.kr/learn/courses/30/lessons/157341', '대여 기록이 존재하는 자동차 리스트 구하기', 3, '[]', 402, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-164668', 'https://school.programmers.co.kr/learn/courses/30/lessons/164668', '조건에 맞는 사용자와 총 거래금액 조회하기', 3, '[]', 403, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-164670', 'https://school.programmers.co.kr/learn/courses/30/lessons/164670', '조건에 맞는 사용자 정보 조회하기', 3, '[]', 404, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-164671', 'https://school.programmers.co.kr/learn/courses/30/lessons/164671', '조회수가 가장 많은 중고거래 게시판의 첨부파일 조회하기', 3, '[]', 405, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-214288', 'https://school.programmers.co.kr/learn/courses/30/lessons/214288', '상담원 인원', 3, '[]', 406, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-214289', 'https://school.programmers.co.kr/learn/courses/30/lessons/214289', '에어컨', 3, '[]', 407, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-250134', 'https://school.programmers.co.kr/learn/courses/30/lessons/250134', '[PCCP 기출문제] 4번 / 수레 움직이기', 3, '["PCCP"]', 408, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-284529', 'https://school.programmers.co.kr/learn/courses/30/lessons/284529', '부서별 평균 연봉 조회하기', 3, '[]', 409, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-293261', 'https://school.programmers.co.kr/learn/courses/30/lessons/293261', '물고기 종류 별 대어 찾기', 3, '[]', 410, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12929', 'https://school.programmers.co.kr/learn/courses/30/lessons/12929', '올바른 괄호의 갯수', 4, '[]', 411, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12983', 'https://school.programmers.co.kr/learn/courses/30/lessons/12983', '단어 퍼즐', 4, '[]', 412, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-12984', 'https://school.programmers.co.kr/learn/courses/30/lessons/12984', '지형 편집', 4, '[]', 413, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-17685', 'https://school.programmers.co.kr/learn/courses/30/lessons/17685', '[3차] 자동완성', 4, '[]', 414, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42891', 'https://school.programmers.co.kr/learn/courses/30/lessons/42891', '무지의 먹방 라이브', 4, '[]', 415, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42894', 'https://school.programmers.co.kr/learn/courses/30/lessons/42894', '블록 게임', 4, '[]', 416, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-42897', 'https://school.programmers.co.kr/learn/courses/30/lessons/42897', '도둑질', 4, '[]', 417, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-43236', 'https://school.programmers.co.kr/learn/courses/30/lessons/43236', '징검다리', 4, '[]', 418, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-49995', 'https://school.programmers.co.kr/learn/courses/30/lessons/49995', '쿠키 구입', 4, '[]', 419, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-59045', 'https://school.programmers.co.kr/learn/courses/30/lessons/59045', '보호소에서 중성화한 동물', 4, '[]', 420, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-60060', 'https://school.programmers.co.kr/learn/courses/30/lessons/60060', '가사 검색', 4, '[]', 421, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-64063', 'https://school.programmers.co.kr/learn/courses/30/lessons/64063', '호텔 방 배정', 4, '[]', 422, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-67260', 'https://school.programmers.co.kr/learn/courses/30/lessons/67260', '[카카오 인턴] 동굴 탐험', 4, '["KAKAO"]', 423, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131116', 'https://school.programmers.co.kr/learn/courses/30/lessons/131116', '식품분류별 가장 비싼 식품의 정보 조회하기', 4, '[]', 424, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131117', 'https://school.programmers.co.kr/learn/courses/30/lessons/131117', '5월 식품들의 총매출 조회하기', 4, '[]', 425, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES ('problem-programmers-131118', 'https://school.programmers.co.kr/learn/courses/30/lessons/131118', '서울에 위치한 식당 목록 출력하기', 4, '[]', 426, 1, '2026-08-12T12:37:42Z', '2026-08-12T12:37:42Z')
ON CONFLICT(source_url) DO UPDATE SET
  display_title = excluded.display_title,
  level = excluded.level,
  tags = excluded.tags,
  position = excluded.position,
  active = excluded.active,
  updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT OR IGNORE INTO import_batches
  (id, kind, checksum, original_count, rejected_count, created_at)
VALUES
  ('catalog-jobs-20260812', 'jobs', 'a2787be2bbc3a816a41dabc1d4b9194958941d86895b40bc13ac58d4bea6d6a5', 47, 0, '2026-08-12T12:37:42Z'),
  ('catalog-problems-20260812', 'coding_problems', 'b60ddab1fcbb1db1cf5cd78f3bd32c4e4409eed0e111ecbfa93392d4d6fda112', 427, 0, '2026-08-12T12:37:42Z');
--> statement-breakpoint
PRAGMA optimize;
