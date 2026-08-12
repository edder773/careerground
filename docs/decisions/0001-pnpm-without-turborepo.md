# ADR 0001: pnpm 재귀 실행을 사용한다

- 상태: Accepted
- 날짜: 2026-08-12

초기 3개 앱과 4개 패키지는 pnpm workspace filter/recursive 명령으로 충분하다. 별도 task graph와 cache 인프라는 운영 복잡도를 늘리므로 실제 build 병목 측정 전에는 Turborepo를 도입하지 않는다. lockfile과 `workspace:*`가 단일 버전 경계를 유지한다.
