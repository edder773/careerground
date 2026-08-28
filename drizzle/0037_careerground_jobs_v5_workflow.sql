CREATE TABLE `workflow_runs` (
  `run_id` text PRIMARY KEY NOT NULL,
  `schema_version` text NOT NULL,
  `workflow_id` text NOT NULL,
  `run_group_key` text NOT NULL,
  `target_as_of_date` text NOT NULL,
  `attempt` integer NOT NULL,
  `mode` text NOT NULL,
  `status` text NOT NULL,
  `previous_successful_run_id` text,
  `error_code` text,
  `error_message` text,
  `manifest` text,
  `manifest_checksum` text,
  `started_at` text NOT NULL,
  `completed_at` text,
  `validated_at` text,
  `published_at` text,
  CONSTRAINT `chk_workflow_runs_attempt` CHECK (`attempt` >= 1),
  CONSTRAINT `chk_workflow_runs_mode` CHECK (`mode` IN ('DRY_RUN', 'RESUME', 'PUBLISH')),
  CONSTRAINT `chk_workflow_runs_status` CHECK (`status` IN (
    'PENDING', 'RUNNING', 'SUCCESS_WITH_CHANGES', 'SUCCESS_NO_CHANGES',
    'SKIPPED_WEEKEND', 'SKIPPED_HOLIDAY', 'FAILED_PREFLIGHT', 'FAILED_INPUT',
    'FAILED_COLLECTION', 'FAILED_PARTITION', 'FAILED_MERGE', 'FAILED_VALIDATION',
    'QUARANTINED', 'VERIFIED', 'FAILED_DB_SYNC', 'PUBLISHED', 'FAILED_NOTIFICATION'
  )),
  UNIQUE (`workflow_id`, `run_group_key`, `attempt`)
);
--> statement-breakpoint
CREATE INDEX `idx_workflow_runs_group_status`
  ON `workflow_runs` (`workflow_id`, `run_group_key`, `status`, `attempt`);
--> statement-breakpoint
CREATE INDEX `idx_workflow_runs_target_status`
  ON `workflow_runs` (`workflow_id`, `target_as_of_date`, `status`, `published_at`);
--> statement-breakpoint
CREATE TABLE `workflow_staged_jobs` (
  `run_id` text NOT NULL REFERENCES `workflow_runs` (`run_id`) ON DELETE RESTRICT,
  `job_id` text NOT NULL,
  `canonical_job_key` text NOT NULL,
  `operation` text NOT NULL,
  `payload` text NOT NULL,
  `expected_before` text,
  `evidence` text NOT NULL DEFAULT '{}',
  `created_at` text NOT NULL,
  PRIMARY KEY (`run_id`, `job_id`, `operation`),
  CONSTRAINT `chk_workflow_staged_jobs_operation` CHECK (`operation` IN ('INSERT', 'UPDATE', 'END'))
);
--> statement-breakpoint
CREATE INDEX `idx_workflow_staged_jobs_run_operation`
  ON `workflow_staged_jobs` (`run_id`, `operation`);
--> statement-breakpoint
CREATE TABLE `workflow_publish_assertions` (
  `run_id` text PRIMARY KEY NOT NULL REFERENCES `workflow_runs` (`run_id`) ON DELETE RESTRICT,
  `ok` integer NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `chk_workflow_publish_assertion` CHECK (`ok` = 1)
);
--> statement-breakpoint
CREATE TABLE `workflow_publications` (
  `idempotency_key` text PRIMARY KEY NOT NULL,
  `run_id` text NOT NULL UNIQUE REFERENCES `workflow_runs` (`run_id`) ON DELETE RESTRICT,
  `manifest_checksum` text NOT NULL,
  `inserted_count` integer NOT NULL,
  `updated_count` integer NOT NULL,
  `ended_count` integer NOT NULL,
  `published_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_pointers` (
  `workflow_id` text NOT NULL,
  `pointer_name` text NOT NULL,
  `run_id` text NOT NULL REFERENCES `workflow_runs` (`run_id`) ON DELETE RESTRICT,
  `updated_at` text NOT NULL,
  PRIMARY KEY (`workflow_id`, `pointer_name`),
  CONSTRAINT `chk_workflow_pointer_name` CHECK (`pointer_name` IN ('current', 'last-success'))
);
--> statement-breakpoint
CREATE TABLE `workflow_notifications` (
  `run_id` text PRIMARY KEY NOT NULL REFERENCES `workflow_runs` (`run_id`) ON DELETE RESTRICT,
  `status` text NOT NULL,
  `attempt_count` integer NOT NULL DEFAULT 0,
  `payload_checksum` text,
  `last_error` text,
  `updated_at` text NOT NULL,
  CONSTRAINT `chk_workflow_notification_status` CHECK (`status` IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
  CONSTRAINT `chk_workflow_notification_attempt` CHECK (`attempt_count` >= 0)
);
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0037_careerground_jobs_v5_workflow',
  'sha256:ca8661ea422f28bb15cf9a9dc7302c8fb15c3668c3224a8b2f8a5691d0354caf',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(`version`) DO UPDATE SET
  `checksum` = excluded.`checksum`,
  `applied_at` = excluded.`applied_at`;
--> statement-breakpoint
PRAGMA optimize;
