ALTER TABLE "JobPosting"
ADD COLUMN "applicationStartAt" TIMESTAMP(3);

CREATE INDEX "JobPosting_status_careerScope_applicationStartAt_idx"
ON "JobPosting"("status", "careerScope", "applicationStartAt");
