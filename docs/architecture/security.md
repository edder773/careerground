# 보안과 개인정보

## 인증/권한

- Google Identity Services가 유일한 interactive 로그인 방식이다.
- Worker는 Google JWKS로 ID 토큰 서명을 검증하고 `iss`, `aud`, `exp`, `iat`, `email_verified`, `sub`를 확인한다. Google access token과 client secret은 저장하지 않는다.
- Google `sub`는 `auth_identities`의 불변 provider subject로 저장한다. 이메일만으로 기존 사용자를 자동 연결하지 않는다.
- 브라우저에는 무작위 세션 토큰을 `HttpOnly`, `Secure`, `SameSite=Lax` 쿠키로 전달하고 D1에는 SHA-256 해시만 저장한다.
- health와 Google 로그인 endpoint 외의 API는 세션이 필요하며, 모든 개인 데이터 쿼리를 세션의 내부 사용자 ID로 제한한다.
- 최초 가입자는 항상 `MEMBER`이며 `ADMIN_EMAILS` allowlist만 `ADMIN`이 된다.
- 활성 사용자 수는 `MAX_ACTIVE_USERS`로 제한한다.

## HTTP/API

- 사용자·정규화 경로별 D1 rate limit을 적용한다. 기본값은 읽기 240회/분, 쓰기 60회/분이며 초과 시 `429`와 `Retry-After`를 반환한다.
- 오류 응답은 `code`, `message`, `details`, `requestId` 형식이다.
- 모든 API 응답은 `x-request-id`, `server-timing`, `x-response-time-ms`를 제공하고 구조화 로그에는 경로 template·상태·처리 시간만 남긴다.
- 댓글·노트·풀이 Markdown에서 raw HTML을 제거하고 브라우저에서도 `rehype-sanitize`를 적용한다.
- 프로그래머스 URL은 HTTPS host/path allowlist를 확인한다.
- 파일은 MIME/확장자/크기/SHA-256을 함께 검사한다.

## 데이터 최소화

- 프로그래머스 본문·테스트케이스·공식 해설을 저장하지 않는다.
- 채용 원문을 크롤링하지 않으며 자체 짧은 요약과 원본 URL만 import한다.
- 구조화 로그와 evidence에서 인증 헤더, secret, 사용자 code 전문, 업로드 원문을 제외한다.
- `robots.txt`와 `noindex` meta로 내부 웹 색인을 차단한다.
- 개인 노트·폴더·지원 상태는 소유 사용자 조건을 모든 쿼리에 포함하고, 채용·학습·코딩 카탈로그만 멤버 공통으로 읽는다.

## 위협과 남은 조치

- 업로드 기반 원문 import 기능을 다시 열 경우 MIME/크기/악성 파일 검사를 별도로 추가해야 한다.
- Sites 플랫폼의 TLS·보안 헤더 정책은 배포 smoke test에서 계속 확인한다.
- GitHub Actions secret은 merge 후 trusted workflow 외에는 전달하지 않는다.
- 정기적으로 `pnpm audit`, CodeQL, secret scan 결과를 검토한다.
