---
title: 채용공고 D1 왕복과 초기 로딩 워터폴 제거
date: 2026-08-15
tags: [performance, jobs, d1, sites, bootstrap, troubleshooting]
generatedByAI: true
evidence: docs/evidence/jobs-d1-roundtrip-2026-08-15.json
---

# 채용공고 D1 왕복과 초기 로딩 워터폴 제거

## 현상과 운영 기준선

채용공고는 119개 활성 항목 중 40개만 내려주는데도 운영 목록 API가 899ms, Worker wall
time이 913ms 걸렸다. 같은 요청의 Worker CPU는 6ms였다. 달력 조회도 application 722ms,
wall 732ms, CPU 5ms였다. CPU와 wall time의 차이로 볼 때 JSON 변환이나 React 렌더가 아니라
D1 응답 대기가 지연의 대부분이었다.

기존 첫 cursor page는 다음 D1 작업을 직렬로 실행했다.

```text
사용자 조회
→ 요청 제한 INSERT RETURNING
→ 공고 40+1개 SELECT
→ 전체 개수 COUNT
```

해당 분의 첫 요청에서는 오래된 요청 제한 행 DELETE가 추가될 수 있었다. 브라우저는 별도로
인증 bootstrap이 끝난 뒤 JobsPage chunk를 받고, 다시 categories와 jobs를 요청했다. 데이터가
작아도 네트워크 왕복이 이어지는 구조였다.

## 변경한 구조

### 1. 인증·요청 제한·공고 데이터를 하나의 D1 batch로 합쳤다

정상적인 기존 사용자의 `GET /jobs`, `GET /jobs/categories`, `GET /jobs/bootstrap`은 사용자 확인,
요청 제한 갱신, 필요한 조회를 하나의 D1 batch로 실행한다. 역할·이메일이 바뀐 경우와 신규 사용자만
기존 안전한 사용자 동기화 경로를 사용한다. 비활성 사용자 차단과 route별 rate limit은 batch 결과를
검증한 뒤 이전과 동일하게 적용한다.

일반 API도 사용자 확인과 요청 제한 갱신을 한 batch로 묶었다. 요청 제한 정리는 홈 bootstrap과
채용 bootstrap에서 수행하므로 매 read endpoint가 별도 DELETE 왕복을 만들지 않는다.

### 2. 첫 채용 화면 전용 bootstrap을 추가했다

`GET /jobs/bootstrap`은 아래 값을 한 응답으로 반환한다.

- 현재 사용자와 읽지 않은 알림 수
- 채용 카테고리
- 현재 URL 필터에 맞는 목록 또는 달력 데이터
- 목록 cursor와 전체 개수

`/jobs`로 직접 들어오면 전역 인증 Provider가 이 응답으로 사용자, 알림, 카테고리와 React Query의
첫 infinite page를 동시에 채운다. 홈에서 채용으로 이동한 경우에도 JobsPage가 같은 endpoint를
사용하므로 categories와 목록 요청이 중복되지 않는다.

JobsPage module은 앱 진입 직후 미리 요청한다. 인증이 끝난 뒤에야 route chunk를 받던 직렬
워터폴을 없애고, module 다운로드와 초기 데이터 준비가 겹치도록 했다. preload가 실패하면 promise를
초기화해 실제 route 진입에서 다시 시도한다.

### 3. 목록과 COUNT를 같은 batch로 실행했다

기존 cursor 조회는 목록을 받은 뒤 `COUNT(*)`를 다시 기다렸다. 두 statement를 하나의 batch에
넣었고 `saved=1`이 아닐 때 COUNT에서 불필요한 `saved_jobs` join도 제거했다. 더 보기 요청도 같은
fast job path를 사용한다.

### 4. 정렬과 카테고리 전용 index를 추가했다

`0018_sloppy_leech` migration은 다음 partial index를 추가한다.

- `idx_jobs_feed_collected_id`: 활성 신입 공고의 `collected_at, id` 순서
- `idx_jobs_active_category`: 활성 신입 공고의 distinct category 순서

기본 최신순은 `ORDER BY collected_at DESC, id DESC`로 index 순서와 일치시켰다. 변경 후 실행계획은
두 쿼리 모두 새 index scan을 사용하며 temporary sort가 나타나지 않는다. migration은 schema
ledger version/checksum과 `PRAGMA optimize`를 함께 갱신한다.

## 동일 조건 전후 측정

저장소 migration과 121개 공고 seed, Node.js 24.19.0, 9회 sample, D1 dispatch마다 25ms의 제어
지연을 넣은 동일 명령의 결과다. 인위적 지연은 왕복 수의 영향을 재현하기 위한 것이며 운영 시간으로
해석하지 않는다.

| 지표             |  변경 전 | 변경 후 |        변화 |
| ---------------- | -------: | ------: | ----------: |
| 최대 D1 dispatch |        4 |       1 |  75.0% 감소 |
| p50              | 124.21ms | 31.59ms | 74.57% 감소 |
| p95              | 126.81ms | 32.00ms | 74.77% 감소 |
| 반환 항목/전체   |   40/119 |  40/119 |        동일 |

재현 명령은 `pnpm exec tsx scripts/performance/benchmark-job-read-path.mjs`다. 정량값과 운영
기준선은 `docs/evidence/jobs-d1-roundtrip-2026-08-15.json`에 고정했다.

## 회귀 검증

| 검증                        | 결과                                          |
| --------------------------- | --------------------------------------------- |
| lint / format check         | 통과                                          |
| workspace + Sites typecheck | 통과                                          |
| unit/integration test       | 111/111 통과                                  |
| performance budget          | 위반 0; jobs cursor p95 11.20ms, 26,092 bytes |
| Sites build                 | 통과; JobsPage 28.60KB raw / 8.66KB gzip      |
| 배포 migration staging      | 0017, 0018만 포함                             |

화면 레이아웃과 상호작용 표현은 바꾸지 않았고 데이터 준비 순서와 API 경로만 변경했다. 직접
`/jobs` 진입 cache hydration, 목록·달력 bundle, 신규 사용자 알림 수, rate limit, 사용자별 지원
상태 격리, cursor page와 새 index 사용을 회귀 테스트로 고정했다.

## 다시 느려졌을 때 확인 순서

1. Worker log에서 `GET:/api/v1/jobs/bootstrap` 또는 `GET:/api/v1/jobs`의 `durationMs`,
   `wallTimeMs`, `cpuTimeMs`를 비교한다. CPU가 작고 wall만 크면 D1/플랫폼 대기 문제다.
2. 응답의 `server-timing`과 `x-response-time-ms`로 브라우저 다운로드 이전의 API 시간을 분리한다.
3. readiness의 applied version이 `0018_sloppy_leech`이고 새 index 두 개가 존재하는지 확인한다.
4. 첫 cursor page 회귀 테스트에서 D1 batch count가 1인지 확인한다.
5. `EXPLAIN QUERY PLAN`에 `USE TEMP B-TREE FOR ORDER BY`가 다시 등장하면 ORDER BY와 index
   column 순서가 달라진 것이다.
6. API는 빠른데 화면만 늦다면 `/jobs/bootstrap`보다 `/bootstrap`, JobsPage chunk, 별도
   `/jobs/categories`가 앞서 직렬 실행되는지 확인한다.

## 안전성과 되돌리기

사용자 소유 지원 상태는 계속 현재 Sites user ID의 DB 사용자 행으로 제한한다. batch는 보안 검사를
생략하지 않고 같은 트랜잭션 안에서 rate counter와 조회 결과를 만든다. 새 index는 additive라 이전
애플리케이션 버전도 사용할 수 있다. 애플리케이션을 이전 Sites version으로 되돌려도 데이터 형식은
바뀌지 않으며, index 제거가 필요할 때만 별도 forward migration으로 처리한다.
