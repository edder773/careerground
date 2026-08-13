CREATE INDEX `idx_flashcards_unit_created` ON `flashcards` (`unit_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_deadline` ON `jobs` (`deadline_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_collected` ON `jobs` (`collected_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE');--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_created` ON `jobs` (`created_at`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE') AND "jobs"."collected_at" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_jobs_calendar_rolling` ON `jobs` (`id`) WHERE "jobs"."status" IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND "jobs"."career_scope" IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE') AND "jobs"."rolling" = 1;--> statement-breakpoint
CREATE INDEX `idx_learning_questions_unit_created` ON `learning_questions` (`unit_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_learning_units_published_source_position` ON `learning_units` (`published`,`source_id`,`position`);--> statement-breakpoint
PRAGMA optimize;
