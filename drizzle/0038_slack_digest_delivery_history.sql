CREATE TABLE `slack_digest_items` (
  `delivery_key` text NOT NULL REFERENCES `slack_digest_deliveries` (`delivery_key`) ON DELETE RESTRICT,
  `job_id` text NOT NULL,
  `company_key` text NOT NULL,
  `campaign_key` text NOT NULL,
  `role_key` text NOT NULL,
  `source_url` text NOT NULL,
  `company_name` text NOT NULL,
  `title` text NOT NULL,
  `application_start_at` text,
  `deadline_at` text,
  `delivered_at` text NOT NULL,
  PRIMARY KEY (`delivery_key`, `job_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_slack_digest_items_campaign_role`
  ON `slack_digest_items` (`company_key`, `campaign_key`, `role_key`, `delivered_at`);
--> statement-breakpoint
CREATE INDEX `idx_slack_digest_items_source_url`
  ON `slack_digest_items` (`source_url`, `delivered_at`);
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0038_slack_digest_delivery_history',
  'sha256:7ced2b9151cbeeb97cd51079893afa7fdfa7da4031519a3e46b8a2360c8e015a',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(`version`) DO UPDATE SET
  `checksum` = excluded.`checksum`,
  `applied_at` = excluded.`applied_at`;
--> statement-breakpoint
PRAGMA optimize;
