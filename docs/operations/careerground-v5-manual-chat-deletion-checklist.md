# CareerGround 채팅 수동 삭제 체크리스트

`CHAT_RETIREMENT_STATUS: READY_TO_DELETE`가 되기 전에는 삭제하지 않는다.

1. 기존 Scheduled Task를 prompt와 대상 기준으로 식별하고 일시 중지를 확인한다.
2. 공유 Scheduled Task 링크를 목록화하고 정리한다.
3. 신규 v5 DRY_RUN, 최초 PUBLISHED, last-success, 다음 날 Slack, 재게시 멱등성을 검증한다.
4. 파티션·검증 정책이 저장소에 모두 이전되었고 채팅/Library만의 고유 정보가 0건인지 확인한다.
5. rollback 자료와 마지막 정상 PUBLISHED run 정보를 백업한다.
6. 기존 Scheduled Task를 사용자가 공식 UI에서 삭제한다.
7. 기존 채팅을 먼저 보관하고 안정화 관찰 기간을 둔다.
8. 삭제 대상과 제외 대상을 다시 대조한다.
9. 사용자가 ChatGPT UI에서 최종 삭제한다. Codex 또는 브라우저 자동화로 삭제하지 않는다.
10. Library 중복 파일은 별도 검토 후 정리하고 신규 workflow 정상 동작을 재확인한다.

현재 판정은 `NOT_READY`이며 수동 삭제를 진행하면 안 된다.
