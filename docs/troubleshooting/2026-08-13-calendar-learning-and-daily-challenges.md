---
title: 달력 모달·PDF 학습·오늘의 문제 흐름 복구
date: 2026-08-13
tags: [calendar, learning, coding, pr-12]
generatedByAI: false
pr: 12
commit: 92d1f89890210820854c6b458eef9f6b748368d3
evidence: docs/evidence/archive/pr-12-manifest.json
---

# 달력 모달·PDF 학습·오늘의 문제 흐름 복구

## 문제

달력의 공고 상세가 화면 하단에 나타나 맥락을 잃었고 시작일·마감일·상시가 같은 시각 언어로 표시됐다. 오늘의 문제는 한 날짜에 하나만 저장할 수 있었으며 hero에서 원문만 열리고 실제 코드 편집기와 다른 사람 풀이로 바로 이어지지 않았다. 학습 라이브러리에는 요청된 Prompt/Context Engineering 과정이 없었다.

## 핵심 이론

- 달력 선택은 현재 작업을 유지한 modal로 표시하고, 일정 의미를 색만이 아니라 label과 함께 전달한다.
- “하루 2문제”는 배열을 반환하는 UI 트릭이 아니라 `(kstDate, levelSlot)` unique constraint로 표현한다.
- deep-link action은 목적 요소를 화면에 렌더한 뒤 focus/scroll까지 완료해야 한다.
- 학습자료는 원문 복제가 아닌 재구성된 설명과 source provenance를 함께 보존한다.

## 전후 비교

```diff
- UNIQUE(kst_date)
+ UNIQUE(kst_date, level_slot)

- 문제 열기 -> 외부 원문만
+ 풀이 기록 -> 해당 문제 editor/focus
+ 다른 풀이 -> problem-filtered member solutions
```

- 6개 학습 module, 12개 flashcard, 6개 review question을 migration/seed로 추가.
- calendar modal, 시작·마감·상시 legend, 반응형 overflow 처리 추가.

## 검증

- contracts 6, API 30, web 11, troubleshooting/Sites 12 통과.
- Playwright 13개, visual 2개 통과.
- serious/critical axe violation 0.
- PostgreSQL migration/seed와 D1 migration 통과.
- 모든 production build 통과.

첫 CI는 clean runner에서 seed가 `@careerground/contracts/dist/index.js`를 import했지만 build 산출물이 없어 browser 시작 전에 실패했다. seed command가 contracts를 먼저 build하도록 바꿨고, `dist`를 지운 조건에서 재현 후 전체 CI가 통과했다.

## 회귀 방지

- clean checkout에서 package build output을 제거한 뒤 seed를 실행한다.
- 날짜당 level slot 중복을 DB constraint와 integration test로 검사한다.
- hero action이 editor와 다른 풀이 목록에 도달하는지 Playwright로 검사한다.

## 근거

- [PR #12](https://github.com/edder773/careerground/pull/12)
- `docs/evidence/archive/pr-12-manifest.json`
