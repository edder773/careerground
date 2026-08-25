INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e21fadb4f26062a5a0dbb8d3', '㈜비즈웍스', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49810560', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49810560', '(신입) 웹개발자 / 앱개발자 채용 공고', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '공고 제목에 신입이 명시되고 경력 항목은 신입·경력으로 표시되며 즉시지원이 열려 있다.', 'FULL_TIME', '경기 고양시', 0, '["Claude","Codex"]', NULL, NULL, '2026-09-18T14:59:59.000Z', 0, '웹·앱 기능을 개발하는 신입 지원 가능 정규직 공고다.', 'ACTIVE', 'b58fe66f2f7fa78975766c486a270066ebfba11747c64a44a203d6eb871efd96', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-3baca7a885b5db17e1905cbc', '㈜서우컴퍼니', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49824425', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49824425', '㈜서우컴퍼니 java .jsp신입 / 경력 개발자 모집', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 상세의 경력 항목에 신입·경력이 명시되고 잡코리아 즉시지원이 가능하다.', 'UNCONFIRMED', '서울 구로구', 0, '["Java","JSP"]', NULL, NULL, '2026-09-20T14:59:59.000Z', 0, 'Java·JSP 웹 개발자를 모집하는 신입·경력 공고로 정규직·계약직·프리랜서 형태가 함께 제시된다.', 'ACTIVE', '53192183a17feb91af1aafe5de0f323f478e73763044079b88a2ca05c9f82b11', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-7a289d890dfa093e50490392', '㈜세명소프트', 'SMALL', '잡코리아 기업정보에 51~300명 이하 중소기업으로 표시된다.', 'JobKorea', '49826447', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49826447', '[세명소프트] IT SI/SM 신입 개발자 채용(불광동 근무)', 'SOFTWARE_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고 제목과 경력 항목에 신입이 명시되고 현재 모집기간이 남아 있다.', 'FULL_TIME', '서울 은평구', 0, '[]', NULL, NULL, '2026-09-20T14:59:59.000Z', 0, 'SI·SM 환경의 IT 개발 업무를 수행하는 학력무관 신입 정규직 공고다.', 'ACTIVE', 'e0868d2a7f09d1531e05ef5a33e1e87a4d7b7214680ef8073c9527c1856a9cc4', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-a2fa809167760ef332bb611f', '㈜에이블짐정보', 'SMALL', '잡코리아 현재 상세에 중소기업으로 표시된다.', 'JobKorea', '49831037', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49831037', '[신입/경력] JAVA/JSP 백엔드 웹프로그래머 정규직/프리랜서 채용', 'BACKEND', 'NEW_GRAD_ELIGIBLE', '공고 제목과 경력 항목에 신입·경력이 명시되고 현재 모집기간이 남아 있다.', 'FULL_TIME_OR_FREELANCE', '서울 송파구', 0, '["Java","JSP"]', NULL, NULL, '2026-09-20T14:59:59.000Z', 0, 'Java·JSP 기반 SI·SM 백엔드 웹 개발자를 모집하는 신입·경력 공고다.', 'ACTIVE', 'ceaf8e075e4c20a19971f10c7db7b63cc502ca444dee6866b1db676f56d2943d', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-212d7f3115ecc34dad4a6110', '㈜오픈시스', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49673101', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49673101', '전자정부 자바웹프로그램 개발(신입 및 경력) 모십니다.', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '공고 제목과 경력 항목에 신입·경력이 명시되며 3년 경력은 우대사항으로만 제시된다.', 'FULL_TIME', '서울 성동구', 0, '["Java"]', NULL, NULL, '2026-08-28T14:59:59.000Z', 0, '전자정부 기반 Java 웹 프로그램을 개발하는 신입·경력 정규직 공고다.', 'ACTIVE', '7b60fd7b875a9dac70113e193dc54983e2ed68a89deab319d5730f778736b19d', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-b63f6d92de595b8a56216da2', '㈜이에스티소프트', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49799973', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49799973', '[(주)이에스티소프트] IT 웹 개발자 신입/경력 채용', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 상세의 지원자격이 경력무관이며 신입·인턴 채용관에 노출되고 즉시 지원 가능한 상태다.', 'UNCONFIRMED', '서울 영등포구', 0, '[]', NULL, NULL, '2026-08-25T04:00:00.000Z', 0, '웹 개발자를 모집하는 경력무관 공고로 정규직과 정규직 전환 가능 계약직·프리랜서 형태가 함께 제시된다.', 'ACTIVE', '9020aec1ae4110eb4e632d94e6d0855abb3308bdab9e2533754027c09f8f76e5', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-a42855b1aa1f994feb6a481e', '㈜커널스', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49623294', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49623294', '(주)커널스에서 JSP 개발자(신입/경력)를 모십니다.', 'WEB_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 상세의 경력 항목에 신입·경력이 명시되고 모집기간이 남아 있다.', 'FULL_TIME_OR_CONTRACT', '서울 마포구', 0, '["Java","JSP"]', NULL, NULL, '2026-09-19T14:59:59.000Z', 0, 'Java·JSP 웹 개발자를 모집하는 신입·경력 공고로 정규직과 전환 가능 계약직 형태가 함께 제시된다.', 'ACTIVE', 'cce05158a307b64ce416d3a2ba800fe1510ce4b8b17cc9c591487e185c2553ee', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-dc3414e7836cbdd483b2c147', '㈜티젠소프트', 'SMALL', '잡코리아 기업정보에 51~300명 이하 중소기업으로 표시된다.', 'JobKorea', '49579859', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49579859', '[2026년 개발팀 공채] JAVA, JSP 개발자 신입/경력 모집', 'SOLUTION_DEVELOPMENT', 'NEW_GRAD_ELIGIBLE', '현재 상세에 신입·경력과 졸업예정자 지원 가능이 명시되고 즉시지원이 열려 있다.', 'FULL_TIME', '서울 금천구', 0, '["CSS3","HTML5","Java","JavaScript","JSP"]', NULL, NULL, '2026-09-12T14:59:59.000Z', 0, 'Java·JSP 기반 솔루션을 개발하는 신입·경력 정규직 공고다.', 'ACTIVE', 'd3c0d2e8c6171da0e9e550d601bee7d3d4d63dadaf396d111eaac6dee84e59d3', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d83230cc86caafdf6f41c431', 'LG전자', 'LARGE', 'LG전자 공식 신입 채용 페이지에서 확인한 대기업 공고다.', 'LG Careers', '1002085', 'https://careers.lg.com/apply/detail?id=1002085', '2026년 하반기 신입사원 채용 - SW·로봇 등 IT 직군', 'MULTI_IT_ROLES', 'NEW_GRAD_ONLY', '공식 안내가 2027년 2월 졸업예정자 또는 기졸업자를 대상으로 하며 2026년 12월부터 정규 근무 가능한 지원자를 모집한다.', 'FULL_TIME', '대한민국', 0, '[]', NULL, NULL, '2026-09-13T14:00:00.000Z', 0, 'LG전자 하반기 신입사원 통합채용 가운데 SW·로봇 등 IT 관련 직군을 포함하는 정규직 공고다.', 'ACTIVE', 'a94b42e9bcc9255ad918d4776463539ee49c1dcf6b6329e94cb387662166f8ac', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-ba686c5d4e122b459b15208b', 'NHN Cloud', 'UNCLASSIFIED', '현재 공식 공고에서 CareerGround 회사 규모 값을 확정할 직접 근거를 별도로 수집하지 않았다.', 'NHN Careers', '4021981752778171144', 'https://careers.nhn.com/recruits/4021981752778171144', '스토리지 엔진 개발', 'SYSTEM_SOFTWARE', 'NEW_GRAD_ELIGIBLE', 'NHN 공식 공고가 경력을 무관으로 표시하고 별도의 필수 근로 경력 없이 기술 역량을 요구한다.', 'FULL_TIME', '경기 성남시 분당구', 0, '["C","C++","Golang","Python","Distributed Systems","Cloud"]', NULL, NULL, NULL, 1, '퍼블릭 클라우드용 고성능 분산 스토리지 엔진을 설계·개발하는 정규직 공고다.', 'ACTIVE', 'a941801b2f0d2852481c39d43e30215f160d6704b0784e70dc30a55ef564e296', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e124115602975a1b56282e3d', '아이시', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49819763', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49819763', '[isee] 소프트웨어 개발자 모집 (앱·웹·ERP 개발) (신입)', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '공고 제목과 지원자격에 신입이 명시되고 현재 잡코리아 즉시지원이 가능하다.', 'FULL_TIME', '경기 안산시', 0, '["Dart"]', NULL, NULL, '2026-10-19T14:59:59.000Z', 0, '앱·웹·ERP 소프트웨어를 개발하는 신입 정규직 공고다.', 'ACTIVE', '7a6b31d4e9af4650683e05b5fa9c6f4d3bf1e294f4afe36a090b94b2cd7fb81c', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-e6922e3d8128c7b90c29b38a', '에이아이티스토리㈜', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49654795', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49654795', '에이아이티스토리 개발자 신입/경력 채용 (플랫폼 개발자)', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '현재 상세의 경력 항목이 경력무관이고 즉시지원 경로가 열려 있다.', 'FULL_TIME', '서울 마포구', 0, '[]', NULL, NULL, '2026-08-26T14:59:59.000Z', 0, '플랫폼 소프트웨어를 개발하는 경력무관 정규직 공고다.', 'ACTIVE', '911b3f9478d3a77fa82bf00ae0d5e894b115c0213042da8eee63fd8482bc7601', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-25b895306f582d446440dcf5', '이너버스', 'UNCLASSIFIED', '현재 상세에서 기업 규모를 확정할 충분한 근거를 수집하지 못했다.', 'Jumpit', '54586009', 'https://jumpit.saramin.co.kr/position/54586009', '백엔드 개발자 (신입)', 'BACKEND', 'NEW_GRAD_ONLY', '점핏 공고 제목과 경력 항목에 신입이 명시되고 현재 지원하기 경로가 열려 있다.', 'UNCONFIRMED', '서울 영등포구', 0, '["Java","Gradle","Python","Golang","Elasticsearch","Kafka","Docker","Kubernetes","PostgreSQL","MySQL","Redis","MongoDB"]', NULL, NULL, '2026-08-26T14:59:59.000Z', 0, 'Java 중심의 로그·데이터 처리 백엔드와 분산 시스템을 개발하는 신입 공고다.', 'ACTIVE', '770f3011e8707d66ad0d577582d36d28007a452943632e6df5579ae17bc2c50e', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-f7c92e448513418dd290267a', '정엔터시스템', 'SMALL', '잡코리아 기업정보에 50명 이하 중소기업으로 표시된다.', 'JobKorea', '49652870', 'https://www.jobkorea.co.kr/Recruit/GI_Read/49652870', 'java, 풀스택 신입 웹개발자 찾습니다.', 'FULLSTACK', 'NEW_GRAD_ONLY', '공고 제목과 경력 항목에 신입이 명시되고 현재 모집기간이 남아 있다.', 'UNCONFIRMED', '서울 금천구', 0, '["Java"]', NULL, NULL, '2026-09-24T14:59:59.000Z', 0, 'Java 기반 웹·풀스택 개발자를 모집하는 학력무관 신입 공고다.', 'ACTIVE', 'cb8494bd4dc15173755da6d955aaf7424139b8d5e763735009a1ae8facfad4e2', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d90569227d3d63f1cb9f448c', '한국물가협회', 'UNCLASSIFIED', '현재 공개 자료만으로 CareerGround 회사 규모 분류를 확정하지 않았다.', '자소설닷컴', '105765', 'https://jasoseol.com/recruit/105765', '채용연계형 인턴사원 모집 - 전산 부문', 'CORPORATE_IT', 'NEW_GRAD_ONLY', '현재 공고가 전산 부문 채용연계형 인턴을 신입으로 모집하고 이메일 지원 절차와 모집기간을 명시한다.', 'INTERN_TO_FULL_TIME', '서울', 0, '[]', NULL, '2026-08-20T06:00:00.000Z', '2026-09-06T05:59:00.000Z', 0, '한국물가협회 전산 부문에서 근무하는 채용연계형 신입 인턴 공고다.', 'ACTIVE', '171ada997e77afa66ed2392a86914d029f6b26ac1f73df2067ab8faae71ea16e', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z', '2026-08-24T14:34:04.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260825-library-active', 'jobs', '26be3ad85d14a04b77e002fe2655bfe03fb5a249cf9d069da3772bf6d4ec5340', 'COMMITTED', 15, 0,
   '{"baselineRows":120,"matchedExistingRows":120,"newSourceRows":36,"addedActiveRows":15,"excludedNewNonActiveRows":21,"excludedStaleActiveRows":3,"conflictRows":0,"updatedExistingRows":0,"deletedRows":0,"storedRowsAfter":135}', '2026-08-25T07:45:00+09:00', '2026-08-25T07:45:00+09:00')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0032_import_library_jobs_20260825', 'sha256:26be3ad85d14a04b77e002fe2655bfe03fb5a249cf9d069da3772bf6d4ec5340', '2026-08-25T07:45:00+09:00')
ON CONFLICT(version) DO NOTHING;
--> statement-breakpoint
PRAGMA optimize;
