# 보안과 개인정보

## 인증/권한

- Slack OpenID Connect가 유일한 interactive 로그인 방식이다. `openid profile email`만 요청한다.
- authorization code, 10분 만료 one-time state, 브라우저 state cookie, nonce, ID token issuer/audience/JWKS 검증을 모두 통과해야 한다.
- Slack이 검증한 email과 team/user ID를 계정에 연결하고 Slack access token은 저장하지 않는다.
- 15분 access token과 회전 refresh token family를 사용한다.
- token은 `httpOnly`, `sameSite`, 운영 `secure` cookie에만 저장한다.
- refresh token 재사용이 감지되면 family 전체를 revoke한다.
- Nest global guard가 인증과 ADMIN/MEMBER role을 검사한다.
- 활성 사용자 수는 `MAX_ACTIVE_USERS`로 제한한다.

## HTTP/API

- Helmet, 단일 `WEB_ORIGIN` CORS, global input validation, rate limit을 적용한다.
- 오류 응답은 `code`, `message`, `details`, `requestId` 형식이다.
- 댓글·노트·풀이 Markdown에서 raw HTML을 제거하고 브라우저에서도 `rehype-sanitize`를 적용한다.
- 프로그래머스 URL은 HTTPS host/path allowlist를 확인한다.
- 파일은 MIME/확장자/크기/SHA-256을 함께 검사한다.

## 데이터 최소화

- 프로그래머스 본문·테스트케이스·공식 해설을 저장하지 않는다.
- 채용 원문을 크롤링하지 않으며 자체 짧은 요약과 원본 URL만 import한다.
- 구조화 로그와 evidence에서 OAuth code, token, secret, 사용자 code 전문, 업로드 원문을 제외한다.
- `robots.txt`와 `noindex` meta로 내부 웹 색인을 차단한다.
- 개인정보 export와 deletion request 기본 endpoint가 있다.

## 위협과 남은 조치

- 운영 S3 adapter는 bucket private, SSE, 짧은 signed URL, malware scan을 추가해야 한다.
- 운영 reverse proxy에서 TLS, HSTS, request body 상한을 다시 적용한다.
- GitHub Actions secret은 merge 후 trusted workflow 외에는 전달하지 않는다.
- 정기적으로 `pnpm audit`, CodeQL, secret scan 결과를 검토한다.
