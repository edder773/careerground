DROP INDEX `idx_jobs_calendar_collected`;--> statement-breakpoint
DROP INDEX `idx_jobs_calendar_created`;--> statement-breakpoint
ALTER TABLE `jobs` ADD `application_start_at` text;--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_published` ON `jobs` (`published_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_application_start` ON `jobs` (`application_start_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');
--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
	'0021_separate_job_schedule_dates',
	'sha256:4e31cdb8719763ac88c1fb0311e50720237367cd0b88be0c9dfee26a962adb78',
	'2026-08-16T01:00:00.000Z'
);
--> statement-breakpoint
PRAGMA optimize;
