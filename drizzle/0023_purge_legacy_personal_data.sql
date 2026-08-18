-- D1 production does not guarantee that the historical user deletion ran with
-- SQLite foreign-key cascades enabled. Purge every user-owned table explicitly
-- while preserving shared jobs, learning content, and coding problems.
DELETE FROM `solution_comments`;
--> statement-breakpoint
DELETE FROM `solution_reactions`;
--> statement-breakpoint
DELETE FROM `solution_revisions`;
--> statement-breakpoint
DELETE FROM `solutions`;
--> statement-breakpoint
DELETE FROM `collection_items`;
--> statement-breakpoint
DELETE FROM `collections`;
--> statement-breakpoint
DELETE FROM `daily_challenge_participations`;
--> statement-breakpoint
DELETE FROM `saved_jobs`;
--> statement-breakpoint
DELETE FROM `learning_question_attempts`;
--> statement-breakpoint
DELETE FROM `learning_review_events`;
--> statement-breakpoint
DELETE FROM `learning_progress`;
--> statement-breakpoint
DELETE FROM `problem_progress`;
--> statement-breakpoint
DELETE FROM `notifications`;
--> statement-breakpoint
DELETE FROM `request_rate_limits`;
--> statement-breakpoint
DELETE FROM `import_previews`;
--> statement-breakpoint
DELETE FROM `auth_sessions`;
--> statement-breakpoint
DELETE FROM `auth_identities`;
--> statement-breakpoint
DELETE FROM `audit_logs`;
--> statement-breakpoint
DELETE FROM `workspace_search` WHERE `owner_id` <> '';
--> statement-breakpoint
DELETE FROM `users`;
--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
	'0023_purge_legacy_personal_data',
	'sha256:33d7868739506072fe37c9ba0f19a863fc1343c53c31e45b79390acfaa1b9f6f',
	'2026-08-18T03:15:00.000Z'
);
--> statement-breakpoint
PRAGMA optimize;
