# CareerGround v5 운영 인입

이 문서는 [20:00·20:30 HQ 실행 계약](./job-alert-hq-two-wakes.md)이 검증을 마친 뒤 사용하는 유일한 GitHub→운영 DB 경로를 설명한다. 기존 수집 Chat 5개는 Drive에 원본을 보존하며 GitHub 인입을 직접 호출하지 않는다. 실제 Chat R1/R2/R3의 보고서와 원본을 고정 코드가 대조해 만든 운영 schema 5.1 파티션 3개만 전달한다. 검증 역할 3개와 운영 파티션 3개는 서로 다른 단위다.

HQ는 동일 날짜·attempt·bundleId의 세 파티션을 먼저 모두 검증하고 Drive `04_Final`에 저장·읽기 확인한다. 게시 직전에 당일·영업일·현재 마감·최신 DB/SENT·원본 해시·승인된 Slack workflow 상태를 다시 확인한다. 동일 날짜·attempt·bundleId의 GitHub Issue를 조회해 이미 전송됐으면 재생성하지 않고, 같은 키의 다른 내용은 차단한다.

각 파티션의 전체 UTF-8 JSON은 `edder773/careerground`의 임시 Git blob으로 만든다. 실제 반환된 40자리 blob SHA를 schema 2.0 포인터의 `blobSha`에 넣는다. 원본 JSON을 저장소 파일이나 Issue 본문에 복제하지 않는다. 세 blob이 모두 준비되고 같은 `bundleId`임을 확인한 뒤에만 `careerground-v5-handoff` 라벨의 Issue 3개를 만든다. 제목은 `[CG-JOBS-V5][YYYY-MM-DD][PARTITION_N][A1]` 형식이다.

Issue 본문에는 다음 JSON 주석 하나만 넣는다. `N`은 1~3이고, `bundleId`는 세 포인터와 세 blob에 동일해야 한다.

```html
<!-- CAREERGROUND_V5_HANDOFF
{"schemaVersion":"2.0","workflowId":"CG-JOBS-PROD-V5","targetAsOfDate":"YYYY-MM-DD","artifactKind":"PARTITION_N","attempt":1,"blobSha":"<실제 Git blob SHA>","fileName":"careerground-partition-N-YYYY-MM-DD.json","bundleId":"<64자리 SHA-256>"}
-->
```

`.github/workflows/careerground-v5-handoff.yml`은 세 포인터를 모아 blob 크기·SHA-256·UTF-8 JSON·출처 소유권·스키마·날짜·중복을 검사한다. 같은 attempt의 상충 포인터는 자동 선택하지 않는다. 신뢰된 저장소 작성자와 지정 라벨만 받는다. GitHub Actions가 `CAREERGROUND_PUBLISH_TOKEN`으로 보호된 Sites `/api/v1/internal/jobs-v5/publish`를 호출한다. 운영 서버는 최신 DB를 대조해 신규 공고만 INSERT하고 기존 `jobs`, `saved_jobs`, 발송 원장을 수정·삭제하지 않는다. 같은 입력의 재호출은 기존 멱등 키로 처리하며 다른 입력 충돌은 실패한다.

Issue 제출이나 Actions 시작은 DB 성공이 아니다. 기존 DB 또는 같은 입력 묶음의 다른 후보와 내용 지문이 충돌하면 해당 후보만 제외하고 `skippedFingerprintCollision`과 `skippedExisting`에 기록한다. 같은 URL·ID·canonical key 등 입력 자체의 식별자 충돌은 계속 전체 입력 오류로 차단한다. `PUBLISHED` 또는 동일입력 `ALREADY_PUBLISHED` 운영 영수증과 실제 반영 행 수를 읽어 확인한다. Slack 전송은 별도의 기존 `daily-slack-digest.yml`과 `daily:YYYY-MM-DD` claim이 담당한다. HQ는 Slack connector, 새 webhook, snapshot 재전송을 사용하지 않으며 `sent/already-sent` 영수증을 DB 영수증과 구분한다. 게시가 늦거나 실패하면 임의로 다음 날짜의 공고로 옮겨 전송하지 않는다.
