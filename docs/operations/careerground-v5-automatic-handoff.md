# CareerGround v5 자동 전달 연결

## 목표와 경계

ChatGPT 예약 작업의 신규 후보 결과를 로컬 다운로드나 저장소 커밋 없이 GitHub Actions로 넘기고, 검증을 통과한 신규 ACTIVE 공고만 운영 D1에 반영한다. 일일 실행은 Sites를 다시 배포하지 않으며 `saved_jobs`, 기존 `jobs`, Slack을 변경하지 않는다.

ChatGPT 예약 작업은 연결 도구를 사용할 수 있지만 로컬 프로젝트 폴더를 직접 읽거나 쓸 수 없다. 따라서 GitHub 연결 도구가 생성한 **커밋에 연결되지 않은 임시 Git blob**을 본문 저장소로 사용하고, GitHub Issue에는 blob SHA와 무결성 정보만 기록한다.

## 흐름

1. 파티션 예약 작업 3개가 기준선 없이 담당 출처의 신규 후보만 조사해 `CAREERGROUND_DISCOVERY_DELTA` JSON을 만든다.
2. 각 작업은 GitHub 연결 도구로 JSON 문자열을 blob 하나로 만든다. SHA-256, byteLength, 최종 ID와 fingerprint는 계산하지 않는다.
3. 작업은 `careerground-v5-handoff` 라벨의 Issue를 만들고 아래 schema 2.0 포인터만 본문에 기록한다. JSON 본문은 Issue나 저장소 파일로 복제하지 않는다.
4. `.github/workflows/careerground-v5-handoff.yml`이 같은 날짜의 파티션 포인터 3개를 모은다. 하나라도 없으면 `WAITING` 보고서만 남긴다.
5. 모두 모이면 GitHub Actions가 blob 크기, SHA-256, UTF-8 JSON, 출처 소유권, 상태·경력 정책, 날짜, 중복을 검증하고 최종 ID와 fingerprint를 결정적으로 생성한다.
6. GitHub Actions가 `CAREERGROUND_PUBLISH_TOKEN`으로 Sites의 `/api/v1/internal/jobs-v5/publish`를 호출한다. 서버는 현재 KST 날짜, deterministic runId, ID·URL·canonical key·fingerprint, 신입 증거, 미래 마감일을 다시 검증한다.
7. 서버는 운영 D1 기준선과 대조해 완전히 동일한 기존 URL은 건너뛰고, 새 URL의 ID·canonical key·fingerprint 충돌은 fail-closed 처리한다. 신규 공고만 최대 75건까지 stage/publish하며 기존 행 UPDATE·DELETE와 `saved_jobs` mutation은 허용하지 않는다.
8. PUBLISHED run, `jobs-v5` import batch, `last-success` pointer와 사후 row count 검증이 모두 성공한 뒤에만 세 Issue를 처리 완료로 닫는다. 검증 bundle과 publish receipt는 30일 보관한다.
9. 게시 성공 이벤트가 Slack workflow를 깨우며 08:01~10:30 KST window 안이면 즉시 같은 delivery claim을 시도한다. 그 밖에는 다음 평일 08:01 fallback이 `jobs-v5` COMMITTED 기록을 준비 신호로 사용한다. 신규 공고가 0건이어도 코딩테스트 알림은 정상 전송할 수 있다.

## 보안과 멱등성

- Issue 작성자의 GitHub `author_association`이 `OWNER`, `MEMBER`, `COLLABORATOR` 중 하나여야 한다.
- 허용 필드 외의 포인터 값, 잘못된 파일명, 1MB 초과 payload, 같은 attempt의 충돌은 fail-closed 처리한다.
- schema 2.0은 예약 작업이 hash·파일시스템 실행 서비스에 의존하지 않도록 raw SHA-256과 byteLength를 포인터에서 제거한다. 수신자가 blob을 내려받은 뒤 두 값을 계산한다.
- 같은 종류가 재실행되면 가장 큰 `attempt`만 사용한다. 같은 attempt가 서로 다른 blob을 가리키면 자동 선택하지 않는다.
- workflow 권한은 `contents: read`, `issues: write`뿐이다.
- 실제 JSON은 커밋·PR·Issue 본문에 저장하지 않는다.
- workflow에는 별도 cron, Sites 재배포, Slack webhook 호출이 없다. D1 publish만 보호된 HTTPS endpoint로 수행하고, 성공 뒤 digest workflow에 멱등성 wake-up 이벤트만 보낸다.
- `runId=CG-YYYY-MM-DD-A<attempt>-discovery`는 날짜와 attempt로 결정적이다. 같은 입력 재실행은 `ALREADY_PUBLISHED`, 같은 runId의 다른 입력은 실패한다.

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

| artifactKind  | 파일명                                     |
| ------------- | ------------------------------------------ |
| `PARTITION_1` | `careerground-partition-1-YYYY-MM-DD.json` |
| `PARTITION_2` | `careerground-partition-2-YYYY-MM-DD.json` |
| `PARTITION_3` | `careerground-partition-3-YYYY-MM-DD.json` |

## 파티션 예약 작업에 추가할 전달 지시문

각 PARTITION 프롬프트는 `careerground-v5-stable-collector-prompts.md`의 기준선 비의존 프롬프트로 교체한다. `N`은 해당 작업의 파티션 번호다.

```text
자동 전달: GitHub 연결 도구를 사용해 edder773/careerground로 결과를 전달하라. 완성된 careerground-partition-N-YYYY-MM-DD.json의 전체 UTF-8 JSON 문자열로 GitHub create_blob을 encoding=utf-8로 한 번 호출해 커밋에 연결되지 않은 blob을 만들고 반환된 40자리 SHA를 기록한다. 예약 작업에서 SHA-256이나 byteLength를 계산하지 않는다. 저장소 파일을 생성·수정하거나 JSON 내용을 Issue 본문에 넣지 마라.

그 다음 제목이 [CG-JOBS-V5][YYYY-MM-DD][PARTITION_N][A1]인 Issue를 만들고 careerground-v5-handoff 라벨을 붙인다. 본문에는 문서 docs/operations/careerground-v5-automatic-handoff.md의 schemaVersion=2.0 CAREERGROUND_V5_HANDOFF JSON 주석만 넣는다. artifactKind는 PARTITION_N, attempt는 1, fileName은 원본 정규 파일명으로 한다. blob 생성 또는 Issue 생성이 실패하면 자동 전달 성공으로 보고하지 말고 결과 JSON은 채팅 응답에도 남긴다.
```

같은 날짜를 다시 수집하면 `attempt`와 제목의 `A` 번호를 함께 1씩 올린다. 이전 Issue를 수정하거나 삭제하지 않는다.

## 현재 활성화 범위

schema 2.0 연결은 유일한 운영 인입이다. 신규 후보 자동 수신, 결정적 정규화, 출처·정책·중복 검증, 운영 기준선 대조, D1 신규 INSERT와 게시 원장 기록까지 활성화한다. schema 1.0과 v4 final/audit 포인터는 수신 단계에서 거부한다. `VERIFIED_DISCOVERY`는 중간 검증 상태이며 최종 성공은 endpoint receipt의 `PUBLISHED` 또는 동일 입력 재실행의 `ALREADY_PUBLISHED`다. 이 workflow는 Slack webhook을 직접 호출하지 않고 게시 성공 이벤트로 기존 digest workflow를 깨운다.
