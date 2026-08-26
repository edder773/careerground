import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { backup, DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { LocalD1 } from '../../deployment/sites/local-d1.js';

const tableNames = [
  'users',
  'collections',
  'collection_items',
  'jobs',
  'saved_jobs',
  'coding_problems',
  'problem_progress',
  'solutions',
  'solution_comments',
  'solution_reactions',
  'solution_revisions',
  'learning_sources',
  'learning_units',
  'learning_progress',
  'learning_questions',
  'learning_question_attempts',
  'learning_review_events',
  'flashcards',
  'notifications',
  'audit_logs',
  'daily_challenge_settings',
  'daily_challenges',
  'daily_challenge_participations',
  'import_batches',
  'import_previews',
  'job_tech_stacks',
  'job_source_snapshots',
  'job_source_snapshot_items',
  'request_rate_limits',
  'scheduler_leases',
  'slack_digest_deliveries',
  'app_schema_migrations',
];

function tableCounts(database) {
  return Object.fromEntries(
    tableNames.map((table) => [
      table,
      Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count),
    ]),
  );
}

function contentChecksum(database) {
  const fixture = {
    collections: database
      .prepare(
        `SELECT id, user_id AS userId, name, icon, color, position
           FROM collections WHERE id = 'restore-drill-collection'`,
      )
      .all(),
    deliveries: database
      .prepare(
        `SELECT delivery_key AS deliveryKey, status, payload_checksum AS payloadChecksum
           FROM slack_digest_deliveries WHERE delivery_key = 'daily:2099-01-01'`,
      )
      .all(),
    authority: database
      .prepare(
        `SELECT version, checksum FROM app_schema_migrations
          WHERE version = '0034_migration_authority_and_delivery_integrity'`,
      )
      .all(),
  };
  return createHash('sha256').update(JSON.stringify(fixture)).digest('hex');
}

function verify(database) {
  const integrity = database.prepare('PRAGMA integrity_check').all();
  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all();
  return {
    integrity: integrity.every((row) => row.integrity_check === 'ok') ? 'ok' : integrity,
    foreignKeyViolationCount: foreignKeyViolations.length,
    tableCounts: tableCounts(database),
    fixtureChecksum: contentChecksum(database),
  };
}

const workingDirectory = await mkdtemp(join(tmpdir(), 'careerground-restore-drill-'));
const sourcePath = join(workingDirectory, 'source.sqlite');
const snapshotPath = join(workingDirectory, 'snapshot.sqlite');
const restoredPath = join(workingDirectory, 'restored.sqlite');

try {
  const source = new LocalD1(sourcePath);
  const timestamp = new Date().toISOString();
  await source
    .prepare(
      `INSERT INTO users
         (id, site_user_id, email, display_name, role, is_active, preferred_language,
          onboarding_completed_at, ranking_opt_in, comment_notifications,
          deadline_notifications, review_notifications, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'MEMBER', 1, 'javascript', ?, 1, 1, 1, 1, ?, ?)`,
    )
    .bind(
      'restore-drill-user',
      'restore-drill-user',
      'restore-drill@example.invalid',
      'Restore Drill',
      timestamp,
      timestamp,
      timestamp,
    )
    .run();
  await source
    .prepare(
      `INSERT INTO slack_digest_deliveries
         (delivery_key, delivery_mode, status, claim_token_hash, payload, payload_checksum,
          attempt_count, claimed_at, completed_at)
       VALUES ('daily:2099-01-01', 'DAILY', 'SENT', ?, '{}', ?, 1, ?, ?)`,
    )
    .bind('a'.repeat(64), 'b'.repeat(64), timestamp, timestamp)
    .run();
  await source
    .prepare(
      `INSERT INTO collections
         (id, user_id, name, icon, color, position, created_at, updated_at)
       VALUES ('restore-drill-collection', 'restore-drill-user', '복구 훈련',
               'folder', 'amber', 0, ?, ?)`,
    )
    .bind(timestamp, timestamp)
    .run();
  source.close();

  const sourceDatabase = new DatabaseSync(sourcePath, { readOnly: true });
  const before = verify(sourceDatabase);
  const snapshotStartedAt = performance.now();
  const snapshotPages = await backup(sourceDatabase, snapshotPath);
  const snapshotDurationMs = performance.now() - snapshotStartedAt;
  sourceDatabase.close();

  const snapshotDatabase = new DatabaseSync(snapshotPath, { readOnly: true });
  const restoreStartedAt = performance.now();
  const restorePages = await backup(snapshotDatabase, restoredPath);
  const restoreDurationMs = performance.now() - restoreStartedAt;
  snapshotDatabase.close();

  const restoredDatabase = new DatabaseSync(restoredPath, { readOnly: true });
  const after = verify(restoredDatabase);
  restoredDatabase.close();
  const snapshotBytes = (await stat(snapshotPath)).size;

  const countMismatch = tableNames.filter(
    (table) => before.tableCounts[table] !== after.tableCounts[table],
  );
  const passed =
    before.integrity === 'ok' &&
    after.integrity === 'ok' &&
    before.foreignKeyViolationCount === 0 &&
    after.foreignKeyViolationCount === 0 &&
    before.fixtureChecksum === after.fixtureChecksum &&
    countMismatch.length === 0;
  const report = {
    schema: 'careerground-recovery-drill/v1',
    checkedAt: new Date().toISOString(),
    scope: 'local D1-compatible SQLite snapshot and isolated restore',
    status: passed ? 'pass' : 'fail',
    snapshot: {
      bytes: snapshotBytes,
      pages: snapshotPages,
      durationMs: Number(snapshotDurationMs.toFixed(2)),
    },
    restore: {
      pages: restorePages,
      durationMs: Number(restoreDurationMs.toFixed(2)),
      rpoMutations: 0,
    },
    integrity: {
      before: before.integrity,
      after: after.integrity,
      foreignKeyViolationsBefore: before.foreignKeyViolationCount,
      foreignKeyViolationsAfter: after.foreignKeyViolationCount,
      countMismatch,
      fixtureChecksumMatched: before.fixtureChecksum === after.fixtureChecksum,
    },
    tableCounts: after.tableCounts,
    limitations: [
      'Sites does not expose a production database export/restore operation through the installed connector.',
      'This drill validates the application schema and D1-compatible SQLite recovery path without copying production personal data.',
    ],
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  process.stdout.write(serialized);
  if (process.env.RECOVERY_OUTPUT_FILE) {
    const outputPath = resolve(process.env.RECOVERY_OUTPUT_FILE);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, serialized, 'utf8');
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        '## D1-compatible recovery drill',
        '',
        `- Result: **${report.status.toUpperCase()}**`,
        `- Snapshot: ${report.snapshot.pages} pages / ${report.snapshot.bytes} bytes / ${report.snapshot.durationMs} ms`,
        `- Restore: ${report.restore.pages} pages / ${report.restore.durationMs} ms`,
        `- RPO mutation: ${report.restore.rpoMutations}`,
        `- Foreign key violations: ${report.integrity.foreignKeyViolationsAfter}`,
        '',
      ].join('\n'),
      'utf8',
    );
  }
  if (!passed) process.exitCode = 1;
} finally {
  await rm(workingDirectory, { recursive: true, force: true });
}
