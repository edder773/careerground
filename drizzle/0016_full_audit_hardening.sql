CREATE TABLE IF NOT EXISTS `app_schema_migrations` (
  `version` text PRIMARY KEY NOT NULL,
  `checksum` text NOT NULL,
  `applied_at` text NOT NULL
);--> statement-breakpoint
ALTER TABLE `learning_questions` ADD COLUMN `type` text DEFAULT 'SHORT_ANSWER' NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_questions` ADD COLUMN `choices` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `published_at` text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_notifications_user_read_expiry_created`
  ON `notifications` (`user_id`, `read_at`, `expires_at`, `created_at`);--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0016_full_audit_hardening',
  'sha256:6b79a50335a04b72767a29c9d3d2c90203e72147c48eeda90c227e02f666d37f',
  '2026-08-14T06:30:00.000Z'
);--> statement-breakpoint
PRAGMA optimize;
