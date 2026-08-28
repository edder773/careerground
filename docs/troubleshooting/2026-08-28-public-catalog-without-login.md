---
title: 로그인 제거와 공개 카탈로그 전환
date: 2026-08-28
tags: [authentication, public-catalog, local-storage, sites]
generatedByAI: false
---

# 로그인 제거와 공개 카탈로그 전환

## 문제

CareerGround가 추천 문제·채용공고·학습자료를 둘러보는 서비스로 단순화된 뒤에도 Google 로그인,
최초 가입, 계정 설정과 관리자 화면이 첫 진입을 가로막고 있었다. 즐겨찾기 외의 개인 기능은 이미
제품 범위에서 빠졌으므로 계정 유지 비용과 사용자 효용이 맞지 않았다.

## 핵심 이론

인증은 그 자체가 기능이 아니라 보호할 사용자별 서버 상태가 있을 때 필요한 경계다. 이 변경에서는
공통 카탈로그를 익명 읽기 모델로 분리하고, 유일하게 남길 개인 선호인 즐겨찾기를 origin별 브라우저
저장소로 내렸다. 서버 상태가 아닌 기기 선호이므로 계정·세션 없이도 요구사항을 충족한다.

반대로 Slack digest는 운영 쓰기와 발송 상태를 다루므로 공개하지 않고 기존 전용 Bearer token
경계를 유지했다. 공개 전환이 모든 API의 무인증 전환을 의미하지는 않는다.

## 변경 전후

| 항목                      |                           변경 전 |                      변경 후 |
| ------------------------- | --------------------------------: | ---------------------------: |
| 사용자 진입 단계          |    Google 로그인 + 최초 이름 확인 |           즉시 카탈로그 진입 |
| 사용자용 인증·설정 페이지 |                               4개 |                          0개 |
| 공개 회귀 대상 카탈로그   |                               0종 |           채용·학습·코딩 3종 |
| 외부 Google CSP 출처      | script/frame/connect/image에 존재 |                          0개 |
| 서버 즐겨찾기 쓰기        |               컬렉션 API mutation | 0회, 브라우저 `localStorage` |

핵심 dispatcher는 세션 해석보다 먼저 공개 읽기 경로를 처리한다.

```ts
if (!usesTestSession && request.method.toUpperCase() === 'GET') {
  // jobs, learning, coding and search return public catalog data.
}

if (url.pathname.startsWith('/api/v1/auth/')) {
  throw new RouteError(404, '로그인 기능은 더 이상 제공하지 않습니다.', 'ROUTE_RETIRED');
}
```

브라우저 즐겨찾기는 항목 종류·대상 ID·표시명·내부 링크만 저장한다. 지원 메모, 학습 진도,
프로필처럼 민감하거나 동기화가 필요한 정보는 로컬 저장소로 옮기지 않고 기능 자체를 제거했다.

## 회귀 방지

- 컴포넌트 테스트는 로그인 provider 없이 앱 셸이 렌더링되고 설정·로그아웃이 없는지 확인한다.
- D1 계약 테스트는 세 카탈로그의 익명 HTTP 200과 인증 설정 경로의 `ROUTE_RETIRED`를 확인한다.
- Playwright는 새 브라우저에서 바로 홈에 진입하고 새로고침 뒤 즐겨찾기가 유지되는지 확인한다.
- 운영 SLO는 Google JWKS 대신 공개 카탈로그 3종과 폐기된 인증 경계를 매시간 검사한다.
- CSP 회귀 테스트는 `accounts.google.com`이 다시 추가되지 않는지 확인한다.

## 의도적으로 보존한 데이터

기존 사용자·세션 테이블은 운영 migration 이력과 복구 가능성을 위해 파괴적으로 삭제하지 않았다.
운영 UI와 dispatcher에서는 접근할 수 없으며, 향후 보존 기간 정책이 정해진 뒤 별도 순방향
migration으로 정리해야 한다. 이번 변경은 개인 테스트 데이터를 암묵적으로 삭제하는 작업이 아니다.
