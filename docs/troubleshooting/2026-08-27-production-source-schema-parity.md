---
title: GitHub·Sites 소스 분기와 운영 schema 오탐 제거
date: 2026-08-27
tags: [sites, github, d1, migration, monitoring, deployment]
generatedByAI: false
pr: pending
commit: pending
evidence: docs/evidence/production-source-schema-parity-2026-08-27.json
---

# GitHub·Sites 소스 분기와 운영 schema 오탐 제거

## 현상

운영 readiness는 `0036_sync_validator_jobs_20260826`을 정상 적용했다고 응답했지만 GitHub
`main`의 migration 권위는 `0035_sync_validator_jobs_20260825`에서 멈춰 있었다. 운영 Sites
소스에만 0036 migration과 검증된 채용 import 자료가 존재했다. GitHub `main`과 배포 소스의 비교
결과 차이는 13개 파일, 13,553줄 추가, 13줄 삭제였다.

이 상태에서 GitHub 소스만 기준으로 다음 배포를 만들면 운영에 이미 적용된 migration을 package가
알지 못하거나, 채용 catalog 생성·검증 근거가 저장소에서 사라질 수 있다.

## 원인

Sites가 사용하는 소스 저장소와 GitHub 저장소가 서로 다른 이력으로 운영됐고, 8월 26일 채용 DB
갱신은 Sites 소스에만 반영됐다. 기존 Production SLO 검사는 운영 응답의 `expectedVersion`과
`appliedVersion`이 서로 같은지만 확인했다. 저장소가 기대하는 version은 비교하지 않았기 때문에
운영이 0036, GitHub가 0035인 상황도 정상으로 판정했다.

실제로 0035를 가리키는 commit에서 실행된 Production SLO run `33023591177`은 0036 운영 배포를
대상으로 성공했다. 이는 운영 DB 오류가 아니라 관측 계약의 false negative다.

## 핵심 이론: 자기 일관성과 배포 일치는 다르다

운영 응답의 두 값만 비교하면 DB와 Worker가 같은 배포 안에서 일관적인지는 알 수 있지만, 배포할
저장소가 그 상태를 재현할 수 있는지는 알 수 없다. 재현 가능성을 확인하려면 세 값이 같아야 한다.

```text
GitHub source EXPECTED_SCHEMA_VERSION
                 = 운영 응답 expectedVersion
                 = 운영 D1 appliedVersion
```

따라서 상태 점검기가 저장소의 `migration-authority.ts`에서 version을 직접 읽고, 운영의 expected와
applied 모두와 비교하도록 변경했다. 세 값 중 하나라도 다르면 SLO 실패와 운영 incident를 만든다.

## 수정

- Sites 소스에만 있던 0036 migration, 채용 import 근거와 생성기 회귀 테스트를 GitHub 소스에
  복원했다.
- Production SLO 결과에 `sourceVersion`을 추가했다.
- readiness contract가 저장소·Worker·D1의 세 version 일치를 요구하도록 강화했다.
- incident 본문에 source schema와 deployed schema를 구분해 기록한다.
- migration 권위 선언이 없거나 운영 version이 저장소보다 앞선 상황의 회귀 테스트를 추가했다.

## 전후 비교

| 항목                           | 변경 전   | 변경 후               |
| ------------------------------ | --------- | --------------------- |
| GitHub source schema           | 0035      | 0036                  |
| 운영 applied schema            | 0036      | 0036                  |
| source와 운영 version 비교     | 없음      | 세 값 일치 필수       |
| version 분기 시 Production SLO | 성공 가능 | 실패 및 incident 생성 |
| GitHub에 보존된 0036 migration | 없음      | 1개                   |
| 검증 중 실제 Slack 메시지      | 0건       | 0건                   |

관련 회귀 검증은 4개 파일 62개 테스트가 모두 통과했다. 변경된 SLO 점검을 실제 운영 URL에 실행한
결과 source와 deployed schema는 모두 0036이었고 28개 검사 중 28개가 통과했다. readiness cold
start는 2,383.4ms, warm p95는 199.3ms였다. 각각 설정된 5,000ms와 2,500ms 예산 안이며 단일 시점의
운영 측정이므로 장기 성능 추세로 확대 해석하지 않는다.

전체 검증은 format, lint, typecheck, production build와 단위·통합 테스트 150개, Chromium·375px
Chromium·Firefox·WebKit E2E 56개를 통과했다. bundle과 합성 LocalD1 성능 예산 실패는 각각
0건이었다. 격리 복구 훈련은 2,027,520 bytes snapshot에서 foreign key 위반과 table count 불일치가
없었다. 이 로컬 복구 수치는 운영 D1 복원 시간으로 해석하지 않는다.

## 남은 경계

Sites와 GitHub의 commit SHA는 서로 다른 저장소 이력 때문에 같지 않을 수 있다. 이 검사는 운영
DB migration 재현 가능성을 막는 version 분기를 자동 감지하지만 모든 파일의 tree 동일성을 원격
서비스끼리 자동 증명하지는 않는다. 배포 시에는 검증된 GitHub source를 Sites 소스에 반영한 뒤
같은 working tree로 package를 만들어야 한다.
