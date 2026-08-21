CREATE TABLE `job_source_snapshot_items` (
	`snapshot_id` text NOT NULL,
	`job_id` text NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `job_source_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_job_source_snapshot_items_unique` ON `job_source_snapshot_items` (`snapshot_id`,`job_id`);--> statement-breakpoint
CREATE INDEX `idx_job_source_snapshot_items_job` ON `job_source_snapshot_items` (`job_id`);--> statement-breakpoint
CREATE TABLE `job_source_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`source_name` text NOT NULL,
	`collected_at` text NOT NULL,
	`observed_count` integer NOT NULL,
	`expired_count` integer DEFAULT 0 NOT NULL,
	`import_batch_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`import_batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_job_source_snapshots_counts" CHECK("job_source_snapshots"."observed_count" >= 0 AND "job_source_snapshots"."expired_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_job_source_snapshots_batch_source` ON `job_source_snapshots` (`import_batch_id`,`source_name`);--> statement-breakpoint
CREATE INDEX `idx_job_source_snapshots_source_collected` ON `job_source_snapshots` (`source_name`,`collected_at`);--> statement-breakpoint
CREATE TABLE `job_tech_stacks` (
	`job_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_job_tech_stacks_name" CHECK(length(trim("job_tech_stacks"."name")) BETWEEN 1 AND 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_job_tech_stacks_job_name` ON `job_tech_stacks` (`job_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_job_tech_stacks_name_job` ON `job_tech_stacks` (`name`,`job_id`);--> statement-breakpoint
CREATE TABLE `learning_question_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`response` text NOT NULL,
	`correct` integer NOT NULL,
	`attempted_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `learning_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_learning_question_attempts_correct" CHECK("learning_question_attempts"."correct" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_learning_question_attempts_user_question` ON `learning_question_attempts` (`user_id`,`question_id`,`attempted_at`);--> statement-breakpoint
CREATE TABLE `learning_review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`rating` integer NOT NULL,
	`previous_interval_days` integer NOT NULL,
	`next_interval_days` integer NOT NULL,
	`next_review_at` text NOT NULL,
	`reviewed_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `learning_units`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_learning_review_events_rating" CHECK("learning_review_events"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "chk_learning_review_events_intervals" CHECK("learning_review_events"."previous_interval_days" >= 1 AND "learning_review_events"."next_interval_days" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learning_review_events_sequence` ON `learning_review_events` (`user_id`,`unit_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_learning_review_events_user_reviewed` ON `learning_review_events` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE TABLE `scheduler_leases` (
	`name` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`lease_until` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_learning_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`understanding` integer,
	`last_studied_at` text,
	`next_review_at` text,
	`repetition_count` integer DEFAULT 0 NOT NULL,
	`interval_days` integer DEFAULT 1 NOT NULL,
	`review_version` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`mastered_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `learning_units`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_learning_progress_completed" CHECK("__new_learning_progress"."completed" IN (0, 1)),
	CONSTRAINT "chk_learning_progress_understanding" CHECK("__new_learning_progress"."understanding" IS NULL OR "__new_learning_progress"."understanding" BETWEEN 1 AND 5),
	CONSTRAINT "chk_learning_progress_interval" CHECK("__new_learning_progress"."interval_days" >= 1),
	CONSTRAINT "chk_learning_progress_version" CHECK("__new_learning_progress"."review_version" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_learning_progress`("id", "user_id", "unit_id", "completed", "understanding", "last_studied_at", "next_review_at", "repetition_count", "interval_days", "review_version", "completed_at", "mastered_at", "updated_at") SELECT "id", "user_id", "unit_id", "completed", "understanding", "last_studied_at", "next_review_at", "repetition_count", "interval_days", 0, CASE WHEN "completed" = 1 THEN "last_studied_at" ELSE NULL END, NULL, "updated_at" FROM `learning_progress`;--> statement-breakpoint
DROP TABLE `learning_progress`;--> statement-breakpoint
ALTER TABLE `__new_learning_progress` RENAME TO `learning_progress`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learning_progress_user_unit` ON `learning_progress` (`user_id`,`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_progress_user_due` ON `learning_progress` (`user_id`,`next_review_at`);--> statement-breakpoint
CREATE TABLE `__new_coding_problems` (
	`id` text PRIMARY KEY NOT NULL,
	`source_url` text NOT NULL,
	`display_title` text NOT NULL,
	`level` integer NOT NULL,
	`track` text DEFAULT 'ALGORITHM' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "chk_coding_problems_level" CHECK("__new_coding_problems"."level" BETWEEN 0 AND 5),
	CONSTRAINT "chk_coding_problems_track" CHECK("__new_coding_problems"."track" IN ('ALGORITHM', 'SQL')),
	CONSTRAINT "chk_coding_problems_active" CHECK("__new_coding_problems"."active" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_coding_problems`("id", "source_url", "display_title", "level", "track", "tags", "position", "active", "created_at", "updated_at") SELECT "id", "source_url", "display_title", "level", "track", "tags", "position", "active", "created_at", "updated_at" FROM `coding_problems`;--> statement-breakpoint
DROP TABLE `coding_problems`;--> statement-breakpoint
ALTER TABLE `__new_coding_problems` RENAME TO `coding_problems`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_coding_problems_source_url` ON `coding_problems` (`source_url`);--> statement-breakpoint
CREATE INDEX `idx_coding_problems_level_position` ON `coding_problems` (`level`,`position`);--> statement-breakpoint
CREATE INDEX `idx_coding_problems_track_level_position` ON `coding_problems` (`track`,`level`,`position`);--> statement-breakpoint
CREATE TABLE `__new_collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`item_type` text NOT NULL,
	`target_id` text NOT NULL,
	`label` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_collection_items_type" CHECK("__new_collection_items"."item_type" IN ('JOB_POSTING', 'CODING_PROBLEM', 'SOLUTION', 'LEARNING_UNIT', 'NOTE', 'EXTERNAL_LINK'))
);
--> statement-breakpoint
INSERT INTO `__new_collection_items`("id", "collection_id", "item_type", "target_id", "label", "position", "created_at") SELECT "id", "collection_id", "item_type", "target_id", "label", "position", "created_at" FROM `collection_items`;--> statement-breakpoint
DROP TABLE `collection_items`;--> statement-breakpoint
ALTER TABLE `__new_collection_items` RENAME TO `collection_items`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_collection_items_target` ON `collection_items` (`collection_id`,`item_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_items_position` ON `collection_items` (`collection_id`,`position`);--> statement-breakpoint
CREATE TABLE `__new_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`company_size` text DEFAULT 'UNCLASSIFIED' NOT NULL,
	`company_size_evidence` text,
	`source_name` text NOT NULL,
	`source_posting_id` text,
	`source_url` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`career_scope` text DEFAULT 'NEW_GRAD_ELIGIBLE' NOT NULL,
	`career_evidence` text DEFAULT '' NOT NULL,
	`employment_type` text DEFAULT 'FULL_TIME' NOT NULL,
	`region` text NOT NULL,
	`remote` integer DEFAULT false NOT NULL,
	`tech_stack` text DEFAULT '[]' NOT NULL,
	`deadline_at` text,
	`rolling` integer DEFAULT false NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`fingerprint` text,
	`collected_at` text,
	`last_verified_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "chk_jobs_company_size" CHECK("__new_jobs"."company_size" IN ('LARGE', 'PUBLIC', 'MID', 'SMALL', 'STARTUP', 'FOREIGN', 'UNCLASSIFIED')),
	CONSTRAINT "chk_jobs_career_scope" CHECK("__new_jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'CAREER_ONLY')),
	CONSTRAINT "chk_jobs_status" CHECK("__new_jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN', 'EXPIRED', 'REMOVED', 'NEEDS_REVIEW')),
	CONSTRAINT "chk_jobs_remote" CHECK("__new_jobs"."remote" IN (0, 1)),
	CONSTRAINT "chk_jobs_rolling" CHECK("__new_jobs"."rolling" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_jobs`("id", "company_name", "company_size", "company_size_evidence", "source_name", "source_posting_id", "source_url", "title", "category", "career_scope", "career_evidence", "employment_type", "region", "remote", "tech_stack", "deadline_at", "rolling", "summary", "status", "fingerprint", "collected_at", "last_verified_at", "created_at", "updated_at") SELECT "id", "company_name", "company_size", "company_size_evidence", "source_name", "source_posting_id", "source_url", "title", "category", "career_scope", "career_evidence", "employment_type", "region", "remote", "tech_stack", "deadline_at", "rolling", "summary", "status", "fingerprint", "collected_at", "last_verified_at", "created_at", "updated_at" FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_jobs_source_url` ON `jobs` (`source_url`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status_deadline` ON `jobs` (`status`,`deadline_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_category_created` ON `jobs` (`category`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_created_status` ON `jobs` (`created_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_category_created_status` ON `jobs` (`category`,`created_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_size_created_status` ON `jobs` (`company_size`,`created_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_company_status` ON `jobs` (`company_name`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_deadline_status` ON `jobs` (`deadline_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_deadline` ON `jobs` (`deadline_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_collected` ON `jobs` (`collected_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_created` ON `jobs` (`created_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE') AND "jobs"."collected_at" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_rolling` ON `jobs` (`id`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE') AND "jobs"."rolling" = 1;--> statement-breakpoint
CREATE INDEX `idx_jobs_fingerprint` ON `jobs` (`fingerprint`);--> statement-breakpoint
CREATE TABLE `__new_learning_units` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`anchor` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`concepts` text DEFAULT '[]' NOT NULL,
	`visuals` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `learning_sources`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_learning_units_published" CHECK("__new_learning_units"."published" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_learning_units`("id", "source_id", "anchor", "title", "summary", "concepts", "visuals", "position", "published", "created_at", "updated_at") SELECT "id", "source_id", "anchor", "title", "summary", "concepts", "visuals", "position", "published", "created_at", "updated_at" FROM `learning_units`;--> statement-breakpoint
DROP TABLE `learning_units`;--> statement-breakpoint
ALTER TABLE `__new_learning_units` RENAME TO `learning_units`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_learning_units_source_anchor` ON `learning_units` (`source_id`,`anchor`);--> statement-breakpoint
CREATE INDEX `idx_learning_units_source_position` ON `learning_units` (`source_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_learning_units_published_source_position` ON `learning_units` (`published`,`source_id`,`position`);--> statement-breakpoint
CREATE TABLE `__new_notes` (
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
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_notes_visibility" CHECK("__new_notes"."visibility" IN ('PRIVATE', 'MEMBERS'))
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "user_id", "title", "markdown", "visibility", "linked_type", "linked_id", "current_rev", "deleted_at", "created_at", "updated_at") SELECT "id", "user_id", "title", "markdown", "visibility", "linked_type", "linked_id", "current_rev", "deleted_at", "created_at", "updated_at" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
CREATE INDEX `idx_notes_user_updated` ON `notes` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`href` text,
	`dedupe_key` text,
	`read_at` text,
	`expires_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_notifications_type" CHECK("__new_notifications"."type" IN ('COMMENT', 'REPLY', 'JOB_DEADLINE', 'LEARNING_REVIEW', 'SYSTEM'))
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "user_id", "type", "title", "message", "href", "dedupe_key", "read_at", "expires_at", "created_at") SELECT "id", "user_id", "type", "title", "message", "href", "dedupe_key", "read_at", "expires_at", "created_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read_created` ON `notifications` (`user_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notifications_user_dedupe` ON `notifications` (`user_id`,`dedupe_key`);--> statement-breakpoint
CREATE TABLE `__new_problem_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`status` text DEFAULT 'UNTRIED' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`solved_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`problem_id`) REFERENCES `coding_problems`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_problem_progress_status" CHECK("__new_problem_progress"."status" IN ('UNTRIED', 'IN_PROGRESS', 'SOLVED', 'RETRY')),
	CONSTRAINT "chk_problem_progress_favorite" CHECK("__new_problem_progress"."favorite" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_problem_progress`("id", "user_id", "problem_id", "status", "favorite", "memo", "solved_at", "updated_at") SELECT "id", "user_id", "problem_id", "status", "favorite", "memo", "solved_at", "updated_at" FROM `problem_progress`;--> statement-breakpoint
DROP TABLE `problem_progress`;--> statement-breakpoint
ALTER TABLE `__new_problem_progress` RENAME TO `problem_progress`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_problem_progress_user_problem` ON `problem_progress` (`user_id`,`problem_id`);--> statement-breakpoint
CREATE INDEX `idx_problem_progress_user_status` ON `problem_progress` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `__new_saved_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`status` text DEFAULT 'INTERESTED' NOT NULL,
	`bookmarked` integer DEFAULT true NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_saved_jobs_status" CHECK("__new_saved_jobs"."status" IN ('INTERESTED', 'PLANNED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'REJECTED', 'ACCEPTED', 'ON_HOLD')),
	CONSTRAINT "chk_saved_jobs_bookmarked" CHECK("__new_saved_jobs"."bookmarked" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_saved_jobs`("id", "user_id", "job_id", "status", "bookmarked", "memo", "created_at", "updated_at") SELECT "id", "user_id", "job_id", "status", "bookmarked", "memo", "created_at", "updated_at" FROM `saved_jobs`;--> statement-breakpoint
DROP TABLE `saved_jobs`;--> statement-breakpoint
ALTER TABLE `__new_saved_jobs` RENAME TO `saved_jobs`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_saved_jobs_user_job` ON `saved_jobs` (`user_id`,`job_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_jobs_user_status` ON `saved_jobs` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `__new_solutions` (
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
	`updated_at` text NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `coding_problems`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chk_solutions_language" CHECK("__new_solutions"."language" IN ('python', 'java', 'javascript', 'cpp', 'sql')),
	CONSTRAINT "chk_solutions_visibility" CHECK("__new_solutions"."visibility" IN ('PRIVATE', 'MEMBERS')),
	CONSTRAINT "chk_solutions_solved" CHECK("__new_solutions"."solved" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_solutions`("id", "problem_id", "author_id", "title", "language", "code", "description", "time_complexity", "space_complexity", "lessons", "solved", "visibility", "current_rev", "solved_at", "deleted_at", "created_at", "updated_at") SELECT "id", "problem_id", "author_id", "title", "language", "code", "description", "time_complexity", "space_complexity", "lessons", "solved", "visibility", "current_rev", "solved_at", "deleted_at", "created_at", "updated_at" FROM `solutions`;--> statement-breakpoint
DROP TABLE `solutions`;--> statement-breakpoint
ALTER TABLE `__new_solutions` RENAME TO `solutions`;--> statement-breakpoint
CREATE INDEX `idx_solutions_problem_visibility_updated` ON `solutions` (`problem_id`,`visibility`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_solutions_author_solved` ON `solutions` (`author_id`,`solved_at`);--> statement-breakpoint
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
	`updated_at` text NOT NULL,
	CONSTRAINT "chk_users_role" CHECK("__new_users"."role" IN ('ADMIN', 'MEMBER')),
	CONSTRAINT "chk_users_preferred_language" CHECK("__new_users"."preferred_language" IN ('python', 'java', 'javascript', 'cpp')),
	CONSTRAINT "chk_users_active" CHECK("__new_users"."is_active" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "site_user_id", "email", "display_name", "role", "is_active", "avatar_url", "github_username", "preferred_language", "onboarding_completed_at", "ranking_opt_in", "comment_notifications", "deadline_notifications", "review_notifications", "data_deletion_requested", "created_at", "updated_at") SELECT "id", "site_user_id", "email", "display_name", "role", "is_active", "avatar_url", "github_username", "preferred_language", "onboarding_completed_at", "ranking_opt_in", "comment_notifications", "deadline_notifications", "review_notifications", "data_deletion_requested", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_site_user_id` ON `users` (`site_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_audit_logs`("id", "actor_id", "action", "target_type", "target_id", "metadata", "created_at") SELECT "id", "actor_id", "action", "target_type", "target_id", "metadata", "created_at" FROM `audit_logs`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
ALTER TABLE `__new_audit_logs` RENAME TO `audit_logs`;--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action_created` ON `audit_logs` (`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor_created` ON `audit_logs` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`icon` text DEFAULT 'folder' NOT NULL,
	`color` text DEFAULT 'amber' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_collections`("id", "user_id", "parent_id", "name", "icon", "color", "position", "deleted_at", "created_at", "updated_at") SELECT "id", "user_id", "parent_id", "name", "icon", "color", "position", "deleted_at", "created_at", "updated_at" FROM `collections`;--> statement-breakpoint
DROP TABLE `collections`;--> statement-breakpoint
ALTER TABLE `__new_collections` RENAME TO `collections`;--> statement-breakpoint
CREATE INDEX `idx_collections_user_parent_position` ON `collections` (`user_id`,`parent_id`,`position`);--> statement-breakpoint
CREATE INDEX `idx_collections_user_deleted` ON `collections` (`user_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `__new_daily_challenge_participations` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `daily_challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_daily_challenge_participations`("id", "challenge_id", "user_id", "completed_at", "created_at") SELECT "id", "challenge_id", "user_id", "completed_at", "created_at" FROM `daily_challenge_participations`;--> statement-breakpoint
DROP TABLE `daily_challenge_participations`;--> statement-breakpoint
ALTER TABLE `__new_daily_challenge_participations` RENAME TO `daily_challenge_participations`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_participations_challenge_user` ON `daily_challenge_participations` (`challenge_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_daily_participations_user` ON `daily_challenge_participations` (`user_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `__new_daily_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`kst_date` text NOT NULL,
	`level_slot` integer DEFAULT 1 NOT NULL,
	`problem_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `coding_problems`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_daily_challenges`("id", "kst_date", "level_slot", "problem_id", "created_at") SELECT "id", "kst_date", "level_slot", "problem_id", "created_at" FROM `daily_challenges`;--> statement-breakpoint
DROP TABLE `daily_challenges`;--> statement-breakpoint
ALTER TABLE `__new_daily_challenges` RENAME TO `daily_challenges`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_challenges_date_level` ON `daily_challenges` (`kst_date`,`level_slot`);--> statement-breakpoint
CREATE TABLE `__new_flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `learning_units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_flashcards`("id", "unit_id", "front", "back", "created_at") SELECT "id", "unit_id", "front", "back", "created_at" FROM `flashcards`;--> statement-breakpoint
DROP TABLE `flashcards`;--> statement-breakpoint
ALTER TABLE `__new_flashcards` RENAME TO `flashcards`;--> statement-breakpoint
CREATE INDEX `idx_flashcards_unit_created` ON `flashcards` (`unit_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_import_previews` (
	`token` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`checksum` text NOT NULL,
	`payload` text NOT NULL,
	`actor_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_import_previews`("token", "kind", "checksum", "payload", "actor_id", "expires_at", "consumed_at", "created_at") SELECT "token", "kind", "checksum", "payload", "actor_id", "expires_at", "consumed_at", "created_at" FROM `import_previews`;--> statement-breakpoint
DROP TABLE `import_previews`;--> statement-breakpoint
ALTER TABLE `__new_import_previews` RENAME TO `import_previews`;--> statement-breakpoint
CREATE INDEX `idx_import_previews_actor_kind` ON `import_previews` (`actor_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_import_previews_expiry` ON `import_previews` (`expires_at`);--> statement-breakpoint
CREATE TABLE `__new_learning_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`prompt` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `learning_units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_learning_questions`("id", "unit_id", "prompt", "answer", "created_at") SELECT "id", "unit_id", "prompt", "answer", "created_at" FROM `learning_questions`;--> statement-breakpoint
DROP TABLE `learning_questions`;--> statement-breakpoint
ALTER TABLE `__new_learning_questions` RENAME TO `learning_questions`;--> statement-breakpoint
CREATE INDEX `idx_learning_questions_unit_created` ON `learning_questions` (`unit_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_note_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`revision` integer NOT NULL,
	`markdown` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_note_revisions`("id", "note_id", "revision", "markdown", "created_at") SELECT "id", "note_id", "revision", "markdown", "created_at" FROM `note_revisions`;--> statement-breakpoint
DROP TABLE `note_revisions`;--> statement-breakpoint
ALTER TABLE `__new_note_revisions` RENAME TO `note_revisions`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_note_revisions_note_revision` ON `note_revisions` (`note_id`,`revision`);--> statement-breakpoint
CREATE TABLE `__new_request_rate_limits` (
	`user_id` text NOT NULL,
	`route_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_request_rate_limits`("user_id", "route_key", "window_start", "count", "updated_at") SELECT "user_id", "route_key", "window_start", "count", "updated_at" FROM `request_rate_limits`;--> statement-breakpoint
DROP TABLE `request_rate_limits`;--> statement-breakpoint
ALTER TABLE `__new_request_rate_limits` RENAME TO `request_rate_limits`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_request_rate_limits_window` ON `request_rate_limits` (`user_id`,`route_key`,`window_start`);--> statement-breakpoint
CREATE INDEX `idx_request_rate_limits_updated` ON `request_rate_limits` (`updated_at`);--> statement-breakpoint
CREATE TABLE `__new_solution_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_id` text,
	`markdown` text NOT NULL,
	`edited_at` text,
	`deleted_at` text,
	`hidden_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `solution_comments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_solution_comments`("id", "solution_id", "author_id", "parent_id", "markdown", "edited_at", "deleted_at", "hidden_at", "created_at", "updated_at") SELECT "id", "solution_id", "author_id", "parent_id", "markdown", "edited_at", "deleted_at", "hidden_at", "created_at", "updated_at" FROM `solution_comments`;--> statement-breakpoint
DROP TABLE `solution_comments`;--> statement-breakpoint
ALTER TABLE `__new_solution_comments` RENAME TO `solution_comments`;--> statement-breakpoint
CREATE INDEX `idx_solution_comments_solution_created` ON `solution_comments` (`solution_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_solution_comments_parent` ON `solution_comments` (`parent_id`);--> statement-breakpoint
CREATE TABLE `__new_solution_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_solution_reactions`("id", "solution_id", "user_id", "created_at") SELECT "id", "solution_id", "user_id", "created_at" FROM `solution_reactions`;--> statement-breakpoint
DROP TABLE `solution_reactions`;--> statement-breakpoint
ALTER TABLE `__new_solution_reactions` RENAME TO `solution_reactions`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_solution_reactions_solution_user` ON `solution_reactions` (`solution_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `__new_solution_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`revision` integer NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_solution_revisions`("id", "solution_id", "revision", "code", "description", "created_at") SELECT "id", "solution_id", "revision", "code", "description", "created_at" FROM `solution_revisions`;--> statement-breakpoint
DROP TABLE `solution_revisions`;--> statement-breakpoint
ALTER TABLE `__new_solution_revisions` RENAME TO `solution_revisions`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_solution_revisions_solution_revision` ON `solution_revisions` (`solution_id`,`revision`);--> statement-breakpoint
INSERT OR IGNORE INTO `job_tech_stacks` (`job_id`, `name`, `created_at`)
SELECT j.`id`, trim(CAST(value AS text)), j.`updated_at`
FROM `jobs` j, json_each(j.`tech_stack`)
WHERE json_valid(j.`tech_stack`) AND length(trim(CAST(value AS text))) BETWEEN 1 AND 50;--> statement-breakpoint
PRAGMA foreign_key_check;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA optimize;
