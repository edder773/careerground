---
title: 작업대·학습·설정 UI 위계와 컨트롤 정리
date: 2026-08-15
tags: [ui, responsive, accessibility, home, learning, settings]
generatedByAI: true
evidence: docs/evidence/ui-polish-2026-08-15.json
---

# 작업대·학습·설정 UI 위계와 컨트롤 정리

## 현상

작업대의 요약 지표와 가상 폴더는 실제 마크업이 링크였지만 핵심 카드 CSS가 `article`만 대상으로
삼아 링크 세 개씩에 카드 레이아웃이 적용되지 않았다. 학습 복습 목록에는 버튼 행 전용 규칙이 없어
긴 제목과 다음 제목이 이어져 보일 수 있었다. 설정 읽기 화면은 값 다섯 개와 알림 상태를 비활성화된
폼 컨트롤로 표시해 편집 가능 여부가 불명확했다. 채용공고의 세로 액션 레일은 최소 높이 34px,
최소 너비 88px로 구성돼 있었다.

## 변경

- 작업대 링크를 직접 대상으로 하는 요약 카드 세 개와 가상 폴더 카드 세 개를 정의했다.
- 첫 코딩 문제 영역과 지표 카드에 같은 높이·테두리·간격 체계를 적용했다.
- 빈 폴더 영역의 강제 최소 높이를 줄이고 안내 카드의 위계를 정리했다.
- 복습 예정 단원은 source, 제목, `복습하기`가 분리된 전체 너비 버튼 행으로 변경했다.
- 채용 저장 액션은 132px 레일과 최소 40px 컨트롤로 통일했다.
- 설정 읽기 상태는 다섯 개의 `dt`/`dd` 값으로, 편집 상태는 실제 폼으로 분리했다.
- 알림 읽기 상태는 `받기`/`끄기` 상태 목록으로 표시하고 편집 중에만 checkbox를 보여준다.
- 로그아웃을 별도 계정 카드로 분리하고 설정 저장 동작을 폼 하단의 공통 액션 영역으로 옮겼다.

## 반응형 계약

1440×900에서는 작업대가 한 개의 feature와 세 개의 지표 열, 설정이 profile과 side stack 두 열,
채용 액션이 132px 세로 레일로 유지된다. 375×812에서는 작업대 feature가 첫 행 전체를 차지하고,
설정·가상 폴더·채용 액션은 한 열로 바뀐다. 학습 복습 행도 제목과 액션이 세로로 분리된다.

이 규칙은 `scripts/troubleshooting/ui-responsive-contract.test.ts`의 두 viewport contract test로
고정했다. 첨부 기준 화면에는 개인 정보가 포함돼 저장소 증빙으로 복사하지 않았다. 새 브라우저
screenshot이 아닌 source·behavior 계약 증빙이므로 주관적인 시각 개선율은 주장하지 않는다.

## 회귀 검증

웹 테스트 19개와 responsive contract 테스트 2개, lint, format check, 웹 typecheck, Sites build가
통과했다. 작업대 링크 이동, 복습 단원 열기, 설정의 읽기→편집→저장 전환과 폴더 저장 동작은 그대로
유지한다. 구체적인 수치는 `docs/evidence/ui-polish-2026-08-15.json`에 기록했다.

## 다시 레이아웃이 무너졌을 때

1. 링크 기반 컴포넌트에 `article` 전용 selector가 사용됐는지 확인한다.
2. `styles.css` 마지막 responsive override에서 1180px, 900px, 640px 규칙의 순서를 확인한다.
3. 긴 복습 제목이 `learning-due-copy` 내부에 있고 action이 별도 sibling인지 확인한다.
4. 설정 읽기 상태에 disabled input이 다시 등장하지 않았는지 확인한다.
5. 새 액션을 추가했다면 데스크톱 132px 레일과 모바일 한 열 계약을 함께 갱신한다.
