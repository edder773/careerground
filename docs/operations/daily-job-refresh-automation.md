# CareerGround 매일 채용공고 갱신 자동화

이 문서는 ChatGPT Work 예약 작업이 06:00 Asia/Seoul에 CareerGround 운영 채용 데이터를 갱신할 때 따라야 하는 단일 실행 절차다. 속도나 목표 건수보다 정확성, 누락 방지, 재현 가능한 근거를 우선한다. 불확실한 공고는 변경 집합에서 격리하고, 현재 근거로 검증된 변경만 같은 실행에서 운영 DB에 반영한다.

## 1. 작업 시작과 기준 시각

1. Sites의 기존 프로젝트 `careerground-workspace`를 편집 모드로 연다. 새 사이트를 만들지 않는다.
2. 실행 시작 시각, 수집 종료 시각, 2차 검증 종료 시각을 실제 ISO 8601 offset datetime으로 기록한다.
3. 기준일과 모든 마감 판단은 `Asia/Seoul`을 사용한다.
4. Sites 데이터베이스의 `jobs` 테이블을 마지막 페이지까지 읽고, 현재 `ACTIVE` 또는 `DEADLINE_UNKNOWN`이면서 `NEW_GRAD_ONLY` 또는 `NEW_GRAD_ELIGIBLE`인 모든 행을 camelCase import 형식으로 변환해 당일 `baseline.json`으로 저장한다. 일부 페이지만 읽고 진행하지 않는다.

## 2. 증분 재검증 원칙

매 실행은 다음 순서로 수행한다.

1. `baseline.json`의 모든 공고를 현재 시각 기준으로 다시 연다.
2. 지원 버튼, 마감 안내, 신입 지원 근거, 직무, 원본 URL을 다시 확인한다.
3. 당일 신규 공고를 조사해 추가한다.
4. 마감·삭제·지원 종료·경력 전용·지원 불가·비IT·보안 전담·QA 전담·인재풀·교육·중복 공고를 제거한다.
5. 남은 공고 전체를 2차로 다시 열어 상태와 근거를 재확인한다.
6. 이전의 `status`, `rolling`, `deadlineAt`, `lastVerifiedAt`을 검증 없이 복사하지 않는다.

원본 확인 우선순위는 기업 공식 채용 페이지, 채용 플랫폼 상세 페이지의 활성 지원 버튼, 목록의 명시적 상태 순이다. 검색 스니펫은 후보 발견에만 사용한다.

## 3. 조사 범위

다음 출처를 한 번 이상 탐색하되, 접근 실패를 성공으로 기록하지 않는다.

- 자소설닷컴
- 사람인
- 잡코리아
- 원티드
- 점핏
- 인디스워크
- 링커리어
- 캐치
- 리멤버 커리어
- 로켓펀치
- 고용24
- LinkedIn Korea
- 슈퍼루키
- 커리어
- 인크루트

기업 공식 채용 페이지에서 발견한 공고도 포함한다. 한 출처가 최종 결과의 30%를 초과하면 키워드와 다른 출처의 탐색 누락 여부를 다시 점검한다. 사이트 약관과 robots 정책을 존중하고, 인증 우회·보안 우회·과도한 반복 요청을 하지 않는다.

### 3.0 출처 우선 증분 탐색

키워드 검색은 출처 목록 탐색을 보조하는 발견 수단으로만 사용한다. 신규 공고 수집은 다음 순서를 지킨다.

1. 각 출처의 **실제 최신 공고 목록**을 게시 시각 또는 목록 순서대로 읽는다. 키워드 검색 결과만 읽고 목록 탐색을 끝내지 않는다. 직전 성공 실행의 `highWatermark`를 만난 뒤에도 최근 5일 구간을 모두 겹쳐 읽어 지연 등록·제목 변경·재게시 공고를 포착한다. 고정된 페이지 수에서 임의로 중단하지 않고, `highWatermark`와 5일 겹침 조건을 모두 충족하거나 목록의 끝을 명시적으로 확인할 때만 멈춘다.
2. 목록에서 발견한 원시 후보는 키워드 적합 여부를 판단하기 전에 `discovered.json`에 기록한다. 최소 필드는 출처, 출처 공고 ID 또는 canonical URL, 회사명, 제목, 목록 페이지·순서, 발견 시각, 게시 시각(표시되는 경우)이다.
3. 상세 페이지·추천 공고·인기 공고·관련 공고·같은 회사 공고 영역에서 새 공고를 만나면 탐색 경로와 관계없이 `discovered.json` 큐에 넣고 한 번 판정한다. 화면에서 발견했지만 큐에 넣지 않은 URL이 있으면 완전성 게이트 실패다.
4. 포괄 제목이나 직군 묶음 공고는 상세 페이지의 직무 목록·직군 탭·첨부 공고문을 펼쳐 IT 모집 단위가 있는지 확인한다. 제목에 IT 키워드가 없다는 이유만으로 버리지 않는다. `신입공채`, `공개채용`, `통합채용`, `정기채용`, `수시채용`, `직군채용`, `부문별`, `각 부문`, `일반직`, `기술사무직`, `신사업`, `R&D`, `디지털`, `DX`, `AX`가 제목이나 모집 설명에 있으면 상세 직무 검사를 의무화한다.
5. 상세 모집 단위에서 `Software`, `SW`, `개발`, `IT`, `ICT`, `전산`, `정보시스템`, `시스템`, `인프라`, `네트워크`, `클라우드`, `데이터`, `AI`, `블록체인`, `플랫폼`, `임베디드`, `펌웨어`, `로봇`, `자율주행`, `ERP`, `SAP`, `CRM` 중 하나라도 확인되면 그 모집 단위를 독립 후보로 기록한다. 최종 공고 제목에는 실제 모집 단위를 포함해 포괄 제목만 저장하지 않는다.
6. `discovered.json`의 각 후보는 정확히 하나의 `ACTIVE_CANDIDATE`, `EXCLUDED`, `UNCERTAIN`, `DUPLICATE` 판정을 가져야 한다. `rawCandidateCount === decidedCandidateCount`여야 하며, 판정되지 않은 후보 또는 중복 판정이 한 건이라도 있으면 완전성 게이트 실패다.
7. 동적 렌더링·로그인·차단 등으로 최신 목록을 끝까지 읽지 못한 출처는 `INCOMPLETE`로 기록하고 후보 0건으로 간주하지 않는다. 해당 출처는 회사명 보완 탐색과 다른 공개 출처 교차검색으로 보완하되, 성공으로 과장하지 않는다.
8. 출처별 `status`, `highWatermark`, 재탐색 시작·종료 시각, `pagesChecked`, `listItemsSeen`, `rawCandidateCount`, `decidedCandidateCount`, 상세 검증 수, 접근 실패 수를 `reconciliation.json`에 기록한다. `COMPLETED`는 `highWatermark`가 존재하고, 목록 접근이 끝났으며, 각 수치가 서로 일치할 때만 허용한다. `listItemsSeen === 0`은 출처 화면의 명시적 빈 목록 근거가 있을 때만 `COMPLETED`가 될 수 있다. 후보가 비정상적으로 적으면 직전 성공 실행과 비교해 원인을 기록하고 `INCOMPLETE`로 둔다.
9. 새 `highWatermark`는 해당 출처가 `COMPLETED`이고 후보별 판정 완전성까지 통과한 경우에만 전진시킨다. 특정 출처 또는 키워드에서만 후보가 집중되면 회사·직무·공공기관·인턴·경력무관 축을 교차해 검색하고 편향 원인을 기록한다.

### 3.1 회사명 보완 탐색

플랫폼별 키워드 탐색을 마친 뒤에는 회사명을 기준으로 한 보완 탐색을 반드시 수행한다. 이 단계는 키워드 탐색을 대체하지 않고, `기술사무직`, `일반직`, `통합채용`, `부문별 채용`, `공개채용`처럼 제목에 IT 키워드가 드러나지 않는 공고의 누락을 막는 역방향 점검이다.

1. 다음 범주를 모두 포함하는 당일 대상 회사 목록을 매번 새로 만든다. 직전에 사용자가 언급한 회사나 직전 누락 회사만 검사해서는 안 된다.
   - 반도체·전자·자동차·제조 대기업과 주요 IT 서비스 계열사
   - 포털·플랫폼·커머스·통신·게임·핀테크 기업
   - 은행·카드·증권·보험·자산운용·캐피탈·저축은행·핀테크·금융지주와 그룹 공동채용 등 금융권의 IT 채용 가능 기업
   - 전력·교통·금융·산업·연구 분야 공공기관과 공기업
   - 최근 7일 내 공개 채용 발표가 발견된 회사, 현재 운영 DB에 있는 회사, 조사 플랫폼의 회사별 채용 목록에서 새로 발견된 회사
2. 대상 목록에는 회사별 `sector`, `companyName`, 한글·영문·법인명·대표 약칭·그룹명을 포함한 `aliases`, 선정 근거를 기록한다. 금융권은 금융지주·그룹 공동채용과 각 계열사를 별도 검색 대상으로 만들고, 그룹명 공고에 계열사 IT 직무가 들어 있는지도 검사한다.
3. 각 회사는 `aliases`를 사용해 공식 채용 페이지와 최소 2개 공개 채용 출처에서 검색한다. 한 출처의 접근 실패를 다른 출처의 `없음`으로 간주하지 않는다.
4. 포괄 제목의 공고는 제목만으로 IT 또는 비IT를 판정하지 않는다. 상세 페이지의 직무 목록·직군 탭·첨부 공고문을 열어 3.0의 상세 직무 키워드가 실제 모집 단위에 있는지 확인한다. 예를 들어 제목이 `신입공채`이고 세부 직무가 `신사업(AI/데이터·블록체인·플랫폼/IT)`이면 IT 활성 후보 검사 대상으로 취급한다.
5. 뉴스와 검색 스니펫은 회사와 공고를 발견하는 용도로만 사용한다. 최종 `ACTIVE` 판단에는 공식 채용 페이지, 실제 지원 페이지 또는 현재 활성 지원 버튼이 있는 상세 페이지의 마감일·지원 상태·신입 지원 근거가 필요하다.
6. 회사별 상세 직무 또는 현재 지원 가능 여부를 확인하지 못한 후보는 추가하지 않고 `uncertain.json`에 기록한다.
7. `company-backstop.json`의 대상 회사 수가 범주별 목록의 합과 일치하고 모든 회사가 단일 판정을 가져야 한다. 금융권 대상이 0건이거나, 사용자 언급 회사만 들어 있거나, 대상 대비 판정 건수가 부족하면 회사명 보완 탐색을 `COMPLETED`로 기록하지 않는다.

## 4. 포함 및 제외 기준

포함 직무는 IT·전산·소프트웨어 전반이다. 웹·백엔드·프론트엔드·풀스택·모바일·플랫폼·API·사내 시스템·정보시스템, AI·데이터·DBA, 임베디드·로봇·자율주행·시스템, 게임 개발, 클라우드·DevOps·SRE·네트워크, ERP·SAP·CRM·IT기획·기술지원·공공 ICT를 포함한다.

다음은 제외한다.

- 경력 전용 또는 필수 경력 1년 이상
- 보안 전담, QA 전담, 비IT 직무
- 마감·종료·삭제·지원 버튼 비활성
- 인재풀, 교육·부트캠프, 프리랜서풀, 설명회
- 동일 원본 공고의 중복

`NEW_GRAD_ONLY` 또는 `NEW_GRAD_ELIGIBLE`의 구체적인 근거 문구 요약이 반드시 있어야 한다. `주니어`라는 단어만으로 신입 지원 가능으로 판단하지 않는다.

`ACTIVE`는 지원 종료 안내가 없고 지원 버튼이 활성화되어 있으며, 미래 마감일 또는 명시적인 상시·채용 시 마감 근거가 있을 때만 사용한다. `rolling: true`는 상시 문구, 활성 지원 버튼, 종료 안내 없음이 모두 확인된 경우에만 사용한다.

## 5. 불확실성과 제거 안전장치

- 불확실성은 **공고 단위로 격리**하며, 불확실 공고가 있다는 이유만으로 검증된 변경 전체의 배포를 막지 않는다.
- 신규 불확실 후보는 `active.json`과 마이그레이션에서 제외하고 `uncertain.json`에만 기록한다.
- 접근 실패·차단·상태 불명확인 기존 공고는 `active.json`과 변경 SQL에서 제외한다. `retentionVerification` 또는 `rollingVerification`에 `RETAINED_UNCONFIRMED`와 확인 시각·실패 근거를 기록하고 운영 행은 그대로 둔다. 불확실한 기존 값의 `status`, `rolling`, `deadlineAt`, `lastVerifiedAt`을 새 값처럼 복사하거나 갱신하지 않는다.
- 접근 실패나 차단만으로 기존 공고를 제거·만료·수정하지 않는다.
- 원본에서 종료·삭제가 명확한 경우에만 `REMOVED` 또는 `CLOSED_CONFIRMED`를 사용한다.
- 마감일이 기준 시각보다 과거인 기간형 공고만 `EXPIRED`로 전환한다.
- 불확실 URL이 변경 SQL에 포함됐거나 검증된 변경 집합과 불확실 집합을 분리할 수 없으면 데이터 무결성 실패로 배포하지 않는다.
- 라이브 DB 기준선 전체 페이지를 읽지 못했거나, `FULL_REVALIDATION`의 기존 공고별 결정이 누락됐거나, 자동 제거 건수가 기존 표시 공고의 20%를 넘으면 배포하지 말고 결과만 보고한다.
- 신규 출처 탐색의 `INCOMPLETE`와 개별 URL 접근 실패는 누락 가능성으로 보고하되, 그 URL을 변경 집합에서 완전히 제외할 수 있고 다른 안전 게이트를 통과하면 현재 근거로 검증된 추가·수정·제외는 같은 실행에서 배포한다.

## 6. 산출물

`data/imports/job-refresh-YYYY-MM-DD/`에 다음 파일을 만든다.

- `baseline.json`: 실행 시작 시 운영 DB에서 읽은 표시 공고 전체
- `discovered.json`: 최신 목록·회사명 보완·교차검색에서 발견한 원시 후보와 후보별 단일 판정, 출처별 high-watermark
- `active.json`: 현재 근거와 2차 검증을 모두 통과해 이번 실행에서 추가 또는 갱신할 활성 공고만 포함한 검증 변경 집합. 신규·기존 불확실 공고는 넣지 않는다.
- `excluded.json`: 신규 및 기존 후보 중 제외한 공고와 `reasonCode`, `reasonDetail`, URL
- `uncertain.json`: 접근 실패·상태 불명확 공고와 URL, 확인 시각, 실패 이유
- `reconciliation.json`: 운영 반영 판단과 정확한 건수
- `company-backstop.json`: 회사명 보완 탐색 대상, 별칭, 확인 출처, 상세 URL, 판정과 근거

`active.json`은 version `1.0`, `asOfDate`, `timezone: Asia/Seoul`, `collectedAt`, 실제 고유 출처 수인 `sourceCount`, `items`를 가진다. 모든 item은 `docs/operations/job-import-schema.md`를 만족하고 상태는 `ACTIVE`여야 한다.

`reconciliation.json`은 다음 필드를 포함한다.

- `version: 1.0`
- `asOfDate`
- `reconciledAt`
- `snapshotMode: FULL_REVALIDATION`
- `comparison`: `existingItems`, `incomingItems`, `matchedItems`, `addedItems`, `expiredByDeadlineItems`, `removedItems`, `retainedUnconfirmedItems`, `retainedExistingRollingItems`, `storedItemsAfter`, `visibleItemsAfter`
- `deactivations`: 명시적 마감일 경과 항목
- `removals`: 원본에서 종료·삭제·지원 불가가 확인된 비상시 항목
- `retentionVerification`: 확인 실패로 그대로 유지하는 비상시 항목
- `rollingVerification`: 최종 활성 파일에서 빠진 상시 공고의 유지 또는 종료 결정
- 출처별 탐색 시작·종료 시각, 후보 수, 상세 검증 수, 활성 수, 접근 실패 및 제한 이유
- 출처별 `status`, `highWatermark`, `pagesChecked`, `listItemsSeen`, `rawCandidateCount`, `decidedCandidateCount`
- 회사명 보완 탐색의 대상 회사 수, 확인 완료 수, 상세 검증 수, 활성 후보 수, 불확실 후보 수와 회사별 판정

`company-backstop.json`은 범주별 대상 수와 판정 수를 포함하며, 각 회사 항목은 `sector`, `companyName`, `aliases`, `selectionReason`, `sourcesChecked`, `detailUrls`, `decision`, `reason`, `checkedAt`을 가진다. `decision`은 `ACTIVE_CANDIDATE`, `NO_CURRENT_ELIGIBLE_POSTING`, `EXCLUDED`, `UNCERTAIN` 중 하나다. `ACTIVE_CANDIDATE`는 상세 직무와 현재 지원 가능 상태가 모두 확인된 경우에만 사용한다.

`removals`의 reason은 `SOURCE_REMOVED`, `APPLICATION_CLOSED`, `CAREER_ONLY`, `NOT_ELIGIBLE`, `DUPLICATE`, `SECURITY_ONLY`, `QA_ONLY`, `NON_IT` 중 하나다. 모든 제거·유지 판단에는 `checkedAt`과 짧은 자체 근거 요약을 넣는다.

## 7. 검증, 마이그레이션, 배포

1. `baseline.json`의 모든 기존 표시 공고가 `active.json`, `deactivations`, `removals`, `retentionVerification`, `rollingVerification` 중 정확히 하나로 결정됐는지 검사한다. 신규 불확실 후보가 `active.json`에 없고, 기존 `RETAINED_UNCONFIRMED` URL을 대상으로 하는 `INSERT`, `UPDATE`, `DELETE`가 생성되지 않아야 한다.
2. `drizzle/`의 가장 큰 네 자리 번호 다음 번호를 사용한다. 기존 마이그레이션 파일을 수정하거나 덮어쓰지 않는다.
3. 다음 명령 형식으로 마이그레이션을 만든다.

```bash
pnpm jobs:catalog:reconcile \
  --existing data/imports/job-refresh-YYYY-MM-DD/baseline.json \
  --incoming data/imports/job-refresh-YYYY-MM-DD/active.json \
  --audit data/imports/job-refresh-YYYY-MM-DD/reconciliation.json \
  --migration drizzle/NNNN_reconcile_job_catalog_YYYYMMDD.sql \
  --batch-id catalog-jobs-YYYYMMDD-full
```

4. 생성 SQL에 `DELETE FROM jobs`, `DELETE FROM saved_jobs`, 개인 지원 기록 변경, 불확실 URL 대상 변경이 없는지 확인한다.
5. 최소한 `pnpm exec vitest run scripts/daily-job-refresh-policy.test.ts scripts/generate-job-reconciliation-migration.test.ts deployment/sites/runtime-schema.test.ts`와 `pnpm sites:build`를 통과시킨다.
6. 다음만 전체 배포 중단 사유다: 공휴일 게이트 실패, 라이브 기준선 페이지 누락, 기존 공고 결정 누락·중복, 불확실 URL의 SQL 혼입, 검증된 변경과 불확실 변경의 분리 실패, 증거 기반 자동 제외율 20% 초과, 스키마 검증 실패, 테스트 실패, 빌드 실패, 마이그레이션 번호 충돌, 데이터 무결성 위험. 개별 접근 실패나 신규 출처의 `INCOMPLETE` 자체는 전체 중단 사유가 아니다.
7. 전체 중단 사유가 없으면 검증된 변경 집합으로 CareerGround의 새 production checkpoint를 즉시 배포한다. 이 예약 작업에는 매 실행의 검증된 채용 데이터 production 반영이 명시적으로 승인되어 있으며 별도 확인을 기다리지 않는다.
8. 배포 상태가 성공한 뒤 운영 `jobs` 테이블을 다시 읽어 추가·수정·만료·제거 건수, 변경 없이 유지한 불확실 기존 공고 수, 표시 공고 수를 검증한다.

## 8. 실행 보고

각 실행은 다음을 보고한다.

- 조사 시작·종료·2차 검증 종료 시각
- 출처별 조사 결과와 접근 실패
- 기존/신규/활성/만료/제거/유지 불확실/중복/경력 전용 제외 건수
- 회사명 보완 탐색으로 새로 발견한 활성 후보와 불확실 후보 건수
- `COMPLETED`·`INCOMPLETE` 출처와 각 출처의 페이지·목록·후보·판정 수
- 배포 및 운영 DB 사후 검증 결과
- `uncertain.json`의 공고별 링크

접근 제한은 해당 공고를 변경하지 않았음을 함께 보고한다. 전체 중단 게이트, 제거 안전 임계치 초과, 테스트 실패 또는 배포 실패가 있으면 성공으로 표현하지 않는다.
