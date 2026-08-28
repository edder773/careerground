# CareerGround v5 dry-run 보고서

- 기준 commit: `1a03e92`(v5 코드·workflow가 고정된 브랜치 commit)
- 입력: `scripts/jobs-v5/fixtures/partition-{1,2,3}.json`, `baseline.json`
- 데이터: 비식별 `*.example` 3건, 운영 row 없음
- runId: `CG-2026-08-27-A1-fixture1`
- runGroupKey: `CG-2026-08-27`
- targetAsOfDate: `2026-08-27`
- 모드: DRY_RUN

## 결과

partition 1·2·3은 각각 SUCCESS 1행이며 서로 다른 명시적 source를 가진다. merge 입력 3행, 출력 3행, 중복 제거 0행이다. 검증은 VERIFIED이며 예상 diff는 신규 3, 변경 0, 종료 0, 제외 0, 활성 3이다.

Slack 결과는 전송이 아닌 block 미리보기만 생성했다. `slackSent=false`다. 운영 D1과 production checkpoint는 변경하지 않았다.

```bash
node scripts/jobs-v5/cli.mjs dry-run --output /tmp/careerground-v5-dry-run
```

명령은 exit code 0이었다. 생성된 `summary.json`의 `productionDatabaseChanged=false`, `slackSent=false`를 확인했다.

## 실패 주입

테스트는 partition 누락/중복, 잘못된 JSON, 날짜·run group·workflow·schema 혼합, raw/canonical hash 불일치, 0행 partition, active·출처 급감, cache 손상/fallback, D1 batch 중간 실패, 중복 attempt/게시, 비-PUBLISHED notify를 주입한다. 로컬 v5 집중 검증에서 47개 테스트가 통과했다.

전체 `pnpm test`는 contracts 10개, web 23개, root scripts/deployment 149개로 총 182개가 통과했다. typecheck, lint, Sites production build도 통과했다. E2E 첫 시도는 샌드박스가 `127.0.0.1:4000` listen을 거부해 제품 검증 전 실패했고, 승인된 로컬 테스트 서버 환경에서 같은 `pnpm test:e2e`를 재실행해 Chromium·Firefox·WebKit·375px 모바일 34개가 모두 통과했다.

## 남은 위험과 MANUAL_REQUIRED

- 실제 세 partition 웹 수집은 외부 ChatGPT 예약 작업에 남아 있으며 자동 artifact 전달 연결은 없음.
- 운영 기준선과 운영 D1 publish는 사용하지 않음.
- production environment/Secret/schedule/PUBLISH 승인이 필요함.
- legacy ChatGPT Work Task와 채팅 전체 목록은 공식 UI 확인 필요.

## 2026-08-28 legacy v4 bundle 호환 dry-run

사용자가 제공한 실제 partition 3개, final, merge audit을 저장소 밖 임시 경로에서 `jobs:v5:adapt-v4`로 검증했다. 운영 원문은 커밋하지 않았다.

- legacy runGroupKey: `2026-08-28:dcb8d23fe9265bc6`
- baseline: 211행, canonical SHA-256 일치
- final: 240행(새 행 29), 원본 SHA-256과 canonical SHA-256 모두 audit 일치
- 상태: ACTIVE 145, DEADLINE_UNKNOWN 48, EXPIRED 32, REMOVED 15
- v5 재분할: partition 1/2/3 = 91/65/84행
- 세 legacy partition 원본 SHA-256과 artifact canonical SHA-256 모두 audit 일치
- audit: quality gate PASS, downstream ELIGIBLE, blocking error 0
- 결과: `VERIFIED_COMPATIBLE`
- 운영 DB 변경: 없음
- Slack 전송: 없음

비식별 호환 adapter 테스트는 정상 bundle, final 변조, partition 변조, 6/6/5 출처 소유권을 검증한다.

호환 adapter 추가 후 전체 검증은 contracts 10개, web 23개, root scripts/deployment 154개로 총 187개가 통과했다. jobs-v5 집중 검증은 40개가 통과했다. lint, typecheck, Sites production build도 다시 통과했다. UI 변경이 없어 E2E는 기존 34개 통과 결과를 유지하고 재실행하지 않았다.
