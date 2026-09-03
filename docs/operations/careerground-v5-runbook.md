# CareerGround 채용 자동화 운영 Runbook

## 단일 운영 경로

운영 채용공고는 schema 5.1 파티션 세 개를 schema 2.0 GitHub Issue 포인터로 전달하는 경로만
사용한다. v4 final/audit, File Library 선택, SQL 생성기, pre-cutover fixture workflow는 지원하지
않는다.

```text
ChatGPT 예약 수집 3개
  → 임시 Git blob + schema 2.0 Issue 포인터
  → careerground-v5-handoff.yml
  → discovery-delta 검증
  → 보호된 Sites publish API
  → 운영 D1
  → 다음 영업일 Slack digest
```

운영 식별자는 `workflowId=CG-JOBS-PROD-V5`, `runGroupKey=CG-YYYY-MM-DD`,
`runId=CG-YYYY-MM-DD-A<attempt>-discovery`다. 재시도는 같은 날짜에서 `attempt`만 증가시킨다.

## 단계와 성공 조건

1. 세 예약 작업이 각 담당 출처를 조사해 `CAREERGROUND_DISCOVERY_DELTA`를 만든다.
2. 각 작업은 커밋에 연결되지 않은 Git blob과 `PARTITION_1`~`PARTITION_3` 포인터 Issue를 만든다.
3. handoff workflow는 세 포인터가 모일 때까지 `WAITING`하고, 완성된 묶음만 내려받는다.
4. GitHub Actions가 blob 크기·SHA-256·UTF-8 JSON·날짜·출처 소유권·enum·중복을 검증한다.
5. 검증 결과가 `VERIFIED_DISCOVERY`일 때만 `CAREERGROUND_PUBLISH_TOKEN`으로 운영 API를 호출한다.
6. 서버는 운영 기준선과 다시 대조해 신규 `ACTIVE`만 최대 75건까지 원자 반영한다.
7. 게시 원장과 사후 건수 검증이 끝난 `PUBLISHED` 또는 같은 입력의 `ALREADY_PUBLISHED`만 성공이다.
8. 성공한 Issue는 처리 완료로 닫고 `jobs-v5-published` 이벤트로 기존 Slack digest를 깨운다.

파티션 하나가 없으면 게시하지 않는다. 같은 attempt가 다른 blob을 가리키거나 새 URL이 기존 ID,
canonical key, fingerprint와 충돌하면 전체 묶음을 fail-closed 처리한다. 기존 `jobs` UPDATE·DELETE와
모든 `saved_jobs` mutation은 허용하지 않는다.

## 로컬 검증

```bash
pnpm jobs:v5:validate-discovery --target-as-of-date YYYY-MM-DD \
  --run-id CG-YYYY-MM-DD-A1-discovery \
  --partition1 /explicit/partition-1.json \
  --partition2 /explicit/partition-2.json \
  --partition3 /explicit/partition-3.json \
  --output /explicit/non-production-output
```

`rowCount=0`은 유효하다. 한 출처가 `BLOCKED` 또는 `ERROR`여도 다른 출처 결과를 버리지 않지만,
출처별 coverage와 오류는 산출물에 남아야 한다. 이 명령은 DB와 Slack을 변경하지 않는다.

## 장애 처리

- `WAITING`: 누락된 파티션만 같은 날짜와 더 큰 attempt로 다시 제출한다.
- `HANDOFF_*`: Issue 포인터의 허용 필드, 날짜, blob SHA, 파일명을 확인한다.
- `FAILED_DISCOVERY`: 산출물의 enum, 출처 소유권, 날짜, 중복 보고를 수정해 세 파티션을 다시 제출한다.
- `PUBLISH_*`: 입력을 임의 수정하지 말고 publish receipt와 열린 운영 경보 Issue를 확인한다.
- Slack 실패: 게시를 되돌리지 않는다. `daily:YYYY-MM-DD` claim과 digest 경보를 확인한다.

Secret은 로그·artifact·문서에 남기지 않는다. `CAREERGROUND_PUBLISH_TOKEN`,
`CAREERGROUND_DIGEST_TOKEN`, `SLACK_WEBHOOK_URL`은 서로 재사용하지 않는다.

상세 포인터 계약은 `careerground-v5-automatic-handoff.md`, 수집 계약은
`careerground-v5-stable-collector-prompts.md`, Slack 복구는 `slack-daily-digest.md`를 따른다.
