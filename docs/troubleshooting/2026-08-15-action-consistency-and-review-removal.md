---
title: 액션 버튼 일관성·추천 제목 잘림·복습 일정 제거
date: 2026-08-15
tags: [ui, responsive, home, jobs, learning, d1]
generatedByAI: true
model: GPT-5
pr: pending
commit: pending
evidence: docs/evidence/ui-action-review-removal-2026-08-15.json
---

# 액션 버튼 일관성·추천 제목 잘림·복습 일정 제거

## 현상과 원인

채용공고의 `폴더에 저장`은 132px 액션 레일을 채우는 wrapper 안에 있었지만, 실제 trigger에는
`width: 100%`가 없었다. 바로 아래의 관심 저장과 외부 링크는 직접 자식이라 전체 너비 규칙을
받았고, 그 결과 첫 버튼만 짧게 보였다.

작업대의 오늘의 코딩테스트 제목은 `overflow: hidden`, `white-space: nowrap`,
`text-overflow: ellipsis`가 함께 적용돼 카드 공간과 관계없이 한 줄에서 잘렸다. 복습 일정은 작업대
두 곳, 학습 화면의 건수와 목록, 설정과 알림 안내에 각각 남아 있었고, D1 대시보드와 scheduler도
복습 건수 계산과 알림 생성을 계속하고 있었다.

## 변경

- 채용 액션 레일의 폴더 저장 trigger, 관심 저장, 외부 링크에 동일한 `width: 100%`, 최소 높이
  40px, 공통 padding 계약을 적용했다.
- 코딩 추천 카드는 첫 행에 난이도와 열기 액션, 둘째 행 전체 너비에 제목을 두고 `white-space:
normal`, `overflow-wrap: anywhere`로 제한 없이 높이가 늘어나게 했다.
- 작업대의 오늘 복습 요약과 복습 예정 가상 폴더를 제거하고 남은 두 채용 지표에 맞게 반응형 열을
  3개에서 2개로 조정했다.
- 학습 화면의 복습 건수, 오류 상태, 예정 목록, `/learning/due` 조회를 제거했다. 학습 자료,
  플래시카드, 확인 문제와 학습 완료 동작은 유지한다.
- 설정의 학습 복습 알림 항목과 알림 페이지의 복습 안내 문구를 제거했다.
- 운영 D1 대시보드에서 사용하지 않는 복습 건수 subquery를 제거했다. scheduler는 더 이상
  `LEARNING_REVIEW` 알림을 만들지 않으며, 과거 해당 유형은 알림 목록과 읽지 않은 개수에서 제외한다.
- Nest 대시보드도 동일하게 복습 건수 조회를 제거했다. 학습 콘텐츠와 진도 레코드는 삭제하지
  않았다.

## 반응형 계약

1440×900에서는 작업대가 코딩 feature 하나와 채용 지표 두 열로 구성된다. 각 코딩 문제는 제목이
둘째 행에서 여러 줄로 표시되고, 채용 액션 세 개는 132px 레일을 같은 폭으로 채운다. 375×812에서는
코딩 feature가 첫 행 전체를 차지하고 두 지표가 다음 행을 나눠 쓰며, 코딩 문제와 채용 액션은 한
열로 재배치된다.

이 규칙은 `scripts/troubleshooting/ui-responsive-contract.test.ts`에서 source contract로 고정했다.
사용자 첨부 화면에는 개인 정보가 있어 저장소 증빙으로 복사하지 않았다.

## 회귀 검증

웹 19개, API 33개, 계약 10개, 운영·배포 53개 테스트가 통과했다. 별도 D1 회귀 35개와 반응형
계약 2개도 통과했으며 lint, format check, web/API/Sites/docs typecheck와 Sites production build가
성공했다. 성능 예산 검사에는 실패가 없었고 cursor p95는 채용 16.13ms, 코딩 문제 10.46ms,
알림 7.04ms였다. 이 수치는 로컬 합성 D1 측정이며 운영 네트워크 지연을 뜻하지 않는다.

## 다시 문제가 생겼을 때

1. 폴더 저장처럼 wrapper 안에 실제 버튼이 있는 액션은 wrapper뿐 아니라 trigger도 전체 너비인지
   확인한다.
2. 오늘의 문제 제목 selector에 `nowrap`, `ellipsis`, 고정 높이가 다시 들어오지 않았는지 확인한다.
3. 추천 카드의 제목이 badge·열기와 같은 grid 행으로 되돌아가지 않았는지 확인한다.
4. `HomePage`와 `LearningPage`가 `/learning/due` 링크나 조회를 다시 추가하지 않았는지 확인한다.
5. D1 dashboard SQL에 `learning_progress` count가, scheduler에 `LEARNING_REVIEW` insert가 다시
   추가되지 않았는지 확인한다.

정량 근거와 검증 명령 결과는 `docs/evidence/ui-action-review-removal-2026-08-15.json`에 있다.
