-- CareerGround uses Slack OpenID Connect as its only interactive sign-in method.
DROP TABLE IF EXISTS "Invite";

ALTER TABLE "User"
  DROP COLUMN "passwordHash",
  ADD COLUMN "slackTeamId" VARCHAR(40),
  ADD COLUMN "slackUserId" VARCHAR(40);

CREATE UNIQUE INDEX "User_slackTeamId_slackUserId_key"
  ON "User"("slackTeamId", "slackUserId");

CREATE TABLE "SlackOAuthState" (
  "id" UUID NOT NULL,
  "stateHash" CHAR(64) NOT NULL,
  "nonce" VARCHAR(128) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SlackOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SlackOAuthState_stateHash_key" ON "SlackOAuthState"("stateHash");
CREATE INDEX "SlackOAuthState_expiresAt_usedAt_idx" ON "SlackOAuthState"("expiresAt", "usedAt");
