CREATE INDEX `idx_jobs_feed_collected_id` ON `jobs` (`collected_at`,`id`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
CREATE INDEX `idx_jobs_active_category` ON `jobs` (`category`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
	'0018_sloppy_leech',
	'sha256:86c1de85559a9b51e959bf7c423ad8a9e9afd3586ad672c2ec32da009057fe4b',
	'2026-08-15T04:45:00.000Z'
);--> statement-breakpoint
PRAGMA optimize;
