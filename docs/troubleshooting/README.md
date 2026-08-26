---
title: 트러블슈팅 문서 안내
date: 2026-08-12
tags: [evidence, troubleshooting]
generatedByAI: false
---

# 트러블슈팅 문서 안내

이 디렉터리는 재현 가능한 baseline, 원인, 핵심 이론, 수정 전후 검증, 회귀 테스트를 갖춘 CareerGround의 정식 기술 기록이다. 2026-08-14에 PR 본문·댓글과 만료 전 GitHub Actions artifact를 다시 대조해, PR에 흩어졌던 기록을 아래 문서로 통합했다.

## 문서 목록

| 시점  | 주제                                                                                                          | 관련 PR                                                 | 핵심 근거                                 |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| 08-12 | [초기 MVP와 정적 Sites 배포 경계](./2026-08-12-initial-mvp-and-deployment-boundary.md)                        | #3                                                      | 39 tests, 12 E2E, 초기 화면               |
| 08-12 | [Slack 제거와 OpenAI 계정 연결](./2026-08-12-openai-auth-and-seeded-user-linking.md)                          | #5–#6                                                   | 인증 migration, seed ID 0                 |
| 08-12 | [운영 4xx/5xx와 D1 영속성](./2026-08-12-production-api-errors-and-d1-persistence.md)                          | #7                                                      | 503 기준선, 24 tables/34 indexes          |
| 08-12 | [회원·풀이 공개·노트 재구성](./2026-08-12-member-workspace-visibility-and-notes.md)                           | #8                                                      | migration, 51 tests, 13 E2E               |
| 08-12 | [트러블슈팅 자동화 게시 실패](./2026-08-12-troubleshooting-automation-failures.md)                            | #9–#10                                                  | validator scope, 권한 fallback            |
| 08-13 | [채용 달력과 쿼리 성능](./2026-08-13-job-calendar-and-query-performance.md)                                   | #11, #13                                                | median 20.153→0.137 ms                    |
| 08-13 | [달력·PDF 학습·오늘의 문제](./2026-08-13-calendar-learning-and-daily-challenges.md)                           | #12                                                     | 2 daily slots, clean-runner seed fix      |
| 08-13 | [학습·설정·SQL/PDF 시각자료](./2026-08-13-learning-settings-sql-and-pdf-visuals.md)                           | #14–#15                                                 | 427 problems 분류, slide 23개             |
| 08-13 | [Sites runtime과 artifact 배포](./2026-08-13-sites-runtime-and-artifact-deployment.md)                        | #16–#18                                                 | Node/jsdom 호환, exact-SHA archive        |
| 08-13 | [120개 채용 catalog와 복수 필터](./2026-08-13-job-catalog-import-and-filter-usability.md)                     | #19                                                     | 120 upsert, 119 공개                      |
| 08-13 | [131개 감사와 canonical D1](./2026-08-13-canonical-d1-audit-remediation.md)                                   | 운영 선행 커밋                                          | P0 9/9, 합성 endpoint benchmark           |
| 08-14 | [페이지네이션·멱등성·삭제 복구](./2026-08-14-pagination-reliability-and-recovery.md)                          | #20                                                     | payload 77.1–88.1% 감소                   |
| 08-14 | [잔여 감사 49개 완결](./2026-08-14-complete-audit-remediation.md)                                             | #22                                                     | 127/131, 97 tests, 48 E2E                 |
| 08-14 | [최신 232개 전수 감사 재조치](./2026-08-14-latest-full-audit-remediation.md)                                  | #25–#28                                                 | P0 데이터 안전, schema canary, 102 tests  |
| 08-15 | [채용공고 D1 왕복과 초기 워터폴 제거](./2026-08-15-jobs-d1-roundtrip-and-loading-waterfall.md)                | 운영 성능 개선                                          | D1 dispatch 4→1, p50 74.57% 감소          |
| 08-15 | [전체 조회 fast batch와 채용 catalog 전환](./2026-08-15-read-path-fast-catalog.md)                            | 운영 성능 개선                                          | 주요 조회 1 batch, 채용 조작 read 0회     |
| 08-15 | [작업대·학습·설정 UI 위계와 컨트롤 정리](./2026-08-15-ui-hierarchy-and-control-polish.md)                     | 운영 UI 개선                                            | 링크 카드·복습 행·설정 상태 분리          |
| 08-15 | [액션 버튼 일관성·추천 제목 잘림·복습 일정 제거](./2026-08-15-action-consistency-and-review-removal.md)       | 운영 UI 개선                                            | 동일 폭 액션·제목 전체 표시·복습 UI 0개   |
| 08-16 | [D1 조회 병목 제거와 학습 페이지 잔여 지연 분석](./2026-08-16-d1-read-performance-and-learning-latency.md)    | 운영 성능 분석                                          | 채용 dispatch 4→1, 학습 상세 5회 진단     |
| 08-16 | [학습 페이지 D1 왕복 통합과 선행 로딩 적용](./2026-08-16-learning-read-latency-remediation.md)                | 운영 성능 개선                                          | 직접 진입 2→1, 학습 상세 dispatch 5→1     |
| 08-18 | [OpenAI 전달 헤더에서 Google 검증 세션으로 전환](./2026-08-18-google-auth-migration.md)                       | #36                                                     | RS256 검증, 익명 공통 API 401             |
| 08-20 | [채용 catalog 증분 대조와 복수 필터 상태 안정화](./2026-08-20-job-catalog-reconciliation-and-filter-state.md) | 이번 변경                                               | 16개 추가, 7개 만료, URL 상태 단일화      |
| 08-20 | [직무 필터·알림 동작·개인 워크스페이스 단순화](./2026-08-20-favorites-filter-and-notification-ux.md)          | #41                                                     | 직무 한글화, bootstrap 6→5, 즐겨찾기 통합 |
| 08-20 | [매일 Slack 코딩·채용 요약 자동화](./2026-08-20-daily-slack-digest.md)                                        | 이번 변경                                               | 보호 API, 07:00 KST, 136 unit·56 E2E      |
| 08-21 | [채용 달력 날짜 중복·회사 검색·Slack 요약 단일화](./2026-08-21-job-calendar-search-and-slack-digest.md)       | 이번 변경                                               | 등록일 event 0, webhook 2→1, 08:00 KST    |
| 08-21 | [채용 복수 필터 체크 아이콘 정렬](./2026-08-21-job-filter-checkmark-alignment.md)                             | 이번 변경                                               | 중심 오차 축별 ≤0.5px, 56 E2E             |
| 08-21 | [Slack 요약 섹션 이모지 복원](./2026-08-21-slack-digest-section-emojis.md)                                    | 이번 변경                                               | 제목 이모지 0→최대 2, 실전송 0건          |
| 08-21 | [Slack 전용 Lv.3 도전 문제 분리](./2026-08-21-slack-only-lv3-challenge.md)                                    | 이번 변경                                               | Slack 3→4, 사이트 3 유지, 실전송 0건      |
| 08-21 | [채용 직무 필터 한글 통합](./2026-08-21-job-filter-korean-only.md)                                            | #51                                                     | 미변환 영문 코드 14→0, 한글 옵션 37종     |
| 08-25 | [오늘의 알고리즘 문제 SQL 오분류](./2026-08-25-sql-daily-challenge-misclassification.md)                      | 이번 변경                                               | SQL 오분류 4→0, 전체 427개 유지           |
| 08-25 | [런타임 스키마 파괴 경로와 채용공고 불변성 복구](./2026-08-25-runtime-schema-and-job-immutability.md)         | #58                                                     | runtime DELETE 22→0, jobs 변경 경로 3→0   |
| 08-25 | [Migration 권위 불일치와 Slack 중복 발송 차단](./2026-08-25-migration-authority-and-slack-idempotency.md)     | 이번 변경                                               | migration 권위 3→1, 중복 claim 차단       |
| 08-26 | [운영 SLO 정적 헤더 오탐과 readiness 중복 조회](./2026-08-26-production-slo-observability.md)                 | #60                                                     | 연속 오탐 8회 분석, readiness query 4→1   |
| 08-26 | [D1 API 거대 라우터의 도메인 경계 분리](./2026-08-26-d1-api-module-boundaries.md)                             | #62                                                     | 메인 라우터 28.78% 축소, 경계 테스트 4개  |
| 08-26 | [미사용 NestJS·Prisma 백엔드 제거와 D1 단일화](./2026-08-26-single-d1-backend-retirement.md)                  | [#63](https://github.com/edder773/careerground/pull/63) | API 5,783줄 제거, lockfile 43.70% 축소    |
| 08-26 | [대형 채용 화면과 전역 CSS의 동작 보존형 분리](./2026-08-26-web-module-boundary-refactor.md)                  | 이번 변경                                               | JobsPage 43.22%, 최대 CSS 57.89% 축소     |

Dependabot PR #4는 pnpm 11/Node 24를 지원하는 `pnpm/action-setup@6` 갱신이며 별도 장애가 없어 Sites runtime 문서의 도구 체인 맥락에 포함했다. PR #3 이전의 닫힌 #1/#2는 구현이 병합되지 않았으므로 운영 변경 기록에 포함하지 않았다.

`2026-08-14-complete-audit-remediation.md`는 당시 131개 감사 범위의 결론이다. 이후 작성된
232개 최신 감사의 상태와 미검증 경계는 `2026-08-14-latest-full-audit-remediation.md` 및
`docs/audits/careerground-latest-full-audit-resolution-2026-08-14.md`가 우선한다.

## 증거 해석 규칙

- 전후 데이터·runtime·명령이 같을 때만 개선율을 쓴다.
- 운영 수치가 없으면 합성 로컬 수치임을 명시하고, 수치가 없으면 `정량 측정 불가`라고 쓴다.
- GitHub Actions artifact의 결과와 최종 PR CI가 충돌하면 둘 다 기록한다. PR #19의 과거 manifest는 실패 로그가 존재해도 파일만 있으면 `passed`로 표시하던 collector 결함을 드러냈다.
- screenshot은 개인 데이터 없이 1440×900과 375×812를 기본으로 한다. 과거 화면은 `docs/assets/mvp`, 현재 회귀 화면은 `docs/assets/troubleshooting`에 둔다.
- 자동 생성 문서는 대응하는 evidence manifest에 있는 사실만 주장한다. 수동 case study도 PR, commit, 코드, 재실행 가능한 evidence를 인용한다.

## `OPENAI_API_KEY`가 필요하지 않은 이유

트러블슈팅의 원천은 코드 변경, test/build 결과, benchmark, screenshot과 운영 log다. `OPENAI_API_KEY`는 이 근거를 문장으로 보강하는 선택 기능일 뿐 수집·검증·게시의 필수 조건이 아니다. 키가 없으면 deterministic provider를 사용하며, 현재 문서들은 사람이 근거를 대조해 작성했으므로 `generatedByAI: false`다.

## 새 변경의 기록 절차

1. 같은 데이터/runtime/viewport로 변경 전 baseline을 남긴다.
2. fix/perf/사용자 동작 변경과 함께 regression test를 작성한다.
3. `pnpm evidence:collect`, benchmark, 1440×900/375×812 screenshot으로 evidence를 모은다.
4. PR에 이 디렉터리의 case study 또는 기존 문서 갱신을 포함한다.
5. CI와 운영 배포 후 readiness를 기록하되 secret·개인 데이터·운영 원문은 남기지 않는다.
