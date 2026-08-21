# CareerGround 매일 채용공고 갱신 자동화

이 문서는 ChatGPT Work 예약 작업이 매일 06:00 Asia/Seoul에 CareerGround 운영 채용 데이터를 갱신할 때 따라야 하는 단일 실행 절차다. 속도나 목표 건수보다 정확성과 재현 가능한 근거를 우선한다.

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

### 3.1 회사명 보완 탐색

플랫폼별 키워드 탐색을 마친 뒤에는 회사명을 기준으로 한 보완 탐색을 반드시 수행한다. 이 단계는 키워드 탐색을 대체하지 않고, `기술사무직`, `일반직`, `통합채용`, `부문별 채용`, `공개채용`처럼 제목에 IT 키워드가 드러나지 않는 공고의 누락을 막는 역방향 점검이다.

1. 다음 범주를 모두 포함하는 당일 대상 회사 목록을 만든다.
   - 반도체·전자·자동차·제조 대기업과 주요 IT 서비스 계열사
   - 포털·플랫폼·커머스·통신·게임·핀테크 기업
   - 은행·카드·증권·보험 등 금융권의 IT 채용 가능 기업
   - 전력·교통·금융·산업·연구 분야 공공기관과 공기업
   - 최근 7일 내 공개 채용 발표가 발견된 회사, 현재 운영 DB에 있는 회사, 조사 플랫폼의 회사별 채용 목록에서 새로 발견된 회사
2. 각 회사는 한글·영문·법인명·대표 약칭을 함께 사용해 공식 채용 페이지와 최소 2개 공개 채용 출처에서 검색한다. 한 출처의 접근 실패를 다른 출처의 `없음`으로 간주하지 않는다.
3. 포괄 제목의 공고는 제목만으로 IT 또는 비IT를 판정하지 않는다. 상세 페이지의 직무 목록·직군 탭·첨부 공고문을 열어 Software, AI/AX, 데이터, 전산, 시스템, 네트워크, 클라우드, 임베디드 등 포함 직무가 실제 모집 단위에 있는지 확인한다.
4. 뉴스와 검색 스니펫은 회사와 공고를 발견하는 용도로만 사용한다. 최종 `ACTIVE` 판단에는 공식 채용 페이지, 실제 지원 페이지 또는 현재 활성 지원 버튼이 있는 상세 페이지의 마감일·지원 상태·신입 지원 근거가 필요하다.
5. 회사별 상세 직무 또는 현재 지원 가능 여부를 확인하지 못한 후보는 추가하지 않고 `uncertain.json`에 기록한다.

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

- 접근 실패나 차단만으로 기존 공고를 제거하지 않는다.
- 비상시 공고를 확인하지 못했지만 명시적 미래 마감일이 남아 있는 경우 `retentionVerification`에 `RETAINED_UNCONFIRMED`로 기록하고 운영 행은 그대로 둔다.
- 상시 공고를 확인하지 못한 경우 `rollingVerification`에 `RETAINED_UNCONFIRMED`와 확인 시각·실패 근거를 기록한다.
- 원본에서 종료·삭제가 명확한 경우에만 `REMOVED` 또는 `CLOSED_CONFIRMED`를 사용한다.
- 마감일이 기준 시각보다 과거인 비상시 공고만 `EXPIRED`로 전환한다.
- 자동 제거 건수가 기존 표시 공고의 20%를 넘으면 배포하지 말고 결과만 보고한다.

## 6. 산출물

`data/imports/job-refresh-YYYY-MM-DD/`에 다음 파일을 만든다.

- `baseline.json`: 실행 시작 시 운영 DB에서 읽은 표시 공고 전체
- `active.json`: 2차 검증까지 통과한 최종 활성 공고 전체
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
- 회사명 보완 탐색의 대상 회사 수, 확인 완료 수, 상세 검증 수, 활성 후보 수, 불확실 후보 수와 회사별 판정

`company-backstop.json`의 각 회사 항목은 `companyName`, `aliases`, `sourcesChecked`, `detailUrls`, `decision`, `reason`, `checkedAt`을 가진다. `decision`은 `ACTIVE_CANDIDATE`, `NO_CURRENT_ELIGIBLE_POSTING`, `EXCLUDED`, `UNCERTAIN` 중 하나다. `ACTIVE_CANDIDATE`는 상세 직무와 현재 지원 가능 상태가 모두 확인된 경우에만 사용한다.

`removals`의 reason은 `SOURCE_REMOVED`, `APPLICATION_CLOSED`, `CAREER_ONLY`, `NOT_ELIGIBLE`, `DUPLICATE`, `SECURITY_ONLY`, `QA_ONLY`, `NON_IT` 중 하나다. 모든 제거·유지 판단에는 `checkedAt`과 짧은 자체 근거 요약을 넣는다.

## 7. 검증, 마이그레이션, 배포

1. `drizzle/`의 가장 큰 네 자리 번호 다음 번호를 사용한다. 기존 마이그레이션 파일을 수정하거나 덮어쓰지 않는다.
2. 다음 명령 형식으로 마이그레이션을 만든다.

```bash
pnpm jobs:catalog:reconcile \
  --existing data/imports/job-refresh-YYYY-MM-DD/baseline.json \
  --incoming data/imports/job-refresh-YYYY-MM-DD/active.json \
  --audit data/imports/job-refresh-YYYY-MM-DD/reconciliation.json \
  --migration drizzle/NNNN_reconcile_job_catalog_YYYYMMDD.sql \
  --batch-id catalog-jobs-YYYYMMDD-full
```

3. 생성 SQL에 `DELETE FROM jobs`, `DELETE FROM saved_jobs` 또는 개인 지원 기록 변경이 없는지 확인한다.
4. 최소한 `pnpm exec vitest run scripts/generate-job-reconciliation-migration.test.ts deployment/sites/runtime-schema.test.ts`와 `pnpm sites:build`를 통과시킨다.
5. 실패하면 운영 배포를 하지 않는다. 기존 migration을 고치지 말고 입력 또는 새 코드를 수정한다.
6. 검증 성공 시 CareerGround의 새 production checkpoint를 배포한다. 이 예약 작업의 명시적 목적에는 해당 날짜의 검증된 채용 데이터 production 배포가 포함된다.
7. 배포 상태가 성공한 뒤 운영 `jobs` 테이블을 다시 읽어 추가·수정·만료·제거 건수와 표시 공고 수를 검증한다.

## 8. 실행 보고

각 실행은 다음을 보고한다.

- 조사 시작·종료·2차 검증 종료 시각
- 출처별 조사 결과와 접근 실패
- 기존/신규/활성/만료/제거/유지 불확실/중복/경력 전용 제외 건수
- 회사명 보완 탐색으로 새로 발견한 활성 후보와 불확실 후보 건수
- 배포 및 운영 DB 사후 검증 결과
- `uncertain.json`의 공고별 링크

오류, 접근 제한, 제거 안전 임계치 초과, 테스트 실패 또는 배포 실패가 있으면 성공으로 표현하지 않는다.
