---
title: 131개 감사에서 canonical D1·원자성·편집 보존까지
date: 2026-08-13
tags: [audit, d1, reliability, performance]
generatedByAI: false
pr: pending
commit: bbc1620aed1752dc62dfba23b0f90f766bead6fb
evidence: docs/evidence/performance-after-remediation.json
---

# 131개 감사에서 canonical D1·원자성·편집 보존까지

## 기준선

감사 기준 `04cfb6e`에는 Sites Worker가 `API_ORIGIN`으로 Nest를 proxy할 수 있어 운영 write path가 두 개였다. import commit, partial PATCH, note/solution revision, role bootstrap, search/navigation에서 데이터 손실·권한·경합 위험이 확인됐다. 동일 Node 24.19.0/pnpm 11.21.0 기준에서 typecheck 0, test 51개와 build는 통과했지만 lint 1건, format CRLF 146개, POSIX-only Sites build, PostgreSQL 의존 E2E는 실패했다.

## 핵심 이론

### 단일 canonical write path

동일 기능에 D1과 PostgreSQL 두 구현이 있으면 schema·권한·transaction 의미가 갈라진다. 실제 운영 자격증명이 있는 D1만 write path로 남기고 Nest는 reference로 격리했다.

### 부분 갱신의 필드 보존

클라이언트가 상태 하나를 바꿀 때 기존 memo/bookmark를 기본값으로 덮으면 lost update다. PATCH는 omitted와 explicit null을 구분하고, revision이 있는 편집은 optimistic concurrency control로 409를 반환한다.

```diff
- UPDATE applications SET status=?, memo=''
+ UPDATE applications SET
+   status=COALESCE(request.status, status),
+   memo=CASE WHEN memo supplied THEN request.memo ELSE memo END
```

### import 원자성과 idempotency

preview가 만든 checksum/token과 commit payload를 묶고 D1 batch로 catalog와 import history를 함께 반영한다. 같은 checksum 재요청은 중복 쓰기 대신 동일 결과를 반환한다.

## 구현 결과

- `API_ORIGIN` proxy 제거, D1 canonical router와 shared Zod contract 도입.
- job/learning preview-commit을 D1 atomic batch와 expiry/checksum으로 보호.
- note/solution base revision conflict(409), comment parent/collection target 검증.
- 명시적 admin allowlist와 first-user auto-admin 제거.
- application/favorite/profile의 partial PATCH field 보존.
- local D1 server 기반 Playwright 경로, error boundary, network/timeout 처리.
- search debounce/keyboard, mobile navigation, notification optimistic read, editor local draft/dirty guard.

## 수치 결과

감사 131개 중 P0 `9/9`, P1 `44/66`, P2 `19/56`을 해결 또는 더 큰 수정에 통합했다. P1 22개, P2 37개를 근거 없이 완료 처리하지 않았다.

합성 D1-compatible benchmark는 job 50k, problem 10k, solution 20k, comment 100k, note 1k, notification 10k 데이터와 endpoint당 7회 표본으로 실행했다.

| endpoint      |      p50 |      p95 | DB query |  response |
| ------------- | -------: | -------: | -------: | --------: |
| jobs          |  2.05 ms |  2.95 ms |        4 | 114,460 B |
| filtered jobs | 11.66 ms | 12.09 ms |        4 |  92,526 B |
| problems      |  4.06 ms |  4.84 ms |        4 | 110,292 B |
| solutions     | 12.76 ms | 21.32 ms |        7 |  99,831 B |
| notes         |  1.11 ms |  1.62 ms |        5 |  63,301 B |
| notifications |  1.64 ms |  2.37 ms |        4 |  17,955 B |
| search        |  0.60 ms |  0.96 ms |        9 |   4,614 B |

동일 합성 데이터의 감사 전 endpoint benchmark가 없으므로 이 표에 전후 개선율을 붙일 수 없다. 운영 D1 latency와 browser render/filter 시간도 `정량 측정 불가`다.

## 남은 위험

rate limit, cursor pagination, D1 FK 전면 재구성, notification dedupe, collection trash/restore, 공통 focus-trap dialog, 관측성/alert, 자동 backup/restore drill은 이 시점에 미해결이었다. 최신 상태는 감사 문서와 이 디렉터리 index에서 추적한다.

## 근거

- `docs/audits/careerground-audit-remediation-2026-08.md`
- `docs/evidence/performance-after-remediation.json`
- `docs/architecture/backend-canonicalization.md`
- `docs/operations/data-integrity-check.md`
- `docs/operations/import-recovery.md`
