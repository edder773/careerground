CREATE TABLE `import_previews` (
	`token` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`checksum` text NOT NULL,
	`payload` text NOT NULL,
	`actor_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_import_previews_actor_kind` ON `import_previews` (`actor_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_import_previews_expiry` ON `import_previews` (`expires_at`);--> statement-breakpoint
ALTER TABLE `import_batches` ADD `status` text DEFAULT 'COMMITTED' NOT NULL;--> statement-breakpoint
ALTER TABLE `import_batches` ADD `result` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `import_batches` ADD `committed_at` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `fingerprint` text;--> statement-breakpoint
CREATE INDEX `idx_jobs_fingerprint` ON `jobs` (`fingerprint`);--> statement-breakpoint
ALTER TABLE `learning_sources` ADD `source_version` text;--> statement-breakpoint
ALTER TABLE `learning_sources` ADD `source_checksum` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learning_sources_checksum_version` ON `learning_sources` (`source_checksum`,`source_version`);--> statement-breakpoint
ALTER TABLE `saved_jobs` ADD `bookmarked` integer DEFAULT true NOT NULL;