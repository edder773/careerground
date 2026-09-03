---
title: ChatGPT 예약 수집기의 기준선·파일 실행 의존성 제거
date: 2026-08-28
tags: [chatgpt, scheduled-tasks, jobs, github-actions, reliability]
generatedByAI: false
evidence: docs/evidence/chatgpt-collector-stability-2026-08-28.json
---

# ChatGPT 예약 수집기의 기준선·파일 실행 의존성 제거

## 현상

채용공고 수집 예약 작업 세 개의 최신 실행을 확인한 결과 모두 웹 탐색 전에 입력 게이트에서
중단됐다. 한 작업은 File Library 자료를 열고 Python·파일시스템으로 처리하는 과정의 실행 서비스
오류였고, 두 작업은 전체 기준선 JSON이 잘려 canonical SHA를 계산할 수 없었다. 공고가 실제로
존재하는지와 무관하게 외부 기준선 전체를 먼저 읽어야 해서 수집 단계가 시작되지 못한 구조였다.

## 원인

기존 예약 작업은 서로 다른 책임을 한 실행에 묶었다.

```text
File Library 기준선 전체 읽기
  → 파일 materialize·Python 실행
  → byteLength·SHA-256 계산
  → 웹 후보 수집
  → 5종 artifact 전달
```

대형 기준선이 잘리거나 임시 실행 서비스가 실패하면 첫 단계에서 전체 작업이 멈췄다. 또한 신규
후보가 0건인 정상일도 기준선과 해시를 만들지 못하면 성공으로 종료할 수 없었다. 수집기가 운영
DB 기준선 검증까지 소유한 것이 결합의 핵심이었다.

## 핵심 이론: 발견과 정합성 검증의 장애 영역을 분리한다

웹 수집 단계는 담당 출처에서 현재 지원 가능한 후보와 근거를 만드는 일만 수행한다. 최종 식별자,
정규 URL, fingerprint, 파티션 간 중복 검사는 재현 가능한 Node.js 코드가 GitHub Actions에서 맡는다.
예약 작업은 Git blob SHA만 전달하며 원본 바이트 길이와 SHA-256은 GitHub가 blob을 내려받은 뒤
계산한다.

```text
ChatGPT 예약 작업 3개                 GitHub Actions
웹 조사 → discovery delta blob ──────→ blob 크기·해시 검증
           Issue pointer 3개           스키마·출처·근거 검증
                                       ID·fingerprint 정규화
                                       파티션 간 중복 검사
                                       VERIFIED_DISCOVERY 보관
```

출처 하나의 접근 실패는 해당 `sourceCoverage`에만 기록하고 나머지를 계속한다. 반대로 담당 출처
전부가 접근 불가면 성공으로 위장하지 않고 실패한다. 신규 후보가 없지만 실제 조사가 완료된 경우는
`rowCount=0`인 정상 결과로 처리한다.

## 전후 비교

| 항목                                     | 변경 전 |     변경 후 |
| ---------------------------------------- | ------: | ----------: |
| 예약 작업이 전달해야 하는 artifact       |     5개 |         3개 |
| 예약 작업이 읽어야 하는 기준선 파일      |     1개 |         0개 |
| 예약 작업이 계산해야 하는 해시·크기 필드 |     2개 |         0개 |
| 후보 0건 정상 완료                       |    불가 |        가능 |
| 일부 출처 장애 격리                      |    없음 | 출처별 격리 |

GitHub 수신기는 schema 2.0의 세 파티션만으로 새 경로를 실행했다. 당시에는 schema 1.0의 다섯
artifact 경로도 하위 호환성으로 유지했지만, 2026-09-03 P1 정리에서 실제 운영 이관 완료를 확인한
뒤 제거했다. 회귀 테스트 3개 파일, 21개 테스트가 통과했고
빈 결과, 일부·전체 출처 장애, 담당 출처 위반, deterministic 식별자, 파티션 간 URL 중복, 구 계약
호환을 검증했다. 이 검증 중 운영 DB 변경은 없었고 Slack 메시지도 발송하지 않았다.

전체 unit·integration 검증은 36개 파일, 203개 테스트가 통과했다. Playwright 최초 실행은 macOS
샌드박스가 브라우저 Mach port 등록을 거부해 테스트 본문 전에 34개가 모두 실패했다. 권한을 갖춘
환경의 5-worker 실행에서는 초기 Firefox 요청 두 건이 45초 제한을 넘겼지만, Firefox 단일 worker
재실행은 10/10, 전체 2-worker 재실행은 34/34가 통과했다. format, lint, typecheck와 production
build도 모두 통과했다. docs build의 기존 500 kB 초과 chunk 경고는 남지만 종료 코드는 성공이다.

## 남은 경계

- 다음 평일 18:00 KST 실예약 실행은 이 문서 작성 시점에 아직 발생하지 않았다.
- 연결된 GitHub 앱 정책에 따라 ChatGPT 예약 작업의 외부 동작이 승인 대기 상태가 될 수 있다.
- `VERIFIED_DISCOVERY`는 다음 검증 단계의 입력이며 운영 DB 반영 완료를 뜻하지 않는다.
