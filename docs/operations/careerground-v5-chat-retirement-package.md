# CareerGround v5 채팅 폐기 판정 패키지

- 판정 시각: 2026-08-28 Asia/Seoul
- 판정 commit: `4810dd9` 이후 v5 작업 브랜치
- 마지막 정상 PUBLISHED runId/target date: v5 운영 게시 전이므로 없음
- 신규 workflow: `CareerGround jobs v5 (pre-cutover)`
- 저장소에서 확인된 Scheduled Task: CareerGround 항목 없음. 외부 ChatGPT Work 목록은 `MANUAL_REQUIRED`.
- 채팅 유형/현재·과거 제목/공유 링크: 저장소 근거 없음. 제목만으로 삭제 대상을 정하지 않는다.
- Library 관련 파일: 2026-08-25, 2026-08-26 legacy final/audit 메타데이터만 확인. 핵심 v5는 명시적 Manifest adapter를 사용한다.
- 백업: 코드·Schema·운영 정책·runbook은 브랜치에 있음. 실제 partition 수집 정책은 아직 외부에 있음.
- 삭제 대상: 현재 없음.
- 보존 대상: 기존 채팅, Scheduled Task, Library 파일 전부(전환 검증 전).

운영 PUBLISH, PUBLISHED 기반 Slack, 재실행 멱등성의 운영 검증과 외부 정책 이전이 끝나지 않았다. Codex는 어떤 채팅이나 Scheduled Task도 삭제하지 않았다.

CHAT_RETIREMENT_STATUS: NOT_READY

MANUAL_CHAT_DELETION_REQUIRED: true
