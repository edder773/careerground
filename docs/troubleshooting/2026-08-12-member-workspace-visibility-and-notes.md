---
title: 회원 온보딩·풀이 공개·노트 사용성 재구성
date: 2026-08-12
tags: [onboarding, solutions, notes, pr-8]
generatedByAI: false
pr: 8
commit: c070ff61cfa36e056d281008c9027088f427770c
evidence: docs/evidence/archive/pr-8-manifest.json
---

# 회원 온보딩·풀이 공개·노트 사용성 재구성

## 문제

신규 사용자는 표시 이름·주 언어를 명시하지 않았고, 풀이를 따로 “공유”해야만 다른 사용자가 볼 수 있었다. 다른 풀이 버튼은 문제별 풀이가 아닌 기록 화면으로 이동했고, 개인 노트는 작성·검색·revision·folder 연결의 흐름이 분리되어 실제 사용성이 낮았다.

## 핵심 이론

도메인 기본값은 UI 문구가 아니라 DB migration과 API invariant로 고정해야 한다. “저장한 풀이는 회원 공개” 정책은 생성 시점에 적용되어야 하며, 검색/상세 API도 같은 공개 범위를 사용해야 한다. 노트는 master-detail 편집기에서 선택·수정·저장·이탈 보호가 하나의 상태 머신으로 작동해야 한다.

## 전후 비교

```diff
- preferredLanguage: typescript 포함 / 이름 입력 선택
+ python | java | javascript | cpp 중 하나 + 표시 이름 필수

- solution.visibility 기본 PRIVATE + 별도 공유 토글
+ 기록 즉시 MEMBER 공개 + 문제별 풀이 조회

- 단순 노트 카드
+ 검색 + 편집/미리보기 + revision + folder 저장 + 삭제 확인
```

오늘의 문제를 개인 폴더보다 위로 이동하고 운영자용 설명 문구도 제거했다.

## 수치와 데이터 이동

- 기존 `typescript` preference는 `javascript`로 backfill.
- 기존 private solution은 member-visible로 전환.
- 기존 member-visible note는 private로 전환.
- 단위/통합 51개, Playwright 13개 통과.
- 1440×900, 1024×768, 375×812, 320×568에서 검증.
- axe serious/critical 0.

사용자별 작성 완료 시간은 수집하지 않아 `정량 측정 불가`다.

## 회귀 방지

- 허용 언어 enum과 신규 온보딩 완료 조건을 계약 테스트한다.
- solution 저장 직후 다른 회원의 problem-filtered 목록에 나타나는지 검사한다.
- note는 owner 외 검색·조회에서 제외되고, dirty 상태 이탈 시 확인한다.

## 근거

- [PR #8](https://github.com/edder773/careerground/pull/8)
- `docs/evidence/archive/pr-8-manifest.json`
