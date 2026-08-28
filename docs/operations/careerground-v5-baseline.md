# CareerGround v5 변경 전 기준선

- 기준 커밋: `4810dd9bbc9c43facc346451486552459bf6fc2a`
- 실행 환경: Node `>=24.14.1 <27`, pnpm `11.21.0`
- 실행일: 2026-08-28 Asia/Seoul
- 운영 DB, Slack, 외부 Library 변경: 없음

## 재현 명령과 결과

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm sites:build
```

모두 exit code 0이었다. `pnpm test`는 contracts 10개, web 23개, root scripts/deployment 105개로 총 138개 테스트가 통과했다. 이 집계는 명령 출력에서 확인한 값이며 추정치가 아니다. 기존 실패는 없었다. `pnpm sites:build`는 web build와 Sites worker bundle을 생성했다.

포함된 기준선 범위는 `scripts/daily-job-refresh-policy.test.ts`, library/validator migration 생성기 테스트, runtime schema 테스트, `scripts/slack`의 digest·공휴일·메시지 테스트다.

비교 원칙: v5 변경 후에도 동일한 네 명령을 다시 실행하고, v5 전용 테스트·dry-run·workflow 정적 검증을 추가한다.
