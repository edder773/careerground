# 채용공고 import schema 1.0

애플리케이션은 채용 사이트를 크롤링하지 않는다. 관리자가 JSON/CSV를 preview한 뒤 승인한다. JSON은 아래 envelope를 사용한다.

```json
{
  "version": "1.0",
  "collectedAt": "2026-08-12T00:00:00.000Z",
  "sourceCount": 10,
  "items": [
    {
      "sourceName": "Example public source",
      "sourceId": "optional-source-id",
      "sourceUrl": "https://example.com/jobs/123",
      "companyName": "Example Company",
      "title": "[DEMO] Backend New Grad",
      "category": "백엔드",
      "careerScope": "NEW_GRAD_ONLY",
      "careerEvidence": "공고의 신입 지원 가능 문구를 자체 요약",
      "companySize": "UNCLASSIFIED",
      "companySizeEvidence": "분류 근거가 없어 관리자 검토 필요",
      "employmentType": "FULL_TIME",
      "region": "서울",
      "remote": false,
      "techStack": ["TypeScript", "PostgreSQL"],
      "publishedAt": "2026-08-10T00:00:00.000Z",
      "deadlineAt": "2026-08-30T14:59:59.000Z",
      "rolling": false,
      "collectedAt": "2026-08-12T00:00:00.000Z",
      "lastVerifiedAt": "2026-08-12T00:00:00.000Z",
      "summary": "원문을 복제하지 않은 짧은 자체 요약",
      "status": "NEEDS_REVIEW"
    }
  ]
}
```

`careerScope`: `NEW_GRAD_ONLY`, `NEW_GRAD_ELIGIBLE`, `CAREER_ONLY`. 마지막 값은 import에서 거절된다.

`companySize`: `LARGE`, `PUBLIC`, `MID`, `SMALL`, `STARTUP`, `FOREIGN`, `UNCLASSIFIED`. 근거가 불충분하면 `UNCLASSIFIED`를 유지한다.

`status`: `ACTIVE`, `DEADLINE_UNKNOWN`, `EXPIRED`, `REMOVED`, `NEEDS_REVIEW`.

## 운영 반영 정책

입력 schema는 조사·검토를 위해 위 상태들을 표현할 수 있지만 운영 `jobs`에 새로 저장하는 상태는
`ACTIVE`뿐이다. 관리자 preview는 기존 URL·fingerprint 중복, 미분류 회사, 비ACTIVE 행의 제외
사유를 보여주며 commit은 다음 규칙을 강제한다.

- `CREATE`로 판정된 신규 `ACTIVE` 행만 `INSERT`한다.
- 동일 `source_url`은 `ON CONFLICT DO NOTHING`으로 처리하고 기존 행을 갱신하지 않는다.
- FULL snapshot에서 누락된 기존 공고도 `REMOVED`로 바꾸거나 삭제하지 않는다.
- 기존 공고의 정정·상태 전환은 이 import endpoint의 책임이 아니다. 별도 `채용 공고 검증기 동기화`만 같은 날짜의 병합 감사 파일에 현재 증거가 있고 `finalRecheckStatus=CONFIRMED`인 허용 필드 변경을 before 값 조건부 UPDATE로 적용할 수 있다. 이 경로도 `jobs` DELETE와 모든 `saved_jobs` 변경을 금지한다.

CSV는 item 필드를 header로 사용한다. `techStack`은 `TypeScript|PostgreSQL`, boolean은 `true`/`false`다. JSON envelope의 `sourceCount`는 CSV sourceName 고유 수로 계산한다.

중복 순서는 canonical URL, source ID, 정규화 회사+제목+마감일 fingerprint다. 유사도 후보는 자동 삭제하지 않는다.
