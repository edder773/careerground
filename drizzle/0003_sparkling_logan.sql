CREATE INDEX `idx_jobs_created_status` ON `jobs` (`created_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_category_created_status` ON `jobs` (`category`,`created_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_size_created_status` ON `jobs` (`company_size`,`created_at`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_company_status` ON `jobs` (`company_name`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_deadline_status` ON `jobs` (`deadline_at`,`status`);--> statement-breakpoint
PRAGMA optimize;
