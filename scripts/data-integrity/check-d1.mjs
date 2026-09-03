/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const sourcePath = process.argv[2];
if (!sourcePath || !existsSync(sourcePath)) {
  console.error('Usage: node scripts/data-integrity/check-d1.mjs <D1-export.sql|database.sqlite>');
  process.exit(64);
}

const database = new DatabaseSync(sourcePath.endsWith('.sql') ? ':memory:' : sourcePath, {
  readOnly: !sourcePath.endsWith('.sql'),
});
if (sourcePath.endsWith('.sql')) database.exec(readFileSync(sourcePath, 'utf8'));
database.exec('PRAGMA foreign_keys = ON');

const checks = {
  foreignKeyViolations: `SELECT COUNT(*) AS count FROM pragma_foreign_key_check`,
  duplicateJobUrls: `SELECT COUNT(*) AS count FROM (
    SELECT source_url FROM jobs GROUP BY source_url HAVING COUNT(*) > 1)`,
  duplicateJobFingerprints: `SELECT COUNT(*) AS count FROM (
    SELECT fingerprint FROM jobs WHERE fingerprint IS NOT NULL
    GROUP BY fingerprint HAVING COUNT(*) > 1)`,
  duplicateCanonicalJobKeys: `SELECT COUNT(*) AS count FROM (
    SELECT canonical_key FROM jobs WHERE canonical_key IS NOT NULL
    GROUP BY canonical_key HAVING COUNT(*) > 1)`,
  invalidJsonFields: `SELECT
    (SELECT COUNT(*) FROM jobs WHERE json_valid(tech_stack) = 0) +
    (SELECT COUNT(*) FROM coding_problems WHERE json_valid(tags) = 0) AS count`,
  invalidWorkflowPointers: `SELECT COUNT(*) AS count FROM workflow_pointers
    WHERE pointer_name NOT IN ('current', 'last-success')`,
  invalidWorkflowNotifications: `SELECT COUNT(*) AS count FROM workflow_notifications
    WHERE status NOT IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED') OR attempt_count < 0`,
  invalidWorkflowAssertions: `SELECT COUNT(*) AS count FROM workflow_publish_assertions
    WHERE ok <> 1`,
  invalidSlackDigestDeliveries: `SELECT COUNT(*) AS count FROM slack_digest_deliveries
    WHERE status NOT IN ('CLAIMED', 'SENT', 'FAILED', 'UNCERTAIN')
       OR delivery_mode NOT IN ('DAILY', 'SNAPSHOT')
       OR attempt_count < 1
       OR length(claim_token_hash) <> 64
       OR length(payload_checksum) <> 64`,
  invalidSlackDigestItems: `SELECT COUNT(*) AS count FROM slack_digest_items item
    LEFT JOIN slack_digest_deliveries delivery ON delivery.delivery_key = item.delivery_key
    WHERE delivery.delivery_key IS NULL OR delivery.status <> 'SENT'
       OR length(trim(item.company_key)) = 0 OR length(trim(item.campaign_key)) = 0
       OR length(trim(item.role_key)) = 0 OR length(trim(item.source_url)) = 0`,
  missingMigrationAuthority: `SELECT CASE WHEN EXISTS (
    SELECT 1 FROM app_schema_migrations
     WHERE version = '0039_retire_legacy_product_surface'
       AND checksum = 'sha256:3ed76a3f8082ad34477ed903b31bb7743e2df6e70c2202c5788f964be39d5816'
  ) THEN 0 ELSE 1 END AS count`,
};

const results = Object.fromEntries(
  Object.entries(checks).map(([name, sql]) => {
    const row = database.prepare(sql).get();
    return [name, Number(row?.count || 0)];
  }),
);
const violations = Object.values(results).reduce((sum, value) => sum + value, 0);
const tableCounts = Object.fromEntries(
  ['jobs', 'coding_problems', 'workflow_runs', 'slack_digest_deliveries'].map((table) => [
    table,
    Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count),
  ]),
);

console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      source: sourcePath.endsWith('.sql') ? 'D1 SQL export' : 'SQLite database',
      tableCounts,
      checks: results,
      status: violations === 0 ? 'pass' : 'fail',
      violationCount: violations,
    },
    null,
    2,
  ),
);
database.close();
if (violations > 0) process.exitCode = 2;
