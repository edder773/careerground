ALTER TABLE `jobs` ADD `canonical_key` text GENERATED ALWAYS AS (
  CASE
     WHEN length(trim(coalesce(`source_posting_id`, ''))) > 0 THEN
       'source:' ||
       lower(
         substr(
           substr(`source_url`, instr(`source_url`, '://') + 3),
           1,
           instr(substr(`source_url`, instr(`source_url`, '://') + 3) || '/', '/') - 1
         )
       ) || ':' || lower(trim(`source_posting_id`))
     ELSE 'url:' || lower(trim(`source_url`))
  END
) VIRTUAL;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_jobs_canonical_key`
    ON `jobs` (`canonical_key`)
 WHERE `canonical_key` IS NOT NULL;
--> statement-breakpoint
CREATE TABLE `slack_digest_deliveries` (
  `delivery_key` text PRIMARY KEY NOT NULL,
  `delivery_mode` text NOT NULL,
  `status` text NOT NULL,
  `claim_token_hash` text NOT NULL,
  `payload` text NOT NULL,
  `payload_checksum` text NOT NULL,
  `attempt_count` integer DEFAULT 1 NOT NULL,
  `claimed_at` text NOT NULL,
  `completed_at` text,
  `failed_at` text,
  `last_error` text,
  CONSTRAINT `chk_slack_digest_delivery_mode`
    CHECK (`delivery_mode` IN ('DAILY', 'SNAPSHOT')),
  CONSTRAINT `chk_slack_digest_delivery_status`
    CHECK (`status` IN ('CLAIMED', 'SENT', 'FAILED', 'UNCERTAIN')),
  CONSTRAINT `chk_slack_digest_delivery_attempt_count`
    CHECK (`attempt_count` >= 1)
);
--> statement-breakpoint
CREATE INDEX `idx_slack_digest_deliveries_status_claimed`
    ON `slack_digest_deliveries` (`status`, `claimed_at`);
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0033_fix_sql_problem_classification_20260825',
  'sha256:58d3ad7e8869e5cc94e9f4a5ed53b5c368dc2b67994ce35e0043f8ecc4e95dd2',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(`version`) DO NOTHING;
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0034_migration_authority_and_delivery_integrity',
  'sha256:f67834f4d70094941c682f94ad726066d4ffeb7f9380d7cbf5c18783191eee56',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(`version`) DO UPDATE SET
  `checksum` = excluded.`checksum`,
  `applied_at` = excluded.`applied_at`;
--> statement-breakpoint
PRAGMA optimize;
