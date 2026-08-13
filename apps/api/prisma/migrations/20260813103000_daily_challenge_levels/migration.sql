ALTER TABLE "DailyChallenge"
ADD COLUMN "levelSlot" INTEGER NOT NULL DEFAULT 1;

UPDATE "DailyChallenge" AS challenge
SET "levelSlot" = CASE WHEN problem.level = 1 THEN 1 ELSE 2 END
FROM "CodingProblem" AS problem
WHERE problem.id = challenge."problemId";

DROP INDEX "DailyChallenge_kstDate_key";

CREATE UNIQUE INDEX "DailyChallenge_kstDate_levelSlot_key"
ON "DailyChallenge"("kstDate", "levelSlot");

ALTER TABLE "DailyChallenge"
ALTER COLUMN "levelSlot" DROP DEFAULT;
