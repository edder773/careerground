---
title: 런타임 스키마 파괴 경로와 채용공고 불변성 복구
date: 2026-08-25
tags: [audit, d1, migration, jobs, data-safety]
generatedByAI: false
pr: pending
commit: pending
evidence: docs/evidence/stage2-data-safety-2026-08-25.json
---

# 런타임 스키마 파괴 경로와 채용공고 불변성 복구

## 현상과 위험

전수 감사의 CG-001~004는 서로 다른 기능처럼 보였지만 원인은 같았다. 요청 처리와 예약 작업이
현재 상태를 읽는 데 그치지 않고, 스키마와 기존 데이터를 자동으로 “정상화”하고 있었다.

- migration 원장이나 스키마가 기대와 다르면 API 첫 요청이 개인 데이터를 지운 뒤 스키마를 재구성할 수 있었다.
- 관리자 채용 import는 동일 URL 공고를 UPSERT하고, FULL snapshot에서 빠진 공고를 `REMOVED`로 바꿀 수 있었다.
- 검토·비활성 상태도 실제 `jobs`에 저장될 수 있었다.
- 예약 유지보수는 마감일이 지난 기존 `ACTIVE` 공고를 `EXPIRED`로 바꿨다.

감사 전 코드에는 런타임 준비 함수가 직접 실행할 수 있는 개인 데이터 `DELETE` 문이 22개 있었고,
기존 `jobs`를 바꾸는 SQL 경로는 UPSERT·REMOVED·EXPIRED의 3개였다. 이 수치는 저장소의 변경 전
commit과 변경 후 작업 트리를 같은 정적 검색식으로 비교한 결과다.

## 핵심 이론 1: readiness는 관찰이고 migration은 변경이다

readiness의 책임은 “현재 배포가 이 DB를 안전하게 사용할 수 있는가”를 답하는 것이다. 이를
“사용할 수 없으면 요청 중에 스키마를 고친다”로 확장하면, 원장 유실·복원 DB·부분 배포 같은
비정상 상태가 곧 데이터 변경 승인으로 바뀐다.

변경 전 흐름은 다음과 같았다.

```text
API 또는 scheduled 요청
  -> schema 불일치 감지
  -> runtime DDL/DML 및 개인 데이터 purge
  -> 요청 계속
```

변경 후에는 읽기 전용 검사만 수행한다.

```text
API 또는 scheduled 요청
  -> schema와 migration checksum 읽기
  -> 일치: 요청 계속
  -> 불일치: 503 DB_SCHEMA_NOT_READY, 데이터 불변
```

`runtime-schema.ts`의 DDL·DML self-heal을 제거했고, 예상 version/checksum 또는 필수 구조가
다르면 `ensureRuntimeSchema`가 실패한다. Worker는 이를 `DB_SCHEMA_NOT_READY` 503으로 변환한다.
스키마 변경은 배포 전에 승인된 순방향 migration으로만 수행한다.

Google 전환 당시 운영 D1과 전체 이력을 재현한 로컬 DB 사이에는 `users.site_user_id` 잔존 여부가
다르다. 이 차이를 런타임 table rebuild로 숨기지 않고, 신규 사용자 INSERT 직전에 컬럼 존재 여부만
읽어 두 형태를 모두 지원한다. 이 호환 분기는 데이터나 원장을 변경하지 않으며, migration authority
단일화 단계에서 제거할 임시 경계다.

## 핵심 이론 2: 수집 결과와 기존 카탈로그의 생명주기를 분리한다

이번 단계의 정책은 “검증된 신규 `ACTIVE` 행만 추가”다. 따라서 import의 preview는 분류 정보를
제공하지만 commit 권한은 더 좁다.

| 입력/상황                 | 변경 전                  | 변경 후                    |
| ------------------------- | ------------------------ | -------------------------- |
| 신규 `ACTIVE`, 분류 완료  | INSERT                   | INSERT                     |
| 동일 canonical URL        | 기존 행 UPDATE           | 중복 처리, 기존 행 불변    |
| 동일 fingerprint·다른 URL | `NEEDS_REVIEW` 저장 가능 | 검토 표시만, 저장하지 않음 |
| 비ACTIVE 상태             | 저장 가능                | 거부                       |
| FULL snapshot 누락        | `REMOVED` UPDATE         | 아무 변경 없음             |

commit은 `CREATE AND status=ACTIVE`만 선택하고 `INSERT ... ON CONFLICT(source_url) DO NOTHING`을
사용한다. 관리자 화면에서도 snapshot 제거 확인 UI를 없애고 이 정책을 명시했다. 입력 package의
행 수와 실제 허용 행 수 차이는 import batch의 `rejected_count`에 남는다.

## 핵심 이론 3: 시간 경과 상태는 조회 시 파생할 수 있다

기존 행 불변 정책과 마감 공고 비노출은 충돌하지 않는다. 고정 마감 공고는 다음 조건으로 목록,
달력, 상세, 카테고리, 검색, readiness canary에서 제외한다.

```sql
rolling = 1 OR deadline_at IS NULL OR deadline_at >= :now
```

예약 유지보수는 더 이상 `jobs.status`를 바꾸지 않는다. 같은 로컬 카탈로그에서 DB의 상태 행 수는
그대로 유지됐고, 2026-08-25 실행 시 과거 고정 마감 5건만 조회 결과에서 빠져 공개 목록이
119건에서 114건으로 바뀌었다. 테스트 기대값은 고정 숫자가 아니라 같은 공개 규칙으로 계산해
날짜가 바뀌어도 정책을 검증한다.

## 전후 검증

| 항목                                   |              변경 전 |            변경 후 |
| -------------------------------------- | -------------------: | -----------------: |
| runtime 준비 경로의 개인 데이터 DELETE |                   22 |                  0 |
| 기존 jobs 변경 SQL 경로                |                    3 |                  0 |
| schema 원장 누락 시 응답               |    자동 변경 후 계속 | 503, sentinel 보존 |
| checksum 불일치 시 응답                |       자동 보정 가능 |                503 |
| 예약 작업 후 과거 마감 공고 DB 상태    | `ACTIVE` → `EXPIRED` |      `ACTIVE` 유지 |
| 과거 고정 마감 공고 공개               |    상태 변경 뒤 제외 | 조회 규칙으로 제외 |

격리 D1 회귀 테스트는 원장 누락·checksum 불일치, sentinel 사용자와 저장 공고 보존, 런타임
파괴 SQL 미실행, 기존 공고 제목 불변, FULL snapshot 누락 no-op, 비ACTIVE/검토 행 미저장,
예약 작업의 기존 상태 불변을 확인한다.

로컬 최종 검증 결과는 다음과 같다.

- lint: 통과
- typecheck: 통과
- unit/integration: 38개 파일, 152개 테스트 통과
- Playwright E2E/visual: Chromium·Firefox·WebKit·375px 프로젝트, 56개 통과
- performance budget: 실패 항목 0개
- 로컬 복원 훈련: 461페이지, FK 위반 0개, fixture checksum 일치
- production build와 Sites build: 통과

첫 E2E 실행은 샌드박스의 로컬 포트 제한으로 서버가 `EPERM`을 반환했다. 같은 commit에서 로컬
테스트 서버 포트 권한만 허용해 다시 실행했으며 56개가 모두 통과했다. 이는 제품 실패와 구분한다.

## 운영 확인과 남은 경계

배포 전에는 운영 D1의 migration version/checksum, 사용자·공통 데이터 집계, 과거 마감 `ACTIVE`
행 수를 읽기 전용으로 기록한다. 배포 후 같은 집계를 다시 비교해 기존 행이 바뀌지 않았는지 확인한다.
Sites 관리면이 운영 D1 export/restore 기능을 제공하지 않는 현재 환경에서는 로컬 복원 훈련 성공과
운영 읽기 전용 검사를 근거로 사용하되, 이를 운영 백업 완료로 과장하지 않는다.

이 단계는 CG-001~004를 닫는다. canonical job identity의 DB 제약, Slack outbox 멱등성,
migration authority 단일화는 후속 단계에서 별도로 처리한다.
