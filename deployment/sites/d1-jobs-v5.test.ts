import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalD1 } from './local-d1.js';
import { first, run } from './d1.js';
import {
  publishVerifiedRun,
  publishedManifestForNotification,
  stageVerifiedRun,
  type V5Manifest,
} from './d1-jobs-v5.js';
import { orchestrate } from '../../scripts/jobs-v5/orchestrate.mjs';

const fixtureDirectory = resolve('scripts/jobs-v5/fixtures');
const config = (name: string) => resolve('config', name);

async function publishFixture(attempt = 1, suffix = `publish${attempt}`) {
  const runId = `CG-2026-08-27-A${attempt}-${suffix}`;
  const directory = mkdtempSync(join(tmpdir(), 'cg-v5-publish-'));
  mkdirSync(directory, { recursive: true });
  const partitionPaths = [1, 2, 3].map((partitionId) => {
    const value = JSON.parse(
      readFileSync(join(fixtureDirectory, `partition-${partitionId}.json`), 'utf8'),
    ) as Record<string, unknown>;
    value.runId = runId;
    const path = join(directory, `artifact-copy-${partitionId} (1).json`);
    writeFileSync(path, JSON.stringify(value, null, 2));
    return path;
  });
  return orchestrate({
    targetAsOfDate: '2026-08-27',
    attempt,
    mode: 'PUBLISH',
    runId,
    partitionPaths,
    baselinePath: join(fixtureDirectory, 'baseline.json'),
    holidayCachePath: config('careerground-holidays-2026.json'),
    validationPolicyPath: config('careerground-validation-policy.json'),
  }) as Promise<{ manifest: V5Manifest; verified: Parameters<typeof stageVerifiedRun>[2] }>;
}

async function addSavedJobSentinel(db: LocalD1) {
  await run(
    db,
    `INSERT INTO users
      (id, site_user_id, email, display_name, role, is_active, preferred_language, ranking_opt_in,
       comment_notifications, deadline_notifications, review_notifications, created_at, updated_at)
     VALUES ('v5-sentinel', 'v5-sentinel', 'sentinel@example.test', 'Sentinel', 'MEMBER', 1, 'javascript',
             1, 1, 1, 1, '2026-08-27', '2026-08-27')`,
  );
  await run(
    db,
    `INSERT INTO saved_jobs (id, user_id, job_id, status, bookmarked, memo, created_at, updated_at)
     SELECT 'v5-saved-sentinel', 'v5-sentinel', id, 'INTERESTED', 1, '', '2026-08-27',
            '2026-08-27' FROM jobs LIMIT 1`,
  );
}

describe('CareerGround v5 D1 staging and publication', () => {
  it('publishes a VERIFIED run atomically and is idempotent', async () => {
    const db = new LocalD1();
    try {
      await addSavedJobSentinel(db);
      db.resetPreparedSql();
      const { manifest, verified } = await publishFixture();
      await stageVerifiedRun(db, manifest, verified);
      const before = await first<{ jobs: number; saved: number }>(
        db,
        `SELECT (SELECT COUNT(*) FROM jobs) AS jobs,
                (SELECT COUNT(*) FROM saved_jobs) AS saved`,
      );
      const firstPublish = await publishVerifiedRun(db, manifest);
      const secondPublish = await publishVerifiedRun(db, manifest);
      const after = await first<{
        jobs: number;
        saved: number;
        publications: number;
        batches: number;
        lastSuccess: string;
      }>(
        db,
        `SELECT (SELECT COUNT(*) FROM jobs) AS jobs,
                (SELECT COUNT(*) FROM saved_jobs) AS saved,
                (SELECT COUNT(*) FROM workflow_publications WHERE run_id = ?) AS publications,
                (SELECT COUNT(*) FROM import_batches WHERE id = ?) AS batches,
                (SELECT run_id FROM workflow_pointers
                  WHERE workflow_id = ? AND pointer_name = 'last-success') AS lastSuccess`,
        manifest.runId,
        `jobs-v5-${manifest.runId}`,
        manifest.workflowId,
      );
      expect(firstPublish.status).toBe('PUBLISHED');
      expect(secondPublish.status).toBe('ALREADY_PUBLISHED');
      await expect(
        publishedManifestForNotification(db, manifest.workflowId, '2026-08-26'),
      ).rejects.toThrow('target date');
      const notificationManifest = await publishedManifestForNotification(
        db,
        manifest.workflowId,
        manifest.targetAsOfDate,
      );
      expect(notificationManifest).toMatchObject({
        status: 'PUBLISHED',
        targetAsOfDate: manifest.targetAsOfDate,
        db: { status: 'PUBLISHED' },
      });
      expect(after).toEqual({
        jobs: Number(before?.jobs) + 3,
        saved: before?.saved,
        publications: 1,
        batches: 1,
        lastSuccess: manifest.runId,
      });
      expect(db.preparedSql.join('\n')).not.toMatch(
        /(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?saved_jobs/iu,
      );
      expect(db.preparedSql.join('\n')).not.toMatch(/DELETE\s+FROM\s+jobs/iu);
    } finally {
      db.close();
    }
  });

  it('rolls back a middle-of-batch failure and preserves the previous last-success', async () => {
    const db = new LocalD1();
    try {
      const { manifest, verified } = await publishFixture(2);
      await stageVerifiedRun(db, manifest, verified);
      const before = await first<{ jobs: number }>(db, 'SELECT COUNT(*) AS jobs FROM jobs');
      db.failNextBatch(1);
      await expect(publishVerifiedRun(db, manifest)).rejects.toThrow('injected D1 batch failure');
      const after = await first<{ jobs: number; publications: number; lastSuccess: number }>(
        db,
        `SELECT (SELECT COUNT(*) FROM jobs) AS jobs,
                (SELECT COUNT(*) FROM workflow_publications WHERE run_id = ?) AS publications,
                (SELECT COUNT(*) FROM workflow_pointers
                  WHERE workflow_id = ? AND pointer_name = 'last-success') AS lastSuccess`,
        manifest.runId,
        manifest.workflowId,
      );
      expect(after).toEqual({ jobs: before?.jobs, publications: 0, lastSuccess: 0 });
    } finally {
      db.close();
    }
  });

  it('rejects database publish for a non-PUBLISH mode', async () => {
    const db = new LocalD1();
    try {
      const { manifest } = await publishFixture(3);
      await expect(publishVerifiedRun(db, { ...manifest, mode: 'DRY_RUN' })).rejects.toThrow(
        'PUBLISH mode',
      );
    } finally {
      db.close();
    }
  });

  it('rejects a duplicate attempt in the same run group', async () => {
    const db = new LocalD1();
    try {
      const firstRun = await publishFixture(4);
      await stageVerifiedRun(db, firstRun.manifest, firstRun.verified);
      const conflicting = await publishFixture(4, 'conflict4');
      await expect(
        stageVerifiedRun(db, conflicting.manifest, conflicting.verified),
      ).rejects.toThrow(/UNIQUE constraint failed/);
    } finally {
      db.close();
    }
  });
});
