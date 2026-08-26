---
title: 미사용 NestJS·Prisma 백엔드 제거와 D1 단일화
date: 2026-08-26
tags: [audit, architecture, dependencies, d1, worker]
generatedByAI: false
pr: pending
commit: pending
evidence: docs/evidence/stage6-single-d1-backend-2026-08-26.json
---

# 미사용 NestJS·Prisma 백엔드 제거와 D1 단일화

## 문제

CareerGround 운영 요청과 migration은 Sites Worker + D1만 사용했지만 저장소에는 동일 제품 API의
NestJS·Prisma·PostgreSQL 구현이 `apps/api`에 reference-only로 남아 있었다. 루트 build와 test는
운영에 포함되지 않는 Prisma client를 매번 생성하고 34개 reference API 테스트를 실행했다. 결과적으로
운영 결함을 고쳐도 두 번째 schema와 endpoint를 계속 관리해야 했으며 lockfile은 사용하지 않는 DB driver
계열까지 포함했다.

## 핵심 이론

배포에서 사용하지 않는 구현을 단순히 “참고용”으로 표시하는 것만으로는 중복 경계가 사라지지 않는다.
같은 workspace build와 dependency graph에 들어 있는 한 보안 업데이트, schema 변경과 테스트 실패의
대상이며 시간이 지날수록 canonical 구현과 달라진다. 전환 가능성은 동작하지 않는 사본보다 ADR과
전환 조건으로 보존하고, 현재 제품은 하나의 실행 가능한 경로만 유지하는 편이 검증 가능하다.

또한 package 삭제만으로 dependency가 정리되지는 않았다. 첫 lockfile 갱신에서는 pnpm의 자동 peer
설치가 Drizzle ORM의 선택적 DB peer까지 해석해 Prisma engine을 계속 남겼다. `autoInstallPeers: false`로
선택적 driver 자동 설치를 끄고 실제 테스트가 요구하는 `@testing-library/dom`만 직접 고정한 뒤 frozen
install을 통과시켰다.

## 전후 비교

동일한 Node 24.19.0, pnpm 11.21.0과 같은 저장소 데이터에서 측정했다.

| 항목                         | 변경 전 | 변경 후 | 변화                |
| ---------------------------- | ------: | ------: | ------------------- |
| `apps/api` tracked 파일      |      56 |       0 | 56개 제거           |
| `apps/api` tracked 줄 수     |   5,783 |       0 | 5,783줄 제거        |
| lockfile 줄 수               |  10,419 |   5,869 | 4,550줄, 43.67%↓    |
| lockfile 바이트              | 361,026 | 203,257 | 157,769B, 43.70%↓   |
| workspace project            |       8 |       7 | 중복 API project 1↓ |
| canonical root·D1 테스트     |      96 |      97 | 구조 방어 1개 추가  |
| 전체 unit/integration 테스트 |     171 |     138 | reference 34개 제거 |

전체 테스트 수 감소는 운영 회귀 테스트 삭제가 아니다. 계약 10개와 웹 31개는 그대로이고, 제거된 34개는
PostgreSQL reference 구현만 검증했다. Worker/D1을 포함한 root suite는 오히려 workspace에 `apps/api`,
PostgreSQL compose, Docker backend와 Nest OpenAPI 산출물이 다시 추가되지 않는 테스트를 더했다.

lockfile 감소에는 Prisma뿐 아니라 자동 설치되던 미사용 선택 DB peer 정리가 포함된다. 따라서 이 수치를
런타임 속도 개선으로 해석하지 않는다.

## 적용 구조

```text
React web
  └─ same-origin /api/v1
       └─ Sites Worker
            ├─ D1 API domain modules
            ├─ D1 schema/readiness
            └─ Sites D1 binding

data authority
  ├─ db/schema.ts
  ├─ drizzle/*.sql
  ├─ deployment/sites/migration-authority.ts
  ├─ deployment/sites/d1.ts            local deterministic seed
  └─ deployment/sites/d1-imports.ts    admin preview/atomic commit
```

PostgreSQL 전환 조건은 ADR에 남겼다. 실제 관리형 인프라, 백업과 이전 계획이 승인되기 전에는 두 번째
서버를 미리 유지하지 않는다.

## 검증

- frozen lockfile install, format, lint, typecheck
- D1 schema generate 결과 변경 0건
- 138개 unit/integration test
- 관리자 D1 preview·commit을 포함한 56개 Chromium/모바일 Chromium/Firefox/WebKit E2E
- production/Sites build와 웹 bundle budget
- D1 query performance budget과 snapshot restore checksum/FK 검증
- 고위험 이상 알려진 dependency 취약점 0건
- Slack 실제 요청 0건

이 단계는 schema, 공개 API, 화면과 Slack payload를 바꾸지 않았다. 운영 SLO는 exact-SHA 배포 뒤 별도
GitHub Actions artifact와 PR 본문에 기록한다.
