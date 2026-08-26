---
title: 대형 채용 화면과 전역 CSS의 동작 보존형 분리
date: 2026-08-26
tags: [audit, frontend, react, css, maintainability]
generatedByAI: false
pr: 65
commit: d4e3355b2e5ca5645c4ac5cc1cabd1664a151446
evidence: docs/evidence/stage7-web-module-boundaries-2026-08-26.json
---

# 대형 채용 화면과 전역 CSS의 동작 보존형 분리

## 문제

채용 화면은 API 조회, URL 필터, 달력 키보드 이동, 지원 상태 mutation, 모달과 카드 렌더링이
`JobsPage.tsx` 1,393줄에 함께 있었다. 전역 `styles.css`도 기능 추가가 누적되어 7,711줄이었다.
작은 변경도 파일 전체의 암묵적 이름과 cascade 순서를 함께 이해해야 했고, 충돌 범위와 리뷰 비용이
실제 기능 범위보다 컸다.

거대 파일은 단지 줄 수가 많아서 문제가 아니다. 서로 다른 변경 이유가 같은 모듈에 모이면 변경
결합도가 높아지고, 한 부분을 분리하면서 CSS 순서나 React 상태 수명을 바꾸기 쉽다는 점이 핵심이다.

## 적용 원칙

이번 단계는 새 화면을 만드는 작업이 아니라 동작을 보존하는 구조 변경이다.

```text
pages/JobsPage.tsx                  route state, query, mutation orchestration
features/jobs/job-domain.ts         types, labels, date/filter/sort functions
features/jobs/JobControls.tsx       filter and detail dialog components

styles.css                          ordered import manifest
styles/*.css                        existing rules split by cohesive append boundary
```

React 쪽에서는 URL과 query cache를 소유하는 route 상태를 `JobsPage`에 그대로 두었다. 순수 계산과
표시용 제어만 별도 모듈로 옮겼기 때문에 필터 debounce, optimistic update, 선택 공고와 달력 포커스의
수명은 바뀌지 않는다.

CSS는 selector를 재작성하거나 중복 제거하지 않았다. 기존 파일을 순서대로 6개 구간으로 나누고
얇은 manifest가 같은 순서로 import한다.

```css
@import './styles/foundation.css';
@import './styles/workspace.css';
@import './styles/workflows.css';
@import './styles/jobs.css';
@import './styles/learning-library.css';
@import './styles/final-overrides.css';
```

분리 전 원문과 6개 파일을 순서대로 연결한 결과에서 공백을 제외한 SHA-256은 모두
`0b3bbea2a7e46e6cec63bd129d81407489f0ca0abf50d0fd4caafb054a0d72c5`다. formatter가 분할
경계의 빈 줄 4개만 제거했으며 selector, declaration과 cascade 순서는 변경하지 않았다는 재현 가능한
근거다.

## 전후 비교

| 항목                   |            변경 전 |             변경 후 |               변화 |
| ---------------------- | -----------------: | ------------------: | -----------------: |
| `JobsPage.tsx`         |  1,393줄 / 53,451B |     791줄 / 31,985B | 602줄(43.22%) 감소 |
| 단일 전역 CSS          | 7,711줄 / 133,317B | 6줄 import manifest |     모듈 경계 명시 |
| 가장 큰 CSS 파일       |            7,711줄 |             3,247줄 |        57.89% 감소 |
| 공백 제외 CSS checksum |          `0b3bbe…` |           `0b3bbe…` |               동일 |
| 웹 테스트              |               31개 |                33개 | 구조 방어 2개 추가 |
| 초기 route gzip        |           147,773B |            147,769B |    실질적으로 동일 |

전체 React 소스가 602줄 줄었다는 뜻은 아니다. route 밖으로 이동한 코드와 명시적 import/export가
있으므로 이 수치는 orchestration 집중도다. 초기 route gzip 4B 차이도 성능 개선으로 주장하지 않는다.

## 회귀 방어

새 구조 테스트는 `JobsPage`가 900줄 이하이고 필터·모달 구현을 다시 직접 포함하지 않는지 확인한다.
또 `styles.css`가 정해진 6개 import만 같은 순서로 유지하며, 각 CSS 모듈이 3,500줄을 넘지 않는지
검사한다. 기존 학습 모달과 코딩 문제 탭의 정적 CSS 계약은 실제 규칙을 소유한
`foundation.css`를 읽도록 바꿨다.

기능 변경이 없으므로 전후 화면 캡처를 새 증거로 만들지 않았다. 대신 공백 제외 동일 CSS checksum,
Chromium·Firefox·WebKit E2E와 production bundle 결과가 화면 보존 증거다. DB migration과 Slack
요청은 없다.

최종 검증은 format, lint, typecheck, 34개 파일의 unit/integration 140개, production/Sites build,
bundle·D1 query 성능 예산, 격리 restore와 고위험 dependency 감사를 통과했다. Playwright는 desktop
Chromium, 375px mobile Chromium, Firefox와 WebKit에서 56/56 통과했다. 합성 jobs cursor p95는
5.74ms, search p95는 33.16ms였고 복구 snapshot은 FK 위반 0건과 checksum 일치를 확인했다. 이 성능과
복구 수치는 LocalD1 결과이며 운영 latency나 RTO 개선으로 해석하지 않는다.

## 남은 경계

- `AdminPage`, `SolutionsPage`, `CodingPage`는 각각 900줄 미만이지만 기능이 더 확장되면 같은
  feature 경계를 적용한다.
- `foundation.css`는 3,248줄로 방어 한도 안에 있으나 공통 token과 초기 legacy route 규칙을 함께
  가진다. selector 재분류는 시각 회귀 증거를 동반한 별도 변경으로 처리한다.
- 이번 단계는 번들 크기나 운영 latency 개선이 아니라 수정 범위와 회귀 위험을 줄이는 구조 작업이다.
