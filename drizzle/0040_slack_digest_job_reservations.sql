CREATE TABLE `slack_digest_job_reservations` (
  `delivery_key` text NOT NULL REFERENCES `slack_digest_deliveries` (`delivery_key`) ON DELETE RESTRICT,
  `job_id` text NOT NULL,
  `status` text NOT NULL CHECK (`status` IN ('CLAIMED', 'SENT', 'UNCERTAIN', 'RELEASED')),
  `claimed_at` text NOT NULL,
  `settled_at` text,
  PRIMARY KEY (`delivery_key`, `job_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_slack_digest_job_reservations_active_job`
  ON `slack_digest_job_reservations` (`job_id`)
  WHERE `status` IN ('CLAIMED', 'SENT', 'UNCERTAIN');
--> statement-breakpoint
INSERT INTO `slack_digest_job_reservations`
  (`delivery_key`, `job_id`, `status`, `claimed_at`, `settled_at`)
SELECT item.`delivery_key`, item.`job_id`, 'SENT', item.`delivered_at`, item.`delivered_at`
  FROM `slack_digest_items` item
 WHERE NOT EXISTS (
   SELECT 1
     FROM `slack_digest_items` earlier
    WHERE earlier.`job_id` = item.`job_id`
      AND (
        earlier.`delivered_at` < item.`delivered_at`
        OR (earlier.`delivered_at` = item.`delivered_at` AND earlier.`delivery_key` < item.`delivery_key`)
      )
 );
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0040_slack_digest_job_reservations',
  'sha256:427d0b652bba719fa696733ae4f18d5157f164a36666c2fa432193844a831029',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(`version`) DO UPDATE SET
  `checksum` = excluded.`checksum`,
  `applied_at` = excluded.`applied_at`;
--> statement-breakpoint
PRAGMA optimize;
