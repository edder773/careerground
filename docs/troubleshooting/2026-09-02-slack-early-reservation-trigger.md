---
title: Slack 예약 이벤트 누락과 선점형 실행 슬롯
date: 2026-09-02
tags: [slack, github-actions, scheduling, reliability]
generatedByAI: false
---

# Slack 예약 이벤트 누락과 선점형 실행 슬롯

## 현상

2026-09-02 09:04 KST까지 `Daily CareerGround Slack digest`의 08:01, 08:11, 08:21,
08:31, 08:41, 08:51 예약 실행이 한 건도 생성되지 않았다. 전날 채용 import는
22:06:57 KST에 `COMMITTED` 상태였으므로 데이터 준비 지연이 원인은 아니었다.

GitHub는 Actions의 `schedule` 이벤트가 높은 부하에서 지연될 수 있고 일부 대기 작업이
삭제될 수 있음을 공식 문서에 명시한다. 기존 구조의 일곱 예약과 SLO 완료·DB 게시 이벤트는
모두 GitHub Actions라는 같은 예약 실패 영역을 공유했기 때문에, 여러 fallback을 두어도
예약 이벤트 자체가 만들어지지 않은 날에는 실행할 주체가 없었다.

## 즉시 복구

운영용 `workflow_dispatch`를 `force=true`, `dry_run=false`로 한 번 실행했다. 실행
`33574047476`은 09:08:20 KST에 성공했고, 운영 D1의 `daily:2026-09-02` 전송 원장이
`SENT`로 바뀌었다. 전송 항목 원장에는 신규 채용공고 10건이 기록되었다. 같은 날짜 키를
다시 실행하면 기존 영속 원장이 중복 전송을 차단한다.

## 개선 전후

| 항목               | 변경 전               | 변경 후                      |
| ------------------ | --------------------- | ---------------------------- |
| 최초 실행 요청     | 08:01 KST             | 07:45 KST                    |
| 예비 실행 요청     | 08:11 이후            | 07:55 KST                    |
| 목표 전송 시각     | 예약 시작 시각에 종속 | 선점 runner가 08:01까지 대기 |
| 예약 대기 안전장치 | 없음                  | 최대 20분, 초과 시 실패      |
| 중복 차단          | D1 일일 전송 원장     | 동일하게 유지                |
| 기존 fallback      | 08:01~09:17           | 동일하게 유지                |

`hold-until-kst.mjs`는 서울 날짜의 08:01 UTC instant를 계산한다. runner가 일찍
시작하면 남은 시간만 대기하고, GitHub가 08:01 이후 시작시키면 즉시 진행한다. 20분보다
이른 비정상 실행은 장시간 runner 점유 대신 실패시킨다. 07:45·07:55 실행은 분산된
off-peak 시각에 먼저 요청되므로, 08:01에 예약 이벤트를 처음 생성하는 것보다 peak 부하의
영향을 줄인다.

## 검증

- 07:45 KST → 16분 대기
- 07:55 KST → 6분 대기
- 08:01 이후 시작 → 즉시 진행
- 20분 초과 → 안전 실패
- 신규 예약 및 기존 Slack 메시지·영업일·fresh import·전송 원장 회귀 테스트 22개 통과
- 전체 unit/regression 256개, Playwright 34개, production Sites build 및 bundle budget 통과
- 오늘 복구 전송 1회, 운영 전송 원장 `SENT`, 채용 항목 10건

최초 Sites 저장본은 병합 전 만들어 둔 server artifact를 재사용해, 소스 버전은 최신인데
readiness의 build commit은 이전 값으로 남았다. 최종 커밋에서 server bundle을 다시 만들고
`sites:verify-provenance`가 `git HEAD`와 `dist/build-provenance.json`을 대조하도록 추가했다.
앞으로 두 값이 다르면 패키징·배포 전에 실패한다.

세부 근거는
[`docs/evidence/slack-early-reservation-trigger-2026-09-02.json`](../evidence/slack-early-reservation-trigger-2026-09-02.json)에
고정했다.

## 남은 운영 경계

이 변경은 GitHub 예약 부하를 피하도록 개선하지만 GitHub Actions 장애와 완전히 독립된
보장은 아니다. 외부 Cloudflare Cron Trigger 또는 Google Cloud Scheduler를 별도로 두면
실패 영역을 분리할 수 있다. 현재 Sites 설정에는 cron binding이 없고 별도 외부 계정·비밀
구성이 필요하므로, 지원하지 않는 hosting 필드를 임의로 추가하지 않았다. 기존 7개
fallback과 D1 멱등 원장은 계속 최종 안전망 역할을 한다.

## 참고

- [GitHub Actions workflow troubleshooting](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows)
- [복구 실행 33574047476](https://github.com/edder773/careerground/actions/runs/33574047476)
