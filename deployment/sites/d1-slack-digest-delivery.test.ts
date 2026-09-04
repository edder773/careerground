import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claimSlackDigest, settleSlackDigestDelivery } from './d1-daily-challenges.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

type ClaimedDigest = {
  status: 'claimed';
  deliveryKey: string;
  claimToken: string;
  payload: {
    jobs: Array<{ jobId: string }>;
    duplicateAudit: {
      suppressedCount: number;
      suppressedJobs: Array<{ reason: string; matchedJobId: string }>;
    };
  };
};

describe('Slack digest duplicate delivery boundary', () => {
  let db: LocalD1;
  const requestUrl = new URL('https://careerground.example/api/v1/internal/slack-digest/claim');

  beforeEach(async () => {
    db = new LocalD1();
    await ensureRuntimeSchema(db);
  });

  afterEach(() => db.close());

  async function jobIds(count: number) {
    const rows = await db
      .prepare('SELECT id FROM jobs ORDER BY id LIMIT ?')
      .bind(count)
      .all<{ id: string }>();
    return (rows.results || []).map((row) => row.id);
  }

  async function configureJob(
    id: string,
    createdAt: string,
    overrides: {
      company: string;
      title: string;
      start: string;
      deadline: string;
      sourceUrl: string;
    },
  ) {
    await db
      .prepare(
        `UPDATE jobs
            SET company_name = ?, title = ?, application_start_at = ?, deadline_at = ?,
                source_url = ?, status = 'ACTIVE', career_scope = 'NEW_GRAD_ONLY',
                rolling = 0, created_at = ?
          WHERE id = ?`,
      )
      .bind(
        overrides.company,
        overrides.title,
        overrides.start,
        overrides.deadline,
        overrides.sourceUrl,
        createdAt,
        id,
      )
      .run();
  }

  it('atomically reserves a job across daily and snapshot delivery keys', async () => {
    const [id] = await jobIds(1);
    const snapshot = new Date().toISOString();
    await configureJob(id!, snapshot, {
      company: '예약 테스트 회사',
      title: '신입 백엔드 개발자',
      start: snapshot,
      deadline: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      sourceUrl: 'https://example.test/jobs/reservation',
    });

    const daily = (await claimSlackDigest(db, requestUrl, {})) as ClaimedDigest;
    expect(daily).toMatchObject({ status: 'claimed' });
    expect(daily.payload.jobs.map((job) => job.jobId)).toContain(id);

    await expect(
      claimSlackDigest(db, requestUrl, { snapshotCreatedAt: snapshot, jobsOnly: true }),
    ).resolves.toMatchObject({
      status: 'blocked',
      deliveryStatus: 'JOB_RESERVED',
      reason: 'job-already-reserved',
      conflictingJobCount: 1,
    });

    await settleSlackDigestDelivery(
      db,
      { deliveryKey: daily.deliveryKey, claimToken: daily.claimToken },
      'SENT',
    );
    await expect(claimSlackDigest(db, requestUrl, {})).resolves.toMatchObject({
      status: 'already-sent',
    });
    await expect(
      db
        .prepare(
          `SELECT status FROM slack_digest_job_reservations
            WHERE delivery_key = ? AND job_id = ?`,
        )
        .bind(daily.deliveryKey, id)
        .first(),
    ).resolves.toEqual({ status: 'SENT' });
  });

  it('releases a rejected delivery but keeps an uncertain delivery locked', async () => {
    const [id] = await jobIds(1);
    const snapshot = new Date().toISOString();
    await configureJob(id!, snapshot, {
      company: '재시도 테스트 회사',
      title: '신입 프론트엔드 개발자',
      start: snapshot,
      deadline: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      sourceUrl: 'https://example.test/jobs/retry',
    });

    const first = (await claimSlackDigest(db, requestUrl, {
      snapshotCreatedAt: snapshot,
      jobsOnly: true,
    })) as ClaimedDigest;
    await settleSlackDigestDelivery(
      db,
      { deliveryKey: first.deliveryKey, claimToken: first.claimToken },
      'FAILED',
    );

    const retry = (await claimSlackDigest(db, requestUrl, {
      snapshotCreatedAt: snapshot,
      jobsOnly: true,
    })) as ClaimedDigest;
    expect(retry).toMatchObject({ status: 'claimed' });
    await settleSlackDigestDelivery(
      db,
      { deliveryKey: retry.deliveryKey, claimToken: retry.claimToken },
      'UNCERTAIN',
    );
    await expect(
      claimSlackDigest(db, requestUrl, { snapshotCreatedAt: snapshot, jobsOnly: true }),
    ).resolves.toMatchObject({ status: 'blocked', deliveryStatus: 'UNCERTAIN' });
  });

  it('suppresses a cross-source history repeat after deadline correction', async () => {
    const [previousId, repeatedId] = await jobIds(2);
    const previousSnapshot = new Date(Date.now() - 1_000).toISOString();
    const repeatedSnapshot = new Date().toISOString();
    const futureDeadline = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const correctedDeadline = new Date(Date.now() + 14 * 86_400_000).toISOString();
    await configureJob(previousId!, previousSnapshot, {
      company: 'KB국민은행',
      title: '2026년 하반기 신입행원(L1) IT 부문 채용',
      start: '2026-08-31T00:00:00.000Z',
      deadline: futureDeadline,
      sourceUrl: 'https://first.example.test/kb-it',
    });
    const previous = (await claimSlackDigest(db, requestUrl, {
      snapshotCreatedAt: previousSnapshot,
      jobsOnly: true,
    })) as ClaimedDigest;
    await settleSlackDigestDelivery(
      db,
      { deliveryKey: previous.deliveryKey, claimToken: previous.claimToken },
      'SENT',
    );

    await configureJob(repeatedId!, repeatedSnapshot, {
      company: '(주)국민은행',
      title: '2026년 하반기 신입행원(L1) IT부문 채용',
      start: '2026-09-01T00:00:00.000Z',
      deadline: correctedDeadline,
      sourceUrl: 'https://second.example.test/kb-it',
    });
    const preview = (await claimSlackDigest(db, requestUrl, {
      snapshotCreatedAt: repeatedSnapshot,
      jobsOnly: true,
      dryRun: true,
    })) as unknown as { status: string; payload: ClaimedDigest['payload'] };

    expect(preview.status).toBe('preview');
    expect(preview.payload.jobs.map((job) => job.jobId)).not.toContain(repeatedId);
    expect(preview.payload.duplicateAudit).toMatchObject({
      suppressedCount: 1,
      suppressedJobs: [
        expect.objectContaining({ reason: 'equivalent-title', matchedJobId: previousId }),
      ],
    });
  });
});
