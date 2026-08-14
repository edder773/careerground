# 접근성 릴리스 체크리스트

## 자동 게이트

배포 후보는 다음 검증을 모두 통과해야 한다.

- Chromium, Firefox, WebKit과 375×812 mobile project의 핵심 E2E
- 로그인·모바일 workspace의 committed pixel baseline 비교
- 주요 화면과 열린 Dialog의 axe critical/serious/moderate 위반 0건
- 1440×900, 1024×768, 768×1024, 375×812, 320×568 reflow screenshot
- 1440px 화면의 200% 확대와 같은 720 CSS px 폭에서 가로 넘침 없음
- 코드 편집기 focus 후 375×500으로 viewport가 줄어도 저장 동작까지 도달 가능
- `prefers-reduced-motion`에서 불필요한 전환 제거

실행 명령은 `pnpm test:e2e`이며 baseline 갱신은 의도한 디자인 변경을 검토한 경우에만
`playwright test e2e/visual.spec.ts --update-snapshots`로 수행한다. snapshot을 실패 테스트에
맞춰 자동 승인하지 않는다.

## 수동 보조기술 게이트

자동 axe는 실제 발화 순서와 가상 커서 경험을 대신하지 않는다. 공개 릴리스마다 다음 항목을
지원 환경에서 확인하고, 운영 이슈 또는 PR에 날짜·브라우저·OS·결과만 기록한다.

| 환경                          | 확인 항목                                                             |
| ----------------------------- | --------------------------------------------------------------------- |
| macOS Safari + VoiceOver      | 랜드마크 이동, Finder형 nav, Dialog 제목/닫기, CodeMirror 이름과 입력 |
| Windows Firefox/Chrome + NVDA | 검색 결과, 달력 grid 화살표 이동, form 오류 발화, 표 header           |
| iOS Safari + VoiceOver        | 하단 nav, 모달 focus trap, 가상 키보드 위 editor 저장 버튼            |
| Android Chrome + TalkBack     | filter checkbox, folder 다중 선택, 알림 상태 변경                     |

현재 개발 호스트에는 NVDA와 iOS/Android 실제 기기가 없으므로 해당 조합을 실행한 것으로
기록하지 않는다. 자동 게이트는 위 위험을 줄이는 회귀 방어선이며, 수동 보조기술 검증을
대체하지 않는다. 수동 실패는 릴리스를 중단하고 재현 경로와 focus/발화 기대값을 남긴다.
