# CareerGround HQ: 20:00 요청, 20:30 회수

> **전환 예정:** 이 경로는 [수집 5 → 검증 3 → 최종 → Slack 직결 경로](./job-alert-direct-pipeline.md)로 대체된다. 전환 전까지만 유효하다.

이 문서는 활성 HQ 실행 경로다. 시간대는 `Asia/Seoul`이다. 기존 수집 Chat 5개의 평일 18:00 예약과 담당 출처는 그대로 둔다. HQ는 평일 20:00과 20:30에만 기동한다. 예약 시각과 실제 시작 시각을 원장에 별도로 기록한다. 지연됐다고 다음 시간을 기다리는 루프를 만들지 않는다. 기존 일일 Slack workflow의 발송 일정과 `daily:YYYY-MM-DD` 중복 claim도 그대로 둔다.

## 저장 단위

각 날짜의 정기 실행은 `CG-D-A1`이다. Drive의 해당 날짜 원본 5개는 수정하지 않는다. 최신 `jobs`, `slack_digest_items`, `slack_digest_job_reservations`, `slack_digest_deliveries`에서 검증에 필요한 필드만 끝 페이지까지 읽어 한 번 고정한 `current-state.json`을 만든다. 개인정보, 토큰, payload, webhook은 저장하지 않는다. `complete=true`, `truncated=false`는 필요한 필드가 온전할 때만 사용한다.

`scripts/jobs-v5/hq-run-ledger.mjs freeze INPUT.json MANIFEST.json`은 다운로드한 원본 5개의 실제 raw SHA-256, 파일 ID, 크기, 파티션, 출처, 행 수와 최신 상태를 확인하고 manifest 및 후보별 `candidateSha256`과 10필드 `alertCandidate` 인덱스를 생성한다. `INPUT.json`에는 `{targetAsOfDate,attempt:1,frozenAt,collections:[{path,fileId,fileName,version}],currentState:{path,fileId,fileName,version}}`만 넣는다. 다운로드는 임시 로컬 읽기용이며 Drive의 원본을 복제·덮어쓰지 않는다. manifest는 Drive `03_Reviews`에 하나만 업로드하고 raw readback한 ID·SHA-256을 사용한다.

Drive `05_Receipts`에는 날짜당 `CG-D-A1-hq-ledger.json` 하나를 둔다. 이 파일은 같은 Drive fileId로 갱신하고 읽기 검증하며 Drive revision을 남긴다. `scripts/jobs-v5/hq-run-ledger.mjs create INPUT.json LEDGER.json`의 입력은 `{manifest,manifestId,manifestSha256,createdAt,scheduledDispatchAt,scheduledCollectAt,reviewThreads:{1,2,3}}`다. 실제 Chat ID는 공개 저장소에 넣지 않고 HQ 설정에서 제공한다. 원장에는 run/manifest/원본 동일성, 후보 수, 역할별 stage key, 의도·실제 Chat userMessage ID·응답 파일 ID/해시, 예정·관측 시각을 기록한다. 최종 게시·발송 영수증은 별도 실제 결과로 연결한다.

## 20:00 요청

1. 한국 영업일을 기존 코드와 공식 자료로 확인한다. 주말·공휴일·판정 불가는 검증 요청과 DB 게시를 차단한다. Drive `02_Collections`에서 해당 날짜·attempt의 P1~P5 이름을 정확히 조회하고, 중복 이름이나 누락은 `INPUT_NOT_READY`/`CONFLICT`로 종료한다. 과거 파일이나 최신 이름 추정으로 채우지 않는다.
2. 현재 DB/SENT 상태를 완전하게 한 번 읽고 Drive에 고정한다. `freeze`와 manifest 업로드·raw readback을 마친 뒤 원장을 만들고 Drive에 저장한다. 이미 같은 manifest 원장이 있으면 해당 파일을 읽어 이어받으며 새 원장을 만들지 않는다.
3. R1/R2/R3 각각에 대해, 실제 Chat 상태와 저장된 같은 stage key의 사용자 메시지를 확인한다. `UNSENT`인 역할만 원장에 `DISPATCH_INTENT`를 먼저 기록·readback한다. 그 다음 지정된 실제 Chat에 같은 manifest ID/SHA-256, 원본 5개 ID, 현재 상태 ID, `candidateIndex`, 역할, 결과 파일명과 아래 계약을 한 번 전달한다. `send_message_to_thread` 반환만으로 성공이라 하지 않는다. `read_thread`에서 실제 `userMessage` ID를 확인한 뒤 `CHAT_MESSAGE_VERIFIED`를 원장에 기록·readback한다. Chat이 busy거나 응답·전달이 불분명하면 `DISPATCH_UNCERTAIN`과 이유를 기록하고 추정 재전송하지 않는다. 세 역할은 독립적으로 요청하며 완료를 기다리지 않는다.
4. 20:00 HQ 턴을 종료한다. 30분 동안 세션·sleep·반복 감시를 유지하지 않는다.

Chat 결과는 Drive `03_Reviews`의 `CG-D-A1-R{role}.json` 한 개다. 세 역할 모두 `schemaVersion=2.1`, `artifactType=CAREERGROUND_REVIEW`, `runId`, `inputManifestId`, `inputManifestSha256`, `role`, `stage=REVIEW`, `status=COMPLETE|BLOCKED`, `reviewedAt`, `blockingErrors`, 전체 후보별 `decisions`를 반환한다. 각 decision은 manifest와 같은 `candidateId`/`candidateSha256`, `verdict=PASS|HOLD|REJECT`, 구체적 `reason`과 `evidence`를 가진다. PASS에는 manifest `candidateIndex`의 10필드 `alertCandidate`를 값 변경 없이 포함한다. 원문 사실을 고쳐야 한다면 원본·DTO를 재작성하지 않고 HOLD 및 수정 필요 근거를 남긴다. R1은 원문 접수·마감·신입·IT, R2는 현재 DB/SENT/예약과 수집 간 중복, R3는 운영 입력 필드·enum·시간정밀도·근거를 독립 확인한다. COMPLETE는 모든 후보의 판정 완료이고 모든 후보 PASS라는 뜻이 아니다. 각 Chat이 실제 파일을 저장하고 fileId/size/raw SHA-256을 반환해야 한다.

## 20:30 회수와 조건부 게시

1. 그 날짜의 원장 파일 ID만 직접 읽는다. 원장의 `runId/inputManifestId/collectionIdentity`와 예정 확인 시각을 확인한다. 역할별 예상 파일명만 `03_Reviews`에서 조회하고 중복 파일명은 `CONFLICT`다. 결과가 없는 역할은 실제 Chat 상태를 한 번 읽어 `REQUESTED_NO_RESULT`, `CHAT_COMPLETE_FILE_MISSING`, `DISPATCH_UNCERTAIN` 등을 구분한다. 일부 미완료면 `REVIEW_INCOMPLETE`와 역할을 원장에 기록하고 종료한다. 추가 예약이나 자동 재시도는 만들지 않는다.
2. 도착한 각 보고서는 raw bytes를 읽고 `node scripts/jobs-v5/hq-run-ledger.mjs verify-review INPUT.json`으로 같은 manifest SHA-256, 역할, 전체 후보 ID·버전, PASS DTO, 이유·근거, 검증 시각을 검사한다. 성공한 파일 ID/size/SHA-256만 원장에 `REVIEW_FILE_VERIFIED`로 기록한다. 세 역할 모두 준비된 경우에만 다음 단계로 간다.
3. `node scripts/jobs-v5/alert-ready.mjs --manifest-id ID --manifest PATH --current-state PATH --collection-1 PATH ... --collection-5 PATH --review-1 PATH --review-2 PATH --review-3 PATH --date D --attempt 1 --output NEW_EMPTY_DIR`를 실행한다. 이 고정 코드가 PASS 교집합·원본 동일성·현재 상태 신선도·후보별 마감/상시 조건을 확인한다. 한 후보가 부적합하면 사유와 함께 그 후보만 제외한다. 출력이 `NO_ELIGIBLE_JOBS`면 감사 파일을 저장하고 정상 종료하며 운영 인입·Slack을 요청하지 않는다.
4. `READY`가 1건 이상이면 `alert-ready.json`은 감사용으로, schema 5.1 3파일은 실제 운영 입력으로 보존한다. 운영 validator와 원본·PASS DTO 동일성을 확인하고 공식 영업일, 당일, 현재 마감, DB/SENT, Slack workflow active, 원본 해시를 게시 직전에 다시 검사한다. 동일 date/attempt/bundleId Issue가 없으면 실제 Git blob SHA를 담은 기존 `CAREERGROUND_V5_HANDOFF` 포인터 3개를 생성한다. 추가 Chat `FINALIZE`는 요청하지 않는다.
5. GitHub Issue와 Actions 시작은 DB 성공이 아니다. 실제 `PUBLISHED`/`ALREADY_PUBLISHED` artifact를 읽고 신규·기존·만료 건수를 기록한다. Slack은 기존 예약·게시 이벤트와 기존 일일 claim이 담당한다. `sent/already-sent`를 발송 원장에서 별도 확인하며 DB 성공으로 발송 성공을 추정하지 않는다. `SENT/CLAIMED/UNCERTAIN`은 초기화·재전송하지 않는다.

운영 인입은 기존 인증된 `careerground-v5-handoff.yml` → schema 5.1 validator → D1 신규 INSERT 경로다. 검증 Chat 수와 운영 파티션 3개는 다른 단위다. `alert-ready.json`만 생성해서 연결 완료라고 보고하지 않는다. 기존 공고·저장·지원 기록과 발송 원장은 변경하지 않는다.

## 장애와 복구

요청 의도 저장 뒤 중단되면 다음 실행은 먼저 원장과 실제 Chat `userMessage`를 대조한다. 확인된 메시지는 다시 보내지 않는다. 메시지가 없거나 Chat이 busy이면 추정 재전송 대신 `DISPATCH_UNCERTAIN`으로 남긴다. 명시적 복구 요청에서만 미완료 역할을 다룬다. 완료된 수집·검증을 다시 실행하거나 다른 manifest의 보고서를 혼합하지 않는다. 20:30의 `REVIEW_INCOMPLETE`는 그날 정상 자동 실행의 종료 상태다.
