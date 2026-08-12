# 데이터 모델

전체 정의는 `apps/api/prisma/schema.prisma`, migration은 `apps/api/prisma/migrations`가 단일 진실 공급원이다.

```mermaid
erDiagram
  User ||--o{ RefreshToken : owns
  User ||--o{ Collection : owns
  Collection ||--o{ CollectionItem : contains
  User ||--o{ Solution : writes
  CodingProblem ||--o{ Solution : has
  Solution ||--o{ SolutionRevision : revisions
  Solution ||--o{ SolutionComment : comments
  CodingProblem ||--o{ DailyChallenge : selected
  DailyChallenge ||--o{ DailyChallengeParticipation : records
  Company ||--o{ JobPosting : publishes
  JobPosting ||--o{ SavedJob : tracked
  LearningSource ||--o{ LearningSourceVersion : versions
  LearningSource ||--o{ LearningUnit : units
  LearningUnit ||--o{ LearningProgress : learned
  User ||--o{ Notification : receives
  User ||--o{ AuditLog : acts
```

주요 식별자는 UUID다. 시간은 UTC timestamp로 저장하며 `DailyChallenge.kstDate`만 KST calendar date 의미를 갖는 PostgreSQL `date`다. soft delete가 필요한 사용자 소유 콘텐츠에는 `deletedAt`이 있다.

무결성 예:

- `DailyChallenge.kstDate` unique: 하루 한 문제
- `CollectionItem(collectionId,itemType,targetId)` unique: 폴더 안 중복 방지
- `ProblemProgress(userId,problemId)` unique: 사용자별 문제 상태 하나
- `SolutionRevision(solutionId,revision)` unique: revision 순서
- `SavedJob(userId,jobId)` unique: 사용자별 지원 상태 하나
- `JobImportBatch.checksum` unique: 동일 import idempotency
- `LearningSourceVersion.sha256` unique: 동일 파일 중복 감지

폴더 cycle과 2단계 UI 정책, 댓글 한 단계 답글, SOLVED 코드 필수, career-only 거절은 DB constraint만으로 표현하기 어려워 domain service와 unit test로 방어한다.
