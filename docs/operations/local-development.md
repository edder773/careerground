# 로컬 개발

## 요구사항

- Node 24.19.0
- Corepack + pnpm 11.21.0
- Docker 불필요

`.env.example`을 `.env`로 복사한 뒤 `pnpm install --frozen-lockfile`, `pnpm dev` 순서로 실행한다. 루트 `pnpm dev`는 운영 구조와 같은 React 웹과 메모리 D1 API를 각각 5173, 4000 포트에 기동한다.

로컬 웹과 E2E는 별도 로그인 없이 채용·코딩 카탈로그를 조회한다. 인증 세션이나 개인 데이터 fixture는 만들지 않는다.

로컬 API와 E2E는 운영과 같은 Worker/D1 handler를 사용한다. 별도의 PostgreSQL, Prisma client 생성 또는 Docker 서비스는 없다.

`pnpm dev`는 웹 5173, D1 API 4000을 사용한다. docs는 별도로 `pnpm docs:dev`(5174)를 실행한다.

## 테스트 DB

E2E는 매 실행 새 메모리 D1에 저장소의 순방향 migration과 공통 seed를 적용한다. 실제 사용자 데이터에서 E2E를 실행하지 않는다.

## 문제 해결

- 공개 카탈로그 401/404: Worker가 최신 공개 API dispatcher로 빌드됐는지와 D1 migration 상태를 확인한다.
- 즐겨찾기 미유지: 브라우저 저장소 차단 여부와 동일 브라우저·origin인지 확인한다.
- 제거된 API가 응답함: 최신 Worker bundle인지 확인하고 `pnpm slo:check`의 removed-api 검사를 재현한다.
