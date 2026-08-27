UPDATE jobs
SET last_verified_at = '2026-08-26T14:06:16.000Z', status = 'EXPIRED', updated_at = '2026-08-26T14:06:16.000Z'
WHERE id = 'job-35b9be034d8ba7236ef2a07e'
  AND source_url = 'https://kcits.hubst.co.kr/applicantMain/goJobOpeningDetailPage.do?boardType=1&nextPage=&opnIdx=14508&orgIdx=5197&postIdx='
  AND last_verified_at = '2026-08-21T02:51:23.000Z'
  AND status = 'ACTIVE'
  AND updated_at = '2026-08-21T02:51:23.000Z';
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-26T13:59:58.000Z', status = 'EXPIRED', updated_at = '2026-08-26T13:59:58.000Z'
WHERE id = 'job-45f7898244ff71abe006c11a'
  AND source_url = 'https://recruit.navercloudcorp.com/rcrt/view.do?annoId=30005293&lang=ko'
  AND last_verified_at = '2026-08-21T02:51:23.000Z'
  AND status = 'ACTIVE'
  AND updated_at = '2026-08-21T02:51:23.000Z';
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-26T13:59:58.000Z', status = 'REMOVED', summary = '웹개발 신입 공고이나 현재 상세가 마감 상태로 표시되어 활성 목록에서 제거한다.', updated_at = '2026-08-26T13:59:58.000Z'
WHERE id = 'job-491449af5c4ada4dd7a1671f'
  AND source_url = 'https://m.jobkorea.co.kr/Recruit/GI_Read/49761888'
  AND last_verified_at = '2026-08-23T21:12:40.000Z'
  AND status = 'ACTIVE'
  AND summary = '보안 전담이 아닌 웹개발 직무의 신입 정규직 공고다. 학원 수료자도 환영한다고 안내한다.'
  AND updated_at = '2026-08-23T21:12:40.000Z';
--> statement-breakpoint
UPDATE jobs
SET last_verified_at = '2026-08-26T14:06:16.000Z', status = 'EXPIRED', updated_at = '2026-08-26T14:06:16.000Z'
WHERE id = 'job-a01145b7998cfa5061a6b281'
  AND source_url = 'https://www.skcareers.com/Recruit/Detail/R261762'
  AND last_verified_at = '2026-08-23T21:12:40.000Z'
  AND status = 'ACTIVE'
  AND updated_at = '2026-08-23T21:12:40.000Z';
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d103bc2068c9150c4459b2f7', 'Microsoft', 'FOREIGN', 'Microsoft 공식 채용 연계 공고로 외국계 기업으로 분류.', 'Microsoft Careers', '1970393556978326', 'https://apply.careers.microsoft.com/careers/job/1970393556978326', 'Data Center Technicians Intern', 'DATA_CENTER_INFRASTRUCTURE', 'NEW_GRAD_ELIGIBLE', '부산 근무 데이터센터 인턴이며 별도 필수 근로경력 연수 없음.', 'INTERNSHIP', '부산', 0, '["Data Center","Server","Hardware Operations"]', NULL, NULL, NULL, 1, '데이터센터 운영 업무를 수행하는 인턴으로 채용 완료 시까지 모집한다.', 'ACTIVE', 'a9faa18416c512ab691ff051cd4c7a899ba4d4f5a08aebfa752ccba33e41ef49', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d75ce609587d9b784312c074', 'PFC Technologies', 'UNCLASSIFIED', '현재 공개 상세만으로 CareerGround 회사 규모를 확정하지 않음.', 'Remember Career', '289377', 'https://career.rememberapp.co.kr/job/posting/289377', 'ML Engineer Intern', 'ML_ENGINEERING', 'NEW_GRAD_ONLY', '6개월 전환형 인턴이며 현재 상세가 경력무관으로 표시됨.', 'INTERN_TO_FULL_TIME', '서울', 0, '["Machine Learning","Python"]', NULL, NULL, NULL, 1, 'ML Engineer Intern', 'ACTIVE', '769a286b4ebc07c75f85d942e67be9355aa23f13e7cf613c0b0df55902bb0bc1', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-8a231fdfa895a5833d854494', '딥오토', 'UNCLASSIFIED', '현재 공개 상세만으로 CareerGround 회사 규모를 확정하지 않음.', 'Remember Career', '258549', 'https://career.rememberapp.co.kr/job/posting/258549', '[인턴] Agentic AI Engineer', 'AI_ENGINEERING', 'NEW_GRAD_ONLY', '인턴이며 현재 상세가 경력무관·채용 시 마감으로 표시됨.', 'INTERNSHIP', '서울', 0, '["Python","AI Agent","LLM"]', NULL, NULL, NULL, 1, '[인턴] Agentic AI Engineer', 'ACTIVE', '0bf5568f1de91c25ce22ccf1565b98b22bde785ec5f4238e0c435016247946f4', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-d428a282f2b60e6b92c6c69d', '라이드플럭스', 'STARTUP', '자율주행 소프트웨어 스타트업으로 현재 기업정보에서 확인.', 'Remember Career', '324833', 'https://career.rememberapp.co.kr/job/posting/324833', '[제주/서울] SW Engineer (C++, Python) (정규직·채용연계형 인턴)', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ELIGIBLE', '현재 상세가 경력무관이며 정규직/채용연계형 인턴 경로를 제공함.', 'INTERN_TO_FULL_TIME', '제주·서울', 0, '["C++","Python","Autonomous Driving"]', NULL, NULL, NULL, 1, '[제주/서울] SW Engineer (C++, Python) (정규직·채용연계형 인턴)', 'ACTIVE', 'dc3f66ba25f7c67ae03993b73fe40fea9d1bff7a3ab0a3be1a19b64f7577b448', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-42237e42cfad918be6a888dd', '써큘러랩스', 'UNCLASSIFIED', '현재 공개 상세만으로 CareerGround 회사 규모를 확정하지 않음.', 'Jumpit', '54678456', 'https://jumpit.saramin.co.kr/position/54678456', 'AI Vision Engineer (YOLO)', 'AI_ENGINEERING', 'NEW_GRAD_ONLY', '현재 상세 경력 항목이 신입으로 표시됨.', 'FULL_TIME', '경기 구리시', 0, '["Python","Computer Vision","YOLO"]', NULL, NULL, '2026-09-06T14:59:59.000Z', 0, 'AI Vision Engineer (YOLO)', 'ACTIVE', '3fa527744de37a0660de59bf24c611fa3100ea2a5b88a946bfc2ab332150543e', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-addfef731fb117aa8689e843', '이비즈테크', 'UNCLASSIFIED', '현재 공개 상세만으로 CareerGround 회사 규모를 확정하지 않음.', 'Jumpit', '54647756', 'https://jumpit.saramin.co.kr/position/54647756', '클라우드 엔지니어 신입', 'CLOUD_ENGINEERING', 'NEW_GRAD_ONLY', '현재 상세가 신입·졸업예정 지원 경로를 명시함.', 'FULL_TIME', '서울 마포구', 0, '["AWS","Azure","OpenStack","Linux","Windows"]', NULL, NULL, '2026-09-03T14:59:59.000Z', 0, '클라우드 엔지니어 신입', 'ACTIVE', '715b9a623907f3179ecda9b5f090157f05d467a9eda68ba54e7032c7e2b1d1e3', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-3884a725e889b9ef682f240b', '캐폴랩스', 'UNCLASSIFIED', '현재 원티드 상세만으로 CareerGround 회사 규모를 확정할 직접 근거를 수집하지 못함.', 'Wanted', '382447', 'https://www.wanted.co.kr/wd/382447', '[인턴] 개발자', 'SOFTWARE_ENGINEERING', 'NEW_GRAD_ONLY', '원티드 상세가 신입·인턴으로 표시하고 별도 필수 근로 경력 연수 없이 서비스 개발 경험과 기본 역량을 요구한다.', 'INTERN_TO_FULL_TIME', '서울 종로구', 0, '[]', NULL, NULL, NULL, 1, '캐폴테스트 웹·앱·API 개발과 캐폴AI·아동 음성 데이터 관련 기초 연구개발을 지원하는 3개월 정규직전환형 개발 인턴이다.', 'ACTIVE', '40c9edbd8c7e501052b1c253ea768f1a52fcc39297e7ad30e027995cb6ce7fbe', '2026-08-26T14:01:19.000Z', '2026-08-26T14:06:16.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-0705faf7cb2f1e7ce6541614', '쿤텍', 'UNCLASSIFIED', '현재 공개 상세만으로 CareerGround 회사 규모를 확정하지 않음.', 'Jumpit', '54728283', 'https://jumpit.saramin.co.kr/position/54728283', 'AI 기반 가상머신 개발자 (AX/신입)', 'AI_SOFTWARE', 'NEW_GRAD_ELIGIBLE', '현재 상세가 신입·경력무관 지원 경로를 표시함.', 'FULL_TIME', '경기 성남시', 0, '["AI","Virtual Machine","Software"]', NULL, NULL, '2026-09-12T14:59:59.000Z', 0, 'AI 기반 가상머신 개발자 (AX/신입)', 'ACTIVE', '4db1f12cfd7a2b2fb9a34ffe78fe78418d21c1b76abe3763efad0fc50b7c377a', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-55ee4c3d7546494c69428d41', '파네시아', 'UNCLASSIFIED', '현재 공개 상세만으로 CareerGround 회사 규모를 확정하지 않음.', 'Panmnesia Careers', 'system-software-engineer-new', 'https://panmnesia.com/careers_kr/apply/system-software-engineer-new/', 'System Software Engineer (신입)', 'SYSTEM_SOFTWARE', 'NEW_GRAD_ONLY', '공고 제목이 신입이며 공식 지원 페이지가 현재 열려 있음.', 'FULL_TIME', '대전·서울', 0, '["C","C++","Linux","Driver","Firmware"]', NULL, NULL, NULL, 1, '드라이버·펌웨어 등 시스템 소프트웨어를 개발하는 신입 상시채용 공고다.', 'ACTIVE', '704d528df3eb34843a833b891ae8ba0b4d2923d823ebdc7b5fe1b0a6de56ca8b', '2026-08-26T13:57:50.000Z', '2026-08-26T13:59:58.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO jobs
  (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
   source_url, title, category, career_scope, career_evidence, employment_type, region,
   remote, tech_stack, published_at, application_start_at, deadline_at, rolling, summary,
   status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
VALUES ('job-457f133b04047cf922970648', '한국산업기술시험원(KTL)', 'PUBLIC', 'JOB-ALIO의 한국산업기술시험원 진행중 공공기관 채용 공고.', 'JOB-ALIO', '304192', 'https://job.alio.go.kr/mobile2021/recruit/recruitView.do?idx=304192', '2026년 정규직 채용 - IT·AI 연구직', 'PUBLIC_ICT', 'NEW_GRAD_ONLY', 'JOB-ALIO가 채용구분을 신입으로 표시하고 현재 공식 지원 사이트가 열려 있다.', 'FULL_TIME', '대한민국', 0, '["Platform Development","AI","Public Data","Information Systems"]', NULL, '2026-08-23T15:00:00.000Z', '2026-09-08T14:59:59.000Z', 0, 'KTL 2026년 정규직 채용 가운데 스마트 시험인증 플랫폼, AI·공공데이터, 산업인공지능, 의료 AI 관련 연구직을 묶은 공공 IT·AI 후보다.', 'ACTIVE', 'f94e40bbebd2209c5e6e9d62628e3111f7ae2d6c49a8b700f2da2709a4c5cc10', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z', '2026-08-26T14:49:28.000Z')
ON CONFLICT(source_url) DO NOTHING;
--> statement-breakpoint
INSERT INTO import_batches
  (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
VALUES
  ('catalog-jobs-20260826-validator-confirmed', 'jobs', '0b0b5878971939adc3bb11f039bb8c5a68bb8d2320f79c2374b2b10e11fba0a9', 'COMMITTED', 14, 33,
   '{"baselineRows":168,"matchedExistingRows":168,"newSourceRows":43,"addedActiveRows":10,"excludedNewNonActiveRows":33,"excludedStaleActiveRows":2,"conflictRows":0,"updatedExistingRows":4,"auditRowsNotLive":0,"deletedRows":0,"storedRowsAfter":178}', '2026-08-27T08:28:52+09:00', '2026-08-27T08:28:52+09:00')
ON CONFLICT(id) DO NOTHING;
--> statement-breakpoint
INSERT INTO app_schema_migrations (version, checksum, applied_at)
VALUES ('0036_sync_validator_jobs_20260826', 'sha256:0b0b5878971939adc3bb11f039bb8c5a68bb8d2320f79c2374b2b10e11fba0a9', '2026-08-27T08:28:52+09:00')
ON CONFLICT(version) DO NOTHING;
--> statement-breakpoint
PRAGMA optimize;
