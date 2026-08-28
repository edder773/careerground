# ChatGPT Work 감시 프롬프트

작업명: `CG-OPS-WATCHDOG-V5`

평일 18:40 Asia/Seoul에 읽기 전용으로 `CG-JOBS-PROD-V5`의 오늘 target date 실행을 확인한다. 채팅 제목을 식별자로 사용하지 않는다.

오늘자 `workflow_runs`에서 runId, runGroupKey, attempt와 partition 1·2·3, merge, validate, publish 상태를 확인한다. `PUBLISHED` 여부와 `last-success` 갱신 여부, 신규·변경·종료·제외·활성 공고 건수를 보고한다. `FAILED`, `SUCCESS_NO_CHANGES`, `QUARANTINED`, `SKIPPED`를 서로 다른 결과로 표시한다. 동일 runId 장애는 한 번만 알린다.

운영 DB를 변경하거나 migration을 만들거나 PR을 병합하거나 Slack 채용 알림을 발송하지 않는다. 오류 시 runId, 실패 단계, errorCode, 운영 DB 변경 여부, 기존 last-success 유지 여부만 보고한다. 기존 동일 watchdog을 공식 도구로 확인할 수 없으면 새 작업을 만들지 말고 `MANUAL_REQUIRED`로 남긴다.

권장 일정은 평일 18:40이며 신규 workflow schedule과 별개의 감시 역할이다.
