-- Support the job list's most frequent active-status sort and filter paths.
CREATE INDEX "JobPosting_status_createdAt_idx" ON "JobPosting"("status", "createdAt");

CREATE INDEX "JobPosting_status_category_createdAt_idx" ON "JobPosting"("status", "category", "createdAt");
