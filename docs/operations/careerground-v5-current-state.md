# CareerGround 채용 자동화 현재 계약

평일 18:00 KST에는 기존 Chat 예약 5개가 공고 원본을 Drive에 수집한다. HQ는 약 2시간 뒤 원본을 동결하고 실제 Chat R1/R2/R3에 같은 manifest를 전달한다. 세 검증에서 모두 `PASS`인 후보만 [`job-alert-ready-contract.md`](./job-alert-ready-contract.md)의 최소 알림 형식과 운영 schema 5.1 파티션 3개로 변환한다. `HOLD/REJECT`는 DB와 Slack에 보내지 않는다.

운영 인입은 기존 `careerground-v5-handoff.yml`의 Git blob + schema 2.0 Issue 경로 하나다. 세 포인터는 같은 날짜·attempt·bundleId를 가져야 하고, blob 내용도 bundleId와 일치해야 한다. 기존 `jobs` 행은 삭제하거나 수정하지 않는다. `job_alert_candidates` view가 과거 행과 신규 행의 알림 필드를 같은 모양으로 투영한다. Slack은 평일 08:00 KST를 목표로 하며, 최신 채용 import가 COMMITTED인 경우에만 기존 `daily:YYYY-MM-DD` claim을 사용한다. 08:30 감시와 게시 완료 이벤트도 같은 claim으로 확인한다.

성공 판단은 세 단계다. 검증 산출물의 `READY`는 인입 가능 상태, 운영 영수증의 `PUBLISHED/ALREADY_PUBLISHED`는 DB 반영 상태, Slack의 `sent/already-sent`는 실제 발송 상태다. 하나의 결과를 다른 결과로 대체하지 않는다. 후보 0건은 `NO_ELIGIBLE_JOBS`로 기록하며 이전 공고를 끌어오지 않는다. 주말·대한민국 공휴일에는 채용 검증·게시·발송을 차단한다. `CLAIMED/UNCERTAIN/SENT` 발송 기록은 자동 초기화하거나 재전송하지 않는다.
