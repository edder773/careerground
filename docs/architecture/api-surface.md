# 운영 API 표면

CareerGround Worker는 아래 경로만 제공한다. 이 문서는 새 API를 추가할 때 함께 갱신하는 허용 목록이다.

## 공개 읽기 API

| Method | Path                                     | 용도                         |
| ------ | ---------------------------------------- | ---------------------------- |
| `GET`  | `/api/v1/health/live`                    | D1 연결 확인                 |
| `GET`  | `/api/v1/health`, `/api/v1/health/ready` | schema·채용·코딩 canary 확인 |
| `GET`  | `/api/v1/jobs`                           | 채용 목록·달력 조회          |
| `GET`  | `/api/v1/jobs/categories`                | 채용 필터 분류 조회          |
| `GET`  | `/api/v1/jobs/bootstrap`                 | 목록과 필터 분류 동시 조회   |
| `GET`  | `/api/v1/jobs/:id`                       | 채용 상세 조회               |
| `GET`  | `/api/v1/coding/problems`                | 코딩 문제 목록 조회          |
| `GET`  | `/api/v1/coding/problems/:id`            | 코딩 문제 상세 조회          |
| `GET`  | `/api/v1/coding/daily-challenge`         | 오늘의 기본 문제 조회        |
| `GET`  | `/api/v1/coding/daily-challenges`        | 오늘의 문제 슬롯 전체 조회   |

## 보호된 운영 API

| Method | Path                                     | 보호 수단           |
| ------ | ---------------------------------------- | ------------------- |
| `GET`  | `/api/v1/internal/slack-digest`          | `DIGEST_API_TOKEN`  |
| `POST` | `/api/v1/internal/slack-digest/claim`    | `DIGEST_API_TOKEN`  |
| `POST` | `/api/v1/internal/slack-digest/complete` | `DIGEST_API_TOKEN`  |
| `POST` | `/api/v1/internal/slack-digest/fail`     | `DIGEST_API_TOKEN`  |
| `POST` | `/api/v1/internal/jobs-v5/publish`       | `PUBLISH_API_TOKEN` |

## 제거 경계

학습, 인증·세션, 컬렉션·폴더, 풀이·댓글·랭킹, 사용자 알림, 서버 즐겨찾기, 관리자 import와 통합 검색 API는 제공하지 않는다. 과거 경로에는 호환용 handler나 별도 폐기 응답을 두지 않고 다른 미등록 경로와 동일한 `404 NOT_FOUND`를 반환한다.

`deployment/sites/d1-module-boundaries.test.ts`는 삭제된 구현 모듈이 다시 생기지 않는지 확인하고, `deployment/sites/d1-api.test.ts`와 운영 SLO는 대표 레거시 경로가 일반 404인지 확인한다.
