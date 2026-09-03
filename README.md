# CareerGround

신입 IT 채용 일정과 코딩 문제를 누구나 바로 둘러보는 공개 커리어 워크스페이스다. 첫 화면은 월별 대형 채용 달력이며 목록 보기, 회사명 검색, 복수 필터, 공고 즐겨찾기를 함께 제공한다. 코딩테스트는 오늘의 추천·전체 문제·즐겨찾기와 프로그래머스 원문 링크만 제공하고, 자격증 메뉴는 배움집으로 연결한다. 외부 사이트를 런타임에 크롤링하지 않고 검증된 JSON을 순방향 migration으로 반영한다.

## 기술 스택과 버전

- Node.js 24.19.0 LTS (`.nvmrc`, `.node-version`)
- pnpm 11.21.0 (`packageManager`, `pnpm-lock.yaml`)
- React 19.2.8, Vite 8.2.2, TypeScript 6.0.3
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

로그인과 계정 설정은 제공하지 않는다. 채용·코딩 공통 데이터는 익명으로 조회할 수 있고, 관심 공고와 코딩 문제 즐겨찾기는 현재 브라우저의 `localStorage`에만 저장된다. 따라서 브라우저나 기기를 바꾸면 즐겨찾기가 동기화되지 않는다.

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
pnpm docs:dev
pnpm docs:build
```

## 환경 변수

전체 목록과 안전한 placeholder는 `.env.example`에 있다. 핵심 변수는 다음과 같다.

- `DIGEST_API_TOKEN`: GitHub Actions의 Slack 일일 요약 전용 API 인증 토큰. 운영 Worker와 GitHub secret `CAREERGROUND_DIGEST_TOKEN`에 같은 값을 저장한다.
- `OPENAI_API_KEY`, `OPENAI_TROUBLESHOOTING_MODEL`: 선택형 트러블슈팅 문서 보강에만 사용하며, 없어도 변경 파일·테스트 결과 기반 기록은 생성됨

실제 `.env*`, 업로드 파일, DB 볼륨, API 키는 Git에 포함하지 않는다.

## 데이터 가져오기

관리자 화면 대신 저장소의 catalog 생성기와 검증 테스트를 사용한다. 동일 checksum은 idempotent하게 기존 batch를 반환한다. 경력직 전용 공고는 거절 보고서에 남고 공개 목록에는 들어가지 않는다. 회사 규모가 미분류인 항목은 `NEEDS_REVIEW`가 된다. 검증된 JSON은 새 순방향 D1 migration으로 만들며 운영 데이터 변경은 Sites 배포를 통해서만 적용한다.

- 채용 스키마: `docs/operations/job-import-schema.md`
- ChatGPT Work 수집 프롬프트: `docs/operations/job-collection-work-prompt.md`
- 과거 학습 데이터와 가져오기 문서는 운영 이력 보존을 위해 저장소에 남아 있지만 현재 웹 탐색 경로에서는 제공하지 않는다.

## 오늘의 문제와 cron

오늘의 문제는 첫 공개 조회 또는 Slack digest claim 시 D1에서 idempotent하게 준비된다. Worker scheduled handler는 운영 보조 데이터를 lease로 단일 정리한다. Slack 요약은 GitHub Actions가 `Asia/Seoul` 평일 오전 08:01에 실행하고 국내 공휴일은 발송기에서 건너뛴다.

## 화면 방향

요청 시 제공된 Finder 참고 이미지의 공간 구조만 사용했다. 데스크톱에서는 화면 가장자리에 7–8px 여백을 두고, 좌측 사이드바와 작업 영역을 하나의 둥근 창으로 묶었다. 첫 화면은 월별 채용 일정을 크게 보여주며 URL 상태를 유지하는 달력/목록 전환을 제공한다. 다른 서비스의 플랫폼 고유 asset은 복제하지 않았으며 중립적인 graphite 색과 CareerGround 고유 accent, 자체 컴포넌트로 재해석했다.

- 데스크톱: `docs/assets/troubleshooting/recruitment-calendar-home-2026-09-03/home-calendar-desktop-1440.webp`
- 목록·필터: `docs/assets/troubleshooting/recruitment-calendar-home-2026-09-03/jobs-list-filter-desktop-1440.webp`
- 모바일: `docs/assets/troubleshooting/recruitment-calendar-home-2026-09-03/home-calendar-mobile-375.webp`

## AI 트러블슈팅 자동화

```bash
pnpm evidence:collect --pr 123
pnpm evidence:optimize-images --dir docs/assets/troubleshooting/123
pnpm troubleshoot:generate --manifest docs/evidence/123/manifest.json
pnpm troubleshoot:generate --manifest docs/evidence/123/manifest.json --provider openai
pnpm troubleshoot:validate --file docs/troubleshooting/2026-08-12-pr-123-evidence.md
```

기본 provider는 실제 API를 호출하지 않는 mock이다. OpenAI provider는 공식 Responses API의 strict JSON schema output을 사용하며 evidence manifest 밖의 수치·원인·성공을 주장하지 않도록 prompt와 validator 양쪽에서 제한한다.

운영 장애 사례와 재발 방지 검증은 `docs/troubleshooting/`에 모은다. 최근 jobs v5 게시·Slack 복구 기록은 [Jobs v5 회사 규모 계약 불일치와 Slack 누락 복구](docs/troubleshooting/2026-09-01-jobs-v5-company-size-publish-recovery.md)에서 확인할 수 있다.

## 배포

`pnpm sites:build`는 React production build와 SPA fallback Worker를 `dist`에 만든다. 운영 Sites에서는 `DB` 논리 바인딩으로 전용 D1을 프로비저닝하고 `drizzle/` migration을 적용한다. 카탈로그 조회 API는 공개하고 Slack digest 내부 API만 전용 Bearer token으로 보호한다. 과거 인증 경로는 `ROUTE_RETIRED`로 응답한다. 상세 절차는 `docs/operations/deployment.md`를 따른다.

## 저장소 운영

- 영어 Conventional Commits, commitlint, lint-staged, Husky pre-commit/commit-msg/pre-push가 적용된다. 저장소 커밋 작성자는 `edder773`으로 설정한다.
- branch protection 권장: PR 필수, 1명 review, `CI / validate`, `E2E / browser`, `CodeQL` 필수, force push와 branch delete 금지.
- fork PR에서는 secret을 사용하지 않는다. AI 문서 생성은 같은 저장소에서 merge된 뒤의 신뢰된 workflow에서만 실행한다.
- artifact retention은 일반 검증 14일, troubleshooting evidence 30일이다.

## 알려진 초기 제한

- 인앱·이메일·푸시 알림은 제공하지 않는다. 별도 운영 기능인 Slack 일일 요약만 유지한다.
- 코드 실행과 정답 판정은 제공하지 않는다. 프로그래머스에서 수행한다.
- 채용 검색은 브라우저에 내려받은 검증 카탈로그에서 회사명·공고명 기준으로 수행한다. 별도 검색엔진과 Redis는 없다.
