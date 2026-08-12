# ADR 0002: Redis 없이 PostgreSQL로 idempotency를 보장한다

- 상태: Accepted
- 날짜: 2026-08-12

대상은 10명 이하 내부 사용자다. import checksum, processing job idempotency key, 오늘의 문제 KST date unique constraint와 transaction으로 필요한 동시성 제어를 제공한다. 운영 중 queue latency나 lock 경합이 측정되기 전에는 Redis를 추가하지 않는다.
