---
title: Sites Node runtime 호환성과 source-only 배포 실패
date: 2026-08-13
tags: [deployment, node, pnpm, sites, pr-16, pr-17, pr-18]
generatedByAI: false
pr: 16-18
commit: e9f9d41a63eb08d86476fb6647c41b47c9e1693e
evidence: docs/evidence/archive/pr-16-manifest.json, docs/evidence/archive/pr-17-manifest.json, docs/evidence/archive/pr-18-manifest.json
---

# Sites Node runtime 호환성과 source-only 배포 실패

## 연속 장애

1. Sites builder는 Node `24.14.1`이었지만 root engine floor가 `>=24.19.0`이라 pnpm이 `ERR_PNPM_UNSUPPORTED_ENGINE`로 중단됐다.
2. engine floor를 넓힌 뒤 `jsdom 30.0.1`이 Node `<24.15.0`을 거부해 다시 중단됐다.
3. runtime 의존성을 맞춘 뒤에도 source-only version은 Workers 전용 `dist`, hosting metadata, D1 migration을 포함하지 않아 정상 운영 artifact가 되지 못했다.

## 핵심 이론

- 개발 권장 버전 pin과 배포 허용 engine range는 목적이 다르다. `.node-version`은 재현성을, `engines`는 호환 범위를 표현한다.
- transitive development dependency도 build 단계에서 import되면 배포 runtime compatibility의 일부다.
- source commit과 deploy artifact는 동일 SHA에서 생성되어야 한다. monorepo source만 저장하면 플랫폼의 일반 build가 Workers 전용 패키징을 재현한다는 보장이 없다.

## 전후 비교

```diff
- engines.node: >=24.19.0 <27
+ engines.node: >=24.14.1 <27
  .node-version / .nvmrc: 24.19.0 유지

- jsdom: 30.0.1
+ jsdom: 29.0.1 (Node 24.14.1 호환)

- save version(commit only)
+ package exact commit -> dist/server/index.js
+ include dist/.openai/hosting.json + dist/.openai/drizzle
+ save version(commit + archive) -> deploy saved version
```

## 검증

- PR #16과 #17에서 lint/typecheck/test 71개/E2E 14개/build/sites:build 통과.
- PR #18은 배포 절차 문서 formatting과 lint 통과.
- application source 동작은 #15 이후 그대로이며 compatibility/package 경로만 변경.

배포 실패·성공 시간의 동일 조건 측정은 남아 있지 않아 `정량 측정 불가`다.

## 회귀 방지

- CI에서 Sites runtime의 최소 Node 버전으로 install/build한다.
- lockfile에서 jsdom engine 호환성을 고정한다.
- archive에 worker entrypoint, hosting metadata, drizzle migration이 있는지 저장 전에 검사한다.
- version `commit_sha`와 archive를 만든 HEAD가 같은지 확인한다.

## 근거

- [PR #16](https://github.com/edder773/careerground/pull/16)
- [PR #17](https://github.com/edder773/careerground/pull/17)
- [PR #18](https://github.com/edder773/careerground/pull/18)
- `docs/operations/deployment.md`
