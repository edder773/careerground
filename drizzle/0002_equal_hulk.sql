PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`site_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`avatar_url` text,
	`github_username` text,
	`preferred_language` text DEFAULT 'javascript' NOT NULL,
	`onboarding_completed_at` text,
	`ranking_opt_in` integer DEFAULT true NOT NULL,
	`comment_notifications` integer DEFAULT true NOT NULL,
	`deadline_notifications` integer DEFAULT true NOT NULL,
	`review_notifications` integer DEFAULT true NOT NULL,
	`data_deletion_requested` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "site_user_id", "email", "display_name", "role", "is_active", "avatar_url", "github_username", "preferred_language", "onboarding_completed_at", "ranking_opt_in", "comment_notifications", "deadline_notifications", "review_notifications", "data_deletion_requested", "created_at", "updated_at") SELECT "id", "site_user_id", "email", "display_name", "role", "is_active", "avatar_url", "github_username", CASE WHEN "preferred_language" = 'typescript' THEN 'javascript' ELSE "preferred_language" END, "created_at", "ranking_opt_in", "comment_notifications", "deadline_notifications", "review_notifications", "data_deletion_requested", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_site_user_id` ON `users` (`site_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
UPDATE `solutions` SET `visibility` = 'MEMBERS' WHERE `visibility` = 'PRIVATE';
--> statement-breakpoint
UPDATE `notes` SET `visibility` = 'PRIVATE' WHERE `visibility` = 'MEMBERS';
