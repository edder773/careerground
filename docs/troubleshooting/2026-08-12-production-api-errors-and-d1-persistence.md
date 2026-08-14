---
title: 운영 4xx·5xx 오류와 D1 영속성 전환
date: 2026-08-12
tags: [incident, d1, persistence, pr-7]
generatedByAI: false
pr: 7
commit: 1da3005a228e5e02999fcc565b84fb62741624ee
evidence: docs/evidence/archive/pr-7-manifest.json
---

# 운영 4xx·5xx 오류와 D1 영속성 전환

## 현상과 사용자 영향

운영 URL에서 정적 화면은 열렸지만 데이터 기능 접근 시 400대·500대 오류가 반복됐다. worker log의 기준선은 데이터 endpoint가 `503 API_NOT_CONFIGURED`를 반환했음을 보여줬다. route별 UI 오류 처리가 달라 일부는 4xx처럼 보였지만 공통 원인은 운영 저장소 부재였다.

## 근본 원인

배포된 Site에는 `API_ORIGIN`도 바인딩된 DB도 없었다. Worker는 의도적으로 다음과 같은 설정 오류를 반환했다.

```ts
if (!env.API_ORIGIN && !env.DB) {
  return apiError(503, 'API_NOT_CONFIGURED');
}
```

정적 Sites와 별도 Nest/PostgreSQL을 연결한다는 초기 가정이 실제 배포 구성에서 충족되지 않았다.

## 핵심 이론

서버리스 앱에서는 실행 환경이 소유한 저장소와 migration lifecycle을 함께 배포해야 한다. D1 binding, schema migration, seed, 사용자 identity 해석을 하나의 배포 원자 단위로 묶으면 “웹만 배포된 반쪽 상태”를 없앨 수 있다. readiness는 프로세스 생존이 아니라 실제 DB 쿼리 성공을 검사해야 한다.

## 수정

- Sites 소유 D1과 24개 테이블, 34개 인덱스, migration journal을 추가했다.
- folder, note/revision, coding, job/application, learning, search, notification, admin/audit를 user-scoped CRUD로 연결했다.
- job status 연속 변경이 역순 저장되는 race를 막기 위해 mutation 중 control을 잠갔다.
- `<`와 `>`를 다중 문자 조합으로만 제거하던 sanitizer를 문자 단위 제거로 바꾸고 우회 테스트를 추가했다.

```diff
- UI -> API_ORIGIN -> Nest/PostgreSQL (운영 미구성)
+ UI -> Sites Worker -> bound D1 (migration과 함께 배포)
```

## 수치적 전후

| 지표                      |        전 |                 후 |
| ------------------------- | --------: | -----------------: |
| 데이터 endpoint 기준 응답 |       503 | D1 query 성공 경로 |
| D1 테이블                 |         0 |                 24 |
| D1 인덱스                 |         0 |                 34 |
| seed 문제/공고/학습 단위  |         0 |              4/2/2 |
| 단위 테스트               | 42개 기준 |          48개 통과 |
| E2E                       |      12개 |          12개 통과 |
| 알려진 moderate 취약점    | 측정 없음 |                  0 |

운영 네트워크 latency는 당시 저장하지 않아 `정량 측정 불가`다.

## 실패에서 발견한 추가 결함

첫 clean E2E에서 `INTERESTED` 요청이 뒤늦게 완료되어 더 최신 `APPLIED`를 덮는 race가 재현됐다. UI pending lock 후 12개 E2E를 다시 통과했다. 첫 CodeQL은 중첩 태그로 sanitizer를 우회할 수 있음을 지적했고, 문자 단위 정규화와 회귀 테스트 후 통과했다.

## 회귀 방지

- `/api/v1/health/ready`는 D1 `SELECT 1` 성공을 확인한다.
- migration smoke test에서 테이블·인덱스·seed 수를 검사한다.
- 동일 공고의 빠른 연속 상태 변경과 중첩 태그 payload를 회귀 테스트한다.
- 운영 배포 후 root 200뿐 아니라 익명/인증 API 경계와 readiness를 확인한다.

## 근거

- [PR #7](https://github.com/edder773/careerground/pull/7)
- `docs/evidence/archive/pr-7-manifest.json`
