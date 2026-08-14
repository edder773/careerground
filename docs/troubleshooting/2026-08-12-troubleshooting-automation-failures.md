---
title: 트러블슈팅 자동화의 두 번의 게시 실패
date: 2026-08-12
tags: [github-actions, documentation, pr-9, pr-10]
generatedByAI: false
pr: 9-10
commit: f885c216074b3e4258a7d84d9e15e7524e79e7bd
evidence: docs/evidence/archive/pr-9-manifest.json, docs/evidence/archive/pr-10-manifest.json
---

# 트러블슈팅 자동화의 두 번의 게시 실패

## 장애 1 — 수동 README까지 생성 문서로 검증

결정론적 문서 생성은 성공했지만 workflow가 `docs/troubleshooting`의 모든 Markdown을 생성 문서 validator에 넣었다. 수동 `README.md`에는 의도적으로 `model`, `pr`, `commit` metadata가 없어 실패했다.

```diff
- find docs/troubleshooting -name '*.md' | validate
+ git status --porcelain docs/troubleshooting docs/blog | validate changed files only
```

핵심은 validator의 입력 집합도 계약이라는 점이다. 서로 다른 schema를 가진 수동 문서와 생성 문서를 같은 규칙으로 검사하면 false failure가 된다.

## 장애 2 — GitHub Actions의 PR 생성 권한 없음

생성·검증 후 임시 branch push까지 성공했지만 저장소가 Actions의 pull request 생성을 허용하지 않아 `gh pr create`에서 실패했다. 게시 경로를 선택형으로 바꾸고, 권한 오류 시 임시 원격 branch를 즉시 제거한 뒤 원본 PR comment와 workflow summary에 기록하도록 했다.

```text
generate -> validate -> try docs PR
                         ├─ success: draft PR
                         └─ denied: delete temp branch -> source PR comment
```

## 핵심 이론

CI의 산출물 생성과 GitHub 권한이 필요한 게시를 분리해야 한다. 생성·검증은 deterministic core이고, PR/comment는 실패 가능한 adapter다. adapter 실패가 core 산출물을 잃게 해서는 안 된다.

## 수치와 검증

| 항목                | 결과                      |
| ------------------- | ------------------------- |
| provider unit tests | 3개 통과                  |
| PR #9 변경          | workflow 1개 파일, +3/-2  |
| PR #10 변경         | workflow 1개 파일, +36/-1 |
| stale temp branch   | 1개 제거                  |
| API key 필요 여부   | 0개 필수; 선택 기능       |

과거 bot comment의 validation이 `not-run`으로 남은 이유는 당시 evidence manifest가 validation 결과 파일을 올바르게 읽지 못했기 때문이다. 내려받은 artifact에는 결과 파일이 존재하며, 이번 작업에서 원문 PR 결과와 함께 수동 검증해 정식 문서로 회수했다.

## 회귀 방지

- changed-file 목록만 validator에 전달한다.
- PR 생성 실패를 의도적으로 모사해 branch 삭제와 comment fallback을 검사한다.
- `OPENAI_API_KEY`가 없을 때 deterministic provider가 항상 동작해야 한다.
- 기능 PR 자체에 사람이 검토한 troubleshooting 문서를 포함시키는 것을 기본 경로로 삼는다.

## 근거

- [PR #9](https://github.com/edder773/careerground/pull/9)
- [PR #10](https://github.com/edder773/careerground/pull/10)
