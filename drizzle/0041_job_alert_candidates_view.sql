-- Stable minimal alert projection. Existing job rows and delivery ledgers remain intact.
CREATE VIEW `job_alert_candidates` AS
SELECT `id` AS `job_id`, `company_name`, `title`, `source_name`, `source_url`,
       `application_start_at`, `deadline_at`, `status`, `career_scope`,
       `rolling`, `created_at`
  FROM `jobs`;
--> statement-breakpoint
INSERT INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES ('0041_job_alert_candidates_view', 'sha256:3ca4931376cca0ff5ad0be0a87bd065e5451a880a7f9307caf452468cef49e93',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT(`version`) DO UPDATE SET
  `checksum` = excluded.`checksum`,
  `applied_at` = excluded.`applied_at`;
--> statement-breakpoint
PRAGMA optimize;
