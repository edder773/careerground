INSERT OR IGNORE INTO coding_problems
  (id, source_url, display_title, level, tags, position, active, created_at, updated_at)
VALUES
  ('problem-feature-development', 'https://school.programmers.co.kr/learn/courses/30/lessons/42586', '기능개발', 2, '["스택","큐"]', 0, 1, '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z'),
  ('problem-phone-book', 'https://school.programmers.co.kr/learn/courses/30/lessons/42577', '전화번호 목록', 2, '["해시","정렬"]', 1, 1, '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z'),
  ('problem-valid-parentheses', 'https://school.programmers.co.kr/learn/courses/30/lessons/12909', '올바른 괄호', 2, '["스택","문자열"]', 2, 1, '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z'),
  ('problem-target-number', 'https://school.programmers.co.kr/learn/courses/30/lessons/43165', '타겟 넘버', 2, '["DFS","BFS"]', 3, 1, '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO daily_challenge_settings
  (id, allowed_levels, repeat_exclusion_days, allow_repeat_relaxation, updated_at)
VALUES (1, '[1,2]', 60, 0, '2026-08-12T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO jobs
  (id, company_name, company_size, source_name, source_url, title, category, region, remote, tech_stack, deadline_at, rolling, summary, status, last_verified_at, created_at, updated_at)
VALUES
  ('job-platform-backend', 'CareerGround Labs', 'STARTUP', '관리자 정형 import', 'https://example.com/jobs/platform-backend', '신입 플랫폼 백엔드 엔지니어', '백엔드', '서울', 1, '["TypeScript","Node.js","PostgreSQL"]', '2026-09-15T14:59:59.000Z', 0, '서비스 API와 데이터 모델을 함께 설계하는 신입 백엔드 포지션입니다.', 'ACTIVE', '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z'),
  ('job-data-engineer', 'Ground Data', 'MID', '관리자 정형 import', 'https://example.com/jobs/data-engineer', '주니어 데이터 엔지니어', '데이터 엔지니어링', '경기', 0, '["Python","SQL","Airflow"]', '2026-09-30T14:59:59.000Z', 0, '분석 파이프라인과 데이터 품질 자동화를 담당합니다.', 'ACTIVE', '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO learning_sources
  (id, title, subject, category, status, created_at, updated_at)
VALUES
  ('source-web-foundations', '웹 서비스 개발 기초', '소프트웨어 개발', '백엔드', 'READY', '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO learning_units
  (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
VALUES
  ('unit-http', 'source-web-foundations', 'http-api', 'HTTP API와 상태 코드', '요청과 응답의 구조, 멱등성, 상태 코드의 의미를 학습합니다.', '["HTTP","REST","멱등성"]', 0, 1, '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z'),
  ('unit-database', 'source-web-foundations', 'database-index', '관계형 데이터와 인덱스', '정규화된 테이블과 실제 조회 패턴에 맞는 인덱스를 학습합니다.', '["SQL","인덱스","트랜잭션"]', 1, 1, '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO flashcards (id, unit_id, front, back, created_at)
VALUES
  ('flash-http-idempotent', 'unit-http', '멱등한 요청이란?', '같은 요청을 여러 번 수행해도 최종 상태가 같은 요청입니다.', '2026-08-12T00:00:00.000Z'),
  ('flash-db-index', 'unit-database', '인덱스의 핵심 역할은?', '조건과 정렬에 필요한 행을 더 적게 스캔하도록 돕습니다.', '2026-08-12T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO learning_questions (id, unit_id, prompt, answer, created_at)
VALUES
  ('question-http-status', 'unit-http', '리소스를 생성한 응답에 적합한 상태 코드는?', '201 Created', '2026-08-12T00:00:00.000Z'),
  ('question-db-index', 'unit-database', '모든 컬럼에 인덱스를 만들면 안 되는 이유는?', '쓰기 비용과 저장 공간이 증가하기 때문입니다.', '2026-08-12T00:00:00.000Z');
