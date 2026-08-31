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
  orphanSavedJobs: `SELECT COUNT(*) AS count FROM saved_jobs sj
    LEFT JOIN users u ON u.id = sj.user_id LEFT JOIN jobs j ON j.id = sj.job_id
    WHERE u.id IS NULL OR j.id IS NULL`,
  orphanProblemProgress: `SELECT COUNT(*) AS count FROM problem_progress pp
    LEFT JOIN users u ON u.id = pp.user_id
    LEFT JOIN coding_problems p ON p.id = pp.problem_id
    WHERE u.id IS NULL OR p.id IS NULL`,
  orphanSolutions: `SELECT COUNT(*) AS count FROM solutions s
    LEFT JOIN users u ON u.id = s.author_id
    LEFT JOIN coding_problems p ON p.id = s.problem_id
    WHERE u.id IS NULL OR p.id IS NULL`,
  orphanComments: `SELECT COUNT(*) AS count FROM solution_comments c
    LEFT JOIN users u ON u.id = c.author_id LEFT JOIN solutions s ON s.id = c.solution_id
    WHERE u.id IS NULL OR s.id IS NULL`,
  crossSolutionReplies: `SELECT COUNT(*) AS count FROM solution_comments reply
    JOIN solution_comments parent ON parent.id = reply.parent_id
    WHERE reply.solution_id <> parent.solution_id`,
  crossUserFolderParents: `SELECT COUNT(*) AS count FROM collections child
    JOIN collections parent ON parent.id = child.parent_id
    WHERE child.user_id <> parent.user_id`,
  invalidCollectionTargets: `SELECT COUNT(*) AS count FROM collection_items item
    JOIN collections folder ON folder.id = item.collection_id
    LEFT JOIN jobs job ON item.item_type = 'JOB_POSTING' AND job.id = item.target_id
    LEFT JOIN coding_problems problem ON item.item_type = 'CODING_PROBLEM' AND problem.id = item.target_id
    LEFT JOIN learning_units unit ON item.item_type = 'LEARNING_UNIT' AND unit.id = item.target_id
    LEFT JOIN solutions solution ON item.item_type = 'SOLUTION' AND solution.id = item.target_id
    WHERE (item.item_type = 'JOB_POSTING' AND job.id IS NULL)
       OR (item.item_type = 'CODING_PROBLEM' AND problem.id IS NULL)
       OR (item.item_type = 'LEARNING_UNIT' AND unit.id IS NULL)
       OR (item.item_type = 'SOLUTION' AND solution.id IS NULL)
       OR (item.item_type = 'EXTERNAL_LINK' AND item.target_id NOT LIKE 'https://%')`,
  duplicateJobUrls: `SELECT COUNT(*) AS count FROM (
    SELECT source_url FROM jobs GROUP BY source_url HAVING COUNT(*) > 1)`,
  duplicateJobFingerprints: `SELECT COUNT(*) AS count FROM (
    SELECT fingerprint FROM jobs WHERE fingerprint IS NOT NULL
    GROUP BY fingerprint HAVING COUNT(*) > 1)`,
  duplicateCanonicalJobKeys: `SELECT COUNT(*) AS count FROM (
    SELECT canonical_key FROM jobs WHERE canonical_key IS NOT NULL
    GROUP BY canonical_key HAVING COUNT(*) > 1)`,
  duplicateLearningPackages: `SELECT COUNT(*) AS count FROM (
    SELECT source_checksum, source_version FROM learning_sources
    WHERE source_checksum IS NOT NULL AND source_version IS NOT NULL
    GROUP BY source_checksum, source_version HAVING COUNT(*) > 1)`,
  invalidJsonFields: `SELECT
    (SELECT COUNT(*) FROM jobs WHERE json_valid(tech_stack) = 0) +
    (SELECT COUNT(*) FROM coding_problems WHERE json_valid(tags) = 0) +
    (SELECT COUNT(*) FROM learning_units WHERE json_valid(concepts) = 0) AS count`,
  invalidProblemProgress: `SELECT COUNT(*) AS count FROM problem_progress
    WHERE status NOT IN ('UNTRIED', 'IN_PROGRESS', 'SOLVED')
       OR favorite NOT IN (0, 1)`,
  invalidApplicationStatus: `SELECT COUNT(*) AS count FROM saved_jobs
    WHERE status NOT IN ('INTERESTED', 'APPLIED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')
       OR bookmarked NOT IN (0, 1)`,
  expiredUnconsumedPreviews: `SELECT COUNT(*) AS count FROM import_previews
    WHERE consumed_at IS NULL AND expires_at < datetime('now')`,
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
     WHERE version = '0038_slack_digest_delivery_history'
       AND checksum = 'sha256:7ced2b9151cbeeb97cd51079893afa7fdfa7da4031519a3e46b8a2360c8e015a'
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
  ['users', 'jobs', 'coding_problems', 'solutions', 'solution_comments', 'notifications'].map(
    (table) => [
      table,
      Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count),
    ],
  ),
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
