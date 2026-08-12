ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

UPDATE "User"
SET "onboardingCompletedAt" = COALESCE("updatedAt", "createdAt"),
    "preferredLanguage" = CASE
      WHEN "preferredLanguage" = 'typescript' THEN 'javascript'
      ELSE "preferredLanguage"
    END;

ALTER TABLE "User"
ALTER COLUMN "preferredLanguage" SET DEFAULT 'javascript';

UPDATE "Solution"
SET "visibility" = 'MEMBERS'
WHERE "visibility" = 'PRIVATE';

UPDATE "Note"
SET "visibility" = 'PRIVATE'
WHERE "visibility" = 'MEMBERS';
