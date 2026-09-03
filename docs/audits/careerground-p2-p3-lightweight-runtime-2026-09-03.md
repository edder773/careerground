# CareerGround P2·P3 경량화 결과

## 범위와 판단 기준

P2는 이미 제거된 제품 기능의 저장 구조와 반복 운영 비용을 줄이고, P3는 화면 품질을 바꾸지
않는 정적 자산·라우트 전달량을 줄인다. 현재 제공 중인 채용 달력·목록·검색·필터·즐겨찾기,
코딩 문제·오늘의 추천, 배움집 외부 링크와 채용 handoff·Slack digest 운영 원장은 유지한다.

## D1 활성 표면 축소

`0039_retire_legacy_product_surface.sql`은 다음 종료 기능의 테이블 27개와 FTS 본체·shadow table,
검색 trigger 15개를 순방향으로 제거한다.

- 로그인과 사용자: `users`, `auth_identities`, `auth_sessions`
- 서버 저장 즐겨찾기·컬렉션: `saved_jobs`, `collections`, `collection_items`
- 풀이·랭킹: `problem_progress`, `daily_challenge_participations`, `solutions`와 하위 기록
- 학습: source/unit/question/flashcard/progress/review/attempt 테이블
- 인앱 알림·관리: `notifications`, `audit_logs`, `request_rate_limits`, `import_previews`
- 종료된 수집 보조: job source snapshot 2개, `scheduler_leases`

삭제 대상은 정확한 allowlist 회귀 테스트로 고정했다. 채용·코딩·일일 추천, import batch,
jobs v5 workflow, Slack 전송 원장 15개 테이블은 보존하며 migration 전후
`PRAGMA foreign_key_check` 결과는 0건이다.

| 항목                    |     수정 전 |   수정 후 |   변화 |
| ----------------------- | ----------: | --------: | -----: |
| 애플리케이션 D1 테이블  |          47 |        15 | -68.1% |
| D1 인덱스               |          75 |        29 | -61.3% |
| D1 검색 trigger         |          15 |         0 |  -100% |
| `db/schema.ts` 줄 수    |         955 |       352 | -63.1% |
| 로컬 DB 파일 크기 추정¹ | 2,121,728 B | 823,296 B | -61.2% |

¹ 동일 fixture에서 제거 migration 후 `VACUUM`한 용량 추정이다. 운영 migration은 D1 호환성과
transaction 안전을 위해 `VACUUM`을 실행하지 않으므로 즉시 물리 용량 감소를 보장하지 않는다.

## CI와 문서 자동화

- PR은 Chromium desktop·375px mobile만 실행하고, main push에서 Chromium·Firefox·WebKit·
  mobile 전체 조합을 실행한다.
- CI worker를 1개에서 2개로 늘렸다. 최근 원격 CI 347초 중 브라우저 설치+E2E가 274초(79%)였던
  병목을 직접 줄이되, 병합 후 교차 브라우저 검증은 유지한다.
- 동일 GitHub `validate` job의 PR 실행 시간은 직전 347초에서 137초로 210초(60.5%) 감소했다.
- 동일 로컬 환경에서 전체 35개 E2E는 1.1분, PR 조합 15개는 27.1초였다. PR 테스트 수는
  57.1%, 관측 실행 시간은 약 59% 감소했다.
- 트러블슈팅 문서 workflow는 같은 저장소에서 병합된 PR이면서 `troubleshooting-doc` 라벨을
  명시한 경우에만 실행한다. API key가 없으면 기존처럼 결정론적 mock 기록을 만든다.

## 정적 전달량

- 1200×630 OG PNG를 픽셀 변화 없이 다시 압축했다. 684,203 B에서 522,097 B로
  162,106 B(23.7%) 감소했고, raw RGB 비교의 변경 channel과 최대 오차는 모두 0이다.
- 채용 화면 전용 CSS를 전역 manifest에서 `JobsPage` lazy chunk로 이동했다. 채용 첫 화면의
  디자인은 유지하고, 코딩·즐겨찾기 직접 진입은 23.08 kB(raw), 5.05 kB(gzip)의 채용 CSS를
  받지 않는다.
- 정적 `index.html` 기준 initial route gzip 합계는 112,978 B에서 108,742 B로
  4,236 B(3.7%) 감소했다. 첫 화면인 채용 route는 lazy chunk를 이어서 받으므로 기능·스타일
  총량은 동일하고, 다른 route 직접 진입에만 분리 효과가 적용된다.

## 회귀 방지와 검증

- Drizzle 생성기 재실행은 `No schema changes`여야 한다.
- runtime schema 검사는 15개 활성 테이블, 필수 인덱스, 최신 migration ledger를 확인한다.
- restore drill과 D1 integrity 검사는 활성 테이블만 대상으로 FK·중복·원장 무결성을 검사한다.
- workflow policy는 제거 테이블 exact allowlist와 활성 테이블 보호를 검증한다.
- repository surface 테스트는 PR 경량 E2E, main 전체 E2E, 문서 opt-in 조건을 고정한다.

전체 format, lint, typecheck, unit/integration, performance, recovery, production build, bundle,
PR 조합 및 전체 다중 브라우저 E2E와 운영 SLO 결과는 변경 PR 본문에 기록한다.
