INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-01376e71d3ad0f1ec0c88dbb', '이스트게임즈', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156305', 'https://www.rocketpunch.com/jobs/156305', '웹 개발자 (Java, Spring, TypeScript, Next.js)', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '신입과 경력 트랙이 함께 명시되고 지원 페이지 이동과 상시채용 상태가 확인됨', 'FULL_TIME', '서울 서초구', 0, '["React","TypeScript","JavaScript","HTML","CSS","Java","Kotlin","Spring Framework","Spring Boot","Python","MSSQL","MySQL","Apache","Tomcat","GitLab","Jenkins","JPA","Hibernate","REST API","GraphQL","AWS"]', NULL, NULL, NULL, 1, '게임·웹 서비스의 프론트엔드와 백엔드를 함께 개발하는 신입 지원 가능 공고다.', 'ACTIVE', '91ba7b23d7ab4022a467d2948e8a63bc67d34ec49ad1e641e9b9eb6b5f339209', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-0c69ea9cd28010c56daf6849', '베스텔라랩', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '157754', 'https://www.rocketpunch.com/jobs/157754', '백엔드·인프라 풀스택 엔지니어', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '공고 경력 구분에 신입·주니어·미들·시니어가 포함됨', 'FULL_TIME', '미확인', 0, '[]', NULL, NULL, NULL, 1, '백엔드 개발과 인프라 운영을 함께 담당하는 풀스택 엔지니어 공고다.', 'ACTIVE', '7d6e0bcb4818de13863cfc701eaf95b482f1210240aaec93eef617969c7a2c2b', '2026-08-15T11:01:49.000Z', '2026-08-20T21:11:28.000Z', '2026-08-15T11:01:49.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-111d0e230cf5cda2c1a4de6b', '허드슨에이아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156625', 'https://www.rocketpunch.com/jobs/156625', 'Fullstack Engineer', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입·미들·시니어가 포함되고 지원 페이지 이동과 상시채용 상태가 확인됨', 'FULL_TIME', '미확인', 0, '["PostgreSQL","MongoDB","Python","JavaScript","TypeScript","Django","Nginx","gRPC","React","GCP","Docker"]', NULL, NULL, NULL, 1, 'AI 서비스의 프론트엔드와 백엔드를 함께 개발하는 풀스택 정규직 공고다.', 'ACTIVE', '5cadf09e472c6ec4c820461e121de13beef18fc2384738d38e07763b7e706bf0', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-41e22ef84faa0010eb2ba33d', '라이트에이아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'Wanted', '375795', 'https://www.wanted.co.kr/wd/375795', '마케팅 AI 에이전트 Backend 개발자 (신입)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '신입·주니어 대상이며 관련 전공 졸업예정자를 포함하고, 관련 전공자는 실무 경력을 요구하지 않는다고 명시됨', 'UNCONFIRMED', '서울 강남구', 0, '["Python","Terraform","FastAPI","Dify","AWS","EKS","RDS","ECR","S3","Docker","GitAction"]', NULL, NULL, '2026-08-31T14:59:59.000Z', 0, '마케팅 성과 분석 서버와 AI 연동 데이터 파이프라인, 클라우드 인프라를 개발하는 신입 백엔드 공고다.', 'ACTIVE', 'c972612306866006b98d7c32640a601ced0f295d9baf7da8173e64728d81a755', '2026-08-15T11:01:21.000Z', '2026-08-20T21:11:28.000Z', '2026-08-15T11:01:21.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-6b340835b24ffbec68f5a685', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156013', 'https://www.rocketpunch.com/jobs/156013', '[캐시워크] 안드로이드 개발 채용전환형 인턴', 'ANDROID', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["Kotlin","Android","Coroutines","Flow","Jetpack","ViewModel","LiveData","Room"]', NULL, NULL, NULL, 1, '캐시워크 안드로이드 앱을 개발하는 3개월 채용전환형 인턴 공고다.', 'ACTIVE', 'eb625b4083f54699ed83a8ebffeda45d903e32bdc1ea49285a454c20a7361cec', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-81439a5923b20570d21b4df3', '이스트게임즈', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156303', 'https://www.rocketpunch.com/jobs/156303', 'DevOps 엔지니어', 'DEVOPS', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입이 포함되고 지원 페이지 이동과 상시채용 상태가 확인됨', 'FULL_TIME', '서울 서초구', 0, '["Linux","Windows","TCP/IP","Bash","Python","Terraform","Ansible","Docker","Kubernetes","GitLab CI/CD","Jenkins","AWS"]', NULL, NULL, NULL, 1, '게임 서비스 인프라와 배포 자동화를 담당하는 신입 지원 가능 DevOps 공고다.', 'ACTIVE', 'b9ba5c2c7744a49dd54ed1061558de06f728aec38268aa3641f240babc39b0e6', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-897d1e13630a9c8679cbdf0b', '트리플오스', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'Wanted', '356275', 'https://www.wanted.co.kr/wd/356275', '백엔드 개발자(신입)', 'BACKEND', 'NEW_GRAD_ONLY', '공고 제목과 경력 구분에 신입이 명시됨', 'UNCONFIRMED', '경기 성남시', 0, '["Kotlin","Spring Boot","Java","MySQL","Redis","MongoDB","Git","Jira"]', NULL, NULL, NULL, 1, 'Kotlin·Spring Boot 기반 API와 마이크로서비스를 구현·운영하는 신입 백엔드 공고다.', 'ACTIVE', '8815ac02967d6d5fba54503fd89f43d17101fde15ed5ac18639ad0ad20515751', '2026-08-15T11:01:21.000Z', '2026-08-20T21:11:28.000Z', '2026-08-15T11:01:21.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-df5e34979bfbf507def5d086', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156014', 'https://www.rocketpunch.com/jobs/156014', '[캐시워크] 프론트엔드 개발 채용전환형 인턴', 'FRONTEND', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["Next.js","AWS","React Query","Zustand","Recoil","REST API","GraphQL"]', NULL, NULL, NULL, 1, '캐시워크 웹 서비스의 프론트엔드를 개발하는 채용전환형 인턴 공고다.', 'ACTIVE', '4c0c850e43be3b763d2a00122662cf5b23d0efc26c298c07d53c1d5c31449e84', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-f892f6cd2470eb623ab8592e', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156008', 'https://www.rocketpunch.com/jobs/156008', '[캐시워크] 데이터분석 담당 채용전환형 인턴', 'DATA_ANALYTICS', 'NEW_GRAD_ONLY', '신입 대상 3개월 채용전환형 인턴이며 지원 페이지 이동과 상시채용 상태가 확인됨', 'INTERN_TO_FULL_TIME', '미확인', 0, '["SQL","Python","Tableau","AWS DynamoDB","AWS EC2","AWS RDS","GCP BigQuery","Google Analytics"]', NULL, NULL, NULL, 1, '캐시워크 데이터 분석과 지표 운영을 담당하는 채용전환형 인턴 공고다.', 'ACTIVE', 'fb8140f076a360c83a61f46808cf3b56ca8d4abb94365a7653f79f6713c980d0', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T00:47:05.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-51eabae7de6028d706e6cd7c', '엑스와이지', 'STARTUP', '누적 150억 원 투자 유치 로봇 스타트업으로 상세에 소개됨', 'Wanted', '336181', 'https://www.wanted.co.kr/wd/336181', '[인턴] [서비스 로봇] Physical AI 개발자', 'AI_ROBOTICS', 'NEW_GRAD_ONLY', '원티드 상세에 경력 무관·신입 지원 가능, 관련 전공 졸업예정자 가능이 명시됨', 'INTERN_TO_FULL_TIME', '서울 성동구', 0, '["Python","Reinforcement Learning","Isaac Sim","MuJoCo"]', NULL, NULL, NULL, 1, '서비스 로봇용 모방학습·강화학습 모델과 데이터 수집·튜닝을 수행하는 3개월 정규직전환형 인턴이다.', 'ACTIVE', '088587d9a86ece1daceb2d05e3c6cda41d37f246d8dae1cd4426dc15ad3f7e0d', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-011fbf9fc0dc4e56b4946f48', '엑스와이지', 'STARTUP', '누적 150억 원 투자 유치 로봇 스타트업으로 상세에 소개됨', 'Wanted', '336180', 'https://www.wanted.co.kr/wd/336180', '[인턴] [로봇] 자율주행 로봇 개발자', 'ROBOTICS_AUTONOMOUS', 'NEW_GRAD_ONLY', '원티드 상세에 경력 무관·신입 지원 가능, 관련 전공 졸업예정자 가능이 명시됨', 'INTERN_TO_FULL_TIME', '서울 성동구', 0, '["ROS","SLAM","VSLAM","LiDAR","IMU"]', NULL, NULL, NULL, 1, 'SLAM과 센서 융합을 활용해 자율주행 로봇 제어 알고리즘을 개발하는 3개월 정규직전환형 인턴이다.', 'ACTIVE', '29c128b853079fa0864dbea025cbdcdf01a1ad66521a8bc336ed4105e4512ff2', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-f9e8b0b612d976836d1d87d4', '헤렌', 'UNCLASSIFIED', '공개 상세에서 기업 규모 분류에 충분한 근거를 확정하지 않음', 'Wanted', '371789', 'https://www.wanted.co.kr/wd/371789', '[인턴] [헤렌] Android 개발자', 'MOBILE_ANDROID', 'NEW_GRAD_ONLY', '원티드 상세에 재학생·졸업예정자·졸업자 지원 가능과 프로젝트 경험 인정이 명시됨', 'INTERN_TO_FULL_TIME', '서울 성동구', 0, '["Kotlin","Android","Jetpack Compose","Coroutines","Flow"]', NULL, NULL, NULL, 1, 'Kotlin 기반 실서비스 Android 앱 기능을 개발하고 코드 리뷰와 배포를 경험하는 3개월 정규직전환형 인턴이다.', 'ACTIVE', '5bc1825304a9d4cd839d7714f61afd0c194d88fd7cbc7c0ca1020fcd0e64760d', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-cad1d4794f76e745dd326a46', '㈜로브로스', 'UNCLASSIFIED', '공개 목록에서 기업 규모를 확정할 근거를 수집하지 못함', 'Saramin', '54792925', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54792925&view_type=list', 'AI Research Scientist - Robot Action', 'AI_ROBOTICS', 'NEW_GRAD_ELIGIBLE', '사람인 현재 목록에 신입·경력, 대졸 이상, 입사지원 가능으로 표시됨', 'FULL_TIME', '서울 강남구', 0, '["AI","Robotics","Machine Learning"]', NULL, NULL, '2026-09-19T14:59:59.000Z', 0, '로봇 행동 연구를 위한 AI Research Scientist를 모집하며 신입과 경력 모두 지원할 수 있다.', 'ACTIVE', '8ebaf3bf115801f584c72a7f3c6d29a0080b669ed40dfe5ff63553db24d915b4', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-01ca01e2ec54c170bbd96ca0', '㈜이젠솔루션', 'SMALL', '사람인 기업 분류상 중소기업 채용 목록으로 확인됨', 'Saramin', '54700914', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54700914&view_type=list', '웹기반 MES 신입 개발자 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '사람인 현재 목록에 신입 정규직과 입사지원 가능 상태가 명시됨', 'FULL_TIME', '대구 북구', 0, '["Java","JavaScript","jQuery","JSP","MES"]', NULL, NULL, '2026-09-09T14:59:59.000Z', 0, '웹 기반 MES를 개발하는 신입 정규직 공고로 Java와 JavaScript 계열 기술을 다룬다.', 'ACTIVE', '03753ddaee53c37244170f84f7e1e1dce88c7d35e76d9519aa94033940891460', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-a3f7e43cff6b369a929ff32d', '㈜디비투이', 'SMALL', '사람인 기업 분류상 중소기업 채용 목록으로 확인됨', 'Saramin', '54799027', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?adsCategoryItem=effect_bold&rec_idx=54799027&view_type=list', '[디비투이] 신입,경력 (웹개발자,DBA/DBE) 채용', 'DATABASE_AND_WEB', 'NEW_GRAD_ELIGIBLE', '사람인 현재 목록에 신입·경력 정규직과 입사지원 가능 상태가 명시됨', 'FULL_TIME', '서울 서초구', 0, '["Web Development","DBA","DBE","Data Analysis"]', NULL, NULL, '2026-10-19T14:59:59.000Z', 0, '웹 개발과 데이터베이스 관리·엔지니어링 직무의 신입·경력 정규직을 함께 모집한다.', 'ACTIVE', '71fe4983d7b74dd298358ad5bffb62d2b519f2d2de6ed1391c088caf3864a13a', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
VALUES ('job-f348d3decb584eb0bb36b0ec', '건강보험심사평가원', 'PUBLIC', '공공기관 건강보험심사평가원의 정규직 채용으로 확인됨', 'Saramin', '54794868', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54794868&view_type=list', '2026년 하반기 정규직 채용(시스템개발)', 'CORPORATE_IT', 'NEW_GRAD_ELIGIBLE', '사람인 현재 목록에 경력무관·학력무관 정규직과 홈페이지 지원 가능 상태가 명시됨', 'FULL_TIME', '강원 원주시', 0, '["Information Systems","Software Architecture","ICT"]', NULL, NULL, '2026-09-02T14:59:59.000Z', 0, '건강보험심사평가원의 시스템 개발 정규직 공고로 경력과 학력 제한 없이 지원할 수 있다.', 'ACTIVE', '6792e6520812826e99d2597013c644663ae4800641a30d94e43879f44670651b', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z', '2026-08-20T21:08:35.000Z', '2026-08-20T21:11:28.000Z')
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
SET status = 'EXPIRED', updated_at = '2026-08-20T21:11:28.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49620106'
  AND rolling = 0
  AND deadline_at < '2026-08-20T21:11:28.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'REMOVED', last_verified_at = '2026-08-20T21:11:28.000Z', updated_at = '2026-08-20T21:11:28.000Z'
WHERE source_url = 'https://jasoseol.com/recruit/104762'
  AND rolling = 0
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN', 'NEEDS_REVIEW');
--> statement-breakpoint
UPDATE jobs
SET status = 'REMOVED', last_verified_at = '2026-08-20T21:11:28.000Z', updated_at = '2026-08-20T21:11:28.000Z'
WHERE source_url = 'https://jasoseol.com/recruit/105547'
  AND rolling = 0
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN', 'NEEDS_REVIEW');
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260821-full', 'jobs', '5849b8bb934146fd1a4cff7f988fb07aa8b5327e1f8be45a06d405c5ec8ff256', 'COMMITTED',
   16, 0, '{"existingItems":60,"incomingItems":16,"matchedItems":9,"addedItems":7,"expiredByDeadlineItems":1,"removedItems":2,"retainedUnconfirmedItems":48,"retainedExistingRollingItems":11,"storedItemsAfter":67,"visibleItemsAfter":64,"snapshotMode":"FULL_REVALIDATION","policy":"full-revalidation-upsert; explicit-deadline-expiry; evidence-backed-removal"}', '2026-08-20T21:11:28.000Z', '2026-08-20T21:11:28.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0026_reconcile_job_catalog_20260821', 'sha256:5849b8bb934146fd1a4cff7f988fb07aa8b5327e1f8be45a06d405c5ec8ff256', '2026-08-20T21:11:28.000Z');
--> statement-breakpoint
PRAGMA optimize;
