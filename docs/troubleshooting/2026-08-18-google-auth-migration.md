---
title: OpenAI 전달 헤더에서 Google 검증 세션으로 인증 경계를 교체한 과정
date: 2026-08-18
tags: [auth, google, oidc, d1, session, migration]
generatedByAI: false
evidence: docs/evidence/google-auth-2026-08-18.json
---

# OpenAI 전달 헤더에서 Google 검증 세션으로 인증 경계를 교체한 과정

## 문제와 영향

기존 운영 Worker는 Sites가 전달하는 `oai-authenticated-user-id`와 이메일을 사용자 식별자로 사용했고, 로그인 화면은 `/signin-with-chatgpt`로 이동했다. 사용자가 기존 연결과 개인 테스트 데이터를 폐기하고 Google 계정만 사용하도록 요구했기 때문에 버튼만 교체해서는 부족했다. Google ID 토큰 검증, 애플리케이션 세션, D1 사용자 식별자, 로그아웃과 최초 가입을 하나의 vertical slice로 바꿔야 했다.

특히 브라우저에서 JWT payload만 디코딩해 이메일을 신뢰하면 서명·대상 애플리케이션·만료를 확인하지 않는 인증 우회가 된다. 이메일만으로 과거 계정을 자동 연결하면 같은 이메일처럼 보이는 다른 provider subject에 기존 데이터가 넘어갈 수 있다.

## 핵심 이론 1: OIDC 토큰은 서명과 claim을 함께 검증한다

Worker는 Google JWKS를 cache-control 범위 안에서 캐시하고 `kid`에 해당하는 RSA 공개키를 가져온다. 키 회전으로 캐시에 `kid`가 없으면 JWKS를 한 번 새로 받은 뒤 다시 찾는다.

```diff
- const userId = request.headers.get('oai-authenticated-user-id')
- const email = request.headers.get('oai-authenticated-user-email')
+ const identity = await verifyGoogleCredential(credential, GOOGLE_CLIENT_ID)
+ // RS256 signature, iss, aud, exp, iat, email_verified, sub
```

사용자 불변 식별자는 이메일이 아니라 검증된 Google `sub`다. `auth_identities(provider, provider_subject)` unique index가 하나의 Google 계정이 여러 내부 사용자에 연결되는 것을 막는다. 과거 OpenAI 계정은 연결하지 않으며 이메일 충돌은 `409 GOOGLE_IDENTITY_CONFLICT`로 중단한다.

## 핵심 이론 2: 세션 원문은 브라우저에만, DB에는 해시만 둔다

로그인 성공 시 Web Crypto로 256-bit 무작위 토큰을 만들고 D1에는 SHA-256 해시만 저장한다. DB가 노출돼도 저장된 값만으로 세션 쿠키를 재현할 수 없게 하기 위한 경계다.

```text
Google ID token
  → Worker 서명·claim 검증
  → auth_identities의 Google sub 조회
  → 256-bit session token 생성
  → D1: SHA-256(token)
  → Browser: HttpOnly; Secure; SameSite=Lax; Path=/
```

세션은 7일 후 만료되며 로그아웃 시 현재 해시 행과 쿠키를 모두 삭제한다. 로그아웃 직후 같은 쿠키로 `/auth/me`를 호출하면 `401`이 되는 회귀 테스트를 추가했다. health와 Google 로그인 endpoint 외에는 세션을 요구하므로 비로그인 상태에서 채용·학습·코딩 공통 데이터도 조회할 수 없다.

## 핵심 이론 3: provider 교체 migration은 개인 데이터와 공통 카탈로그를 분리한다

`0017_google_auth`는 사용자의 요구에 따라 기존 개인 테스트 데이터를 삭제한 뒤 OpenAI 전용 unique index와 `site_user_id` 컬럼을 제거한다. FK cascade로 폴더, 노트, 지원 상태, 진도, 풀이, 댓글, 알림과 세션성 데이터가 함께 제거된다. 채용공고, 학습자료, 코딩문제와 같은 사용자 비소유 공통 카탈로그는 보존한다.

```diff
+ DELETE FROM audit_logs;
+ DELETE FROM users;
+ DROP INDEX idx_users_site_user_id;
+ ALTER TABLE users DROP COLUMN site_user_id;
+ CREATE TABLE auth_identities (...);
+ CREATE TABLE auth_sessions (...);
```

운영 migration이 누락되는 상황에 대비해 runtime schema 검사도 `auth_identities`, `auth_sessions`, legacy column 부재, `0017_google_auth` ledger를 확인한다. migration 회귀 테스트는 0015 기준 DB에 0016과 0017을 순서대로 적용해 사용자 수 0, auth table 2개, legacy column 0개와 기존 학습 문항 수 보존을 확인한다.

## 화면 전후

### 변경 전: OpenAI 로그인

![변경 전 OpenAI 로그인](../assets/troubleshooting/google-auth/before-openai-login.png)

### 변경 후: Google 로그인

![변경 후 Google 로그인](../assets/troubleshooting/google-auth/after-google-login.png)

### 375×812 모바일

![Google 로그인 모바일](../../e2e/snapshots/login-google-mobile-chromium.png)

Google 이름은 최초 가입 화면의 입력 초깃값으로 전달된다. 사용자는 이름을 확인하거나 수정하고 Python, Java, JavaScript, C++ 중 하나를 선택한 뒤 가입을 완료한다.

## 검증 결과

| 검증                | 결과                                             |
| ------------------- | ------------------------------------------------ |
| `pnpm format:check` | 통과                                             |
| `pnpm lint`         | 통과                                             |
| `pnpm typecheck`    | 통과                                             |
| `pnpm test`         | 109/109 통과                                     |
| `pnpm test:e2e`     | 48/48 통과, Chromium·Firefox·WebKit·375px 모바일 |
| `pnpm build`        | 통과                                             |
| `pnpm sites:build`  | 통과, `0016`·`0017` 순방향 migration 포함        |
| axe                 | 1440×900·375×812 serious 이상 위반 0             |

인증 지연 시간은 이전 provider와 Google provider를 같은 운영 조건에서 측정하지 않았으므로 정량 개선을 주장하지 않는다. 실제 Google 계정 팝업 완료는 자동화가 대신할 수 없으며 운영 배포 후 사용자가 한 번 상호작용해 확인해야 한다.

## 근거

- `docs/evidence/google-auth-2026-08-18.json`
- `deployment/sites/google-auth.ts`
- `deployment/sites/google-auth.test.ts`
- `deployment/sites/d1-api.test.ts`
- `deployment/sites/runtime-schema.test.ts`
- `drizzle/0017_google_auth.sql`
- `apps/web/src/pages/LoginPage.test.tsx`
- `e2e/mvp.spec.ts`
- `e2e/visual.spec.ts`
