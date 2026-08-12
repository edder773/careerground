-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'MEMBERS');

-- CreateEnum
CREATE TYPE "CollectionItemType" AS ENUM ('LEARNING_SOURCE', 'LEARNING_UNIT', 'JOB_POSTING', 'CODING_PROBLEM', 'SOLUTION', 'NOTE', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "LearningSourceStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'REQUIRES_MANUAL_PROCESSING', 'FAILED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "CareerScope" AS ENUM ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'CAREER_ONLY');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('LARGE', 'PUBLIC', 'MID', 'SMALL', 'STARTUP', 'FOREIGN', 'UNCLASSIFIED');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('ACTIVE', 'DEADLINE_UNKNOWN', 'EXPIRED', 'REMOVED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'PLANNED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'REJECTED', 'ACCEPTED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('UNTRIED', 'IN_PROGRESS', 'SOLVED', 'RETRY');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('HELPFUL');

-- CreateEnum
CREATE TYPE "CommentReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT', 'REPLY', 'JOB_DEADLINE', 'DAILY_CHALLENGE', 'REVIEW_DUE', 'IMPORT_ERROR', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" VARCHAR(500),
    "githubUsername" VARCHAR(100),
    "preferredLanguage" VARCHAR(40) NOT NULL DEFAULT 'typescript',
    "rankingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "dataDeletionRequested" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByHash" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdById" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "homeViewMode" VARCHAR(20) NOT NULL DEFAULT 'GRID',
    "homeSort" VARCHAR(40) NOT NULL DEFAULT 'UPDATED_DESC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "commentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "deadlineNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reviewNotifications" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "parentId" UUID,
    "name" VARCHAR(80) NOT NULL,
    "icon" VARCHAR(40) NOT NULL DEFAULT 'folder',
    "color" VARCHAR(30) NOT NULL DEFAULT 'amber',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "itemType" "CollectionItemType" NOT NULL,
    "targetId" VARCHAR(500) NOT NULL,
    "label" VARCHAR(240),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "markdown" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "linkedType" VARCHAR(40),
    "linkedId" VARCHAR(100),
    "currentRev" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteRevision" (
    "id" UUID NOT NULL,
    "noteId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "markdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSource" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'MEMBERS',
    "status" "LearningSourceStatus" NOT NULL DEFAULT 'UPLOADED',
    "publishedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LearningSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSourceVersion" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "version" VARCHAR(40) NOT NULL,
    "fileName" VARCHAR(255),
    "mimeType" VARCHAR(120),
    "storageKey" VARCHAR(500),
    "sha256" CHAR(64) NOT NULL,
    "extractionMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSourceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningUnit" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "anchor" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "concepts" TEXT[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "currentRev" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningContentRevision" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "markdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningQuestion" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "choices" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "understanding" INTEGER,
    "lastStudiedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "repetitionCount" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" UUID NOT NULL,
    "sourceVersionId" UUID,
    "kind" VARCHAR(50) NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "errorCode" VARCHAR(80),
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSource" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "homeUrl" VARCHAR(500),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobImportBatch" (
    "id" UUID NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "importVersion" VARCHAR(20) NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "originalCount" INTEGER NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "updatedCount" INTEGER NOT NULL,
    "duplicateCount" INTEGER NOT NULL,
    "rejectedCount" INTEGER NOT NULL,
    "expiredCount" INTEGER NOT NULL,
    "needsReviewCount" INTEGER NOT NULL,
    "report" JSONB NOT NULL,
    "approvedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "normalizedName" VARCHAR(160) NOT NULL,
    "size" "CompanySize" NOT NULL DEFAULT 'UNCLASSIFIED',
    "sizeEvidence" TEXT,
    "evidenceUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAlias" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "alias" VARCHAR(160) NOT NULL,
    "normalizedAlias" VARCHAR(160) NOT NULL,

    CONSTRAINT "CompanyAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "sourcePostingId" VARCHAR(200),
    "sourceUrl" VARCHAR(1000) NOT NULL,
    "canonicalUrl" VARCHAR(1000) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "subcategory" VARCHAR(80),
    "careerScope" "CareerScope" NOT NULL,
    "careerEvidence" TEXT NOT NULL,
    "companySizeEvidence" TEXT,
    "employmentType" VARCHAR(80) NOT NULL,
    "region" VARCHAR(160) NOT NULL,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "techStack" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3),
    "rolling" BOOLEAN NOT NULL DEFAULT false,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "fingerprint" CHAR(64) NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESTED',
    "memo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingProblem" (
    "id" UUID NOT NULL,
    "source" VARCHAR(30) NOT NULL DEFAULT 'PROGRAMMERS',
    "sourceUrl" VARCHAR(1000) NOT NULL,
    "displayTitle" VARCHAR(160) NOT NULL,
    "level" INTEGER NOT NULL,
    "tags" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'UNTRIED',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT NOT NULL DEFAULT '',
    "solvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "allowedLevels" INTEGER[],
    "repeatExclusionDays" INTEGER NOT NULL DEFAULT 60,
    "allowRepeatRelaxation" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallengeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" UUID NOT NULL,
    "kstDate" DATE NOT NULL,
    "problemId" UUID NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "allowedLevels" INTEGER[],
    "repeatWindowDays" INTEGER NOT NULL,
    "selectionSeed" VARCHAR(100) NOT NULL,
    "selectionReason" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeParticipation" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "language" VARCHAR(40) NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeComplexity" VARCHAR(100),
    "spaceComplexity" VARCHAR(100),
    "lessons" TEXT NOT NULL DEFAULT '',
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "visibility" "Visibility" NOT NULL DEFAULT 'MEMBERS',
    "currentRev" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionRevision" (
    "id" UUID NOT NULL,
    "solutionId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionReaction" (
    "id" UUID NOT NULL,
    "solutionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'HELPFUL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionComment" (
    "id" UUID NOT NULL,
    "solutionId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "parentId" UUID,
    "markdown" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReport" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "CommentReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "href" VARCHAR(500),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" VARCHAR(80) NOT NULL,
    "targetType" VARCHAR(80) NOT NULL,
    "targetId" VARCHAR(100),
    "requestId" VARCHAR(100),
    "ipHash" VARCHAR(128),
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_familyId_idx" ON "RefreshToken"("userId", "familyId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX "Invite_email_expiresAt_idx" ON "Invite"("email", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Collection_userId_parentId_position_idx" ON "Collection"("userId", "parentId", "position");

-- CreateIndex
CREATE INDEX "Collection_userId_deletedAt_idx" ON "Collection"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_position_idx" ON "CollectionItem"("collectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionItem_collectionId_itemType_targetId_key" ON "CollectionItem"("collectionId", "itemType", "targetId");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Note_linkedType_linkedId_idx" ON "Note"("linkedType", "linkedId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteRevision_noteId_revision_key" ON "NoteRevision"("noteId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "LearningSourceVersion_sha256_key" ON "LearningSourceVersion"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "LearningSourceVersion_sourceId_version_key" ON "LearningSourceVersion"("sourceId", "version");

-- CreateIndex
CREATE INDEX "LearningUnit_sourceId_position_idx" ON "LearningUnit"("sourceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "LearningUnit_sourceId_anchor_key" ON "LearningUnit"("sourceId", "anchor");

-- CreateIndex
CREATE UNIQUE INDEX "LearningContentRevision_unitId_revision_key" ON "LearningContentRevision"("unitId", "revision");

-- CreateIndex
CREATE INDEX "LearningProgress_userId_nextReviewAt_idx" ON "LearningProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_unitId_key" ON "LearningProgress"("userId", "unitId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_dueAt_completedAt_idx" ON "ReviewSchedule"("userId", "dueAt", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_idempotencyKey_key" ON "ProcessingJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ProcessingJob_status_createdAt_idx" ON "ProcessingJob"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobSource_name_key" ON "JobSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobImportBatch_checksum_key" ON "JobImportBatch"("checksum");

-- CreateIndex
CREATE INDEX "JobImportBatch_createdAt_idx" ON "JobImportBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_normalizedName_key" ON "Company"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAlias_alias_key" ON "CompanyAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAlias_normalizedAlias_key" ON "CompanyAlias"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_canonicalUrl_key" ON "JobPosting"("canonicalUrl");

-- CreateIndex
CREATE INDEX "JobPosting_status_deadlineAt_idx" ON "JobPosting"("status", "deadlineAt");

-- CreateIndex
CREATE INDEX "JobPosting_category_createdAt_idx" ON "JobPosting"("category", "createdAt");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_title_idx" ON "JobPosting"("companyId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceId_sourcePostingId_key" ON "JobPosting"("sourceId", "sourcePostingId");

-- CreateIndex
CREATE INDEX "SavedJob_userId_status_idx" ON "SavedJob"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON "SavedJob"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_sourceUrl_key" ON "CodingProblem"("sourceUrl");

-- CreateIndex
CREATE INDEX "ProblemProgress_userId_status_idx" ON "ProblemProgress"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemProgress_userId_problemId_key" ON "ProblemProgress"("userId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_kstDate_key" ON "DailyChallenge"("kstDate");

-- CreateIndex
CREATE INDEX "DailyChallenge_createdAt_idx" ON "DailyChallenge"("createdAt");

-- CreateIndex
CREATE INDEX "DailyChallengeParticipation_userId_completedAt_idx" ON "DailyChallengeParticipation"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeParticipation_challengeId_userId_key" ON "DailyChallengeParticipation"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "Solution_problemId_visibility_updatedAt_idx" ON "Solution"("problemId", "visibility", "updatedAt");

-- CreateIndex
CREATE INDEX "Solution_authorId_solvedAt_idx" ON "Solution"("authorId", "solvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionRevision_solutionId_revision_key" ON "SolutionRevision"("solutionId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionReaction_solutionId_userId_type_key" ON "SolutionReaction"("solutionId", "userId", "type");

-- CreateIndex
CREATE INDEX "SolutionComment_solutionId_createdAt_idx" ON "SolutionComment"("solutionId", "createdAt");

-- CreateIndex
CREATE INDEX "SolutionComment_parentId_idx" ON "SolutionComment"("parentId");

-- CreateIndex
CREATE INDEX "CommentReport_status_createdAt_idx" ON "CommentReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReport_commentId_reporterId_key" ON "CommentReport"("commentId", "reporterId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteRevision" ADD CONSTRAINT "NoteRevision_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSource" ADD CONSTRAINT "LearningSource_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSourceVersion" ADD CONSTRAINT "LearningSourceVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LearningSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningUnit" ADD CONSTRAINT "LearningUnit_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LearningSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningContentRevision" ADD CONSTRAINT "LearningContentRevision_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LearningUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LearningUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningQuestion" ADD CONSTRAINT "LearningQuestion_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LearningUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LearningUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LearningUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "LearningSourceVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAlias" ADD CONSTRAINT "CompanyAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "JobSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemProgress" ADD CONSTRAINT "ProblemProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemProgress" ADD CONSTRAINT "ProblemProgress_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeParticipation" ADD CONSTRAINT "DailyChallengeParticipation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeParticipation" ADD CONSTRAINT "DailyChallengeParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionRevision" ADD CONSTRAINT "SolutionRevision_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionReaction" ADD CONSTRAINT "SolutionReaction_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionReaction" ADD CONSTRAINT "SolutionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionComment" ADD CONSTRAINT "SolutionComment_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionComment" ADD CONSTRAINT "SolutionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionComment" ADD CONSTRAINT "SolutionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SolutionComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionComment" ADD CONSTRAINT "SolutionComment_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SolutionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
