import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { all, first, run } from './d1.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

describe('Sites runtime schema', () => {
  let db: LocalD1;

  beforeEach(async () => {
    db = new LocalD1();
    await run(
      db,
      "DELETE FROM app_schema_migrations WHERE version = '0021_separate_job_schedule_dates'",
    );
    await run(db, 'DROP TABLE workspace_search');
    for (const table of [
      'job_source_snapshot_items',
      'job_source_snapshots',
      'job_tech_stacks',
      'learning_question_attempts',
      'learning_review_events',
      'scheduler_leases',
    ]) {
      await run(db, `DROP TABLE ${table}`);
    }
    await run(db, 'DROP TABLE learning_progress');
    await run(
      db,
      `CREATE TABLE learning_progress (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        unit_id text NOT NULL,
        completed integer DEFAULT 0 NOT NULL,
        understanding integer,
        last_studied_at text,
        next_review_at text,
        repetition_count integer DEFAULT 0 NOT NULL,
        interval_days integer DEFAULT 1 NOT NULL,
        updated_at text NOT NULL
      )`,
    );
  });

  afterEach(() => db.close());

  it('upgrades the legacy production shape and backfills searchable shared data idempotently', async () => {
    await ensureRuntimeSchema(db);
    const tables = await all<{ name: string }>(
      db,
      `SELECT name FROM sqlite_schema
       WHERE type IN ('table', 'view') AND name IN (
         'workspace_search', 'job_source_snapshot_items', 'job_source_snapshots',
         'job_tech_stacks', 'learning_question_attempts', 'learning_review_events',
         'scheduler_leases'
       )`,
    );
    expect(new Set(tables.map((table) => table.name))).toEqual(
      new Set([
        'workspace_search',
        'job_source_snapshot_items',
        'job_source_snapshots',
        'job_tech_stacks',
        'learning_question_attempts',
        'learning_review_events',
        'scheduler_leases',
      ]),
    );

    const progressColumns = await all<{ name: string }>(db, 'PRAGMA table_info(learning_progress)');
    expect(progressColumns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['review_version', 'completed_at', 'mastered_at']),
    );
    const jobColumns = await all<{ name: string }>(db, 'PRAGMA table_info(jobs)');
    expect(jobColumns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['published_at', 'application_start_at']),
    );

    const removedNotes = await first<{ tables: number; items: number; constraints: number }>(
      db,
      `SELECT
         (SELECT COUNT(*) FROM sqlite_schema
           WHERE type = 'table' AND name IN ('notes', 'note_revisions')) AS tables,
         (SELECT COUNT(*) FROM collection_items WHERE item_type = 'NOTE') AS items,
         (SELECT COUNT(*) FROM sqlite_schema
           WHERE type = 'table' AND name = 'collection_items' AND sql LIKE '%''NOTE''%') AS constraints`,
    );
    expect(removedNotes).toEqual({ tables: 0, items: 0, constraints: 0 });

    const searchCountBefore = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM workspace_search',
    );
    expect(Number(searchCountBefore?.count)).toBeGreaterThan(0);
    const jobResults = await all<{ kind: string }>(
      db,
      `SELECT kind FROM workspace_search WHERE workspace_search MATCH '"퓨전소프트"*'`,
    );
    expect(jobResults.some((result) => result.kind === 'jobs')).toBe(true);

    await ensureRuntimeSchema(db);
    const searchCountAfter = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM workspace_search',
    );
    expect(searchCountAfter?.count).toBe(searchCountBefore?.count);
  });
});

describe('Sites production migration baseline', () => {
  it('applies the packaged forward migrations after the existing 0016 schema without replaying history', async () => {
    const root = mkdtempSync(join(tmpdir(), 'careerground-sites-migration-'));
    const baselineDirectory = join(root, 'baseline');
    const forwardDirectory = join(root, 'forward');
    const databasePath = join(root, 'production-baseline.sqlite');
    mkdirSync(baselineDirectory);
    mkdirSync(forwardDirectory);

    try {
      const migrations = readdirSync('drizzle')
        .filter((file) => /^\d{4}_.+\.sql$/.test(file))
        .sort();
      for (const migration of migrations.filter((file) => Number(file.slice(0, 4)) < 17)) {
        copyFileSync(join('drizzle', migration), join(baselineDirectory, migration));
      }
      for (const migration of migrations.filter((file) => Number(file.slice(0, 4)) >= 17)) {
        copyFileSync(join('drizzle', migration), join(forwardDirectory, migration));
      }

      const baseline = new LocalD1(databasePath, baselineDirectory);
      await run(
        baseline,
        `INSERT INTO users
          (id, site_user_id, email, display_name, role, is_active, preferred_language,
           ranking_opt_in, comment_notifications, deadline_notifications, review_notifications,
           created_at, updated_at)
         VALUES ('note-owner', 'note-owner', 'note-owner@example.test', 'Note Owner',
                 'MEMBER', 1, 'javascript', 1, 1, 1, 1, '2026-08-15', '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO collections
          (id, user_id, name, icon, color, position, created_at, updated_at)
         VALUES ('note-folder', 'note-owner', '기존 노트 폴더', 'folder', 'amber', 0,
                 '2026-08-15', '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO notes
          (id, user_id, title, markdown, visibility, current_rev, created_at, updated_at)
         VALUES ('note-to-delete', 'note-owner', '삭제 대상', '백업하지 않을 원문',
                 'PRIVATE', 1, '2026-08-15', '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO note_revisions (id, note_id, revision, markdown, created_at)
         VALUES ('note-revision-to-delete', 'note-to-delete', 1, '백업하지 않을 원문',
                 '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO collection_items
          (id, collection_id, item_type, target_id, label, position, created_at)
         VALUES ('note-item-to-delete', 'note-folder', 'NOTE', 'note-to-delete', '삭제 대상', 0,
                  '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO saved_jobs
          (id, user_id, job_id, status, bookmarked, memo, created_at, updated_at)
         SELECT 'legacy-saved-job', 'note-owner', id, 'INTERESTED', 1, '',
                '2026-08-15', '2026-08-15'
           FROM jobs LIMIT 1`,
      );
      await run(
        baseline,
        `INSERT INTO collection_items
          (id, collection_id, item_type, target_id, label, position, created_at)
         SELECT 'legacy-job-item', 'note-folder', 'JOB_POSTING', id, title, 1, '2026-08-15'
           FROM jobs LIMIT 1`,
      );
      await run(
        baseline,
        `INSERT INTO notifications
          (id, user_id, type, title, message, href, created_at)
         VALUES ('legacy-job-notification', 'note-owner', 'JOB_DEADLINE', '마감 알림',
                 '기존 공고 알림', '/jobs', '2026-08-15')`,
      );
      const countBefore = await first<{ count: number }>(
        baseline,
        'SELECT COUNT(*) AS count FROM learning_questions',
      );
      baseline.close();

      const upgraded = new LocalD1(databasePath, forwardDirectory);
      const schema = await first<{
        questions: number;
        learningColumns: number;
        publishedColumn: number;
        applicationStartColumn: number;
        scheduleIndexes: number;
        legacyCalendarIndexes: number;
        notificationIndex: number;
        feedIndex: number;
        categoryIndex: number;
        removedNoteTables: number;
        noteItems: number;
        jobs: number;
        visibleJobs: number;
        reviewJobs: number;
        savedJobs: number;
        jobItems: number;
        jobDeadlineNotifications: number;
        jobSearchRows: number;
        jobTechRows: number;
        orphanTechRows: number;
        jobImportBatches: number;
        checksum: string;
        replacementChecksum: string;
      }>(
        upgraded,
        `SELECT (SELECT COUNT(*) FROM learning_questions) AS questions,
                (SELECT COUNT(*) FROM pragma_table_info('learning_questions')
                  WHERE name IN ('type', 'choices')) AS learningColumns,
                (SELECT COUNT(*) FROM pragma_table_info('jobs')
                  WHERE name = 'published_at') AS publishedColumn,
                (SELECT COUNT(*) FROM pragma_table_info('jobs')
                  WHERE name = 'application_start_at') AS applicationStartColumn,
                (SELECT COUNT(*) FROM pragma_index_list('jobs')
                  WHERE name IN (
                    'idx_jobs_calendar_published', 'idx_jobs_calendar_application_start'
                  )) AS scheduleIndexes,
                (SELECT COUNT(*) FROM pragma_index_list('jobs')
                  WHERE name IN (
                    'idx_jobs_calendar_collected', 'idx_jobs_calendar_created'
                  )) AS legacyCalendarIndexes,
                (SELECT COUNT(*) FROM pragma_index_list('notifications')
                  WHERE name = 'idx_notifications_user_read_expiry_created') AS notificationIndex,
                (SELECT COUNT(*) FROM pragma_index_list('jobs')
                  WHERE name = 'idx_jobs_feed_collected_id') AS feedIndex,
                (SELECT COUNT(*) FROM pragma_index_list('jobs')
                  WHERE name = 'idx_jobs_active_category') AS categoryIndex,
                (SELECT COUNT(*) FROM sqlite_schema
                  WHERE type = 'table' AND name IN ('notes', 'note_revisions')) AS removedNoteTables,
                 (SELECT COUNT(*) FROM collection_items WHERE item_type = 'NOTE') AS noteItems,
                 (SELECT COUNT(*) FROM jobs) AS jobs,
                 (SELECT COUNT(*) FROM jobs
                   WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')) AS visibleJobs,
                 (SELECT COUNT(*) FROM jobs WHERE status = 'NEEDS_REVIEW') AS reviewJobs,
                 (SELECT COUNT(*) FROM saved_jobs) AS savedJobs,
                 (SELECT COUNT(*) FROM collection_items
                   WHERE item_type = 'JOB_POSTING') AS jobItems,
                 (SELECT COUNT(*) FROM notifications
                   WHERE type = 'JOB_DEADLINE') AS jobDeadlineNotifications,
                 (SELECT COUNT(*) FROM workspace_search WHERE kind = 'jobs') AS jobSearchRows,
                 (SELECT COUNT(*) FROM job_tech_stacks) AS jobTechRows,
                 (SELECT COUNT(*) FROM job_tech_stacks AS stack
                   LEFT JOIN jobs ON jobs.id = stack.job_id
                   WHERE jobs.id IS NULL) AS orphanTechRows,
                 (SELECT COUNT(*) FROM import_batches WHERE kind = 'jobs') AS jobImportBatches,
                 (SELECT checksum FROM app_schema_migrations
                   WHERE version = '0018_sloppy_leech') AS checksum,
                 (SELECT checksum FROM app_schema_migrations
                   WHERE version = '0020_replace_job_catalog_20260814_verified') AS replacementChecksum`,
      );

      expect(schema).toEqual({
        questions: countBefore?.count,
        learningColumns: 2,
        publishedColumn: 1,
        applicationStartColumn: 1,
        scheduleIndexes: 2,
        legacyCalendarIndexes: 0,
        notificationIndex: 1,
        feedIndex: 1,
        categoryIndex: 1,
        removedNoteTables: 0,
        noteItems: 0,
        jobs: 51,
        visibleJobs: 51,
        reviewJobs: 0,
        savedJobs: 0,
        jobItems: 0,
        jobDeadlineNotifications: 0,
        jobSearchRows: 51,
        jobTechRows: expect.any(Number),
        orphanTechRows: 0,
        jobImportBatches: 1,
        checksum: 'sha256:86c1de85559a9b51e959bf7c423ad8a9e9afd3586ad672c2ec32da009057fe4b',
        replacementChecksum: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      });
      expect(schema?.jobTechRows).toBeGreaterThan(0);
      for (const indexName of [
        'idx_jobs_calendar_published',
        'idx_jobs_calendar_application_start',
      ]) {
        const plan = await all<{ detail: string }>(
          upgraded,
          `EXPLAIN QUERY PLAN
           SELECT id FROM jobs INDEXED BY ${indexName}
            WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
              AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
              AND ${indexName.endsWith('published') ? 'published_at' : 'application_start_at'} >= '2026-08-01T00:00:00.000Z'`,
        );
        expect(plan.some((row) => row.detail.includes(`USING INDEX ${indexName}`))).toBe(true);
      }
      await expect(
        run(
          upgraded,
          `INSERT INTO learning_questions
             (id, unit_id, prompt, answer, type, choices, created_at)
           SELECT 'invalid-type', id, 'prompt', 'answer', 'INVALID', '[]', created_at
             FROM learning_units LIMIT 1`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/);
      upgraded.close();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 15_000);
});
