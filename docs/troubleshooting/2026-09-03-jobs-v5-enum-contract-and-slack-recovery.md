# Jobs v5 enum 계약 불일치와 Slack 복구

## 장애 요약

- 영향 기간: 2026-09-02 18:08 KST부터 2026-09-03 09:12 KST까지
- 영향: 9월 2일 수집 파티션 37건이 운영 D1에 게시되지 않아 9월 3일 아침 Slack 알림에 신규 공고가 없었음
- 직접 원인: 수집 산출물이 허용되지 않은 enum을 포함했지만 자체 상태를 `SUCCESS`로 기록함
- 차단 지점: `scripts/jobs-v5/discovery-delta.mjs`의 GitHub handoff 검증

## 핵심 이론

외부 수집 작업의 성공과 운영 게시 성공은 서로 다른 상태다. 수집기가 JSON을 생성하고 Git blob·Issue를 만들었더라도, 저장소가 소유한 canonical 계약을 통과하고 운영 D1 publish 원장이 커밋되기 전에는 운영 데이터가 아니다.

운영 게시가 원자적인 이유는 부분 반영으로 파티션 간 중복과 식별자 충돌이 발생하는 것을 막기 위해서다. 따라서 알려진 동의어는 경계에서 canonical 값으로 정규화하고, 정말 알 수 없는 값만 전체 오류로 차단해야 한다.

## 원인 분석

9월 2일 attempt 1은 세 파티션을 모두 수신했지만 다음 값에서 중단됐다.

```json
{
  "companyName": "한국항공우주연구원",
  "companySize": "PUBLIC_RESEARCH_INSTITUTE",
  "careerScope": "NEW_GRAD_ELIGIBLE"
}
```

당시 허용된 `companySize`는 `LARGE`, `PUBLIC`, `MID`, `SMALL`, `STARTUP`, `FOREIGN`, `UNCLASSIFIED`뿐이었다. 같은 번들의 다른 파티션에는 `companySize: "미상"`과 `careerScope: "신입(공개경쟁)"`도 있었다. 기존 복구는 일부 중견기업 별칭만 추가했기 때문에 새로운 동의 표현에 다시 실패했다.

실패 전 검증기는 첫 enum 오류에서 즉시 종료했다. 이 때문에 첫 값을 고친 뒤에야 다음 오류를 발견할 수 있는 구조였고, GitHub 실행 실패를 별도 운영 Incident로 승격하지 않아 발견도 늦었다.

## 복구 전후 수치

| 항목                   | 복구 전 |     복구 후 |
| ---------------------- | ------: | ----------: |
| 운영 `jobs` 행         |     237 |         253 |
| 입력 파티션 행         |      37 |          37 |
| 기존·동일 캠페인 제외  |  미실행 |          21 |
| 신규 ACTIVE 삽입       |       0 |          16 |
| 운영 publish 상태      |    없음 | `PUBLISHED` |
| 9월 3일 Slack delivery |    없음 |      `SENT` |
| Slack 신규 공고 항목   |       0 |          16 |

복구 run은 `CG-2026-09-02-A2-discovery`이며 운영 API가 기존 URL, canonical key, fingerprint, 회사·기간·역할 기반 동일 캠페인을 다시 비교했다. 삭제나 기존 행 덮어쓰기는 없었다.

## 재발 방지

1. 공공 연구기관, 대·중견·중소기업 동의어와 미상 표현을 canonical `companySize`로 정규화한다.
2. 괄호가 포함된 신입 공개경쟁 표현을 `NEW_GRAD_ONLY`로 정규화한다.
3. `employmentType`도 허용 enum을 명시적으로 검증하며 운영 publish endpoint에서 한 번 더 검사한다.
4. 세 파티션의 모든 enum 위반을 먼저 모아 한 번의 오류 응답에 partition, item index, field, 원본 값을 기록한다.
5. 검증 또는 publish 실패 시 `[운영 경보] CareerGround v5 handoff 실패` Incident를 자동 생성하거나 기존 Incident에 실행 링크를 추가한다.
6. 수집 프롬프트에 실제 장애에서 관찰한 별칭과 전수검사 절차를 명시한다.

## 검증 증거

- 실패 run: <https://github.com/edder773/careerground/actions/runs/33612413920>
- 복구 publish run: <https://github.com/edder773/careerground/actions/runs/33698455756>
- Slack 전송 run: <https://github.com/edder773/careerground/actions/runs/33698491991>
- 운영 publish 결과: `inserted=16`, `skippedExisting=21`
- Slack 결과: delivery `daily:2026-09-03`, attempt 1, status `SENT`
