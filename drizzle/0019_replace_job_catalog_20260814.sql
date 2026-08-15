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
VALUES ('job-8870e35d692a83b57ddbb423', 'NAVER LABS', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'NAVER LABS 공식 채용', '30005258', 'https://recruit.naverlabs.com/rcrt/view.do?annoId=30005258&lang=ko', '[네이버랩스] Robot Embedded System Firmware Engineer', 'EMBEDDED_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '모집 경력이 무관으로 표시되고 필수 역량 영역에 ''경력 구분: 무관(신입 및 경력)''이 명시됨.', 'FULL_TIME', '경기 성남시', 0, '["C","C++","RTOS","SPI","I2C","USB","CAN","Ethernet"]', '2026-08-03T00:00:00+09:00', '2026-08-18T23:59:00+09:00', 0, '로봇 시스템의 마이크로컨트롤러 펌웨어와 RTOS·모듈 인터페이스를 개발하는 정규직 포지션이다. 공식 페이지에서 신입 지원 가능, 지원하기 버튼, 8월 18일 23:59 마감이 함께 확인됐다.', 'ACTIVE', 'ef6bc3e861aed407b14c954c3e15ba5f492544006404960ab5c6b245a5451717', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-7f49c093722305f72d92fcc1', '라피치', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '라피치 공식 채용', 'gIcSik18', 'https://rapeech.careers/job_posting/gIcSik18', 'AI Engineer', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '지원자격에 ''신입 또는 경력 2년 이하''가 명시되고 신입은 3개월 채용연계형 인턴으로 안내됨.', 'INTERN', '서울 강남구', 0, '["Python","C++","Rust","Go","LLM","RAG","vLLM","REST API","LangChain","LlamaIndex","Hugging Face","Docker","Linux"]', NULL, NULL, 1, 'LLM 의도 분류·응답 생성, RAG 파이프라인, 추론 서버 운영을 담당한다. 공식 상세에서 신입 허용, 상시 모집, 지원하기가 모두 확인됐다.', 'ACTIVE', 'ff4ea8fafa02953c2c04fc380d0504ca9b4e071d8693bae9f5d84f1812a6e54f', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b635c9cdf88f33d576436e34', '라피치', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '라피치 공식 채용', 'j49zOYVx', 'https://rapeech.careers/job_posting/j49zOYVx', 'AICC 시스템 운영자', 'SYSTEM_OPERATIONS', 'NEW_GRAD_ONLY', '공고 상단과 경력 사항에 ''신입''이 명시되고 3개월 채용형 인턴으로 안내됨.', 'INTERN', '서울 강남구', 0, '["Linux","TCP/IP","UDP","HTTP","SIP","AWS","GitHub Actions","CodeDeploy","Bash","Python","SQL"]', NULL, NULL, 1, 'AICC 서비스·콜 인프라 모니터링, 장애 1차 대응, 운영 자동화 지원을 수행하는 채용형 인턴이다. 채용 시 마감과 활성 지원하기가 확인됐다.', 'ACTIVE', '569692c59bfa62bcfbe533439fb6d43a97b29bcfbc4c459cffd85d7034e10c43', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-25fcf1d9d8c6e9d236cb2b4f', '라피치', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '라피치 공식 채용', 'MrgwL3TS', 'https://rapeech.careers/job_posting/MrgwL3TS', '운영개발자(신입)', 'SYSTEM_OPERATIONS', 'NEW_GRAD_ONLY', '공고 제목·상단 경력 구분에 신입이 명시됨.', 'CONTRACT', '서울 관악구', 0, '["Linux","C","C++","CTI","TCP/IP","UDP"]', NULL, NULL, 1, '컨택센터 운영개발, 시스템 모니터링, 장애 대응과 패치 검토를 담당하는 신입 계약직이다. 공식 페이지에서 채용 시 마감과 지원하기가 확인됐다.', 'ACTIVE', '0c365afbe53025198db2c45c46b725cbb10442efcb0de5c2fb03a210b1bbf683', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:39+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-dfa580288d98d4f2a08c7965', '네비웍스', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '네비웍스 공식 채용', '3UnHc5jS', 'https://naviworks.ninehire.site/job_posting/3UnHc5jS', '웹 어플리케이션 개발자', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '경력 무관으로 표시되고 졸업자·졸업예정자 지원 조건이 안내됨.', 'FULL_TIME', '경기 안양시', 0, '["Java","TypeScript","JavaScript","React","MSA","Cloud"]', NULL, NULL, 1, '국방·공공 ICT 웹 애플리케이션을 개발하는 경력무관 정규직 포지션이다. 공식 상세에서 채용 시 마감과 지원하기가 확인됐다.', 'ACTIVE', '5ad32a765331e21ca6d786f82d6526e740626131bff88adb7fc678001f080bdf', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e5beb7b23ccab886f6bec3a6', '네비웍스', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '네비웍스 공식 채용', '2mOUhVI3', 'https://naviworks.ninehire.site/job_posting/2mOUhVI3', 'Unreal 클라이언트 개발자(신입/경력)', 'GAME_CLIENT', 'NEW_GRAD_ELIGIBLE', '제목에 신입/경력이 명시되고 경력 무관으로 표시됨.', 'FULL_TIME', '경기 안양시', 0, '["Unreal Engine 5","C++","UMG","Blueprint","XR"]', NULL, NULL, 1, 'Unreal Engine 기반 훈련·시뮬레이션 클라이언트를 개발하는 신입·경력 정규직 포지션이다. 공식 페이지에서 채용 시 마감과 지원하기가 확인됐다.', 'ACTIVE', 'f80b67ac2edef77cdec181976876ca79ee96f4aa1b916da9621614ff37a8fee9', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-4b60c22533974593f84428f0', '네비웍스', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '네비웍스 공식 채용', 'xVdsKPCr', 'https://naviworks.ninehire.site/job_posting/xVdsKPCr', '윈도우 응용 프로그래머(C++, C#) 신입~초중급 모집', 'DESKTOP_APPLICATION', 'NEW_GRAD_ELIGIBLE', '공고 제목과 경력 범위에 신입부터 6년 이하가 명시됨.', 'FULL_TIME', '경기 안양시', 0, '["C","C++","C#","MFC","WPF","TCP/IP","UDP","RS-422"]', NULL, NULL, 1, 'C++·C# 기반 윈도우 응용 프로그램과 통신 기능을 개발하는 신입~초중급 정규직이다. 공식 상세에서 채용 시 마감과 지원하기가 확인됐다.', 'ACTIVE', '05862ee5a08e4e27ed014caae257bb8ffe2bd0be6ac2b27bf66e5958ecd146f4', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-abfe8ce730b1eeb323230837', '현대종합금속', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '현대종합금속 채용사이트', '37923', 'https://hyundaiweld.saramin.co.kr/apply_site/recruit/view/37923', '본사 전산실 신입/경력사원 모집', 'ENTERPRISE_IT', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/경력사원 모집이 명시됨.', 'UNCLASSIFIED', '미확인', 0, '[]', '2026-08-12T00:00:00+09:00', '2026-08-23T23:59:00+09:00', 0, '현대종합금속 본사 전산실의 신입·경력 통합 모집 공고다. 채용사이트의 현재 목록과 상세에서 지원 기능 및 8월 23일 23:59 마감이 확인됐다.', 'ACTIVE', '08b80716affe197dbdcf5df600eb2b886afcbc9890430e4801748f86522ef61f', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b79ecc1f82e982b65b3929e3', '현대PNS', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '현대종합금속 채용사이트', '37924', 'https://hyundaiweld.saramin.co.kr/apply_site/recruit/view/37924', '어플리케이션팀 신입/경력사원 모집', 'ENTERPRISE_APPLICATION', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/경력사원 모집이 명시됨.', 'UNCLASSIFIED', '미확인', 0, '[]', '2026-08-13T00:00:00+09:00', '2026-08-23T23:59:00+09:00', 0, '현대PNS 어플리케이션팀의 신입·경력 통합 모집 공고다. 채용사이트에서 지원 기능과 8월 23일 23:59 마감이 확인됐다.', 'ACTIVE', '06b055f3b4c0be08f8feb2aa502534aa8b46fba50d786cdd87ea9a24a744095e', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-dd8640f3865bef71b80ef356', '비모소프트', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '비모소프트 공식 채용', 'ZqBkZnko', 'https://vimosoft.ninehire.site/job_posting/ZqBkZnko', 'Android 개발자 (전환형인턴)', 'ANDROID', 'NEW_GRAD_ELIGIBLE', '경력 무관으로 표시되고 3개월 근무 후 정규직 전환 심사를 진행하는 전환형 인턴으로 안내됨.', 'INTERN', '경기 안양시', 0, '["Kotlin","Android Studio","Git","Jenkins","OOP","SOLID","Notion","Slack","Redmine"]', NULL, NULL, 1, 'Kotlin 기반 모바일 편집 앱을 개발하는 정규직 전환형 인턴이다. 공식 상세에서 경력 무관, 상시 모집, 지원하기가 확인됐다.', 'ACTIVE', '7acc7d34decdaf7ade7e08731e2a731c5f771f09c4ab3f503c5b88a9f06fcbe1', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-78b9ff6ca966a368bc602677', '히츠', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '히츠 공식 채용', 'd8SzINzs', 'https://career.hits.ai/job_posting/d8SzINzs', 'AI Agent Engineer (전문연구요원 가능)', 'AI_AGENT_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '경력 무관으로 표시되고 석사·박사 또는 졸업예정자 지원 조건이 안내됨.', 'FULL_TIME', '서울', 1, '["LLM","LangChain","LangGraph","LlamaIndex","RAG","MCP","MLOps","LLMOps","AWS Bedrock","SageMaker","Lambda","Bioinformatics","Cheminformatics"]', NULL, NULL, 1, '신약개발 도메인의 LLM·RAG·에이전트 시스템을 개발하는 정규직 포지션이다. 공식 상세에서 경력 무관, 채용 시 마감, 지원하기와 주 1회 재택 가능 조건이 확인됐다.', 'ACTIVE', '171b9b3f65dec016c1abc828340272e006759d390386b703179731fc20676fdb', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-dfe097087312dea4048ff518', '히츠', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '히츠 공식 채용', 'SHx8yKY3', 'https://career.hits.ai/job_posting/SHx8yKY3', 'AI Scientist (전문연구요원 가능)', 'AI_RESEARCH', 'NEW_GRAD_ELIGIBLE', '경력 무관으로 표시되며 박사학위·경력 요건은 우대사항으로 제시돼 신입 지원을 배제하지 않음.', 'FULL_TIME', '서울', 1, '["Generative AI","GFlowNet","RxnFlow","Retrosynthesis","Bayesian Optimization","Active Learning","Foundation Models","Multi-omics","Co-folding","AWS"]', NULL, NULL, 1, '생성형 AI와 분자 설계·신약개발 모델을 연구하는 정규직 포지션이다. 공식 상세에서 경력 무관, 채용 시 마감, 지원하기와 주 1회 재택 가능 조건이 확인됐다.', 'ACTIVE', '9203544696101b12d493ac0536c3d9b1ef1a13855652ec7e4a53320100a100cc', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-c7e520de1659dc23fff27c57', '맨파워그룹코리아 채용 고객사', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '맨파워그룹코리아 공식 채용', 'XPuGVJjR', 'https://manpowergroupkorea.ninehire.site/job_posting/XPuGVJjR', '[야탑/급여上] 디스플레이·반도체 업계 Software Application Engineer (16M)', 'SOLUTION_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '경력 사항이 무관으로 표시되고 상세 조건에 신입~경력 2년이 명시됨.', 'CONTRACT', '경기 성남시 분당구', 0, '[".NET Core","Database","AI/ML","REST API"]', NULL, NULL, 1, '디스플레이·반도체 장비용 소프트웨어 애플리케이션 지원과 개발을 수행하는 16개월 계약 포지션이다. 공식 상세에서 신입 가능, 채용 시 마감, 지원하기가 확인됐다.', 'ACTIVE', '454b715b0ef819f2b9a8b9fdc7d604a4762675dfff534949877030dd1323bd92', '2026-08-14T14:34:50+09:00', '2026-08-14T14:41:29+09:00', '2026-08-14T14:34:50+09:00', '2026-08-14T14:41:29+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-70ba7f440d313a2c451752e9', 'Palantir', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'Palantir 공식 채용', '341d5cae-a473-4813-9a6c-0f67fcc1b253', 'https://jobs.lever.co/palantir/341d5cae-a473-4813-9a6c-0f67fcc1b253', 'Forward Deployed Software Engineer, New Grad', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '2026년 또는 2027년 졸업자를 대상으로 하는 New Grad 포지션으로 명시됨.', 'FULL_TIME', '서울', 1, '["Software Engineering","Data","APIs"]', NULL, NULL, 0, '공식 Lever 페이지의 Apply 제어와 신입 대상은 확인했지만 정확한 마감일 또는 명시적 상시채용 근거를 확인하지 못했다.', 'DEADLINE_UNKNOWN', '84e69da2dec5af878f9239779c93d748f1ac86d47856df295c327ee2d9bc5960', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-efa3a5a6ed297a535fd6b1b5', 'Palantir', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'Palantir 공식 채용', '2ad0ab10-34c3-410d-883b-8052864a95cd', 'https://jobs.lever.co/palantir/2ad0ab10-34c3-410d-883b-8052864a95cd', 'Forward Deployed Software Engineer, Internship', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '2027년 또는 2028년 졸업 예정자를 대상으로 하는 인턴 포지션으로 명시됨.', 'INTERN', '서울', 1, '["Software Engineering","Data","APIs"]', NULL, NULL, 0, '공식 Lever 페이지의 Apply 제어와 인턴 대상은 확인했지만 정확한 마감일 또는 명시적 상시채용 근거를 확인하지 못했다.', 'DEADLINE_UNKNOWN', '7cf22bd430f1ced3976e2044852f01fdd1aaeeb3e9c7f6fdeb28338943bc71ef', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-4c4340edca7bcb3de5060215', 'Palantir', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'Palantir 공식 채용', 'd5f11334-3a73-4094-b7e0-d05b54e475b8', 'https://jobs.lever.co/palantir/d5f11334-3a73-4094-b7e0-d05b54e475b8', 'Deployment Strategist, New Grad', 'TECHNICAL_CONSULTING', 'NEW_GRAD_ONLY', '2026년 또는 2027년 졸업자를 대상으로 하는 New Grad 포지션으로 명시됨.', 'FULL_TIME', '서울', 1, '["Python","R","MATLAB","SQL"]', NULL, NULL, 0, '공식 Lever 페이지의 Apply 제어와 신입 대상은 확인했지만 정확한 마감일 또는 명시적 상시채용 근거를 확인하지 못했다.', 'DEADLINE_UNKNOWN', '27d6f5135d6a8be1b2a1d2bba51977e32cce3f05b8a2dd7545c0992bdc91b974', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-4b70e8b67001a95ea0544740', '쿠팡', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'Coupang 공식 채용', '8121392', 'https://www.coupang.jobs/en/jobs/8121392/%EC%8B%A0%EC%9E%85%EC%B1%84%EC%9A%A9-back-end-engineer-eats-ads-engineering/', '[신입채용] Back-end Engineer (Eats Ads Engineering)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '공식 상세에서 신입·초기 경력 대상이며 정규 실무 경력을 필수로 요구하지 않는다고 안내됨.', 'FULL_TIME', '서울', 0, '["Java","AWS","Kafka","EMR"]', NULL, NULL, 0, '공식 직무 내용과 신입 가능 근거는 확인했지만 렌더링된 실제 지원 버튼 상태를 재현하지 못해 관리자 검토 대상으로 분리했다.', 'NEEDS_REVIEW', '20e746ae6bfe4e1c411c9b1d37c304c366ff736396d876451f18dc52912241e3', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-99234921c03d017cbb045829', 'GINTLAB', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'GreetingHR', '153683', 'https://gintlab.career.greetinghr.com/ko/o/153683', 'Embedded SW Engineer', 'EMBEDDED_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '검색 결과에서 신입·경력 통합 모집으로 표시됐으나 상세 페이지 접근이 차단돼 원문 근거를 재확인하지 못함.', 'UNCLASSIFIED', '미확인', 0, '[]', NULL, NULL, 0, 'GreetingHR 상세 URL이 403으로 차단돼 실제 지원 버튼·마감 상태와 신입 조건을 검증하지 못했다.', 'NEEDS_REVIEW', '82a533fcb67b6f4cc428eebcd6d0fb9128c4aee054dd5eea09e0c99fa1c38b14', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-f368071cece68967660c6c8d', '새솔테크', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'GreetingHR', '200016', 'https://saesoltech.career.greetinghr.com/ko/o/200016', 'AI Solution Developer', 'AI_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '검색 결과에서 신입·경력 통합 모집으로 표시됐으나 상세 페이지 접근이 차단돼 원문 근거를 재확인하지 못함.', 'UNCLASSIFIED', '미확인', 0, '[]', NULL, '2026-12-31T23:59:59+09:00', 0, '검색 결과에는 미래 마감일이 표시됐지만 GreetingHR 상세 페이지가 403으로 차단돼 실제 지원 상태를 확인하지 못했다.', 'NEEDS_REVIEW', '78a5eb3bd4096c84c8500b98a1eb5238678774a0acb41b0e552843785f3a8ce5', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-6dc63dbeed893a176e6de857', '111퍼센트', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'GreetingHR', '232844', 'https://111percent.career.greetinghr.com/ko/o/232844', '게임 클라이언트 개발자', 'GAME_CLIENT', 'NEW_GRAD_ELIGIBLE', '검색 결과에서 신입 지원 가능한 게임 개발 공고로 노출됐으나 상세 원문을 검증하지 못함.', 'UNCLASSIFIED', '미확인', 0, '[]', NULL, '2026-08-23T23:59:59+09:00', 0, '검색 결과에는 미래 마감일이 표시됐지만 GreetingHR 상세 페이지가 403으로 차단돼 지원 버튼과 세부 자격을 확인하지 못했다.', 'NEEDS_REVIEW', '66f694ae566a05ac2a574a794b70faa17d0899021ca4aa731a1931f9ef397c56', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-de3baea5820a9ab8a19242ee', '모두닥', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', 'GreetingHR', '159507', 'https://modoodoc.career.greetinghr.com/ko/o/159507', 'Problem Solver - Engineering Focused', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '후보 검색에서는 신입 지원 가능 공고로 노출됐으나 상세 페이지 접근이 차단돼 근거를 재확인하지 못함.', 'UNCLASSIFIED', '미확인', 0, '[]', NULL, NULL, 0, 'GreetingHR 상세 페이지가 403으로 차단돼 실제 지원 가능 상태와 마감 조건을 검증하지 못했다.', 'NEEDS_REVIEW', 'de5116f2fb619ca7b59dceff07e01e0e6570fa149f3c2e368f87c0da6b0d91df', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00', '2026-08-14T14:33:46+09:00', '2026-08-14T14:36:18+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-df5e34979bfbf507def5d086', '넛지헬스케어(캐시워크)', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '156014', 'https://www.rocketpunch.com/jobs/156014', '[캐시워크] 프론트엔드 개발 채용전환형 인턴', 'FRONTEND', 'NEW_GRAD_ONLY', '로켓펀치 상세에 숙련도 신입과 채용전환형 인턴이 명시됨.', 'INTERN', '미확인', 0, '["Next.js","AWS"]', NULL, NULL, 0, '로켓펀치에는 상시채용과 외부 지원 페이지 이동이 표시되지만 연결된 공식 GreetingHR 상세가 403으로 차단돼 최종 지원 상태를 확인하지 못했다.', 'NEEDS_REVIEW', 'e81e1d03d7584f4bd9c46facdfb414e73a44e1e6a6fe82a706e7c93e47a73139', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-292d372adafc184df16346ee', '넛지헬스케어(캐시워크)', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '156011', 'https://www.rocketpunch.com/jobs/156011', '[캐시워크] 백엔드 개발 채용전환형 인턴', 'BACKEND', 'NEW_GRAD_ONLY', '로켓펀치 상세에 숙련도 신입과 채용전환형 인턴이 명시됨.', 'INTERN', '미확인', 0, '[]', NULL, NULL, 0, '로켓펀치에는 상시채용과 외부 지원 페이지 이동이 표시되지만 연결된 공식 GreetingHR 상세가 403으로 차단돼 최종 지원 상태를 확인하지 못했다.', 'NEEDS_REVIEW', 'e4eb625dcba2aa14433718d56381e5fc28ccfa4639505cea9d4251f14a081084', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-6b340835b24ffbec68f5a685', '넛지헬스케어(캐시워크)', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '156013', 'https://www.rocketpunch.com/jobs/156013', '[캐시워크] 안드로이드 개발 채용전환형 인턴', 'ANDROID', 'NEW_GRAD_ONLY', '로켓펀치 상세에 숙련도 신입과 채용전환형 인턴이 명시됨.', 'INTERN', '미확인', 0, '["Android"]', NULL, NULL, 0, '로켓펀치에는 상시채용과 외부 지원 페이지 이동이 표시되지만 연결된 공식 GreetingHR 상세가 403으로 차단돼 최종 지원 상태를 확인하지 못했다.', 'NEEDS_REVIEW', 'b2bce482b590a24e5309ec5d95e1577808114b71d1e7499d4e83fad19587495a', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-67b744b1b9fec9836d96d094', '안랩', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '자소설닷컴', '105532', 'https://jasoseol.com/recruit/105532', '2026년 8월 수시채용 중 IT 인프라 운영 직무 통합 공고', 'MULTI_IT_ROLES', 'NEW_GRAD_ELIGIBLE', '통합 공고가 신입·경력으로 표시되지만 IT 인프라 운영 세부 직무별 신입 허용 여부를 공식 지원 페이지에서 분리 검증하지 못함.', 'UNCLASSIFIED', '미확인', 0, '["Cloud","Microsoft 365"]', NULL, '2026-08-17T14:59:00+09:00', 0, 'IT 인프라 운영(Cloud·M365) 직무가 포함된 통합 공고이나 공식 지원 시스템의 개별 직무 버튼과 신입 조건을 확인하지 못해 분리했다.', 'NEEDS_REVIEW', '6b7ffff8d8054e44d1902f5809e636ff1a1b8e46792fcde19b0112836a52d325', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-9f796cf52ec16081c0250854', '테크윙', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '자소설닷컴', '105412', 'https://jasoseol.com/recruit/105412', '2026년 8월 각 부문 채용 중 SW·Vision SW·AI 직무 통합 공고', 'MULTI_IT_ROLES', 'NEW_GRAD_ELIGIBLE', '통합 공고가 신입·경력으로 표시되지만 네 개 IT 세부 직무별 신입 허용 여부를 공식 지원 페이지에서 분리 검증하지 못함.', 'UNCLASSIFIED', '미확인', 0, '["Software","Vision","AI"]', NULL, '2026-08-16T14:59:00+09:00', 0, 'SW 개발·SW 관리·Vision SW·AI가 하나의 통합 공고에 묶여 있고 공식 지원 페이지의 개별 지원 상태를 검증하지 못했다.', 'NEEDS_REVIEW', 'd62793eab731640a5a27c49a8e596798ec2dc504a15339e09fdb4b59d84644bf', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-aa68693598df632701dc4b67', '유저와이', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '원티드', '359579', 'https://www.wanted.co.kr/wd/359579', 'AI-Native 풀스택 개발자 (신입/주니어)', 'FULLSTACK', 'NEW_GRAD_ELIGIBLE', '상세 페이지에 신입~경력 2년과 학력·경력 무관이 명시됨.', 'UNCLASSIFIED', '경기 성남시', 0, '["Next.js","NestJS","FastAPI","AWS Bedrock","RAG","n8n"]', NULL, NULL, 0, '상세 페이지에서 신입 조건과 상시채용 표시는 확인했지만 렌더링된 실제 지원 버튼 상태를 확인하지 못해 rolling을 확정하지 않았다.', 'NEEDS_REVIEW', '03bc13378a168b0f6db3e53a715e90ffea2a386ab57f0036151a79163d5ca55d', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-16bbdbc757f90f7a306f60a6', '이지모션', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '원티드', '355536', 'https://www.wanted.co.kr/wd/355536', 'CAE 소프트웨어 개발자', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '검색 결과에서 신입 지원 가능 공고로 표시됐으나 상세 페이지가 403으로 차단됨.', 'UNCLASSIFIED', '미확인', 0, '[]', NULL, NULL, 0, '원티드 상세 페이지가 403으로 차단돼 실제 지원 버튼·마감일·세부 자격요건을 확인하지 못했다.', 'NEEDS_REVIEW', '2a2da8398767611937798111c68e8d178ebcdc34a333aa43ee5b261dae3cc435', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e98b9b46c08ca56871239d70', '언리저브', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '원티드', '305774', 'https://www.wanted.co.kr/wd/305774', 'Deep Learning Developer', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '검색 결과에서 신입~경력 5년 범위로 표시됐으나 상세 페이지가 403으로 차단됨.', 'UNCLASSIFIED', '미확인', 0, '["Deep Learning"]', NULL, NULL, 0, '원티드 상세 페이지가 403으로 차단돼 실제 지원 버튼·마감일·세부 자격요건을 확인하지 못했다.', 'NEEDS_REVIEW', '37d588a87430f2de04b5e2ad3efa8fff44d6a248b8a51184fb6d2b327caefef7', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00', '2026-08-14T14:37:12+09:00', '2026-08-14T14:39:09+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-99dedfeaa23be244be3f1bea', '사운드마인드', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '159008', 'https://www.rocketpunch.com/jobs/159008', '웹/앱 프론트엔드 개발자 (React/Next.js)', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '상세 페이지에서 숙련도 ''주니어, 신입''과 신입 웹 프론트엔드 개발자 모집이 확인됨.', 'FULL_TIME', '미확인', 0, '["TypeScript","React","Next.js","Zustand","TanStack Query","Tailwind CSS","Axios","React Native","Spring Boot","MariaDB","Redis","Docker"]', NULL, '2026-09-01T23:59:59+09:00', 0, '신입 조건과 미래 마감일은 확인했지만 로그인 상태에 따라 실제 간편지원 제어가 달라질 수 있어 지원 버튼 활성 여부를 엄격하게 확정하지 못했다.', 'NEEDS_REVIEW', 'defa9570ac91b7c7f93c8f72c68b8a7a8b716fbe7efa320cbcdcebc991faee37', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ca52b46a86b57d2e55c2debb', 'GC메디아이', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '158917', 'https://www.rocketpunch.com/jobs/158917', 'AI-Native Engineer(인턴)', 'AI_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '경력 무관과 인턴·정규직 전환 검토가 명시됨.', 'INTERN', '미확인', 0, '["JavaScript","TypeScript","AI Agent","MSA","Git"]', NULL, NULL, 0, '로켓펀치에는 상시채용과 외부 지원 페이지 이동이 표시되지만 최종 지원 대상 페이지 상태를 확인하지 못해 분리했다.', 'NEEDS_REVIEW', 'f05ba1f440cdb00c109ba850492a86db65d5800d6b0071f80b61114b3afe894b', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-a0c3a0ef5f1591aa18de7634', '팀스파르타', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '157706', 'https://www.rocketpunch.com/jobs/157706', 'AI Agent Engineer (인턴)', 'AI_AGENT_ENGINEERING', 'NEW_GRAD_ONLY', '상세 페이지에 경력 사항 신입과 6개월 채용연계형 인턴이 명시됨.', 'INTERN', '미확인', 0, '["AI Agent","MCP","Web Application","Data Pipeline"]', NULL, NULL, 0, '상시채용 문구와 신입 조건은 확인했지만 상세 본문의 지원 제어가 명확히 노출되지 않아 실제 지원 가능 상태를 확정하지 못했다.', 'NEEDS_REVIEW', 'bfaee3218c7255de02ed8a880130056f2333fb60ca65b314d9d5b2a16e35accd', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d96bb7238a75fafa2586eeb8', '베스텔라랩', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '로켓펀치', '151905', 'https://www.rocketpunch.com/jobs/151905', '영상AI 연구/개발(전문연구요원가능)', 'COMPUTER_VISION', 'NEW_GRAD_ELIGIBLE', '상세 페이지 숙련도에 신입·미들·시니어가 함께 명시됨.', 'FULL_TIME', '경기 안양시', 0, '["C","C++","Python","YOLO","OpenCV","PyTorch","TensorFlow"]', NULL, NULL, 0, '상시채용과 신입 범위는 확인했지만 상세 본문의 실제 지원 제어가 명확히 노출되지 않아 관리자 확인이 필요하다.', 'NEEDS_REVIEW', '336df7185783cdfaff13278cd460043a73b9c5f5824780b388dba5810d82d10d', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:24+09:00', '2026-08-14T14:39:37+09:00');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, deadline_at, rolling, summary, status, fingerprint,
   collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-60610b8242a670032510dabc', 'HJ중공업', 'UNCLASSIFIED', '공식 상세 페이지에서 기업 규모를 확정할 수 있는 명시적 근거를 확인하지 못해 미분류함.', '슈퍼루키', '6a7a6f52f68c995027428772', 'https://www.superookie.com/jobs/6a7a6f52f68c995027428772', 'HJ중공업 2026 신입사원 공개채용', 'MULTI_ROLE', 'NEW_GRAD_ONLY', '고용형태가 신입으로 표시됨.', 'UNCLASSIFIED', '미확인', 0, '[]', NULL, '2026-08-24T23:59:00+09:00', 0, '지원 기간과 지원 링크는 표시되지만 모집 직무가 이미지 중심이고 본문에서 IT 직무를 확인할 수 없으며 숨김 상태 문구도 충돌해 검토 대상으로 분리했다.', 'NEEDS_REVIEW', 'd099debbbf44b4c48746b2883df2021f1d4ad04c0aa244ff7a8fb485154d988a', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:47+09:00', '2026-08-14T14:39:37+09:00', '2026-08-14T14:39:47+09:00');
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
  ('catalog-jobs-20260814', 'jobs', 'fdae37a8efab0e9be19d55dcedb5d2188fdc7959349badae9a3515dc688f7d9b', 'COMMITTED',
   64, 30,
   '{"active":13,"deadlineUnknown":3,"needsReview":18,"excluded":30,"stored":34,"visible":16,"excludedOverlapUrls":1,"policy":"replace-all; active/deadline-unknown visible; needs-review hidden; excluded omitted"}', '2026-08-14T05:44:00.000Z', '2026-08-14T05:44:00.000Z');
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0019_replace_job_catalog_20260814', 'sha256:fdae37a8efab0e9be19d55dcedb5d2188fdc7959349badae9a3515dc688f7d9b', '2026-08-14T05:44:00.000Z');
--> statement-breakpoint
PRAGMA optimize;
