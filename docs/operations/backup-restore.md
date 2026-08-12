# 백업과 복구

## 백업

```bash
pg_dump --format=custom --no-owner --file=careerground-$(date +%F).dump "$DATABASE_URL"
```

업로드 storage는 DB와 같은 시점의 versioned snapshot을 별도 보관한다. dump와 storage snapshot에는 민감 데이터가 있으므로 암호화하고 접근 로그를 남긴다. 보관 기간과 삭제 요청 반영 정책을 운영 전에 결정한다.

## 복구 훈련

새 빈 DB에만 복구한다.

```bash
createdb careerground_restore_test
pg_restore --clean --if-exists --no-owner --dbname=careerground_restore_test ./careerground-YYYY-MM-DD.dump
DATABASE_URL=postgresql://.../careerground_restore_test pnpm db:deploy
```

`health/ready`, 사용자/공고/학습/풀이 count, 최신 migration, checksum을 확인한다. 복구 검증에 운영 이메일이나 사용자 코드를 로그/스크린샷으로 남기지 않는다.
