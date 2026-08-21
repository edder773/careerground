CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action_created` ON `audit_logs` (`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor_created` ON `audit_logs` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coding_problems` (
	`id` text PRIMARY KEY NOT NULL,
	`source_url` text NOT NULL,
	`display_title` text NOT NULL,
	`level` integer NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_coding_problems_source_url` ON `coding_problems` (`source_url`);--> statement-breakpoint
CREATE INDEX `idx_coding_problems_level_position` ON `coding_problems` (`level`,`position`);--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`item_type` text NOT NULL,
	`target_id` text NOT NULL,
	`label` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_collection_items_target` ON `collection_items` (`collection_id`,`item_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_items_position` ON `collection_items` (`collection_id`,`position`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`icon` text DEFAULT 'folder' NOT NULL,
	`color` text DEFAULT 'amber' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_collections_user_parent_position` ON `collections` (`user_id`,`parent_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_collections_user_deleted` ON `collections` (`user_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `daily_challenge_participations` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_participations_challenge_user` ON `daily_challenge_participations` (`challenge_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_daily_participations_user` ON `daily_challenge_participations` (`user_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `daily_challenge_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`allowed_levels` text DEFAULT '[1,2]' NOT NULL,
	`repeat_exclusion_days` integer DEFAULT 60 NOT NULL,
	`allow_repeat_relaxation` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`kst_date` text NOT NULL,
	`problem_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_challenges_date` ON `daily_challenges` (`kst_date`);--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`checksum` text NOT NULL,
	`original_count` integer DEFAULT 0 NOT NULL,
	`rejected_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_import_batches_kind_checksum` ON `import_batches` (`kind`,`checksum`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`company_size` text DEFAULT 'UNCLASSIFIED' NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`region` text NOT NULL,
	`remote` integer DEFAULT false NOT NULL,
	`tech_stack` text DEFAULT '[]' NOT NULL,
	`deadline_at` text,
	`rolling` integer DEFAULT false NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`last_verified_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_jobs_source_url` ON `jobs` (`source_url`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status_deadline` ON `jobs` (`status`,`deadline_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_category_created` ON `jobs` (`category`,`created_at`);--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`understanding` integer,
	`last_studied_at` text,
	`next_review_at` text,
	`repetition_count` integer DEFAULT 0 NOT NULL,
	`interval_days` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learning_progress_user_unit` ON `learning_progress` (`user_id`,`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_progress_user_due` ON `learning_progress` (`user_id`,`next_review_at`);--> statement-breakpoint
CREATE TABLE `learning_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`prompt` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'READY' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_units` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`anchor` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`concepts` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learning_units_source_anchor` ON `learning_units` (`source_id`,`anchor`);--> statement-breakpoint
CREATE INDEX `idx_learning_units_source_position` ON `learning_units` (`source_id`,`position`);--> statement-breakpoint
CREATE TABLE `note_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`revision` integer NOT NULL,
	`markdown` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_note_revisions_note_revision` ON `note_revisions` (`note_id`,`revision`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`markdown` text NOT NULL,
	`visibility` text DEFAULT 'PRIVATE' NOT NULL,
	`linked_type` text,
	`linked_id` text,
	`current_rev` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notes_user_updated` ON `notes` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`href` text,
	`read_at` text,
	`expires_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read_created` ON `notifications` (`user_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `problem_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`status` text DEFAULT 'UNTRIED' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`solved_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_problem_progress_user_problem` ON `problem_progress` (`user_id`,`problem_id`);--> statement-breakpoint
CREATE INDEX `idx_problem_progress_user_status` ON `problem_progress` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `saved_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`status` text DEFAULT 'INTERESTED' NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_saved_jobs_user_job` ON `saved_jobs` (`user_id`,`job_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_jobs_user_status` ON `saved_jobs` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `solution_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_id` text,
	`markdown` text NOT NULL,
	`edited_at` text,
	`deleted_at` text,
	`hidden_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_solution_comments_solution_created` ON `solution_comments` (`solution_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_solution_comments_parent` ON `solution_comments` (`parent_id`);--> statement-breakpoint
CREATE TABLE `solution_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_solution_reactions_solution_user` ON `solution_reactions` (`solution_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `solution_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`revision` integer NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_solution_revisions_solution_revision` ON `solution_revisions` (`solution_id`,`revision`);--> statement-breakpoint
CREATE TABLE `solutions` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_id` text NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`language` text NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`time_complexity` text,
	`space_complexity` text,
	`lessons` text DEFAULT '' NOT NULL,
	`solved` integer DEFAULT false NOT NULL,
	`visibility` text DEFAULT 'MEMBERS' NOT NULL,
	`current_rev` integer DEFAULT 1 NOT NULL,
	`solved_at` text,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_solutions_problem_visibility_updated` ON `solutions` (`problem_id`,`visibility`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_solutions_author_solved` ON `solutions` (`author_id`,`solved_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`site_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`avatar_url` text,
	`github_username` text,
	`preferred_language` text DEFAULT 'typescript' NOT NULL,
	`ranking_opt_in` integer DEFAULT true NOT NULL,
	`comment_notifications` integer DEFAULT true NOT NULL,
	`deadline_notifications` integer DEFAULT true NOT NULL,
	`review_notifications` integer DEFAULT true NOT NULL,
	`data_deletion_requested` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_site_user_id` ON `users` (`site_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);