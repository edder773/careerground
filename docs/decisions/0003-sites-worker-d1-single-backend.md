# ADR 0003: Sites Worker와 D1을 단일 백엔드로 사용한다

- 상태: Accepted
- 날짜: 2026-08-26
- 대체: ADR 0002

## 배경

운영 트래픽과 배포 migration은 이미 Sites Worker와 D1만 사용했지만 저장소에는 같은 제품 API의 NestJS/Prisma/PostgreSQL 구현이 reference-only로 남아 있었다. 루트 build, typecheck와 test가 이 미사용 앱을 계속 생성·검증해 운영 코드와 무관한 의존성, schema와 endpoint가 변경될 수 있었다.

## 결정

- 브라우저와 E2E는 `deployment/sites/**`의 같은 Worker/D1 handler만 호출한다.
- `db/schema.ts`, `drizzle/**`, `deployment/sites/migration-authority.ts`가 schema와 migration의 단일 권위다.
- 관리자 import는 D1 preview token과 atomic batch를 사용한다.
- 별도 NestJS/Prisma 앱, PostgreSQL compose, Docker 배포 경로와 Nest OpenAPI 산출물을 유지하지 않는다.
- PostgreSQL 전환은 관리형 인프라·백업·관측·D1 이전 계획이 승인된 별도 RFC에서 새로 구현한다.

## 결과

운영과 개발의 backend 선택 분기가 사라지고, dependency update와 CI가 실제 배포 경로만 검증한다. 반대로 PostgreSQL을 즉시 시험하는 reference server는 제공하지 않으며 향후 전환 시 명시적인 신규 구현과 parity 검증이 필요하다.
