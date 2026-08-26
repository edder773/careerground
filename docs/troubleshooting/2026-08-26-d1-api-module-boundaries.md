---
title: D1 API 거대 라우터의 도메인 경계 분리
date: 2026-08-26
tags: [audit, architecture, d1, worker, refactor]
generatedByAI: false
pr: pending
commit: pending
evidence: docs/evidence/stage5-d1-api-modules-2026-08-26.json
---

# D1 API 거대 라우터의 도메인 경계 분리

## 문제

운영 Worker의 단일 진입점인 `deployment/sites/d1-api.ts`가 인증, rate limit, 오늘의 문제,
Slack 발송 claim, 관리자 import와 공통 직렬화까지 직접 소유하고 있었다. 기능 오류는 아니었지만
4,744줄·177,482바이트 파일에서 서로 다른 데이터 안전 정책이 같은 lexical scope를 공유해 변경
검토 범위가 지나치게 넓었다. 특히 Slack claim/settle과 import preview/commit은 실패 시 중복 발송이나
부분 반영으로 이어질 수 있어 화면 라우팅과 분리할 필요가 있었다.

## 핵심 이론

이번 분리는 URL별 파일 분할이 아니라 **같은 불변식을 공유하는 정책 단위**를 기준으로 했다.

- 인증 모듈은 Google identity, session, admin allowlist와 rate limit을 함께 소유한다.
- 일일 문제 모듈은 ALGORITHM Lv.1·Lv.2, SQL Lv.3~4와 Slack 전용 Lv.3 선정 규칙을 함께 소유한다.
- import 모듈은 preview token, checksum, 검토 확인과 원자 batch commit을 함께 소유한다.
- 공통 계약과 직렬화 유틸은 도메인 모듈이 라우터를 역참조하지 않도록 가장 아래 계층에 둔다.

이 구조에서 `d1-api.ts`는 요청 경로를 판별하고 도메인 함수를 호출하는 orchestration 역할에 집중한다.
추출 모듈이 다시 `d1-api.ts`를 import하면 순환 의존과 숨은 결합이 생기므로 구조 테스트로 금지했다.

## 전후 비교

동일한 Node 24.19.0, pnpm 11.21.0과 같은 저장소 데이터에서 측정했다.

| 항목                  | 변경 전 | 변경 후 | 변화             |
| --------------------- | ------: | ------: | ---------------- |
| 메인 라우터 줄 수     |   4,744 |   3,306 | 1,438줄, 30.31%↓ |
| 메인 라우터 바이트 수 | 177,482 | 126,401 | 51,081B, 28.78%↓ |
| 관련 회귀 테스트      |   56/56 |   56/56 | 동작 동일        |
| 구조 경계 테스트      |       0 |       4 | 신규 방어선      |

전체 소스량 감소가 목표는 아니다. 명시적인 계약과 import가 추가돼 전체 줄 수에는 경계 비용이 생긴다.
따라서 이 표는 유지보수 대상인 메인 orchestration 파일의 감소만 나타내며 런타임 성능 개선 수치로
해석하지 않는다.

## 적용 구조

```text
worker.ts
  └─ d1-api.ts                    요청 orchestration
       ├─ d1-auth.ts              identity/session/admin/rate limit
       ├─ d1-daily-challenges.ts  오늘의 문제/Slack claim·settle
       ├─ d1-imports.ts           preview/checksum/원자 commit
       ├─ d1-api-utils.ts         cursor/JSON/text helpers
       └─ d1-api-contract.ts      환경·사용자·오류 계약
```

운영 Worker와 hosting 설정에 `@nestjs`, `@prisma`, `apps/api`, `API_ORIGIN`이 다시 들어오지 않는지도
검사한다. Nest/Prisma reference source 자체를 삭제한 것은 아니며, 운영 import graph에서 격리된 상태를
자동으로 보장한다.

## 검증 범위

- format, lint, typecheck
- 171개 unit/integration test
- production/Sites build와 웹 번들 예산
- jobs/search 등 D1 성능 예산
- D1 snapshot 복구 drill과 checksum/FK 검증
- Slack 실제 요청 0건

56개 E2E는 Chromium, 모바일 Chromium, Firefox와 WebKit에서 통과했다. 운영 SLO 결과는 배포 후
GitHub Actions artifact와 PR 본문에 보관한다. 이 구조 변경만으로 처리 속도가 개선됐다고 주장하지
않는다.
