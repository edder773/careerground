# CareerGround 기준선 비의존 예약 수집 프롬프트

## 목적

ChatGPT 예약 작업은 웹 조사와 근거 수집만 담당한다. 다음 작업은 예약 수집기에서 금지한다.

- ChatGPT File Library 또는 프로젝트 파일에서 전체 운영 기준선 찾기
- 대형 final JSON 전체 읽기, pagination, materialize, Python·파일시스템 실행
- SHA-256, byteLength, 최종 `id`, `fingerprint` 계산
- 기존 공고 상태 변경, 운영 DB 반영, Slack 전송

GitHub Actions가 세 파티션을 받은 뒤 원본 크기와 SHA-256을 계산하고, URL 정규화, 최종 ID·fingerprint 생성, 파티션 간 중복 검사를 수행한다. 이 분리는 File Library 또는 실행 서비스 장애가 신규 웹 조사를 막지 않게 한다.

## 파티션별 값

| 작업                | `N` | 담당 출처                                                           |
| ------------------- | --- | ------------------------------------------------------------------- |
| CareerGround 수집 1 | 1   | JobKorea, Wanted, Catch, Superookie, Career, Work24                 |
| CareerGround 수집 2 | 2   | Saramin, Jumpit, Inthiswork, Remember Career, RocketPunch, Incruit  |
| CareerGround 수집 3 | 3   | LinkedIn Korea, Jasoseol, Linkareer, JOB-ALIO, NCS Fair Recruitment |

## 공통 프롬프트

아래 텍스트에서 `N`과 `ASSIGNED_SOURCES`를 위 표에 맞춰 치환한다.

```text
CareerGround 신규 IT 채용 후보 PARTITION N을 독립 예약 작업으로 실행한다. 이 작업은 웹 조사와 근거 수집만 담당한다. 과거 대화, 메모리, ChatGPT File Library, 프로젝트 업로드 파일, 기존 final JSON을 읽거나 사실 근거로 사용하지 않는다. Python, 코드 실행, 로컬 파일시스템, 전체 기준선, canonical hash가 없어도 웹 조사를 시작하고 완료해야 한다. 작업 내부 오류가 발생해도 이 예약 또는 다른 예약을 비활성화·삭제·시간 변경하지 않는다.

[0. 실행 날짜]
Asia/Seoul의 오늘 날짜를 targetAsOfDate=YYYY-MM-DD로 사용한다. 예약은 월~금 18:00에 실행한다. 토요일·일요일 또는 대한민국 공휴일·대체공휴일임을 현재 정부·공공기관 자료로 확인한 경우에만 SKIPPED_HOLIDAY로 종료한다. 공휴일 확인 출처 한 곳이 실패하면 다른 공식 출처로 한 번 확인한다. 공휴일이 아님을 확인했거나 공휴일 근거가 없으면 수집을 계속한다.

[1. 담당 출처]
ASSIGNED_SOURCES만 신규 후보 목록 탐색 출처로 사용한다. 기업 공식 Careers, 공식 ATS, 기관 공식 채용 상세는 후보의 현재 상태와 지원 자격을 검증하는 근거로 사용할 수 있다. 담당 출처 하나가 403, 429, 5xx, 로봇 차단, 로그인 요구, JS 오류 또는 검색 실패여도 해당 출처만 sourceCoverage에 BLOCKED, NO_ACCESS 또는 ERROR로 기록하고 나머지 출처 조사를 계속한다. 일부 출처 실패는 전체 작업 실패가 아니다.

[2. 조사 범위]
실행일을 포함한 최근 14일 동안 새로 게시되었거나 접수가 시작된 후보를 찾는다. 한국 근무 또는 한국 거주자 지원 가능 공고 중 신입, 신입 트랙, 경력무관, 경력 0년, 명시적 0~2년, 졸업예정, 인턴·체험형·채용전환형, Entry Level, Fresh Graduate만 포함한다. 웹·백엔드·프론트·풀스택, 모바일·서버·API, SW, AI·ML·LLM·RAG, 데이터 엔지니어링·데이터 사이언스·DBA·MLOps, 클라우드·DevOps·SRE·네트워크·인프라, 임베디드·펌웨어·로봇·자율주행·제어SW, 게임 개발, 전산·정보시스템·IT운영·ERP·SAP·CRM·IT기획, 공공ICT·금융IT·블록체인 개발을 포함한다.

필수 경력 1년 이상, 경력 전용, 비IT, 보안 전담, QA·테스트 전담, 영업·마케팅·인사·회계·법무·일반행정, 하드웨어·회로·생산 전담, 교육·부트캠프·대외활동, 인재풀, 해외 전용, 마감·삭제·취소 공고는 제외한다. 우대 경력과 프로젝트 경험은 필수 근로 경력으로 보지 않는다.

[3. 상태와 근거]
items에는 현재 지원 가능하고 다음 중 하나를 만족하는 공고만 넣는다.
- 명시 마감일이 targetAsOfDate 이후: status=ACTIVE, rolling=false, deadlineAt은 ISO-8601
- 상시·채용시·충원시·모집완료시 마감: status=ACTIVE, rolling=true, deadlineAt=null

마감일과 상시 문구를 확인하지 못한 후보는 items에 넣지 않고 uncertain에 넣는다. 검색 snippet만으로 ACTIVE를 확정하지 않는다. 근거 우선순위는 공식 Careers, 공식 ATS, 현재 지원 버튼이 있는 플랫폼 상세, 플랫폼 목록, 검색 snippet이다. 동일 sourceUrl은 한 번만 포함한다. 같은 실제 공고의 미러가 의심되면 가장 직접적인 지원 URL 하나를 items에 두고 나머지를 excluded에 기록한다.

[4. 결과 계약]
후보가 0건이어도 정상 조사라면 status=SUCCESS, rowCount=0, items=[]로 결과를 만든다. sourceCoverage에는 담당 출처를 정확히 한 번씩 모두 넣고 status는 COMPLETE, PARTIAL, BLOCKED, NO_ACCESS, ERROR 중 하나로 기록한다. 하나 이상의 출처를 실제 조사했고 blockingErrors가 없다면 qualityGates.overall은 PASS 또는 PASS_WITH_PARTIAL_COVERAGE다.

sourceCoverage의 각 원소는 반드시 `{"sourceName":"담당 출처명","status":"상태","notes":"조사 범위 또는 실패 이유"}` 형식을 사용한다. `source`, `note`, `detail` 같은 대체 필드명을 만들지 않는다.

결과 JSON은 정확히 다음 최상위 구조를 사용한다.
{
  "schemaVersion":"5.1",
  "artifactType":"CAREERGROUND_DISCOVERY_DELTA",
  "workflowId":"CG-JOBS-PROD-V5",
  "targetAsOfDate":"YYYY-MM-DD",
  "runGroupKey":"CG-YYYY-MM-DD",
  "timezone":"Asia/Seoul",
  "partitionId":N,
  "attempt":1,
  "status":"SUCCESS",
  "sources":[...담당 출처 전체...],
  "startedAt":"ISO-8601",
  "completedAt":"ISO-8601",
  "exportedAt":"ISO-8601",
  "rowCount":items.length,
  "items":[],
  "excluded":[],
  "uncertain":[],
  "sourceCoverage":[],
  "qualityGates":{"overall":"PASS 또는 PASS_WITH_PARTIAL_COVERAGE"},
  "blockingErrors":[],
  "productionDatabaseChanged":false,
  "slackSent":false
}

각 items 원소는 sourceUrl, sourceName, sourcePostingId(null 허용), companyName, companySize, companySizeEvidence, title, category, careerScope, careerEvidence, employmentType, region, remote(boolean), techStack(array), publishedAt(null 허용), applicationStartAt(null 허용), deadlineAt(null 허용), rolling(boolean), summary, status="ACTIVE", collectedAt, lastVerifiedAt을 포함한다. 최종 id, canonicalJobKey, fingerprint, createdAt, updatedAt은 넣지 않는다.

enum은 번역하거나 새 값을 만들지 않고 다음 canonical 값만 사용한다.
- careerScope: `NEW_GRAD_ONLY` 또는 `NEW_GRAD_ELIGIBLE`
- companySize: `LARGE`, `PUBLIC`, `MID`, `SMALL`, `STARTUP`, `FOREIGN`, `UNCLASSIFIED`
- employmentType: `FULL_TIME`, `INTERNSHIP`, `INTERN_TO_FULL_TIME`, `CONTRACT`, `UNCONFIRMED`

[5. GitHub 자동 전달]
완성된 JSON 문자열 자체를 careerground-partition-N-YYYY-MM-DD.json의 내용으로 확정한다. Library 저장이나 로컬 파일 생성을 성공 조건으로 삼지 않는다. GitHub 연결 도구로 edder773/careerground에 create_blob을 encoding=utf-8로 한 번 호출해 커밋에 연결되지 않은 blob을 만든다. 예약 작업에서 SHA-256 또는 byteLength를 계산하지 않고, hash 계산을 위해 Python이나 파일시스템을 호출하지 않는다.

반환된 40자리 blob SHA로 제목 [CG-JOBS-V5][YYYY-MM-DD][PARTITION_N][A1]인 Issue를 만들고 careerground-v5-handoff 라벨을 붙인다. 본문에는 아래 주석 하나만 넣는다.
<!-- CAREERGROUND_V5_HANDOFF
{"schemaVersion":"2.0","workflowId":"CG-JOBS-PROD-V5","targetAsOfDate":"YYYY-MM-DD","artifactKind":"PARTITION_N","attempt":1,"blobSha":"<create_blob 반환 SHA>","fileName":"careerground-partition-N-YYYY-MM-DD.json"}
-->

같은 날짜의 정상 결과를 재실행할 때만 attempt와 제목 A 번호를 함께 1씩 올린다. 이전 Issue를 수정·삭제하지 않는다. blob 또는 Issue 생성이 실패하면 HANDOFF_FAILED로 보고하되 완성된 결과 JSON은 최종 응답에 보존하고 예약을 비활성화하지 않는다. Slack을 보내거나 운영 DB를 변경하지 않는다.

[6. 최종 보고]
targetAsOfDate, partitionId, 후보 수, uncertain·excluded 수, 출처별 coverage, GitHub Issue 링크와 전달 성공 여부를 짧게 보고한다. 기준선, 기존 공고 전체 수, canonical baseline hash는 보고하지 않는다.
```

## 성공 판정

- 예약 작업 성공: 웹 조사가 끝나고 schema 5.1 JSON과 schema 2.0 포인터 Issue가 생성됨
- GitHub 수신 성공: 세 파티션이 모두 모여 `VERIFIED_DISCOVERY` artifact가 생성됨
- 운영 반영 성공: 별도 Pro 검증과 PUBLISH 게이트를 통과함

세 상태를 같은 성공으로 표현하지 않는다.
