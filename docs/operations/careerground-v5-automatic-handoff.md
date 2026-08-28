# CareerGround v5 자동 전달 연결

## 목표와 경계

ChatGPT 예약 작업의 신규 후보 결과를 로컬 다운로드나 저장소 커밋 없이 GitHub Actions 검증 단계로 넘긴다. 전달 계층은 운영 `jobs`, `saved_jobs`, Sites 배포, Slack을 변경하지 않는다.

ChatGPT 예약 작업은 연결 도구를 사용할 수 있지만 로컬 프로젝트 폴더를 직접 읽거나 쓸 수 없다. 따라서 GitHub 연결 도구가 생성한 **커밋에 연결되지 않은 임시 Git blob**을 본문 저장소로 사용하고, GitHub Issue에는 blob SHA와 무결성 정보만 기록한다.

## 흐름

1. 파티션 예약 작업 3개가 기준선 없이 담당 출처의 신규 후보만 조사해 `CAREERGROUND_DISCOVERY_DELTA` JSON을 만든다.
2. 각 작업은 GitHub 연결 도구로 JSON 문자열을 blob 하나로 만든다. SHA-256, byteLength, 최종 ID와 fingerprint는 계산하지 않는다.
3. 작업은 `careerground-v5-handoff` 라벨의 Issue를 만들고 아래 schema 2.0 포인터만 본문에 기록한다. JSON 본문은 Issue나 저장소 파일로 복제하지 않는다.
4. `.github/workflows/careerground-v5-handoff.yml`이 같은 날짜의 파티션 포인터 3개를 모은다. 하나라도 없으면 `WAITING` 보고서만 남긴다.
5. 모두 모이면 GitHub Actions가 blob 크기, SHA-256, UTF-8 JSON, 출처 소유권, 상태·경력 정책, 날짜, 중복을 검증하고 최종 ID와 fingerprint를 결정적으로 생성한다.
6. 검증된 discovery bundle과 보고서만 30일 GitHub Actions artifact로 보관하고 세 Issue에 처리 완료 라벨을 붙인 뒤 `completed` 상태로 닫는다.
7. 수동 Pro 검증과 운영 DB 반영은 이 discovery artifact를 후속 입력으로 사용한다. 예약 작업은 운영 기준선 또는 전체 final을 읽지 않는다.

## 보안과 멱등성

- Issue 작성자의 GitHub `author_association`이 `OWNER`, `MEMBER`, `COLLABORATOR` 중 하나여야 한다.
- 허용 필드 외의 포인터 값, 잘못된 파일명, 1MB 초과 payload, 같은 attempt의 충돌은 fail-closed 처리한다.
- schema 2.0은 예약 작업이 hash·파일시스템 실행 서비스에 의존하지 않도록 raw SHA-256과 byteLength를 포인터에서 제거한다. 수신자가 blob을 내려받은 뒤 두 값을 계산한다.
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
{"schemaVersion":"2.0","workflowId":"CG-JOBS-PROD-V5","targetAsOfDate":"2026-08-28","artifactKind":"PARTITION_1","attempt":1,"blobSha":"<GitHub create_blob 결과의 40자리 SHA>","fileName":"careerground-partition-1-2026-08-28.json"}
-->
```

schema 2.0에서 `artifactKind`와 파일명 조합은 다음 세 개만 허용한다.

| artifactKind                                                                                                    | 파일명                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `PARTITION_1`                                                                                                   | `careerground-partition-1-YYYY-MM-DD.json` |
| `PARTITION_2`                                                                                                   | `careerground-partition-2-YYYY-MM-DD.json` |
| `PARTITION_3`                                                                                                   | `careerground-partition-3-YYYY-MM-DD.json` |
| schema 1.0의 기존 5파일 v4 호환 전달은 회귀와 롤백 목적으로 계속 허용하지만 신규 예약 작업에는 사용하지 않는다. |

## 파티션 예약 작업에 추가할 전달 지시문

각 PARTITION 프롬프트는 `careerground-v5-stable-collector-prompts.md`의 기준선 비의존 프롬프트로 교체한다. `N`은 해당 작업의 파티션 번호다.

```text
자동 전달: GitHub 연결 도구를 사용해 edder773/careerground로 결과를 전달하라. 완성된 careerground-partition-N-YYYY-MM-DD.json의 전체 UTF-8 JSON 문자열로 GitHub create_blob을 encoding=utf-8로 한 번 호출해 커밋에 연결되지 않은 blob을 만들고 반환된 40자리 SHA를 기록한다. 예약 작업에서 SHA-256이나 byteLength를 계산하지 않는다. 저장소 파일을 생성·수정하거나 JSON 내용을 Issue 본문에 넣지 마라.

그 다음 제목이 [CG-JOBS-V5][YYYY-MM-DD][PARTITION_N][A1]인 Issue를 만들고 careerground-v5-handoff 라벨을 붙인다. 본문에는 문서 docs/operations/careerground-v5-automatic-handoff.md의 schemaVersion=2.0 CAREERGROUND_V5_HANDOFF JSON 주석만 넣는다. artifactKind는 PARTITION_N, attempt는 1, fileName은 원본 정규 파일명으로 한다. blob 생성 또는 Issue 생성이 실패하면 자동 전달 성공으로 보고하지 말고 결과 JSON은 채팅 응답에도 남긴다.
```

같은 날짜를 다시 수집하면 `attempt`와 제목의 `A` 번호를 함께 1씩 올린다. 이전 Issue를 수정하거나 삭제하지 않는다.

## 기존 Pro 병합·검증기

Pro 검증기는 더 이상 예약 작업의 Library 기준선이나 partition baseline hash를 전제로 하지 않는다. GitHub Actions의 `discovery-ready` artifact를 입력으로 받아 운영 기준선과 비교하고, 실제 DB 반영 전 final/audit을 생성한다. 기존 schema 1.0 final/audit 전달은 롤백 호환 경로로만 유지한다.

```text
자동 전달: GitHub 연결 도구를 사용해 edder773/careerground로 final과 audit을 각각 독립 전달하라. 각 파일의 실제 전체 UTF-8 원본 바이트에 대해 SHA-256과 byteLength를 계산하고 GitHub create_blob을 encoding=utf-8로 호출한다. 저장소 파일을 생성·수정하거나 JSON 내용을 Issue 본문에 넣지 마라.

final은 artifactKind=LEGACY_FINAL, audit은 artifactKind=LEGACY_AUDIT로 하여 [CG-JOBS-V5][YYYY-MM-DD][ARTIFACT_KIND][A1] Issue를 각각 만들고 careerground-v5-handoff 라벨을 붙인다. 각 본문에는 docs/operations/careerground-v5-automatic-handoff.md의 CAREERGROUND_V5_HANDOFF JSON 주석만 넣는다. 두 전달 중 하나라도 실패하면 자동 전달 완료로 보고하지 마라.
```

## 현재 활성화 범위

이 연결은 신규 후보의 자동 수신, 결정적 정규화, 출처·정책·중복 검증 artifact 생성까지만 활성화한다. 운영 기준선 대조, Pro 의미 검증, 운영 D1 반영과 Slack은 별도의 `PUBLISH` 승인 및 전환 게이트 뒤에 둔다. 따라서 `VERIFIED_DISCOVERY`는 수집 전달 성공을 뜻하며 운영 공고 게시 성공을 의미하지 않는다.
