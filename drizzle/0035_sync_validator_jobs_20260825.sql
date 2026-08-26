UPDATE jobs
SET last_verified_at = '2026-08-25T12:12:35.000Z', status = 'EXPIRED', updated_at = '2026-08-25T12:12:35.000Z'
WHERE id = 'job-cea1ba1532476101d85d44d8'
  AND source_url = 'https://jasoseol.com/recruit/105528'
  AND last_verified_at = '2026-08-23T21:12:40.000Z'
  AND status = 'ACTIVE'
  AND updated_at = '2026-08-23T21:12:40.000Z';
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-25T12:04:39.000Z', summary = '게임 UI를 구현하는 신입 정규직으로 공식 지원 페이지는 열려 있으나 현재 확인 가능한 마감일·상시 문구가 없어 마감일 미정으로 구분했다.', updated_at = '2026-08-25T12:04:39.000Z'
WHERE id = 'job-856b65c06063f216d97cfb80'
  AND source_url = 'https://starpixie.studio/recruit/ui-content-programmer'
  AND last_verified_at = '2026-08-21T02:51:23.000Z'
  AND summary = '게임 UI를 구현하는 신입 정규직으로 현재 공식 지원 링크는 열려 있으나 별도 마감일 또는 상시 문구가 없어 마감일 미정으로 구분했다.'
  AND updated_at = '2026-08-21T02:51:23.000Z';
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-25T12:15:12Z', status = 'EXPIRED', updated_at = '2026-08-25T12:15:12Z'
WHERE id = 'job-b63f6d92de595b8a56216da2'
  AND source_url = 'https://www.jobkorea.co.kr/Recruit/GI_Read/49799973'
  AND last_verified_at = '2026-08-24T14:34:04.000Z'
  AND status = 'ACTIVE'
  AND updated_at = '2026-08-24T14:34:04.000Z';
--> statement-breakpoint
UPDATE jobs
SET deadline_at = '2026-10-20T14:59:00.000Z', last_verified_at = '2026-08-25T12:04:39.000Z', rolling = 0, updated_at = '2026-08-25T12:04:39.000Z'
WHERE id = 'job-292d372adafc184df16346ee'
  AND source_url = 'https://www.rocketpunch.com/jobs/156011'
  AND deadline_at IS NULL
  AND last_verified_at = '2026-08-20T00:52:55.000Z'
  AND rolling = 1
  AND updated_at = '2026-08-20T00:52:55.000Z';
--> statement-breakpoint
UPDATE jobs
SET deadline_at = NULL, last_verified_at = '2026-08-25T12:15:12Z', rolling = 1, updated_at = '2026-08-25T12:15:12Z'
WHERE id = 'job-e124115602975a1b56282e3d'
  AND source_url = 'https://www.jobkorea.co.kr/Recruit/GI_Read/49819763'
  AND deadline_at = '2026-10-19T14:59:59.000Z'
  AND last_verified_at = '2026-08-24T14:34:04.000Z'
  AND rolling = 0
  AND updated_at = '2026-08-24T14:34:04.000Z';
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-14ed8e261f8c11978fc0f585', '㈜비아이매트릭스', 'SMALL', '잡코리아 현재 기업정보에 51~300명 규모의 중소기업으로 표시된다.', 'JobKorea', '49843194', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49843194', '2026년 비아이매트릭스 하반기 신입 채용', 'SOFTWARE_DEVELOPMENT', 'NEW_GRAD_ONLY', '현재 공고가 신입 채용이며 졸업예정자 지원 가능 조건을 표시한다.', 'FULL_TIME', '서울 강남구', 0, '[]', NULL, '2026-08-23T15:00:00.000Z', '2026-09-24T14:59:59.000Z', 0, '비아이매트릭스 하반기 신입 채용의 개발 직무로 현재 모집기간과 지원 경로가 유효하다.', 'ACTIVE', '151675150f1035f568fe3086aa0807b261553d27c4016fb702a4c525db000c1e', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-10a83b5429f848785bbb829a', '㈜이노디스', 'SMALL', '잡코리아 현재 기업정보에서 50명 이하 중소기업으로 확인된다.', 'JobKorea', '49666437', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49666437', '[이노디스] 웹개발 신입 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에서 신입 모집을 확인했다.', 'FULL_TIME', '서울 송파구', 0, '[]', NULL, '2026-07-27T15:00:00.000Z', '2026-08-27T14:59:59.000Z', 0, '웹개발 신입 정규직을 모집하며 현재 잡코리아 지원 경로와 모집기간이 유효하다.', 'ACTIVE', 'e1359535e01d92965a238ee8bc07610e43aa605226433be1ea4375a35cf41557', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-af155fb882d36114570fdc03', 'EY한영', 'FOREIGN', '글로벌 회계·컨설팅 네트워크의 한국 법인 공고로 외국계로 분류함.', 'Inthiswork', '388855', 'https://inthiswork.com/archives/388855', 'Data Architect & Engineering 인턴', 'DATA_ENGINEERING', 'NEW_GRAD_ONLY', '현재 상세가 4년제 졸업자·졸업예정자 대상 3개월 인턴을 명시하며 필수 근로 경력은 없다.', 'INTERNSHIP', '서울', 0, '["SQL","Airflow","dbt","Data Pipeline"]', NULL, NULL, '2026-08-30T14:59:00.000Z', 0, 'SQL·Airflow·dbt 기반 데이터 파이프라인 업무를 수행하는 3개월 인턴 공고다.', 'ACTIVE', 'c3ce6b39148b2539a5c1aab8a3bef3b9b70a9281441e1e9cb5f04d05249c92b0', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-053177243bc041c512635e03', 'KRAFTON', 'LARGE', '글로벌 게임사 KRAFTON 공식 ATS 공고', 'KRAFTON Greenhouse', '8729078002', 'https://job-boards.greenhouse.io/krafton/jobs/8729078002', '[Game Research & Insights Dept.] Jr. 시선 데이터 분석 연구원 (경력무관 / 인턴)', 'DATA_ANALYTICS', 'NEW_GRAD_ELIGIBLE', '경력무관 인턴으로 분석 역량을 요구하며 필수 근로 경력 연수는 없다.', 'INTERNSHIP', '서울', 0, '["Python","R","Machine Learning","Computer Vision"]', NULL, NULL, NULL, 1, '게임 사용자 시선 데이터를 분석하는 6개월 인턴으로 공식 공고에 상시채용·채용 완료 시 조기마감이 명시된다.', 'ACTIVE', 'c5284dd53738e010061bcbd0ac6bf2ebbec48a7e883008858b21db59c435404c', '2026-08-25T12:15:12.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-28532ab0d580b3b16607dd5e', 'KT', 'LARGE', 'KT 공식 대졸신입 채용', 'Jasoseol', '105776', 'https://jasoseol.com/recruit/105776', '2026년 대졸신입 채용 - NW 인프라운용', 'IT_INFRASTRUCTURE', 'NEW_GRAD_ONLY', '자소설닷컴 신입 모집과 KT 공식 채용 상세에서 현재 지원 가능 상태를 확인했다.', 'FULL_TIME', '대한민국', 0, '["Network","Infrastructure"]', NULL, '2026-08-24T16:00:00.000Z', '2026-09-06T22:00:00.000Z', 0, 'KT 2026년 대졸신입 채용의 네트워크 인프라 운영 직무다.', 'ACTIVE', '26aa37b7a89738e5db19a3cd38edc0ffbc22b89f917797d2f7d54feff4185419', '2026-08-25T12:15:12.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-54e8787caab2d8ca537595df', 'TNH', 'UNCLASSIFIED', '현재 점핏 상세만으로 회사 규모를 확정할 충분한 근거를 수집하지 못함.', 'Jumpit', '54813669', 'https://jumpit.saramin.co.kr/position/54813669', '백엔드 개발자 (신입)', 'BACKEND', 'NEW_GRAD_ONLY', '점핏 현재 상세의 경력 항목에 신입이 명시되고 별도 필수 경력 연수는 없다.', 'UNCONFIRMED', '경기 성남시 분당구', 0, '["Node.js","TypeScript","PostgreSQL"]', NULL, NULL, '2026-09-19T14:59:59.000Z', 0, '서비스 백엔드를 개발하는 신입 공고로 현재 점핏 지원 경로가 열려 있다.', 'ACTIVE', 'b6bb1b0eb172fbb69edd5aff0f5455e5f47f9da2fd13b80ae1a622d15aaae83f', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ba33033724e754dc37bbadb2', 'The·K한국교직원공제회', 'PUBLIC', '공공기관 신입 공고', '한국교직원공제회 채용', '22909', 'https://ktcu.applyin.co.kr/jobs/22909', '2026년도 신입직원 채용공고 - IT(금융개발)', 'FINANCIAL_IT', 'NEW_GRAD_ONLY', '신입직원 채용이며 IT(금융개발) 2명을 별도 모집한다. 정보보안 모집단위는 제외했다.', 'FULL_TIME', '서울', 0, '["Financial IT","Software Development"]', NULL, '2026-08-23T15:00:00.000Z', '2026-09-11T07:00:00.000Z', 0, '한국교직원공제회 신입채용 중 IT 금융개발 모집 단위만 포함했다.', 'ACTIVE', 'f18bc640cba1d9038484ca00264ea2bc056297466b7b8cb8f39c8e8d95d48164', '2026-08-25T12:15:12.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-93cc868d1cb03d66e9fc19f4', '넥슨컴퍼니', 'LARGE', '넥슨컴퍼니 대기업 채용 공고', 'NEXON Careers', '10221', 'https://careers.nexon.com/recruit/10221', '2026 넥토리얼 for Game Programmer', 'GAME_DEVELOPMENT', 'NEW_GRAD_ONLY', '신입·졸업예정자 대상 6개월 채용연계형 인턴으로 확인했다.', 'INTERN_TO_FULL_TIME', '대한민국', 0, '["C++","C#","Unity","Unreal Engine","MySQL"]', NULL, '2026-08-24T15:00:00.000Z', '2026-09-07T07:00:00.000Z', 0, '게임 클라이언트·서버·엔진 개발을 모집하는 6개월 채용연계형 넥토리얼 인턴 공고다.', 'ACTIVE', 'f2c92b740e4ae66a39a306cc939ae876c0c01520883d2a7fc46d42ccbeb3f4d9', '2026-08-25T12:15:12.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-7c22f7b16cb81e8b068c5b5e', '노타(Nota)', 'STARTUP', '현재 공고와 회사 소개를 근거로 AI 스타트업으로 분류했다.', 'Nota Careers', '234147', 'https://career.nota.ai/ko/o/234147', '[Solution] AI Data Engineer Intern (체험형)', 'AI_DATA_ENGINEERING', 'NEW_GRAD_ONLY', '인턴 모집이며 별도 필수 근로 경력 연수가 확인되지 않았다.', 'INTERNSHIP', '서울 강남구', 0, '["Python","Data Engineering","AI"]', NULL, NULL, NULL, 1, 'AI 데이터 엔지니어링 업무를 수행하는 체험형 인턴 공고다.', 'ACTIVE', '0e5cfb02f9f8013aa98421fbe1820ef4093dd4e8ef883d27092a71defcc4b263', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b353cdc8d0f6e50406bf6b32', '노타(Nota)', 'STARTUP', '현재 공고의 회사 소개가 노타를 국내 AI 스타트업으로 소개한다.', 'Wanted', '341292', 'https://www.wanted.co.kr/wd/341292', '[인턴] [Solution] AI Software Engineer', 'AI_SOFTWARE', 'NEW_GRAD_ONLY', '신입·인턴 포지션이며 필수 근로 경력 연수 없이 기술 역량을 요구한다.', 'INTERN_TO_FULL_TIME', '서울 강남구', 0, '["Python","Linux","PyTorch","ONNX","TensorRT","vLLM","VLM"]', NULL, NULL, NULL, 1, 'AI 솔루션 소프트웨어를 개발하는 인턴으로 현재 원티드 상세와 공식 지원 경로가 열려 있다.', 'ACTIVE', 'fc514259cf529ac2b97fd6d16d75eabcc6bc65a3fac8466576f17478bf1a8390', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-dc745920200369562102d779', '뉴로코어', 'SMALL', '리멤버 현재 기업정보가 1~50명으로 표시함.', 'Remember Career', '335774', 'https://career.rememberapp.co.kr/job/posting/335774', 'Python Backend Engineer (신입)', 'BACKEND', 'NEW_GRAD_ONLY', '공고 제목이 신입이고 현재 상세가 경력무관으로 표시한다.', 'UNCONFIRMED', '서울 강남구', 0, '["Python"]', NULL, NULL, NULL, 1, 'Python 백엔드 신입을 모집하는 채용 시 마감 공고로 현재 리멤버 간편 지원이 가능하다.', 'ACTIVE', 'f67317c8e827273c4d4e6914c344e7344636b62d444b9ee6d81e62be6be108c4', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-8b8ea8810591e289a28be80b', '레드블루', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Wanted', '375632', 'https://www.wanted.co.kr/wd/375632', '[바디코디] Backend Engineer (신입·주니어)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '신입 또는 백엔드 경력 3년 이하 지원 가능이며 실무경력이 없어도 프로젝트·인턴·교육 경험으로 지원할 수 있다.', 'UNCONFIRMED', '서울 서초구', 0, '["Java","Kotlin","Spring Boot","MySQL","Redis","AWS","SQS","SNS"]', NULL, NULL, NULL, 1, '바디코디 서비스의 백엔드 기능을 개발하는 신입·주니어 공고다.', 'ACTIVE', '054412486bbfa66951b6b5f97baa3fed87ae989eda82aa03d2ce7c4e598ccad8', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ea9e8a12b33aac8455b1ba69', '모플', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Wanted', '371152', 'https://www.wanted.co.kr/wd/371152', '[인턴] AI 수요예측 서비스 Software Engineer', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '인턴 포지션이며 필수 근로 경력 1년 이상 요건이 확인되지 않았다.', 'INTERN_TO_FULL_TIME', '서울 서초구', 0, '[]', NULL, NULL, NULL, 1, 'AI 수요예측 서비스의 소프트웨어 개발에 참여하는 전환형 인턴 공고다.', 'ACTIVE', '5cc1245d54c20d8ab276bd6b8f57dda5d011da14d8b75009d6f57c00f5db1515', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-30787b903290914609b066b2', '미래에셋자산운용', 'LARGE', '미래에셋 계열 금융사 공식 채용 페이지를 근거로 대기업 규모로 분류함.', 'Mirae Asset Careers', 'HGxXbnaC', 'https://career.miraeasset.com/job_posting/HGxXbnaC', 'OMS 개발 채용연계형 인턴', 'FINANCIAL_IT', 'NEW_GRAD_ONLY', '공식 지원 페이지가 인턴 모집으로 표시되고 별도 필수 근로 경력 연수를 요구하지 않는다.', 'INTERN_TO_FULL_TIME', '서울 종로구', 0, '["Software Development"]', NULL, NULL, '2026-09-02T14:59:59.000Z', 0, '자산운용 OMS 개발 업무를 수행하는 채용연계형 인턴 공고로 공식 지원 페이지가 현재 열려 있다.', 'ACTIVE', '0305d95e72d5e977ac2dd6d3088d98ba331f36c216a543d8ea6c445a0f8121ca', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b75a8d19a9e1d445fae3497f', '버즈빌', 'STARTUP', '리멤버 현재 기업정보에 Series B·51~300명으로 표시되어 스타트업으로 분류함.', 'Remember Career', '334344', 'https://career.rememberapp.co.kr/job/posting/334344', 'Backend Engineer', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '현재 상세가 경력무관·학력무관으로 표시하고 별도 필수 경력 연수 없이 지원 가능하다.', 'UNCONFIRMED', '서울 송파구', 0, '["Kotlin","Go","Python"]', NULL, NULL, NULL, 1, 'Kotlin·Go·Python 기반 백엔드 엔지니어를 모집하는 경력무관 채용 시 마감 공고다.', 'ACTIVE', '315cbbb84cb25360bbd6a4b9e18e22b9037650048caacb7f970380902fdc04f2', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e7d8c102efeef115d2a28f85', '보스반도체', 'STARTUP', '현재 채용 상세의 팹리스 기업 소개를 근거로 스타트업으로 분류함.', 'Jumpit', '54709573', 'https://jumpit.saramin.co.kr/position/54709573', 'ML Systems Runtime Engineer [신입/병특]', 'SYSTEM_SOFTWARE', 'NEW_GRAD_ONLY', '공고 제목과 현재 점핏 상세에 신입 및 졸업예정자 지원 경로가 명시된다.', 'UNCONFIRMED', '경기 성남시 분당구', 0, '["C","C++","NPU","Linux"]', NULL, NULL, '2026-09-09T14:59:59.000Z', 0, 'NPU 런타임·드라이버·커널 등 AI 가속 시스템 소프트웨어를 개발하는 신입 공고다.', 'ACTIVE', 'fe06123a825b64cde6fd4fd02f586b129f16a3148088c148168c2ae75756cf21', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-0eda73f5384c142344a2461f', '비큐에이아이', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Wanted', '369323', 'https://www.wanted.co.kr/wd/369323', '[인턴] AI개발자', 'AI_ENGINEERING', 'NEW_GRAD_ONLY', '졸업자·졸업예정자를 대상으로 한 인턴이며 필수 근로 경력 연수는 없다.', 'INTERN_TO_FULL_TIME', '서울 중구', 0, '["Python","FastAPI","MSSQL","PostgreSQL"]', NULL, NULL, NULL, 1, 'AI 개발 업무를 수행하는 6개월 정규직 전환형 인턴 공고다.', 'ACTIVE', '560629141daed9af00dec145961b70f30960d12de73a1dbf1abc3bf2237fb389', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-eda3ed9c8f9a7426b18bc229', '슈퍼센트', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Supercent Careers', '170938', 'https://supercent.career.greetinghr.com/ko/o/170938', '[대규모 채용] 메타옵스 클라이언트 개발자(전환형 인턴)', 'GAME_CLIENT', 'NEW_GRAD_ONLY', '졸업자·졸업예정자가 지원 가능한 전환형 인턴으로 확인했다.', 'INTERN_TO_FULL_TIME', '서울 송파구', 0, '["C#","Unity3D"]', NULL, '2026-08-24T15:00:00.000Z', '2026-09-07T14:59:00.000Z', 0, '메타옵스 게임 클라이언트 개발을 수행하는 정규직 전환형 인턴 공고다.', 'ACTIVE', '808bbcfb184db719e50352a3feff8c88da3b386fa87b44e9a671c63eb863e7ea', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d8d68779ea9f5528f3e5a60d', '슈퍼센트', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Supercent Careers', '170970', 'https://supercent.career.greetinghr.com/ko/o/170970', '게임 클라이언트 개발자(신입)', 'GAME_CLIENT', 'NEW_GRAD_ONLY', '현재 상세가 신입 채용으로 표시되며 별도 필수 근로 경력 연수는 없다.', 'UNCONFIRMED', '서울 송파구', 0, '["C#","Unity3D"]', NULL, '2026-08-24T15:00:00.000Z', '2026-09-07T14:59:00.000Z', 0, '게임 클라이언트를 개발하는 신입 채용 공고다.', 'ACTIVE', 'b47411fb0c5fbf1023c4567887882103a2e295c01b40500063ee947e91e41634', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-324497f595af7c061930ba2a', '슈퍼센트', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Supercent Careers', '171008', 'https://supercent.career.greetinghr.com/ko/o/171008', '게임 클라이언트 개발자(전환형 인턴)', 'GAME_CLIENT', 'NEW_GRAD_ONLY', '졸업자·졸업예정자가 지원 가능한 전환형 인턴으로 확인했다.', 'INTERN_TO_FULL_TIME', '서울 송파구', 0, '["C#","Unity3D"]', NULL, '2026-08-24T15:00:00.000Z', '2026-09-07T14:59:00.000Z', 0, '게임 클라이언트를 개발하는 정규직 전환형 인턴 공고다.', 'ACTIVE', 'ac457b95f47cd004a406155fd2afd15eaf594127ddccf511ba5ec860b4f0aec7', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d28220485c582ac52228cd7a', '슈퍼센트', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Supercent Careers', '170915', 'https://supercent.career.greetinghr.com/ko/o/170915', '플랫폼 개발자(전환형 인턴)', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '졸업자·졸업예정자가 지원 가능한 전환형 인턴으로 확인했다.', 'INTERN_TO_FULL_TIME', '서울 송파구', 0, '["C#","Unity3D","HTML5"]', NULL, '2026-08-24T15:00:00.000Z', '2026-09-07T14:59:00.000Z', 0, '게임·서비스 플랫폼 개발에 참여하는 정규직 전환형 인턴 공고다.', 'ACTIVE', 'dcdb6ac004513fc7d0f03dbb17f21902bf5130df45374d8f25f913fc006ebfb7', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-6423005bcc22bbb91481f17f', '심넷', 'UNCLASSIFIED', '현재 상세만으로 CareerGround 회사 규모를 확정할 직접 근거를 수집하지 못함.', 'Saramin', '54808213', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54808213', 'IT·데이터 분석 신입', 'DATA_ANALYTICS', 'NEW_GRAD_ONLY', '현재 사람인 상세가 경력 신입·대졸 이상을 명시하고 경력 연수는 요구하지 않는다.', 'FULL_TIME', '서울 용산', 0, '["Python","Java","SQL"]', NULL, '2026-08-21T01:00:00.000Z', '2026-09-20T14:59:00.000Z', 0, 'IT·데이터 분석 업무를 수행하는 신입 정규직 공고로 현재 사람인 지원이 가능하다.', 'ACTIVE', '677dc3851d9c077c432c123c48bda1e8f3a6df1d323516e6e041b6e95a69d06d', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-724c71a22e12a309a54d80d8', '아이쓰리시스템', 'UNCLASSIFIED', '이번 실행의 공개 상세만으로 회사 규모 분류를 확정하지 않음', 'JobKorea', '49827531', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49827531', 'SW 개발자 채용 (신입/경력)', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '신입과 경력 트랙이 함께 표시되며 현재 모집기간이 남아 있다.', 'FULL_TIME', '대전', 0, '["Software Development","DevOps","Frontend"]', NULL, '2026-08-23T15:00:00.000Z', '2026-09-13T14:59:59.000Z', 0, 'SW 개발자를 신입·경력으로 모집하는 현재 진행 중 공고다.', 'ACTIVE', 'f5d0c520f26e78800d40f38b2aed537549dc94524e7a22f974e387c48912a980', '2026-08-25T12:15:12.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d326b7faf737a8bbe38efd4e', '위미르', 'SMALL', '현재 사람인 기업정보에서 소규모 기업으로 확인됨.', 'Saramin', '54488548', 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=54488548', '백엔드 개발자 신입', 'BACKEND', 'NEW_GRAD_ONLY', '현재 사람인 상세에 신입, 대졸 이상 및 졸업예정자 지원 가능이 명시되고 필수 근로 경력 연수는 없다.', 'FULL_TIME', '경남 창원', 0, '["Java","JPA","Spring Boot","MariaDB"]', NULL, '2026-07-16T07:00:00.000Z', '2026-09-14T14:59:00.000Z', 0, 'Java·Spring Boot 기반 백엔드 개발 신입 정규직 공고로 2026-09-14 23:59(KST)까지 지원 가능하다.', 'ACTIVE', '4f53bd14b7323f839309f5231dabd6a03ba17982aba4e3b04e1f0f6145bb6989', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ccb46e45a7ad4161d62072de', '으뜸', 'UNCLASSIFIED', '현재 인크루트 상세만으로 회사 규모를 확정할 직접 근거를 수집하지 못함.', 'Incruit', '2608200000293', 'https://lab.incruit.com/jobs/2608200000293', '응용 소프트웨어 개발', 'ROBOTICS_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '현재 인크루트 상세가 경력무관으로 표시하고 별도 필수 근로 경력 연수를 요구하지 않는다.', 'CONTRACT', '경기 부천시', 0, '["AI Agent","Simulation","Automation"]', NULL, '2026-08-17T15:00:00.000Z', '2026-09-18T14:59:00.000Z', 0, '로봇 모션 시스템 모델·시뮬레이션·자동화 및 AI Agent 관련 응용 소프트웨어를 개발하는 경력무관 계약직 공고다.', 'ACTIVE', '3139c39d71ab33ddf7827b307fffb0a8ff9d7c729d5d7ef92ea274ff18bfbbef', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-85ed6d0b485367c6b8f692cf', '제네시스네스트', 'SMALL', '리멤버 현재 기업정보가 51~300명 규모로 표시함.', 'Remember Career', '330737', 'https://career.rememberapp.co.kr/job/posting/330737', '프론트엔드 개발자', 'FRONTEND', 'NEW_GRAD_ELIGIBLE', '현재 상세가 경력무관으로 표시하고 1년 경험은 우대사항으로 제시되어 필수 경력으로 보지 않는다.', 'UNCONFIRMED', '경기 용인시 수지구', 0, '["React","Vue","Angular"]', NULL, NULL, '2026-08-31T14:59:59.000Z', 0, '프론트엔드 개발자를 모집하는 경력무관 공고로 현재 리멤버 간편 지원이 가능하다.', 'ACTIVE', '54a2d95e7cf596469bed201d8db8d30376b608900c03e437b231b99e206ac264', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-a4e8c7b60e998dac2674136d', '채널코퍼레이션', 'STARTUP', '리멤버 현재 기업정보에 Series C·51~300명으로 표시되어 스타트업으로 분류함.', 'Remember Career', '321069', 'https://career.rememberapp.co.kr/job/posting/321069', 'Applied AI Engineer', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '현재 상세가 경력무관으로 표시하며 필수 근로 경력 연수를 별도로 요구하지 않는다.', 'UNCONFIRMED', '서울 강남구', 0, '["AI","LLM"]', NULL, NULL, '2026-08-28T14:59:59.000Z', 0, '제품에 AI 기능을 적용하는 Applied AI Engineer 경력무관 공고로 현재 리멤버 간편 지원이 가능하다.', 'ACTIVE', '69217de6cd0406ce91b629b927ad5f1b9b50fd380a78a112e02cc817418f28ab', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ff4bcad4ecf6da5dfd36c2ec', '컷백(Cutback)', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Wanted', '324408', 'https://www.wanted.co.kr/wd/324408', '[인턴] AI Engineer', 'AI_ENGINEERING', 'NEW_GRAD_ONLY', '인턴 포지션이며 필수 근로 경력 1년 이상 요건이 확인되지 않았다.', 'INTERN_TO_FULL_TIME', '서울 강남구', 0, '["LLM","Multimodal AI","Data Engineering"]', NULL, NULL, NULL, 1, 'AI 기능과 데이터 처리 업무에 참여하는 인턴 공고다.', 'ACTIVE', '604b1fddd36b9154ee8f5cd28c76e84ff01b7a6078ed1c87a5e88dd833ee1403', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-7c651d33e050b16674f8e845', '케이존', 'UNCLASSIFIED', '현재 상세에서 CareerGround 회사 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Wanted', '381213', 'https://www.wanted.co.kr/wd/381213', 'Backend Engineer (신입~3년차)', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '현재 상세가 경력 신입~3년 또는 이에 준하는 역량을 지원 조건으로 명시한다.', 'UNCONFIRMED', '경기 성남시', 0, '["Spring","Kotlin","PostgreSQL","Redis","Elasticsearch","EKS","AWS SQS"]', NULL, NULL, NULL, 1, '서비스 백엔드를 개발하는 신입~3년차 대상 공고다.', 'ACTIVE', '019d0bbc9ee408faaaa788fc7ac4bc1e2a2c4e3ce4aa3de3d91b914bcaf69c28', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-3e4768b139030d5106c377b2', '코싸인온㈜', 'SMALL', '잡코리아 기업정보에서 50명 이하 규모의 중소기업으로 표시된다.', 'JobKorea', '49583445', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49583445', 'Software Infrastructure Engineer 모집', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '현재 상세에서 신입과 졸업예정자 지원 가능 조건을 확인했다.', 'FULL_TIME_OR_CONTRACT', '경기 하남시', 0, '["Rust"]', NULL, '2026-07-13T15:00:00.000Z', '2026-08-31T14:59:59.000Z', 0, '소프트웨어 인프라 엔지니어를 모집하는 신입 지원 가능 공고다.', 'ACTIVE', '966cee227555dd3695042f12a91981e34c402c7685a31df8e146169ea00d2955', '2026-08-25T12:05:55.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-c240476cc7fa5e1d56dacd9f', '하이퍼엑셀', 'STARTUP', '리멤버 현재 기업정보에 Series A·51~300명으로 표시되어 스타트업으로 분류함.', 'Remember Career', '335828', 'https://career.rememberapp.co.kr/job/posting/335828', 'Device Driver Engineer (신입/경력)', 'SYSTEM_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '현재 상세가 경력무관으로 표시하고 드라이버 관련 3년 경험은 우대사항으로 제시되어 자동 제외하지 않는다.', 'UNCONFIRMED', '서울 서초구', 0, '["C","C++","Linux","Device Driver"]', NULL, NULL, '2026-09-23T14:59:59.000Z', 0, 'AI 반도체 환경의 디바이스 드라이버·시스템 소프트웨어를 개발하는 신입·경력 공고다.', 'ACTIVE', '4c0deb51ffa1625a53f460c76ec9e55960db1650d79ce8db916579b1c1dec703', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-cdf95b1fad4e393fe562d3d2', '한국산업단지공단', 'PUBLIC', '공공기관 NCS·JOB-ALIO 교차검증', 'NCS 공정채용', '20260821100437', 'https://www.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20260821100437', '2026년 하반기 신입직원 및 경력직원 채용 - 컴퓨터·정보(4급 신입-일반)', 'PUBLIC_ICT', 'NEW_GRAD_ONLY', 'NCS에서 컴퓨터·정보(4급 신입-일반) 모집 단위를 확인했고 JOB-ALIO의 동일 공고와 교차검증했다.', 'FULL_TIME', '대한민국', 0, '["Information Technology","Software","Information Systems"]', NULL, '2026-08-19T15:00:00.000Z', '2026-09-03T14:59:59.000Z', 0, '한국산업단지공단 하반기 채용 중 컴퓨터·정보 4급 신입 모집 단위다.', 'ACTIVE', '0bb9ec5f772a4897dffdfd72b082d62b41bb2aba602a54f7407903b61345ccaa', '2026-08-25T12:15:12.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-28fc242e85989bf5a513521a', '한화비전', 'LARGE', '한화 계열 공식 채용 페이지의 공고로 대기업으로 분류함.', 'Hanwha Vision Careers', 'zyigl8iW', 'https://hanwhavision.ninehire.site/job_posting/zyigl8iW', 'AI 연구원', 'AI_ML', 'NEW_GRAD_ELIGIBLE', '공식 지원 페이지가 경력 무관으로 표시하고 별도 필수 근로 경력 연수를 두지 않는다.', 'FULL_TIME', '경기 성남시', 0, '["VLM","LLM","Computer Vision","Machine Learning"]', NULL, NULL, NULL, 1, 'VLM·LLM·컴퓨터비전 기반 AI 연구를 수행하는 경력무관 정규직 상시채용 공고다.', 'ACTIVE', '485f71a4092ecb26563d5538ea8cd2763da66aa80d86a44bd2e88ed095bb5c2a', '2026-08-25T11:57:25.000Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z', '2026-08-25T13:28:34.927Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260825-validator-confirmed', 'jobs', '7e913c674f3d5d358c6cdef78703f1f9f91a68122c4fd52fbcb457c2092e3754', 'COMMITTED', 38, 27,
   '{"baselineRows":135,"matchedExistingRows":135,"newSourceRows":60,"addedActiveRows":33,"excludedNewNonActiveRows":27,"excludedStaleActiveRows":0,"conflictRows":0,"updatedExistingRows":5,"auditRowsNotLive":3,"deletedRows":0,"storedRowsAfter":168}', '2026-08-25T23:45:10+09:00', '2026-08-25T23:45:10+09:00')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0035_sync_validator_jobs_20260825', 'sha256:7e913c674f3d5d358c6cdef78703f1f9f91a68122c4fd52fbcb457c2092e3754', '2026-08-25T23:45:10+09:00')
ON CONFLICT(version) DO NOTHING;
--> statement-breakpoint
PRAGMA optimize;
