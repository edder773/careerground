# CareerGround 감사 조치 결과 — 2026-08

## 범위와 기준

- 기준 감사 커밋: `04cf…` (감사 package가 지목한 GitHub `main`)
- 구현 시작 커밋: `2cbda27`
- 작업 브랜치: `codex/careerground-stabilization`
- 감사 원문: `careerground_full_audit_2026-08-13.md`
- 작업 지시: `careerground_codex_remediation_prompt_2026-08-13.md`
- 운영 기준 경로: Sites Worker + D1. 결정 근거와 PostgreSQL 전환 조건은 `docs/architecture/backend-canonicalization.md`에 기록했다.

실제 PostgreSQL 운영 인프라와 자격증명이 없었으므로 백엔드를 강제 전환하지 않았다. Worker의 `API_ORIGIN` 분기를 제거해 D1만 운영 쓰기 경로로 남겼고 Nest 구현은 폐기 예정 reference로 격리했다. 운영 D1 데이터는 읽지 않았으며 운영 정합성·백업·배포 검증은 자격증명이 필요한 항목으로 명시했다.

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

합성 성능 측정은 지정된 50,000/10,000/20,000/100,000/1,000/10,000 규모로 실행했고 결과는 `docs/evidence/performance-after-remediation.json`에 있다. 운영 D1 latency와 브라우저 초기 렌더/필터 시간은 측정 환경이 없어 `정량 측정 불가`로 기록했다.

## 131개 이슈 추적표

상태는 작업 프롬프트가 지정한 분류만 사용한다. `다른 수정에 통합됨`은 해당 위험이 기준 경로 단일화 또는 더 큰 변경에 흡수되었음을 뜻한다. `기술적 이유로 미해결`은 일부 보완이 있더라도 감사 항목 전체의 완료 조건을 충족하지 못한 경우다.

| ID   | 심각도 | 상태                               | 코드 경로                                     | 테스트/증거                       | 남은 위험                                |
| ---- | ------ | ---------------------------------- | --------------------------------------------- | --------------------------------- | ---------------------------------------- |
| A-01 | P0     | 완료                               | `worker.ts`, `backend-canonicalization.md`    | D1 E2E, worker test               | PostgreSQL 전환은 별도 RFC 필요          |
| A-02 | P1     | 다른 수정에 통합됨                 | `domain.ts`, `contracts`                      | typecheck, D1 API test            | D1 라우터 추가 분해 필요                 |
| A-03 | P1     | 다른 수정에 통합됨                 | `contracts`, `domain.ts`                      | 공유 Zod import/PATCH tests       | 모든 응답 계약은 미전환                  |
| A-04 | P2     | 기술적 이유로 미해결               | Nest coding controller                        | 정적 추적                         | 폐기 예정 Nest 중복 endpoint 잔존        |
| A-05 | P1     | 완료                               | `d1-api.ts`, `AdminPage.tsx`                  | web/D1 tests                      | D1에 큐·신고 기능 자체는 없음            |
| A-06 | P1     | 완료                               | `d1-api.ts` ranking                           | D1 API test                       | 운영 KST 경계 표본 필요                  |
| A-07 | P1     | 현재 코드에서 이미 해결됨          | D1 daily settings                             | Chromium E2E                      | Nest reference는 폐기 예정               |
| A-08 | P2     | 기술적 이유로 미해결               | `drizzle/0003_*`                              | migration inspection              | 기존 대용량 data migration 잔존          |
| A-09 | P1     | 운영 자격증명 부족으로 배포만 차단 | operations docs                               | 절차 review                       | 실제 export/restore 리허설 미수행        |
| D-36 | P1     | 완료                               | `resolveUser`, admin overview                 | role/cap regression test          | 동시 최초 가입의 강한 직렬화 필요        |
| A-10 | P2     | 운영 자격증명 부족으로 배포만 차단 | Sites auth boundary                           | local identity tests              | 플랫폼 헤더 제거 정책 실환경 확인 필요   |
| A-12 | P1     | 완료                               | D1 API, `request_rate_limits`                 | 사용자/경로 격리·429 회귀 test    | 다중 POP 운영 임계값 조정 필요           |
| D-01 | P0     | 완료                               | problem progress PATCH                        | status/favorite/memo 보존 test    | 없음                                     |
| D-02 | P0     | 완료                               | job application PATCH                         | memo/status 보존 test, E2E        | 없음                                     |
| D-03 | P0     | 완료                               | job bookmark PATCH                            | bookmark/status 보존 test         | 없음                                     |
| D-04 | P0     | 완료                               | shared source text, D1/Nest writes            | `< >` 원문 회귀 tests             | 렌더 sanitizer 지속 검증 필요            |
| D-05 | P0     | 완료                               | job preview/commit D1 batch                   | fault injection rollback test     | D1 batch 한도 모니터링 필요              |
| D-06 | P0     | 완료                               | learning checksum/version batch               | rollback/idempotency tests        | 대형 package 한도 운영 측정 필요         |
| D-07 | P1     | 완료                               | `import_previews`, Admin UI                   | no-preview/mismatch/expiry tests  | token 보관 기간 운영 조정 가능           |
| D-12 | P2     | 기술적 이유로 미해결               | Nest CSV parser                               | 정적 추적                         | reference CLI의 boolean variant 미지원   |
| D-13 | P1     | 완료                               | job dry-run analyzer                          | create/update/review counts tests | field-level diff는 제한적                |
| D-14 | P1     | 완료                               | batch checksum/result                         | duplicate commit test             | 동시 다중 isolate 검증 필요              |
| D-08 | P1     | 완료                               | `normalizeCompanyName`                        | domain test                       | 공식 도메인 보조 키는 미수집             |
| D-09 | P1     | 완료                               | job fingerprint/index                         | duplicate preview test            | fingerprint 충돌은 REVIEW 수동 판정      |
| D-10 | P1     | 완료                               | job analyzer seen-set                         | package duplicate test            | 없음                                     |
| D-11 | P1     | 완료                               | canonical URL allowlist                       | domain test                       | 신규 사이트별 tracking key 보강 필요     |
| D-15 | P2     | 기술적 이유로 미해결               | source freshness metadata                     | 정적 추적                         | 과거 snapshot reconciliation 없음        |
| D-16 | P1     | 기술적 이유로 미해결               | job import                                    | 정적 추적                         | 사라진 공고 자동 만료 없음               |
| D-17 | P1     | 기술적 이유로 미해결               | D1 schema                                     | integrity checker                 | 기존 스키마 FK 전면 재구성 필요          |
| D-18 | P1     | 다른 수정에 통합됨                 | collection target validator                   | D1 collection tests               | DB 다형 FK는 없음                        |
| D-25 | P2     | 기술적 이유로 미해결               | D1 schema                                     | runtime Zod 일부                  | 기존 TEXT enum CHECK 전면 적용 필요      |
| D-26 | P2     | 기술적 이유로 미해결               | D1 JSON/TEXT fields                           | integrity checker                 | 고빈도 필드 정규화 필요                  |
| D-19 | P1     | 완료                               | note/solution baseRevision                    | 409 conflict tests                | 병합 UI는 제한적                         |
| D-21 | P1     | 완료                               | desired-state reaction PUT                    | 중복 PUT idempotency test         | 없음                                     |
| D-20 | P1     | 다른 수정에 통합됨                 | comment parent validator                      | D1 comment tests                  | DB 복합 FK는 없음                        |
| D-22 | P1     | 다른 수정에 통합됨                 | canonical D1 comment/notification             | D1 comment tests                  | outbox는 미구현                          |
| D-23 | P2     | 기술적 이유로 미해결               | report endpoint                               | 정적 추적                         | 중복 신고 도메인 응답 미완               |
| D-24 | P1     | 완료                               | notification `dedupe_key`                     | D-3 반복 호출 dedupe test         | 외부 cron 도입 시 동일 key 유지 필요     |
| D-32 | P1     | 다른 수정에 통합됨                 | notification preference gate                  | D1 producer test                  | 모든 향후 producer가 공통 gate 사용 필요 |
| U-02 | P1     | 완료                               | `NotificationsPage.tsx`                       | optimistic read/navigation E2E    | 삭제 target fallback 보강 가능           |
| U-29 | P2     | 기술적 이유로 미해결               | unread endpoint/badge                         | web tests                         | 유형 filter와 cursor 미구현              |
| D-27 | P1     | 완료                               | reorder sibling validator/batch               | collection E2E                    | fractional rank는 없음                   |
| D-28 | P1     | 완료                               | collection trash/restore                      | D1 API + Home UI test             | 영구 삭제 보관 주기 결정 필요            |
| D-29 | P1     | 기술적 이유로 미해결               | learning review                               | 정적 추적                         | 동시 복습 기록 직렬화 필요               |
| D-30 | P2     | 기술적 이유로 미해결               | review schedule                               | 정적 추적                         | due/completed 의미 재설계 필요           |
| U-25 | P2     | 현재 코드에서 이미 해결됨          | Learning UI                                   | Chromium learning E2E             | 없음                                     |
| U-26 | P2     | 기술적 이유로 미해결               | learning questions                            | 정적 추적                         | 응답·채점·오답 이력 없음                 |
| D-31 | P1     | 완료                               | profile PATCH, Settings UI                    | web/type tests                    | 없음                                     |
| D-35 | P2     | 완료                               | profile URL validation                        | D1/web tests                      | 이미지 proxy/CSP는 운영 검증 필요        |
| P-01 | P1     | 완료                               | jobs keyset cursor + total                    | 50k benchmark, cursor E2E         | 운영 network latency 별도 측정 필요      |
| P-02 | P1     | 완료                               | problem keyset cursor + total                 | 10k benchmark, cursor E2E         | 운영 network latency 별도 측정 필요      |
| P-03 | P1     | 기술적 이유로 미해결               | solution keyset cursor                        | 20k/100k benchmark                | cursor 완료, list/detail 완전 분리 남음  |
| P-04 | P1     | 완료                               | batched solution hydration                    | query-count benchmark             | 댓글 payload는 여전히 클 수 있음         |
| P-05 | P1     | 완료                               | batched note revisions                        | query-count benchmark             | 목록 본문 축소 추가 가능                 |
| P-06 | P1     | 기술적 이유로 미해결               | learning list                                 | 정적 추적                         | source/unit 상세 분리 없음               |
| P-07 | P1     | 완료                               | Map collection grouping                       | D1 tests                          | 없음                                     |
| P-09 | P1     | 기술적 이유로 미해결               | global search                                 | synthetic benchmark               | FTS와 cursor 없음                        |
| P-10 | P1     | 다른 수정에 통합됨                 | D1 canonical ranking                          | D1 tests                          | 대규모 운영 집계 측정 필요               |
| P-11 | P2     | 다른 수정에 통합됨                 | D1 canonical ranking                          | D1 tests                          | materialized aggregate 없음              |
| P-13 | P2     | 기술적 이유로 미해결               | notification scheduler                        | 정적 추적                         | batch scheduler 미구현                   |
| A-11 | P1     | 다른 수정에 통합됨                 | Nest proxy removal                            | worker test                       | D1 rate limit은 별도 A-12                |
| P-08 | P1     | 완료                               | debounced global search                       | web/E2E search tests              | 최근 검색 저장은 없음                    |
| P-12 | P1     | 다른 수정에 통합됨                 | canonical D1 batch import                     | fault injection test              | Nest CLI는 reference-only                |
| P-14 | P2     | 완료                               | static read-only code block                   | web tests, build                  | 편집기는 CodeMirror 유지                 |
| P-15 | P2     | 완료                               | scoped query invalidation                     | web tests                         | 없음                                     |
| P-16 | P2     | 기술적 이유로 미해결               | FolderSaveButton                              | 정적 추적                         | 전체 refetch 남음                        |
| P-17 | P2     | 기술적 이유로 미해결               | `styles.css`                                  | build size                        | CSS module/code split 미구현             |
| P-18 | P2     | 기술적 이유로 미해결               | image assets                                  | 정적 추적                         | 자산 재인코딩 미수행                     |
| P-19 | P2     | 기술적 이유로 미해결               | jobs response                                 | benchmark payload                 | list/detail DTO 분리 미완                |
| P-20 | P2     | 완료                               | `api.ts`                                      | timeout/network/empty-body tests  | 브라우저별 AbortSignal 검증 필요         |
| P-21 | P2     | 기술적 이유로 미해결               | deadline cron                                 | 정적 추적                         | KST 경계 수정 미완                       |
| P-22 | P2     | 현재 코드에서 이미 해결됨          | D1 queries                                    | repository search                 | 없음                                     |
| P-23 | P2     | 완료                               | performance evidence disclaimer               | evidence JSON                     | 운영 수치는 별도 측정 필요               |
| U-01 | P1     | 완료                               | search href/keyboard navigation               | Chromium E2E                      | focus target은 화면별 차이               |
| U-03 | P1     | 완료                               | mobile core nav + More                        | responsive E2E                    | 정보구조 사용자 검증 필요                |
| U-04 | P2     | 기술적 이유로 미해결               | AppShell view toggle                          | 정적 추적                         | 화면별 제어로 미분리                     |
| U-05 | P2     | 기술적 이유로 미해결               | jobs URL params                               | web tests                         | coding/learning 일부 상태 미전환         |
| U-06 | P1     | 완료                               | auth fatal/network states                     | auth tests                        | offline 전용 UI 보강 가능                |
| U-07 | P2     | 완료                               | 404 route                                     | route test/build                  | 없음                                     |
| U-08 | P2     | 완료                               | `AppErrorBoundary`                            | web tests                         | lazy chunk 자동 재시도는 제한적          |
| U-09 | P1     | 완료                               | semantic folder button                        | axe/E2E                           | 없음                                     |
| U-10 | P1     | 완료                               | tree-preserving optimistic reorder            | collection E2E                    | 없음                                     |
| U-11 | P2     | 기술적 이유로 미해결               | folder hierarchy UI                           | 정적 추적                         | 이동/전체 breadcrumb 미완                |
| U-12 | P1     | 기술적 이유로 미해결               | FolderSaveButton                              | 정적 추적                         | 다중 해제/이동 미구현                    |
| U-13 | P1     | 완료                               | server job search/URL                         | Chromium E2E                      | 최근 검색은 없음                         |
| U-14 | P1     | 기술적 이유로 미해결               | job list/calendar                             | visual evidence                   | 상세 행동 공통화 미완                    |
| U-15 | P2     | 기술적 이유로 미해결               | calendar                                      | axe                               | WAI-ARIA grid 미구현                     |
| U-16 | P1     | 완료                               | favorite PATCH + rollback                     | web/D1 tests                      | 없음                                     |
| U-17 | P1     | 완료                               | editor open behavior                          | web regression test               | 첫 입력 시 상태 변경 정책은 저장 기준    |
| U-18 | P1     | 완료                               | per-user/problem local draft                  | web/E2E                           | 장기 draft retention 정책 없음           |
| U-19 | P1     | 기술적 이유로 미해결               | solution complete flow                        | 정적 추적                         | 단일 transaction endpoint 없음           |
| U-20 | P2     | 기술적 이유로 미해결               | CodeMirror languages                          | build                             | Java/C++ lazy extension 미완             |
| U-21 | P0     | 완료                               | reply redacted DTO/UI                         | hidden reply regression test      | 없음                                     |
| U-22 | P1     | 완료                               | solution-scoped reply state                   | web tests                         | 없음                                     |
| U-23 | P2     | 기술적 이유로 미해결               | revision diff                                 | 정적 추적                         | Myers diff 미구현                        |
| U-24 | P1     | 기술적 이유로 미해결               | baseRevision + 409                            | conflict test                     | 비교·병합 UX 미완                        |
| U-27 | P1     | 완료                               | user/note-scoped 500ms local draft            | web draft restore/clear test      | 장기 draft retention 정책 없음           |
| U-28 | P2     | 완료                               | notes trash/restore UI/API                    | D1 API + web test                 | 영구 삭제 보관 주기 결정 필요            |
| U-30 | P2     | 기술적 이유로 미해결               | ranking disclosure                            | 정적 추적                         | KST 기간/신뢰 설명 미완                  |
| U-31 | P1     | 완료                               | Settings load/error/dirty                     | web tests                         | 없음                                     |
| U-32 | P2     | 완료                               | GitHub validator                              | web/D1 tests                      | 존재 여부 네트워크 확인은 안 함          |
| U-33 | P2     | 기술적 이유로 미해결               | language preference model                     | contracts test                    | SQL track 분리 제품 결정 필요            |
| U-34 | P1     | 완료                               | preview-bound commit UI/API                   | D1/E2E import tests               | 없음                                     |
| U-35 | P1     | 완료                               | summary/table preview + pending lock          | admin E2E                         | 100행 이상 virtual scroll은 없음         |
| U-36 | P2     | 완료                               | unsupported D1 capability disclosure          | admin E2E                         | 큐/신고 기능 추가 시 workflow 필요       |
| U-37 | P2     | 기술적 이유로 미해결               | brand config                                  | repository search                 | 하드코딩 전면 제거 미완                  |
| U-38 | P2     | 기술적 이유로 미해결               | page mutations                                | web tests                         | 공통 toast/rollback 전면 통일 미완       |
| U-39 | P2     | 완료                               | jobId pending state                           | jobs E2E                          | 없음                                     |
| U-40 | P2     | 기술적 이유로 미해결               | empty states                                  | visual evidence                   | 최근 검색/현재 사용자 강조 미완          |
| X-01 | P1     | 완료                               | Radix Dialog overlays                         | web/type/axe E2E                  | 실기기 VoiceOver 확인은 X-10             |
| X-02 | P1     | 완료                               | WAI-ARIA calendar grid                        | arrow/home/end keyboard test      | 실기기 SR 확인은 X-10                    |
| X-03 | P1     | 완료                               | semantic folder control                       | axe/E2E                           | 없음                                     |
| X-04 | P2     | 기술적 이유로 미해결               | aria labels/pressed 일부                      | axe                               | 전 화면 live 상태 통일 미완              |
| X-05 | P2     | 기술적 이유로 미해결               | form errors                                   | axe                               | 전 필드 describedby/invalid 미완         |
| X-09 | P2     | 현재 코드에서 이미 해결됨          | reduced-motion CSS                            | repository search                 | 없음                                     |
| X-06 | P2     | 기술적 이유로 미해결               | mobile editor                                 | 320/375 visual                    | 가상 키보드 실기기 검증 없음             |
| X-07 | P2     | 완료                               | multi-route/dialog axe                        | visual E2E                        | manual SR testing은 X-10                 |
| X-08 | P2     | 완료                               | Playwright projects/viewports                 | browser config                    | 실기기 Safari는 별도                     |
| X-10 | P2     | 기술적 이유로 미해결               | release checklist                             | axe/visual only                   | NVDA/VoiceOver·zoom 수동 증거 없음       |
| O-01 | P1     | 완료                               | local D1 server Playwright                    | Chromium D1 E2E                   | production preview smoke 추가 가능       |
| O-02 | P1     | 다른 수정에 통합됨                 | single D1 runtime path                        | architecture decision             | PostgreSQL 전환 시 parity 재도입 필요    |
| O-03 | P1     | 기술적 이유로 미해결               | fault injection/conflict tests                | D1 tests                          | cron·다중 isolate 동시성 범위 미완       |
| O-04 | P2     | 기술적 이유로 미해결               | performance script/evidence                   | synthetic benchmark               | CI budget gate 미구현                    |
| O-05 | P1     | 운영 자격증명 부족으로 배포만 차단 | recovery/integrity docs                       | local procedure review            | 자동 export와 restore drill 미수행       |
| O-06 | P2     | 기술적 이유로 미해결               | requestId + timing headers/log                | D1 response-header test           | platform metric/SLO/alert 연결 미구현    |
| O-07 | P2     | 다른 수정에 통합됨                 | Nest non-runtime isolation                    | architecture doc                  | 향후 PostgreSQL 전환 시 재검토           |
| O-08 | P2     | 완료                               | 최신 0009 이후 expand-only 0010, recovery doc | migration generation/inspection   | D1 preview canary는 운영 필요            |
| O-09 | P2     | 기술적 이유로 미해결               | shared critical Zod contracts                 | tests/typecheck                   | 모든 response runtime parsing 미완       |
| O-10 | P2     | 기술적 이유로 미해결               | visual screenshots/assertions                 | visual E2E                        | pixel baseline 미구현                    |
| D-34 | P2     | 완료                               | allowlist demotion + audit                    | role regression test              | 비상 복구 관리자 절차 운영 필요          |
| D-33 | P0     | 완료                               | explicit admin allowlist                      | first-user MEMBER test/E2E        | allowlist 비밀 관리 필요                 |

## 결과 요약

P0는 9/9, P1은 53/66, P2는 20/56을 해결했다. 여기서 해결 수는 `완료`, `현재 코드에서 이미 해결됨`, `다른 수정에 통합됨`의 합이다. 운영 도구에서만 가능한 export/restore 검증 등 배포 항목은 P1 2개/P2 1개이며, 기술적 이유로 미해결인 항목은 P1 11개/P2 35개다. 이번 후속 조치에서 rate limit, 채용·문제 cursor pagination, 반응 desired-state, 알림 dedupe, 폴더·노트 복구, 공통 Dialog, 달력 grid, 노트 draft를 완료했다. 전면 FK 재구성·검색 FTS·학습 list/detail 분리·자동 backup/restore drill·SLO/alert는 완료로 과장하지 않았다.

운영 배포 전에는 D1 export/restore 리허설, 플랫폼 인증 헤더 경계와 운영 정합성 집계가 여전히 필요하다. rate limit과 응답 timing 관측은 코드에 반영했지만 운영 임계값과 alert는 실제 트래픽 기준으로 조정한다. 기존 migration을 파괴적으로 고치지 말고 새 순방향 migration만 추가한다.
