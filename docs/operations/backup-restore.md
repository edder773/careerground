# D1 백업과 복구

## 원칙

운영 기준 DB는 Sites가 `DB`로 바인딩한 D1이다. PostgreSQL `pg_dump`/`pg_restore` 절차는 사용하지 않는다. export에는 개인 노트·풀이·지원 상태가 포함될 수 있으므로 저장소나 CI artifact에 넣지 않고, 접근이 통제된 암호화 위치에서만 다룬다.

## 배포 전 export

1. Sites/D1 관리 화면 또는 조직이 승인한 D1 관리 도구에서 현재 운영 DB의 SQL export/snapshot을 만든다.
2. 파일 이름에 UTC 생성 시각과 배포 대상 commit SHA를 넣는다.
3. SHA-256과 암호화 저장 위치를 운영 기록에 남기되 원문 데이터는 기록하지 않는다.
4. `scripts/data-integrity/check-d1.mjs`를 export 사본에 실행해 고아 참조와 중복 위반이 모두 0인지 확인한다.
5. 배포 후 같은 집계를 다시 확인한다.

```bash
node scripts/data-integrity/check-d1.mjs /secure-temporary-path/careerground-export.sql
```

## 복구 훈련

운영 DB를 직접 덮어쓰지 않는다.

1. 빈 비운영 D1 database를 만든다.
2. 운영 export를 복원한다.
3. 대상 배포의 `drizzle/*.sql`을 journal 순서대로 적용한다.
4. 무결성 검사, `/api/v1/health/ready`, 테이블별 행 수, import checksum을 비교한다.
5. 비식별 테스트 계정으로 폴더·노트 격리와 공통 카탈로그 조회를 확인한다.
6. 증거에는 건수와 checksum만 남기고 이메일·노트·코드 원문은 남기지 않는다.
7. 훈련 DB와 임시 export는 조직의 보존 정책에 따라 폐기한다.

저장소의 D1 호환 스키마는 다음 명령으로 매 CI 및 배포 전에 격리 복구를 실제 수행한다.

```bash
pnpm recovery:drill
```

이 명령은 전체 migration/seed를 적용한 원본에 비식별 사용자·노트 revision을 추가한 뒤,
Node SQLite backup API로 snapshot을 만들고 다시 별도 DB로 복원한다. 복원 전후 테이블 건수,
민감 원문 대신 SHA-256, `integrity_check`, `foreign_key_check`를 비교하고 임시 파일은 즉시
삭제한다. 최신 2026-08-14 실행은 316 pages/1,294,336 bytes를 3.32 ms에 snapshot하고 3.25 ms에 복원했으며,
RPO mutation 0, FK 위반 0, 건수 차이 0으로 통과했다. 원본 결과는
`docs/evidence/recovery-drill-2026-08-14.json`에 있다. 이 시간은 로컬 합성 측정이며 운영 RTO가
아니다.

현재 설치된 Sites connector는 운영 DB export/restore 작업을 노출하지 않는다. 따라서 운영
개인 데이터를 우회 추출하지 않았으며, 관리면에서 export 기능이 제공될 때 위 절차의 1~7을
운영 snapshot으로 재실행해야 한다. 이 플랫폼 제한을 해제되지 않은 운영 증거로 과장하지 않는다.

## 장애 시 의사결정

- 앱 코드만 문제라면 이전 정상 Sites version을 재배포한다.
- migration 이후 앱/스키마 호환 문제라면 기존 migration을 되돌리지 않고 forward-fix를 배포한다.
- 데이터 손상이 확인되면 쓰기 트래픽을 중지하고 최근 정상 export와 감사 로그를 기준으로 새 D1에 복구한 뒤 연결을 전환한다.

운영 export/restore 실행 결과는 날짜, 수행자, 대상 version, 행 수 차이, 위반 건수, RTO/RPO만 기록한다.
