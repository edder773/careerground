# 배포

1. managed PostgreSQL을 만들고 최소 권한 app role과 migration role을 분리한다.
2. `pnpm db:deploy`를 release job에서 실행한다.
3. `apps/api/Dockerfile`, `apps/web/Dockerfile` image를 immutable tag로 배포한다.
4. API와 Sites Worker 양쪽에 동일한 `SITES_AUTH_SHARED_SECRET`을 주입한다.
5. HTTPS origin 하나를 `WEB_ORIGIN`으로 설정한다.
6. `/api/v1/health/ready`가 통과한 뒤 traffic을 전환한다.
7. 외부 scheduler가 매일 KST 07:05에 internal ensure endpoint를 한 번 더 호출한다.

Rollback은 애플리케이션 image를 이전 tag로 돌리는 방식이 기본이다. destructive migration은 초기 MVP에서 금지한다. migration rollback이 필요하면 전용 forward-fix migration을 만들고 backup restore 여부를 검토한다.

GitHub secrets:

- 선택형 트러블슈팅 문서 보강을 사용할 때만 `OPENAI_API_KEY`, `OPENAI_TROUBLESHOOTING_MODEL`
- `SITES_AUTH_SHARED_SECRET`
- 필요하면 `OPENAI_ADMIN_EMAILS`
- Pages를 쓰는 경우 기본 `GITHUB_TOKEN` 외 추가 secret 불필요
- 실제 배포를 붙일 경우 registry/cloud workload identity 값

## OpenAI Sites 운영 앱

`pnpm sites:build`는 검증된 `apps/web` production 산출물을 Cloudflare Worker-compatible ESM과 함께 패키징한다. `.openai/hosting.json`의 `d1: "DB"`는 Sites가 소유하는 전용 D1을 연결하며, 배포 archive의 `drizzle/` SQL을 버전 순서대로 적용한다. Worker는 브라우저가 전달할 수 없는 OpenAI 사용자 헤더를 서버에서 읽고, 사용자별 데이터 소유권을 모든 D1 쿼리에 적용한다.

첫 번째 정상 OpenAI 사용자는 bootstrap `ADMIN`으로 생성되고 이후 사용자는 `MEMBER`로 생성된다. 추가 관리자는 `OPENAI_ADMIN_EMAILS` allowlist로 승격할 수 있다. D1 readiness는 `/api/v1/health/ready`에서 확인하며 DB 쿼리가 성공해야 200을 반환한다.

Nest/PostgreSQL을 별도 운영하는 대안도 유지한다. 그 경우 Sites에 `API_ORIGIN`을 설정하고 API와 Worker에 같은 `SITES_AUTH_SHARED_SECRET`을 주입한다. `API_ORIGIN`과 D1이 모두 없을 때만 데이터 endpoint가 `API_NOT_CONFIGURED` 503을 반환한다.
