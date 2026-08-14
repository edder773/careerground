# D1 데이터 정합성 점검

점검은 운영 값을 출력하지 않고 테이블 행 수와 위반 건수만 출력한다. export 파일은 저장소 밖의 암호화된 임시 디렉터리에 두고 점검 직후 조직의 보안 절차에 따라 삭제한다.

## 실행

1. Sites/D1 관리 도구에서 읽기 전용 SQL export를 만든다. 운영 자격증명이나 export 파일을 저장소에 넣지 않는다.
2. Node.js 24.19 이상에서 다음을 실행한다.

```powershell
node scripts/data-integrity/check-d1.mjs C:\secure-temp\careerground-export.sql
```

종료 코드 `0`은 모든 검사 통과, `2`는 하나 이상의 위반 발견, `64`는 입력 경로 오류다. 결과 JSON은 보안상 허용된 증거 저장소에 보관한다.

검사는 사용자·공고·문제·풀이·댓글·노트 revision의 고아 참조, 교차 풀이 답글, 교차 사용자 폴더, 잘못된 다형 참조, 중복 공고 URL/fingerprint, 중복 학습 checksum/version, JSON 유효성, 상태 enum, 만료된 미사용 preview를 집계한다.

## 판정과 조치

- 위반이 있으면 import와 migration을 중단하고 export를 보존한다.
- 자동 DELETE/UPDATE를 실행하지 않는다. 대상 유형별로 원인 batch와 감사 로그를 먼저 찾는다.
- 수정 SQL은 동일 export 사본에서 반복 검증하고, 변경 전후 집계와 승인자를 기록한 뒤 유지보수 창에 적용한다.
- 적용 후 다시 export하여 모든 위반이 0인지 확인한다.

이 저장소 작업에서는 운영 D1 자격증명이 제공되지 않아 실제 운영 행 수는 측정하지 않았다. 로컬 migration과 합성 데이터 검증만 수행한다.
