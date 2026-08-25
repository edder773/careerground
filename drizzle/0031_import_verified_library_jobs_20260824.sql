INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id, source_url, title, category, career_scope, career_evidence, employment_type, region, remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES
  ('job-02d6fd0d699656e391f85556', '드림어스컴퍼니', 'MID', '드림어스컴퍼니 공식 진행중 채용 목록과 공식 개별 상세에서 확인한 공고다.', 'Dreamus Company Careers', '227751', 'https://recruit.dreamuscompany.com/mobile/pages/careers_view.jsp?id=227751&jobName=All&title=', '콘텐츠 플랫폼 백엔드 개발(인턴)', 'BACKEND', 'NEW_GRAD_ONLY', '공식 제목이 인턴이며 현재 공개 상세가 경력무관, 프로젝트 경험 중심의 지원 조건을 제시한다.', 'INTERNSHIP', '서울 강남구', 0, '["Java","Kotlin","Golang","MySQL","MongoDB","Elasticsearch","RabbitMQ","SQS","Kafka","AWS","Docker","EKS","MWAA","MediaConvert","FFmpeg"]', NULL, NULL, NULL, 1, '음원·미디어 입수 파이프라인, 트랜스코딩과 백오피스 시스템 개발에 참여하는 경력무관 백엔드 인턴 공고다.', 'ACTIVE', '5662a48193fb7c0df3e8e147c916037daf2bb7f69d04362e5218271c67e1fd4a', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id, source_url, title, category, career_scope, career_evidence, employment_type, region, remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES
  ('job-ff5f5972e0416863d596f7a2', '한국IR협의회', 'PUBLIC', '한국IR협의회 공식 채용 공지와 현재 공개 채용 상세에서 확인한 공고다.', '한국IR협의회 채용', '1411', 'https://w3.kirs.or.kr/public/newsview.html?no=1411', '2026년도 신입사원 채용 - 프로그램 개발', 'SOFTWARE_DEVELOPMENT', 'NEW_GRAD_ONLY', '공고가 신입직원 정규직이며 학력·전공 제한이 없고 학업·개인 프로젝트·인턴 경험도 인정한다고 명시한다.', 'FULL_TIME', '서울 영등포구', 0, '["AI","Machine Learning","LLM","API","Python","JavaScript","TypeScript","AWS","GCP"]', NULL, NULL, '2026-08-30T05:59:00.000Z', 0, 'AI 기업분석 보고서 시스템·홈페이지·데이터 연동·서버·클라우드 인프라를 개발·운영하는 신입 정규직 공고다.', 'ACTIVE', 'ad178e0654baf5035ee87ca83e83c3c93abd61a5d113a4e804ff4afc7e048764', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id, source_url, title, category, career_scope, career_evidence, employment_type, region, remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES
  ('job-f22cfa25c2706b5a66f6c54d', 'NAVER', 'LARGE', 'NAVER 공식 채용 API와 공식 채용 목록에서 확인한 공고다.', 'NAVER Careers', '30005299', 'https://recruit.navercorp.com/rcrt/view.do?annoId=30005299', '[NAVER] 의료 도메인에서의 Agentic RAG 연구 및 개발 (체험형 인턴)', 'AI_RESEARCH', 'NEW_GRAD_ONLY', 'NAVER 공식 채용 API에 모집 경력 New hire, 근로 조건 Intern, 채용진행중으로 표시된다.', 'INTERNSHIP', '경기 성남', 0, '["LLM","RAG","NLP","AI Agent"]', NULL, '2026-08-18T07:20:00.000Z', '2026-08-27T01:00:00.000Z', 0, '의료 도메인에서 질의 분석·검색·근거 검증을 수행하는 Agentic RAG 기술을 연구·개발하는 체험형 인턴이다.', 'ACTIVE', '6567c1f8f92a29c0d54b82a5955e627875598360a9966e0eddcf6a45f1bf7246', '2026-08-24T02:36:12.000Z', '2026-08-24T02:36:12.000Z', '2026-08-24T02:36:12.000Z', '2026-08-24T02:36:12.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id, source_url, title, category, career_scope, career_evidence, employment_type, region, remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES
  ('job-d01c2629eb37b95edeee0cbf', 'SK텔레콤', 'LARGE', 'SK텔레콤 공식 SK Careers 신입 정규직 공고다.', 'SK Careers', 'R261840', 'https://www.skcareers.com/Recruit/Detail/R261840', '2026 Junior Talent 채용 - Infra 직군', 'IT_INFRASTRUCTURE', 'NEW_GRAD_ONLY', '공식 공고가 Category New이며 2027년 2월 졸업예정자와 졸업 후 1년 이내 지원자를 대상으로 한다.', 'FULL_TIME', '전국', 0, '["Network","Linux","DB","5G","LTE","IP Network"]', NULL, NULL, '2026-08-30T07:59:59.000Z', 0, 'SK텔레콤 Junior Talent의 무선·유선/IP·Core Network·Network 설비 신입 정규직 공고로 2026년 8월 30일 16시 59분 59초까지 모집한다.', 'ACTIVE', '3a7675f9c269baad8f86d8943cf27ad02d97cb24fc61e93b9d948822ab4143c5', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id, source_url, title, category, career_scope, career_evidence, employment_type, region, remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES
  ('job-c1b4eb7fcd10aec22e8af7c6', 'SK텔레콤', 'LARGE', 'SK텔레콤 공식 SK Careers 신입 정규직 공고다.', 'SK Careers', 'R261841', 'https://www.skcareers.com/Recruit/Detail/R261841', '2026 Junior Talent 채용 - Tech 직군', 'MULTI_IT_ROLE', 'NEW_GRAD_ONLY', '공식 공고가 Category New이며 2027년 2월 졸업예정자와 졸업 후 1년 이내 지원자를 대상으로 한다.', 'FULL_TIME', '전국', 0, '["Java","Python","C/C++","JavaScript","Backend","Cloud","LLM","RAG","AI Agent"]', NULL, NULL, '2026-08-30T07:59:59.000Z', 0, 'SK텔레콤 Junior Talent의 SW개발·AI Model 신입 정규직 통합 공고로 2026년 8월 30일 16시 59분 59초까지 모집한다.', 'ACTIVE', '3e09a3f3d4d5221c0a4f18efa1ff53976a89d3a45b899abf4127fbe813ae836a', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z', '2026-08-24T05:38:40.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260824-library-active-delta', 'jobs', 'a8eaba0323830d5b8ef94c4ede0a19547e4052be96f8b155f93c3b38bc293c0e', 'COMMITTED',
   5, 0, '{"sourceRows":138,"newSourceRows":23,"addedActiveRows":5,"excludedNewUncertainRows":18,"updatedExistingRows":0,"deletedRows":0,"storedRowsAfter":120,"mode":"LIBRARY_VERIFIED_ACTIVE_INSERT_ONLY"}', '2026-08-24T06:20:34.451Z', '2026-08-24T06:20:34.451Z')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0031_import_verified_library_jobs_20260824', 'sha256:a8eaba0323830d5b8ef94c4ede0a19547e4052be96f8b155f93c3b38bc293c0e', '2026-08-24T06:20:34.451Z');
--> statement-breakpoint
PRAGMA optimize;
