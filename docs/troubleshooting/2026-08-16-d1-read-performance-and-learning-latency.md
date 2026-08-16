---
title: D1 조회 병목 제거의 전체 구조와 학습 페이지 잔여 지연 분석
date: 2026-08-16
tags: [performance, d1, jobs, learning, react-query, troubleshooting]
generatedByAI: true
model: GPT-5
pr: '#not-applicable-operational-follow-up'
commit: 7f921bc819b416ec329dcf625501c4b4b6c33284, a3c02ccb44052c7e3500729d6ce179955dc94b42
evidence: docs/evidence/d1-read-performance-and-learning-diagnosis-2026-08-16.json
---

# D1 조회 병목 제거의 전체 구조와 학습 페이지 잔여 지연 분석

## 결론부터 보기

CareerGround의 조회가 느렸던 핵심 원인은 데이터 행 수나 JavaScript 계산량이 아니었다. 한 화면을
그리기 위해 Cloudflare D1에 여러 번 요청하고, 각 결과를 기다린 다음 다음 요청을 보내는 구조가
지연을 만들었다. 당시 채용 목록은 40개를 반환하는 요청 하나가 application 899ms, Worker wall
913ms였지만 CPU는 6ms뿐이었다. Worker가 계산한 시간이 아니라 원격 D1 결과를 기다린 시간이
대부분이었다.

채용 조회는 다음 네 가지를 함께 바꿔 체감 속도를 개선했다.

1. 사용자 확인, rate limit, 실제 데이터를 하나의 D1 batch로 묶었다.
2. 직접 `/jobs`에 진입할 때 필요한 사용자·알림·카테고리·공고를 한 bootstrap 응답으로 합쳤다.
3. 활성 공고 catalog를 한 번 받은 뒤 검색·필터·정렬·달력 이동을 브라우저 메모리에서 처리했다.
4. 채용 화면 JavaScript를 앱 진입 직후 미리 받아 인증과 화면 코드 다운로드를 겹쳤다.

동일 데이터와 D1 dispatch당 25ms의 제어 지연을 사용한 9회 측정에서 채용 첫 페이지의 최대 D1
dispatch는 4회에서 1회로 줄었다. p50은 124.21ms에서 31.59ms, p95는 126.81ms에서
32.00ms로 줄었다. 이 수치는 운영 인터넷 속도가 아니라 왕복 수 차이를 비교하는 제어 실험이다.

반면 학습 목록은 이미 1 dispatch로 개선됐지만, 단원 상세는 아직 5 dispatch와 3개의 직렬 대기
단계를 사용한다. 최근 운영 로그의 단원 상세 4회는 wall 536–548ms, CPU 3–4ms였다. 운영 데이터가
4개 자료, 23개 단원, 플래시카드 46개, 문제 23개, 문제 풀이 시도 0개인 점을 함께 보면 현재 학습
지연의 우선 원인은 데이터 양이 아니라 남아 있는 D1 왕복 구조다.

## 이 문서가 답하는 질문

- 데이터가 많지 않은데 왜 조회가 0.5–0.9초씩 걸렸는가?
- D1 자체가 느린 것인가, D1을 호출하는 방식이 느린 것인가?
- 채용 조회는 어떤 코드 구조에서 어떤 구조로 바뀌었는가?
- 인덱스, batch, bootstrap, React Query catalog cache가 각각 어떤 역할을 했는가?
- 현재 학습 목록과 단원 상세는 왜 속도가 다른가?
- 다음 학습 성능 개선은 어떤 순서로 해야 하며 무엇을 측정해야 하는가?

## 측정과 주장 규칙

이 문서는 다음 세 종류의 근거를 구분한다.

| 근거               | 의미                                            | 사용 범위                           |
| ------------------ | ----------------------------------------------- | ----------------------------------- |
| 운영 Worker 로그   | 실제 배포 환경의 application, wall, CPU 시간    | 현재 사용자가 느끼는 서버 구간 확인 |
| 제어 지연 벤치마크 | 로컬 D1 호환 DB에 dispatch마다 같은 25ms를 추가 | 왕복 수 변화의 상대 비교            |
| 코드·회귀 테스트   | 호출 순서, statement 수, batch 수, cache 동작   | 구조적 보장과 재발 방지             |

제어 지연 수치를 운영 응답 시간처럼 해석하지 않는다. 서로 다른 데이터·runtime·명령의 수치로
개선율을 만들지 않는다. 학습 개선안은 아직 구현하지 않았으므로 예상 운영 시간을 약속하지 않는다.

## 먼저 알아야 할 용어

### SQL statement

`SELECT`, `INSERT`, `UPDATE` 하나를 의미한다. statement가 여러 개여도 하나의 D1 batch에 담으면
네트워크 dispatch는 한 번일 수 있다.

### D1 dispatch

Worker가 D1 서비스로 보내는 원격 호출 한 번이다. 현재 병목에서는 statement의 로컬 계산 비용보다
dispatch 결과를 기다리는 시간이 훨씬 컸다.

### dispatch wave

동시에 보낼 수 있는 dispatch 묶음이다. 예를 들어 세 쿼리를 `Promise.all`로 보낸다면 dispatch는
3회지만 대기 단계는 1개다. 그러나 그 전에 다른 조회를 `await`했다면 전체는 2개 이상의 직렬
wave가 된다.

### HTTP request와 D1 dispatch는 다르다

브라우저의 HTTP 요청 하나가 D1을 여러 번 호출할 수 있다. 반대로 HTTP 요청 하나 안의 여러 SQL을
`DB.batch`로 묶으면 D1 dispatch는 한 번이 된다. 화면 성능을 볼 때 두 계층을 따로 세어야 한다.

## 장애 당시의 실제 신호

채용 목록의 변경 전 운영 기준선은 다음과 같았다.

| 경로      | application | Worker wall | Worker CPU |
| --------- | ----------: | ----------: | ---------: |
| 채용 목록 |       899ms |       913ms |        6ms |
| 채용 달력 |       722ms |       732ms |        5ms |

CPU가 5–6ms인데 wall이 0.7–0.9초라는 것은 다음 항목이 주원인이 아님을 뜻한다.

- 40개 행을 JSON으로 바꾸는 계산
- React 컴포넌트의 서버 실행
- 복잡한 비즈니스 규칙 연산
- 데이터 100여 개 자체의 크기

Worker가 CPU를 거의 쓰지 않은 채 기다렸으므로 먼저 원격 D1 왕복과 플랫폼 대기를 확인해야 했다.

## 변경 전 구조: 작은 조회가 긴 워터폴이 됐다

### 서버의 채용 첫 페이지

변경 전의 정상 사용자 요청은 개념적으로 다음 순서였다.

```ts
const user = await resolveUser(identity, env); // D1 왕복 1
await enforceRateLimit(request, env, user.id, path); // D1 왕복 2
const rows = await all(db, jobsSql, ...values); // D1 왕복 3
const total = await first(db, countSql, ...values); // D1 왕복 4
return { items: rows, total };
```

각 SQL 자체는 짧아도 앞 요청이 끝나야 다음 요청을 보냈다. 네 번의 왕복 시간이 그대로 누적됐다.
해당 분의 첫 요청에는 오래된 rate-limit 행을 삭제하는 추가 작업까지 생길 수 있었다.

### 브라우저의 직접 `/jobs` 진입

서버 왕복만 문제가 아니었다. 브라우저도 다음 순서로 움직였다.

```text
공통 /bootstrap 완료
→ JobsPage lazy chunk 다운로드
→ /jobs/categories 요청
→ /jobs 목록 요청
→ 화면 표시
```

화면 코드와 데이터가 인증 뒤에 직렬로 이어졌다. API 하나를 빠르게 해도 전체 첫 화면은 별도 요청
워터폴 때문에 계속 늦을 수 있었다.

### 사용자의 모든 필터 동작이 새 원격 조회였다

검색어, 회사 규모, 직무, 저장 공고, 정렬, 달력 월을 바꿀 때마다 React Query key가 바뀌고 새로운
`GET /jobs`가 실행됐다.

```tsx
const listJobs = useInfiniteQuery({
  queryKey: ['jobs', 'list', sizes, categories, search, savedOnly, sort],
  queryFn: ({ pageParam }) => api(`/jobs?${makeParams(pageParam)}`),
});
```

서버 pagination은 데이터가 매우 클 때 적합하지만, 활성 공고가 약 100개인 당시 규모에서는 사용자가
버튼을 누를 때마다 원격 D1을 다시 기다리는 비용이 더 컸다.

## 1단계 개선: 한 HTTP 요청 안의 D1 왕복을 합쳤다

### 사용자 컨텍스트도 statement로 만들었다

사용자 조회와 rate-limit 갱신을 먼저 `await`하지 않고 실제 데이터 쿼리와 함께 batch에 넣을 수 있는
statement로 만들었다.

```ts
const contextStatements = requestContextStatementsForSiteUser(
  env.DB,
  identity.userId,
  window,
  includeUnread,
);
```

해당 함수는 기존 사용자 조회와 rate-limit `INSERT ... ON CONFLICT ... RETURNING`을 준비한다.
사용자별 데이터 쿼리는 내부 DB 사용자 ID를 별도로 먼저 읽지 않고 다음 형태를 사용한다.

```sql
WHERE user_id = (SELECT id FROM users WHERE site_user_id = ?)
```

그 결과 사용자 컨텍스트와 실제 데이터를 하나의 `DB.batch`에 넣을 수 있게 됐다.

### 쿼리 실행과 결과 해석을 분리했다

데이터 함수가 즉시 D1을 호출하지 않고 `statements`와 `value`를 반환하는 plan 구조로 바뀌었다.

```ts
type FastReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

const plan = jobListPlan(env.DB, owner, url);
const results = await env.DB.batch([...contextStatements, ...plan.statements]);
return plan.value(results.slice(dataIndex));
```

이 구조의 중요한 점은 SQL 개수를 무조건 하나로 줄이는 것이 아니다. 서로 독립적인 statement를 한
원격 dispatch에 담고 결과 배열을 순서대로 해석한다.

### 목록과 전체 개수도 같은 batch로 보냈다

cursor 페이지는 `LIMIT + 1` 목록과 `COUNT(*)`를 둘 다 필요로 한다. 변경 전에는 목록을 받은 뒤
COUNT를 요청했지만, 변경 후에는 두 statement를 같은 batch에 넣었다.

```ts
const statements = [db.prepare(jobRowsSql).bind(...rowValues)];

if (paged) {
  statements.push(db.prepare(jobCountSql).bind(...countValues));
}
```

statement는 두 개지만 D1 dispatch는 한 번이다.

### 첫 채용 화면 전용 bootstrap을 만들었다

`GET /jobs/bootstrap`은 다음 값을 한 응답에 포함했다.

- 현재 사용자
- 읽지 않은 알림 수
- 채용 카테고리
- 첫 목록 또는 달력 데이터
- cursor와 전체 개수

AuthProvider는 직접 `/jobs`로 들어왔을 때 공통 `/bootstrap` 대신 채용 bootstrap을 호출하고 결과를
React Query cache에 미리 넣었다.

```tsx
const jobsBootstrap =
  window.location.pathname === '/jobs'
    ? { path: '/jobs/bootstrap?catalog=true', queryKey: ['jobs', 'catalog'] }
    : undefined;

const payload = await api(jobsBootstrap?.path || `/bootstrap${includeHome ? '?home=1' : ''}`);

client.setQueryData(['notification-unread-count'], { count: payload.unreadCount });
client.setQueryData(['jobs', 'categories'], payload.categories);
client.setQueryData(['jobs', 'catalog'], payload.data);
```

인증과 첫 화면 데이터가 같은 HTTP 요청과 같은 D1 batch 경로를 사용하게 됐다.

### 화면 코드도 인증과 병렬로 미리 받았다

채용 페이지는 실패 시 다시 시도할 수 있는 단일 promise를 사용한다.

```tsx
let jobsPagePromise;

export const preloadJobsPage = () => {
  jobsPagePromise ??= import('./pages/JobsPage')
    .then((module) => ({ default: module.JobsPage }))
    .catch((error) => {
      jobsPagePromise = undefined;
      throw error;
    });
  return jobsPagePromise;
};

const JobsPage = lazy(preloadJobsPage);
void preloadJobsPage().catch(() => undefined);
```

이제 인증 API가 진행되는 동안 JobsPage chunk도 다운로드될 수 있다. 단순히 eager import로 바꾼 것이
아니라 route lazy loading을 유지하면서 네트워크 시점만 앞당겼다.

### 정렬 순서와 일치하는 부분 인덱스를 추가했다

기본 최신순은 다음과 같다.

```sql
ORDER BY collected_at DESC, id DESC
```

이에 맞춰 활성 신입 공고만 포함하는 인덱스를 추가했다.

```sql
CREATE INDEX idx_jobs_feed_collected_id
ON jobs (collected_at, id)
WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
  AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');
```

카테고리 전용 partial index도 추가했다. 변경 후 실행 계획은 새 index scan을 사용했고 임시 정렬
`USE TEMP B-TREE FOR ORDER BY`가 나타나지 않았다.

## 2단계 개선: 첫 조회 뒤 반복 원격 조회를 없앴다

### 전체 활성 catalog를 한 번만 hydrate했다

공고 수가 119개였던 시점에는 78,690 bytes의 catalog를 한 번 받는 편이 매 필터마다 D1을 다시
호출하는 것보다 유리했다. 최대 1,000개 제한을 두고 초과 시 잘린 목록을 조용히 보여주지 않고
명시적 오류를 반환하도록 했다.

```tsx
const catalogQuery = useQuery({
  queryKey: ['jobs', 'catalog'],
  queryFn: () => api('/jobs/bootstrap?catalog=true'),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
});
```

### 필터·검색·정렬·달력을 메모리 연산으로 바꿨다

```tsx
const filteredJobs = useMemo(
  () =>
    catalog
      .filter(matchesCompanySize)
      .filter(matchesCategory)
      .filter(matchesSavedOnly)
      .filter(matchesSearchTerms)
      .sort(compareJobs(sort)),
  [catalog, companySizes, selectedCategories, savedOnly, search, sort],
);

const calendarJobs = useMemo(
  () => filteredJobs.filter((job) => fallsWithinCalendar(job, from, to)),
  [filteredJobs, from, to],
);
```

catalog hydrate 후 다음 동작의 read request가 1회에서 0회가 됐다.

- 회사·직무·기술·고용형태·학력·경력·마감 필터
- 검색과 정렬
- 저장한 공고만 보기
- 목록/달력 전환
- 달력 월 이동
- 더 보기

저장·지원 상태 변경은 서버에 쓰고 catalog cache를 낙관적으로 갱신한다. 쓰기 실패 시 이전 snapshot을
복원하므로 속도 때문에 데이터 정합성을 포기하지 않았다.

### 일반 고빈도 조회도 fast read plan으로 통일했다

코딩 문제, 학습 목록, 복습 예정, 컬렉션, 휴지통도 사용자 확인과 route 데이터를 한 batch에 넣었다.

```ts
const readPlan = fastReadPlanFor(env.DB, owner, url);
const results = await env.DB.batch([
  ...requestContextStatementsForSiteUser(...),
  ...readPlan.statements,
]);
return readPlan.value(results.slice(dataIndex));
```

구조 변화는 다음과 같다.

| 경로                    |         변경 전 |       변경 후 |
| ----------------------- | --------------: | ------------: |
| 홈 bootstrap            |   11 statements |  5 statements |
| 채용 bootstrap          |    7 statements |  3 statements |
| 코딩 문제               |    3 dispatches |    1 dispatch |
| 학습 목록               |    3 dispatches |    1 dispatch |
| 복습 예정               |    2 dispatches |    1 dispatch |
| 컬렉션/휴지통           | 각 2 dispatches | 각 1 dispatch |
| hydrate 후 채용 UI 조작 | 조작당 read 1회 |           0회 |

### 학습 목록과 컬렉션은 JSON 집계로 결과 조립도 합쳤다

학습 목록은 source를 읽고 unit를 다시 읽은 뒤 JavaScript에서 그룹화하던 구조에서, source별 unit
요약을 JSON으로 집계하는 하나의 데이터 statement로 바뀌었다.

```sql
SELECT s.id, s.title, s.subject, s.category,
       COALESCE((
         SELECT json_group_array(json_object(
           'id', unit.id,
           'title', unit.title,
           'summaryPreview', unit.summaryPreview,
           'flashcardCount', unit.flashcardCount,
           'questionCount', unit.questionCount,
           'completed', unit.completed
         ))
         FROM (...) AS unit
       ), '[]') AS unitsJson
FROM learning_sources s
ORDER BY s.updated_at DESC;
```

여기에 사용자 조회와 rate-limit statement를 더해도 하나의 D1 batch로 실행된다.

### rate-limit 정리는 사용자 조회 hot path에서 분리했다

오래된 rate-limit 행 삭제는 매 조회 요청에 필요한 작업이 아니다. 주기적 maintenance와 제한된
bootstrap 경로로 옮겨 정상 read endpoint가 DELETE 왕복을 만들지 않게 했다.

## 정량 결과

### 채용 목록: 같은 데이터·runtime·명령

Node.js 24.19.0, 저장소 migration과 동일 seed, 9회 sample, dispatch당 25ms의 제어 지연 결과다.

| 지표             |  변경 전 | 변경 후 |        변화 |
| ---------------- | -------: | ------: | ----------: |
| 최대 D1 dispatch |        4 |       1 |  75.0% 감소 |
| p50              | 124.21ms | 31.59ms | 74.57% 감소 |
| p95              | 126.81ms | 32.00ms | 74.77% 감소 |
| 반환/전체        |   40/119 |  40/119 |        동일 |

### 새 catalog 경로

새 catalog bootstrap은 119개를 3 statements, 1 dispatch로 반환했다. p50은 31.53ms, p95는
41.40ms, 응답 크기는 78,690 bytes였다. 이 요청 형태는 변경 전 동일 형태가 없으므로 개선율을
주장하지 않는다.

### 왜 실제 체감이 크게 바뀌었는가

성능 변화는 한 SQL을 몇 ms 빠르게 만든 결과가 아니다.

```text
변경 전
사용자 동작 → HTTP 요청 → D1 왕복 → 화면 갱신

변경 후
최초 1회 catalog hydrate
사용자 동작 → 브라우저 메모리 필터 → 즉시 화면 갱신
```

첫 화면 안에서도 네 번의 직렬 D1 왕복을 한 batch로 줄였다. 최초 진입과 진입 후 상호작용 두 구간을
모두 바꿨기 때문에 체감 차이가 컸다.

## 정확성과 보안 경계

속도 개선 중 다음 조건은 유지했다.

- 저장 공고와 지원 상태는 현재 로그인한 Sites 사용자에게만 결합한다.
- 사용자별 상태가 포함된 catalog를 public CDN cache에 저장하지 않는다.
- React Query의 인증 브라우저 메모리에만 catalog를 둔다.
- 신규 사용자, 이메일·역할 변경, 비활성 사용자 검사는 기존 안전 경로로 fallback한다.
- rate limit 판정은 batch 결과를 받은 뒤 이전과 동일하게 적용한다.
- catalog 최대 1,000개를 넘으면 명시적으로 실패한다.
- 쓰기 낙관적 갱신이 실패하면 이전 cache snapshot으로 되돌린다.
- 기존 paged `/jobs` 경로는 호환성과 향후 대규모 전환을 위해 유지한다.

회귀 테스트는 첫 목록과 catalog의 D1 batch 수, query count, cache hydration, 필터 후 추가 read 0회,
새 사용자 bootstrap, 사용자별 저장 상태 분리, index 사용을 고정한다.

## 현재 학습 페이지의 잔여 지연

### 운영 데이터 규모

2026-08-16 운영 D1의 bounded table read 결과다.

| 테이블           | 행 수 |
| ---------------- | ----: |
| 학습 자료        |     4 |
| 학습 단원        |    23 |
| 플래시카드       |    46 |
| 복습 문제        |    23 |
| 문제 풀이 시도   |     0 |
| 사용자 학습 진행 |     2 |

이 규모만으로 0.5초 이상의 서버 대기를 설명하기 어렵다.

### 운영 로그

최근 180분의 성공한 HTTP 200 요청만 집계했다.

| 경로           | 표본 | application | Worker wall | Worker CPU |
| -------------- | ---: | ----------: | ----------: | ---------: |
| 공통 bootstrap |    4 |   p50 195ms |   p50 199ms |    p50 1ms |
| 학습 목록      |    1 |       192ms |       196ms |        2ms |
| 단원 상세      |    4 |   p50 530ms |   p50 541ms |    p50 3ms |
| 단원 상세 범위 |    4 |   524–536ms |   536–548ms |      3–4ms |

단원 상세는 wall 약 0.54초 중 CPU가 3–4ms다. 현재도 계산보다 D1 결과 대기가 지배적이다.

## 학습 목록은 이미 1 dispatch다

`GET /learning`은 fast read 경로에 포함되어 있다.

```ts
if (url.pathname === '/api/v1/learning') {
  return learningListPlan(db, owner);
}

const results = await env.DB.batch([
  userStatement,
  rateLimitStatement,
  learningJsonAggregateStatement,
]);
```

제어 벤치마크에서 학습 목록은 다음과 같았다.

| 지표                |         결과 |
| ------------------- | -----------: |
| D1 dispatch         |            1 |
| prepared statements |            3 |
| p50                 |      31.01ms |
| p95                 |      32.19ms |
| 응답                | 21,272 bytes |

따라서 학습 목록 SQL을 다시 작은 쿼리 여러 개로 나누는 것은 해결 방향이 아니다. 운영 CPU 2ms도
현재 JSON 집계 계산이 주병목이 아님을 보여준다.

## 직접 `/learning` 진입은 아직 전용 bootstrap이 없다

AuthProvider는 `/jobs`만 전용 bootstrap으로 처리한다.

```tsx
const includeJobs = window.location.pathname === '/jobs';
const jobsBootstrap = includeJobs ? initialJobsBootstrap() : undefined;

const payload = await api(jobsBootstrap?.path || `/bootstrap${includeHome ? '?home=1' : ''}`);
```

`/learning`은 다음 순서를 사용한다.

```text
GET /bootstrap
→ 인증 완료 후 App 렌더
→ LearningPage lazy chunk
→ LearningPage mount
→ GET /learning
→ 목록 렌더
```

SPA 내부에서 홈에서 학습으로 이동하면 이미 인증된 상태이므로 공통 bootstrap은 반복되지 않는다.
그러나 새 탭·새로고침·직접 주소 진입에서는 인증과 학습 데이터가 서로 다른 HTTP 요청이다.

제어 벤치마크의 `/bootstrap` + `/learning` 연속 데이터 준비는 2 dispatch, 5 statements, p50
62.38ms였다. 실제 운영 시간으로 해석하지 않으며 두 개의 dispatch 단계가 남아 있음을 확인하는
구조 측정이다.

## LearningPage만 사전 로딩되지 않는다

현재 앱 시작 시 `preloadJobsPage()`만 실행한다.

```tsx
void preloadJobsPage().catch(() => undefined);
```

학습 페이지는 일반 lazy import다.

```tsx
const LearningPage = lazy(() =>
  import('./pages/LearningPage').then((module) => ({ default: module.LearningPage })),
);
```

파일 크기가 매우 크지 않더라도 다운로드를 시작하는 시점이 늦다. 인증 뒤 route 렌더가 시작돼야
chunk를 요청하고, chunk 실행 뒤에야 `/learning` API를 호출한다. 이 워터폴은 D1 목록 API의 약
196ms 앞뒤에 추가된다.

## 단원 상세가 현재 가장 큰 병목이다

단원 카드를 누르면 그때 처음 상세 API를 요청한다.

```tsx
const unit = useQuery({
  queryKey: ['learning-unit', unitId],
  queryFn: () => api(`/learning/units/${unitId}`),
  staleTime: 5 * 60_000,
});
```

서버 route는 fast read 대상이 아니므로 먼저 공통 사용자와 rate-limit을 해결한다.

```ts
const user = await resolveUserAndRateLimit(identity, request, env, url.pathname);
return learningUnitDetail(env.DB, user.id, unitId);
```

그 뒤 상세 함수가 unit을 먼저 읽고, 성공을 확인한 후 나머지 세 쿼리를 보낸다.

```ts
const unit = await first(db, unitSql, userId, unitId);
if (!unit) throw new RouteError(404, '학습 단원을 찾을 수 없습니다.');

const [flashcards, questions, attempts] = await Promise.all([
  all(db, flashcardsSql, unitId),
  all(db, questionsSql, unitId),
  all(db, attemptsSql, userId, unitId),
]);
```

실제 D1 구조는 다음과 같다.

```text
wave 1: 사용자 조회 + rate-limit 갱신 batch       dispatch 1회, statements 2개
  ↓ await
wave 2: 단원 + 출처 + 사용자 progress 조회       dispatch 1회, statement 1개
  ↓ await / 404 확인
wave 3: 플래시카드, 문제, 풀이 시도 Promise.all  dispatch 3회, statements 3개

합계: dispatch 5회, statements 6개, 직렬 wave 3개
```

`Promise.all`은 마지막 세 쿼리의 대기 시간을 서로 겹치게 할 뿐 D1 dispatch를 하나로 합치지 않는다.

### 제어 벤치마크

선택한 단원은 플래시카드 2개, 문제 1개, 시도 0개이고 응답은 2,558 bytes였다.

| 지표                |        결과 |
| ------------------- | ----------: |
| D1 dispatch         |           5 |
| prepared statements |           6 |
| 직렬 dispatch wave  |           3 |
| p50                 |     93.85ms |
| p95                 |     94.90ms |
| 응답                | 2,558 bytes |

dispatch마다 동일한 25ms를 넣었기 때문에 목록 1 dispatch보다 상세 3-wave 구조가 느리다는 점이
재현된다. 운영의 0.54초를 예측하는 수치가 아니다.

## 현재 학습 지연의 원인 우선순위

### 1순위: 단원 상세의 5 dispatch, 3 wave

운영 상세 4회가 모두 비슷한 0.53초 application 시간을 보였고 CPU는 3–4ms다. 현재 가장 직접적이고
반복 가능한 병목이다.

### 2순위: 직접 학습 진입의 두 HTTP 데이터 단계

공통 bootstrap과 학습 목록이 분리되어 있다. 새로고침에서는 두 요청이 순차적으로 필요하다.

### 3순위: 학습 route chunk 사전 로딩 부재

채용 페이지와 달리 학습 화면 코드를 앱 진입 시 미리 요청하지 않는다. API 요청 시작 시점도 그만큼
뒤로 밀린다.

### 4순위: 상세 사전 준비가 전혀 없음

카드 hover, keyboard focus, 첫 source 확장 시점에도 상세 cache를 준비하지 않는다. 클릭 뒤 모든
대기가 시작된다. 단, 먼저 서버 dispatch를 1회로 줄인 뒤에도 체감이 부족할 때 적용해야 한다.

### 장기 위험: 풀이 시도 조회 인덱스

현재 attempts index는 `(user_id, question_id, attempted_at)`이고 상세 쿼리는 `user_id`와 join된
`unit_id`를 필터링한다. 현재 운영 attempts가 0개이므로 지금 지연의 원인은 아니다. 데이터가 크게
늘면 `EXPLAIN QUERY PLAN`과 대규모 fixture로 scan 여부를 확인한 뒤 인덱스 또는 데이터 모델을
조정해야 한다.

## 현재 원인이 아닌 것

### 학습 데이터가 많아서가 아니다

23개 단원과 46개 플래시카드 수준이다. 상세 응답도 2.6KB 정도다.

### Worker 계산이 무거워서가 아니다

단원 상세 CPU는 3–4ms인데 wall은 536–548ms다.

### 이미지 다운로드가 API 응답을 막아서가 아니다

상세 이미지에는 `loading="lazy"`, `decoding="async"`가 적용되어 있다. 이미지가 화면 완성 시점에는
영향을 줄 수 있지만, JSON 상세 데이터가 도착하기 전의 0.54초 서버 대기를 설명하지 않는다.

### ReactMarkdown만의 문제도 아니다

Markdown 렌더는 상세 JSON이 도착한 뒤 시작한다. 현재 로그가 보여주는 서버 wall 자체가 이미 약
0.54초다. 클라이언트 렌더 최적화 전에 D1 dispatch를 먼저 줄여야 한다.

### SQL 인덱스 하나만 추가해서 해결될 문제가 아니다

현재 CPU와 데이터 규모가 작고, 상세의 각 관계에는 기본적인 unit/user 인덱스가 있다. 인덱스가
필요한 장기 구간은 따로 있지만 지금은 다섯 번 호출하는 구조가 우선이다.

## 권장 학습 개선 설계

이 절은 분석 결과에 따른 다음 구현 순서다. 아직 적용되지 않았으며 운영 개선율을 주장하지 않는다.

### 1. `/learning/bootstrap`을 추가한다

직접 `/learning` 진입 시 다음을 한 HTTP 응답과 한 D1 batch로 반환한다.

- 현재 사용자
- 읽지 않은 알림 수
- 학습 source와 unit 요약

AuthProvider는 `/jobs`와 같은 방식으로 `['learning']` cache를 hydrate한다.

구조 목표:

```text
직접 학습 진입 데이터 HTTP 요청 2회 → 1회
D1 dispatch 2회 → 1회
```

### 2. 단원 상세를 fast read plan으로 바꾼다

단원, 플래시카드, 문제, attempts statement를 사용자 컨텍스트와 함께 하나의 `DB.batch`에 담는다.

```ts
function learningUnitDetailPlan(db, owner, unitId): FastReadPlan {
  return {
    statements: [
      unitStatement(db, owner, unitId),
      flashcardStatement(db, unitId),
      questionStatement(db, unitId),
      attemptStatement(db, owner, unitId),
    ],
    value: assembleLearningUnit,
  };
}

const results = await db.batch([
  ...requestContextStatementsForSiteUser(...),
  ...plan.statements,
]);
```

단원 없음 검사는 batch 결과의 첫 result를 확인한 뒤 404를 반환하면 된다.

구조 목표:

```text
단원 상세 D1 dispatch 5회 → 1회
직렬 dispatch wave 3개 → 1개
prepared statement 6개는 유지 가능
```

statement 수를 억지로 줄이기 위해 거대한 SQL 하나를 만들 필요는 없다. 우선 dispatch만 합치는 편이
코드 가독성과 결과 조립의 명확성을 유지한다.

### 3. LearningPage를 채용과 같은 패턴으로 preload한다

실패 시 promise를 초기화하는 resilient preload를 재사용한다. 이 변경은 API 자체를 빠르게 하지는
않지만 API 요청을 시작하는 시점을 앞당긴다.

### 4. 그 다음에만 의도 기반 prefetch를 검토한다

서버를 1 dispatch로 바꾼 후에도 카드 클릭 체감이 부족하면 다음 이벤트에서
`queryClient.prefetchQuery`를 검토한다.

- 마우스 hover
- 키보드 focus
- touch pointer down
- 첫 source를 펼친 뒤 idle 시간

모든 23개 상세를 즉시 가져오는 것은 불필요한 D1과 네트워크 사용을 만들 수 있으므로 피한다.

### 5. attempts 데이터가 커질 때만 인덱스를 재평가한다

최소 수천~수만 개의 시도 fixture와 실제 쿼리 형태로 `EXPLAIN QUERY PLAN`을 확인한다. scan이
확인될 때 `(user_id, attempted_at)` 보조 인덱스, question ID 사전 제한, 또는 attempts에 unit ID를
저장하는 모델을 비교한다.

## 다음 구현의 검증 기준

학습 개선을 실제 적용할 때 다음 증거가 모두 필요하다.

1. 같은 migration·seed·Node 버전·25ms dispatch delay로 변경 전후를 9회 이상 측정한다.
2. 직접 `/learning` bootstrap의 D1 batch count가 1인지 테스트한다.
3. 단원 상세의 D1 batch count가 1이고 사용자·rate limit·404 동작이 유지되는지 테스트한다.
4. source 4개, unit 23개, flashcard/question/attempt 응답이 변경 전과 같은지 비교한다.
5. 다른 사용자의 progress와 attempts가 섞이지 않는지 격리 테스트를 추가한다.
6. route chunk preload 실패 후 실제 진입에서 다시 시도되는지 테스트한다.
7. 배포 후 Worker application/wall/CPU를 같은 route로 다시 수집한다.
8. API가 빨라진 뒤에만 Markdown과 이미지 렌더 시간을 브라우저에서 분리 측정한다.

구조적 목표는 분명하지만 생산 지연이 몇 ms가 될지는 배포 후 같은 조건에서만 기록한다.

## 다시 조회가 느려졌을 때의 점검 순서

### 1. CPU와 wall을 먼저 비교한다

- CPU와 wall이 함께 크다: SQL 계산, JSON, 렌더, 비정상 loop를 본다.
- CPU는 작고 wall만 크다: D1 dispatch, 플랫폼 대기, 외부 네트워크를 본다.

### 2. HTTP 요청 수와 D1 dispatch 수를 따로 센다

브라우저 Network에서 API 개수를 확인하고, 회귀 테스트 또는 계측 D1 adapter에서 dispatch 수를
확인한다. HTTP 한 번이라고 D1도 한 번이라고 가정하지 않는다.

### 3. waterfall을 그린다

```text
인증 → route chunk → 목록 → 상세 → 이미지
```

병렬 가능한 항목이 앞 단계의 `await` 뒤에 숨어 있지 않은지 본다.

### 4. React Query key 변화를 본다

필터나 탭을 바꿀 때 새로운 key와 새 GET이 만들어지는지 확인한다. catalog hydrate 이후 채용 조작은
read request가 없어야 한다.

### 5. query plan은 왕복 구조 다음에 본다

인덱스는 중요하지만 CPU가 수 ms이고 dispatch가 여러 번이면 먼저 batch로 왕복을 합친다. 그 후
`EXPLAIN QUERY PLAN`에서 scan, temporary sort, 잘못된 index 선택을 확인한다.

### 6. 응답 크기와 데이터 수를 함께 기록한다

작은 데이터인데 느리면 왕복 지연 가능성이 높다. 큰 응답이면 pagination, 압축, projection 축소,
catalog 상한을 검토한다.

## 재현 명령

채용 변경 전후 제어 벤치마크:

```bash
pnpm exec tsx scripts/performance/benchmark-job-read-path.mjs
```

현재 학습 진단 벤치마크:

```bash
node --import tsx scripts/performance/benchmark-learning-read-path.mjs
```

핵심 회귀 테스트:

```bash
pnpm exec vitest run deployment/sites/d1-api.test.ts
```

증거 원본:

- `docs/evidence/jobs-d1-roundtrip-2026-08-15.json`
- `docs/evidence/read-path-fast-catalog-2026-08-15.json`
- `docs/evidence/d1-read-performance-and-learning-diagnosis-2026-08-16.json`

## 관련 코드 지도

| 영역              | 파일                                            | 확인할 내용                            |
| ----------------- | ----------------------------------------------- | -------------------------------------- |
| 공통 인증 hydrate | `apps/web/src/auth.tsx`                         | route별 bootstrap과 query cache 주입   |
| route preload     | `apps/web/src/App.tsx`, `apps/web/src/main.tsx` | JobsPage와 LearningPage 차이           |
| 채용 catalog      | `apps/web/src/pages/JobsPage.tsx`               | 메모리 필터·정렬·달력·낙관적 갱신      |
| 학습 목록·상세    | `apps/web/src/pages/LearningPage.tsx`           | 목록 query와 클릭 후 상세 query        |
| D1 fast read      | `deployment/sites/d1-api.ts`                    | batch plan, learning list, unit detail |
| 인덱스            | `db/schema.ts`, `drizzle/*.sql`                 | feed, category, learning 관계 index    |
| D1 회귀           | `deployment/sites/d1-api.test.ts`               | batch count, query count, 응답 격리    |
| 제어 벤치마크     | `scripts/performance/*.mjs`                     | 동일 25ms dispatch delay 측정          |

## 남은 한계

- 운영 학습 목록 표본은 선택한 로그 구간에 1개뿐이다.
- 진단용 브라우저 세션은 로그인되어 있지 않아 개인 학습 화면의 Resource Timing은 수집하지 않았다.
- Worker 로그는 전체 wall/CPU를 제공하지만 D1 statement별 시간은 제공하지 않는다.
- 제어 벤치마크는 인터넷, 브라우저 렌더, 정적 파일, 운영 D1 latency를 포함하지 않는다.
- 이 문서 작성 시점에는 학습 성능 코드 수정이 포함되지 않았다.
- 첫 방문에는 인증, HTML·JavaScript 다운로드, Worker cold start 변동이 남으므로 모든 요청 0.3초를
  보장할 수 없다.

현재 확실히 말할 수 있는 결론은 다음과 같다. 채용 체감 속도 개선은 데이터베이스를 교체한 결과가
아니라 D1 사용 방식을 바꾼 결과다. 학습 목록에도 같은 방식이 일부 적용돼 있지만, 단원 상세과 직접
진입 경로에는 아직 동일한 통합이 끝나지 않았다. 다음 성능 작업은 새 인덱스를 추측해 추가하는 것보다
학습 bootstrap과 상세 fast batch를 먼저 구현하는 것이 근거상 가장 우선이다.
