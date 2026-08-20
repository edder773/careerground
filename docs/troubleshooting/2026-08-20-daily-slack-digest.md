---
title: 매일 Slack 코딩·채용 요약 자동화
date: 2026-08-20
tags: [slack, github-actions, sites, security]
generatedByAI: false
---

# 매일 Slack 코딩·채용 요약 자동화

## 문제와 기준선

기존 Slack 테스트는 대화형 연결을 통한 수동 전송이었다. 메시지는 요청자의 계정 이름으로 표시됐고, 개인 Mac과 무관하게 매일 실행되는 배포 코드·예약 workflow·서비스 인증 경계가 없었다. 운영 공통 API는 Google 사용자 세션을 요구하므로 GitHub Actions가 사용자 계정을 흉내 내는 방식도 적합하지 않았다.

변경 전 `deployment/sites/d1-api.test.ts` 기준 회귀 테스트 37개는 통과했지만, Slack 자동화 동작을 검증하는 테스트는 0개였다. 전송 자체의 운영 소요시간이나 전달 지연 baseline은 수집하지 않았으므로 성능 개선율은 **정량 측정 불가**다.

## 핵심 이론

사람의 OAuth 세션과 서비스 간 인증은 수명과 권한 경계가 다르다. 자동화가 Google ID token을 저장해 재사용하면 만료·사용자 폐기·과도한 권한 문제가 생긴다. 따라서 읽기 범위가 고정된 전용 endpoint를 만들고, 별도 Bearer token으로 GitHub Actions 한 곳만 인증했다. 설정 누락 시 공개하는 대신 `503`으로 닫히는 fail-closed 정책을 사용한다.

신규 공고의 기준은 최종 수집 시각 `collected_at`이 아니라 최초 등록 시각 `created_at`이다. upsert가 기존 공고를 재확인할 때 최종 수집 시각을 갱신하므로 이를 신규 기준으로 사용하면 같은 공고가 반복 알림된다.

## 변경 전후

| 항목           | 변경 전          | 변경 후                                         |
| -------------- | ---------------- | ----------------------------------------------- |
| 실행 주체      | 대화형 수동 전송 | GitHub Actions                                  |
| 실행 시각      | 예약 없음        | 매일 07:00 Asia/Seoul                           |
| 발신자         | 연결 사용자      | Slack 앱 `채용공고알리미`                       |
| API 인증       | 자동화 경로 없음 | 전용 Bearer token, 누락 시 503·불일치 시 401    |
| 채용 신규 기준 | 수동 선택        | 당일 `created_at`, 비상시·마감일 명시·신입 범위 |
| 신규 공고 0개  | 수동 편집        | 채용 섹션 자동 생략                             |
| 메시지 길이    | 보장 없음        | 3,800자 이하 분할, 전체 공고 보존 테스트        |

핵심 조회는 다음 조건을 한 번의 D1 쿼리로 제한한다.

```sql
WHERE status = 'ACTIVE'
  AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
  AND rolling = 0
  AND deadline_at IS NOT NULL
  AND created_at >= ?
  AND created_at < ?
```

## 검증 결과

- 변경 전 endpoint 테스트: 37/37 통과
- 변경 후 대상 테스트: 41/41 통과 (`d1-api`와 Slack formatter/sender)
- 전체 unit·component·runtime 테스트: 136/136 통과
- Playwright E2E: Chromium·모바일 Chromium·Firefox·WebKit에서 56/56 통과
- lint, typecheck, production build, Sites build 통과
- docs build에는 기존 500 kB 초과 chunk 경고가 있으나 종료 코드는 성공이며 이번 Slack 경로와 무관하다.

회귀 테스트는 잘못된 token, Sites token 미설정, 정상 응답, 상시채용 제외, 코딩 문제 원문 링크, 공고 0개 섹션 생략, 장문 메시지 분할과 마지막 공고 보존을 고정한다.

## 보안 대응

초기 설정 화면에 보였던 webhook URL은 자격증명이므로 재사용하지 않고 폐기·재발급 대상으로 처리했다. 문서와 테스트에는 secret 이름만 남겼으며 원문, 일부 문자열, 화면 캡처를 증거로 보존하지 않았다. 운영 절차는 [Slack 일일 요약 운영](../operations/slack-daily-digest.md)에 정리했다.
