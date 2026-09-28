# CareerGround 알림 준비 데이터 계약

채용공고 알림의 경계는 `CAREERGROUND_ALERT_READY` 1.0이다. 월~금 18:00 KST의 기존 Chat 5개가 원본을 수집한다. HQ는 20:00에 동일 manifest로 실제 Chat R1/R2/R3에 각각 한 번 요청하고, 20:30에 세 결과를 한 번 회수한다. 세 검증의 명시적 `PASS` 교집합만 준비 데이터가 된다. 원본과 검증은 Drive에 그대로 보존한다. `alert-ready.json`은 승인 근거와 후보 목록을 기록하는 감사 산출물이며, 기존 운영 DB로는 결정적으로 변환한 schema 5.1 파티션 3개만 전달한다. 실행 절차는 [20:00·20:30 HQ 문서](./job-alert-hq-two-wakes.md)를 따른다.

## 최소 후보 형식

```json
{
  "candidateId": "P1-0001",
  "companyName": "회사명",
  "title": "공고 제목",
  "sourceName": "JobKorea",
  "sourceUrl": "https://example.com/job/1",
  "deadlineAt": "2026-10-01T18:00:00+09:00",
  "careerScope": "NEW_GRAD_ONLY",
  "status": "ACTIVE",
  "rolling": false,
  "lastVerifiedAt": "2026-09-28T20:00:00+09:00"
}
```

이 10개 필드가 알림 준비 후보의 전부다. `candidateId`는 실행 내 출처 식별자다. 실제 DB `jobs.id`는 운영 인입이 생성하며, Slack의 일일 claim 및 예약 원장은 이 ID를 쓴다. 상세 근거와 운영 필수 필드는 변경하지 않은 수집 원본 및 schema 5.1 변환 파일에 남는다. 알림 파일에는 runId, 날짜, attempt, manifestId, bundleId, 원본 후보 수, 통과 수, 제외 판정, 각 검증 보고서의 SHA-256을 기록한다.

## 실행 불변식

- 원본 5개는 manifest의 `partitionId/fileId/size/SHA-256`과 raw bytes로 일치해야 한다. 수집 출처는 지정된 15개이고 후보 ID와 소유 출처가 일치해야 한다.
- R1/R2/R3는 schema 2.1의 동일 runId, `inputManifestId` 및 manifest raw SHA-256에 대해 모든 후보를 한 번씩 `PASS/HOLD/REJECT`와 이유로 판정해야 한다. 각 후보의 원본 버전 해시가 일치해야 하며 PASS는 변경 없는 10필드 공고 데이터와 근거를 포함한다. 검증 시각은 대상 KST 날짜다.
- 통과 후보는 검증 시점에 접수 가능해야 하며 `lastVerifiedAt`은 같은 날짜이고 마지막 검증 시각보다 6시간 이상 오래되지 않아야 한다. 정보가 모호하면 `HOLD` 또는 차단한다.
- `bundleId`는 run/manifest, 동결된 5개 원본, 검증 3개의 raw SHA-256, 통과 ID로 계산한다. 세 파티션과 세 GitHub handoff 포인터는 같은 `attempt/bundleId`를 사용한다. 혼합된 attempt, 충돌하는 bundleId, 포인터와 blob의 bundleId 불일치는 차단한다.
- 세 검증의 교집합이 0건이면 `NO_ELIGIBLE_JOBS`로 감사 기록하고, 빈 공고를 채우거나 이전 공고를 다시 보내지 않는다.
- GitHub issue 제출은 DB 성공이 아니다. schema 5.1 검증, 운영 import의 `PUBLISHED` 또는 동일입력 `ALREADY_PUBLISHED`, 실제 Slack `sent/already-sent`를 각각 별도 영수증으로 확인한다.

## DB와 발송

`0041_job_alert_candidates_view.sql`은 기존 `jobs` 행을 수정하거나 삭제하지 않고 알림에 필요한 열만 투영한다. 이 view는 기존 행과 새로 검증된 행을 같은 형식으로 읽게 한다. 신규 행은 기존 v5 검증 인입의 INSERT 경로만 사용한다. `saved_jobs`나 발송 원장은 초기화하지 않는다.

평일 07:55 KST 예약 runner가 08:00까지 대기하고, 08:30 감시 실행이 재확인한다. 예약과 게시 완료 이벤트는 직전 성공 알림 이후 `jobs`/`jobs-v5` import가 `COMMITTED`인지 먼저 검사한다. 준비되지 않았으면 발송 claim을 잡지 않는다. 준비되면 기존 `daily:YYYY-MM-DD` 원자 claim과 `SENT/CLAIMED/UNCERTAIN` 중복 방지를 그대로 사용한다. 주말·대한민국 공휴일은 기존 차단 규칙을 적용한다. GitHub 예약 지연으로 정확히 08:00 전송을 보장할 수는 없으므로 목표 시각과 08:30 감시 결과를 별도로 관측한다.

생성 명령: `node scripts/jobs-v5/alert-ready.mjs --manifest-id DRIVE_FILE_ID --manifest MANIFEST_PATH --current-state STATE_PATH --collection-1 PATH ... --collection-5 PATH --review-1 PATH --review-2 PATH --review-3 PATH --date YYYY-MM-DD --attempt 1 --output EMPTY_NEW_DIRECTORY`. 원본이나 검증에 변경이 있으면 기존 출력 디렉터리를 재사용하지 않고 새 attempt/manifest부터 시작한다. CLI는 schema 5.1 검증이 끝난 뒤에만 새 디렉터리를 완성한다.
