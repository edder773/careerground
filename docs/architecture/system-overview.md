# 시스템 개요

CareerGround는 React 웹, Sites Worker REST API, D1과 정적 문서 사이트로 구성된다. 외부 수집은 애플리케이션 밖에서 이루어지고 ADMIN이 정형 파일을 승인한다.

```mermaid
flowchart LR
  U["ADMIN / MEMBER"] --> W["React Finder형 Web"]
  U -->|"Google Identity Services"| W
  W -->|"same-origin REST"| SW["Sites Worker /api/v1"]
  SW --> D1[("Sites D1")]
  C["ChatGPT Work JSON/CSV"] -->|"preview + approve"| SW
  GA["GitHub Actions 08:01 KST"] -->|"digest claim"| SW
  GA --> SL["Slack Incoming Webhook"]
  G["GitHub Actions"] --> E["Evidence manifest"]
  E --> R["Mock/OpenAI Responses provider"]
  R --> D["Troubleshooting / Blog Markdown"]
  D --> DS["React static docs site"]
```

## 경계

- Worker가 Google ID token의 서명과 issuer·audience·expiry를 검증하고 D1 세션을 발급한다.
- 운영과 로컬 E2E는 같은 Worker/D1 API handler를 사용한다.
- Worker만 D1에 접근하며 브라우저에는 HttpOnly session cookie만 전달한다.
- 채용 사이트와 프로그래머스 페이지를 요청하거나 파싱하는 코드가 없다.
- import 승인은 checksum과 batch report를 남기는 D1 batch다.
- 별도 queue나 Redis 없이 D1 unique index, compare-and-swap, lease와 idempotency key를 사용한다.

## 주요 흐름

```mermaid
sequenceDiagram
  actor Admin
  participant Web
  participant Worker
  participant D1
  Admin->>Web: JSON/CSV 선택
  Web->>Worker: import preview
  Worker->>D1: canonical URL/checksum 조회
  Worker-->>Web: create/update/duplicate/reject/review
  Admin->>Web: 승인
  Web->>Worker: preview token + commit
  Worker->>D1: atomic batch + import result + audit log
  D1-->>Worker: commit
  Worker-->>Web: batch result
```

오늘의 문제는 KST calendar date와 level slot unique constraint를 최종 동시성 방어선으로 사용한다. 같은 날짜와 후보 집합은 같은 문제를 고르며, 후보가 없으면 범위를 몰래 넓히지 않고 명시적 오류를 반환한다.
