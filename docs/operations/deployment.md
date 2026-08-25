# 운영 배포

## 기준 경로

현재 CareerGround의 유일한 운영 경로는 **OpenAI Sites Worker + D1**이다. Docker, PostgreSQL, `API_ORIGIN`, 공유 인증 secret은 Sites 배포에 사용하지 않는다. Nest/Prisma 앱은 향후 전환 검토를 위한 reference-only 코드이며 운영 트래픽을 받지 않는다.

```mermaid
flowchart LR
  User["Google 로그인 사용자"] --> GIS["Google Identity Services"]
  GIS --> Worker["Sites 정적 자산 + Worker"]
  Worker --> D1["DB binding: D1"]
```

## 배포 전 검증

저장소 루트에서 고정된 Node/pnpm 버전으로 아래 검증을 모두 통과해야 한다.

```bash
pnpm install --frozen-lockfile
pnpm db:d1:generate
git diff --exit-code -- drizzle
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm sites:build
```

E2E는 `deployment/sites/local-d1-server.ts`가 메모리 D1 fixture를 직접 기동한다. PostgreSQL 서비스나 Docker 컨테이너는 필요하지 않다.

## Sites 버전 생성과 배포

1. 배포할 Git commit SHA를 확정한다.
2. `pnpm sites:build`로 Worker-compatible ESM과 웹 자산을 만든다.
3. 빈 임시 디렉터리를 만들고 `pnpm sites:stage <임시 디렉터리>`로 검증된 `dist`만 복사한다.
4. 공식 Sites 패키징 스크립트의 project 인자로 저장소 루트가 아니라 이 임시 디렉터리를 전달해
   archive를 만든다. 저장소 루트를 직접 전달하면 패키저가 전체 `drizzle/` 이력을 overlay하므로
   runtime으로 0015까지 구성된 기존 운영 D1에 과거 migration을 재실행하게 된다.
5. archive 안에 아래 필수 항목이 있는지 확인한다.
   - `dist/server/index.js`
   - `dist/.openai/hosting.json`
   - `dist/.openai/drizzle/*.sql`
   - `drizzle-history/`의 이미 적용된 migration은 없음
   - `deployment/sites/migration-authority.ts`에 등록된 `0025` 이후 순방향 migration만 존재
6. **같은 commit SHA와 archive**를 새 Sites version으로 저장한다.
7. visibility를 `public`으로 지정해 운영 배포한다.
8. 배포 상태가 완료될 때까지 확인하고 `/api/v1/health/ready`가 `200`, `database: d1`을 반환하는지 검사한다.
9. 로그인 사용자로 홈·채용·코딩·학습의 공통 데이터와 폴더의 사용자별 격리를 smoke test한다.

소스 commit만 저장하고 archive를 생략하면 플랫폼이 모노레포의 일반 `build`를 다시 선택하여 Worker와 migration을 누락할 수 있다. 따라서 소스와 archive의 SHA 일치와 archive migration 목록 검사는 배포 불변식이다. 새 Sites 프로젝트는 기존 runtime baseline이 없으므로 이 0025 이후 staging 규칙 대신 0000부터 전체 migration을 적용하는 별도 bootstrap이 필요하다.

## 설정과 비밀

- `.openai/hosting.json`의 `d1: "DB"`가 운영 데이터 바인딩이다.
- `GOOGLE_CLIENT_ID`는 Google 웹 OAuth 클라이언트 ID다. 브라우저와 Worker가 같은 값을 사용한다.
- `ADMIN_EMAILS`는 검증된 Google 이메일의 명시적 관리자 allowlist다. 최초 가입자를 자동 관리자로 승격하지 않는다.
- `AUTH_TEST_MODE`는 로컬 D1 회귀 테스트 전용이며 운영 환경에 설정하지 않는다.
- `RATE_LIMIT_READS_PER_MINUTE`, `RATE_LIMIT_WRITES_PER_MINUTE`는 선택 설정이며 기본값은 각각 240/60이다.
- `MAX_ACTIVE_USERS`는 활성 사용자 상한이다.
- `DIGEST_API_TOKEN`은 GitHub Actions가 `/api/v1/internal/slack-digest`를 호출할 때 사용하는 전용 Bearer token이다. GitHub 저장소 secret `CAREERGROUND_DIGEST_TOKEN`과 같은 값을 사용하며 로그나 문서에 원문을 남기지 않는다.
- `OPENAI_API_KEY`는 앱 런타임과 트러블슈팅 기록에 필수가 아니다. 선택적 AI 문서 재작성 workflow에서만 사용한다.

## migration과 rollback

D1 migration은 기존 파일을 수정하지 않고 새 순방향 SQL만 `drizzle/`에 추가한다. 운영 적용이 끝난 과거 SQL은 `drizzle-history/`에 보존하며 배포 archive에는 포함하지 않는다. 운영 archive의 유일한 순서·포함 권위는 `deployment/sites/migration-authority.ts`다. 새 SQL을 추가할 때 이 목록과 최신 expected version/checksum을 함께 갱신해야 하며, build와 staging은 누락되거나 목록에 없는 SQL을 거부한다. `db/schema.ts`와 Prisma schema는 운영 migration을 실행하는 권위가 아니라 타입·reference 용도다.

배포 전 export를 확보하고, migration 이후 원장 version/checksum, canonical job key 중복, Slack delivery 상태, 공통·개인 데이터 집계를 비교한다. 애플리케이션 rollback은 이전 정상 Sites version을 다시 배포하되, 이미 적용된 스키마는 되돌리지 않고 호환 가능한 forward-fix migration을 만든다. 상세 절차는 `docs/operations/backup-restore.md`를 따른다.
