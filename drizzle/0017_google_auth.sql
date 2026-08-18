DELETE FROM `audit_logs`;--> statement-breakpoint
DELETE FROM `users`;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_users_site_user_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `site_user_id`;--> statement-breakpoint
CREATE TABLE `auth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_auth_identities_provider" CHECK("auth_identities"."provider" IN ('GOOGLE'))
);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_identities_provider_subject` ON `auth_identities` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `idx_auth_identities_user` ON `auth_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_sessions_token_hash` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_expires` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
	'0017_google_auth',
	'sha256:afec76f25cfd954b51857912fa78d1b29d7daff92497ab095e559e7aa2abaf60',
	'2026-08-18T00:00:00.000Z'
);--> statement-breakpoint
PRAGMA optimize;
