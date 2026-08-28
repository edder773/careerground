# CareerGround v5 진행 기록

## 1단계 — COMPLETED

- 수행: 현재 수집·검증·migration·D1·Slack·공휴일·workflow 흐름 조사.
- 변경: `careerground-v5-current-state.md`.
- 위험: 실제 파티션 수집기와 Scheduled Task 원본이 저장소 밖에 있음.
- 다음: 기준선과 legacy 목록 확정.

## 2단계 — COMPLETED

- 수행: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm sites:build`.
- 결과: 총 138개 테스트와 나머지 검증 모두 통과.
- 변경: `careerground-v5-baseline.md`.
- 다음: 실행 계약과 상태 머신.

## 3단계 — PARTIALLY_COMPLETED

- 수행: 저장소 workflow, 로컬 Codex heartbeat, 기존 import 산출물의 비민감 메타데이터 목록화.
- 변경: `careerground-v5-legacy-inventory.md`.
- MANUAL_REQUIRED: ChatGPT Work Scheduled Task, 채팅, Library 전체 목록은 공식 조회 연결 또는 사용자 UI 확인 필요. 삭제/일시 중지하지 않음.
- 다음: v5 Schema와 코드 구현.

## 4단계 — COMPLETED

- 수행: 실행 식별자, 모드, 상태 목록과 허용 전이 구현.
- 변경: `scripts/jobs-v5/contracts.mjs`와 회귀 테스트.
- 결과: 실패/격리에서 게시, 검증 전 VERIFIED 같은 전이를 거부.
- 다음: Manifest 계약.

## 5단계 — COMPLETED

- 수행: run/partition/verified JSON Schema, runtime validator, checksum, atomic pointer helper 구현.
- 변경: `schemas/`, `scripts/jobs-v5/manifest.mjs`.
- 결과: 누락 필드·잘못된 상태/date/hash와 non-PUBLISHED last-success 거부.
- 다음: canonicalization.

## 6단계 — COMPLETED

- 수행: UTF-8 canonical JSON, raw/canonical SHA-256, URL canonicalization, 다운로드 접미사 표시 정규화, 혼합 차단.
- 변경: `canonical-json.mjs`, `adapter.mjs`, `pipeline.mjs`.
- 결과: 숫자 접미사는 partition 의미에 사용되지 않음.
- 다음: legacy adapter 격리.

## 7단계 — COMPLETED

- 수행: 명시적 artifact path/partition/hash adapter와 deprecated Library adapter 구현.
- 위험: 실제 Library 검색기는 저장소에 없어 제거할 코드가 없고 외부 Task 이전은 `MANUAL_REQUIRED`.
- 다음: 단계 모듈.

## 8단계 — COMPLETED

- 수행: preflight/collect/merge/validate/publish/notify/orchestrate와 package 명령 분리.
- 변경: `scripts/jobs-v5/`, `deployment/sites/d1-jobs-v5.ts`, `package.json`.
- 결과: fixture 기반 독립 CLI와 전체 dry-run 통과. 실제 collector를 구현했다고 주장하지 않음.
- 다음: 오류 의미 분리.

## 9단계 — COMPLETED

- 수행: 파일 부재, JSON 오류, partition 오류, merge/validation 오류를 구별. 무변경은 전체 성공 뒤에만 산출.
- 결과: 회귀 테스트 통과.
- 다음: 품질 격리.

## 10단계 — COMPLETED

- 수행: 정책 JSON과 필수 필드, 중복, 만료/경력/직무, 급감, 대량 종료/변경/도메인/출처 이상 게이트 구현.
- 변경: `config/careerground-validation-policy.json`.
- 결과: quarantine에서 stage/publish 불가.
- 다음: 공휴일.

## 11단계 — COMPLETED

- 수행: 출처·유효기간·checksum을 가진 2026 cache와 cache 검증/fallback 구현.
- 변경: `config/careerground-holidays-2026.json`, `holiday-cache.mjs`.
- 결과: 주말/공휴일 분리, 손상 fail-closed, 유효 fallback 테스트 통과.
- 다음: D1 게시.

## 12단계 — COMPLETED

- 수행: workflow run/staging/publication/pointer/notification tables migration, D1 stage와 atomic idempotent batch publish 구현.
- 변경: `drizzle/0037_careerground_jobs_v5_workflow.sql`, schema/runtime authority, `d1-jobs-v5.ts`.
- 결과: 중간 실패 rollback, 중복 게시 방지, saved_jobs 불변 테스트 통과.
- MANUAL_REQUIRED: 운영 D1 migration 적용과 production adapter 활성화.
- 다음: notifier.

## 13단계 — PARTIALLY_COMPLETED

- 수행: PUBLISHED-only notifier와 실패 retry state/preview 구현.
- 결과: 미완료·격리 거부 및 전송 실패 테스트 통과. 사용자 지시에 따라 실제 Slack은 전송하지 않음.
- MANUAL_REQUIRED: 기존 아침 digest를 v5 last PUBLISHED 조회로 전환하는 운영 cutover.
- 다음: 단일 workflow.

## 14단계 — PARTIALLY_COMPLETED

- 수행: 3-partition matrix, fail-fast false, artifact, merge/validate, main+approvedRun publish guard, always notify 상태 기록 workflow 구현.
- 변경: `.github/workflows/careerground-jobs-v5.yml`.
- 결과: 정적 정책 테스트 통과. 승인 전 schedule 없음, 실제 수집/PUBLISH fail-closed.
- MANUAL_REQUIRED: 외부 collector 연결, legacy 중지, 18:00 schedule/PUBLISH 활성화 승인.
- 다음: 복구.

## 15단계 — COMPLETED

- 수행: 같은 날짜 RESUME 계약, hash 재사용, force recollect/PUBLISH gate/idempotency와 복구 runbook 작성.
- 변경: `careerground-v5-recovery-runbook.md`.
- 다음: Work 감시.

## 16단계 — PARTIALLY_COMPLETED

- 수행: 읽기 전용 Work watchdog prompt 작성. 로컬 공식 목록에서 동일 CareerGround heartbeat를 찾지 못함.
- MANUAL_REQUIRED: ChatGPT Work 공식 UI에서 기존 Task를 확인한 뒤 18:40 watchdog 생성 여부 결정.
- 다음: 전체 검증.

## 17단계 — COMPLETED

- 수행: 비식별 3-partition fixture, 실패 주입, D1 atomic publish, workflow 정책 테스트와 dry-run.
- 결과: v5 집중 테스트 47개, 전체 unit 182개, E2E 34개 통과. typecheck, lint, Sites build 통과. dry-run VERIFIED(신규 3/변경 0/종료 0/제외 0), 운영 DB/Slack 변경 없음.
- 변경: `scripts/jobs-v5/fixtures`, 테스트, `careerground-v5-dry-run-report.md`.
- 다음: cutover/retirement.

## 18단계 — PARTIALLY_COMPLETED

- 수행: 운영/복구/cutover/Secret/watchdog/chat retirement 문서 작성.
- 판정: `CHAT_RETIREMENT_STATUS: NOT_READY`, `MANUAL_CHAT_DELETION_REQUIRED: true`.
- MANUAL_REQUIRED: 운영 PUBLISH, Slack PUBLISHED 소비, 외부 정책 이전, Task/채팅 UI 확인.
- 다음: 전체 검증, 커밋, PR.

## Git/PR — PARTIALLY_COMPLETED

- 수행: `codex/careerground-automation-v5`에 5개 conventional commit을 생성하고 origin에 push.
- 결과: GitHub branch와 비교 가능한 diff 준비 완료. push hook의 typecheck/unit test 통과.
- MANUAL_REQUIRED: `gh` 저장 토큰이 만료됐고 연결된 GitHub App은 PR 생성 권한이 없어 API가 403을 반환했다. 자동 병합은 시도하지 않음. `careerground-v5-pull-request.md`와 GitHub의 branch PR 생성 링크로 수동 생성 가능.

## 2026-08-28 실제 legacy bundle 연결 — COMPLETED

- 수행: 사용자가 제공한 예약 수집기 3개, 수동 Pro 검증기, Work DB 반영기의 프롬프트와 실제 partition/final/audit 구조를 분석했다.
- 수행: 17개 출처의 6/6/5 분할, bucket 0/1/2 소유권, 공통 포함·제외·증거 정책을 저장소 설정으로 이전했다.
- 변경: `config/careerground-partition-sources.json`, `scripts/jobs-v5/legacy-v4-adapter.mjs`, 호환 테스트와 운영 계약 문서.
- 실행: `pnpm jobs:v5:adapt-v4`로 2026-08-28 실제 bundle을 저장소 밖 임시 디렉터리에서 검증했다.
- 결과: baseline 211행, final 240행, 신규 29행, partition 재분할 91/65/84행, 모든 raw/canonical hash와 audit PASS/ELIGIBLE 일치, `VERIFIED_COMPATIBLE`.
- 테스트: 호환 adapter 포함 jobs-v5 40개, 전체 unit 187개, lint, typecheck, Sites production build 통과. UI 변경이 없어 E2E는 기존 34개 통과 결과를 유지했다.
- 보안: 실제 운영 JSON은 커밋하지 않았고 운영 DB와 Slack을 변경하지 않았다.
- MANUAL_REQUIRED: ChatGPT Library 결과를 GitHub artifact로 자동 전달하는 연결, 운영 D1 migration/PUBLISH/schedule 승인.
- 다음: 전체 회귀 테스트와 branch 갱신.

## 19단계 — VERIFIED_DISCOVERY 운영 자동 연결 COMPLETED

- 수행: schema 2.0 handoff 검증 성공 뒤 Sites의 별도 Bearer 보호 endpoint를 호출하도록 연결했다.
- 수행: endpoint에서 현재 KST 날짜, deterministic runId, ACTIVE·신입 증거·미래 마감, ID·URL·canonical key·fingerprint를 재검증하고 운영 기준선과 대조한다.
- 데이터 불변식: 신규 INSERT만 허용하고 기존 `jobs` UPDATE·DELETE와 `saved_jobs` mutation은 0건이다. 동일 bundle은 `ALREADY_PUBLISHED`, 다른 bundle의 같은 runId와 기존 식별자 충돌은 실패한다.
- Slack 연결: 오전 준비 확인이 기존 `jobs`와 v5 `jobs-v5` COMMITTED import를 모두 인정한다. 실제 Slack 검증 메시지는 보내지 않았다.
- Secret: Sites `PUBLISH_API_TOKEN`과 GitHub `CAREERGROUND_PUBLISH_TOKEN`을 별도 난수값으로 구성했으며 artifact·로그·문서에 값을 기록하지 않았다.
- 검증: lint, typecheck, Sites production build, contracts 10 + web 23 + root 175 = unit 208개, E2E 34개 통과.
- 다음: PR 병합, Sites 운영 배포, 인증 실패·health·공개 카탈로그를 이용한 비파괴 production smoke.
