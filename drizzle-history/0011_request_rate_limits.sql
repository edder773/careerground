CREATE TABLE `request_rate_limits` (
	`user_id` text NOT NULL,
	`route_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_request_rate_limits_window` ON `request_rate_limits` (`user_id`,`route_key`,`window_start`);--> statement-breakpoint
CREATE INDEX `idx_request_rate_limits_updated` ON `request_rate_limits` (`updated_at`);