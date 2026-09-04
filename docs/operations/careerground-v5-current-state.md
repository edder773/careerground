# CareerGround 채용 자동화 현재 상태

2026-09-03 기준 운영 경로는 schema 2.0 handoff 하나다. 2026-08-28 이후 실제 운영 파티션이 이
계약으로 전환됐고, 2026-09-02 A2의 세 파티션도 같은 경로에서 검증·게시됐다.

## 데이터 흐름

1. 저장소 밖의 ChatGPT 예약 작업 3개가 평일 18:00에 schema 5.1 신규 후보 delta를 조사한다.
2. 각 작업은 임시 Git blob과 schema 2.0 Issue 포인터를 생성한다.
3. `.github/workflows/careerground-v5-handoff.yml`이 세 포인터를 모아 크기·SHA-256·출처
   소유권·enum·날짜·중복을 검증하고 ID·canonical key·fingerprint를 결정한다.
4. 검증 성공 시 보호된 `/api/v1/internal/jobs-v5/publish`가 운영 D1 기준선과 다시 대조하고 신규
   `ACTIVE`만 원자 반영한다.
5. 게시 원장은 `workflow_runs`, `workflow_staged_jobs`, `workflow_publications`,
   `workflow_pointers`, `import_batches`에 남는다.
6. Slack은 평일 07:55에 runner를 선점해 08:01에 실행하고, 08:31 감시와 게시·SLO 완료 이벤트가
   같은 `daily:YYYY-MM-DD` claim을 재확인한다.

## 운영 불변식

- 인입은 `PARTITION_1`~`PARTITION_3`만 허용한다. schema 1.0, v4 final/audit, Library 파일 선택은
  거부한다.
- 같은 날짜·attempt의 blob 충돌은 자동 선택하지 않는다.
- 신규 공고는 `ACTIVE`, 신입 근거, 미래 마감 또는 상시 조건을 모두 만족해야 한다.
- 기존 `jobs` UPDATE·DELETE와 모든 `saved_jobs` mutation은 수행하지 않는다.
- 게시 workflow는 Slack webhook을 직접 호출하지 않는다.
- Slack의 `SENT` claim은 재전송하지 않는다. 일일·스냅샷 실행이 겹치면 공고별 D1 예약 원장이
  외부 호출 전에 중복 실행을 차단하고, 전송 결과가 불확실한 `UNCERTAIN`은 예약을 유지해 자동
  재시도하지 않는다.

## 활성 workflow

- `careerground-v5-handoff.yml`: 파티션 인입, 검증, D1 게시, 완료 이벤트
- `daily-slack-digest.yml`: 08:01 발송과 08:31 감시
- `production-smoke.yml`: 매시 운영 SLO
- `recovery-drill.yml`: 주간 D1 호환 복구 훈련
- `security.yml`: 의존성·secret·CodeQL 검사

실행 절차는 `careerground-v5-runbook.md`, 포인터 계약은
`careerground-v5-automatic-handoff.md`를 단일 기준으로 사용한다.
