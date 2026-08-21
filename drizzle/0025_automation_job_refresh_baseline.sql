INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES (
  '0025_automation_job_refresh_baseline',
  'sha256:42f7b2e791cbab09bd682bbf54a43030811e1739f01f937b9d9a246d6eacaefe',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
--> statement-breakpoint
PRAGMA optimize;
