# CareerGround v5 수동 전환 체크리스트

현재 상태는 pre-cutover이며 아래 항목은 자동 수행하지 않았다.

1. ChatGPT Work의 CareerGround PARTITION 1·2·3, 검증, DB 갱신, Slack 관련 Scheduled Task를 공식 UI에서 식별한다. 제목만으로 판단하지 말고 prompt, 대상 저장소, 실행 시각을 비교한다.
2. 세 파티션의 출처 소유권과 수집 prompt를 저장소 밖 원본과 대조해 versioned collector/adapter로 이전한다.
3. 기존 DB 갱신 Task를 먼저 일시 중지하고 다음 18:00 실행이 생기지 않는지 확인한다.
4. `daily-slack-digest.yml`은 v5 PUBLISHED 소비가 운영 검증될 때까지 compatibility mode로 유지한다. v5와 동일 데이터 게시를 수행하지 않는다.
5. GitHub production environment와 필요한 Secrets를 최소 권한으로 등록한다.
6. 새 workflow를 DRY_RUN으로 실행하고 세 partition, VERIFIED, 예상 diff, Secret scan을 검증한다.
7. 사용자가 최초 PUBLISH와 schedule 활성화를 명시적으로 승인한다.
8. `.github/workflows/careerground-jobs-v5.yml`에 평일 09:00 UTC(18:00 Asia/Seoul) schedule을 별도 PR로 추가한다. GitHub 지연 가능성은 watchdog이 측정한다.
9. 첫 PUBLISHED 후 jobs/import batch/publication/last-success/saved_jobs 불변을 확인한다.
10. 다음 날 아침 알림이 해당 PUBLISHED만 읽는지 확인한 후 legacy schedule을 rollback-only 또는 disabled로 전환한다.

외부 Scheduled Task 조회·중지, Secret 등록, 운영 DB 게시, schedule 활성화는 `MANUAL_REQUIRED`다. 이 작업에서 채팅, Task, Library 파일을 삭제하지 않았다.
