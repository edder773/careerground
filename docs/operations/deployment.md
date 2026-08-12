# 배포

1. managed PostgreSQL을 만들고 최소 권한 app role과 migration role을 분리한다.
2. `pnpm db:deploy`를 release job에서 실행한다.
3. `apps/api/Dockerfile`, `apps/web/Dockerfile` image를 immutable tag로 배포한다.
4. API에 secret/env를 주입하고 웹에는 `VITE_API_URL`, `VITE_APP_NAME`만 build-time 주입한다.
5. HTTPS origin 하나를 `WEB_ORIGIN`으로 설정하고 `COOKIE_SECURE=true`를 사용한다.
6. `/api/v1/health/ready`가 통과한 뒤 traffic을 전환한다.
7. 외부 scheduler가 매일 KST 07:05에 internal ensure endpoint를 한 번 더 호출한다.

Rollback은 애플리케이션 image를 이전 tag로 돌리는 방식이 기본이다. destructive migration은 초기 MVP에서 금지한다. migration rollback이 필요하면 전용 forward-fix migration을 만들고 backup restore 여부를 검토한다.

GitHub secrets:

- `OPENAI_API_KEY`
- `OPENAI_TROUBLESHOOTING_MODEL`
- Pages를 쓰는 경우 기본 `GITHUB_TOKEN` 외 추가 secret 불필요
- 실제 배포를 붙일 경우 registry/cloud workload identity 값

production S3 adapter가 배포 환경에 구현되지 않았다면 `STORAGE_DRIVER=local`을 단일 persistent volume에서만 사용하고 horizontal scale을 금지한다.
