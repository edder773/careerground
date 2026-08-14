---
title: Slack 인증 제거와 OpenAI 사용자 안전 연결
date: 2026-08-12
tags: [authentication, identity, pr-5, pr-6]
generatedByAI: false
pr: 5-6
commit: 4448e14b97c9f036683d3e7a9b9ee65f1e14b4a8
evidence: GitHub PR #5 and #6 validation records
---

# Slack 인증 제거와 OpenAI 사용자 안전 연결

## 현상과 영향

초기 Slack OIDC는 제품 요구와 달랐고 Sites 자체 로그인과 이중 인증 상태를 만들었다. OpenAI identity로 전환한 뒤에는 seed 사용자가 가짜 OpenAI ID를 가지고 있어 실제 로그인 사용자가 기존 역할·데이터와 연결되지 않을 가능성이 남았다.

## 핵심 이론

인증(authentication)과 계정 연결(account linking)은 별개다. 플랫폼이 검증한 안정 식별자를 신뢰하더라도, 기존 계정과의 연결은 다음 불변식을 지켜야 한다.

1. 브라우저가 직접 조작할 수 없는 Sites 서버 경계에서만 identity header를 신뢰한다.
2. `openAiUserId`는 unique이며 실제 최초 로그인 전에는 seed에 넣지 않는다.
3. 검증된 이메일이 기존 계정과 일치할 때만 한 번 연결하고 역할을 보존한다.
4. 연결 사건은 감사 로그에 남긴다.

## 전후 코드 구조

```diff
- Slack OAuth state / nonce / refresh token / Slack user columns
+ User.openAiUserId (unique, nullable)
+ Sites /signin-with-chatgpt, /signout-with-chatgpt
+ first-login email link + audit event
```

- PR #5: Slack OAuth와 자체 JWT 쿠키를 제거하고 OpenAI Sites identity로 단일화.
- PR #6: seed의 synthetic OpenAI ID를 제거하고 실제 첫 로그인에서 기존 이메일 계정에 연결.

## 수치와 검증

| 기준                      |              PR #5 |             PR #6 |
| ------------------------- | -----------------: | ----------------: |
| 단위 테스트               |          41개 통과 |         42개 통과 |
| Playwright                |         12/12 통과 |        12/12 통과 |
| 적용 migration            | 1개 인증 migration | clean DB 전체 3개 |
| seed의 non-null OpenAI ID |  전환 전 측정 없음 |               0개 |
| 심각 접근성 위반          |                  0 |         변경 없음 |

운영 계정 연결 충돌 건수는 개인 데이터를 수집하지 않았으므로 `정량 측정 불가`다.

## 회귀 방지

- seed 사용자가 synthetic provider ID를 갖지 않는지 검사한다.
- OpenAI ID가 없는 기존 이메일 사용자의 역할을 유지하며 연결되는 테스트를 둔다.
- identity header 누락은 401, 데이터 저장소 미연결은 503으로 구분한다.

## 근거

- [PR #5](https://github.com/edder773/careerground/pull/5)
- [PR #6](https://github.com/edder773/careerground/pull/6)
