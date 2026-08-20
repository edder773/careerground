---
title: 채용 catalog 증분 대조와 복수 필터 상태 안정화
date: 2026-08-20
tags: [jobs, d1, migration, filters, regression]
generatedByAI: false
---

# 채용 catalog 증분 대조와 복수 필터 상태 안정화

## 증상과 기준선

2026-08-20 전달 파일은 현재 운영 catalog 전체가 아니라 활성 공고 일부를 모은 증분
자료였다. 기존 51개를 이 29개로 단순 교체하면 파일에 없다는 이유만으로 아직 모집 중인
상시채용과 사용자 저장 관계까지 잃을 수 있었다. UI에서는 검색어 debounce, 복수 체크,
정렬이 각각 URL을 갱신해 빠르게 연속 조작하면 나중 동작이 이전 상태를 되살리는 경쟁
조건도 있었다.

| 항목             | 대조 전/입력 |        적용 후 |
| ---------------- | -----------: | -------------: |
| 기존 저장 공고   |           51 |             67 |
| 전달 활성 공고   |           29 |    29개 upsert |
| 기존과 일치      |           13 |      13개 갱신 |
| 신규             |           16 |      16개 추가 |
| 명시 마감일 경과 |            7 | `EXPIRED` 전환 |
| 목록 노출        |           51 |             60 |

정량값은
`data/imports/job-refresh-2026-08-20/reconciliation.json`과 동일 입력을 검증하는
generator 회귀 테스트에서 산출했다. 응답 시간은 동일한 운영 조건의 전후 측정값이 없어
개선율을 주장하지 않는다.

## 핵심 이론 1: snapshot의 완전성을 먼저 판정한다

부분 snapshot에서 **부재는 삭제 증거가 아니다**. 따라서 source URL을 자연 키로 사용해
입력 29개만 upsert하고, 기존 비상시 공고는 명시된 마감 시각이 수집 시각보다 빠른 7개만
`EXPIRED`로 전환했다. SQL은 `jobs`나 `saved_jobs`를 삭제하지 않아 개인 저장 관계를
보존한다.

```sql
INSERT INTO jobs (...) VALUES (...)
ON CONFLICT(source_url) DO UPDATE SET ...;

UPDATE jobs
SET status = 'EXPIRED', updated_at = '2026-08-20T13:13:48+09:00'
WHERE source_url = ? AND rolling = 0;
```

입력에서 사라진 기존 상시채용 7개는 원문을 별도로 확인했다. 6개는 원문에서 모집 중임을
확인해 유지했고, Coupang 1개는 원문이 anti-bot 응답을 반환해 종료를 입증할 수 없으므로
보수적으로 유지했다. 검증 불가를 종료로 해석하지 않는 정책도 generator가 강제한다.

## 핵심 이론 2: URL 상태에는 하나의 갱신 경로만 둔다

검색, 기업 규모, 직무, 정렬은 공유·새로고침·뒤로 가기가 가능한 URL query가 정본이다.
이전에는 각 UI 상태가 서로 다른 시점의 `searchParams` 사본을 덮어쓸 수 있었다. 수정 후
모든 동작은 최신 query를 가리키는 ref에서 복사한 뒤 한 coordinator로 원자적으로
반영한다.

```ts
const updateSearchParams = (update) => {
  const next = new URLSearchParams(searchParamsRef.current);
  update(next);
  searchParamsRef.current = next;
  setSearchParams(next, { replace: true });
};
```

회귀 시나리오는 검색어를 입력한 350ms debounce 구간에 기업 규모 2개와 직무 1개를
적용하고, debounce 완료·새로고침 뒤에도 세 조건이 모두 유지되는지 확인한다. 즉시
`전체 해제 → 정렬`을 실행해도 제거한 query가 다시 생기지 않는 E2E도 추가했다.

## 화면 전후 확인

필터는 모든 기업 규모와 직무를 체크박스로 한 번에 선택한다. 데스크톱은 1440×900,
모바일은 375×812에서 실제 Chromium으로 캡처했다. 최초 모바일 증거 검토에서 inline
dialog가 창의 stacking context에 갇혀 본문과 겹치는 결함을 발견했고, portal·overlay로
분리한 뒤 다시 캡처했다. 모바일의 긴 선택지는 모달 내부에서만 스크롤된다.

![데스크톱 복수 필터](../assets/troubleshooting/current/jobs-multi-filter-desktop-1440.webp)

![모바일 복수 필터](../assets/troubleshooting/current/jobs-multi-filter-mobile-375.webp)

## 재현과 검증

```bash
pnpm jobs:catalog:reconcile
pnpm --filter @careerground/web test -- DomainPages.test.tsx
pnpm exec playwright test e2e/mvp.spec.ts --project=chromium --grep "filters jobs"
pnpm exec playwright test e2e/visual.spec.ts --project=chromium --grep "captures core domain screens"
```

generator는 선언된 수량 불일치, 마감 전 `EXPIRED` 전환, 원문 종료 증거 없는 상시채용
제거를 실패 처리한다. D1 runtime 테스트는 migration 0024 적용 후 67개 저장, 60개 노출,
7개 만료와 신규 공고 조회를 검증한다.
