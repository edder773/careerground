# CareerGround v5 자동 전달 연결

## 목표와 경계

ChatGPT 예약 작업과 수동 Pro 검증기의 결과를 로컬 다운로드나 저장소 커밋 없이 GitHub Actions 검증 단계로 넘긴다. 전달 계층은 운영 `jobs`, `saved_jobs`, Sites 배포, Slack을 변경하지 않는다.

ChatGPT 예약 작업은 연결 도구를 사용할 수 있지만 로컬 프로젝트 폴더를 직접 읽거나 쓸 수 없다. 따라서 GitHub 연결 도구가 생성한 **커밋에 연결되지 않은 임시 Git blob**을 본문 저장소로 사용하고, GitHub Issue에는 blob SHA와 무결성 정보만 기록한다.

## 흐름

1. 파티션 예약 작업 3개가 각각 기존 v4 JSON을 완성한다.
2. 각 작업은 JSON 원본 바이트의 SHA-256과 크기를 계산하고 GitHub 연결 도구로 `edder773/careerground`에 blob을 하나 생성한다.
3. 작업은 `careerground-v5-handoff` 라벨의 Issue를 만들고 아래 포인터 계약만 본문에 기록한다. JSON 본문은 Issue나 저장소 파일로 복제하지 않는다.
4. 수동 Pro 검증기도 같은 방식으로 final과 audit blob 및 포인터 Issue를 각각 만든다.
5. `.github/workflows/careerground-v5-handoff.yml`이 같은 날짜의 5개 포인터를 모은다. 하나라도 없으면 `WAITING` 보고서만 남긴다.
6. 모두 모이면 blob 원본의 바이트 수, SHA-256, UTF-8 JSON 여부를 확인하고 기존 v4 audit의 raw/canonical hash와 품질 게이트를 다시 검증한다.
7. 검증된 v5 호환 파티션과 보고서만 30일 GitHub Actions artifact로 보관하고 5개 Issue에 처리 완료 라벨을 붙인 뒤 `completed` 상태로 닫는다.

## 보안과 멱등성

- Issue 작성자의 GitHub `author_association`이 `OWNER`, `MEMBER`, `COLLABORATOR` 중 하나여야 한다.
- 허용 필드 외의 포인터 값, 잘못된 파일명, 1MB 초과 payload, SHA 불일치, 같은 attempt의 충돌은 fail-closed 처리한다.
- 같은 종류가 재실행되면 가장 큰 `attempt`만 사용한다. 같은 attempt가 서로 다른 blob을 가리키면 자동 선택하지 않는다.
- workflow 권한은 `contents: read`, `issues: write`뿐이다.
- 실제 JSON은 커밋·PR·Issue 본문에 저장하지 않는다.
- workflow에는 cron, D1 publish, Sites 배포, Slack 전송이 없다.

## 포인터 계약

Issue 제목은 사람이 식별하기 위한 값이며 실행 식별자로 사용하지 않는다. 예시는 다음과 같다.

```text
[CG-JOBS-V5][2026-08-28][PARTITION_1][A1]
```

Issue 본문에는 다음 주석 블록 하나만 넣는다.

```html
<!-- CAREERGROUND_V5_HANDOFF
{"schemaVersion":"1.0","workflowId":"CG-JOBS-PROD-V5","targetAsOfDate":"2026-08-28","artifactKind":"PARTITION_1","attempt":1,"blobSha":"<GitHub create_blob 결과의 40자리 SHA>","rawSha256":"<JSON 원본 바이트 SHA-256>","byteLength":201204,"fileName":"careerground-partition-1-2026-08-28.json"}
-->
```

`artifactKind`와 파일명 조합은 다음 다섯 개만 허용한다.

| artifactKind   | 파일명                                         |
| -------------- | ---------------------------------------------- |
| `PARTITION_1`  | `careerground-partition-1-YYYY-MM-DD.json`     |
| `PARTITION_2`  | `careerground-partition-2-YYYY-MM-DD.json`     |
| `PARTITION_3`  | `careerground-partition-3-YYYY-MM-DD.json`     |
| `LEGACY_FINAL` | `careerground-jobs-live-YYYY-MM-DD-final.json` |
| `LEGACY_AUDIT` | `careerground-merge-audit-YYYY-MM-DD.json`     |

## 파티션 예약 작업에 추가할 전달 지시문

각 PARTITION 프롬프트의 파일 생성 완료 단계 뒤에 아래 내용을 추가한다. `N`은 해당 작업의 파티션 번호다.

```text
자동 전달: GitHub 연결 도구를 사용해 edder773/careerground로 결과를 전달하라. 완성된 careerground-partition-N-YYYY-MM-DD.json의 실제 전체 UTF-8 원본 바이트를 대상으로 SHA-256과 byteLength를 계산한다. GitHub create_blob을 encoding=utf-8로 한 번 호출해 커밋에 연결되지 않은 blob을 만들고 반환된 40자리 SHA를 기록한다. 저장소 파일을 생성·수정하거나 JSON 내용을 Issue 본문에 넣지 마라.

그 다음 제목이 [CG-JOBS-V5][YYYY-MM-DD][PARTITION_N][A1]인 Issue를 만들고 careerground-v5-handoff 라벨을 붙인다. 본문에는 문서 docs/operations/careerground-v5-automatic-handoff.md의 CAREERGROUND_V5_HANDOFF JSON 주석만 넣는다. artifactKind는 PARTITION_N, attempt는 1, fileName은 원본 정규 파일명으로 한다. blob 생성 또는 Issue 생성이 실패하면 자동 전달 성공으로 보고하지 말고 파일 산출물은 그대로 보존하라.
```

같은 날짜를 다시 수집하면 `attempt`와 제목의 `A` 번호를 함께 1씩 올린다. 이전 Issue를 수정하거나 삭제하지 않는다.

## Pro 병합·검증기에 추가할 전달 지시문

final과 audit을 모두 생성하고 자체 무결성 검증이 PASS인 뒤에만 다음 내용을 실행한다.

```text
자동 전달: GitHub 연결 도구를 사용해 edder773/careerground로 final과 audit을 각각 독립 전달하라. 각 파일의 실제 전체 UTF-8 원본 바이트에 대해 SHA-256과 byteLength를 계산하고 GitHub create_blob을 encoding=utf-8로 호출한다. 저장소 파일을 생성·수정하거나 JSON 내용을 Issue 본문에 넣지 마라.

final은 artifactKind=LEGACY_FINAL, audit은 artifactKind=LEGACY_AUDIT로 하여 [CG-JOBS-V5][YYYY-MM-DD][ARTIFACT_KIND][A1] Issue를 각각 만들고 careerground-v5-handoff 라벨을 붙인다. 각 본문에는 docs/operations/careerground-v5-automatic-handoff.md의 CAREERGROUND_V5_HANDOFF JSON 주석만 넣는다. 두 전달 중 하나라도 실패하면 자동 전달 완료로 보고하지 마라.
```

## 현재 활성화 범위

이 연결은 v4 결과의 자동 수신과 v5 호환 검증 artifact 생성까지만 활성화한다. 운영 D1 반영과 Slack은 별도의 `PUBLISH` 승인 및 전환 게이트 뒤에 둔다. 따라서 연결 성공은 운영 공고 게시 성공을 의미하지 않는다.
