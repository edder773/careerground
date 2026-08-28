# CareerGround 채용 자동화 v5 운영 Runbook

## 목적과 불변식

v5의 운영 기준은 채팅, 파일명, 최근 수정 시각이 아니라 D1의 `workflow_runs`와 검증된 Manifest다. `workflowId`는 `CG-JOBS-PROD-V5`, Schema는 `5.0`, 시간대는 `Asia/Seoul`이다. 날짜별 `runGroupKey`는 `CG-YYYY-MM-DD`이며 재시도는 같은 key와 target date를 유지하고 `runId`, `attempt`만 바꾼다.

운영 수집 목표는 평일 18:00다. 실제 웹 수집은 저장소 밖의 ChatGPT 예약 작업 3개가 수행하고, GitHub Issue handoff가 세 결과를 모아 검증·게시한다. 저장소의 `careerground-jobs-v5.yml`은 fixture DRY_RUN 회귀용 pre-cutover workflow로 유지한다.

## 단계별 계약

1. `preflight`: 실행 ID, 모드, 날짜, 공휴일 캐시를 검증한다. 주말/공휴일은 각각 별도 skip 상태다.
2. `collect`: 신규 예약 수집기는 기준선 비의존 schema 5.1 discovery delta를 Git blob으로 전달한다. GitHub가 세 명시적 blob을 받은 뒤 hash·크기·출처 소유권을 검증하고 v5 partition 입력으로 정규화한다. 파일명이나 최신 Library 파일을 찾지 않는다.
3. `merge`: 세 파티션의 workflow/run group/date/schema/hash/rowCount를 다시 검사하고 canonical key, URL, fingerprint, id를 중복 제거한다. 새 공고를 검색하지 않는다.
4. `validate`: CareerGround 정책과 임계값을 적용한다. DB나 Slack을 변경하지 않는다.
5. `stage`: VERIFIED 결과를 `workflow_staged_jobs`에 넣고 before-image를 보존한다.
6. `publish`: PUBLISH 모드와 승인된 VERIFIED run만 D1 atomic batch로 반영한다. `jobs` DELETE와 `saved_jobs` mutation은 없다.
7. `notify`: v5 게시 단계는 Slack을 직접 전송하지 않는다. 다음 날 기존 08:01 digest가 당일 `jobs-v5` COMMITTED 기록과 DB의 신규 `created_at` window를 소비한다.

## canonical JSON

- object key는 Unicode 문자열 순으로 정렬하고 UTF-8 단일행 JSON으로 직렬화한다.
- `sources`, `techStack`, `tags`, `excludedReasons`는 의미 없는 순서로 선언되어 canonical 값 기준 정렬한다.
- `items`는 `canonicalJobKey`, 없으면 `id`로 정렬한다.
- 그 외 배열 순서는 보존한다.
- `undefined`만 제외하며 타임스탬프 같은 metadata는 계약에서 volatile로 선언하지 않았으므로 포함한다.
- 원본 바이트 hash와 canonical hash를 모두 보존한다.

다운로드 이름의 `(1)`, ` (2)`, `(3)(1)`은 화면 표시명에서만 제거한다. partitionId는 JSON 내부 metadata와 Manifest로만 결정한다.

## 품질 게이트

임계값은 `config/careerground-validation-policy.json`에 있다. 각 partition 최소 1행, 기존 ACTIVE 대비 35% 초과 급감, 종료 20건 또는 20% 초과, 허용 필드 변경 80개 초과, 지원 도메인 변경 10개 초과, 출처별 50% 초과 감소를 보수적 이상 징후로 격리한다. 이는 초기 안전값으로 운영 관측치가 없어서 개선율을 수치화할 수 없다. 정상 PUBLISHED 표본을 축적한 뒤 PR로 조정한다.

## 명령

```bash
pnpm jobs:v5:adapt-v4 --target-as-of-date YYYY-MM-DD \
  --run-id CG-YYYY-MM-DD-A1-example1 \
  --partition1 /explicit/partition-1.json \
  --partition2 /explicit/partition-2.json \
  --partition3 /explicit/partition-3.json \
  --final /explicit/final.json \
  --audit /explicit/merge-audit.json \
  --output /explicit/non-production-output

pnpm jobs:v5:dry-run
pnpm jobs:v5:run --target-as-of-date 2026-08-27 --run-id CG-2026-08-27-A1-example1 \
  --partition1 /explicit/partition-1.json \
  --partition2 /explicit/partition-2.json \
  --partition3 /explicit/partition-3.json \
  --baseline /explicit/baseline.json
```

`adapt-v4`는 전달된 다섯 파일만 읽고 원본/canonical hash와 audit gate를 검증한다. Library를 검색하지 않으며 DB·Slack을 변경하지 않는다. 자세한 계약은 `careerground-v4-collector-contract.md`를 따른다.

신규 예약 수집기 결과는 다음 명령과 같은 검증 경로를 사용한다.

```bash
pnpm jobs:v5:validate-discovery --target-as-of-date YYYY-MM-DD \
  --run-id CG-YYYY-MM-DD-A1-discovery \
  --partition1 /explicit/partition-1.json \
  --partition2 /explicit/partition-2.json \
  --partition3 /explicit/partition-3.json \
  --output /explicit/non-production-output
```

이 명령은 최종 `id`, `canonicalJobKey`, `fingerprint`, raw/canonical hash를 GitHub 실행 환경에서 생성한다. `rowCount=0`은 정상적인 신규 후보 없음으로 허용하며, 한 출처의 BLOCKED/ERROR는 다른 출처 결과를 폐기하지 않는다. 결과는 중간 상태 `VERIFIED_DISCOVERY`이며 handoff workflow가 보호된 endpoint를 호출한 뒤에만 `PUBLISHED`가 된다.

`jobs:v5:publish-discovery`는 token을 환경변수에서만 읽고 검증 bundle을 Sites endpoint에 전송한다. endpoint는 같은 bundle 재실행을 `ALREADY_PUBLISHED`로 처리하고, 같은 runId의 다른 bundle·기존 fingerprint/canonical key 충돌·75건 초과 신규 삽입을 거부한다.

## 관측과 성공 판정

- `current`: 가장 최근 시도이며 실패/격리도 가리킬 수 있다.
- `last-success`: 오직 `PUBLISHED`만 가리킨다.
- `SUCCESS_NO_CHANGES`: 3개 partition, merge, schema, 정책, baseline 비교가 모두 성공하고 new/change/end/quarantine이 0일 때만 가능하다.
- Slack 실패는 게시를 되돌리지 않고 notification retry pending으로 남긴다.

## 보안

artifact, 로그, 문서에 Secret, webhook, 운영 row를 남기지 않는다. Sites `PUBLISH_API_TOKEN`과 GitHub `CAREERGROUND_PUBLISH_TOKEN`이 없거나 일치하지 않으면 publish는 중단하고 Issue를 닫지 않는다.
