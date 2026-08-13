UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-13T15:03:45+09:00'
WHERE source_url IN ('https://career.rememberapp.co.kr/job/posting/318412');
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
   last_verified_at, created_at, updated_at)
VALUES ('job-5387ebea8427745847551ea0', 'Bear Robotics', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4451300219', 'https://kr.linkedin.com/jobs/view/%EC%9D%B8%EC%9E%AC%ED%92%80-software-engineer-intern-at-bear-robotics-4451300219', '[인재풀] Software Engineer Intern', '로보틱스 소프트웨어', 'NEW_GRAD_ELIGIBLE', '제목이 Software Engineer Intern이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["C++","Python","Robotics"]', NULL, 0, '서비스 로봇 제품의 소프트웨어 개발 후보군에 등록하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-ffac9ec786c697eccf0f3e45', 'Bear Robotics', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4338879429', 'https://kr.linkedin.com/jobs/view/robotics-software-engineer-intern-at-bear-robotics-4338879429', 'Robotics Software Engineer, Intern', '로보틱스 소프트웨어', 'NEW_GRAD_ONLY', '제목이 Robotics Software Engineer Intern이고 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["C++","Python","ROS","Robotics"]', NULL, 0, '서비스 로봇의 동작·센서·제어 소프트웨어를 개발하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-8686c14f70058c16901a0d23', 'BGROW', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4443091875', 'https://kr.linkedin.com/jobs/view/bgrow-ai-%EB%94%94%EB%B2%A8%EB%A1%9C%ED%8D%BC-%EB%B6%80%EB%AC%B8-%EC%8B%A0%EC%9E%85-%EA%B2%BD%EB%A0%A5-at-bgrow-4443091875', 'AI 디벨로퍼 부문 (신입/경력)', 'AI 서비스 개발', 'NEW_GRAD_ELIGIBLE', '제목에 신입/경력이 명시되고 공개 채용 목록에서 현재 모집 중으로 확인됨', 'FULL_TIME', '서울', 0, '["Python","AI","Machine Learning"]', NULL, 0, 'AI 모델과 서비스 적용 기능을 개발하는 신입·경력 통합 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-a1542c9fd163525a1d054138', 'DEEPX', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4437994464', 'https://kr.linkedin.com/jobs/view/sw-entry-level-engineering-bachelor%E2%80%99s-master%E2%80%99s-phd-%EC%A0%84%EB%AC%B8%EC%97%B0%EA%B5%AC%EC%9A%94%EC%9B%90-at-deepx-4437994464', '[SW] Entry-level Engineering (Bachelor’s/Master’s/PhD)', 'AI 반도체 소프트웨어', 'NEW_GRAD_ONLY', '제목에 Entry-level이 명시되고 공개 채용 목록에서 현재 모집 중으로 확인됨', 'FULL_TIME', '경기 성남시', 0, '["C","C++","Python","NPU","AI"]', NULL, 0, 'AI 반도체용 시스템·응용 소프트웨어를 개발하는 학사·석사·박사 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-b01228e4878b70f2f129781b', 'DEEPX', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4439183484', 'https://kr.linkedin.com/jobs/view/sw-entry-level-application-technology-development-at-deepx-4439183484', '[SW_Entry-Level] Application Technology Development', 'AI 응용 소프트웨어', 'NEW_GRAD_ONLY', '제목이 Entry-Level이고 LinkedIn 직급이 신입, 페이지가 채용중으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Python","C","C++","TensorFlow","PyTorch","Edge AI"]', NULL, 0, 'NPU를 활용한 엣지 AI 애플리케이션과 SDK·개발자 도구를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-1fac27c761f5fd192ab1b11e', 'DEEPX', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4442024252', 'https://kr.linkedin.com/jobs/view/sw-entry-level-dnn-model-optimization-engineer-at-deepx-4442024252', '[SW_Entry-Level] DNN Model Optimization Engineer', 'AI 모델 최적화', 'NEW_GRAD_ONLY', '제목이 Entry-Level이고 공개 채용 목록에서 현재 모집 중으로 확인됨', 'FULL_TIME', '경기 성남시', 0, '["Python","C++","DNN","Model Optimization"]', NULL, 0, 'DNN 모델을 NPU 환경에 맞게 변환·경량화·최적화하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-ca2c2582f4ebeb1e07898522', 'DEEPX', 'UNCLASSIFIED', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4437982822', 'https://kr.linkedin.com/jobs/view/sw-entry-level-windows-npu-driver-engineer-at-deepx-4437982822', '[SW_Entry-Level] Windows NPU Driver Engineer', '시스템·드라이버 개발', 'NEW_GRAD_ONLY', '제목이 Entry-Level이고 페이지가 채용중으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["C","C++","Windows Driver","NPU"]', NULL, 0, 'Windows 환경에서 NPU 장치 드라이버와 저수준 시스템 소프트웨어를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-27d478befed9b3d80c629d92', 'Equinix', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4443732129', 'https://kr.linkedin.com/jobs/view/2026%EB%85%84-%EC%97%90%ED%80%B4%EB%8B%89%EC%8A%A4-%EC%BD%94%EB%A6%AC%EC%95%84-%EB%8D%B0%EC%9D%B4%ED%84%B0%EC%84%BC%ED%84%B0-%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4-%ED%95%98%EB%B0%98%EA%B8%B0-%EC%9D%B8%ED%84%B4-at-equinix-4443732129', '2026 하반기 데이터센터 엔지니어 인턴', '데이터센터·인프라', 'NEW_GRAD_ONLY', '제목에 2026년 하반기 인턴으로 명시되고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Data Center","Linux","Network","Infrastructure"]', NULL, 0, '데이터센터 설비·서버·네트워크 운영을 지원하는 하반기 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-39d55f8c0909b30e25ed8259', 'Moloco', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4436704865', 'https://kr.linkedin.com/jobs/view/software-engineer-intern-3-month-internship-at-moloco-4436704865', 'Software Engineer Intern (3-month internship)', '소프트웨어 엔지니어링', 'NEW_GRAD_ONLY', '제목이 3개월 소프트웨어 엔지니어 인턴이고 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Software Engineering","Backend","Data"]', NULL, 0, '광고·머신러닝 플랫폼의 제품 소프트웨어를 개발하는 3개월 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-bfd82ecb24887fcfcd8cfcb2', 'Qualcomm', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4403602795', 'https://kr.linkedin.com/jobs/view/intern-ai-integration-interoperability-at-qualcomm-4403602795', 'Intern – AI Integration & Interoperability', 'AI 시스템 통합', 'NEW_GRAD_ONLY', '제목이 AI 인턴이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Python","AI","Integration"]', NULL, 0, 'AI 모델과 모바일 플랫폼 간 통합·호환성 검증 도구를 개발하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-17744688523d31563f16fca2', 'Qualcomm', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4442069839', 'https://kr.linkedin.com/jobs/view/intern-%E2%80%93-ai-model-efficiency-quantization-system-research-engineer-at-qualcomm-4442069839', 'Intern – AI Model Efficiency, Quantization & System Research', 'AI 모델 최적화', 'NEW_GRAD_ONLY', '제목이 AI 시스템 연구 인턴이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Python","Quantization","Deep Learning","Systems"]', NULL, 0, 'AI 모델 양자화와 효율 개선, 시스템 수준 실험을 수행하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-bf5c85f1d22098f758076fdf', 'Qualcomm', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4327652815', 'https://kr.linkedin.com/jobs/view/intern-deep-learning-r-d-for-automated-driving-at-qualcomm-4327652815', 'Intern – Deep Learning R&D for Automated Driving', '자율주행 AI', 'NEW_GRAD_ONLY', '제목이 딥러닝 R&D 인턴이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Python","Deep Learning","Autonomous Driving"]', NULL, 0, '자율주행용 딥러닝 모델과 실험 파이프라인을 연구·개발하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-0345d9de90adf119fe7caaf6', 'Qualcomm', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4442076645', 'https://kr.linkedin.com/jobs/view/intern-genai-benchmarking-mle-on-device-model-deployment-swe-at-qualcomm-4442076645', 'Intern – GenAI Benchmarking, MLE & On-device Model Deployment', '생성형 AI·온디바이스 ML', 'NEW_GRAD_ONLY', '제목이 생성형 AI·ML 인턴이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Python","GenAI","Machine Learning","On-device AI"]', NULL, 0, '생성형 AI 모델을 평가하고 온디바이스 환경에 배포·최적화하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-2c7ae061c44e9915c79d2633', 'Qualcomm', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4432928554', 'https://kr.linkedin.com/jobs/view/intern-generative-ai-model-personalization-and-efficient-fine-tuning-at-qualcomm-4432928554', 'Intern – Generative AI Model Personalization & Efficient Fine-tuning', '생성형 AI 연구', 'NEW_GRAD_ONLY', '제목이 생성형 AI 인턴이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Python","LLM","Fine-tuning","GenAI"]', NULL, 0, '생성형 AI 모델의 개인화와 효율적 파인튜닝 기법을 연구하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-7d1909bfeee92fa55d9335f9', 'Qualcomm', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4442070764', 'https://kr.linkedin.com/jobs/view/intern-on-device-agenticai-at-qualcomm-4442070764', 'Intern – On-device Agentic AI', '온디바이스·에이전트 AI', 'NEW_GRAD_ONLY', '제목이 온디바이스 Agentic AI 인턴이고 공개 페이지가 채용중으로 표시됨', 'INTERN', '서울', 0, '["Python","Agentic AI","On-device AI","LLM"]', NULL, 0, '모바일 장치에서 동작하는 에이전트 AI 모델과 실행 구조를 연구하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-4cb25ea30a59b94936264888', 'Telit Cinterion', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4433909368', 'https://kr.linkedin.com/jobs/view/junior-linux-device-driver-engineer-at-telit-cinterion-4433909368', 'Junior Linux Device Driver Engineer', 'Linux·드라이버 개발', 'NEW_GRAD_ELIGIBLE', '제목에 Junior가 명시되고 공개 채용 목록에서 현재 모집 중으로 확인됨', 'FULL_TIME', '서울', 0, '["C","C++","Linux","Device Driver"]', NULL, 0, '통신 모듈용 Linux 장치 드라이버와 임베디드 시스템 소프트웨어를 개발하는 주니어 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-7fc79e8128942c71622b99b1', '다쏘시스템', 'FOREIGN', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4426373645', 'https://kr.linkedin.com/jobs/view/software-r-d-engineer-intern-12-month-at-dassault-syst%C3%A8mes-4426373645', 'Software R&D Engineer Intern (12-month)', '소프트웨어 R&D', 'NEW_GRAD_ONLY', '제목이 12개월 소프트웨어 R&D 인턴이고 페이지가 채용중으로 표시됨', 'INTERN', '부산', 0, '["C++","Software R&D","3D"]', NULL, 0, '산업용 3D 소프트웨어 기능을 연구·개발하는 장기 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-e61f024b3cae13287b8f586a', '현대모비스', 'LARGE', '글로벌 기업 또는 국내 대기업으로 공개적으로 확인되는 경우만 분류하고 그 외는 미분류', 'LinkedIn', '4445086881', 'https://kr.linkedin.com/jobs/view/%EC%8B%A0%EC%9E%85-%EC%97%B0%EA%B5%AC%EC%A7%81-%EB%A1%9C%EB%B4%87-%ED%95%B8%EC%A6%88-sw-%EA%B0%9C%EB%B0%9C-at-hyundai-mobis-4445086881', '[신입-연구직] 로봇 핸즈 SW 개발', '로보틱스·제어 소프트웨어', 'NEW_GRAD_ONLY', '제목에 신입-연구직으로 명시되고 페이지가 채용중으로 표시됨', 'FULL_TIME', '경기 의왕시', 0, '["C++","Python","Robotics","Control"]', NULL, 0, '로봇 핸즈의 제어 알고리즘과 동작 소프트웨어를 연구·개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-ed759847a9e3b74d9225cbef', '콩콩프렌즈', 'SMALL', '공고의 사업장 정보에서 소규모 인원 규모를 확인', '고용24', '51257089', 'https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?infoTypeCd=CJK&infoTypeGroup=tb_workinfogubun&wantedAuthNo=51257089', '이벤트 엔지니어 채용 - Next.js·Supabase 기반 EventTech 개발', '이벤트테크 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '고용24 공고의 경력 조건이 신입·경력으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Next.js","Supabase","Frontend"]', '2026-08-13T23:59:59+09:00', 0, 'Next.js와 Supabase 기반 이벤트테크 서비스의 프론트엔드·플랫폼 기능을 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-111d0e230cf5cda2c1a4de6b', 'Hudson AI', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '로켓펀치', '156625', 'https://www.rocketpunch.com/jobs/156625', 'Fullstack Engineer', 'AI 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '포지션의 경력 수준에 신입이 포함되고 상시 채용으로 표시됨', 'FULL_TIME', '미정', 0, '["Python","JavaScript","TypeScript","Django","PostgreSQL","MongoDB","React","GCP","Docker"]', NULL, 1, 'AI 서비스의 Django 백엔드와 React 프론트엔드, 데이터 저장소와 클라우드 환경을 함께 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-3e35026a85e7fb9e6806a923', '페이타랩', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '로켓펀치', '156995', 'https://www.rocketpunch.com/jobs/156995', 'DevOps Engineer', 'DevOps·클라우드', 'NEW_GRAD_ELIGIBLE', '포지션의 스킬 레벨에 신입이 포함되고 상시 채용으로 표시됨', 'FULL_TIME', '서울', 0, '["AWS","Jenkins","Kubernetes","Argo CD","Terraform","Helm","ELK","Datadog","Prometheus"]', NULL, 1, '클라우드 인프라, 컨테이너 오케스트레이션, 배포 자동화와 모니터링 체계를 담당하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-46e424f92c3d80b909fc6702', '라이드플럭스', 'STARTUP', '공고의 기업 소개와 투자 단계 정보에서 자율주행 딥테크 스타트업으로 확인', '리멤버', '325743', 'https://career.rememberapp.co.kr/job/posting/325743', '[서울] 백엔드 개발 Engineer (정규직, 채용연계형 인턴)', '자율주행 백엔드·인프라 SW', 'NEW_GRAD_ELIGIBLE', '공고에 정규직 신입·경력과 6개월 채용연계형 인턴을 함께 모집하며, 경력무관·채용 시 마감·간편 지원 가능으로 표시됨', 'FULL_TIME_AND_CONVERSION_INTERN', '서울 영등포구', 1, '["C++","Python","CI/CD","API","Infrastructure Software"]', NULL, 1, '자율주행 인프라 소프트웨어의 백엔드·자동화 기능을 개발하는 신입 정규직 및 채용연계형 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-1970d918a225e0826495871a', '경기도 공공기관', 'PUBLIC', '공사 또는 공공기관 통합채용 공고로 확인', '링커리어', '337888', 'https://linkareer.com/activity/337888', '2026년 하반기 경기도 공공기관 통합채용 - IT/개발 분야', '공공기관 IT', 'NEW_GRAD_ONLY', '통합채용의 모집 유형이 신입이며 직무 분류에 IT/개발이 포함됨', 'FULL_TIME', '경기', 0, '["IT","Development"]', '2026-08-14T17:00:00+09:00', 0, '경기도 산하 공공기관의 IT·개발 관련 신입 직무를 포함한 통합채용.', 'NEEDS_REVIEW', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-ca4d022580f4712800b9dd74', '한국주택금융공사', 'PUBLIC', '공사 또는 공공기관 통합채용 공고로 확인', '링커리어', '339732', 'https://linkareer.com/activity/339732', '2026년도 신입직원 채용 - IT/개발 분야', '공공기관 IT', 'NEW_GRAD_ONLY', '모집 구분이 신입이며 직무 목록에 IT/개발 분야가 포함됨', 'FULL_TIME', '부산', 0, '["IT","Information Systems"]', '2026-08-20T23:59:59+09:00', 0, '주택금융 업무를 지원하는 정보시스템·IT 직군의 공공기관 신입 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-6cd4d0473952c060e351a601', '블루젠트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '사람인', '54605272', 'https://www.saramin.co.kr/zf_user/jobs/relay/pop-view?rec_idx=54605272', '차량 제어 SW 개발 연구원 모집(신입/경력)', '차량 제어 소프트웨어', 'NEW_GRAD_ELIGIBLE', '사람인 현재 채용 추천 영역에서 신입/경력으로 표시됨', 'FULL_TIME', '미정', 0, '["Automotive Software","Control Software"]', '2026-09-28T23:59:59+09:00', 0, '차량 제어 기능과 관련 소프트웨어를 연구·개발하는 신입·경력 통합 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-4e207cbf81ccbdc1c20b11b6', '트윔', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '사람인', '54628715', 'https://www.saramin.co.kr/zf_user/jobs/relay/pop-view?rec_idx=54628715', 'AI 플랫폼 백엔드 개발자(전문연구요원 가능)', 'AI 플랫폼 백엔드', 'NEW_GRAD_ELIGIBLE', '사람인 현재 채용 추천 영역에서 신입/경력 공고로 표시됨', 'FULL_TIME', '미정', 0, '["Backend","AI Platform"]', '2026-08-31T23:59:59+09:00', 0, 'AI 플랫폼의 서버·API와 데이터 처리 기능을 개발하는 백엔드 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-2067735cb74a62f3430165f5', '피트윈', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '사람인', '54584002', 'https://www.saramin.co.kr/zf_user/jobs/relay/pop-view?rec_idx=54584002', 'AI 네이티브 풀스택 개발자', 'AI 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '경력무관 공고로 표시되어 신입 지원 가능으로 판정함', 'FULL_TIME', '미정', 0, '["AI","Full Stack"]', NULL, 1, 'AI 기능을 내장한 웹 서비스의 프론트엔드와 백엔드를 개발하는 경력무관 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-4ac261e70f496b88d43fad95', '111퍼센트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '39698', 'https://www.wanted.co.kr/wd/39698', '클라이언트 개발자(신입)', '게임 클라이언트', 'NEW_GRAD_ONLY', '공고 제목과 포지션 정보에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '["Unity","C#"]', NULL, 1, '모바일 게임 클라이언트 기능과 콘텐츠를 구현하는 신입 개발자 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-2248223687a054097e76fcfd', 'SJH Studio', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '351328', 'https://www.wanted.co.kr/wd/351328', '서버 개발자 (신입)', '게임 서버 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '원격', 1, '["Scala","Akka","Cassandra","Backend"]', NULL, 1, '온라인 서비스의 분산 서버와 데이터 처리 로직을 개발하는 원격 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-51eabae7de6028d706e6cd7c', 'XYZ', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '336181', 'https://www.wanted.co.kr/wd/336181', 'Physical AI Engineer Intern', 'Physical AI·로보틱스', 'NEW_GRAD_ONLY', '공고 제목에 인턴 포지션으로 표시됨', 'INTERN', '서울', 0, '["Python","Robotics","Computer Vision"]', NULL, 1, '로봇과 Physical AI 시스템의 실험·응용 소프트웨어를 개발하는 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-5fbcd7610f61fe3d0f4670f2', '널리소프트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '239630', 'https://www.wanted.co.kr/wd/239630', '프론트엔드 개발자 (신입)', '프론트엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '["Frontend"]', NULL, 1, '웹 서비스 프론트엔드 기능과 사용자 인터페이스를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-4a00f1a7fadbbbefa7145cf6', '넥스트그라운드', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '317546', 'https://www.wanted.co.kr/wd/317546', '[인턴] 프론트엔드 개발자 (채용 전환형)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '인턴·채용 전환형 포지션으로 표시됨', 'INTERN', '서울 강남구', 0, '["TypeScript","React","Frontend"]', NULL, 1, '부동산·공간 서비스의 웹 프론트엔드 기능을 개발하는 전환형 인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-3bcded7ce05f99bd096c3c7e', '넷커스터마이즈', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '208508', 'https://www.wanted.co.kr/wd/208508', '임베디드 SW 개발자 (신입)', '임베디드 소프트웨어', 'NEW_GRAD_ONLY', '공고 제목과 경력 항목에 신입이 명시됨', 'FULL_TIME', '대전 유성구', 0, '["C","C++","Embedded"]', NULL, 1, '임베디드 장치용 소프트웨어와 제어 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-55de17a0fd11730faf448ff6', '누아', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '280308', 'https://www.wanted.co.kr/wd/280308', 'Data Engineer (신입)', '데이터 엔지니어링', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Python","ETL","API","Data Pipeline"]', NULL, 1, '여행·항공 데이터를 수집하고 파이프라인과 연동 API를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-8e7335155f356496fc207775', '누아', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '250255', 'https://www.wanted.co.kr/wd/250255', 'Integration Developer (신입)', '시스템 연동 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["API","Integration","Python"]', NULL, 1, '여행·항공 시스템 간 API와 데이터 연동 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-bbf940fdb604a02b4e3fc532', '뉴링크', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '88317', 'https://www.wanted.co.kr/wd/88317', 'DevOps Engineer - 신입', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목과 경력 구분에서 신입 지원 가능이 확인됨', 'FULL_TIME', '서울', 0, '["Linux","Windows","Cloud"]', NULL, 1, '클라우드·서버 환경의 배포 자동화와 운영 기반을 담당하는 신입 DevOps 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-2c11ddb6a668253ac3cbb466', '뉴링크', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '88132', 'https://www.wanted.co.kr/wd/88132', '백엔드 개발자 (신입)', '백엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Backend","API","Database"]', NULL, 1, '핀테크·블록체인 서비스의 서버 API와 데이터 처리 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-bc001db8682e855728a3b48e', '닥터키친', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '15695', 'https://www.wanted.co.kr/wd/15695', '프론트엔드 개발자 (신입)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["JavaScript","React","Frontend"]', NULL, 1, '헬스케어·식품 서비스의 웹 프론트엔드 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-bcd0a596acd2a5c5dcaeeb7d', '데브시스터즈', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '86413', 'https://www.wanted.co.kr/wd/86413', '[데브시스터즈] DevOps Engineer (신입)', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목과 경력 조건에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["DevOps","Cloud"]', NULL, 1, '게임·서비스 개발 조직의 클라우드 인프라와 자동화 환경을 담당하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-99cf105ac009e1abd564751c', '데이블', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '2707', 'https://www.wanted.co.kr/wd/2707', '백엔드 개발자 (신입)', '백엔드·데이터 개발', 'NEW_GRAD_ONLY', '공고 본문 경력 수준이 신입이며 상시채용으로 표시됨', 'FULL_TIME', '서울 강남구', 0, '["AWS","SQL","Python"]', NULL, 1, '추천·광고 서비스의 데이터 처리와 서비스 연동 업무를 수행하는 신입 개발 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-72a4f19a2486ffe6d36bcb8c', '랭디', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '318329', 'https://www.wanted.co.kr/wd/318329', '백엔드 개발자 (신입~3년)', '백엔드 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에서 신입부터 3년 이하까지 지원 가능으로 표시됨', 'FULL_TIME', '서울', 0, '["Backend","API","Database"]', NULL, 1, '언어 학습 서비스의 서버 기능과 운영 API를 개발하는 신입·주니어 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-04a1990308bef5fa88ae3160', '러너소프트', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '321546', 'https://www.wanted.co.kr/wd/321546', '게임 서버 개발자 (신입)', '게임 서버 개발', 'NEW_GRAD_ONLY', '공고 제목에서 신입 지원 가능으로 표시됨', 'CONTRACT', '서울', 0, '["Game Server","Backend","Database"]', NULL, 1, '게임 서버 로직과 운영 API를 개발하는 계약 후 전환 가능 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-29f75ddb6f6e70c34ea38cbf', '러너소프트', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '302120', 'https://www.wanted.co.kr/wd/302120', '게임 클라이언트 개발자 (신입)', '게임 클라이언트 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Unity","C#"]', NULL, 1, '온라인 게임의 Unity 클라이언트와 사용자 인터페이스를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-046252b055a07712c0c9f365', '러너소프트', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '302131', 'https://www.wanted.co.kr/wd/302131', '홀덤 게임 백엔드 개발자 (신입)', '게임 백엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입, 상시채용으로 표시됨', 'FULL_TIME', '서울', 0, '["Node.js","TypeScript","Database"]', NULL, 1, '온라인 게임의 서버 API와 실시간 게임 로직을 개발하는 신입 백엔드 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-1c324abc415e8aa2f03fb322', '레트리카', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '290358', 'https://www.wanted.co.kr/wd/290358', 'Android 개발자 (신입)', 'Android 앱 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Kotlin","Android"]', NULL, 1, '카메라·콘텐츠 모바일 서비스의 Android 앱 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-31978cd9150076a986825ac4', '룰루랩', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '28556', 'https://www.wanted.co.kr/wd/28556', 'AI 알고리즘 신입 (전문연구요원)', 'AI 알고리즘', 'NEW_GRAD_ONLY', '공고 제목에 신입 및 전문연구요원 지원 가능이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["AI","Algorithm"]', NULL, 1, 'AI 알고리즘을 연구·개발하고 제품 기능에 적용하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-a886975904c559d2976a593b', '말달리자', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '290851', 'https://www.wanted.co.kr/wd/290851', '프론트엔드 개발자(신입)', '프론트엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 개발자 채용이 명시됨', 'FULL_TIME', '경북 경산시', 0, '["Frontend"]', NULL, 1, '웹 서비스 사용자 화면과 프론트엔드 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-3e7cd4218c7e7de576aed5bf', '머니투데이', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '11023', 'https://www.wanted.co.kr/wd/11023', 'AWS DevOps 엔지니어 (신입)', 'DevOps·클라우드', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 채용 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["AWS","Linux","CI/CD","Docker"]', NULL, 1, '미디어 서비스의 AWS 인프라와 배포·운영 자동화를 담당하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-15abe6f066db16e17efcf735', '메가비엠', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '302346', 'https://www.wanted.co.kr/wd/302346', '앱 소프트웨어 개발자 (신입)', '모바일·응용 소프트웨어 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Mobile","Application Development"]', NULL, 1, '업무용 모바일·응용 소프트웨어 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-92736837158293e40edc66e5', '문리버', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '107468', 'https://www.wanted.co.kr/wd/107468', '프론트엔드 개발자 (신입)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '공고 제목에 신입으로 표시되고 상시채용으로 노출됨', 'FULL_TIME', '서울', 0, '["JavaScript","TypeScript","React"]', NULL, 1, '웹 서비스 사용자 화면과 공통 프론트엔드 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-3794e2da82ae30b6921047a6', '바딧', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '267193', 'https://www.wanted.co.kr/wd/267193', '백엔드 개발자 (신입)', '백엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 백엔드 개발자 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Backend"]', NULL, 1, '서비스 API와 서버 애플리케이션을 개발하는 신입 백엔드 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-babe17bea4a93bcbfb75ab69', '바이언스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '276128', 'https://www.wanted.co.kr/wd/276128', 'AI 개발자 (신입)', 'AI·머신러닝', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Python","Machine Learning","Deep Learning"]', NULL, 1, '데이터 기반 AI 모델과 서비스 적용 파이프라인을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-b5f9ce422f37cd7322bbbf85', '버넥트', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '352361', 'https://www.wanted.co.kr/wd/352361', 'Physical AI 제어·임베디드 개발자 (신입 이상)', 'Physical AI·임베디드', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입 이상 지원 가능으로 표시됨', 'FULL_TIME', '서울', 0, '["C++","Python","Robotics","Embedded"]', NULL, 1, '로봇·공간 컴퓨팅 환경의 제어 소프트웨어와 Physical AI 기능을 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-4f93fc3bb8a7f037234b504f', '베이리스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '284385', 'https://www.wanted.co.kr/wd/284385', 'AI Custom·Embedded SW 개발자 (신입)', 'AI·임베디드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["C","C++","Python","Embedded","AI"]', NULL, 1, 'AI 모델을 장치 환경에 적용하는 임베디드 소프트웨어를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-20a96f2d217bbd686a65aec0', '브레인즈컴퍼니', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '255909', 'https://www.wanted.co.kr/wd/255909', '프론트엔드 개발자 (신입)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["JavaScript","TypeScript","React"]', NULL, 1, '기업용 소프트웨어 화면과 웹 사용자 인터페이스를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-e5d22dfac1fa82534ff922fc', '비모소프트', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '228689', 'https://www.wanted.co.kr/wd/228689', 'iOS 개발자 (신입)', 'iOS 앱 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Swift","iOS"]', NULL, 1, '모바일 영상 편집 제품의 iOS 애플리케이션 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-204077a32c233c1783f996b9', '비모소프트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '228691', 'https://www.wanted.co.kr/wd/228691', '백엔드 개발자(신입)', '백엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 백엔드 개발자 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Backend"]', NULL, 1, '서비스 서버와 API를 구현하는 신입 백엔드 개발자 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-fb6401e24b2c1a883e2a1d86', '비주얼캠프', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '157377', 'https://www.wanted.co.kr/wd/157377', '백엔드 개발자 (신입)', '백엔드 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Backend","API","Database"]', NULL, 1, 'AI·시선 추적 서비스의 서버 API와 데이터 처리 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-3505b0bffd524c8ca5a2d7b4', '비하베스트', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '115012', 'https://www.wanted.co.kr/wd/115012', '블록체인 DevOps (신입/주니어)', '블록체인·DevOps', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/주니어 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["Blockchain","DevOps"]', NULL, 1, '블록체인 서비스의 노드·인프라 운영과 배포 자동화를 담당하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-4d07e23180673cab8b571089', '빗썸', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '99561', 'https://www.wanted.co.kr/wd/99561', '[빗썸] DevOps (신입)', 'DevOps·클라우드', 'NEW_GRAD_ONLY', '공고 본문 경력 수준이 신입이며 마감일이 상시채용으로 표시됨', 'FULL_TIME', '서울 강남구', 0, '["CI/CD","Docker","Kubernetes","Cloud"]', NULL, 1, '애플리케이션 배포 자동화와 하이브리드 운영 환경을 다루는 신입 DevOps 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-d3774b5e6bb70c936c5edf70', '빙글', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '2128', 'https://www.wanted.co.kr/wd/2128', 'iOS 개발자 (신입/인턴)', 'iOS 앱 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에서 신입 또는 인턴 지원 가능으로 표시됨', 'INTERN', '서울', 0, '["Swift","iOS"]', NULL, 1, '커뮤니티 모바일 서비스의 iOS 앱 기능을 개발하는 신입·인턴 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-71ffe2873cb2ec603fb2064a', '슈퍼센트', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '285375', 'https://www.wanted.co.kr/wd/285375', '게임 클라이언트 개발자 (신입)', '게임 클라이언트 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 게임 클라이언트 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Unity","C#","Mobile Game"]', NULL, 1, '모바일 게임의 Unity 클라이언트와 콘텐츠 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-b4e2ae650754a201f5d41cdb', '스몰티켓', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '231538', 'https://www.wanted.co.kr/wd/231538', 'iOS 개발자 (신입)', 'iOS 앱 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Swift","iOS"]', NULL, 1, '인슈어테크 서비스의 iOS 애플리케이션 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-49ae582e869e03e02c508eda', '스카이랩스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '188191', 'https://www.wanted.co.kr/wd/188191', '딥러닝·머신러닝 AI 개발자 (신입)', 'AI·머신러닝', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Python","PyTorch","Machine Learning","Deep Learning"]', NULL, 1, '헬스케어 데이터를 활용한 머신러닝 모델을 연구·개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-457d32f7d1ff3493cecc52cd', '스탬퍼', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '273412', 'https://www.wanted.co.kr/wd/273412', '블록체인 엔지니어 (DevOps/NodeOps) 신입', '블록체인·DevOps', 'NEW_GRAD_ONLY', '공고 본문 자격요건에 경력 신입, 마감일 상시채용으로 표시됨', 'FULL_TIME', '서울 강남구', 0, '["Linux","Containers","IaC","Go","Rust","Bash"]', NULL, 1, '블록체인 노드와 서버 인프라를 자동화·운영하고 관련 도구를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-d118b031c33f05b5cfa7cda9', '스터닝', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '274292', 'https://www.wanted.co.kr/wd/274292', '프론트엔드 개발자 (신입)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["TypeScript","React","Frontend"]', NULL, 1, '디자인·콘텐츠 플랫폼의 웹 프론트엔드 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-e5bde1ffcf7b5f0877c6c019', '심플랫폼', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '220840', 'https://www.wanted.co.kr/wd/220840', 'Front-end 개발자 (신입/주니어)', '프론트엔드 개발', 'NEW_GRAD_ELIGIBLE', '공개 채용 결과에서 신입·주니어 지원 가능 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["JavaScript","TypeScript","React"]', NULL, 1, '데이터·플랫폼 서비스의 웹 프론트엔드를 개발하는 신입·주니어 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-b4b54e408f2cfee9ac40a11f', '아데나소프트웨어', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '284408', 'https://www.wanted.co.kr/wd/284408', 'DevOps Engineer(신입)', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목에 신입 채용이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["DevOps"]', NULL, 1, '소프트웨어 서비스의 인프라 자동화와 배포·운영 환경을 담당하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-aa77c1116f13f6e90af561e1', '아티언스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '357654', 'https://www.wanted.co.kr/wd/357654', 'AI 서비스 개발자 (신입)', 'AI 서비스 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Python","LLM","AI"]', NULL, 1, 'AI 모델을 활용한 업무·고객 서비스 기능과 백엔드 연동을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-7ff3d1717a48377ea698b39a', '에프에스솔루션', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '237961', 'https://www.wanted.co.kr/wd/237961', 'Vision AI 개발자 (신입)', 'AI·컴퓨터 비전', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Python","Computer Vision","Deep Learning"]', NULL, 1, '영상 데이터를 활용하는 컴퓨터 비전 모델과 응용 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-0cbd15937589b6f19dedbb8d', '에피넷', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '170641', 'https://www.wanted.co.kr/wd/170641', 'Java 웹 개발자 (신입)', '웹·백엔드 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 채용 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Java","Spring","JavaScript"]', NULL, 1, 'Java 기반 기업 웹 시스템의 서버와 화면 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-702d9b048240c9a214a86f9d', '엘리스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '204608', 'https://www.wanted.co.kr/wd/204608', 'Android 개발자 (신입)', 'Android 앱 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Kotlin","Android"]', NULL, 1, '교육 플랫폼의 Android 애플리케이션과 학습 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-1d6a1a45f6063d25d1b939e9', '엘리스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '204606', 'https://www.wanted.co.kr/wd/204606', 'iOS 개발자 (신입)', 'iOS 앱 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Swift","iOS"]', NULL, 1, '교육 플랫폼의 iOS 애플리케이션과 학습 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-de5869bb85afe007221257c0', '오퍼스엠', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '151310', 'https://www.wanted.co.kr/wd/151310', 'Android 개발자 (신입~3년)', 'Android 앱 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에서 신입부터 3년 이하까지 지원 가능으로 표시됨', 'FULL_TIME', '서울', 0, '["Kotlin","Android"]', NULL, 1, '모바일 서비스의 Android 기능과 외부 시스템 연동을 개발하는 신입·주니어 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-ccf4308b4bb8fdf030c95c99', '와이즐리컴퍼니', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '286969', 'https://www.wanted.co.kr/wd/286969', '신입 백엔드/프론트엔드 개발자', '풀스택 웹 개발', 'NEW_GRAD_ONLY', '공고 제목에 신입 백엔드/프론트엔드 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Backend","Frontend"]', NULL, 1, '커머스 서비스의 프론트엔드와 백엔드 제품 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-665b0d4397546e7943c38b2a', '위블링', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '63937', 'https://www.wanted.co.kr/wd/63937', 'AI 연구개발 (신입 가능)', 'AI 연구개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["AI","Machine Learning"]', NULL, 1, 'AI 모델과 응용 기능을 연구·개발하고 서비스에 적용하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-38a0b35196d8ed95537d365b', '위시켓', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '306277', 'https://www.wanted.co.kr/wd/306277', '백엔드 개발자 (신입~5년)', '백엔드 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에서 신입부터 지원 가능한 범위로 표시됨', 'FULL_TIME', '서울', 0, '["Python","Django","AWS","Docker"]', NULL, 1, 'IT 프로젝트 플랫폼의 Python·Django 백엔드와 운영 도구를 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-aa68693598df632701dc4b67', '유저와이', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '359579', 'https://www.wanted.co.kr/wd/359579', 'AI-Native 풀스택 개발자 (신입/주니어)', 'AI 풀스택 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에서 신입·주니어 지원 가능으로 표시됨', 'FULL_TIME', '서울', 0, '["TypeScript","React","Node.js","AI"]', NULL, 1, 'AI 기능을 포함한 웹 제품의 프론트엔드와 백엔드를 함께 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-17648cb0ce6bf9068cb6d5e2', '이노뎁', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '295151', 'https://www.wanted.co.kr/wd/295151', 'AI Vision 개발자 (신입)', 'AI·컴퓨터 비전', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Python","Computer Vision","Deep Learning"]', NULL, 1, '영상 분석 모델과 비전 AI 응용 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-1cf54c2af60df076f16e01f5', '이파피루스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '227520', 'https://www.wanted.co.kr/wd/227520', '솔루션 엔지니어 (신입)', '솔루션·기술지원 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '경기 성남시', 0, '["Java","C++","Document Software"]', NULL, 1, '문서 소프트웨어를 고객 환경에 연동하고 기술 문제를 해결하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-150208056cfaa53321a87770', '잇마플', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '210620', 'https://www.wanted.co.kr/wd/210620', '백엔드 개발자(신입)', '백엔드', 'NEW_GRAD_ONLY', '공고 제목에 신입 지원 가능이 명시됨', 'FULL_TIME', '서울', 0, '["PHP","Laravel"]', NULL, 1, 'PHP·Laravel 기반 서비스 서버와 API를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-905f85286799b5a3f3cc8b88', '정리습관', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '322877', 'https://www.wanted.co.kr/wd/322877', 'AI 기반 React 개발자 (신입 이상)', 'AI 프론트엔드 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입 이상 지원 가능으로 표시됨', 'FULL_TIME', '서울', 0, '["React","TypeScript","AI"]', NULL, 1, 'AI 기능이 포함된 웹 제품의 프론트엔드와 사용자 경험을 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-1e94ded27c1ef5423439098d', '직방', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '1458', 'https://www.wanted.co.kr/wd/1458', 'Android 개발자 (신입)', 'Android 앱 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 Android 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Kotlin","Android"]', NULL, 1, '부동산 플랫폼의 Android 앱 기능과 모바일 공통 구조를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-36c0438b9bb5c61dfaddf91c', '직방', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '1457', 'https://www.wanted.co.kr/wd/1457', 'iOS 개발자 (신입)', 'iOS 앱 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 iOS 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Swift","iOS"]', NULL, 1, '부동산 플랫폼의 iOS 앱 기능과 공통 모바일 구조를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-67eb4a4cb7bb81e5895cdaf5', '채널코퍼레이션', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '102449', 'https://www.wanted.co.kr/wd/102449', '프론트엔드 엔지니어 (신입)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 프론트엔드 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["TypeScript","React","Frontend"]', NULL, 1, '고객 커뮤니케이션 SaaS의 웹 프론트엔드 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-83f6c96037bdb48fddc0a56a', '카카오스타일', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '19455', 'https://www.wanted.co.kr/wd/19455', 'iOS 개발자 (신입)', 'iOS 앱 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 iOS 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Swift","iOS"]', NULL, 1, '커머스 플랫폼의 iOS 앱과 공통 모바일 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-9823171bbce695da7430be07', '카카오스타일', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '5682', 'https://www.wanted.co.kr/wd/5682', '백엔드 개발자 (신입)', '커머스 백엔드 개발', 'NEW_GRAD_ONLY', '공개 채용 결과에서 신입 백엔드 포지션으로 확인됨', 'FULL_TIME', '서울', 0, '["Backend","API","Database"]', NULL, 1, '커머스 플랫폼의 서버 API와 대규모 서비스 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-3b1134104dc4ff39d14dbea9', '쿼리파이', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '261083', 'https://www.wanted.co.kr/wd/261083', 'DevOps Engineer (신입)', 'DevOps', 'NEW_GRAD_ONLY', '공고 제목에 신입 채용이 명시됨', 'FULL_TIME', '서울 강서구', 0, '["Terraform","CI/CD","Infrastructure as Code"]', NULL, 1, 'IaC와 CI/CD를 활용해 서비스 인프라와 배포 체계를 구축하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-00984c26ea93df779a0a9a0e', '크래프톤', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '30252', 'https://www.wanted.co.kr/wd/30252', '백엔드 플랫폼 엔지니어 DevOps (신입)', '게임 플랫폼·DevOps', 'NEW_GRAD_ONLY', '공고 본문 경력 수준이 신입이며 상시채용으로 표시됨', 'FULL_TIME', '서울 서초구', 0, '["Kubernetes","CI/CD","Monitoring","Cloud"]', NULL, 1, '대규모 게임 서비스의 플랫폼 인프라와 배포·관측 자동화를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-6c1c91209b3515c2771e021c', '크레이지스페이스', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '8918', 'https://www.wanted.co.kr/wd/8918', '소프트웨어 개발자 (신입)', '소프트웨어 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Software Development"]', NULL, 1, '서비스 요구사항에 맞춘 응용 소프트웨어 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-15d21bedc3dc049192a2c397', '파이오링크', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '281772', 'https://www.wanted.co.kr/wd/281772', '[전문연구요원] 클라우드 개발자 (백엔드/DevOps)', '클라우드·백엔드·DevOps', 'NEW_GRAD_ONLY', '공고의 경력 구분에서 신입 지원 가능이 확인됨', 'FULL_TIME', '서울 금천구', 0, '["C","Python","Go","Cloud"]', NULL, 1, '클라우드 플랫폼의 백엔드 기능과 DevOps 도구를 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-a97d5d34f7941758cdcd849e', '파트너', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '3162', 'https://www.wanted.co.kr/wd/3162', '서버 백엔드 개발자 (신입)', '백엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Backend","API","Database"]', NULL, 1, '서비스 서버와 데이터베이스 연동 기능을 개발하는 신입 백엔드 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-45bcc1c7d65109e57349b92f', '패스트뷰', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '28237', 'https://www.wanted.co.kr/wd/28237', '프론트엔드 개발자 (신입)', '프론트엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["JavaScript","React","Frontend"]', NULL, 1, '콘텐츠·커머스 웹 서비스의 사용자 화면을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-5add41d6fd23f43d3d6feb1c', '프리모리스엔젯리미티드(IKC)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '원티드', '262811', 'https://www.wanted.co.kr/wd/262811', '[신입] 웹 프론트엔드/백엔드 개발자', '풀스택 웹 개발', 'NEW_GRAD_ONLY', '공고 제목에 신입 프론트엔드/백엔드 개발자 채용이 명시됨', 'FULL_TIME', '서울 강남구', 0, '["Frontend","Backend"]', NULL, 1, '웹 서비스의 프론트엔드와 백엔드 기능을 함께 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-7d86c0da2f40b22657709196', '핀다', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '50940', 'https://www.wanted.co.kr/wd/50940', '백엔드 개발자 (신입)', '핀테크 백엔드 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Java","RDBMS","REST API"]', NULL, 1, '금융 비교 서비스의 서버 API와 데이터 연동 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-5dbcb369161c815ae4c252b9', '한국통신데이터', 'UNCLASSIFIED', '공개 공고 정보만으로 일관된 기업 규모 판정이 어려워 미분류', '원티드', '283787', 'https://www.wanted.co.kr/wd/283787', '웹·앱 개발자 (신입)', '웹·앱 개발', 'NEW_GRAD_ONLY', '공고 제목과 경력 배지에 신입으로 표시됨', 'FULL_TIME', '서울', 0, '["Web","Mobile","API"]', NULL, 1, '기업 서비스의 웹과 모바일 애플리케이션 기능을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-6304fb620db419d3e21b57d3', 'Superb AI', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '383998', 'https://inthiswork.com/archives/383998', '[R&D] Forward Deployed Engineer (경력 무관)', '응용 AI·솔루션 엔지니어링', 'NEW_GRAD_ELIGIBLE', '자격요건에 연차 무관 및 신입 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["Computer Vision","VLM","Docker","Kubernetes","TensorRT","ONNX Runtime","OpenCV"]', NULL, 1, '비전 AI 모델과 시스템 컴포넌트를 개발하고 클라우드·엣지 환경에 배포하는 경력무관 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-b2e3d09b066ab0ecce30961c', 'Superb AI', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '383995', 'https://inthiswork.com/archives/383995', '[R&D] Machine Learning Engineer (경력 무관)', '머신러닝 연구개발', 'NEW_GRAD_ELIGIBLE', '인디스워크 목록에서 신입/인턴·주니어 태그가 표시되고 공고 제목이 경력 무관으로 안내됨', 'FULL_TIME', '미정', 0, '["Python","PyTorch","Computer Vision","VLM","MLOps","Physical AI"]', NULL, 1, 'Vision AI·파운데이션 모델·MLOps·Physical AI를 연구하고 산업 솔루션으로 제품화하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-6b793cd2cb059ddf1bfd6839', 'Superb AI', 'STARTUP', 'AI 기술 스타트업으로 공개 소개됨', '인디스워크', '383947', 'https://inthiswork.com/archives/383947', '[R&D] Machine Learning Engineer (전문연구요원)', 'AI·머신러닝 연구개발', 'NEW_GRAD_ELIGIBLE', '전문연구요원 신규·전직 대상 공고이며 접수 기간이 채용 시 마감으로 표시됨', 'FULL_TIME', '서울', 0, '["Python","PyTorch","Computer Vision","MLOps","Physical AI"]', NULL, 1, '비전 AI·파운데이션 모델·MLOps·Physical AI 연구개발을 수행하는 전문연구요원 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-9f4282a35a8994cdba508655', '다우데이타', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '인디스워크', '384074', 'https://inthiswork.com/archives/384074', '[신입] Autodesk 솔루션 엔지니어 채용', 'IT 솔루션 엔지니어', 'NEW_GRAD_ONLY', '공고 제목이 신입이며 고용형태가 채용전제형 인턴으로 명시됨', 'CONVERSION_INTERN', '서울 마포구', 0, '["Autodesk","Revit","Inventor","Generative AI"]', '2026-08-24T23:59:00+09:00', 0, 'Autodesk 솔루션의 기술 요구사항 분석, 교육, 기술지원과 프로젝트 수행을 담당하는 전환형 인턴.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-6674b11f6c27ba1f4ef606cb', '다우데이타', 'MID', '공개 기업 정보 기준 중견 규모로 분류', '인디스워크', '384071', 'https://inthiswork.com/archives/384071', '[신입] IT 운영 담당자 채용', 'IT 운영·시스템', 'NEW_GRAD_ONLY', '공고 제목에 신입으로 명시되고 마감기한이 2026-08-24 23:59로 표시됨', 'FULL_TIME', '경기 용인시', 0, '["IT Operations","Server","Network","System"]', '2026-08-24T23:59:00+09:00', 0, '사내 IT 자산과 시스템 운영, 장애 대응 및 운영 프로세스를 담당하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-b74a0629d475dbac71453884', '메가존클라우드', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '인디스워크', '383944', 'https://inthiswork.com/archives/383944', 'Data Engineer Junior', '데이터 엔지니어링', 'NEW_GRAD_ELIGIBLE', '포지션 정보에 경력 범위가 신입부터 8년 미만까지로 명시됨', 'FULL_TIME', '경기 과천', 0, '["SQL","Python","Spark","Databricks","Snowflake","AWS Glue","Airflow"]', NULL, 0, '클라우드 데이터 수집·정제·적재 파이프라인과 AI 데이터 기반을 설계·개발하는 주니어 포지션.', 'DEADLINE_UNKNOWN', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-15d4525c2ce3db571fc50863', '오픈엣지테크놀로지', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '384040', 'https://inthiswork.com/archives/384040', '[NPU] Firmware Engineer (전문연구요원 가능)', 'NPU 펌웨어', 'NEW_GRAD_ELIGIBLE', '인디스워크 목록에서 신입/인턴 태그가 표시되고 공고에는 연차 필수조건 없이 관련 학사 이상 요건이 제시됨', 'FULL_TIME', '서울', 0, '["C","C++","Embedded","NPU","CUDA","RISC-V"]', NULL, 0, 'NPU 연산 커널과 임베디드 펌웨어를 개발하고 성능을 분석·최적화하는 포지션.', 'DEADLINE_UNKNOWN', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-01841638bff0b1d6a5f7ca2c', '인티그레이션(메디스트림)', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '인디스워크', '384351', 'https://inthiswork.com/archives/384351', '[클리닉 운영 플랫폼(ClinicOps)] 백엔드 엔지니어 인턴', '백엔드·데이터 플랫폼', 'NEW_GRAD_ONLY', '공고 제목이 백엔드 엔지니어 인턴이며 프로젝트 경험 중심 자격요건으로 확인됨', 'INTERN', '미정', 0, '["TypeScript","Node.js","Fastify","PostgreSQL","Redis","AWS","Kubernetes"]', NULL, 0, 'EMR·CRM 데이터 마이그레이션과 운영 백오피스를 개발하는 백엔드 엔지니어 인턴.', 'DEADLINE_UNKNOWN', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-22b99f8d5a617d1d6dc9ecdc', '한양증권', 'MID', '증권사 공개 기업 정보 기준 중견 규모로 분류', '인디스워크', '384123', 'https://inthiswork.com/archives/384123', '경영기획본부 디지털혁신부 직원 채용 (신입 지원 가능)', '금융 IT·사내시스템 개발', 'NEW_GRAD_ELIGIBLE', '공고 자격요건에 신입사원은 4년제 대학 졸업으로 별도 명시되고 2026-08-07부터 채용 시까지 접수', 'CONTRACT', '서울 영등포구', 0, '["Enterprise IT","System Development","Operations"]', NULL, 1, '증권사 본사 업무시스템을 운영하고 개선·개발하는 신입 지원 가능 IT 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00', '2026-08-13T15:03:45+09:00')
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
VALUES ('job-11ecc45db71b9aaf9e3347bc', 'Cake', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '자소설닷컴', '52843', 'https://jasoseol.com/recruit/52843', '[Cake] AI/ML 개발자 모집 (신입/경력)', 'AI·머신러닝', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 정보에 신입/경력 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["AI","Machine Learning"]', NULL, 1, 'AI·머신러닝 기반 제품과 기능을 개발하는 신입·경력 통합 채용 공고.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-7186d1f5c1141a48919c2067', 'Ericsson-LG', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '54826', 'https://jasoseol.com/recruit/54826', '5G R&D 소프트웨어 개발자 (Developer) 채용', '통신 소프트웨어', 'NEW_GRAD_ELIGIBLE', '모집 직군이 신입/경력으로 표시되고 채용 시 마감 공고로 확인됨', 'FULL_TIME', '미정', 0, '["5G","R&D"]', NULL, 1, '5G 이동통신 제품 연구개발과 소프트웨어 구현을 담당하는 개발자 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-55e0e53c38fae8fcc611545f', 'Ericsson-LG', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '65700', 'https://jasoseol.com/recruit/65700', '5G RAN R&D 소프트웨어 개발자 신입/경력', '무선통신 소프트웨어', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 정보에 신입/경력 지원 가능이 명시됨', 'FULL_TIME', '미정', 0, '["5G","RAN"]', NULL, 1, '5G 무선접속망 제품의 연구개발과 소프트웨어 개발을 담당하는 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-1c65ab344f97871d2dee7d62', 'Ericsson-LG', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '86227', 'https://jasoseol.com/recruit/86227', 'Packet Core R&D 소프트웨어 개발자 신입 및 경력사원 하반기 채용', '통신 코어 소프트웨어', 'NEW_GRAD_ELIGIBLE', '공고 제목과 모집 정보에 신입 및 경력 채용이 명시됨', 'FULL_TIME', '미정', 0, '["5G","Packet Core"]', NULL, 1, '5G 패킷 코어 영역의 연구개발과 소프트웨어 구현을 수행하는 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-25c7e476c88c391bf036a147', '백패커(아이디어스)', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '자소설닷컴', '66828', 'https://jasoseol.com/recruit/66828', 'iOS 개발자 (신입 ~ 경력 3년 미만)', 'iOS 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입부터 경력 3년 미만까지 지원 가능하다고 명시됨', 'FULL_TIME', '미정', 0, '["iOS"]', NULL, 1, '아이디어스 모바일 서비스의 iOS 기능을 개발하는 신입·주니어 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-57751b96c59aa3dfea1b4a25', '에이스아메리칸화재해상보험', 'FOREIGN', '공고의 법인명과 기업 소개에서 외국계 합작·글로벌 기업으로 확인', '자소설닷컴', '65011', 'https://jasoseol.com/recruit/65011', 'IT 개발자 모집 (신입)', '기업 IT 개발', 'NEW_GRAD_ONLY', '공고 제목과 지원 구분에 신입 채용이 명시됨', 'FULL_TIME', '미정', 0, '["Enterprise IT"]', NULL, 1, '보험 업무 시스템과 사내 IT 서비스를 개발·운영하는 신입 개발자 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-22a2bb911529855b5d836781', '엔피씨', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '자소설닷컴', '58573', 'https://jasoseol.com/recruit/58573', '연구소 신입/경력 개발자 모집', '웹·앱·IoT 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 연구소 개발자 신입/경력 모집이 명시됨', 'FULL_TIME', '미정', 0, '["Web","App","IoT"]', NULL, 1, '웹·앱 프로그램과 스마트 물류·IoT 관련 시스템을 개발하는 연구소 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-7c3564d766900764b0f15501', '스콘에이아이', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '잡코리아', '49495962', 'https://m.jobkorea.co.kr/Recruit/GI_Read/49495962', 'AI 통역 서비스 프론트엔드 개발자 채용(신입 및 경력)', '프론트엔드·AI 서비스', 'NEW_GRAD_ELIGIBLE', '공고 제목과 경력 조건에 신입 및 경력 지원 가능이 명시됨', 'CONTRACT_TO_FULL_TIME', '서울', 0, '["Frontend","AI"]', NULL, 1, 'AI 통역 서비스의 웹 프론트엔드와 사용자 기능을 개발하는 신입·경력 통합 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-f7d29644e488a7bdb96bd822', '에스에이치랩(SHLab)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '잡코리아', '49580624', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49580624', 'AI·임베디드·IoT 신입/경력 사원 모집', 'AI·임베디드·IoT', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/경력 모집이 명시되고 기업 채용 페이지에서 채용중으로 표시됨', 'FULL_TIME', '서울', 0, '["AI","Embedded","IoT"]', NULL, 1, 'AI와 임베디드·IoT 기술을 활용한 제품·서비스 개발을 담당하는 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-cdcd855f103a68d4b18f1166', '에스에이치랩(SHLab)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '잡코리아', '49366713', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49366713', 'C#·파이썬 소프트웨어 개발자 모집', '응용 소프트웨어 개발', 'NEW_GRAD_ELIGIBLE', '기업 채용 페이지에서 현재 모집중인 소프트웨어 개발 공고로 확인되고 신입 지원 가능 범주에 노출됨', 'FULL_TIME', '서울', 0, '["C#","Python"]', NULL, 1, 'C#과 Python을 활용해 응용 소프트웨어와 서비스 기능을 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-b772e5643980a446275c7b5a', '에스에이치랩(SHLab)', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '잡코리아', '49431728', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49431728', '웹/소프트웨어 개발자 신입/경력 모집', '웹·소프트웨어 개발', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입/경력 지원 가능이 명시되고 기업 채용 페이지에서 채용중으로 표시됨', 'FULL_TIME', '서울', 0, '["Web","Software"]', NULL, 1, '웹 애플리케이션과 업무 소프트웨어를 개발하는 신입·경력 통합 채용.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-96cda262a73d7d24922167e9', '나무기술', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '점핏', '54486073', 'https://jumpit.saramin.co.kr/position/54486073', '[신입] Citrix 네트워크 엔지니어', '네트워크 엔지니어', 'NEW_GRAD_ONLY', '경력 항목과 자격요건에 신입·경력무관이 명시됨', 'FULL_TIME', '서울 강서구', 0, '["VPN","L7","Citrix Gateway","TCP/IP"]', '2026-08-14T23:59:59+09:00', 0, 'Citrix 네트워크 제품 구축 프로젝트와 L7·게이트웨이 기술지원을 담당하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-bf2413afda23e641340c417f', '비스텔리젼스', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '점핏', '54556241', 'https://jumpit.saramin.co.kr/position/54556241', 'AI Engineer (신입)', 'AI 에이전트 개발', 'NEW_GRAD_ONLY', '경력 항목에 신입이 명시됨', 'FULL_TIME', '서울 서초구', 0, '["Git","NumPy","Pandas","Python","SQL","RAG","LangChain"]', '2026-08-22T23:59:59+09:00', 0, 'Python·RAG·에이전트 프레임워크를 활용해 제조 분야 AI 에이전트와 응용 서비스를 개발하는 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-7be6eb856fa0f3bf9e6df455', '비에이치에스티', 'UNCLASSIFIED', '공개 공고에서 기업 규모를 확정할 근거를 확인하지 못해 UNCLASSIFIED로 유지', '점핏', '54485299', 'https://jumpit.saramin.co.kr/position/54485299', '설비 펌웨어 개발 엔지니어(신입)', '펌웨어·장비 소프트웨어', 'NEW_GRAD_ONLY', '경력 항목에 신입이 명시됨', 'FULL_TIME', '충남 아산시', 0, '["C","C++","C#","Embedded","MFC"]', '2026-08-16T23:59:59+09:00', 0, '반도체·디스플레이 장비의 펌웨어, Windows 애플리케이션, 제어 로직을 개발하는 신입 포지션.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
VALUES ('job-bcf76b4bc65a01015ef37c1d', '지니수', 'STARTUP', '공고의 기업 소개 또는 투자 단계 설명에서 스타트업으로 확인', '점핏', '54503227', 'https://jumpit.saramin.co.kr/position/54503227', '[인턴] 프롭테크 플랫폼 서비스 개발', '프롭테크 풀스택 개발', 'NEW_GRAD_ONLY', '경력 항목에 신입이 명시되고 정규직 전환형 개발 인턴으로 안내됨', 'CONVERSION_INTERN', '대전 유성구', 0, '["Next.js","TypeScript","Zustand","Tailwind CSS","Supabase","GitHub"]', '2026-08-18T23:59:59+09:00', 0, 'Next.js·TypeScript·Supabase 기반 프롭테크 서비스를 리팩터링하고 신규 기능을 개발하는 전환형 인턴.', 'ACTIVE', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z', '2026-08-13T15:03:45+09:00', '2026-08-12T12:37:42Z')
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
INSERT OR IGNORE INTO import_batches
  (id, kind, checksum, original_count, rejected_count, created_at)
VALUES
  ('catalog-jobs-20260813', 'jobs', 'd410700737d845d6226ab79e0d71a2822ee50d15282f5ae6befd9f15f8065d7e', 120, 0, '2026-08-13T15:03:45+09:00');
--> statement-breakpoint
PRAGMA optimize;
