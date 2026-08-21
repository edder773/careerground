CREATE TABLE IF NOT EXISTS `app_schema_migrations` (
	`version` text PRIMARY KEY NOT NULL,
	`checksum` text NOT NULL,
	`applied_at` text NOT NULL
);--> statement-breakpoint
ALTER TABLE `jobs` ADD `published_at` text;--> statement-breakpoint
ALTER TABLE `learning_questions` ADD `type` text DEFAULT 'SHORT_ANSWER' NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_questions` ADD `choices` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_learning_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`prompt` text NOT NULL,
	`answer` text NOT NULL,
	`type` text DEFAULT 'SHORT_ANSWER' NOT NULL,
	`choices` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `learning_units`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_learning_questions_type" CHECK("__new_learning_questions"."type" IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER'))
);
--> statement-breakpoint
INSERT INTO `__new_learning_questions`("id", "unit_id", "prompt", "answer", "type", "choices", "created_at") SELECT "id", "unit_id", "prompt", "answer", "type", "choices", "created_at" FROM `learning_questions`;--> statement-breakpoint
DROP TABLE `learning_questions`;--> statement-breakpoint
ALTER TABLE `__new_learning_questions` RENAME TO `learning_questions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_learning_questions_unit_created` ON `learning_questions` (`unit_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read_expiry_created` ON `notifications` (`user_id`,`read_at`,`expires_at`,`created_at`);--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
	'0016_full_audit_hardening',
	'sha256:69fa089214693f323703a327d853996d67129c136f80b8997cfc79a4a43b797d',
	'2026-08-14T07:16:00.000Z'
);--> statement-breakpoint
PRAGMA optimize;
