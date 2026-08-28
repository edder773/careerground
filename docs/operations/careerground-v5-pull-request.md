# feat: stabilize CareerGround job automation v5

## 요약

채팅/Library 파일명과 `final/latest` 추론 대신 v5 실행 ID, Manifest, D1 workflow ledger를 유일한 운영 기준으로 만든다. 실패·무변경·격리·검증·게시를 분리하고 명시적 세 partition artifact만 병합한다.

## 주요 변경

- `schemaVersion=5.0`, `workflowId=CG-JOBS-PROD-V5`, 고정 target date/run group/attempt 상태 머신
- raw/canonical SHA-256, canonical URL/JSON, partition 1·2·3 혼합·중복 차단
- preflight/collect/merge/validate/publish/notify/orchestrate 분리
- 설정 기반 품질 게이트와 checksum 공휴일 cache
- D1 VERIFIED staging, publish assertion, atomic batch, idempotency, current/last-success
- PUBLISHED-only notification adapter
- manual-only pre-cutover GitHub Actions matrix workflow
- 운영·복구·cutover·Secret·watchdog·채팅 폐기 문서

실제 웹 수집기는 저장소에 없으므로 임의로 구현하지 않았다. 외부 collector 계약과 deprecated Library adapter까지만 제공하며 실제 연결은 `MANUAL_REQUIRED`다.

## 검증

- unit: 182 passed (contracts 10, web 23, root 149)
- v5 집중 실패 주입: 47 passed
- E2E: 34 passed (Chromium, Firefox, WebKit, 375px mobile)
- typecheck, lint, Sites production build, workflow YAML, Secret pattern scan: passed
- dry-run: VERIFIED, 신규 3/변경 0/종료 0/제외 0/활성 3
- 운영 DB 변경: 없음
- Slack 전송: 없음

E2E 첫 실행은 sandbox localhost listen 제한으로 서버 시작 전에 중단됐고, 승인된 로컬 테스트 서버 환경에서 같은 명령을 재실행해 모두 통과했다.

## Migration과 보안

`0037_careerground_jobs_v5_workflow.sql`은 forward-only workflow/staging/publication/pointer/notification ledger를 추가한다. `DELETE FROM jobs`와 모든 `saved_jobs` mutation을 금지하고 테스트한다. 실제 Secret과 운영 row는 추가하지 않았다.

## 운영 전환과 rollback

외부 collector/정책을 저장소에 연결하고 legacy Work DB 갱신 Task를 일시 중지한 뒤 DRY_RUN을 검증한다. production environment/Secrets, 최초 PUBLISH, 평일 18:00 schedule은 별도 승인이 필요하다. 첫 게시 후 PUBLISHED/last-success/saved_jobs 불변과 다음 날 알림을 확인하고 legacy를 rollback-only로 전환한다.

문제 시 신규 schedule/PUBLISH를 비활성화하고 기존 compatibility workflow와 마지막 정상 Sites/D1 checkpoint를 사용한다. atomic batch 실패는 jobs/publication/import batch/last-success 전체를 롤백한다.

## 상태

- `IMPLEMENTATION_STATUS: PARTIALLY_COMPLETED`
- `CHAT_RETIREMENT_STATUS: NOT_READY`
- `MANUAL_CHAT_DELETION_REQUIRED: true`
- 자동 병합하지 않는다.
