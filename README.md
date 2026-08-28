# CareerGround

10명 이하 내부 팀을 위한 학습·신입 IT 채용·코딩 성장 워크스페이스다. 외부 사이트를 크롤링하지 않고 관리자가 검증한 JSON/CSV를 가져오며, 코딩테스트는 오늘의 추천·전체 문제·즐겨찾기와 프로그래머스 원문 링크만 제공한다. 브랜드 기본값은 `packages/config`와 `APP_NAME`/`VITE_APP_NAME` 환경 변수로 관리한다.

## 기술 스택과 버전

- Node.js 24.19.0 LTS (`.nvmrc`, `.node-version`)
- pnpm 11.21.0 (`packageManager`, `pnpm-lock.yaml`)
- React 19.2.8, Vite 8.2.1, TypeScript 6.0.3
- 운영: OpenAI Sites Worker + D1
- 데이터 모델·migration: Drizzle ORM 0.45.2, SQLite/D1 순방향 SQL
- Vitest, Testing Library, Playwright, axe-core

## 빠른 시작

```bash
cp .env.example .env
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

- 웹: <http://localhost:5173>
- D1 API: <http://localhost:4000/api/v1>
- 문서 사이트: `pnpm docs:dev` → <http://localhost:5174>

운영 로그인은 Google Identity Services 한 가지만 사용한다. 브라우저가 받은 Google ID 토큰은 Sites Worker가 Google 공개키로 서명과 `iss`, `aud`, `exp`, `email_verified`를 검증한다. 검증 후 D1에 무작위 세션의 SHA-256 해시만 저장하고 브라우저에는 `HttpOnly`, `Secure`, `SameSite=Lax` 쿠키를 발급한다. 채용·학습·코딩 공통 데이터도 로그인한 사용자만 조회할 수 있다. `AUTH_TEST_MODE=true` 인증 우회는 로컬 D1 E2E에서만 주입하며 운영에는 설정하지 않는다.

## 필수 명령

```bash
pnpm dev                 # web + 메모리 D1 API 동시 실행, Docker 불필요
pnpm build               # contracts/ui/web/docs/Sites production build
pnpm lint
pnpm typecheck
pnpm test                # unit/component/provider mock
pnpm test:e2e            # 격리된 메모리 D1 + 공통 seed Playwright
pnpm db:d1:generate      # db/schema.ts 변경으로 D1 migration 생성
pnpm jobs:catalog:refresh <baseline.json> <input.json> <output.sql>
pnpm learning:catalog:generate
pnpm docs:dev
pnpm docs:build
```

## 환경 변수

전체 목록과 안전한 placeholder는 `.env.example`에 있다. 핵심 변수는 다음과 같다.

- `GOOGLE_CLIENT_ID`: Google 웹 OAuth 클라이언트 ID. 운영 Worker에는 코드 기본값과 동일한 값을 선택적으로 명시한다.
- `ADMIN_EMAILS`: Google 로그인 후 ADMIN으로 승격할 이메일 allowlist
- `AUTH_TEST_MODE`: 로컬 D1/E2E 전용 테스트 로그인 endpoint 활성화. 운영에는 설정하지 않는다.
- `MAX_ACTIVE_USERS`: 기본 10
- `DIGEST_API_TOKEN`: GitHub Actions의 Slack 일일 요약 전용 API 인증 토큰. 운영 Worker와 GitHub secret `CAREERGROUND_DIGEST_TOKEN`에 같은 값을 저장한다.
- `OPENAI_API_KEY`, `OPENAI_TROUBLESHOOTING_MODEL`: 선택형 트러블슈팅 문서 보강에만 사용하며, 없어도 변경 파일·테스트 결과 기반 기록은 생성됨

실제 `.env*`, 업로드 파일, DB 볼륨, API 키는 Git에 포함하지 않는다.

## 데이터 가져오기

관리자 UI가 D1 preview/dry-run과 승인 commit을 제공한다. 동일 checksum은 idempotent하게 기존 batch를 반환한다. 경력직 전용 공고는 거절 보고서에 남고 사용자 목록에는 들어가지 않는다. 회사 규모가 미분류인 항목은 `NEEDS_REVIEW`가 된다. 저장소의 catalog 생성기는 검증된 JSON을 새 순방향 D1 migration으로 만들며 운영 데이터 변경은 Sites 배포를 통해서만 적용한다.

- 채용 스키마: `docs/operations/job-import-schema.md`
- ChatGPT Work 수집 프롬프트: `docs/operations/job-collection-work-prompt.md`
- 학습 package 프롬프트: `docs/operations/learning-import-prompt.md`

## 오늘의 문제와 cron

오늘의 문제는 인증된 사용자의 첫 조회 또는 Slack digest claim 시 D1에서 idempotent하게 준비된다. Worker scheduled handler는 만료 세션·rate-limit 데이터를 lease로 단일 정리한다. Slack 요약은 GitHub Actions가 `Asia/Seoul` 평일 오전 08:01에 실행하고 국내 공휴일은 발송기에서 건너뛴다.

## 화면 방향

요청 시 제공된 Finder 참고 이미지의 공간 구조만 사용했다. 데스크톱에서는 화면 가장자리에 7–8px 여백을 두고, 좌측 사이드바와 작업 영역을 하나의 둥근 창으로 묶었다. 플랫폼 고유 asset은 복제하지 않았으며 중립적인 graphite 색과 CareerGround 고유 accent, 자체 컴포넌트로 재해석했다.

- 데스크톱: `docs/assets/mvp/home-desktop-1440.png`
- 태블릿: `docs/assets/mvp/home-tablet-1024.png`
- 모바일: `docs/assets/mvp/home-mobile-375.png`, `docs/assets/mvp/home-mobile-320.png`

## AI 트러블슈팅 자동화

```bash
pnpm evidence:collect --pr 123
pnpm evidence:optimize-images --dir docs/assets/troubleshooting/123
pnpm troubleshoot:generate --manifest docs/evidence/123/manifest.json
pnpm troubleshoot:generate --manifest docs/evidence/123/manifest.json --provider openai
pnpm troubleshoot:validate --file docs/troubleshooting/2026-08-12-pr-123-evidence.md
```

기본 provider는 실제 API를 호출하지 않는 mock이다. OpenAI provider는 공식 Responses API의 strict JSON schema output을 사용하며 evidence manifest 밖의 수치·원인·성공을 주장하지 않도록 prompt와 validator 양쪽에서 제한한다.

## 배포

`pnpm sites:build`는 React production build와 SPA fallback Worker를 `dist`에 만든다. 운영 Sites에서는 `DB` 논리 바인딩으로 전용 D1을 프로비저닝하고 `drizzle/` migration을 적용한다. `/api/v1/auth/google`만 Google ID 토큰을 받아 세션을 만들며, health를 제외한 나머지 `/api/v1/*`는 유효한 D1 세션 쿠키가 있어야 접근할 수 있다. 최초 Google 사용자는 기본 `MEMBER`이고 `ADMIN_EMAILS`에 포함된 검증 이메일만 `ADMIN`이 된다. 상세 절차는 `docs/operations/deployment.md`를 따른다.

## 저장소 운영

- 영어 Conventional Commits, commitlint, lint-staged, Husky pre-commit/commit-msg/pre-push가 적용된다. 저장소 커밋 작성자는 `edder773`으로 설정한다.
- branch protection 권장: PR 필수, 1명 review, `CI / validate`, `E2E / browser`, `CodeQL` 필수, force push와 branch delete 금지.
- fork PR에서는 secret을 사용하지 않는다. AI 문서 생성은 같은 저장소에서 merge된 뒤의 신뢰된 workflow에서만 실행한다.
- artifact retention은 일반 검증 14일, troubleshooting evidence 30일이다.

## 알려진 초기 제한

- 프로덕션 S3 adapter와 실제 학습 AI worker는 환경별 자격증명·인프라가 필요한 feature flag 경계까지 구현되어 있다. 로컬 storage와 구조화 package import는 완전 동작한다.
- 인앱·이메일·푸시 알림은 제공하지 않는다. 별도 운영 기능인 Slack 일일 요약만 유지한다.
- 코드 실행과 정답 판정은 제공하지 않는다. 프로그래머스에서 수행한다.
- 검색은 10명 규모를 전제로 D1 FTS5와 보조 index를 사용한다. 별도 검색엔진과 Redis는 없다.
