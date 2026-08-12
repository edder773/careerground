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

- `OPENAI_API_KEY`
- `OPENAI_TROUBLESHOOTING_MODEL`
- `SITES_AUTH_SHARED_SECRET`
- 필요하면 `OPENAI_ADMIN_EMAILS`
- Pages를 쓰는 경우 기본 `GITHUB_TOKEN` 외 추가 secret 불필요
- 실제 배포를 붙일 경우 registry/cloud workload identity 값

production S3 adapter가 배포 환경에 구현되지 않았다면 `STORAGE_DRIVER=local`을 단일 persistent volume에서만 사용하고 horizontal scale을 금지한다.

## OpenAI Sites 프런트엔드

`pnpm sites:build`는 검증된 `apps/web` production 산출물을 Cloudflare Worker-compatible ESM과 함께 패키징한다. Sites runtime의 `API_ORIGIN`은 별도로 배포한 HTTPS Nest API origin을 가리켜야 한다. Worker가 `/api/v1/*`를 same-origin으로 프록시하고 원본 내부 secret 헤더를 덮어쓰므로 브라우저에는 API origin이나 proxy secret이 노출되지 않는다.

`API_ORIGIN`이 없으면 `/auth/me`만 Sites 인증 헤더로 응답하고 데이터 endpoint는 `API_NOT_CONFIGURED`로 실패한다. 이는 성공을 가장하는 demo 모드가 아니다. 완전한 운영 전환에는 managed PostgreSQL, Nest API, 같은 값의 `SITES_AUTH_SHARED_SECRET`, 그리고 Sites `API_ORIGIN`이 모두 필요하다.
