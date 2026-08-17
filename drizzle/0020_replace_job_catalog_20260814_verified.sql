DELETE FROM collection_items WHERE item_type = 'JOB_POSTING';
--> statement-breakpoint
DELETE FROM notifications WHERE type = 'JOB_DEADLINE';
--> statement-breakpoint
DELETE FROM import_previews WHERE kind = 'jobs';
--> statement-breakpoint
DELETE FROM job_source_snapshot_items;
--> statement-breakpoint
DELETE FROM job_source_snapshots;
--> statement-breakpoint
DELETE FROM workspace_search WHERE kind = 'jobs';
--> statement-breakpoint
DELETE FROM job_tech_stacks;
--> statement-breakpoint
DELETE FROM saved_jobs;
--> statement-breakpoint
DELETE FROM jobs;
--> statement-breakpoint
DELETE FROM import_batches WHERE kind = 'jobs';
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-98b222647a60365ce51b10c6', '㈜퓨전소프트', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49620106', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49620106', '2026년 개발직 신입 및 경력사원 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '모집 구분과 지원자격에 신입·경력이 명시되어 신입 트랙 지원이 가능함', 'FULL_TIME_OR_CONTRACT', '서울', 0, '[]', NULL, '2026-08-20T14:59:59.000Z', 0, '웹개발 및 SI개발 인력을 모집하는 신입·경력 공고다. 정규직과 계약직 형태가 함께 제시돼 있다.', 'ACTIVE', '0c63820b86ca00398d7fa04b8c395e58d1c810b92ae6d7185a2e80590a566c0a', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-858c8e364cbd026e6a8f2559', '포도소프트웨어', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49716794', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716794', '[2026 하반기] 웹개발 연구부서 신입 사원 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고에 신입 모집 및 졸업예정자 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '[]', NULL, '2026-09-03T14:59:59.000Z', 0, '웹·앱 애플리케이션을 개발하는 연구부서 신입 채용이다. 졸업예정자도 지원할 수 있다.', 'ACTIVE', '94721d5f3e8ac0a28c09e48ce5e9c7e52b1eb93edeaa1969a53cc4ad5d86d5ce', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b049ef1ee835be195dbaf3e6', '렉스코드', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49716823', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49716823', '렉스코드 백엔드 개발자 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시됨', 'FULL_TIME', '서울', 0, '[]', NULL, '2026-09-03T14:59:59.000Z', 0, '백엔드 개발자를 채용하는 경력무관 정규직 공고다. 서울 서초구 근무로 안내돼 있다.', 'ACTIVE', '88f59ad39f08a5a3fde0e269ce8266d3addab87a80404e32b4dec5e28b7a0818', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-cdbfa38eb694b6d677183a9f', '핑바㈜', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49744417', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49744417', 'AI SaaS 관련 프론트엔드 개발자 채용 건', 'FRONTEND', 'NEW_GRAD_ONLY', '공고에 신입 모집 및 졸업예정자 지원 가능이 명시됨', 'FULL_TIME_OR_CONTRACT', '서울', 0, '["Tailwind CSS","Vite","i18next","Zod","Nanostores"]', NULL, '2026-09-08T14:59:59.000Z', 0, 'AI SaaS 서비스의 프론트엔드 개발자를 모집한다. 정규직과 정규직 전환 가능 계약직 형태가 함께 제시돼 있다.', 'ACTIVE', '7f11743ea09185812d5c4f903be23721ac4ab4bf4739938d573469df3977161e', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-4860052a88eef7a4e93f6b5c', '㈜세인티', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49749703', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49749703', '[신입/경력] Web 프론트엔드 개발자 모집(스마트팩토리, AI 솔루션)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME_OR_CONTRACT', '서울', 0, '[]', NULL, '2026-09-09T14:59:59.000Z', 1, '스마트팩토리와 AI 솔루션 관련 웹 프론트엔드 개발자를 모집한다. 신입과 경력 모두 지원할 수 있다.', 'ACTIVE', 'f77782a28d8b74deb82dd268510139cf7471ce986c68e774d9d7639135e75a8f', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e31f514387c76c68148795e9', '㈜윈비트', 'STARTUP', '잡코리아 기업정보에 50명 이하 벤처기업으로 표시됨', 'JobKorea', '49686653', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49686653', 'Java 백엔드/AI 데이터 개발자 (신입)', 'BACKEND_AND_AI_DATA', 'NEW_GRAD_ONLY', '공고와 지원자격에 신입이 명시됨', 'FULL_TIME', '서울', 0, '["Java","Spring","Spring Boot"]', NULL, '2026-08-29T14:59:59.000Z', 0, 'Java 기반 백엔드와 AI 데이터 개발을 담당할 신입 정규직을 모집한다.', 'ACTIVE', '0383814f1b7d9fa025b3cbb9b8935980ada18db190fac9c378e917e7e8fca676', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:06.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-9277c75e289564462953eb8b', '㈜에코마케팅', 'MID', '잡코리아 기업정보에 301~500명, 중견기업으로 표시됨', 'JobKorea', '49705317', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49705317', '[에코마케팅]백엔드 개발자(Java) 인턴/신입 채용', 'BACKEND', 'NEW_GRAD_ONLY', '지원자격에 신입 및 졸업예정자 가능이 명시됨', 'INTERN', '서울', 0, '["Java"]', NULL, '2026-08-16T14:50:00.000Z', 0, 'Java 백엔드 업무를 수행하는 정규직 전환 가능 인턴 채용이다. 신입과 졸업예정자가 대상이다.', 'ACTIVE', '101a9c5f18cc1e34e7a8c2083abdd05a90b04f94e1e0a41b1dd311adee17acd2', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-118c30e161b3c620bf03e42a', '㈜디지타스', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49757336', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49757336', '[재고관리 플랫폼 개발] 웹 풀스택 개발자 모집', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시됨', 'CONTRACT', '경기 안산', 0, '[]', NULL, '2026-09-10T14:59:59.000Z', 0, '재고관리 플랫폼의 웹 풀스택 개발자를 모집한다. 12개월 계약 후 정규직 전환이 가능한 형태다.', 'ACTIVE', '7c8efe058ea2456e8c60df534f0146b1d6140f31936ea466231d37c26fb1d91d', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-58839496dbd0624b70829b38', '㈜하드램', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49649110', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49649110', 'SW팀 채용', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '지원자격에 신입 및 졸업예정자 가능이 명시됨', 'FULL_TIME', '경기 수원', 0, '[]', NULL, '2026-09-22T14:59:59.000Z', 1, '반도체·디스플레이 분야 기업의 SW팀에서 소프트웨어 엔지니어 신입을 모집한다.', 'ACTIVE', '4acbaf70ae1f8878959fbdb2cb74b80c3885760d4a3d889b1d50a0050f13b0aa', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-0e390685857d69dcc07c7421', '㈜비욘드테크', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49730137', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49730137', '[신입] Mobile Device Management (MDM) 솔루션 개발자 채용', 'SOLUTION_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에 신입이 명시됨', 'FULL_TIME', '서울', 0, '["MDM"]', NULL, '2026-10-05T14:59:59.000Z', 0, '모바일 디바이스 관리 솔루션을 개발하는 신입 정규직 공고다.', 'ACTIVE', 'd0bf2d86d8b071114a8dbbcf9fcc511bc18fddb2b70ee463a3ce18e8547953b5', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-c1bfb1a8878654a8a7558ac2', '㈜플러스하이', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49658565', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49658565', '성장률 200프로 진행중인 회사의 개발자모집(React)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME_OR_CONTRACT', '서울', 0, '["React"]', NULL, '2026-08-26T14:59:59.000Z', 0, 'React 기반 개발자를 모집하는 신입·경력 공고다. 정규직과 계약직 형태가 함께 제시돼 있다.', 'ACTIVE', 'ad83ed378931021eac7532e7a901efe3084c972f3206b24c2a21984f51e9efd6', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-491449af5c4ada4dd7a1671f', '㈜제로데이 시큐리티', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49761888', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49761888', '[학원수료환영] 웹(Web) 개발자 모집합니다..', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에 신입이 명시됨', 'FULL_TIME', '서울', 0, '[]', NULL, '2026-08-25T14:59:59.000Z', 0, '보안 전담이 아닌 웹개발 직무의 신입 정규직 공고다. 학원 수료자도 환영한다고 안내한다.', 'ACTIVE', '730e2c0ae6cf927b2f8f36b19cac1d871b282f51cbdb633013f00e0a42fa6dc9', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:13.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-71d1ffb83e285d5952da1475', '넛지헬스케어㈜', 'STARTUP', '잡코리아 기업정보에 51~300명 벤처기업으로 표시됨', 'JobKorea', '49748610', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49748610', '[캐시워크] 데이터엔지니어 채용전환형 인턴', 'DATA_ENGINEERING', 'NEW_GRAD_ONLY', '지원자격에 신입 및 졸업예정자 가능이 명시됨', 'INTERN', '서울', 0, '[]', NULL, NULL, 1, '캐시워크 데이터 엔지니어 업무를 수행하는 3개월 채용전환형 인턴 공고다.', 'ACTIVE', 'f0531701a18d0037ba4e0b3212b26635b712ff46223a31369b6b7f500c842ec2', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:21.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T11:15:21.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-065d340b78f28851e783810b', 'F&F', 'MID', '잡코리아 기업정보에 501~1,000명, 중견기업으로 표시됨', 'JobKorea', '49746362', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49746362', '디지털본부 Java/Spring 백엔드 개발 신입/경력직 개발자 (ERP/AI 시스템) 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME', '서울', 0, '["Java","Spring"]', NULL, '2026-08-31T14:59:59.000Z', 1, 'ERP와 AI 시스템 관련 Java·Spring 백엔드 개발자를 모집한다. 신입과 경력 모두 지원 가능하다.', 'ACTIVE', 'a13966a0c2a4869ee67f38849c8ef5671958fcdc113ce87e0b6bb147df2347c6', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-16c1745b5b822ef6bce9ffb4', '㈜아이웨이', 'STARTUP', '잡코리아 기업정보에 51~300명 벤처기업으로 표시됨', 'JobKorea', '49757173', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49757173', '2026년 (주)아이웨이 개발(JAVA개발자) 경력직 및 신입 모집', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 모집이 명시되며 3년 이상 조건은 경력 트랙에 병기됨', 'FULL_TIME', '경기 안양', 0, '["Java"]', NULL, '2026-09-10T14:59:59.000Z', 0, 'Java 웹프로그래머를 모집하는 신입·경력 정규직 공고다.', 'ACTIVE', '2e0c7127bc4d5e30503150604d0ea6fc6beb464c2adb9b3ae6007114ceb6437c', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-0e74f054807260240659f376', '㈜비케이에스엔피', 'STARTUP', '잡코리아 기업정보에 50명 이하 벤처기업으로 표시됨', 'JobKorea', '49749780', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49749780', '은행 S/W프로그램 개발', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '지원자격에 신입·경력이 명시됨', 'FULL_TIME', '서울', 0, '[]', NULL, '2026-09-09T14:59:59.000Z', 0, '은행용 소프트웨어 프로그램 개발자를 모집하는 신입·경력 정규직 공고다.', 'ACTIVE', '777fb76bb33c297835a9ff556357e30b8a7e2c3d8c287d3fe917070a11d3e0de', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-bb264514eccc80ad8ef22aef', '㈜캐리마', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49706105', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49706105', '제어 프로그램 개발 전문가 모십니다.', 'EMBEDDED_OR_CONTROL_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 모집이 명시되며 1년 이상 조건은 경력 트랙에 병기됨', 'FULL_TIME', '서울', 0, '[]', NULL, '2026-08-21T14:59:59.000Z', 0, '3D 프린터 제어 프로그램을 개발하는 신입·경력 정규직 공고다.', 'ACTIVE', '57f1e62eafd90057f7a6624e65398df1623953732bb2deb09708bcf77fdb3740', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-fbf38bf76b446789ee84461a', '㈜터보소프트', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49787297', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49787297', 'Product Software Engineer(Java중심, 기획·설계 포함)신입/경력사원 모집', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입·경력 모집이 명시되고 지원자격은 경력무관으로 표시됨', 'FULL_TIME', '충북 청주', 0, '["Java","EgovFramework","JPA","Hibernate","MyBatis","REST","OpenAPI","Oracle","MySQL","PostgreSQL","Elasticsearch","OpenSearch","CI/CD"]', NULL, '2026-08-31T14:59:59.000Z', 0, 'Java 중심의 제품 소프트웨어를 기획·설계·개발하는 신입·경력 정규직 공고다.', 'ACTIVE', '9123512d467e9047f75d6c54307fd21a3acae09f39fae19a32c55aac171b3ad7', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:21.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-16017b68eab900dcd332123d', '㈜디시스템즈', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49781983', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49781983', 'IT개발·데이터(백엔드/서버개발 외 1개 부문) 모집 공고', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 모집이 명시되며 3년 이상 조건은 경력 트랙에 병기됨', 'FULL_TIME', '경기 용인', 0, '[]', NULL, '2026-09-12T14:59:59.000Z', 0, '백엔드·서버 개발을 포함한 IT개발·데이터 직무의 신입·경력 정규직 공고다.', 'ACTIVE', '36895275794ad3dba29c3c938da807fd5be7efa10d61496c780612ceb25a2d92', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:26.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:26.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d2806312ec6801d6d5db7ba0', '㈜셀바스에이아이', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49576376', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49576376', '음성인식 엔진 / 모델 개발 담당 - 신입 / 경력', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 모집이 명시되며 2년 이상 조건은 경력 트랙에 병기됨', 'FULL_TIME', '서울', 0, '["C","C++","Deep Learning","Machine Learning","LLM"]', NULL, '2026-09-11T14:59:59.000Z', 0, '음성인식 엔진과 모델을 개발하는 AI·머신러닝 직무다. 신입과 경력 모두 지원할 수 있다.', 'ACTIVE', '278b8478c0063f43e3e73d59a3c0ff966782dec32e4db308db9302f7ddc37fa0', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:26.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T11:15:26.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-8870e35d692a83b57ddbb423', 'NAVER LABS', 'UNCLASSIFIED', '해당 공식 공고에서 기업 규모를 분류할 근거를 수집하지 않음', 'NAVER LABS Careers', '30005258', 'https://recruit.naverlabs.com/rcrt/view.do?annoId=30005258&lang=ko', '[네이버랩스] Robot Embedded System Firmware Engineer', 'EMBEDDED_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '모집 경력은 무관이며 필수요건에 신입 및 경력이라고 명시됨', 'FULL_TIME', '경기 성남', 0, '["C","C++","RTOS","SPI","I2C","USB","CAN","Ethernet"]', NULL, '2026-08-18T14:59:00.000Z', 0, '로봇 내 임베디드 시스템의 펌웨어와 실시간 디지털 시스템을 개발하는 정규직 공고다.', 'ACTIVE', 'ca6d9cf8085928436b0907b16be6ad23292a78b6e1e4d1ff8570240562bd7a4c', '2026-08-15T11:07:09.000Z', '2026-08-15T11:15:26.000Z', '2026-08-15T11:07:09.000Z', '2026-08-15T11:15:26.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-4b70e8b67001a95ea0544740', '쿠팡', 'LARGE', '공식 공고의 회사 소개에 글로벌 대형 상장사로 명시됨', 'Coupang Careers', '8121392', 'https://www.coupang.jobs/en/jobs/8121392/%EC%8B%A0%EC%9E%85%EC%B1%84%EC%9A%A9-back-end-engineer-eats-ads-engineering/', '[신입채용] Back-end Engineer (Eats Ads Engineering)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '대학 졸업예정자와 초기 경력 엔지니어 대상이며 정규직 경력이 필수가 아니라고 명시됨', 'FULL_TIME', '서울', 0, '["Java","AWS","Kafka","EMR"]', NULL, NULL, 1, '쿠팡이츠 광고 플랫폼의 백엔드 시스템을 개발하는 신입·초기경력 정규직 공고다.', 'ACTIVE', '20e746ae6bfe4e1c411c9b1d37c304c366ff736396d876451f18dc52912241e3', '2026-08-15T11:07:09.000Z', '2026-08-15T11:15:26.000Z', '2026-08-15T11:07:09.000Z', '2026-08-15T11:15:26.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-07dc823890a2b64032b1e07b', '토스뱅크', 'UNCLASSIFIED', '해당 공식 공고에서 기업 규모를 분류할 근거를 수집하지 않음', 'Toss Careers', '7816881003', 'https://toss.im/career/job-detail?job_id=7816881003', '토스뱅크 Server Developer 채용 연계형 인턴십 (~8/17)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '신입 또는 회사 경력 3년 미만이며 졸업예정자·기졸업자가 지원 가능하다고 명시됨', 'INTERN', '서울', 0, '["Kotlin","Java","Gradle","Netty","Spring MVC","Spring WebFlux","Spring Boot","Spring Cloud Gateway","JPA","Hibernate","MySQL","MongoDB","Redis","Kubernetes","Istio","Docker","Kafka","ELK","Prometheus","Grafana"]', NULL, '2026-08-17T14:59:00.000Z', 0, '토스뱅크의 상품·서비스·플랫폼 서버 개발을 수행하는 6개월 채용연계형 인턴십이다.', 'ACTIVE', '65aa1d5ef37118697125f1a9bfdcebd6ec5ff3836778b82700ba12ba6d7c8792', '2026-08-15T11:07:09.000Z', '2026-08-15T11:15:26.000Z', '2026-08-15T11:07:09.000Z', '2026-08-15T11:15:26.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-99dedfeaa23be244be3f1bea', '주식회사 사운드마인드', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159008', 'https://www.rocketpunch.com/jobs/159008', '웹/앱 프론트엔드 개발자 (React/Next.js)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '공고 경력 구분에 신입·주니어가 함께 표시됨', 'FULL_TIME', '미확인', 0, '["React","Next.js"]', NULL, '2026-09-01T14:59:59.000Z', 0, 'React와 Next.js 기반 웹·앱 프론트엔드 개발자를 모집하는 공고다.', 'ACTIVE', 'defa9570ac91b7c7f93c8f72c68b8a7a8b716fbe7efa320cbcdcebc991faee37', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-761583e713477c72f0f50c82', '팀카이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '158834', 'https://www.rocketpunch.com/jobs/158834', 'Agent Engineer (계약직)', 'AI_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '공고 경력 구분에 신입·주니어·미들이 함께 표시됨', 'CONTRACT', '미확인', 0, '[]', NULL, '2026-09-14T14:59:59.000Z', 0, 'AI 에이전트 관련 엔지니어를 계약직으로 모집하는 공고다.', 'ACTIVE', 'e01ed2113bc1da2847df28d043669534848c562764bef06e8c53a96d95ca62d0', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-044ae79f96e4ea4efa3366d4', '블리츠다이나믹스', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159145', 'https://www.rocketpunch.com/jobs/159145', '데이터 엔지니어 인턴 모집', 'DATA_ENGINEERING', 'NEW_GRAD_ONLY', '데이터 엔지니어 인턴 모집으로 표시됨', 'INTERN', '미확인', 0, '[]', NULL, '2026-08-22T14:59:59.000Z', 0, '데이터 엔지니어 업무를 수행할 인턴을 모집한다.', 'ACTIVE', '990e72272ec1eb3b568a7d42f752a80f742912bf9bf424e8c283b8f082a895c0', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-c480d9a8cb42049382275915', '팀카이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '159144', 'https://www.rocketpunch.com/jobs/159144', 'FDE(Forward-Deployed 엔지니어) 인턴', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '인턴이며 경력 구분에 신입·주니어가 포함됨', 'INTERN', '미확인', 0, '[]', NULL, '2026-11-06T14:59:59.000Z', 0, '고객 현장 문제 해결과 제품 적용을 담당하는 FDE 인턴 공고다.', 'ACTIVE', '6b878ec57131bdf4f5b785e609aaa7c48c530b7f5bef01debf1fd5eefff738b1', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-81439a5923b20570d21b4df3', '이스트게임즈', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156303', 'https://www.rocketpunch.com/jobs/156303', 'DevOps 엔지니어', 'DEVOPS', 'NEW_GRAD_ELIGIBLE', '공고 경력 구분에 신입·미들·시니어가 함께 표시됨', 'FULL_TIME', '미확인', 0, '[]', NULL, NULL, 1, '게임 서비스 인프라와 배포 운영을 담당하는 DevOps 엔지니어 공고다.', 'ACTIVE', '9b4747d66b7afde8bf535de0511c1a24333e65818aa95d944f4951c403115121', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-111d0e230cf5cda2c1a4de6b', '허드슨에이아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156625', 'https://www.rocketpunch.com/jobs/156625', 'Fullstack Engineer', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '공고 경력 구분에 신입·미들·시니어가 함께 표시됨', 'FULL_TIME', '미확인', 0, '[]', NULL, NULL, 1, 'AI 서비스의 프론트엔드와 백엔드를 함께 개발하는 풀스택 엔지니어 공고다.', 'ACTIVE', '5cadf09e472c6ec4c820461e121de13beef18fc2384738d38e07763b7e706bf0', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ca52b46a86b57d2e55c2debb', 'GC메디아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '158917', 'https://www.rocketpunch.com/jobs/158917', 'AI-Native Engineer(인턴)', 'AI_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '인턴·주니어로 표시되지만 신입이라는 명시 표현은 확인하지 못함', 'INTERN', '미확인', 0, '[]', NULL, NULL, 1, 'AI 네이티브 제품 개발을 지원하는 인턴 공고다.', 'ACTIVE', 'f05ba1f440cdb00c109ba850492a86db65d5800d6b0071f80b61114b3afe894b', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-0c69ea9cd28010c56daf6849', '베스텔라랩', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '157754', 'https://www.rocketpunch.com/jobs/157754', '백엔드·인프라 풀스택 엔지니어', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '공고 경력 구분에 신입·주니어·미들·시니어가 포함됨', 'FULL_TIME', '미확인', 0, '[]', NULL, NULL, 1, '백엔드 개발과 인프라 운영을 함께 담당하는 풀스택 엔지니어 공고다.', 'ACTIVE', '7d6e0bcb4818de13863cfc701eaf95b482f1210240aaec93eef617969c7a2c2b', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-292d372adafc184df16346ee', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156011', 'https://www.rocketpunch.com/jobs/156011', '[캐시워크] 백엔드 개발 채용전환형 인턴', 'BACKEND', 'NEW_GRAD_ONLY', '신입 대상 채용전환형 인턴으로 표시됨', 'INTERN', '미확인', 0, '[]', NULL, NULL, 1, '캐시워크 백엔드 개발을 담당하는 채용전환형 인턴 공고다.', 'ACTIVE', 'd2b3d6d09237a9327c6568ebe9211cf59a572809315f3a6a515b6a156c4f0bfa', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-df5e34979bfbf507def5d086', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156014', 'https://www.rocketpunch.com/jobs/156014', '[캐시워크] 프론트엔드 개발 채용전환형 인턴', 'FRONTEND', 'NEW_GRAD_ONLY', '신입 대상 채용전환형 인턴으로 표시됨', 'INTERN', '미확인', 0, '[]', NULL, NULL, 1, '캐시워크 프론트엔드 개발을 담당하는 채용전환형 인턴 공고다.', 'ACTIVE', 'ee9e348e288749fa2c9076d4aec6a0e889cbe8a14e0d1c1d9bc984a9ce91e3eb', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-f892f6cd2470eb623ab8592e', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156008', 'https://www.rocketpunch.com/jobs/156008', '[캐시워크] 데이터분석 담당 채용전환형 인턴', 'DATA_ANALYTICS', 'NEW_GRAD_ONLY', '신입 대상 채용전환형 인턴으로 표시됨', 'INTERN', '미확인', 0, '[]', NULL, NULL, 1, '캐시워크 데이터 분석 업무를 담당하는 채용전환형 인턴 공고다.', 'ACTIVE', '4e495361a5b71ff252090a2292e4aafeac9008b287faae974b538dc188507445', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-7e34fd3cafd209aacaa76086', '넛지헬스케어', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156007', 'https://www.rocketpunch.com/jobs/156007', '[캐시워크] iOS 개발 채용전환형 인턴', 'IOS', 'NEW_GRAD_ONLY', '신입 대상 채용전환형 인턴으로 표시됨', 'INTERN', '미확인', 0, '["iOS"]', NULL, NULL, 1, '캐시워크 iOS 앱 개발을 담당하는 채용전환형 인턴 공고다.', 'ACTIVE', 'd77fcc9e2babdaac2e658d004c79d61f4bdf013955ccce578717f1097e4749ed', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-a302ddedc942a2e920897231', '미지웍스', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '158841', 'https://www.rocketpunch.com/jobs/158841', '프론트엔드 엔지니어 채용', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '프론트엔드 경력 3년 이상 또는 신입 지원 가능으로 안내됨', 'FULL_TIME', '미확인', 0, '[]', NULL, '2027-01-01T14:59:59.000Z', 0, '서비스 프론트엔드 개발자를 모집하며 신입 지원 가능 문구가 있는 공고다.', 'ACTIVE', '253af08663cedd00aeb0208cba14c1a73249b3e7b80cb4eed76d71960347d234', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-3b32caea439a86f1a0adf722', '몰로코', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'RocketPunch', '156469', 'https://www.rocketpunch.com/jobs/156469', '기계 학습 엔지니어', 'ML_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '경력 구분에는 신입이 포함되나 자격요건의 관련 개발 경험 요구가 필수인지 불명확함', 'FULL_TIME', '미확인', 0, '[]', NULL, NULL, 1, '머신러닝 모델과 시스템을 개발하는 엔지니어 공고다.', 'ACTIVE', 'feb71da5aa9640423b4c484b2ad151c4c926472526cdbc89831cc6104022b8b6', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:49.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-96f21c8e98eb69dc0df4d2cc', '드림어스컴퍼니', 'UNCLASSIFIED', '해당 공식 공고에서 기업 규모를 분류할 근거를 수집하지 않음', 'Dreamus Company Careers', '227074', 'https://recruit.dreamuscompany.com/pages/careers_view.jsp?id=227074&jobName=All&title=', '콘텐츠 플랫폼 백엔드 개발(신입)', 'BACKEND', 'NEW_GRAD_ONLY', '공고 제목에 신입이 명시되고 학교·인턴·프로젝트 경험을 지원 근거로 안내함', 'FULL_TIME', '미확인', 0, '["Java","Kotlin","Golang","MySQL","MongoDB","Elasticache","Elasticsearch","RabbitMQ","SQS","Kafka","AWS","Docker","EKS","MWAA","MediaConvert","FFmpeg"]', NULL, NULL, 1, '대용량 미디어 입수·트랜스코딩·스트리밍 연동과 백오피스를 개발하는 신입 백엔드 공고다.', 'ACTIVE', '50923f9e6f146485cf5d7e1d2502e484be6b5495247d2df744f8a12d7c55ec02', '2026-08-15T11:01:36.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:36.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-41e22ef84faa0010eb2ba33d', '라이트에이아이', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'Wanted', '375795', 'https://www.wanted.co.kr/wd/375795', '마케팅 AI 에이전트 Backend 개발자 (신입)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '신입·주니어 대상이며 관련 전공 졸업예정자를 포함하고, 관련 전공자는 실무 경력을 요구하지 않는다고 명시됨', 'UNCONFIRMED', '서울 강남구', 0, '["Python","Terraform","FastAPI","Dify","AWS","EKS","RDS","ECR","S3","Docker","GitAction"]', NULL, '2026-08-31T14:59:59.000Z', 0, '마케팅 성과 분석 서버와 AI 연동 데이터 파이프라인, 클라우드 인프라를 개발하는 신입 백엔드 공고다.', 'ACTIVE', '1807de202b66726b1c9d220df3f6d1bf8748cecde000c9fb7fe5c21d0672167d', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-897d1e13630a9c8679cbdf0b', '트리플오스', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'Wanted', '356275', 'https://www.wanted.co.kr/wd/356275', '백엔드 개발자(신입)', 'BACKEND', 'NEW_GRAD_ONLY', '공고 제목과 경력 구분에 신입이 명시됨', 'UNCONFIRMED', '경기 성남시', 0, '["Kotlin","Spring Boot","Java","MySQL","Redis","MongoDB","Git","Jira"]', NULL, NULL, 0, 'Kotlin·Spring Boot 기반 API와 마이크로서비스를 구현·운영하는 신입 백엔드 공고다.', 'ACTIVE', '8815ac02967d6d5fba54503fd89f43d17101fde15ed5ac18639ad0ad20515751', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-6bdc3ceca5a3cbda73fa90fe', '㈜유알피', 'UNCLASSIFIED', '상세에서 기업 규모 근거를 최종 확정하지 못함', 'JobKorea', '49763378', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49763378', 'AI 응용/백엔드 개발 포지션 신입&경력 채용', 'BACKEND_AND_AI', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 구분에 신입·경력이 표시됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, '2026-08-31T14:59:59.000Z', 0, 'AI 응용과 백엔드 개발 포지션을 함께 모집하는 신입·경력 공고다.', 'ACTIVE', '8417a564ac089c4696996c2e092c8f76b47af0e0d078cc2e673eb97951f00b60', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-9a71afc94c05b585737ebc3f', '㈜아이낸스', 'UNCLASSIFIED', '상세에서 기업 규모 근거를 최종 확정하지 못함', 'JobKorea', '49760249', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49760249', '증권금융IT 전문기업 신입·경력 개발자 모집', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '공고에 신입·경력 및 졸업예정자 지원 가능이 표시됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, '2026-09-30T14:59:59.000Z', 0, '증권·금융 IT 분야의 서버와 클라이언트 개발자를 모집하는 신입·경력 공고다.', 'ACTIVE', '9133d09b234cb0d3f3eb0df922bcb9a724c32c10c3eba6c6219651937be58ee0', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b734e850b821346909add556', '㈜포오스', 'UNCLASSIFIED', '통합 공고에서 분류 근거를 확정하지 않음', 'JobKorea', '49758419', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49758419', '2026년 하반기 각 부문 신입/경력 직원 채용', 'MULTI_IT_ROLE', 'NEW_GRAD_ELIGIBLE', '통합 공고에 신입·경력 모집이 표시됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, '2026-08-31T14:59:59.000Z', 0, 'AI 융합, 서버 시스템, 웹개발 등 여러 IT 직무가 한 공고에 묶여 있다.', 'ACTIVE', 'a725aef8afaccce69f42e03c6541034295e835d0eff7624d1e20e82ab6019ddb', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-8ff5a4b873d658673e262dad', '㈜심플비트', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', 'JobKorea', '49631880', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49631880', '[신입/경력] SW개발, 시스템유지관리 (신입,경력)', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입·경력이 명시됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, '2026-08-14T14:59:59.000Z', 0, '소프트웨어 개발과 시스템 유지관리를 수행하는 신입·경력 공고였다.', 'ACTIVE', 'ed0cce7bcb7677b755834eca4271c8882a59371fa49a55a3b420f1fef752fbf5', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-6a8dcbf87d992a62fc4f113e', '㈜에이코퍼레이션', 'SMALL', '잡코리아 기업정보에 중소기업으로 표시됨', 'JobKorea', '49588410', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49588410', '사내 프로그램 개발 및 웹 프로그램 유지보수 개발자 모집', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시됨', 'FULL_TIME', '경기 의정부', 0, '[]', NULL, '2026-08-14T14:59:59.000Z', 0, '사내 프로그램 개발과 웹 프로그램 유지보수를 담당하는 경력무관 공고였다.', 'ACTIVE', '7f78ef99a5e14aa5f650c7dbc5a0f68007d7b07ece6385cb696ce40c6cfa7c69', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-00fece0d66b3abc7449567f2', '㈜캐스트이즈', 'SMALL', '잡코리아 기업정보에 51~300명, 중소기업으로 표시됨', 'JobKorea', '49379347', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49379347', '캐스트이즈 2026 DevOps개발자(신입)', 'DEVOPS', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에 신입이 명시됨', 'CONTRACT_OR_FREELANCE', '서울', 0, '[]', NULL, '2026-08-14T14:59:59.000Z', 0, 'DevOps 개발·운영을 담당하는 신입 계약직 또는 프리랜서 공고였다.', 'ACTIVE', '265b8a2bce19f498eabdd1638d735aeb0f1ba93afa8a475dabe1cb78fcd9412c', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-5e90dc0e1be54c997778cc81', '㈜엔디소프트', 'SMALL', '잡코리아 기업정보에 50명 이하, 중소기업으로 표시됨', 'JobKorea', '49660820', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49660820', '2026년도 엔디소프트 개발부문 채용공고', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '지원자격이 경력무관으로 표시됨', 'FULL_TIME', '서울', 0, '[]', NULL, '2026-08-26T14:59:59.000Z', 0, '개발부문 경력무관 정규직 공고로 접수기간은 8월 26일까지 표시돼 있다.', 'ACTIVE', 'cf7528d66690f1e2c2b4a4d1c65271ce5a643fce4cebaa7c059cfa6ef22d5a65', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:10:32.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-8eb2dc6448a5a717296a1b58', '안랩', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', '자소설닷컴', '104762', 'https://jasoseol.com/recruit/104762', '2026 6월 신입 채용', 'MULTI_IT_ROLE', 'NEW_GRAD_ONLY', '통합 공고에 신입 모집과 소프트웨어·ML/MLOps 직무가 표시됨', 'FULL_TIME', '미확인', 0, '["Linux","ML","MLOps"]', NULL, '2026-12-31T14:59:59.000Z', 0, '소프트웨어와 ML·MLOps 등 여러 신입 직무가 포함된 통합채용 공고다.', 'ACTIVE', 'd2ba2ba5f7d6edd5cdb1f8131bc664ab4efd0837727a43537327d63ad0aef045', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-2a314b6c847af1676c967ba9', '에코마케팅', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', '자소설닷컴', '105543', 'https://jasoseol.com/recruit/105543', '프론트엔드 개발자 신입 채용', 'FRONTEND', 'NEW_GRAD_ONLY', '공고에 신입 모집이 명시됨', 'FULL_TIME', '미확인', 0, '[]', NULL, '2026-08-16T14:59:59.000Z', 0, '프론트엔드 개발자를 모집하는 신입 공고다.', 'ACTIVE', '1525ea5d088894818380abcd1551e2e539d7be380c5621a89a9dd560a924777c', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-60ed20cac8db1be65f124601', '세방그룹', 'UNCLASSIFIED', '공개 상세에서 기업 규모를 확정할 근거를 수집하지 못함', '자소설닷컴', '105547', 'https://jasoseol.com/recruit/105547', '2026 하반기 통합채용', 'MULTI_IT_ROLE', 'NEW_GRAD_ELIGIBLE', '통합 공고에 신입 지원 가능한 IT 직무가 포함됨', 'UNCONFIRMED', '미확인', 0, '[]', NULL, NULL, 0, '여러 계열사와 직무를 함께 모집하는 통합채용 공고다.', 'ACTIVE', '1d2240c3704593330cb29bf22d5182e10ed07feb276abe935f66428d8bae30fe', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:01:21.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-582f895b186437d623ba9161', '111퍼센트', 'STARTUP', '슈퍼루키 기업정보에 스타트업으로 표시됨', 'Superookie', '6a7d25abaf923602db79ab82', 'https://www.superookie.com/jobs/6a7d25abaf923602db79ab82', '슈퍼드리머 8기 게임 클라이언트 개발자', 'GAME_CLIENT', 'NEW_GRAD_ONLY', '3개월 인턴이며 학력무관으로 표시되고 별도 필수 경력 조건이 없음', 'INTERN', '서울', 0, '[]', NULL, '2026-08-23T14:59:00.000Z', 0, '게임 클라이언트 개발자를 모집하는 3개월 정규직 전환형 인턴 공고다.', 'ACTIVE', '1420616ab70c0f89a4f22f6427f49a7804da185685f4a7b431079349afff23cd', '2026-08-15T11:02:04.000Z', '2026-08-15T13:47:05.000Z', '2026-08-15T11:02:04.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
DELETE FROM job_tech_stacks;
--> statement-breakpoint
INSERT OR IGNORE INTO job_tech_stacks (job_id, name, created_at)
SELECT jobs.id, trim(CAST(json_each.value AS text)), jobs.updated_at
FROM jobs, json_each(jobs.tech_stack)
WHERE json_valid(jobs.tech_stack)
  AND length(trim(CAST(json_each.value AS text))) BETWEEN 1 AND 50;
--> statement-breakpoint
DELETE FROM workspace_search WHERE kind = 'jobs';
--> statement-breakpoint
INSERT INTO workspace_search (kind, entity_id, owner_id, title, body)
SELECT 'jobs', id, '', company_name || ' ' || title,
       category || ' ' || region || ' ' || summary || ' ' || tech_stack
FROM jobs
WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260814-v2', 'jobs', '0990be9f606d663deb9980f7aef1710359e94afbcb9e392cad1adc9b70916fd3', 'COMMITTED',
   70, 19,
   '{"active":51,"deadlineUnknown":0,"needsReview":0,"excluded":19,"stored":51,"visible":51,"excludedOverlapUrls":0,"auditAsOfDate":"2026-08-14","auditCompletionStatus":"PARTIAL_RETROSPECTIVE_WITH_USER_MANUAL_CONFIRMATION","manualOverrideCount":28,"policy":"replace-all; active/deadline-unknown visible; needs-review hidden; excluded omitted"}', '2026-08-15T13:47:05.000Z', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0020_replace_job_catalog_20260814_verified', 'sha256:0990be9f606d663deb9980f7aef1710359e94afbcb9e392cad1adc9b70916fd3', '2026-08-15T13:47:05.000Z');
--> statement-breakpoint
PRAGMA optimize;
