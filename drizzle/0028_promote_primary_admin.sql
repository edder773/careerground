-- Promote the primary operator immediately. ADMIN_EMAILS remains the durable
-- source of truth, while this migration avoids waiting for the next login.
INSERT OR IGNORE INTO `audit_logs`
  (`id`, `actor_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`)
SELECT
  'audit-admin-edder773-20260821',
  `id`,
  'USER_ROLE_SYNCED',
  'User',
  `id`,
  '{"from":"MEMBER","to":"ADMIN","source":"ADMIN_EMAILS_MIGRATION"}',
  '2026-08-21T01:11:23.859Z'
FROM `users`
WHERE lower(`email`) = 'edder773@gmail.com'
  AND `role` <> 'ADMIN';
--> statement-breakpoint
UPDATE `users`
SET
  `role` = 'ADMIN',
  `updated_at` = '2026-08-21T01:11:23.859Z'
WHERE lower(`email`) = 'edder773@gmail.com'
  AND `role` <> 'ADMIN';
--> statement-breakpoint
INSERT OR REPLACE INTO `app_schema_migrations` (`version`, `checksum`, `applied_at`)
VALUES (
  '0028_promote_primary_admin',
  'sha256:44b37c1ce035c9edebcb5b6cb6b49d2d7a8ac6a064feefc4aec1506e56152997',
  '2026-08-21T01:11:23.859Z'
);
--> statement-breakpoint
PRAGMA optimize;
