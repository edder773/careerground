DROP TRIGGER IF EXISTS `trg_notes_search_insert`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_notes_search_update`;--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_notes_search_delete`;--> statement-breakpoint
DELETE FROM `workspace_search` WHERE `kind` = 'notes';--> statement-breakpoint
DELETE FROM `collection_items` WHERE `item_type` = 'NOTE';--> statement-breakpoint
DROP TABLE `note_revisions`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`item_type` text NOT NULL,
	`target_id` text NOT NULL,
	`label` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_collection_items_type" CHECK("__new_collection_items"."item_type" IN ('JOB_POSTING', 'CODING_PROBLEM', 'SOLUTION', 'LEARNING_UNIT', 'EXTERNAL_LINK'))
);
--> statement-breakpoint
INSERT INTO `__new_collection_items`("id", "collection_id", "item_type", "target_id", "label", "position", "created_at") SELECT "id", "collection_id", "item_type", "target_id", "label", "position", "created_at" FROM `collection_items`;--> statement-breakpoint
DROP TABLE `collection_items`;--> statement-breakpoint
ALTER TABLE `__new_collection_items` RENAME TO `collection_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_collection_items_target` ON `collection_items` (`collection_id`,`item_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_items_position` ON `collection_items` (`collection_id`,`position`);--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
	'0017_marvelous_blockbuster',
	'sha256:e2d828e1a606fe4991fdbbf71441265333188ecb79107f1ba7ce2fe44896ab32',
	'2026-08-15T02:35:00.000Z'
);--> statement-breakpoint
PRAGMA optimize;
