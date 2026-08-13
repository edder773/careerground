-- Support calendar range lookups without scanning unrelated job postings.
CREATE INDEX "JobPosting_status_careerScope_deadlineAt_idx"
ON "JobPosting"("status", "careerScope", "deadlineAt");

CREATE INDEX "JobPosting_status_careerScope_publishedAt_idx"
ON "JobPosting"("status", "careerScope", "publishedAt");

CREATE INDEX "JobPosting_status_careerScope_collectedAt_idx"
ON "JobPosting"("status", "careerScope", "collectedAt");

CREATE INDEX "JobPosting_status_careerScope_rolling_idx"
ON "JobPosting"("status", "careerScope", "rolling");

-- Keep nested learning content ordered as the library grows.
CREATE INDEX "Flashcard_unitId_createdAt_idx" ON "Flashcard"("unitId", "createdAt");

CREATE INDEX "LearningQuestion_unitId_createdAt_idx"
ON "LearningQuestion"("unitId", "createdAt");
