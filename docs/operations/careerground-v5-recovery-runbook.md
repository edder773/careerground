# CareerGround v5 복구 Runbook

## 공통 확인

장애를 `runId`로 찾고 `targetAsOfDate`, `runGroupKey`, `attempt`, status, errorCode, partition hash를 기록한다. 현재 날짜로 target date를 바꾸지 않는다. `last-success`를 먼저 기록하고 복구 중 변경하지 않는다.

## 단계별 복구

- `FAILED_PREFLIGHT`: 공휴일 cache checksum·유효기간·공식 출처를 확인한다. 불확실하면 게시하지 않는다.
- `FAILED_INPUT/COLLECTION/PARTITION`: 실패 partition만 다시 수집한다. 성공 artifact는 raw/canonical hash가 Manifest와 일치할 때 RESUME에서 재사용한다.
- `FAILED_MERGE`: 서로 다른 run group/date/workflow/schema가 섞였는지 확인하고 올바른 세 artifact를 명시한다.
- `FAILED_VALIDATION/QUARANTINED`: 결과를 수정해 새 run/attempt로 다시 검증한다. 격리 결과를 직접 publish하지 않는다.
- `FAILED_DB_SYNC`: D1 publication, run status, import batch, last-success를 읽기 전용으로 확인한다. publish batch는 원자적이므로 `VERIFIED` stage만 남고 publication이 없으면 같은 Issue event를 재실행해 동일 bundle을 다시 게시할 수 있다. 부분 반영이 관측되면 즉시 추가 쓰기를 멈추고 checkpoint 복구 절차를 적용한다.
- notification 실패: DB의 PUBLISHED와 idempotency ledger를 확인한 뒤 알림만 재시도한다. 본 작업에서는 Slack을 전송하지 않는다.

## 재실행 예시

실패 날짜 재개는 `mode=RESUME`, 기존 `runGroupKey`, 고정 target date, 증가한 attempt와 새 runId를 사용한다. `forceRecollect=false`면 성공 partition hash를 검증해 재사용하고 실패 artifact만 교체한다. 다른 날짜 artifact는 adapter가 거부한다.

전체 재수집은 같은 target date에 세 파티션 attempt를 함께 올려 새 Issue 포인터를 만든다. 자동 게시 runId는 `CG-YYYY-MM-DD-A<attempt>-discovery`이며 이전 attempt의 Issue나 blob을 수정하지 않는다.

## 멱등성과 복원

`publish:<workflowId>:<runId>` idempotency key가 이미 존재하면 같은 source checksum/run은 `ALREADY_PUBLISHED`, 다른 bundle은 실패한다. `workflow_publications` 1행, 해당 `jobs-v5` `import_batches` 1행, 신규 canonical URL 1행을 확인한다.

원자 batch 중간 실패는 transaction rollback으로 jobs, publication, import batch, last-success를 모두 이전 상태로 유지한다. rollback은 기존 migration을 역수정하지 않는다. 필요 시 마지막 정상 Sites/D1 checkpoint를 복원하고 `last-success`가 그 PUBLISHED run을 가리키는지 검증한다.

`saved_jobs` 전후 row count와 대표 sentinel을 비교한다. v5 SQL에서 mutation이 발견되면 실행을 중지한다.
