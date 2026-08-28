# 보안과 개인정보

## 공개 접근과 권한

- interactive 로그인, 계정 설정과 관리자 화면을 제공하지 않는다.
- 채용·학습·코딩·통합 검색 카탈로그는 익명 읽기 전용 API로 제공한다.
- 즐겨찾기는 브라우저 `localStorage`에만 저장하고 Worker나 D1으로 전송하지 않는다.
- 지원 상태·메모, 학습 진도, 개인 폴더처럼 계정이 필요한 기능은 공개 UI/API에서 접근할 수 없다.
- 과거 인증 진입점은 `404 ROUTE_RETIRED`로 고정하며 CSP는 외부 identity script와 frame을 허용하지 않는다.
- Slack digest 내부 API만 별도 `DIGEST_API_TOKEN`으로 보호한다.

## HTTP/API

- 공개 조회는 읽기 전용 쿼리와 제한된 응답 크기를 사용하고, 운영 쓰기는 배포 migration 및 보호된 Slack 경로로 한정한다.
- 오류 응답은 `code`, `message`, `details`, `requestId` 형식이다.
- 모든 API 응답은 `x-request-id`, `server-timing`, `x-response-time-ms`를 제공하고 구조화 로그에는 경로 template·상태·처리 시간만 남긴다.
- 사용자 노트와 학습 Markdown에서 raw HTML을 제거하고 브라우저에서도 안전한 렌더링 경계를 유지한다.
- 프로그래머스 URL은 HTTPS host/path allowlist를 확인한다.
- 파일은 MIME/확장자/크기/SHA-256을 함께 검사한다.

## 데이터 최소화

- 프로그래머스 본문·테스트케이스·공식 해설을 저장하지 않는다.
- 채용 원문을 크롤링하지 않으며 자체 짧은 요약과 원본 URL만 import한다.
- 구조화 로그와 evidence에서 인증 헤더, secret, 사용자 code 전문, 업로드 원문을 제외한다.
- `robots.txt`와 `noindex` meta로 내부 웹 색인을 차단한다.
- 공개 카탈로그에는 개인 식별 정보가 없으며 기기별 즐겨찾기는 서버에 저장하지 않는다.

## 위협과 남은 조치

- 업로드 기반 원문 import 기능을 다시 열 경우 MIME/크기/악성 파일 검사를 별도로 추가해야 한다.
- Sites 플랫폼의 TLS·보안 헤더 정책은 배포 smoke test에서 계속 확인한다.
- GitHub Actions secret은 merge 후 trusted workflow 외에는 전달하지 않는다.
- 정기적으로 `pnpm audit`, CodeQL, secret scan 결과를 검토한다.
