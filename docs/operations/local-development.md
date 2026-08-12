# 로컬 개발

## 요구사항

- Node 24.19.0
- Corepack + pnpm 11.21.0
- Docker Desktop 또는 PostgreSQL 17+

`.env.example`을 `.env`로 복사한 뒤 DB URL과 secret을 변경한다. `pnpm install --frozen-lockfile`, `docker compose up -d postgres`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev` 순서로 실행한다.

OpenAI Sites dispatcher는 로컬에 없으므로 인증 경계가 필요한 자동화 테스트만 `OPENAI_AUTH_MOCK=true`를 사용하고 `oai-authenticated-user-id`, `oai-authenticated-user-email` 헤더를 보낸다. production에서는 코드가 이 flag를 무시한다. 실제 사용자 데이터로 이 mock을 실행하지 않는다.

Docker를 쓰지 않고 기존 PostgreSQL을 사용할 때는 전용 role/database를 만들고 `DATABASE_URL`만 변경한다. `prisma migrate dev`는 shadow DB 생성 권한이 필요하다. 운영 role에는 이 권한을 주지 않는다.

`pnpm dev`는 웹 5173, API 4000을 사용한다. docs는 별도로 `pnpm docs:dev`(5174)를 실행한다.

## 테스트 DB

E2E는 개발 DB와 분리한 `careerground_e2e`를 권장한다. CI는 PostgreSQL service를 매 실행 새로 만들고 `prisma migrate deploy`, seed를 실행한다. 실제 사용자 데이터에서 E2E를 실행하지 않는다.

## 문제 해결

- Prisma `P3014`: 개발 role에 shadow database 생성 권한이 없다.
- OpenAI 인증 401: Sites Worker와 API의 `SITES_AUTH_SHARED_SECRET`이 같은지, proxy가 네 사용자 헤더를 전달하는지 확인한다.
- 로컬 인증 401: `NODE_ENV`가 production이 아닌지와 `OPENAI_AUTH_MOCK=true`인지 확인한다.
- PDF가 수동 처리 상태: OCR이나 안전한 텍스트 추출이 설정되지 않은 정상 상태다. 구조화 학습 package import를 사용한다.
