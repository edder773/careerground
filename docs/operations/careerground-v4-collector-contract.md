# CareerGround v4 수집기 호환 계약

2026-08-28에 제공받은 기존 ChatGPT 예약 수집기 3개, 수동 Pro 병합·검증기, Work DB 반영기의 실제 입출력 계약을 v5 전환용으로 정리한다. 원문 채팅 제목이나 File Library 검색 결과는 런타임 식별자로 사용하지 않는다.

## 기존 실행 구조

1. ChatGPT 예약 작업 3개가 평일 18:00 Asia/Seoul에 독립 실행된다.
2. 각 작업은 기존 final을 기준선으로 읽고 SHA-256 기반 bucket 하나와 지정 출처를 담당한다.
3. 수동 ChatGPT Pro 검증기가 세 결과를 병합해 final과 merge audit을 생성한다.
4. ChatGPT Work 작업이 final과 audit을 읽어 D1 migration을 생성·배포한다.

Pro 검증기는 예약 작업이 아니며, v5 전환에서 예약 여부는 계약 요소가 아니다.

## 출처와 소유권

실행 가능한 단일 설정은 `config/careerground-partition-sources.json`이다. 총 17개 출처를 6/6/5로 나누고 기존 공고는 `SHA256(id) % 3`으로 소유한다. 출처 접근 실패는 신규 0건으로 바꾸지 않고 coverage 제한 또는 `RETAINED_UNCONFIRMED`로 남긴다.

## v4 bundle 입력

호환 adapter는 사용자가 명시한 다음 다섯 경로만 읽는다.

- `careerground-partition-1-YYYY-MM-DD.json`
- `careerground-partition-2-YYYY-MM-DD.json`
- `careerground-partition-3-YYYY-MM-DD.json`
- `careerground-jobs-live-YYYY-MM-DD-final.json`
- `careerground-merge-audit-YYYY-MM-DD.json`

파일명 검색, `modified_at`, latest/final 추론, 채팅 제목, 최근 대화는 사용하지 않는다. 다운로드 접미사는 보고용 표시명에서만 정규화한다.

## 검증

`jobs:v5:adapt-v4`는 다음을 모두 확인해야 변환한다.

- 세 partition의 v4 canonical hash와 원본 bytes hash가 audit과 일치
- 동일한 as-of date, legacy runGroupKey, baseline canonical hash
- partition quality gate가 PASS 계열이고 blocking error가 없음
- audit input/output gate가 PASS이고 downstream eligibility가 ELIGIBLE
- final 원본 bytes/canonical SHA-256, rowCount, statusCounts가 audit과 일치
- final의 id, canonical URL, fingerprint가 각각 고유
- `tech_stack`이 JSON 문자열 배열

변환 결과는 v5 `runId`, `runGroupKey`, `workflowId`, `schemaVersion`을 갖는 partition artifact 3개와 compatibility report다. 기존 final 행은 기존 소유권 알고리즘으로 다시 나누므로 v5 merge 시 정확히 한 번만 나타난다.

## 안전 경계

호환 변환은 운영 DB, Scheduled Task, File Library, Slack을 변경하지 않는다. 원본 운영 JSON은 저장소에 커밋하지 않고, 테스트에는 비식별 생성 fixture만 사용한다. 실제 게시에는 운영 기준선 조회, migration 승인, PUBLISH 승인이 별도로 필요하다.
