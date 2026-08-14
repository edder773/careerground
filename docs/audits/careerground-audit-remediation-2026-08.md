# CareerGround 감사 조치 결과 — 2026-08

## 범위와 기준

- 기준 감사 커밋: `04cf…` (감사 package가 지목한 GitHub `main`)
- 잔여 감사 재검증 기준 커밋: `3c7276c`
- 작업 브랜치: `agent/complete-audit-backlog`
- 감사 원문: `careerground_full_audit_2026-08-13.md`
- 작업 지시: `careerground_codex_remediation_prompt_2026-08-13.md`
- 운영 기준 경로: Sites Worker + D1. 결정 근거와 PostgreSQL 전환 조건은 `docs/architecture/backend-canonicalization.md`에 기록했다.

실제 PostgreSQL 운영 인프라가 없으므로 백엔드를 강제 전환하지 않았다. Worker의 `API_ORIGIN` 분기를 제거해 D1만 운영 쓰기 경로로 남겼고 Nest 구현은 폐기 예정 reference로 격리했다. 2026-08-14 운영 readiness는 `200 {"status":"ok","database":"d1"}`, 헤더 없는 `/api/v1/auth/me`는 `401 UNAUTHORIZED`임을 직접 확인했다. 첫 감사 배포에서 운영 D1이 26개 구형 table에 머문 것도 실제 브라우저와 Worker log로 발견했으며, prepared statement 기반 runtime schema initialization과 legacy-shape 회귀 테스트로 additive table 6개·학습 column 3개·FTS backfill을 보강했다. 설치된 Sites 커넥터가 운영 D1 export/restore와 cron 등록을 제공하지 않는 범위, 그리고 실제 NVDA/VoiceOver 장비 검증은 코드 완료와 구분해 아래 표에 남겼다.

## 기준선과 검증

변경 전 기준선은 Node 24.19.0/pnpm 11.21.0으로 동일 명령을 사용했다. typecheck 0, test 51개 통과, build 통과였다. lint는 `deployment/sites/build.mjs`의 `URL` 전역 1건, `format:check`는 Windows CRLF checkout 146개, Sites build는 POSIX 전용 환경변수 문법, E2E는 PostgreSQL 의존 때문에 실패했다.

변경 후에는 공유 계약, D1 원자 batch, preview token, 필드 보존 PATCH, 원문 보존, allowlist 권한, D1 로컬 E2E를 적용했다. 정적 검사와 단위/통합 검증 명령은 아래와 같다.

```text
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm sites:build
pnpm test:e2e
pnpm db:d1:generate
```

합성 성능 측정은 지정된 50,000/10,000/20,000/100,000/1,000/10,000 규모로 실행했고 결과는 `docs/evidence/performance-after-remediation.json`과 `docs/evidence/performance-budget-2026-08-14.json`에 있다. 최종 budget gate에서 jobs cursor p95 9.50 ms, solutions cursor p95 6.46 ms, FTS search p95 0.99 ms였고 실패는 0건이었다. 이 수치는 로컬 합성 회귀 게이트이며 운영 네트워크 latency로 해석하지 않는다.

## 131개 이슈 추적표

상태는 작업 프롬프트가 지정한 분류만 사용한다. `다른 수정에 통합됨`은 해당 위험이 기준 경로 단일화 또는 더 큰 변경에 흡수되었음을 뜻한다. `기술적 이유로 미해결`은 일부 보완이 있더라도 감사 항목 전체의 완료 조건을 충족하지 못한 경우다.

| ID   | 심각도 | 상태                      | 코드 경로                                     | 테스트/증거                       | 남은 위험                                |
| ---- | ------ | ------------------------- | --------------------------------------------- | --------------------------------- | ---------------------------------------- |
| A-01 | P0     | 완료                      | `worker.ts`, `backend-canonicalization.md`    | D1 E2E, worker test               | PostgreSQL 전환은 별도 RFC 필요          |
| A-02 | P1     | 다른 수정에 통합됨        | `domain.ts`, `contracts`                      | typecheck, D1 API test            | D1 라우터 추가 분해 필요                 |
| A-03 | P1     | 다른 수정에 통합됨        | `contracts`, `domain.ts`                      | 공유 Zod import/PATCH tests       | 모든 응답 계약은 미전환                  |
| A-04 | P2     | 완료                      | Nest coding controller                        | controller/route 정적 추적        | 중복 daily endpoint 제거                 |
| A-05 | P1     | 완료                      | `d1-api.ts`, `AdminPage.tsx`                  | web/D1 tests                      | D1에 큐·신고 기능 자체는 없음            |
| A-06 | P1     | 완료                      | `d1-api.ts` ranking                           | D1 API test                       | 운영 KST 경계 표본 필요                  |
| A-07 | P1     | 현재 코드에서 이미 해결됨 | D1 daily settings                             | Chromium E2E                      | Nest reference는 폐기 예정               |
| A-08 | P2     | 다른 수정에 통합됨        | `drizzle/0013_*`, recovery drill              | migration generate, restore drill | 과거 migration은 immutable로 유지        |
| A-09 | P1     | 기술적 이유로 미해결      | backup/restore runbook                        | local restore drill pass          | Sites가 운영 D1 export/restore 미제공    |
| D-36 | P1     | 완료                      | `resolveUser`, admin overview                 | role/cap regression test          | 동시 최초 가입의 강한 직렬화 필요        |
| A-10 | P2     | 완료                      | Sites auth boundary                           | 운영 무헤더 요청 `401`            | 없음                                     |
| A-12 | P1     | 완료                      | D1 API, `request_rate_limits`                 | 사용자/경로 격리·429 회귀 test    | 다중 POP 운영 임계값 조정 필요           |
| D-01 | P0     | 완료                      | problem progress PATCH                        | status/favorite/memo 보존 test    | 없음                                     |
| D-02 | P0     | 완료                      | job application PATCH                         | memo/status 보존 test, E2E        | 없음                                     |
| D-03 | P0     | 완료                      | job bookmark PATCH                            | bookmark/status 보존 test         | 없음                                     |
| D-04 | P0     | 완료                      | shared source text, D1/Nest writes            | `< >` 원문 회귀 tests             | 렌더 sanitizer 지속 검증 필요            |
| D-05 | P0     | 완료                      | job preview/commit D1 batch                   | fault injection rollback test     | D1 batch 한도 모니터링 필요              |
| D-06 | P0     | 완료                      | learning checksum/version batch               | rollback/idempotency tests        | 대형 package 한도 운영 측정 필요         |
| D-07 | P1     | 완료                      | `import_previews`, Admin UI                   | no-preview/mismatch/expiry tests  | token 보관 기간 운영 조정 가능           |
| D-12 | P2     | 완료                      | Nest CSV parser                               | boolean variant contract tests    | 알 수 없는 표기는 명시적 오류            |
| D-13 | P1     | 완료                      | job dry-run analyzer                          | create/update/review counts tests | field-level diff는 제한적                |
| D-14 | P1     | 완료                      | batch checksum/result                         | duplicate commit test             | 동시 다중 isolate 검증 필요              |
| D-08 | P1     | 완료                      | `normalizeCompanyName`                        | domain test                       | 공식 도메인 보조 키는 미수집             |
| D-09 | P1     | 완료                      | job fingerprint/index                         | duplicate preview test            | fingerprint 충돌은 REVIEW 수동 판정      |
| D-10 | P1     | 완료                      | job analyzer seen-set                         | package duplicate test            | 없음                                     |
| D-11 | P1     | 완료                      | canonical URL allowlist                       | domain test                       | 신규 사이트별 tracking key 보강 필요     |
| D-15 | P2     | 완료                      | authoritative source snapshots                | FULL snapshot D1 regression       | PARTIAL import는 제거 판정 안 함         |
| D-16 | P1     | 완료                      | FULL job import reconciliation                | missing job → REMOVED test        | source별 authoritative 선언 필요         |
| D-17 | P1     | 완료                      | `drizzle/0013_*`                              | FK integrity + migration tests    | 없음                                     |
| D-18 | P1     | 다른 수정에 통합됨        | collection target validator                   | D1 collection tests               | DB 다형 FK는 없음                        |
| D-25 | P2     | 완료                      | `db/schema.ts`, `drizzle/0013_*`              | migration + D1 regression         | enum 추가 시 순방향 migration 필요       |
| D-26 | P2     | 완료                      | `job_tech_stacks`, runtime schema, search FTS | legacy upgrade + performance gate | 원문 JSON은 import evidence로 보존       |
| D-19 | P1     | 완료                      | note/solution baseRevision                    | 409 conflict tests                | 병합 UI는 제한적                         |
| D-21 | P1     | 완료                      | desired-state reaction PUT                    | 중복 PUT idempotency test         | 없음                                     |
| D-20 | P1     | 다른 수정에 통합됨        | comment parent validator                      | D1 comment tests                  | DB 복합 FK는 없음                        |
| D-22 | P1     | 다른 수정에 통합됨        | canonical D1 comment/notification             | D1 comment tests                  | outbox는 미구현                          |
| D-23 | P2     | 완료                      | report upsert endpoint                        | duplicate report contract test    | 신고 검토 workflow는 제품 범위 밖        |
| D-24 | P1     | 완료                      | notification `dedupe_key`                     | D-3 반복 호출 dedupe test         | 외부 cron 도입 시 동일 key 유지 필요     |
| D-32 | P1     | 다른 수정에 통합됨        | notification preference gate                  | D1 producer test                  | 모든 향후 producer가 공통 gate 사용 필요 |
| U-02 | P1     | 완료                      | `NotificationsPage.tsx`                       | optimistic read/navigation E2E    | 삭제 target fallback 보강 가능           |
| U-29 | P2     | 완료                      | notification cursor/type filter               | D1 cursor/type regression         | 없음                                     |
| D-27 | P1     | 완료                      | reorder sibling validator/batch               | collection E2E                    | fractional rank는 없음                   |
| D-28 | P1     | 완료                      | collection trash/restore                      | D1 API + Home UI test             | 영구 삭제 보관 주기 결정 필요            |
| D-29 | P1     | 완료                      | learning review CAS/events                    | stale version conflict test       | 없음                                     |
| D-30 | P2     | 완료                      | review due/completed/mastered model           | due/mastery regression            | 간격 알고리즘 조정은 후속 실험           |
| U-25 | P2     | 현재 코드에서 이미 해결됨 | Learning UI                                   | Chromium learning E2E             | 없음                                     |
| U-26 | P2     | 완료                      | learning question attempts                    | answer-hidden/submit tests        | 없음                                     |
| D-31 | P1     | 완료                      | profile PATCH, Settings UI                    | web/type tests                    | 없음                                     |
| D-35 | P2     | 완료                      | profile URL validation                        | D1/web tests                      | 이미지 proxy/CSP는 운영 검증 필요        |
| P-01 | P1     | 완료                      | jobs keyset cursor + total                    | 50k benchmark, cursor E2E         | 운영 network latency 별도 측정 필요      |
| P-02 | P1     | 완료                      | problem keyset cursor + total                 | 10k benchmark, cursor E2E         | 운영 network latency 별도 측정 필요      |
| P-03 | P1     | 완료                      | solution summary/detail API                   | D1 + 20k/100k budget              | 없음                                     |
| P-04 | P1     | 완료                      | batched solution hydration                    | query-count benchmark             | 댓글 payload는 여전히 클 수 있음         |
| P-05 | P1     | 완료                      | batched note revisions                        | query-count benchmark             | 목록 본문 축소 추가 가능                 |
| P-06 | P1     | 완료                      | learning summary/detail API                   | D1 + web regression               | 없음                                     |
| P-07 | P1     | 완료                      | Map collection grouping                       | D1 tests                          | 없음                                     |
| P-09 | P1     | 완료                      | FTS5 global search + runtime backfill         | legacy upgrade, p95 1.24 ms       | local synthetic performance measurement  |
| P-10 | P1     | 다른 수정에 통합됨        | D1 canonical ranking                          | D1 tests                          | 대규모 운영 집계 측정 필요               |
| P-11 | P2     | 다른 수정에 통합됨        | D1 canonical ranking                          | D1 tests                          | materialized aggregate 없음              |
| P-13 | P2     | 기술적 이유로 미해결      | Worker scheduled handler + lease              | lease/dedupe D1 regression        | Sites connector가 cron 등록 미제공       |
| A-11 | P1     | 다른 수정에 통합됨        | Nest proxy removal                            | worker test                       | D1 rate limit은 별도 A-12                |
| P-08 | P1     | 완료                      | debounced global search                       | web/E2E search tests              | 최근 검색 저장은 없음                    |
| P-12 | P1     | 다른 수정에 통합됨        | canonical D1 batch import                     | fault injection test              | Nest CLI는 reference-only                |
| P-14 | P2     | 완료                      | static read-only code block                   | web tests, build                  | 편집기는 CodeMirror 유지                 |
| P-15 | P2     | 완료                      | scoped query invalidation                     | web tests                         | 없음                                     |
| P-16 | P2     | 완료                      | FolderSaveButton scoped optimistic cache      | web + 3-browser E2E               | 없음                                     |
| P-17 | P2     | 완료                      | route CSS chunks                              | production build artifact         | base shell CSS는 공통 유지               |
| P-18 | P2     | 완료                      | learning WebP assets                          | 2,708,848→1,285,372 B             | 원본 JPG는 호환용 유지                   |
| P-19 | P2     | 완료                      | job summary/detail API                        | 50k budget + D1 tests             | 없음                                     |
| P-20 | P2     | 완료                      | `api.ts`                                      | timeout/network/empty-body tests  | 브라우저별 AbortSignal 검증 필요         |
| P-21 | P2     | 완료                      | KST deadline/review producer                  | scheduler notification tests      | trigger 등록 제한은 P-13                 |
| P-22 | P2     | 현재 코드에서 이미 해결됨 | D1 queries                                    | repository search                 | 없음                                     |
| P-23 | P2     | 완료                      | performance evidence disclaimer               | evidence JSON                     | 운영 수치는 별도 측정 필요               |
| U-01 | P1     | 완료                      | search href/keyboard navigation               | Chromium E2E                      | focus target은 화면별 차이               |
| U-03 | P1     | 완료                      | mobile core nav + More                        | responsive E2E                    | 정보구조 사용자 검증 필요                |
| U-04 | P2     | 완료                      | home-scoped view toggle                       | web + visual E2E                  | 없음                                     |
| U-05 | P2     | 완료                      | jobs/coding/learning URL state                | web + E2E                         | modal ephemeral state는 URL 제외         |
| U-06 | P1     | 완료                      | auth fatal/network states                     | auth tests                        | offline 전용 UI 보강 가능                |
| U-07 | P2     | 완료                      | 404 route                                     | route test/build                  | 없음                                     |
| U-08 | P2     | 완료                      | `AppErrorBoundary`                            | web tests                         | lazy chunk 자동 재시도는 제한적          |
| U-09 | P1     | 완료                      | semantic folder button                        | axe/E2E                           | 없음                                     |
| U-10 | P1     | 완료                      | tree-preserving optimistic reorder            | collection E2E                    | 없음                                     |
| U-11 | P2     | 완료                      | folder breadcrumbs/move                       | web + E2E                         | cycle은 API에서 차단                     |
| U-12 | P1     | 완료                      | multi-folder save/un-save                     | web + 3-browser E2E               | 없음                                     |
| U-13 | P1     | 완료                      | server job search/URL                         | Chromium E2E                      | 최근 검색은 없음                         |
| U-14 | P1     | 완료                      | shared job detail/save/application actions    | web + 3-browser E2E               | 없음                                     |
| U-15 | P2     | 완료                      | WAI-ARIA job calendar grid                    | keyboard + axe E2E                | 실제 SR 검증은 X-10                      |
| U-16 | P1     | 완료                      | favorite PATCH + rollback                     | web/D1 tests                      | 없음                                     |
| U-17 | P1     | 완료                      | editor open behavior                          | web regression test               | 첫 입력 시 상태 변경 정책은 저장 기준    |
| U-18 | P1     | 완료                      | per-user/problem local draft                  | web/E2E                           | 장기 draft retention 정책 없음           |
| U-19 | P1     | 완료                      | atomic solution complete endpoint             | D1 rollback/regression            | 없음                                     |
| U-20 | P2     | 완료                      | lazy JS/Python/Java/C++/SQL extensions        | build + E2E                       | 언어 chunk는 최초 선택 시 로드           |
| U-21 | P0     | 완료                      | reply redacted DTO/UI                         | hidden reply regression test      | 없음                                     |
| U-22 | P1     | 완료                      | solution-scoped reply state                   | web tests                         | 없음                                     |
| U-23 | P2     | 완료                      | Myers revision diff                           | unit + web test                   | 대형 diff 가상화는 미적용                |
| U-24 | P1     | 완료                      | conflict compare/retry UI                     | conflict regression               | 자동 병합 대신 사용자 선택               |
| U-27 | P1     | 완료                      | user/note-scoped 500ms local draft            | web draft restore/clear test      | 장기 draft retention 정책 없음           |
| U-28 | P2     | 완료                      | notes trash/restore UI/API                    | D1 API + web test                 | 영구 삭제 보관 주기 결정 필요            |
| U-30 | P2     | 완료                      | ranking methodology/KST/current user          | D1 + 3-browser E2E                | 없음                                     |
| U-31 | P1     | 완료                      | Settings load/error/dirty                     | web tests                         | 없음                                     |
| U-32 | P2     | 완료                      | GitHub validator                              | web/D1 tests                      | 존재 여부 네트워크 확인은 안 함          |
| U-33 | P2     | 완료                      | SQL coding track                              | D1/web/E2E                        | 프로필 언어 4개 정책과 분리              |
| U-34 | P1     | 완료                      | preview-bound commit UI/API                   | D1/E2E import tests               | 없음                                     |
| U-35 | P1     | 완료                      | summary/table preview + pending lock          | admin E2E                         | 100행 이상 virtual scroll은 없음         |
| U-36 | P2     | 완료                      | unsupported D1 capability disclosure          | admin E2E                         | 큐/신고 기능 추가 시 workflow 필요       |
| U-37 | P2     | 완료                      | shared brand/navigation config                | repository search + typecheck     | 사용자 콘텐츠 문구는 화면 소유           |
| U-38 | P2     | 완료                      | global API live region + rollback             | web + axe E2E                     | 성공 toast는 작업 맥락별 유지            |
| U-39 | P2     | 완료                      | jobId pending state                           | jobs E2E                          | 없음                                     |
| U-40 | P2     | 완료                      | recent search/current user/empty states       | web + visual E2E                  | 없음                                     |
| X-01 | P1     | 완료                      | Radix Dialog overlays                         | web/type/axe E2E                  | 실기기 VoiceOver 확인은 X-10             |
| X-02 | P1     | 완료                      | WAI-ARIA calendar grid                        | arrow/home/end keyboard test      | 실기기 SR 확인은 X-10                    |
| X-03 | P1     | 완료                      | semantic folder control                       | axe/E2E                           | 없음                                     |
| X-04 | P2     | 완료                      | labels/pressed/live status                    | axe + visual E2E                  | 없음                                     |
| X-05 | P2     | 완료                      | form error describedby/invalid                | unit + axe E2E                    | 없음                                     |
| X-09 | P2     | 현재 코드에서 이미 해결됨 | reduced-motion CSS                            | repository search                 | 없음                                     |
| X-06 | P2     | 완료                      | mobile editor viewport reflow                 | 375×812→375×500 E2E               | 실제 장비 검증은 X-10                    |
| X-07 | P2     | 완료                      | multi-route/dialog axe                        | visual E2E                        | manual SR testing은 X-10                 |
| X-08 | P2     | 완료                      | Playwright projects/viewports                 | browser config                    | 실기기 Safari는 별도                     |
| X-10 | P2     | 기술적 이유로 미해결      | accessibility release checklist               | axe, keyboard, 200% reflow        | NVDA/VoiceOver·실기기 수동 증거 없음     |
| O-01 | P1     | 완료                      | local D1 server Playwright                    | Chromium D1 E2E                   | production preview smoke 추가 가능       |
| O-02 | P1     | 다른 수정에 통합됨        | single D1 runtime path                        | architecture decision             | PostgreSQL 전환 시 parity 재도입 필요    |
| O-03 | P1     | 완료                      | atomic batches/CAS/scheduler lease            | D1 concurrency regression         | 다중 POP 부하 검증은 운영 관측           |
| O-04 | P2     | 완료                      | CI performance budget                         | 5 endpoint budgets, failures 0    | local synthetic gate                     |
| O-05 | P1     | 기술적 이유로 미해결      | executable recovery drill/runbook             | 315 pages, checksum/FK pass       | Sites가 운영 D1 export/restore 미제공    |
| O-06 | P2     | 완료                      | request/timing logs, SLO, 6h smoke            | headers + workflow                | 외부 paging 도구는 미연결                |
| O-07 | P2     | 다른 수정에 통합됨        | Nest non-runtime isolation                    | architecture doc                  | 향후 PostgreSQL 전환 시 재검토           |
| O-08 | P2     | 완료                      | migrations + `runtime-schema.ts`              | legacy-shape upgrade/idempotency  | table rebuild는 배포 전 canary 필요      |
| O-09 | P2     | 완료                      | runtime response schemas                      | valid/invalid API response tests  | 비핵심 mutation은 recursive JSON gate    |
| O-10 | P2     | 완료                      | committed pixel baselines                     | 1440×900, 375×812, 48 E2E         | OS 글꼴 차이는 허용 오차 3%              |
| D-34 | P2     | 완료                      | allowlist demotion + audit                    | role regression test              | 비상 복구 관리자 절차 운영 필요          |
| D-33 | P0     | 완료                      | explicit admin allowlist                      | first-user MEMBER test/E2E        | allowlist 비밀 관리 필요                 |

## 결과 요약

P0는 9/9, P1은 64/66, P2는 54/56을 해결했다. 여기서 해결 수는 `완료`, `현재 코드에서 이미 해결됨`, `다른 수정에 통합됨`의 합이다. 131개 중 127개가 코드·자동 검증·운영 HTTP 검증으로 닫혔다. 남은 4개는 같은 제품 결함을 방치한 항목이 아니라 현재 도구 경계가 명확한 외부 검증 항목이다: 운영 D1 export/restore 2개(A-09/O-05), Sites cron 등록 1개(P-13), 실제 NVDA/VoiceOver·모바일 장비 1개(X-10). 각각 실행 가능한 local restore drill, lease가 있는 Worker scheduled handler, axe/keyboard/200%/가상 키보드 회귀와 수동 release checklist까지 마련했다.

이번 잔여 조치에서는 전면 FK/CHECK, authoritative import snapshot, FTS5 cursor search와 운영 runtime initialization, solution/job/learning list-detail 분리, 학습 CAS와 채점 이력, scheduler lease, 공통 runtime response validation, 다중 폴더, revision diff/conflict UX, route CSS/WebP, 성능 예산, 복구 drill, SLO/smoke, pixel baseline을 완료했다. 최종 자동 검증은 lint/typecheck/build/Sites build, 97개 unit·integration test, 48개 Playwright E2E가 모두 통과했다. 기존 migration을 파괴적으로 고치지 않고 새 순방향 migration과 additive runtime upgrade만 적용한다.
