INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-011fbf9fc0dc4e56b4946f48', '엑스와이지', 'STARTUP', '누적 150억 원 투자 유치 로봇 스타트업으로 상세에 소개됨', 'Wanted', '336180', 'https://www.wanted.co.kr/wd/336180', '[인턴] [로봇] 자율주행 로봇 개발자', 'ROBOTICS_AUTONOMOUS', 'NEW_GRAD_ONLY', '원티드 상세에 경력 무관·신입 지원 가능, 관련 전공 졸업예정자 가능이 명시됨', 'INTERN_TO_FULL_TIME', '서울 성동구', 0, '["ROS","SLAM","VSLAM","LiDAR","IMU"]', NULL, NULL, NULL, 1, 'SLAM과 센서 융합을 활용해 자율주행 로봇 제어 알고리즘을 개발하는 3개월 정규직전환형 인턴이다.', 'ACTIVE', '29c128b853079fa0864dbea025cbdcdf01a1ad66521a8bc336ed4105e4512ff2', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-01ca01e2ec54c170bbd96ca0', '㈜이젠솔루션', 'SMALL', '사람인 기업 분류상 중소기업 채용 목록으로 확인됨', 'Saramin', '54700914', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54700914&view_type=list', '웹기반 MES 신입 개발자 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '사람인 현재 목록에 신입 정규직과 입사지원 가능 상태가 명시됨', 'FULL_TIME', '대구 북구', 0, '["Java","JavaScript","jQuery","JSP","MES"]', NULL, NULL, '2026-09-09T14:59:59.000Z', 0, '웹 기반 MES를 개발하는 신입 정규직 공고로 Java와 JavaScript 계열 기술을 다룬다.', 'ACTIVE', '62d649586757923f86bede1369df8a73683b3f09bcb7edaf49430f374aba73ef', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-065d340b78f28851e783810b', 'F&F', 'MID', '잡코리아 기업정보에 501~1,000명, 중견기업으로 표시됨', 'JobKorea', '49746362', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49746362', '디지털본부 Java/Spring 백엔드 개발 신입/경력직 개발자 (ERP/AI 시스템) 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME', '서울', 0, '["Java","Spring"]', NULL, NULL, '2026-08-31T14:59:59.000Z', 1, 'ERP와 AI 시스템 관련 Java·Spring 백엔드 개발자를 모집한다. 신입과 경력 모두 지원 가능하다.', 'ACTIVE', '9ae29b726644a537012cd0ec9c47689238ce3c6b0f47f2473548987874a9c742', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-0e390685857d69dcc07c7421', '㈜비욘드테크', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49730137', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49730137', '[신입] Mobile Device Management (MDM) 솔루션 개발자 채용', 'SOLUTION_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에 신입이 명시됨', 'FULL_TIME', '서울', 0, '["MDM"]', NULL, NULL, '2026-10-05T14:59:59.000Z', 0, '모바일 디바이스 관리 솔루션을 개발하는 신입 정규직 공고다.', 'ACTIVE', '8d64ce908a50c315342cf0deff79da8aafa50ec34cef6fe09d475b130cabfea5', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-0e74f054807260240659f376', '㈜비케이에스엔피', 'STARTUP', '잡코리아 기업정보에 50명 이하 벤처기업으로 표시됨', 'JobKorea', '49749780', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49749780', '은행 S/W프로그램 개발', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME', '서울', 0, '[]', NULL, NULL, '2026-09-09T14:59:59.000Z', 0, '은행용 소프트웨어 프로그램 개발자를 모집하는 신입·경력 정규직 공고다.', 'ACTIVE', '75816217b2ce989c8f507941e791d7bb53becb59d638704f89090526e7ceff62', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-16017b68eab900dcd332123d', '㈜디시스템즈', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49781983', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49781983', 'IT개발·데이터(백엔드/서버개발 외 1개 부문) 모집 공고', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 모집이 명시되며 3년 이상 조건은 경력 트랙에 병기됨', 'FULL_TIME', '경기 용인', 0, '[]', NULL, NULL, '2026-09-12T14:59:59.000Z', 0, '백엔드·서버 개발을 포함한 IT개발·데이터 직무의 신입·경력 정규직 공고다.', 'ACTIVE', '96a09151dcb3f12c9d16527e4c7f56275dcee06d2d2070fd3c2d05c233ef5441', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-3a2d616453bbdd3c00fae610', '㈜플레이웍스', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49803832', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49803832', 'AI 및 라이브 기반 반려동물 양육 플랫폼 프론트엔드 개발자 채용', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '프론트엔드 모집 분야가 신입·경력으로 명시되고 즉시지원 버튼이 활성 상태임', 'FULL_TIME', '서울 강남구', 0, '[]', NULL, '2026-08-17T15:00:00.000Z', '2026-09-17T14:59:59.000Z', 0, 'AI·라이브 기능을 활용하는 반려동물 양육 플랫폼의 프론트엔드 개발자 공고다.', 'ACTIVE', '759a19218e198b9ec55b629b4287e3079d01ed0dd014020faf190bdac1446da5', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-41e22ef84faa0010eb2ba33d', '라이트에이아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'Wanted', '375795', 'https://www.wanted.co.kr/wd/375795', '마케팅 AI 에이전트 Backend 개발자 (신입)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '신입·주니어 대상이며 관련 전공 졸업예정자를 포함하고, 관련 전공자는 실무 경력을 요구하지 않는다고 명시됨', 'UNCONFIRMED', '서울 강남구', 0, '["Python","Terraform","FastAPI","Dify","AWS","EKS","RDS","ECR","S3","Docker","GitAction"]', NULL, NULL, '2026-08-31T14:59:59.000Z', 0, '마케팅 성과 분석 서버와 AI 연동 데이터 파이프라인, 클라우드 인프라를 개발하는 신입 백엔드 공고다.', 'ACTIVE', 'c972612306866006b98d7c32640a601ced0f295d9baf7da8173e64728d81a755', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-4860052a88eef7a4e93f6b5c', '㈜세인티', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시됨', 'JobKorea', '49749703', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49749703', '[신입/경력] Web 프론트엔드 개발자 모집(스마트팩토리, AI 솔루션)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '모집 대상이 신입·경력으로 명시되고 상세 페이지의 즉시지원 버튼이 활성 상태임', 'FULL_TIME_OR_CONTRACT', '서울 강서구', 0, '[]', NULL, '2026-08-09T15:00:00.000Z', '2026-09-09T14:59:59.000Z', 1, '스마트팩토리·AI 솔루션의 웹 프론트엔드 개발자를 모집하며 신입 지원이 가능하다.', 'ACTIVE', 'f243ffcabd605da061f2fe80fd772eb9dc21981b3ff28d82b7b6e12046f79f00', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-491449af5c4ada4dd7a1671f', '㈜제로데이 시큐리티', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49761888', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49761888', '[학원수료환영] 웹(Web) 개발자 모집합니다..', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에 신입이 명시됨', 'FULL_TIME', '서울', 0, '[]', NULL, NULL, '2026-08-27T14:59:59.000Z', 0, '보안 전담이 아닌 웹개발 직무의 신입 정규직 공고다. 학원 수료자도 환영한다고 안내한다.', 'ACTIVE', 'fe712d829359996135a4f0dda44dde9502de5bb02234dd10637ef7bb895efecf', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-4bec4343ff1bbdfa9e3c850b', '금융감독원', 'PUBLIC', '금융감독원 공개채용 공고다.', '인디스워크', '388237', 'https://inthiswork.com/archives/388237', '2027년도 종합직원(5급) 채용 - 정보기술(IT)', 'FINANCIAL_IT', 'NEW_GRAD_ONLY', '공개경쟁 신입채용으로 학력·연령·전공 제한 없이 정보기술 분야 17명을 모집한다.', 'FULL_TIME', '서울', 0, '["Information Technology","Financial IT"]', '2026-08-17T15:00:00.000Z', '2026-08-18T15:00:00.000Z', '2026-09-07T03:00:00.000Z', 0, '금융감독원 2027년도 신입 종합직원 공개채용의 정보기술 분야로 17명을 모집하며 9월 7일 12시(KST) 마감이다.', 'ACTIVE', '6c31bfe0bfc16cc94f3cc85062095f2eed59fc67e6025bcdcb56a01d5b3d1dcb', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-4cf68e2af025e2d7aad02e6c', '한국석유공사', 'PUBLIC', 'NCS 공정채용에 등록된 공공기관 채용이다.', 'NCS 공정채용', '28690', 'https://jasoseol.com/recruit/105651', '2026년 신입직원 채용 - 기술 IT', 'PUBLIC_ICT', 'NEW_GRAD_ONLY', '6급 대졸수준 공개채용의 기술_IT 모집 단위로 확인했다.', 'FULL_TIME', '울산·전국', 0, '["IT","Information Systems"]', '2026-08-12T15:00:00.000Z', '2026-08-12T15:00:00.000Z', '2026-08-28T14:59:59.000Z', 0, '한국석유공사 6급 대졸수준 신입 공개채용의 기술 IT 모집 단위다. 공개 목록의 8월 28일 마감일은 날짜 말로 정규화했다.', 'ACTIVE', '7e440383a95ca980c5ea62b5efede29ea1f2433e79af86db01522e971b51226f', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-5045ab95b218b523cc20f803', 'iMBC', 'MID', '현재 공개 상세가 중견기업으로 표시한다.', '인비원', '174848', 'https://office.invione.com/jobs/recruitment/open/detail/174848', '웹개발(신입)', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 상세가 웹개발 신입 정규직을 명시한다.', 'FULL_TIME', '서울', 0, '["Web Development"]', '2026-08-17T15:00:00.000Z', '2026-08-17T15:00:00.000Z', '2026-08-28T14:59:59.000Z', 0, 'iMBC 웹개발 신입 정규직 공고로 공식 Careerlink 접수 링크가 연결된다. 공개된 8월 28일 마감일은 날짜 말로 정규화했다.', 'ACTIVE', '324f310e42b6b32cfeccfbf6824b5b0cb749881e8c4d0b701e75d5a06d396e6a', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-51eabae7de6028d706e6cd7c', '엑스와이지', 'STARTUP', '누적 150억 원 투자 유치 로봇 스타트업으로 상세에 소개됨', 'Wanted', '336181', 'https://www.wanted.co.kr/wd/336181', '[인턴] [서비스 로봇] Physical AI 개발자', 'AI_ROBOTICS', 'NEW_GRAD_ONLY', '원티드 상세에 경력 무관·신입 지원 가능, 관련 전공 졸업예정자 가능이 명시됨', 'INTERN_TO_FULL_TIME', '서울 성동구', 0, '["Python","Reinforcement Learning","Isaac Sim","MuJoCo"]', NULL, NULL, NULL, 1, '서비스 로봇용 모방학습·강화학습 모델과 데이터 수집·튜닝을 수행하는 3개월 정규직전환형 인턴이다.', 'ACTIVE', '088587d9a86ece1daceb2d05e3c6cda41d37f246d8dae1cd4426dc15ad3f7e0d', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-58839496dbd0624b70829b38', '㈜하드램', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49649110', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49649110', 'SW팀 채용', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '지원자격에 신입 및 졸업예정자 가능이 명시됨', 'FULL_TIME', '경기 수원', 0, '[]', NULL, NULL, '2026-09-22T14:59:59.000Z', 1, '반도체·디스플레이 분야 기업의 SW팀에서 소프트웨어 엔지니어 신입을 모집한다.', 'ACTIVE', 'd1c4e2be4e9265cc1cf9e10ebf93dd7843d19c15b00027658597c0198d0321ae', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-6bdc3ceca5a3cbda73fa90fe', '㈜유알피', 'UNCLASSIFIED', '상세에서 기업 규모 근거를 최종 확정하지 못함', 'JobKorea', '49763378', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49763378', 'AI 응용/백엔드 개발 포지션 신입&경력 채용', 'BACKEND_AND_AI', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 구분에 신입·경력이 표시됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, NULL, '2026-08-31T14:59:59.000Z', 0, 'AI 응용과 백엔드 개발 포지션을 함께 모집하는 신입·경력 공고다.', 'ACTIVE', '7bef5e6816b438331f5f67bd7ab5d075b7f7250a83361154fda9192a878d9828', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-6dff8dc0dbfb53990362a530', '㈜아이셋디엑스', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49722786', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49722786', '산업용 C# 소프트웨어 개발자 채용', 'INDUSTRIAL_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시되고 현재 잡코리아 즉시지원이 가능함', 'FULL_TIME', '경기 이천시', 0, '["C#"]', NULL, '2026-08-04T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, '산업용 설비에 사용되는 C# 소프트웨어를 개발하는 경력무관 정규직 공고다.', 'ACTIVE', '06163c9c98d5afda2e9dab64d1cb0853f8366c029f93f0f7e20c67476f8a609a', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-71d1ffb83e285d5952da1475', '넛지헬스케어㈜', 'STARTUP', '잡코리아 기업정보에 51~300명 벤처기업으로 표시됨', 'JobKorea', '49748610', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49748610', '[캐시워크] 데이터엔지니어 채용전환형 인턴', 'DATA_ENGINEERING', 'NEW_GRAD_ONLY', '지원자격에 신입 및 졸업예정자 가능이 명시됨', 'INTERN', '서울', 0, '[]', NULL, NULL, NULL, 1, '캐시워크 데이터 엔지니어 업무를 수행하는 3개월 채용전환형 인턴 공고다.', 'ACTIVE', 'f0531701a18d0037ba4e0b3212b26635b712ff46223a31369b6b7f500c842ec2', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-761583e713477c72f0f50c82', '팀카이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '158834', 'https://www.rocketpunch.com/jobs/158834', 'Agent Engineer (계약직)', 'AI_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '경력 구분에 신입·주니어·미들이 포함되고 간편 지원하기가 활성 상태임', 'CONTRACT', '서울 강남구 도곡동', 1, '["LLM","TypeScript","Node.js","API","LLM-as-Judge"]', NULL, NULL, '2026-09-14T14:59:59.000Z', 0, 'LLM 에이전트의 개발과 평가를 담당하는 신입 지원 가능 계약직 공고다.', 'ACTIVE', 'fde4e15f2a6e25a12cbfb35fdaa3e243a8369dd487d2551e82fb373b99062ae9', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-8395fc2b1e31314591bc2169', '크레비스파트너스', 'UNCLASSIFIED', '공개 상세만으로 기업 규모를 확정하지 않았다.', '인디스워크', '388006', 'https://inthiswork.com/archives/388006', 'SaaS Software Engineer 전환형 인턴', 'FULL_STACK_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '대학교 졸업예정자 또는 학사학위 보유자가 지원 가능한 전환형 인턴이다.', 'INTERNSHIP', '서울 성동', 0, '["SaaS","Web Development","Cloud","Container"]', '2026-08-18T15:00:00.000Z', '2026-08-18T15:00:00.000Z', '2026-09-01T14:59:59.000Z', 0, 'SaaS 제품을 개발하고 3개월 후 정규직 전환평가를 진행하는 소프트웨어 엔지니어 인턴이다.', 'ACTIVE', 'e0c552efd14550df935c434b4e28464d94ec848398193739dcee08ed775f3f8a', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-858c8e364cbd026e6a8f2559', '포도소프트웨어', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49716794', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716794', '[2026 하반기] 웹개발 연구부서 신입 사원 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고에 신입 모집 및 졸업예정자 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '[]', NULL, NULL, '2026-09-03T14:59:59.000Z', 0, '웹·앱 애플리케이션을 개발하는 연구부서 신입 채용이다. 졸업예정자도 지원할 수 있다.', 'ACTIVE', '5cc40ab979aa6f2d40e14c8970a8ce2ec89777720981bc63ad6942bee95699b9', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-897d1e13630a9c8679cbdf0b', '트리플오스', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'Wanted', '356275', 'https://www.wanted.co.kr/wd/356275', '백엔드 개발자(신입)', 'BACKEND', 'NEW_GRAD_ONLY', '공고 제목과 경력 구분에 신입이 명시됨', 'UNCONFIRMED', '경기 성남시', 0, '["Kotlin","Spring Boot","Java","MySQL","Redis","MongoDB","Git","Jira"]', NULL, NULL, NULL, 1, 'Kotlin·Spring Boot 기반 API와 마이크로서비스를 구현·운영하는 신입 백엔드 공고다.', 'ACTIVE', '8815ac02967d6d5fba54503fd89f43d17101fde15ed5ac18639ad0ad20515751', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-8b31259da419f601018ce278', '와커스(WACUS)', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49783772', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49783772', '[웹에이전시 WACUS] 웹 프론트엔드 개발자 채용', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시되고 현재 잡코리아 즉시지원이 가능함', 'FULL_TIME', '서울 송파구', 0, '[]', NULL, '2026-08-13T15:00:00.000Z', '2026-09-13T14:59:59.000Z', 0, '웹에이전시에서 프론트엔드 개발자를 모집하는 경력무관 정규직 공고다.', 'ACTIVE', 'd8eabea31baa3632be2e44f26bcec7ac332bb61598678106ed140c0393d2fa32', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-996cd3a3846c31817ad82eef', 'SGI서울보증', 'PUBLIC', '공공 성격의 보증보험 기관 공개채용으로 분류했다.', '링커리어', '342806', 'https://linkareer.com/activity/342806', '2027년 신입사원(4급) - 전산 정보기술', 'FINANCIAL_IT', 'NEW_GRAD_ONLY', '신입 채용의 전산-정보기술 모집 단위이며 정보보호 모집 단위는 포함하지 않았다.', 'FULL_TIME', '서울 종로', 0, '["Information Technology","Financial IT"]', '2026-08-12T15:00:00.000Z', '2026-08-12T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, 'SGI서울보증 2027년 신입사원 채용의 전산 정보기술 모집 단위다. 공개된 9월 4일 마감일은 날짜 말로 정규화했다.', 'ACTIVE', '9c6fbed06c467b431065f36b5eeca31517eceda9d75c62cff7c73c7eeddabc39', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-9a71afc94c05b585737ebc3f', '㈜아이낸스', 'UNCLASSIFIED', '상세에서 기업 규모 근거를 최종 확정하지 못함', 'JobKorea', '49760249', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49760249', '증권금융IT 전문기업 신입·경력 개발자 모집', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 및 졸업예정자 지원 가능이 표시됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, NULL, '2026-09-30T14:59:59.000Z', 0, '증권·금융 IT 분야의 서버와 클라이언트 개발자를 모집하는 신입·경력 공고다.', 'ACTIVE', '132e4b785edb602a454f84ed22c615e79ba9ba99668fdcc05f30025c70e13a12', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-a01145b7998cfa5061a6b281', 'SK하이닉스', 'LARGE', 'SK Careers의 SK하이닉스 공식 기술사무직 신입 공고로 확인함', 'SK Careers', 'R261762', 'https://www.skcareers.com/Recruit/Detail/R261762', '[''26년 하반기] Talent hy-way 기술사무직 신입', 'MULTI_IT_ROLES', 'NEW_GRAD_ONLY', 'SK Careers 공식 공고 제목과 모집 구분에 신입(New)이 명시되고 2027년 1월부터 정규 근무 가능한 지원자를 모집함', 'FULL_TIME', '이천·분당·서울·용인·청주', 0, '["System Architecture","Software Solution","IT"]', '2026-08-19T15:00:00.000Z', '2026-08-19T15:00:00.000Z', '2026-08-26T08:00:00.000Z', 0, 'SK하이닉스 기술사무직 신입 통합채용으로 IT, System Architecture·SW Solution, Solution SW 직무가 포함되어 있다.', 'ACTIVE', '1f6a4a95bf52a528273b0256df7482337b3a1bed14dd249cbdc394b15b76c954', '2026-08-21T00:28:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T00:28:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-a3f7e43cff6b369a929ff32d', '㈜디비투이', 'SMALL', '사람인 기업 분류상 중소기업 채용 목록으로 확인됨', 'Saramin', '54799027', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?adsCategoryItem=effect_bold&rec_idx=54799027&view_type=list', '[디비투이] 신입,경력 (웹개발자,DBA/DBE) 채용', 'DATABASE_AND_WEB', 'NEW_GRAD_ELIGIBLE', '사람인 현재 목록에 신입·경력 정규직과 입사지원 가능 상태가 명시됨', 'FULL_TIME', '서울 서초구', 0, '["Web Development","DBA","DBE","Data Analysis"]', NULL, NULL, '2026-10-19T14:59:59.000Z', 0, '웹 개발과 데이터베이스 관리·엔지니어링 직무의 신입·경력 정규직을 함께 모집한다.', 'ACTIVE', '4490c0c02787665626aea23cf00a45c385ef74f09ef7d73240a2212d35aa9423', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-a682ee1dd5ac993d64e10cab', 'NAVER', 'UNCLASSIFIED', '해당 공식 공고에서 기업 규모 분류 근거를 별도로 수집하지 않음', 'NAVER Careers', '30005300', 'https://recruit.navercorp.com/rcrt/view.do?annoId=30005300', '[NAVER] 인공지능 기반 실시간 진료기록 생성 기술 연구 개발 (체험형 인턴)', 'AI_RESEARCH', 'NEW_GRAD_ONLY', '공식 페이지에서 New hire·Intern으로 표시되고 Apply 링크가 활성 상태임', 'INTERN', '미확인', 0, '["AI","Machine Learning","NLP","Generative AI","LLM","RAG","Python","PyTorch","Knowledge Extraction"]', NULL, '2026-08-17T15:00:00.000Z', '2026-08-27T01:00:00.000Z', 0, '실시간 진료 대화를 의료기록으로 변환하는 AI 모델을 연구개발하는 체험형 인턴 공고다.', 'ACTIVE', '7c867293fc3cd3c60dcf72f0b06ea85a185b9ecbdc5b1249985ded4baa34a28e', '2026-08-20T00:52:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:52:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-b049ef1ee835be195dbaf3e6', '렉스코드', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시됨', 'JobKorea', '49716823', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716823', '렉스코드 백엔드 개발자 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시되고 상세 페이지에서 현재 즉시지원이 가능함', 'FULL_TIME', '서울 서초구', 0, '[]', NULL, '2026-08-03T15:00:00.000Z', '2026-09-03T14:59:59.000Z', 0, '서울 서초구에서 백엔드 개발자를 모집하는 경력무관 정규직 공고다.', 'ACTIVE', 'ac04538cbce5afb694d2f8495b0c4c4335df008bfd5ae6b39bf4350963295a4d', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-b05541da0aed537c6db043f3', '연합인포맥스', 'UNCLASSIFIED', '공개 상세만으로 기업 규모 분류를 확정하지 않았다.', '자소설닷컴', '105724', 'https://jasoseol.com/recruit/105724', '영업 부문(경력) 및 IT개발직(신입) 채용 - IT개발', 'SOFTWARE_DEVELOPMENT', 'NEW_GRAD_ONLY', '현재 상세의 모집 직무에서 IT개발을 신입으로 명시한다.', 'FULL_TIME', '서울', 0, '["Software Development","IT"]', NULL, '2026-08-19T16:00:00.000Z', '2026-08-30T05:59:00.000Z', 0, '연합인포맥스의 신입 IT개발 직무로, 2026년 8월 30일 14시 59분(KST)까지 지원하는 기간제 공고다.', 'ACTIVE', 'a28148692100bd6243df15578256c4b39e5c68488f47ac3d8fa0a69078126d29', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-b70a5b1588e30ad9afa48780', '모그포그', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49779691', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49779691', '[MOGG FOGG] Shopify 프론트엔드 개발자 채용 (신입·경력)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '신입·경력 공고이며 졸업예정자 지원 가능과 현재 즉시지원 상태가 함께 확인됨', 'FULL_TIME_OR_FREELANCE', '서울 성북구', 1, '["반응형웹","웹개발","Shopify"]', NULL, '2026-08-12T15:00:00.000Z', '2026-09-12T14:59:59.000Z', 0, 'Shopify 기반 프론트엔드 개발자를 모집하며 신입과 졸업예정자도 지원할 수 있다.', 'ACTIVE', '42e0b65e54d7a1dca0883905d0e973d07608fdffd41a6581fdf4dca1ddc2e2e6', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-b82d38e7c4fe7de751b8bdc3', '㈜해양정보기술', 'SMALL', '잡코리아 기업정보에 51~300명 중소기업으로 표시됨', 'JobKorea', '49716925', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716925', '해양수치모델링 개발 분야 정규직 채용', 'DATA_SCIENCE', 'NEW_GRAD_ELIGIBLE', '경력무관 및 졸업예정자 지원 가능이 명시되고 현재 즉시지원이 가능함', 'FULL_TIME', '서울 금천구', 0, '[]', NULL, '2026-08-04T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, '해양 수치모델링과 관련 개발 업무를 수행하는 경력무관 정규직 공고다.', 'ACTIVE', '26000e8e4d57255459ef4f0a1d03f2fb423efb29f9bbebb07589c0e143116e5f', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-c1bfb1a8878654a8a7558ac2', '㈜플러스하이', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49658565', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49658565', '성장률 200프로 진행중인 회사의 개발자모집(React)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME_OR_CONTRACT', '서울', 0, '["React"]', NULL, NULL, '2026-08-26T14:59:59.000Z', 0, 'React 기반 개발자를 모집하는 신입·경력 공고다. 정규직과 계약직 형태가 함께 제시돼 있다.', 'ACTIVE', 'd8f514450020e771236842ed045a876b77fe962d522e4c84c36e55d6b1cccee4', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-c480d9a8cb42049382275915', '팀카이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159144', 'https://www.rocketpunch.com/jobs/159144', 'FDE(Forward-Deployed 엔지니어) 인턴', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '인턴이며 경력 구분에 신입·주니어가 포함됨', 'INTERN', '미확인', 0, '[]', NULL, NULL, '2026-11-06T14:59:59.000Z', 0, '고객 현장 문제 해결과 제품 적용을 담당하는 FDE 인턴 공고다.', 'ACTIVE', 'faa773baa94c8a1172f99b01e9dd6e028580323029c60eb591b2ee0edecc0b1c', '2026-08-15T11:01:49.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:49.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-cad1d4794f76e745dd326a46', '㈜로브로스', 'UNCLASSIFIED', '공개 목록에서 기업 규모를 확정할 근거를 수집하지 못함', 'Saramin', '54792925', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54792925&view_type=list', 'AI Research Scientist - Robot Action', 'AI_ROBOTICS', 'NEW_GRAD_ELIGIBLE', '사람인 현재 목록에 신입·경력, 대졸 이상, 입사지원 가능으로 표시됨', 'FULL_TIME', '서울 강남구', 0, '["AI","Robotics","Machine Learning"]', NULL, NULL, '2026-09-19T14:59:59.000Z', 0, '로봇 행동 연구를 위한 AI Research Scientist를 모집하며 신입과 경력 모두 지원할 수 있다.', 'ACTIVE', '35792ac484f1b3581b6ad041563ab9a6f491e8793f0fc16ea13f8cbb7b41c7ae', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-cdb129a17846b17574504c4b', '㈜무브', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49724108', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49724108', 'MOVV 백엔드 개발자 신규채용', 'BACKEND', 'NEW_GRAD_ONLY', '지원자격에 신입이 명시되고 현재 잡코리아 즉시지원 버튼이 활성 상태임', 'FULL_TIME', '광주 북구', 0, '[]', NULL, '2026-08-04T15:00:00.000Z', '2026-09-04T14:59:59.000Z', 0, 'MOVV 서비스의 백엔드 개발을 담당할 신입 정규직 공고다.', 'ACTIVE', 'a20fbe186864b8e09378d31651633a4143413b00aa218dba62261e6c9db86504', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-cdbfa38eb694b6d677183a9f', '핑바㈜', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49744417', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49744417', 'AI SaaS 관련 프론트엔드 개발자 채용 건', 'FRONTEND', 'NEW_GRAD_ONLY', '공고에 신입 모집 및 졸업예정자 지원 가능이 명시됨', 'FULL_TIME_OR_CONTRACT', '서울', 0, '["Tailwind CSS","Vite","i18next","Zod","Nanostores"]', NULL, NULL, '2026-09-08T14:59:59.000Z', 0, 'AI SaaS 서비스의 프론트엔드 개발자를 모집한다. 정규직과 정규직 전환 가능 계약직 형태가 함께 제시돼 있다.', 'ACTIVE', 'e13adee9246fd05322a88990729961e721c3f82b4a4f037a78d15f8b9ee5f5c4', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-d5201fd05ffa7b2a582bff0e', '㈜픽셀', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49607918', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49607918', '㈜픽셀 2026년 검사 설비 S/W 개발자 채용', 'INDUSTRIAL_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '모집 대상에 신입·경력이 구분되어 있고 현재 즉시지원 버튼이 활성 상태임', 'FULL_TIME', '경기 평택시', 0, '[]', NULL, '2026-07-19T15:00:00.000Z', '2026-09-18T14:59:59.000Z', 0, '검사 설비용 소프트웨어를 개발하는 신입·경력 정규직 공고다.', 'ACTIVE', 'e1c9e5ffd81f6653f9d152f5860fee650a821264441cf24e7d7f38bbd76818c2', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-da71d2a468af202f6c766966', '㈜원시', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49788950', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49788950', '신규 웹서비스를 함께 만들어갈 백엔드 개발자 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '모집 구분에 신입·경력이 명시되고 현재 잡코리아 즉시지원이 가능함', 'FULL_TIME', '제주 제주시', 0, '["NestJS"]', NULL, '2026-08-13T15:00:00.000Z', '2026-09-13T14:59:59.000Z', 0, '제주 근무의 신규 웹서비스 백엔드 개발자로, 신입과 경력 모두 지원할 수 있다.', 'ACTIVE', '7fb88fe0728c2657c88af45aa8130d1da9f6e5482744ada4680a6e6c8e93e3fb', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T00:47:05.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-e0c4a7fd9b33b32501729366', 'KOG', 'MID', '공개 회사 정보와 채용 상세를 근거로 중견 규모 게임사로 분류했다.', '인디스워크', '388304', 'https://inthiswork.com/archives/388304', 'DBA (상시채용)', 'DATABASE', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 IT 목록에서 신입/인턴과 주니어경력 대상으로 분류된다.', 'FULL_TIME', '대구', 0, '["DBA","Database","SQL"]', NULL, NULL, NULL, 1, '게임 서비스 데이터베이스를 운영하는 신입 지원 가능 DBA 상시채용 공고다.', 'ACTIVE', '5e61dff8135e2cd18890b340a2a13e299defc66bf43e73f8dd84a7a513e43050', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z', '2026-08-21T02:51:23.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-e31f514387c76c68148795e9', '㈜윈비트', 'STARTUP', '잡코리아 기업정보에 50명 이하 벤처기업으로 표시됨', 'JobKorea', '49686653', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49686653', 'Java 백엔드/AI 데이터 개발자 (신입)', 'BACKEND_AND_AI_DATA', 'NEW_GRAD_ONLY', '공고와 지원자격에 신입이 명시됨', 'FULL_TIME', '서울', 0, '["Java","Spring","Spring Boot"]', NULL, NULL, '2026-08-29T14:59:59.000Z', 0, 'Java 기반 백엔드와 AI 데이터 개발을 담당할 신입 정규직을 모집한다.', 'ACTIVE', '869cdcfa2c33f25c5b70d3087cd36a2260537de1fc7bd3125dce210297512112', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:01:21.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-f348d3decb584eb0bb36b0ec', '건강보험심사평가원', 'PUBLIC', '공공기관 건강보험심사평가원의 정규직 채용으로 확인됨', 'Saramin', '54794868', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54794868&view_type=list', '2026년 하반기 정규직 채용(시스템개발)', 'CORPORATE_IT', 'NEW_GRAD_ELIGIBLE', '사람인 현재 목록에 경력무관·학력무관 정규직과 홈페이지 지원 가능 상태가 명시됨', 'FULL_TIME', '강원 원주시', 0, '["Information Systems","Software Architecture","ICT"]', NULL, NULL, '2026-09-02T14:59:59.000Z', 0, '건강보험심사평가원의 시스템 개발 정규직 공고로 경력과 학력 제한 없이 지원할 수 있다.', 'ACTIVE', 'ce08fffcf81c3e2ac889483301b5cab160144457657a266957290dae43d66038', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z', '2026-08-20T21:08:35.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-fbf38bf76b446789ee84461a', '㈜터보소프트', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49787297', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49787297', 'Product Software Engineer(Java중심, 기획·설계 포함)신입/경력사원 모집', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입·경력 모집이 명시되고 지원자격은 경력무관으로 표시됨', 'FULL_TIME', '충북 청주', 0, '["Java","EgovFramework","JPA","Hibernate","MyBatis","REST","OpenAPI","Oracle","MySQL","PostgreSQL","Elasticsearch","OpenSearch","CI/CD"]', NULL, NULL, '2026-08-31T14:59:59.000Z', 0, 'Java 중심의 제품 소프트웨어를 기획·설계·개발하는 신입·경력 정규직 공고다.', 'ACTIVE', '8c536a2bb40911a2bfd5089fd9504b5d8f0f1ed5ac4e2613edb0abc5d6c54e31', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z', '2026-08-15T11:10:32.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-79772b41c353efb7be7c6565', '비케이고', 'SMALL', '공개 기업정보상 2024년 설립 기업으로 확인되며 대기업·공공기관 근거는 없다.', 'JobKorea', '49806283', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49806283', '[비케이고] 프론트엔드 개발자[신입] 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '현재 잡코리아 상세가 경력 신입, 학력무관, 정규직으로 표시되고 지원 기간이 2026-08-27까지 열려 있다.', 'FULL_TIME', '서울 성동구', 0, '["JavaScript","TypeScript","React","iOS","Android"]', NULL, '2026-08-19T00:00:00.000Z', '2026-08-27T14:59:59.000Z', 0, '모바일 서비스를 포함한 프론트엔드 기능을 개발하는 학력무관 신입 정규직 공고다.', 'ACTIVE', '71f66b81ae50d6a4dc8d6b22589092d74678049818ce0c51804f8bd3da55bd99', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-644d94efebbebf48fa3d726e', '수퍼빈', 'STARTUP', '잡코리아 기업정보에 51~300명 규모 벤처기업으로 표시된다.', 'JobKorea', '49768006', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49768006', '[수퍼빈] 개발 엔지니어 채용 (AI, 로봇 SW)', 'ROBOTICS_AUTONOMOUS', 'NEW_GRAD_ELIGIBLE', '현재 잡코리아 상세가 AI·로봇 SW 엔지니어를 경력무관·학력무관 정규직으로 표시한다.', 'FULL_TIME', '경기 성남시', 0, '["C++","Python","Robot Control","Computer Vision"]', '2026-08-13T00:00:00.000Z', '2026-08-13T00:00:00.000Z', '2026-10-11T14:59:59.000Z', 0, '산업용 로봇 제어와 AI 비전 소프트웨어를 개발하는 경력무관 정규직 공고다.', 'ACTIVE', 'ae2760649b1bfcd3916de9400a337dd6fdd599c689a34603ebf67929513b06de', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-491c06e392d44452f3d74bcc', '인터오리진아이엔씨', 'SMALL', '공개 상세에서 대기업·공공기관 근거를 확인하지 못해 중소 규모로 분류했다.', '인디스워크', '390419', 'https://inthiswork.com/archives/390419', '[신입 및 경력] AI 개발 담당자 채용', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 제목에 신입 및 경력이 명시되고 AI 모델·서비스·데이터 파이프라인 개발 업무가 확인된다.', 'FULL_TIME', '서울 강남구', 0, '["Python","LLM API","AWS","GCP","Data Pipeline"]', '2026-08-23T06:05:19.000Z', NULL, NULL, 1, 'AI 모델 최적화와 생성형 AI 웹·앱 서비스, 학습·서빙 데이터 파이프라인을 개발하는 상시채용 공고다.', 'ACTIVE', '152835b67fd469947083723dee180471e2372082b347574fa02c7729a11cecdf', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-a497df7243bf96763b673e86', '기어세컨드', 'STARTUP', '모바일 게임 개발 스타트업의 공개 채용 페이지다.', '인디스워크', '390363', 'https://inthiswork.com/archives/390363', '서버 프로그래머 (전환형 인턴)', 'BACKEND_DEVELOPMENT', 'NEW_GRAD_ONLY', '인디스워크 신입·인턴 목록과 현재 공식 지원 페이지가 경력무관 전환형 인턴으로 표시한다.', 'INTERN_TO_FULL_TIME', '서울 성동구', 0, '["Spring Boot","MySQL","React","TCP"]', '2026-08-22T12:02:25.000Z', NULL, NULL, 1, '게임 서버와 내부 운영 플랫폼을 개발하는 경력무관 채용전환형 인턴 상시채용 공고다.', 'ACTIVE', 'dd373fb48f9ae6a9a0c7bdd0d96a1eae3ea46cca22fa9ec83e9530daa93043b7', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-f348484e0733dd04fffe5245', '코텍', 'MID', '상장 제조기업 채용으로 공개 기업정보를 근거로 중견 규모로 분류했다.', '인디스워크', '389304', 'https://inthiswork.com/archives/389304', 'FW개발(신입) 담당자 모집', 'FIRMWARE_EMBEDDED', 'NEW_GRAD_ONLY', '현재 인디스워크 상세가 FW개발 신입과 신입 처우를 명시하고 채용 시 마감으로 안내한다.', 'FULL_TIME', '인천', 0, '["C","Firmware","Embedded","Debugging"]', '2026-08-21T11:01:57.000Z', NULL, NULL, 1, '모니터 제품군 펌웨어를 개발하고 이슈를 분석·디버깅하는 신입 상시채용 공고다.', 'ACTIVE', '0fbb55500a4bf4600319652a5e4d40aff29f8bef805275aed16dc0e352a3e1c6', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-eff852b9b7d45f76ceef2db3', '라이드플럭스', 'STARTUP', '자율주행 소프트웨어 딥테크 스타트업으로 상세에 소개된다.', '인디스워크', '389234', 'https://inthiswork.com/archives/389234', '[서울] 백엔드 개발 Engineer (정규직·채용연계형 인턴)', 'BACKEND_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 상세가 정규직 신입·경력과 6개월 채용연계형 인턴을 모두 명시한다.', 'INTERN_TO_FULL_TIME', '서울 영등포구', 1, '["C++","Python","TypeScript","Docker","Kubernetes","gRPC","AWS"]', '2026-08-21T08:30:07.000Z', NULL, NULL, 1, '자율주행 차량 원격 운영 환경과 실시간 통신 서버를 개발하는 신입·인턴 지원 가능 상시채용 공고다.', 'ACTIVE', '2eb043a9a0d6bee217b0377e03d683eba705be57c5efdfd78cf2779419c8c605', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-c9642c5ab8f663ed9894bf16', '라이드플럭스', 'STARTUP', '자율주행 소프트웨어 딥테크 스타트업으로 상세에 소개된다.', '인디스워크', '389236', 'https://inthiswork.com/archives/389236', '[화성] 자율주행 차량 SI 담당자 (정규직·채용연계형 인턴)', 'SYSTEM_INTEGRATION', 'NEW_GRAD_ELIGIBLE', '현재 상세가 정규직 신입·경력과 6개월 채용연계형 인턴을 명시한다.', 'INTERN_TO_FULL_TIME', '경기 화성시', 0, '["Linux","CAN","TCP/IP","LiDAR","Camera","GNSS","IMU"]', '2026-08-21T08:32:00.000Z', NULL, NULL, 1, '자율주행 차량의 하드웨어·소프트웨어·네트워크를 통합하고 검증하는 신입·인턴 지원 가능 상시채용 공고다.', 'ACTIVE', '1067938f29bf8080edd2f80bbcce73d87be0d627f6bc0fee3b29eb89495ae402', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-c9a88172952ae021fa97ba73', '커넥트웨이브', 'MID', '다수 커머스 플랫폼을 운영하는 상장기업으로 공개 기업정보를 근거로 분류했다.', '인디스워크', '389267', 'https://inthiswork.com/archives/389267', '[플레이오토] 솔루션 개발자', 'FULLSTACK_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 인디스워크 신입·인턴 목록에 노출되고 상세에서 프론트엔드·백엔드 통합개발과 채용 시 마감을 확인했다.', 'FULL_TIME', '서울', 0, '["C#","PHP","JavaScript","Node.js","React","API"]', '2026-08-21T09:00:00.000Z', NULL, NULL, 1, '플레이오토 통합관리 솔루션과 국내외 쇼핑몰 API를 개발하는 신입 지원 가능 상시채용 공고다.', 'ACTIVE', '5f33d1a0f354c9a7ae499334183d7b95980681adadda5307fd66ad54a598d518', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-cea1ba1532476101d85d44d8', '다우데이타', 'LARGE', '다우데이타 공개 기업정보를 근거로 대기업 계열로 분류했다.', '자소설닷컴', '105528', 'https://jasoseol.com/recruit/105528', '2026년 3분기 신입/경력사원 모집 - IT기획운영팀 IT 운영(인턴)', 'IT_OPERATIONS', 'NEW_GRAD_ONLY', '현재 자소설닷컴 상세에서 IT기획운영팀 IT 운영이 인턴 모집 직무로 표시되고 지원 종료 전이다.', 'INTERN', '서울', 0, '["IT Operations","Infrastructure","Autodesk"]', '2026-08-09T15:00:00.000Z', '2026-08-09T15:00:00.000Z', '2026-08-24T14:59:00.000Z', 0, 'IT기획운영팀의 IT 운영 업무를 수행하는 신입 인턴 공고로 기준 시각 현재 지원 가능하다.', 'ACTIVE', '7959aa246eaffd422acd2bdd9086463fd6b8aa5bb6951772b73cc95065e14606', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z', '2026-08-23T21:12:40.000Z')
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
VALUES ('job-87245c984aad680b8895691a', '한화금융', 'LARGE', '한화생명·한화손해보험·한화투자증권·한화자산운용이 참여하는 한화금융 공동 신입공채다.', '한화금융 Careers', '2026-new-grad', 'https://recruit-hanwhafinance.com/', '2026 신입공채 - 신사업(AI/데이터·블록체인·플랫폼/IT)', 'CORPORATE_IT', 'NEW_GRAD_ONLY', '공식 모집 페이지가 2027년 1월 입사 가능한 기졸업자·2027년 2월 졸업예정자를 대상으로 하는 신입공채이며 신사업 직군에 AI/데이터·블록체인·플랫폼/IT를 명시한다.', 'FULL_TIME', '서울', 0, '["AI","Data","Blockchain","Platform","IT"]', '2026-08-21T06:00:00.000Z', '2026-08-21T06:00:00.000Z', '2026-09-18T06:00:00.000Z', 0, '한화 금융 계열사의 AI·데이터, 블록체인, 플랫폼·IT 등 신사업 직무를 모집하는 2026년 신입 정규직 공동채용이다.', 'ACTIVE', '15138c4d7b46e28e5dc90551dd7b30cfce35f435ea00c090f6cac90a3838825a', '2026-08-23T23:26:14.000Z', '2026-08-23T23:26:14.000Z', '2026-08-23T23:26:14.000Z', '2026-08-23T23:26:14.000Z')
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
SET status = 'EXPIRED', updated_at = '2026-08-23T23:26:14.000Z'
WHERE source_url = 'https://www.rocketpunch.com/jobs/159145'
  AND rolling = 0
  AND deadline_at < '2026-08-23T23:26:14.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-23T23:26:14.000Z'
WHERE source_url = 'https://inthiswork.com/archives/387549'
  AND rolling = 0
  AND deadline_at < '2026-08-23T23:26:14.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-23T23:26:14.000Z'
WHERE source_url = 'https://www.superookie.com/jobs/6a7d25abaf923602db79ab82'
  AND rolling = 0
  AND deadline_at < '2026-08-23T23:26:14.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-23T23:26:14.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49706105'
  AND rolling = 0
  AND deadline_at < '2026-08-23T23:26:14.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-23T23:26:14.000Z'
WHERE source_url = 'https://jasoseol.com/recruit/105567'
  AND rolling = 0
  AND deadline_at < '2026-08-23T23:26:14.000Z';
--> statement-breakpoint
UPDATE jobs
SET status = 'REMOVED', last_verified_at = '2026-08-23T21:12:40.000Z', updated_at = '2026-08-23T21:12:40.000Z'
WHERE source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49660820'
  AND rolling = 0
  AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN', 'NEEDS_REVIEW');
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260824-full-revalidation', 'jobs', '792ff1bbbbee57c96e4969cdd6ae3acc3f06bedb231b50580ef651a22ad591f9', 'COMMITTED',
   53, 0, '{"existingItems":95,"incomingItems":53,"matchedItems":43,"addedItems":10,"expiredByDeadlineItems":5,"removedItems":1,"retainedUnconfirmedItems":46,"retainedExistingRollingItems":18,"storedItemsAfter":105,"visibleItemsAfter":99,"snapshotMode":"FULL_REVALIDATION","policy":"full-revalidation-upsert; explicit-deadline-expiry; evidence-backed-removal"}', '2026-08-23T23:26:14.000Z', '2026-08-23T23:26:14.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0029_reconcile_job_catalog_20260824', 'sha256:792ff1bbbbee57c96e4969cdd6ae3acc3f06bedb231b50580ef651a22ad591f9', '2026-08-23T23:26:14.000Z');
--> statement-breakpoint
PRAGMA optimize;
