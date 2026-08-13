# 백엔드 기준 경로 결정

## 결정

CareerGround의 현재 운영 기준 백엔드는 **Sites Worker + D1**이다. `.openai/hosting.json`이 D1을 `DB`로 바인딩하며, Worker는 `/api/v1/**` 요청을 `handleD1Api`로만 전달한다. `API_ORIGIN` 프록시 분기는 제거했다. D1 바인딩이 없으면 다른 백엔드로 묵시적으로 우회하지 않고 `503 D1_NOT_CONFIGURED`를 반환한다.

2026-08-13 작업 환경에는 관리되는 PostgreSQL 인스턴스, 운영 접속 자격증명, 전환 창구가 없었다. 이 상태에서 감사 보고서의 권장안만 따라 PostgreSQL을 강제하면 현재 배포를 중단시키므로, 감사 작업 프롬프트의 “PostgreSQL 운영 인프라가 없는 경우” 절차에 따라 D1을 임시 기준 경로로 확정했다.

## 경계와 책임

- `deployment/sites/worker.ts`: 정적 자산, SPA fallback, D1 API 진입점
- `deployment/sites/d1-api.ts`: 현재 운영 비즈니스 API
- `deployment/sites/domain.ts`, `packages/contracts`: import·수정 요청의 공통 검증과 원문 보존 규칙
- `db/schema.ts`, `drizzle/**`: D1 스키마와 순방향 migration
- `apps/api/**`: PostgreSQL 전환을 위한 폐기 예정(reference-only) 구현. Sites 배포나 E2E의 런타임 경로가 아니다.

동일 엔드포인트를 런타임에서 선택하는 설정은 두지 않는다. Nest 코드는 개발 참고와 향후 데이터 이전 도구에만 남겨 두고, 운영 결함 수정은 D1 경로와 공유 계약에 우선 반영한다.

## PostgreSQL 전환 조건

다음 조건을 모두 만족할 때만 별도 RFC로 전환한다.

1. 관리되는 PostgreSQL, 백업, 모니터링, 비밀 관리가 준비되어 있다.
2. D1 export를 비식별 staging에 복원하고 행 수·checksum·고아 참조 검사를 통과한다.
3. 공유 Zod 계약으로 상태 코드와 응답 구조를 검증한다.
4. 쓰기 동결 또는 change-data-capture 전략, 전환 실패 시 D1 복귀 절차를 승인한다.
5. 1440×900과 375×812의 핵심 흐름 및 Chromium/Firefox/WebKit E2E를 통과한다.

전환이 끝나면 D1 비즈니스 핸들러를 제거하고 Worker는 인증 경계를 검증한 단일 프록시만 담당하도록 다시 설계한다. 전환 전에는 두 쓰기 경로를 동시에 열지 않는다.
