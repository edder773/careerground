DROP TRIGGER IF EXISTS `trg_collections_search_delete`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_collections_search_insert`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_collections_search_update`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_jobs_search_delete`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_jobs_search_insert`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_jobs_search_update`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_learning_search_delete`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_learning_search_insert`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_learning_search_update`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_problems_search_delete`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_problems_search_insert`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_problems_search_update`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_solutions_search_delete`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_solutions_search_insert`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `trg_solutions_search_update`;
--> statement-breakpoint
DROP TABLE IF EXISTS `workspace_search`;
--> statement-breakpoint
DROP TABLE IF EXISTS `daily_challenge_participations`;
--> statement-breakpoint
DROP TABLE IF EXISTS `solution_comments`;
--> statement-breakpoint
DROP TABLE IF EXISTS `solution_reactions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `solution_revisions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `solutions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `collection_items`;
--> statement-breakpoint
DROP TABLE IF EXISTS `collections`;
--> statement-breakpoint
DROP TABLE IF EXISTS `auth_sessions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `auth_identities`;
--> statement-breakpoint
DROP TABLE IF EXISTS `problem_progress`;
--> statement-breakpoint
DROP TABLE IF EXISTS `saved_jobs`;
--> statement-breakpoint
DROP TABLE IF EXISTS `learning_question_attempts`;
--> statement-breakpoint
DROP TABLE IF EXISTS `learning_review_events`;
--> statement-breakpoint
DROP TABLE IF EXISTS `learning_progress`;
--> statement-breakpoint
DROP TABLE IF EXISTS `flashcards`;
--> statement-breakpoint
DROP TABLE IF EXISTS `learning_questions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `learning_units`;
--> statement-breakpoint
DROP TABLE IF EXISTS `learning_sources`;
--> statement-breakpoint
DROP TABLE IF EXISTS `notifications`;
--> statement-breakpoint
DROP TABLE IF EXISTS `request_rate_limits`;
--> statement-breakpoint
DROP TABLE IF EXISTS `audit_logs`;
--> statement-breakpoint
DROP TABLE IF EXISTS `import_previews`;
--> statement-breakpoint
DROP TABLE IF EXISTS `job_source_snapshot_items`;
--> statement-breakpoint
DROP TABLE IF EXISTS `job_source_snapshots`;
--> statement-breakpoint
DROP TABLE IF EXISTS `scheduler_leases`;
--> statement-breakpoint
DROP TABLE IF EXISTS `users`;
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0039_retire_legacy_product_surface',
  'sha256:3ed76a3f8082ad34477ed903b31bb7743e2df6e70c2202c5788f964be39d5816',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(`version`) DO UPDATE SET
  `checksum` = excluded.`checksum`,
  `applied_at` = excluded.`applied_at`;
--> statement-breakpoint
PRAGMA optimize;
