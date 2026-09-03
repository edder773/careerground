# 보안과 개인정보

## 공개 접근과 권한

- interactive 로그인, 계정 설정과 관리자 화면을 제공하지 않는다.
- 채용·코딩 카탈로그는 익명 읽기 전용 API로 제공한다.
- 즐겨찾기는 브라우저 `localStorage`에만 저장하고 Worker나 D1으로 전송하지 않는다.
- 학습·인증·컬렉션·풀이·알림 API와 서버 즐겨찾기는 라우터와 계약에서 제거했다.
- 제거된 경로는 일반 `404 NOT_FOUND`로 응답하고 CSP는 외부 identity script와 frame을 허용하지 않는다.
- Slack digest와 검증된 채용 게시 내부 API만 각각 `DIGEST_API_TOKEN`, `PUBLISH_API_TOKEN`으로 보호한다.

## HTTP/API

- 공개 조회는 읽기 전용 쿼리와 제한된 응답 크기를 사용하고, 운영 쓰기는 배포 migration 및 보호된 Slack 경로로 한정한다.
- 오류 응답은 `code`, `message`, `details`, `requestId` 형식이다.
- 모든 API 응답은 `x-request-id`, `server-timing`, `x-response-time-ms`를 제공하고 구조화 로그에는 경로 template·상태·처리 시간만 남긴다.
- 프로그래머스 URL은 HTTPS host/path allowlist를 확인한다.

## 데이터 최소화

- 프로그래머스 본문·테스트케이스·공식 해설을 저장하지 않는다.
- 채용 원문을 크롤링하지 않으며 자체 짧은 요약과 원본 URL만 import한다.
- 구조화 로그와 evidence에서 인증 헤더와 secret을 제외한다.
- `robots.txt`와 `noindex` meta로 내부 웹 색인을 차단한다.
- 공개 카탈로그에는 개인 식별 정보가 없으며 기기별 즐겨찾기는 서버에 저장하지 않는다.

## 위협과 남은 조치

- 업로드 기반 원문 import 기능을 다시 열 경우 MIME/크기/악성 파일 검사를 별도로 추가해야 한다.
- Sites 플랫폼의 TLS·보안 헤더 정책은 배포 smoke test에서 계속 확인한다.
- GitHub Actions secret은 merge 후 trusted workflow 외에는 전달하지 않는다.
- 정기적으로 `pnpm audit`, CodeQL, secret scan 결과를 검토한다.
