# CareerGround v5 dry-run 보고서

- 기준 commit: `4810dd9bbc9c43facc346451486552459bf6fc2a` 이후 v5 작업 트리
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

- 실제 세 partition 웹 수집기가 저장소에 없어 DRY_RUN fixture까지만 연결됨.
- 운영 기준선과 운영 D1 publish는 사용하지 않음.
- production environment/Secret/schedule/PUBLISH 승인이 필요함.
- legacy ChatGPT Work Task와 채팅 전체 목록은 공식 UI 확인 필요.
