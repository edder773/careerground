---
title: 전체 조회 fast batch와 채용 catalog 전환
date: 2026-08-15
tags: [performance, d1, jobs, learning, collections, troubleshooting]
generatedByAI: true
evidence: docs/evidence/read-path-fast-catalog-2026-08-15.json
---

# 전체 조회 fast batch와 채용 catalog 전환

## 왜 데이터가 적어도 느렸는가

이번 변경 전 운영 로그에서 홈 bootstrap은 application 694ms, 코딩 문제는 546ms, 학습은
381ms였지만 Worker CPU는 각각 3ms, 3ms, 2ms였다. 데이터 계산보다 D1 결과를 기다리는 시간이
훨씬 큰 구조였다. 특히 일반 조회 경로는 사용자·요청 제한을 확인한 뒤 실제 데이터를 다시 요청했고,
일부 화면은 독립 데이터 조회를 여러 dispatch로 나눴다.

채용 화면은 직전 개선으로 첫 목록 요청을 한 번의 D1 dispatch로 줄였지만 검색, 필터, 정렬,
저장한 공고 보기, 달력 월 이동 때마다 서버를 다시 조회했다. 활성 공고가 119개뿐인 현재 규모에서는
사용자 동작마다 원격 D1을 재조회하는 비용이 로컬 필터 비용보다 훨씬 컸다.

## 적용한 변경

### 채용 catalog를 한 번 받고 브라우저 메모리에서 조회한다

`GET /jobs/bootstrap?catalog=true`는 활성 신입 공고 전체와 사용자별 저장·지원 상태, 카테고리를 한
D1 batch로 가져온다. 직접 `/jobs`에 진입할 때 인증 Provider가 catalog를 React Query에 미리 넣고,
JobsPage는 다음 동작을 모두 메모리에서 처리한다.

- 회사·직무·기술·고용형태·학력·경력·마감 필터
- 검색, 정렬, 저장한 공고만 보기
- 목록/달력 전환과 달력 월 이동
- 더 보기

따라서 첫 catalog hydration 뒤 위 동작의 read request는 각각 1회에서 0회가 됐다. 공고 상세는
선택했을 때만 조회하고, 저장·지원 상태 변경은 서버에 기록한 뒤 catalog cache를 낙관적으로 갱신한다.
실패하면 이전 상태로 되돌린다.

catalog는 최대 1,000개로 제한한다. 범위를 넘기면 잘린 데이터를 조용히 보여주지 않고 명시적 오류를
낸다. 또한 사용자별 상태가 포함되므로 공유 CDN cache에 저장하지 않고 해당 인증 브라우저의
React Query 메모리에만 둔다.

### 인증과 실제 조회를 같은 D1 batch로 합쳤다

코딩 문제, 학습, 복습 예정, 컬렉션, 휴지통의 정상적인 기존 사용자 조회는 사용자 확인, route별
rate-limit 갱신, 실제 데이터 조회를 한 batch로 실행한다. 비활성 사용자 차단, 역할·이메일 동기화,
소유자 범위와 rate-limit 판정은 그대로 유지한다. 신규 사용자나 사용자 정보 동기화가 필요한 경우만
기존 안전 경로로 fallback한다.

목록과 개수, 학습 source와 unit/progress, 컬렉션과 item처럼 함께 쓰는 결과는 scalar subquery 또는
JSON 집계로 한 statement에 합쳤다. 읽지 않은 알림 수도 사용자 조회에 포함했다. hot path의 오래된
rate-limit 행 삭제는 scheduled maintenance로 옮겨 사용자 요청의 추가 statement를 없앴다.

| 경로                   | 변경 전               | 변경 후               |
| ---------------------- | --------------------- | --------------------- |
| 홈 bootstrap           | 11 statements         | 5 statements          |
| 채용 catalog bootstrap | 7 statements          | 3 statements          |
| 코딩 문제              | 3 D1 dispatches       | 1 D1 dispatch         |
| 학습 요약              | 3 D1 dispatches       | 1 D1 dispatch         |
| 복습 예정              | 2 D1 dispatches       | 1 D1 dispatch         |
| 컬렉션/휴지통          | 각 2 D1 dispatches    | 각 1 D1 dispatch      |
| hydration 후 채용 조작 | 조작당 read request 1 | 조작당 read request 0 |

## 동일 조건 검증

Node.js 24.19.0, 동일 migration·seed, 119개 공개 공고, 9회 sample, D1 dispatch당 25ms의 제어
지연을 사용했다. 이 인위적 지연은 왕복 수를 재현할 뿐 운영 시간으로 해석하지 않는다.

기존 paged `/jobs`는 변경 전 p50 31.92ms/p95 32.22ms, 변경 후 p50 31.39ms/p95 32.63ms로
1 dispatch를 유지했다. 새 catalog bootstrap은 119개를 3 statements/1 dispatch로 반환했고 p50
31.53ms, p95 41.40ms, 응답은 78,690 bytes였다. 새 요청 형태에는 같은 형태의 변경 전 값이 없으므로
개선율을 주장하지 않는다.

전체 회귀 검증은 112/112 tests, 모든 workspace와 Sites typecheck, lint, format check, 성능 예산,
Sites build를 통과했다. JobsPage 산출물은 27.74KB raw/8.62KB gzip이다. 상세 수치는
`docs/evidence/read-path-fast-catalog-2026-08-15.json`에 고정했다.

## 다시 느려졌을 때 확인 순서

1. Worker log에서 해당 route의 application/wall/CPU 시간을 비교한다. CPU는 작고 wall만 크면
   브라우저 렌더보다 D1 또는 플랫폼 대기부터 확인한다.
2. 한 사용자 동작에서 같은 GET이 반복되는지 확인한다. 채용 filter·sort·calendar 동작은 catalog
   hydration 뒤 read request가 없어야 한다.
3. fast read 회귀 테스트에서 정상 기존 사용자의 D1 batch count가 1인지 확인한다.
4. `/jobs/bootstrap?catalog=true`가 119개 전체와 사용자별 상태를 반환하는지 확인한다. 1,000개를
   넘으면 pagination/검색 index를 사용하는 다음 구조로 전환해야 한다.
5. API는 빠른데 첫 화면만 느리면 인증, route chunk 다운로드, Worker cold start를 따로 측정한다.

## 안전성과 되돌리기

공개 공고 내용만 전체 catalog로 가져오며 저장·지원 상태는 현재 Sites 사용자 ID에 계속 귀속된다.
public shared cache를 사용하지 않아 다른 사용자 상태가 섞이지 않는다. schema migration이나 데이터
형식 변경은 없고 기존 paged `/jobs`도 유지한다. 문제가 생기면 이전 Sites version으로 되돌릴 수
있으며 기존 API와 데이터는 그대로 호환된다.

배포 후 새 운영 요청이 생기기 전까지 변경 후 운영 latency는 정량 측정 불가다. 첫 방문에는 인증,
정적 파일 다운로드와 플랫폼 cold start 변동이 남으므로 모든 사용자·모든 요청의 0.3초를 보장하지
않는다. 이번 변경의 보장 가능한 범위는 불필요한 D1 왕복과 hydration 후 반복 조회 제거다.
