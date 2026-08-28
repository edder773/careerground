# CareerGround 채용 자동화 v5 운영 Runbook

## 목적과 불변식

v5의 운영 기준은 채팅, 파일명, 최근 수정 시각이 아니라 D1의 `workflow_runs`와 검증된 Manifest다. `workflowId`는 `CG-JOBS-PROD-V5`, Schema는 `5.0`, 시간대는 `Asia/Seoul`이다. 날짜별 `runGroupKey`는 `CG-YYYY-MM-DD`이며 재시도는 같은 key와 target date를 유지하고 `runId`, `attempt`만 바꾼다.

운영 수집 목표는 평일 18:00다. 현재 workflow는 전환 승인 전이라 schedule이 없고 수동 DRY_RUN만 안전하게 동작한다. 실제 파티션 수집기는 저장소 밖에 있어 연결 전까지 PUBLISH는 fail-closed다.

## 단계별 계약

1. `preflight`: 실행 ID, 모드, 날짜, 공휴일 캐시를 검증한다. 주말/공휴일은 각각 별도 skip 상태다.
2. `collect`: 파티션 1·2·3의 명시적 artifact 경로만 받는다. 파일명이나 최신 파일을 찾지 않는다.
3. `merge`: 세 파티션의 workflow/run group/date/schema/hash/rowCount를 다시 검사하고 canonical key, URL, fingerprint, id를 중복 제거한다. 새 공고를 검색하지 않는다.
4. `validate`: CareerGround 정책과 임계값을 적용한다. DB나 Slack을 변경하지 않는다.
5. `stage`: VERIFIED 결과를 `workflow_staged_jobs`에 넣고 before-image를 보존한다.
6. `publish`: PUBLISH 모드와 승인된 VERIFIED run만 D1 atomic batch로 반영한다. `jobs` DELETE와 `saved_jobs` mutation은 없다.
7. `notify`: DB가 기록한 마지막 PUBLISHED 실행만 사용한다. 수집·상태 재판정을 하지 않는다. 현재 전환 브랜치는 Slack 전송을 하지 않고 상태 artifact만 남긴다.

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
pnpm jobs:v5:dry-run
pnpm jobs:v5:run --target-as-of-date 2026-08-27 --run-id CG-2026-08-27-A1-example1 \
  --partition1 /explicit/partition-1.json \
  --partition2 /explicit/partition-2.json \
  --partition3 /explicit/partition-3.json \
  --baseline /explicit/baseline.json
```

`publish`는 `--manifest`와 `--approved-run-id`를 모두 요구하며, CLI 자체는 production binding 없이 DB를 변경하지 않는다. 승인된 배포 adapter가 `deployment/sites/d1-jobs-v5.ts`의 `stageVerifiedRun`, `publishVerifiedRun`을 호출해야 한다.

## 관측과 성공 판정

- `current`: 가장 최근 시도이며 실패/격리도 가리킬 수 있다.
- `last-success`: 오직 `PUBLISHED`만 가리킨다.
- `SUCCESS_NO_CHANGES`: 3개 partition, merge, schema, 정책, baseline 비교가 모두 성공하고 new/change/end/quarantine이 0일 때만 가능하다.
- Slack 실패는 게시를 되돌리지 않고 notification retry pending으로 남긴다.

## 보안

artifact, 로그, 문서에 Secret, webhook, 운영 row를 남기지 않는다. production environment 승인과 최소 권한 Secrets가 없으면 publish는 중단한다.
