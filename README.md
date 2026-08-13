# CareerGround

10명 이하 내부 팀을 위한 학습·신입 IT 채용·코딩 성장 워크스페이스다. 외부 사이트를 크롤링하지 않고 관리자가 검증한 JSON/CSV를 가져오며, 프로그래머스 문제는 원본 링크와 사용자가 작성한 풀이만 저장한다. 브랜드 기본값은 `packages/config`와 `APP_NAME`/`VITE_APP_NAME` 환경 변수로 관리한다.

## 기술 스택과 버전

- Node.js 24.19.0 LTS (`.nvmrc`, `.node-version`)
- pnpm 11.21.0 (`packageManager`, `pnpm-lock.yaml`)
- React 19.2.8, Vite 8.2.1, TypeScript 6.0.3
- NestJS 11.1.29, Prisma 7.9.1, PostgreSQL 17+
- Vitest, Testing Library, Playwright, axe-core

## 빠른 시작

```bash
cp .env.example .env
# DB URL과 운영 secret을 변경한다.
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- 웹: <http://localhost:5173>
- API: <http://localhost:4000/api/v1>
- Swagger: <http://localhost:4000/api/docs>
- OpenAPI JSON: <http://localhost:4000/api/openapi.json>
- 문서 사이트: `pnpm docs:dev` → <http://localhost:5174>

로그인은 OpenAI Sites가 제공하는 OpenAI 계정 한 가지만 사용한다. private Site의 dispatcher가 안정적인 사용자 ID와 검증 이메일을 Worker에 전달하고, Worker는 shared secret을 더해 Nest API로 프록시한다. API는 이 두 경계를 모두 통과한 사용자만 DB 계정에 연결한다. `OPENAI_AUTH_MOCK=true`는 deterministic E2E에서만 허용되며 production에서는 항상 무시된다.

## 필수 명령

```bash
pnpm dev                 # web/api 동시 실행
pnpm build               # contracts/ui/api/web/docs production build
pnpm lint
pnpm typecheck
pnpm test                # unit/component/provider mock
pnpm test:e2e            # PostgreSQL + seed가 필요한 Playwright
pnpm db:migrate
pnpm db:deploy
pnpm db:seed
pnpm db:reset
pnpm jobs:import ./jobs.json           # dry-run
pnpm jobs:import ./jobs.json --commit  # ADMIN으로 transaction 승인
pnpm learning:import ./learning.json
pnpm learning:import ./learning.json --commit
pnpm docs:dev
pnpm docs:build
```

DB를 reset하면 로컬 데이터가 삭제되므로 대상 DB URL을 확인한 뒤 실행한다. 운영에서는 `db:reset`을 사용하지 않고 `db:deploy`만 사용한다.

## 환경 변수

전체 목록과 안전한 placeholder는 `.env.example`에 있다. 핵심 변수는 다음과 같다.

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `WEB_ORIGIN`: CORS 허용 웹 origin 하나
- `SITES_AUTH_SHARED_SECRET`: Sites Worker와 Nest API에 동일하게 주입하는 긴 random secret
- `OPENAI_ADMIN_EMAILS`: OpenAI 로그인 후 ADMIN으로 승격할 이메일 allowlist
- `OPENAI_AUTH_MOCK`: 로컬/E2E 전용 인증 헤더 mock; production에서는 무시
- `MAX_ACTIVE_USERS`: 기본 10
- `INTERNAL_SERVICE_SECRET`: daily challenge ensure endpoint 보호
- `OPENAI_API_KEY`, `OPENAI_TROUBLESHOOTING_MODEL`: 선택형 트러블슈팅 문서 보강에만 사용하며, 없어도 변경 파일·테스트 결과 기반 기록은 생성됨

실제 `.env*`, 업로드 파일, DB 볼륨, API 키는 Git에 포함하지 않는다.

## 데이터 가져오기

관리자 UI와 CLI 모두 preview/dry-run을 먼저 제공한다. 동일 checksum은 idempotent하게 기존 batch를 반환한다. 경력직 전용 공고는 거절 보고서에 남고 사용자 목록에는 들어가지 않는다. 회사 규모가 미분류인 항목은 `NEEDS_REVIEW`가 된다.

- 채용 스키마: `docs/operations/job-import-schema.md`
- ChatGPT Work 수집 프롬프트: `docs/operations/job-collection-work-prompt.md`
- 학습 package 프롬프트: `docs/operations/learning-import-prompt.md`

## 오늘의 문제와 cron

Nest scheduler가 `Asia/Seoul` 오전 07:00에 실행한다. 프로세스 중단을 보완하기 위해 startup, 조회 시 lazy ensure, `POST /api/v1/internal/daily-challenge/ensure`가 같은 idempotent 로직을 사용한다. 배포 scheduler는 `x-internal-secret`에 `INTERNAL_SERVICE_SECRET`을 전달한다.

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

`apps/web/Dockerfile`, `apps/api/Dockerfile`은 multi-stage production image다. API readiness는 `/api/v1/health/ready`, 웹 health는 `/`로 확인한다. 상세 절차는 `docs/operations/deployment.md`를 따른다. 문서 앱은 GitHub Pages workflow가 배포한다.

OpenAI Sites용 `pnpm sites:build`는 같은 React production build와 SPA fallback Worker를 `dist`에 만든다. 운영 Sites에서는 `DB` 논리 바인딩으로 전용 D1을 프로비저닝하고 `drizzle/` 마이그레이션을 적용한다. `/api/v1/*`는 OpenAI 사용자 헤더를 서버에서 확인한 뒤 D1에 사용자별 폴더, 노트, 지원 상태, 학습 진도, 풀이와 댓글을 영속 저장한다. 첫 번째 정상 OpenAI 사용자는 bootstrap 관리자이고 이후 사용자는 기본 `MEMBER`로 등록된다. 별도 Nest/PostgreSQL 운영을 선택하면 `API_ORIGIN`과 동일한 `SITES_AUTH_SHARED_SECRET`을 설정해 기존 프록시 경로를 사용할 수 있다.

## 저장소 운영

- 영어 Conventional Commits, commitlint, lint-staged, Husky pre-commit/commit-msg/pre-push가 적용된다. 저장소 커밋 작성자는 `edder773`으로 설정한다.
- branch protection 권장: PR 필수, 1명 review, `CI / validate`, `E2E / browser`, `CodeQL` 필수, force push와 branch delete 금지.
- fork PR에서는 secret을 사용하지 않는다. AI 문서 생성은 같은 저장소에서 merge된 뒤의 신뢰된 workflow에서만 실행한다.
- artifact retention은 일반 검증 14일, troubleshooting evidence 30일이다.

## 알려진 초기 제한

- 프로덕션 S3 adapter와 실제 학습 AI worker는 환경별 자격증명·인프라가 필요한 feature flag 경계까지 구현되어 있다. 로컬 storage와 구조화 package import는 완전 동작한다.
- 이메일/푸시는 범위 밖이며 모든 알림은 인앱이다.
- 코드 실행과 정답 판정은 제공하지 않는다. 프로그래머스에서 수행한다.
- 검색은 10명 규모를 전제로 PostgreSQL `contains`/index를 사용한다. 별도 검색엔진과 Redis는 없다.
