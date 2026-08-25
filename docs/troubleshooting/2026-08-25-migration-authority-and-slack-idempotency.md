---
title: Migration 권위 불일치와 Slack 중복 발송 차단
date: 2026-08-25
tags: [audit, d1, migration, jobs, slack, idempotency]
generatedByAI: false
pr: 59
commit: 5f994267ff872abcaba2de3fe7f412965c77c280
evidence: docs/evidence/stage3-data-integrity-2026-08-25.json
---

# Migration 권위 불일치와 Slack 중복 발송 차단

## 현상과 원인

2단계에서 요청 경로의 runtime schema 변경을 제거한 뒤에도 세 경계가 남았다.

- readiness가 요구하는 원장은 `0023`이었지만 운영 원장은 `0032`까지 진행돼 있었다.
- 배포 archive에 포함된 `0033`은 실행 SQL만 있고 `app_schema_migrations` 기록이 없었다.
- build와 staging이 각각 디렉터리를 열거해 migration 포함 범위가 둘 이상의 코드에 중복됐다.
- Slack workflow는 API 조회 후 webhook을 바로 호출해 동일 workflow 재실행을 DB가 구분하지 못했다.
- `jobs.source_url`은 유일했지만 같은 출처 ID가 다른 URL로 재게시되면 별개 공고로 들어올 수 있었다.

## 핵심 이론 1: migration 순서와 readiness 기대값은 하나의 권위에서 나온다

배포 파일 목록과 runtime expected version이 서로 다른 코드에서 관리되면, 배포는 성공했지만
readiness가 과거 버전을 정상으로 보거나 새 SQL이 archive에서 빠질 수 있다. 이를 막기 위해
`migration-authority.ts`가 운영 migration의 순서, 최신 version, checksum을 함께 정의한다.

```text
migration-authority
  ├─ build: 정확히 등록된 SQL만 archive에 복사
  ├─ stage: 누락·미등록 SQL이면 패키징 거부
  └─ runtime: 최신 version/checksum만 읽기 전용 확인
```

`0034`는 누락됐던 `0033` 원장과 자신의 원장을 순방향으로 기록한다. 과거 migration 파일을
수정하거나 요청 중에 원장을 보정하지 않는다.

## 핵심 이론 2: canonical identity는 URL과 별개다

같은 공고의 URL 경로가 바뀔 수 있으므로 `source_posting_id`가 있으면 출처 host와 ID를 조합하고,
없을 때만 정규화 URL을 사용한다.

```text
source ID 있음 → source:<host>:<sourcePostingId>
source ID 없음 → url:<canonicalUrl>
```

이 값은 SQLite virtual generated column이므로 관리자 API뿐 아니라 향후 SQL import도 같은 규칙을
거친다. partial unique index가 같은 canonical key의 두 번째 행을 DB에서 차단한다. 로컬 catalog
135행은 모두 key가 생성됐고 distinct key도 135개였다.

## 핵심 이론 3: 외부 webhook은 애매한 실패를 자동 재시도하면 안 된다

Slack Incoming Webhook은 CareerGround의 delivery key를 받아 exactly-once를 보장하지 않는다.
따라서 D1이 먼저 하루 또는 스냅샷 단위 key를 원자적으로 claim한 뒤에만 webhook을 호출한다.

```text
claim 성공 → Slack 호출 → 2xx → SENT
                    ├─ 명시적 non-2xx → FAILED, 재시도 허용
                    └─ timeout/연결 단절 → UNCERTAIN, 자동 재시도 차단
```

Slack이 메시지를 받았지만 응답만 유실된 경우를 `FAILED`로 두면 중복 발송될 수 있다. 그래서
수신 여부를 판단할 수 없는 오류는 `UNCERTAIN`으로 남긴다. 같은 key의 두 번째 claim은 차단되고,
완료 뒤에는 `already-sent`로 건너뛴다. claim token은 원문을 저장하지 않고 hash만 D1에 보관한다.

## 전후 비교

| 항목                             |         변경 전 |               변경 후 |
| -------------------------------- | --------------: | --------------------: |
| 운영 migration 목록 권위         |             3곳 |                   1곳 |
| archive 내 원장 미기록 migration |             1개 |                   0개 |
| Slack DB delivery guard          |             0개 |                   1개 |
| 같은 날짜 연속 claim             | 둘 다 전송 가능 |       첫 claim만 허용 |
| canonical job 고유 제약          |         URL 1개 | URL + 출처 ID key 2개 |

회귀 테스트는 migration 목록 누락·미등록 파일 거부, `0033`/`0034` ledger, generated canonical key
135/135, URL이 달라도 같은 출처 ID인 import 차단, Slack 첫 claim·중복 차단·완료·명시적 실패 재시도,
네트워크 timeout의 `UNCERTAIN` 전환을 검증한다. 이 단계의 검증에서는 Slack 메시지를 실제로
전송하지 않는다.

## 최종 검증 결과

- unit/integration: 38개 파일, 158개 테스트 통과
- E2E: Chromium·모바일 Chromium·Firefox·WebKit 4개 프로젝트, 56개 테스트 통과
- 성능 예산: 채용 cursor p95 5.26ms, 통합 검색 p95 38.21ms, 실패 0건
- 복구 드릴: 1,912,832 bytes snapshot을 2.02ms에 복원, foreign key 위반 0건, checksum 일치
- 복구 대상: `jobs` 135행, `slack_digest_deliveries` 1행, `app_schema_migrations` 20행 포함
- production build: web·api·docs·Sites package 전부 통과
- 실제 Slack 메시지 전송: 0건

수치는 격리된 LocalD1과 Playwright 로컬 서버에서 측정했다. 운영 D1은 배포 전후 행 수와
readiness를 읽기 전용으로 비교하고, 운영 Slack delivery claim은 생성하지 않는다.

## 남은 경계

운영 D1 export는 현재 Sites 관리 연결에서 제공되지 않는다. 또 Incoming Webhook 자체의 정확히 한 번
전달은 보장할 수 없으므로, `UNCERTAIN`은 자동 재시도보다 중복 방지를 우선한다. 운영자가 실제 Slack
채널과 delivery 원장을 대조한 뒤에만 후속 수동 조치를 판단해야 한다.
