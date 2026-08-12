-- OpenAI Sites identity is the only interactive sign-in boundary.
DROP TABLE IF EXISTS "SlackOAuthState";
DROP TABLE IF EXISTS "RefreshToken";

DROP INDEX IF EXISTS "User_slackTeamId_slackUserId_key";

ALTER TABLE "User"
  ADD COLUMN "openAiUserId" VARCHAR(255),
  DROP COLUMN "slackTeamId",
  DROP COLUMN "slackUserId";

CREATE UNIQUE INDEX "User_openAiUserId_key" ON "User"("openAiUserId");
