# 채용공고 알리미: 수집 → 검증 → 테스트 → 확인 → 다음날 운영

모든 시각은 Asia/Seoul이다. 이 절차가 기존 HQ, v5 병행 발송과 07:45 발송 신호를 대체한다. 기존 발송 신호 예약은 중지하고 `daily-slack-digest.yml`, `careerground-v5-handoff.yml`은 비활성 상태로 유지한다.

| 단계              | 실행 주체                           | 조건과 결과                                                                                                          |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 평일 18:00        | ChatGPT 수집 P1–P5                  | 오늘 날짜의 수집 결과를 Drive에 저장·재읽기하고 `[JOB-ALERT][날짜][collector-N]` Issue로 제출                        |
| 평일 20:00        | ChatGPT 검증기 1–3                  | `job-alert-data/pending/오늘날짜.json` 원문을 검증하고 같은 날짜의 reviewer Issue로 제출                             |
| 평일 21:00        | GitHub Actions `job-alert-test.yml` | 수집 5개·검증 3개가 모두 있어야 실제 알리미를 테스트 채널에 발송                                                     |
| 평일 22:00        | Codex 예약 확인                     | Actions, 테스트 원장, Slack의 실제 알리미 메시지를 확인. 실패 원인 수정 후 개선본 재테스트. 정상 결과만 release 승인 |
| 다음 영업일 08:00 | GitHub Actions `job-alert.yml`      | 테스트·확인을 통과한 이전 날짜의 배치와 동일 코드로 운영 채널에 한 번 발송                                           |

첫 적용은 2026-10-02의 18→20→21→22시, 첫 운영 발송은 사용자가 지정한 다음 날 **2026-10-03 08:00**이다. 이 첫 발송만 토요일·공휴일 예외 `force=true`를 사용한다. 이후에는 평일·한국 공휴일 정책을 적용한다. 운영 시작 날짜보다 이른 실행과 08:00 이전 실행은 `force`로도 허용되지 않는다.

## 발송 경로와 기록

- 운영: `SLACK_WEBHOOK_URL`, `job-alert-data/ledger.json`.
- 테스트: **별도 채널에 연결한** `SLACK_TEST_WEBHOOK_URL`, `job-alert-test-data/ledger.json` 및 `results/<배치날짜>.json`. 운영 Webhook으로 대체하지 않는다.
- 수집/검증 Issue는 자기 제출 파일을 저장한 뒤 오늘의 pending만 갱신한다. Issue 도착 또는 `[send]` Issue로는 Slack을 보내지 않는다.
- 테스트는 운영의 기발송 공고 기준선을 읽어 별도 임시 디렉터리에서 실행한다. 운영 원장과 운영 pending 파일을 수정하지 않는다.
- 정상 테스트는 `SENT`, 검증 3개, 검증 대기 0건, 수집 배치 fingerprint, 코드 SHA, Actions run ID를 남긴다. 모의 전송과 미리보기는 운영 승인 근거가 될 수 없다.
- 22시 실제 Slack 수신 확인 후 `mode=release` 실행이 `releases/<배치날짜>.json`에 `READY`를 기록한다. 배치 내용이나 코드가 바뀌면 재테스트와 재승인이 필요하다. 이미 보낸 테스트가 단순 재실행으로 새 코드의 성공 기록으로 바뀌지 않는다.
- 운영은 `JOB_ALERT_LIVE=true`, 운영 시작 날짜, 08:00 이후, 이전 날짜 배치, 수집 5개·검증 3개, 일치하는 release를 모두 요구한다. 운영 원장에 이미 발송 또는 수신 불확실 기록이 있는 배치는 다시 사용하지 않는다.

Slack 메시지에는 마감 전의 비상시 공고 가운데 3개 검증기의 **2개 이상**이 통과시킨 공고를 싣는다. 링크·회사·마감일·IT 분야는 수집 당시 객체를 유지한다. 기발송 및 사이트 간 중복, 마감, 지원 대상 제한 공고를 코드로 제외한다. 코딩 문제 조회 실패는 채용 발송을 막지 않는다. 수집·검증이 정상 완료된 빈 배치도 “새로 알릴 공고 없음”을 보내 실제 동작과 수신을 확인할 수 있다.

## 배치 계약

Issue 제목은 `[JOB-ALERT][YYYY-MM-DD][collector-1]` … `collector-5`, `reviewer-1` … `reviewer-3`다. 작성자는 OWNER/MEMBER/COLLABORATOR여야 한다. reviewer의 날짜를 최신 배치로 자동 바꾸지 않는다.

```json
{
  "jobs": [
    {
      "companyName": "회사명",
      "title": "신입 IT 공고",
      "sourceName": "Saramin",
      "sourceUrl": "https://example.com/job/1",
      "deadlineAt": "2026-10-15T23:59:00+09:00",
      "rolling": false,
      "careerScope": "NEW_GRAD_ONLY",
      "itRole": null
    }
  ]
}
```

날짜만 있는 마감은 당일 23:59 KST로 정규화한다. `itRole`은 통합 공채의 실제 IT 모집 분야이며 단일 IT 직무는 null이다. 빈 결과도 `jobs: []`로 제출한다. 형식 오류는 해당 공고만 제외하고 Issue에 이유를 보고한다. 검증기는 오늘 pending이 없으면 어제 배치로 대체하지 않는다.

```text
job-alert-data/
  ledger.json
  pending.json
  pending/<날짜>.json
  batches/<날짜>/collector-<N>.json
  batches/<날짜>/reviewer-<N>.json
job-alert-test-data/
  ledger.json                       테스트 전송 상태만 보관
  results/<날짜>.json               테스트 결과와 배치·코드 식별자
  releases/<날짜>.json              수신 확인 후 운영 승인
```

## 예약 지연 보조 장치

GitHub cron과 함께 Mac의 `scripts/operations/mac-job-alert-dispatch.py`가 실행 요청을 보낸다. 20:50에 테스트 Actions를 미리 시작해 내부에서 21:00까지 기다리고, 07:50에 운영 Actions를 미리 시작해 08:00까지 기다린다. 첫 적용일은 운영 실행 요청을 보내지 않고 첫 운영일은 토요일 예외를 명시한다. 최대 3회, 4분 간격으로 실행 요청을 보완하되 `SENT`/`UNCERTAIN`이면 멈춘다. 실제 Slack 전송과 중복 방지는 Actions가 담당한다.

Mac 보조 장치와 Codex 22시 확인은 컴퓨터가 켜져 있고 네트워크와 앱이 동작해야 한다. GitHub 실행 대기 때문에 실제 수신 시각은 늦어질 수 있다. prewarm은 그 지연을 줄이며 정확한 초 단위 도착을 보장하지 않는다.

## 수동 확인·개선

```bash
# 실제 테스트. batch_date는 확인할 수집 날짜다.
gh workflow run job-alert-test.yml -R edder773/careerground --ref main \
  -f mode=test -f batch_date=2026-10-02 -f dry_run=false -f force=false

# 코드나 배치를 개선한 후 테스트 채널에 다시 발송한다.
gh workflow run job-alert-test.yml -R edder773/careerground --ref main \
  -f mode=test -f batch_date=2026-10-02 -f dry_run=false -f retest=true

# Slack에서 실제 알리미 수신과 본문을 확인한 뒤 승인한다.
gh workflow run job-alert-test.yml -R edder773/careerground --ref main \
  -f mode=release -f batch_date=2026-10-02

gh variable set JOB_ALERT_LIVE --body true -R edder773/careerground

# 첫 운영일 07:50경 실행 요청. 실제 전송은 08:00 이후다.
gh workflow run job-alert.yml -R edder773/careerground --ref main \
  -f batch_date=2026-10-02 -f dry_run=false -f force=true -f hold_until_08=true
```

`UNCERTAIN`은 Slack이 받았을 수도 있는 상태다. 자동 재발송과 승인을 막는다. Slack 실제 수신과 Actions 로그를 먼저 확인하고, 오지 않은 것이 확인된 경우 해당 테스트 또는 운영 원장 기록을 수동 복구한다. 명확한 HTTP 오류는 성공으로 기록하지 않아 수정 후 재시도할 수 있다.

수집/검증 제출이 빠졌다면 해당 ChatGPT 작업의 Drive 결과·Issue·receive 실행을 확인한다. 이미 저장된 정상 결과로 누락된 제출만 복구하고 오늘 배치의 검증을 다시 수행한다. 운영 채널에서 테스트하거나 확인 전에 `READY`를 만들어 우회하지 않는다.

## 검증 명령

```bash
pnpm exec vitest run scripts/job-alert scripts/operations/hold-until-kst.test.mjs
python3 scripts/operations/mac_job_alert_dispatch_test.py
```

테스트는 가짜 공고와 모의 Webhook을 사용한다. 별도의 실제 테스트 통과 여부는 21시 Actions와 Slack 수신으로 판정한다.
