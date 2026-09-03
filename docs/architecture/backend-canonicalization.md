# 백엔드 기준 경로 결정

## 결정

CareerGround의 현재 운영 기준 백엔드는 **Sites Worker + D1**이다. `.openai/hosting.json`이 D1을 `DB`로 바인딩하며, Worker는 `/api/v1/**` 요청을 `handleD1Api`로만 전달한다. `API_ORIGIN` 프록시 분기는 제거했다. D1 바인딩이 없으면 다른 백엔드로 묵시적으로 우회하지 않고 `503 D1_NOT_CONFIGURED`를 반환한다.

2026-08-13 작업 환경에는 관리되는 PostgreSQL 인스턴스, 운영 접속 자격증명, 전환 창구가 없었다. 이 상태에서 감사 보고서의 권장안만 따라 PostgreSQL을 강제하면 현재 배포를 중단시키므로, 감사 작업 프롬프트의 “PostgreSQL 운영 인프라가 없는 경우” 절차에 따라 D1을 기준 경로로 확정했다. 2026-08-26에는 운영과 무관한 NestJS/Prisma reference 앱도 제거해 저장소 수준의 단일 백엔드 경계를 완성했다.

## 경계와 책임

- `deployment/sites/worker.ts`: 정적 자산, SPA fallback, D1 API 진입점
- `deployment/sites/d1-api.ts`: 공개 카탈로그와 보호된 운영 API dispatcher
- `deployment/sites/d1-public-catalog.ts`: 채용·코딩 읽기 전용 쿼리
- `deployment/sites/d1-daily-challenges.ts`, `deployment/sites/d1-jobs-v5.ts`: Slack 발송과 검증된 채용 게시
- `deployment/sites/domain.ts`: 운영 입력의 공통 정규화와 해시
- `db/schema.ts`, `drizzle/**`: D1 스키마와 순방향 migration

동일 엔드포인트를 런타임이나 source tree에서 선택하는 설정은 두지 않는다. 운영 결함 수정, import, seed, migration과 테스트는 D1 경로에만 반영한다. 학습·인증·컬렉션·풀이·알림 API 구현과 이전 공유 계약 package는 제거했다. PostgreSQL 전환이 실제로 승인되기 전에는 별도 서버 구현을 미리 유지하지 않는다.

## PostgreSQL 전환 조건

다음 조건을 모두 만족할 때만 별도 RFC로 전환한다.

1. 관리되는 PostgreSQL, 백업, 모니터링, 비밀 관리가 준비되어 있다.
2. D1 export를 비식별 staging에 복원하고 행 수·checksum·고아 참조 검사를 통과한다.
3. 공개 API의 상태 코드와 응답 구조를 독립 계약 테스트로 검증한다.
4. 쓰기 동결 또는 change-data-capture 전략, 전환 실패 시 D1 복귀 절차를 승인한다.
5. 1440×900과 375×812의 핵심 흐름 및 Chromium/Firefox/WebKit E2E를 통과한다.

전환 RFC가 승인되면 별도 branch에서 데이터 이전 도구와 새 서버를 함께 만들고 shadow traffic으로 계약을 검증한다. 전환이 끝나면 D1 비즈니스 핸들러를 제거하고 Worker는 내부 운영 token 경계를 검증한 단일 프록시만 담당하도록 다시 설계한다. 전환 전에는 두 쓰기 경로를 동시에 열지 않는다.
