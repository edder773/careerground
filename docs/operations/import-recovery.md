# Import 실패와 복구 절차

## 정상 흐름

1. 관리자가 JSON 또는 파일을 preview 한다.
2. 서버가 전체 package를 검증하고 canonical URL/fingerprint 또는 source checksum/version을 계산한다.
3. 서버는 payload checksum, 관리자 ID, 만료 시각, 정확한 검토 payload를 `import_previews`에 저장하고 preview token을 반환한다.
4. commit은 token과 checksum만 받는다. payload를 다시 받지 않는다.
5. 만료·사용됨·관리자 불일치·checksum 불일치는 반영 전에 거부한다.
6. 모든 도메인 행, `import_batches`, preview 소비 표시, 감사 로그를 하나의 D1 `batch`로 반영한다.

같은 checksum이 이미 성공한 경우 기존 batch 결과를 반환한다. 오류 주입 회귀 테스트는 중간 실패 시 도메인 행과 batch가 모두 0건임을 확인한다.

## 실패 대응

- preview 실패: 입력을 수정하고 새 preview를 만든다. 이전 token을 재사용하지 않는다.
- commit 409/410/422: payload를 임의 변경해 재전송하지 말고 새 preview부터 시작한다.
- commit 500 또는 연결 단절: 먼저 `import_batches`에서 kind+checksum을 조회한다. `COMMITTED`면 재실행하지 않고 기존 결과를 사용한다. 행이 없으면 같은 원본으로 새 preview를 만든다.
- 부분 반영 의심: 쓰기를 중단하고 `data-integrity-check.md` 절차로 export를 검사한다. 수동 삭제 전에 감사 로그와 batch checksum을 보존한다.

## Migration 복구

`0004_stale_chronomancer.sql`은 기존 행을 삭제하거나 컬럼을 바꾸지 않는 expand-only migration이다. 적용 실패 시 이전 migration까지의 DB를 계속 사용하고 원인을 수정한 순방향 migration을 추가한다. 적용된 D1 migration을 되돌리기 위해 기존 파일을 편집하거나 destructive rollback을 실행하지 않는다.

운영 D1 export/restore 리허설과 보관 주기 설정은 운영 자격증명 및 조직 정책이 필요한 별도 배포 작업이다.
