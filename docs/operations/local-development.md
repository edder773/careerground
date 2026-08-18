# 로컬 개발

## 요구사항

- Node 24.19.0
- Corepack + pnpm 11.21.0
- Docker 불필요

`.env.example`을 `.env`로 복사한 뒤 `pnpm install --frozen-lockfile`, `pnpm dev` 순서로 실행한다. 루트 `pnpm dev`는 운영 구조와 같은 React 웹과 메모리 D1 API를 각각 5173, 4000 포트에 기동한다.

자동화 테스트의 로컬 D1 서버만 `AUTH_TEST_MODE=true`로 `/api/v1/auth/test`를 활성화한다. E2E helper가 합성 Google subject와 `example.test` 이메일로 세션 쿠키를 발급받는다. 운영 Worker에는 이 변수를 설정하지 않으며 실제 사용자 데이터로 테스트 endpoint를 실행하지 않는다.

Nest/Prisma/PostgreSQL 앱은 reference-only다. 해당 경로를 별도로 연구할 때만 전용 role/database와 `DATABASE_URL`을 구성하며, 현재 Sites 운영과 일반 로컬 개발에는 사용하지 않는다.

`pnpm dev`는 웹 5173, D1 API 4000을 사용한다. docs는 별도로 `pnpm docs:dev`(5174)를 실행한다.

## 테스트 DB

E2E는 매 실행 새 메모리 D1에 저장소의 순방향 migration과 공통 seed를 적용한다. 실제 사용자 데이터에서 E2E를 실행하지 않는다.

## 문제 해결

- Prisma `P3014`: 개발 role에 shadow database 생성 권한이 없다.
- Google 인증 401: OAuth 클라이언트에 현재 origin이 등록됐는지와 ID 토큰 `aud`가 `GOOGLE_CLIENT_ID`와 같은지 확인한다.
- 로컬 인증 401: local D1 server에만 `AUTH_TEST_MODE=true`가 설정됐는지 확인한다.
- PDF가 수동 처리 상태: OCR이나 안전한 텍스트 추출이 설정되지 않은 정상 상태다. 구조화 학습 package import를 사용한다.
