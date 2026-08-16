---
title: 학습 페이지 D1 왕복 통합과 선행 로딩 적용
date: 2026-08-16
tags: [performance, d1, learning, bootstrap, prefetch, react-query, troubleshooting]
generatedByAI: true
model: GPT-5
pr: '#not-applicable-operational-follow-up'
commit: '#same-change-see-git-history'
evidence: docs/evidence/learning-read-latency-remediation-2026-08-16.json
---

# 학습 페이지 D1 왕복 통합과 선행 로딩 적용

## 결론

학습 페이지의 지연 원인은 학습 데이터의 양이나 Worker의 계산량이 아니라, 한 화면을 완성하기
위해 D1 결과를 여러 번 기다리던 호출 구조였다. 변경 전 운영 관측에서 학습 단원 상세는 4회
모두 Worker wall 536–548ms였지만 CPU는 3–4ms에 불과했다. 같은 시점의 운영 데이터는 학습 자료
4개, 단원 23개, 플래시카드 46개, 문제 23개였고 문제 풀이 시도는 0개였다.

이 장애는 다음 세 층을 함께 바꿔 해결했다.

1. 직접 `/learning`에 들어올 때 인증 bootstrap과 학습 목록을 전용 응답 하나로 합쳤다.
2. 단원 상세의 사용자 확인, rate limit, 본문, 플래시카드, 문제, 풀이 기록을 D1 batch 하나로
   합쳤다.
3. 학습 화면 코드, 목록 데이터, 단원 상세 데이터를 실제 클릭보다 먼저 준비할 수 있게 했다.

동일한 Node.js 24.19.0, 동일 migration과 seed, 동일한 D1 dispatch당 25ms의 제어 지연, 동일한
9회 측정에서 결과는 다음과 같았다.

| 사용자 경로         | 변경 전 D1 dispatch | 변경 후 D1 dispatch | 변경 전 p50 | 변경 후 p50 |
| ------------------- | ------------------: | ------------------: | ----------: | ----------: |
| 직접 학습 진입      |                   2 |                   1 |     63.05ms |     30.85ms |
| 학습 단원 상세      |                   5 |                   1 |     93.92ms |     30.97ms |
| 학습 목록 단독 읽기 |                   1 |                   1 |     31.53ms |     30.72ms |

단원 상세의 D1 dispatch는 80%, 제어 실험 p50은 67.03%, p95는 67.15% 감소했다. 이 수치는
운영 인터넷 왕복이나 브라우저 렌더링을 포함한 실제 운영 응답 시간이 아니다. 동일 조건에서 D1
왕복 구조를 바꾼 효과만 비교한다.

## 관련 문서

- 선행 원인 분석: `2026-08-16-d1-read-performance-and-learning-latency.md`
- 이번 변경의 evidence manifest:
  `docs/evidence/learning-read-latency-remediation-2026-08-16.json`
- 재현 벤치마크: `scripts/performance/benchmark-learning-read-path.mjs`

선행 문서는 변경 전 상태와 개선 목표를 기록한다. 이 문서는 그 목표를 실제 구현한 방법과 검증
결과를 기록한다.

## 장애 범위

사용자에게 느리게 보였던 경로는 두 가지였다.

### 직접 학습 페이지 진입

브라우저 주소창, 새로고침 또는 외부 링크로 `/learning`을 처음 열면 다음 두 데이터 요청이
순차적으로 필요했다.

```text
GET /api/v1/bootstrap
  └─ 사용자 인증과 알림 수 준비

GET /api/v1/learning
  └─ 학습 자료와 단원 요약 준비
```

React 애플리케이션은 첫 번째 요청으로 사용자를 확인하기 전까지 보호된 화면을 렌더링하지 않는다.
따라서 두 번째 요청은 학습 화면이 마운트된 뒤에야 시작했다. 두 HTTP 요청은 각각 한 번의 D1
dispatch를 사용했으므로 직접 진입에는 최소 두 번의 원격 D1 대기가 있었다.

### 단원 카드 클릭

단원 상세는 HTTP 요청 하나였지만 Worker 내부에서 다음처럼 여러 D1 호출을 수행했다.

```text
HTTP GET /api/v1/learning/units/:id
  ├─ wave 1: 사용자 조회 + rate limit 갱신 batch
  ├─ wave 2: 단원 + 출처 + 현재 사용자 진도 SELECT
  └─ wave 3: Promise.all
       ├─ 플래시카드 SELECT
       ├─ 문제 SELECT
       └─ 현재 사용자 풀이 기록 SELECT
```

`Promise.all`은 마지막 세 요청의 대기 시간을 겹치지만 D1 dispatch 세 번을 한 번으로 바꾸지는
않는다. 전체적으로 D1 dispatch 5회, SQL statement 6개, 직렬 dispatch wave 3개였다.

## 운영 신호가 알려준 것

변경 전 운영 로그는 다음과 같았다.

| 경로           | 표본 | application | Worker wall | Worker CPU |
| -------------- | ---: | ----------: | ----------: | ---------: |
| 학습 목록      |    1 |       192ms |       196ms |        2ms |
| 학습 단원 상세 |    4 |   524–536ms |   536–548ms |      3–4ms |

단원 상세의 p50 Worker wall은 541ms였지만 CPU p50은 3ms였다. 이 차이는 Worker가 수백 ms 동안
CPU 계산을 한 것이 아니라 외부 결과를 기다렸다는 신호다. 다음 항목은 현재 장애의 1차 원인이
아니었다.

- 23개 단원 자체의 데이터 양
- Markdown 파싱과 렌더링
- 학습 이미지 디코딩
- 풀이 기록 집계량
- 복잡한 서버 비즈니스 계산

특히 운영 풀이 기록은 0개였고 제어 실험의 상세 JSON은 2,558 bytes였다. 현재 규모에서 payload나
풀이 기록 scan을 먼저 최적화할 근거가 없었다.

## 목표와 비목표

### 목표

- 기존 인증과 rate limit을 유지하면서 D1 dispatch 수를 줄인다.
- 직접 `/learning` 진입의 데이터 HTTP 요청을 2회에서 1회로 줄인다.
- 단원 상세의 D1 dispatch를 5회에서 1회로 줄인다.
- 단원 상세의 직렬 대기 wave를 3개에서 1개로 줄인다.
- pointer와 keyboard 사용자가 클릭하기 전 요청을 시작할 수 있게 한다.
- 같은 query key를 사용해 prefetch와 실제 화면 요청의 중복을 막는다.

### 비목표

- 학습 데이터를 브라우저 저장소의 영구 원본으로 바꾸지 않는다.
- 인증되지 않은 공개 학습 API를 만들지 않는다.
- 근거 없이 새로운 index를 추가하지 않는다.
- 운영 p95를 제어 실험 수치로 대신하지 않는다.
- 첫 계정 생성에 필요한 사용자·환영 알림 write까지 1 dispatch라고 주장하지 않는다.

## 핵심 설계 원칙

### statement 수와 dispatch 수를 분리한다

SQL statement가 여섯 개라는 사실만으로 느린 것은 아니다. D1의 `batch`에 여섯 statement를 함께
보내면 Worker와 D1 사이의 원격 dispatch는 한 번이다. 이번 변경은 서로 다른 결과 집합을 억지로
거대한 SQL 한 문장으로 만드는 대신, 읽기 쉬운 prepared statement를 유지하면서 전송 단위만
합쳤다.

### 사용자 경계는 SQL 안에 남긴다

공유 학습 본문과 사용자별 진도·풀이 기록은 권한 성격이 다르다. 단원 상세 batch에서도 다음 조건을
유지했다.

- 진도: 현재 인증 사용자의 `learning_progress`만 조인
- 풀이 기록: 현재 인증 사용자의 `learning_question_attempts`만 조인
- 단원: `published = 1`
- 출처: 허용된 운영 상태만 조회

브라우저가 user ID를 전달하거나 바꿀 수 있는 입력은 추가하지 않았다.

### prefetch와 실제 조회는 같은 cache key를 사용한다

사전 요청과 modal 요청이 다른 key를 사용하면 같은 상세 데이터를 두 번 받을 수 있다. 두 경로가
동일한 `['learning-unit', unitId]` key와 동일 query function을 사용하도록 하나의 query 설정
함수로 합쳤다.

## 변경 1: 학습 전용 bootstrap

### 변경 전 클라이언트

인증 Provider는 `/jobs`에만 전용 bootstrap을 사용했다. `/learning`에서는 일반 bootstrap을 받은
후 `LearningPage`가 별도로 학습 목록을 요청했다.

```tsx
const includeJobs = window.location.pathname === '/jobs';
const jobsBootstrap = includeJobs ? initialJobsBootstrap() : undefined;

const payload = await api(jobsBootstrap?.path || `/bootstrap${includeHome ? '?home=1' : ''}`);
```

### 변경 후 클라이언트

현재 경로가 `/learning`이면 전용 bootstrap을 선택한다.

```tsx
const includeLearning = window.location.pathname === '/learning';
const learningBootstrap = includeLearning ? initialLearningBootstrap() : undefined;

const payload = await api(
  jobsBootstrap?.path || learningBootstrap?.path || `/bootstrap${includeHome ? '?home=1' : ''}`,
);
```

응답을 받은 직후 인증 사용자, 읽지 않은 알림 수, 학습 목록을 각각의 React Query cache에 넣는다.

```tsx
client.setQueryData(['notification-unread-count'], {
  count: payload.unreadCount,
});

if (learningBootstrap && Array.isArray(payload.data)) {
  client.setQueryData(['learning'], payload.data);
}
```

`LearningPage`의 기존 `useQuery(['learning'])`는 이미 채워진 5분 freshness cache를 읽으므로 같은
페이지 진입에서 `/learning`을 다시 요청하지 않는다.

### 변경 후 서버 batch

`GET /api/v1/learning/bootstrap`은 확립된 사용자의 steady read에서 다음 세 statement를 하나의
`DB.batch`에 담는다.

```text
statement 1: 사용자 정보 + 읽지 않은 알림 수
statement 2: 사용자·경로·분 단위 rate-limit upsert
statement 3: 학습 자료와 공개 단원 요약 JSON aggregation
```

응답 모양은 다음 세 부분이다.

```ts
{
  user: apiUser(user),
  unreadCount,
  data: learningSources,
}
```

사용자가 존재하지 않거나 계정 정보 동기화가 필요한 경우에는 계정 생성·동기화와 환영 알림을
위한 추가 작업이 필요할 수 있다. 따라서 1 dispatch 보장은 이미 생성되어 변경되지 않은 사용자의
steady read에 한정한다.

## 변경 2: 단원 상세 fast read plan

### 변경 전

단원 기본 행을 먼저 기다린 다음 나머지 세 쿼리를 시작했다.

```ts
const unit = await first(db, unitSql, userId, unitId);

const [flashcards, questions, attempts] = await Promise.all([
  all(db, flashcardSql, unitId),
  all(db, questionSql, unitId),
  all(db, attemptSql, userId, unitId),
]);
```

이 코드는 보기에는 병렬이지만 앞단의 사용자 batch와 unit SELECT를 포함하면 D1 dispatch는 다섯
번이다.

### 변경 후

단원 상세를 `FastReadPlan`으로 표현한다. plan은 실행할 statement 목록과 결과를 조립하는
`value()`를 분리한다.

```ts
type FastReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};
```

상세 plan은 네 개의 route-data statement를 준비한다.

```ts
return {
  statements: [
    unitAndProgressStatement,
    flashcardsStatement,
    questionsStatement,
    attemptsStatement,
  ],
  value(results) {
    // unit, flashcards, questions, attempts를 기존 응답 형태로 조립
  },
};
```

공통 `fastRead`는 인증 사용자와 rate-limit statement 두 개를 앞에 붙인다.

```ts
const contextStatements = requestContextStatementsForSiteUser(db, identity.userId, window, false);

const results = await db.batch([...contextStatements, ...plan.statements]);
```

결과적으로 SQL statement 수는 6개로 동일하지만 D1 dispatch는 1회가 된다.

```text
HTTP GET /api/v1/learning/units/:id
  └─ D1 batch 1회
       ├─ 인증 사용자 SELECT
       ├─ rate-limit UPSERT
       ├─ 단원 + 출처 + 현재 사용자 진도 SELECT
       ├─ 플래시카드 SELECT
       ├─ 문제 SELECT
       └─ 현재 사용자 풀이 기록 SELECT
```

### 빈 단원 처리

batch는 네 route-data statement를 모두 실행하므로 첫 result가 비어 있는지 결과 조립 단계에서
확인한다.

```ts
const unit = batchRows(results[0])[0];
if (!unit) throw new RouteError(404, '학습 단원을 찾을 수 없습니다.');
```

기존 404 계약은 유지된다.

## 변경 3: 학습 화면 코드 선행 로딩

기존 `LearningPage`는 route에 처음 진입할 때만 dynamic import가 시작됐다. 현재는 채용 화면과
동일하게 재사용 가능한 Promise를 둔다.

```tsx
let learningPagePromise;

export const preloadLearningPage = () => {
  learningPagePromise ??= import('./pages/LearningPage')
    .then((module) => ({ default: module.LearningPage }))
    .catch((error) => {
      learningPagePromise = undefined;
      throw error;
    });
  return learningPagePromise;
};
```

실패한 import Promise를 비워 다음 시도에서 복구할 수 있게 했다. 앱 entry는 이 함수를 비동기로
시작하고, route의 `lazy()`도 같은 Promise를 사용한다. route 진입과 import가 겹쳐도 모듈 요청은
하나다.

## 변경 4: 학습 메뉴 intent prefetch

이미 앱 안에 들어온 사용자는 일반 bootstrap이 끝난 상태이므로 학습 메뉴에 접근할 의도가 보일
때 목록 조회를 먼저 시작할 수 있다.

```tsx
const preloadLearningData = () => {
  if (!user) return;
  void client.prefetchQuery({
    queryKey: ['learning'],
    queryFn: () => api('/learning'),
    staleTime: 5 * 60_000,
  });
};
```

다음 입력을 모두 지원한다.

- pointer enter: 마우스나 지원 pointer가 메뉴에 들어옴
- pointer down: 터치·펜·빠른 클릭이 활성화되기 직전
- focus: 키보드 탐색으로 링크에 도달

React Query는 같은 key의 진행 중 요청을 재사용하므로 pointer enter와 pointer down이 연속으로
발생해도 동일한 학습 목록 요청을 중복해서 만들지 않는다.

## 변경 5: 단원 카드 intent prefetch

상세 modal과 카드 prefetch가 공통 query 설정을 사용한다.

```tsx
const learningUnitQuery = (unitId: string) => ({
  queryKey: ['learning-unit', unitId],
  queryFn: () => api(`/learning/units/${unitId}`),
  staleTime: 5 * 60_000,
});
```

카드는 pointer enter와 keyboard focus에서 prefetch한다.

```tsx
onPointerEnter={() =>
  void client.prefetchQuery(learningUnitQuery(unit.id))
}
onFocus={() =>
  void client.prefetchQuery(learningUnitQuery(unit.id))
}
```

사용자가 카드를 클릭했을 때 요청이 완료되었다면 modal은 cache를 즉시 사용한다. 아직 진행
중이라면 modal은 진행 중인 같은 Promise를 구독한다. 사용자가 아무런 intent 없이 URL query로
단원을 직접 열더라도 기존 `useQuery`가 정상적으로 상세를 가져오므로 prefetch는 필수 조건이
아니다.

## 왜 하나의 거대한 JSON SQL로 합치지 않았는가

학습 목록은 source별 unit summary를 만들기 때문에 JSON aggregation 한 문장이 자연스럽다. 반면
단원 상세는 다음 네 결과의 생명주기와 정렬 기준이 다르다.

- 단원과 사용자 진도: 최대 한 행
- 플래시카드: 생성 순서
- 문제: 생성 순서
- 풀이 기록: 최근 시각 역순, 최대 100개

이들을 중첩 JSON 한 문장으로 만들면 SQL 가독성과 변경 위험이 커진다. D1 병목은 statement 수가
아니라 dispatch 수였으므로 prepared statement 네 개를 batch 하나에 담는 방식이 더 단순하고
검증하기 쉬웠다.

## 왜 새 index를 추가하지 않았는가

현재 schema에는 이미 다음 실제 조회 패턴용 index가 있다.

- `flashcards(unit_id, created_at)`
- `learning_questions(unit_id, created_at)`
- `learning_progress(user_id, unit_id)` unique index
- `learning_question_attempts(user_id, question_id, attempted_at)`

운영 풀이 기록은 0개이고 Worker CPU는 3–4ms였다. index가 현재 0.5초 지연의 원인이라는 근거가
없다. 근거 없이 index를 추가하면 write 비용과 schema 복잡도만 증가한다. 풀이 기록이 커진 후
대표 데이터에서 `EXPLAIN QUERY PLAN`이 scan을 보일 때 index 또는 데이터 모델을 다시 평가한다.

## 전후 측정 방법

### 고정 조건

| 항목               | 값                                                 |
| ------------------ | -------------------------------------------------- |
| runtime            | Node.js v24.19.0                                   |
| DB                 | node:sqlite 기반 D1 호환 adapter                   |
| schema/data        | 저장소 migration과 learning seed                   |
| 표본               | 각 경로 9회                                        |
| 제어 지연          | D1 dispatch마다 25ms                               |
| selected unit      | 플래시카드 2개, 문제 1개, 풀이 시도 0개            |
| 포함하지 않는 구간 | 인터넷, 브라우저 렌더링, 이미지, 운영 D1 실제 지연 |

변경 전후 모두 같은 명령을 사용했다.

```bash
node --import tsx scripts/performance/benchmark-learning-read-path.mjs
```

직접 진입 시나리오만 실제 제품 구조에 맞춰 변경 전 `/bootstrap` + `/learning`, 변경 후
`/learning/bootstrap`을 호출한다.

### 직접 진입 결과

| 지표               | 변경 전 | 변경 후 |        변화 |
| ------------------ | ------: | ------: | ----------: |
| HTTP request       |       2 |       1 |      -50.0% |
| D1 dispatch        |       2 |       1 |      -50.0% |
| prepared statement |       5 |       3 |           - |
| p50                | 63.05ms | 30.85ms |     -51.07% |
| p95                | 80.09ms | 31.81ms |     -60.28% |
| response bytes     |  21,512 |  21,508 | 사실상 동일 |

payload 크기가 거의 동일한 상태에서 시간이 줄었으므로 데이터 삭제나 응답 축소가 아니라 대기
구조가 바뀐 결과다.

### 단원 상세 결과

| 지표               | 변경 전 | 변경 후 |    변화 |
| ------------------ | ------: | ------: | ------: |
| D1 dispatch        |       5 |       1 |  -80.0% |
| dispatch wave      |       3 |       1 | -66.67% |
| prepared statement |       6 |       6 |      0% |
| p50                | 93.92ms | 30.97ms | -67.03% |
| p95                | 96.14ms | 31.58ms | -67.15% |
| response bytes     |   2,558 |   2,558 |      0% |

statement 수와 response bytes가 그대로인데 D1 dispatch와 시간이 함께 줄었다. 이는 이번 장애의
원인이 SQL 결과량보다 원격 왕복 구조였다는 진단과 일치한다.

### 학습 목록 단독 읽기

목록은 이미 변경 전에 한 batch였다.

| 지표           | 변경 전 | 변경 후 |
| -------------- | ------: | ------: |
| D1 dispatch    |       1 |       1 |
| statement      |       3 |       3 |
| p50            | 31.53ms | 30.72ms |
| p95            | 32.18ms | 32.06ms |
| response bytes |  21,272 |  21,272 |

목록 SQL을 다시 작성하지 않은 이유도 여기에 있다. 이미 1 dispatch인 경로를 건드리는 대신 직접
진입 waterfall과 상세 5 dispatch를 제거했다.

## 회귀 테스트

### Sites D1 API

36개 테스트가 통과했다. 이번 변경을 위해 다음 구조적 assertion을 추가했다.

- 학습 bootstrap: established user 기준 query count 3, batch count 1
- 단원 상세: query count 6, batch count 1
- bootstrap 응답에 user, unreadCount, data가 존재
- 상세 응답에 flashcards, questions, progress가 존재

단순히 시간이 빨라졌는지만 검사하지 않고, 성능을 만든 구조 자체가 다시 여러 batch로 분리되지
않도록 보호한다.

### Web

대상 8개 테스트가 통과했다.

- `/learning` 직접 진입이 `/learning/bootstrap` 한 번만 호출하는지 확인
- bootstrap 응답이 `['learning']` cache를 채우는지 확인
- 학습 메뉴 hover가 목록 prefetch를 시작하는지 확인
- 단원 카드 hover가 상세 prefetch를 시작하는지 확인
- prefetch 뒤 modal을 열어도 상세 HTTP 요청이 한 번인지 확인
- 기존 source 접기·펼치기, PDF 시각 자료, 복습 일정 제거 동작 확인

### 정적 검증

- 전체 119개 테스트: 통과
  - contracts 10개
  - API 33개
  - web 22개
  - Sites·트러블슈팅 54개
- 전체 workspace와 Sites Worker TypeScript: 통과
- 변경 파일 ESLint: 통과
- `git diff --check`: 통과
- Sites production build: 통과
- 트러블슈팅 wiki production build: 통과

## 보안과 데이터 정합성 확인

### 인증

클라이언트가 전달하는 query parameter나 body에서 user ID를 받지 않는다. 플랫폼이 전달한 인증
헤더를 서버에서 읽고 `site_user_id`로 사용자 행을 찾는 기존 흐름을 유지한다.

### 사용자별 진도

단원 본문은 공유되지만 `learning_progress` 조인에는 현재 사용자 조건이 포함된다. 다른 사용자의
완료 상태나 진도는 같은 batch에 포함되지 않는다.

### 사용자별 풀이 기록

풀이 기록 statement는 단원에 포함된 문제와 현재 인증 사용자를 동시에 제한한다. dispatch를
합치기 위해 권한 조건을 JavaScript 후처리로 옮기지 않았다.

### rate limit

rate-limit UPSERT는 제거되지 않았다. 사용자 조회와 실제 route data와 함께 batch에 들어가며,
응답을 반환하기 전에 limit 초과 여부를 검사한다.

### cache

React Query cache는 서버 응답을 잠시 재사용할 뿐 영구 데이터 원본이 아니다. 학습 완료나 답안
제출 후에는 기존 invalidation이 목록과 상세을 다시 검증한다.

## 배포 중 발견한 migration 패키징 경계

첫 게시 archive는 공식 Sites packager를 저장소 root에 바로 적용하면서 과거 baseline migration
전체를 포함했다. 운영 DB에는 해당 schema가 이미 있으므로 `job_source_snapshot_items` table을
다시 만들려는 단계에서 배포가 실패했고 그 버전은 live가 되지 않았다.

이 저장소는 runtime bootstrap 이후의 순방향 migration만 운영 배포에 포함하는 별도 stage 절차를
이미 갖고 있다. 재패키징은 다음 순서를 사용했다.

```text
repository dist
  └─ preparePackageStage
       ├─ dist/server와 static assets 복사
       ├─ hosting metadata 복사
       ├─ dist에 이미 선별된 forward migration 검증
       └─ repository-root baseline migration은 복사하지 않음

safe stage
  └─ official Sites package-site.sh
       └─ production archive
```

재패키징 결과 포함된 migration은 0017–0021 다섯 개뿐이었다. 이 경계는 학습 성능 코드와 무관하지만
동일 버전을 운영에 올리기 위해 필요한 배포 안전 조건이므로 함께 기록한다.

## 예상 사용자 체감

정량적으로 보장할 수 있는 것은 다음과 같다.

- established user의 직접 진입 데이터 요청은 두 번에서 한 번이 됐다.
- established user의 상세 D1 dispatch는 다섯 번에서 한 번이 됐다.
- 목록 링크와 상세 카드에 intent가 먼저 오면 실제 활성화 전에 요청을 시작한다.

다음 값은 이 문서에서 약속하지 않는다.

- 모든 지역과 네트워크에서 0.3초 이하
- 첫 계정 생성과 첫 asset 다운로드까지 1 dispatch
- hover가 없는 모든 터치 상황에서 modal이 항상 즉시 표시됨
- 배포 직후 운영 p95가 제어 실험 p95와 같음

운영 체감에는 Cloudflare 위치, 브라우저 cache, 네트워크 RTT, 인증 dispatcher, JavaScript asset
cache가 함께 영향을 준다.

## 장애 재발 시 확인 순서

### 1. 경로를 분리한다

- 학습 목록이 느린가?
- 단원 modal만 느린가?
- 새로고침만 느리고 앱 내부 이동은 빠른가?
- 첫 계정 생성에서만 느린가?

서로 다른 경로를 하나의 평균으로 합치지 않는다.

### 2. Worker wall과 CPU를 비교한다

- wall과 CPU가 함께 증가: SQL 계산, JSON 조립, 런타임 계산을 조사
- wall만 증가하고 CPU가 낮음: D1 dispatch, 인증, 플랫폼 대기를 먼저 조사

### 3. batch count 회귀 테스트를 실행한다

학습 bootstrap은 1 batch/3 statements, 단원 상세는 1 batch/6 statements여야 한다. statement
수가 동일하더라도 batch count가 늘면 원격 dispatch가 다시 증가할 수 있다.

### 4. React Query key를 확인한다

- 목록: `['learning']`
- 상세: `['learning-unit', unitId]`

prefetch와 화면 query key가 다르면 중복 요청이 생긴다.

### 5. 첫 사용자와 steady user를 구분한다

계정 provisioning에는 사용자, 환영 알림, audit 기록이 필요하다. 최초 생성 trace를 steady read와
비교해 dispatch 회귀로 오진하지 않는다.

### 6. 데이터가 커졌다면 query plan을 다시 본다

풀이 기록이 충분히 쌓인 뒤에만 대표 fixture와 `EXPLAIN QUERY PLAN`으로 attempts query를 검사한다.
현재 문서의 데이터 규모와 CPU 근거를 미래 규모에 그대로 적용하지 않는다.

## 재현 명령

```bash
# D1 구조와 API 회귀
vitest run deployment/sites/d1-api.test.ts

# 학습 bootstrap, 메뉴/카드 prefetch, 기존 학습 UI 회귀
vitest run src/auth.test.tsx src/pages/LearningPage.test.tsx src/components/AppShell.test.tsx

# 동일 조건 제어 벤치마크
node --import tsx scripts/performance/benchmark-learning-read-path.mjs

# evidence와 위키 형식 확인
node --import tsx scripts/troubleshooting/validate.ts
```

Web 테스트는 `apps/web` 설정을 사용한다.

## 롤백 판단

다음 문제가 생기면 단순히 prefetch만 끄는 것과 서버 batch를 되돌리는 것을 구분한다.

### prefetch만 중단할 조건

- 사용자의 학습 접근률이 매우 낮은데 불필요한 목록 요청이 유의미하게 증가
- pointer intent가 너무 민감해 네트워크 사용량이 문제
- route module 선행 로딩이 첫 화면의 중요 asset과 경쟁

이 경우 bootstrap과 D1 batch는 유지할 수 있다.

### 서버 batch를 되돌릴 조건

- 특정 D1 runtime에서 batch 결과 순서 계약이 깨짐
- 현재 사용자 진도 또는 풀이 기록이 다른 사용자 데이터와 섞임
- 기존 404, rate-limit 또는 계정 상태 계약이 깨짐

회귀 테스트는 이 세 종류의 문제를 배포 전에 잡도록 구성했다.

## 남은 측정 경계

현재 evidence는 동일 조건 제어 실험과 구조적 테스트를 제공한다. 배포 후 실제 사용자가 만든 충분한
운영 표본이 쌓이기 전에는 새로운 운영 p50·p95를 주장하지 않는다. 제어 실험은 dispatch 감소가
유효함을 보여주지만 인터넷과 브라우저를 포함한 end-to-end 보장은 아니다.

운영 후속 측정에서는 다음을 별도로 기록한다.

1. `/api/v1/learning/bootstrap` application, Worker wall, CPU
2. `/api/v1/learning/units/:id` application, Worker wall, CPU
3. 직접 진입과 앱 내부 이동의 브라우저 resource timing
4. prefetched detail과 즉시 클릭 detail의 cache hit 여부
5. 첫 계정과 established user의 분리 통계

충분한 표본이 없으면 `정량 측정 불가`로 남긴다.
