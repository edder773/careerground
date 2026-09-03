---
title: 120개 채용 catalog import와 필터 사용성
date: 2026-08-13
tags: [jobs, import, filters, pr-19]
generatedByAI: false
pr: 19
commit: 04cfb6e2bf13f9ecc198069d2cbe2eb963302b97
evidence: docs/evidence/archive/pr-19-manifest.json
---

# 120개 채용 catalog import와 필터 사용성

## 문제

기업 규모와 직무 filter가 서로 다른 단일 선택 menu라 “대기업+중견”, “백엔드+데이터”처럼 조합할 수 없었다. 공고 시작·마감 정보와 source가 작게 보였고 정렬과 글자 크기 선택도 없었다. 제공된 최신 120개 catalog를 기존 사용자 저장/지원 상태를 잃지 않고 반영해야 했다.

## 핵심 이론

catalog row와 사용자 상태를 같은 row replacement로 다루면 import가 bookmark/application을 지울 수 있다. source record는 stable ID/fingerprint로 upsert하고 사용자 상태 table은 그대로 둬야 한다. source에 없는 값은 추측해 채우지 않으며 provenance와 확인 날짜를 명확히 표시한다.

## 전후 비교

```diff
- 기업규모 1개 + 직무 1개 선택
+ 하나의 funnel panel에서 모든 옵션 checkbox 다중 선택
+ button sort + persistent font scale

- 작은 최신일/마감 정보
+ 시작·확인일과 마감일을 별도 강조
+ source provider/domain 노출
```

## 데이터 결과

| 항목                            |          수량 |
| ------------------------------- | ------------: |
| 제공 catalog                    |           120 |
| upsert 대상                     |           120 |
| 현재 공개                       |           119 |
| `NEEDS_REVIEW`로 비공개         |             1 |
| catalog에 없지만 history로 보존 | 1 (`EXPIRED`) |

source가 시작일을 주지 않은 경우 날짜를 발명하지 않고 `시작·확인일`로 수집/검증일을 표시했다. migration generator로 JSON과 SQL을 재현할 수 있게 했다.

## 검증과 증빙의 주의점

PR 본문과 GitHub CI는 lint/typecheck/71 tests/14 Playwright/build/sites:build 통과를 기록한다. 반면 당시 troubleshooting artifact의 `test.txt`에는 한 번의 exit code 1이 남았고 manifest collector가 파일 존재만 보고 `passed`로 잘못 표기했다. 따라서 이 문서는 해당 artifact 한 개만으로 test 성공을 주장하지 않고, 최종 PR CI와 본문 기록을 함께 근거로 사용한다. 이번 작업에서는 collector가 exit code를 실제 status로 판정하도록 보강한다.

## 회귀 방지

- import 전후 saved job/application row 수와 foreign target을 비교한다.
- 여러 company size/category query parameter 조합을 D1/API/E2E에서 검증한다.
- source에 없는 start date를 생성하지 않는 테스트를 둔다.
- validation collector는 로그의 마지막 `exit code`를 읽어 실패를 통과로 기록하지 않는다.

## 근거

- [PR #19](https://github.com/edder773/careerground/pull/19)
- `docs/evidence/archive/pr-19-manifest.json`
- 원본 import는 migration 반영 후 현재 운영 경로에서 제거했다. 당시 바이트는
  `git show 04cfb6e2:data/imports/careerground_job_postings_120_2026-08-13.json`으로 재현한다.
