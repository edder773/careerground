import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { first } from './d1.js';
import { handleD1Api } from './d1-api.js';
import { publishDiscoveryBundle } from './d1-jobs-v5.js';
import { sha256 } from './domain.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

const kstDate = (value: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);

async function discoveryJob(now: Date, suffix: string, overrides: Record<string, unknown> = {}) {
  const sourceUrl = `https://automation-${suffix}.example.test/jobs/${suffix}`;
  const companyName = String(overrides.companyName || `자동화 회사 ${suffix}`);
  const title = String(overrides.title || `신입 백엔드 개발자 ${suffix}`);
  const region = String(overrides.region || '서울');
  const employmentType = String(overrides.employmentType || 'FULL_TIME');
  return {
    id: `job-${(await sha256(sourceUrl)).slice(0, 24)}`,
    canonicalJobKey: `source:automation-${suffix}.example.test:${suffix}`,
    fingerprint: await sha256(
      [companyName, title, region, employmentType]
        .map((value) => value.trim().toLowerCase())
        .join('|'),
    ),
    sourceUrl,
    sourceName: '공식 채용',
    sourcePostingId: suffix,
    companyName,
    companySize: 'LARGE',
    companySizeEvidence: '공식 기업 정보',
    title,
    category: '백엔드',
    careerScope: 'NEW_GRAD_ONLY',
    careerEvidence: '신입 지원 가능 명시',
    employmentType,
    region,
    remote: false,
    techStack: ['TypeScript'],
    publishedAt: now.toISOString(),
    applicationStartAt: now.toISOString(),
    deadlineAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
    rolling: false,
    summary: '자동화 경계 회귀 테스트 공고',
    status: 'ACTIVE',
    collectedAt: now.toISOString(),
    lastVerifiedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

async function request(now: Date, attempt = 1, jobs?: Array<Record<string, unknown>>) {
  const targetAsOfDate = kstDate(now);
  const runId = `CG-${targetAsOfDate}-A${attempt}-discovery`;
  const items =
    jobs || (await Promise.all([1, 2, 3].map((value) => discoveryJob(now, String(value)))));
  const partitions = [1, 2, 3].map((partitionId) => ({
    schemaVersion: '5.0',
    workflowId: 'CG-JOBS-PROD-V5',
    runId,
    runGroupKey: `CG-${targetAsOfDate}`,
    targetAsOfDate,
    partitionId,
    status: 'SUCCESS',
    sources: [`source-${partitionId}`],
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    exportedAt: now.toISOString(),
    rowCount: partitionId === 1 ? items.length : 0,
    items: partitionId === 1 ? items : [],
    errorCode: null,
    errorMessage: null,
  }));
  return {
    schemaVersion: '5.1',
    artifactType: 'CAREERGROUND_DISCOVERY_PUBLISH_REQUEST',
    workflowId: 'CG-JOBS-PROD-V5',
    runId,
    runGroupKey: `CG-${targetAsOfDate}`,
    targetAsOfDate,
    attempt,
    report: {
      schemaVersion: '5.1',
      artifactType: 'CAREERGROUND_DISCOVERY_BUNDLE_REPORT',
      workflowId: 'CG-JOBS-PROD-V5',
      runId,
      runGroupKey: `CG-${targetAsOfDate}`,
      targetAsOfDate,
      status: 'VERIFIED_DISCOVERY',
      rowCount: items.length,
      potentialDuplicateCount: 0,
      potentialDuplicates: [],
      productionDatabaseChanged: false,
      slackSent: false,
    },
    partitions,
  } as const;
}

describe('CareerGround v5 discovery production boundary', () => {
  let db: LocalD1;
  let now: Date;

  beforeEach(async () => {
    db = new LocalD1();
    await ensureRuntimeSchema(db);
    now = new Date();
  });

  afterEach(() => db.close());

  it('publishes only new ACTIVE jobs, preserves saved_jobs, and is idempotent', async () => {
    const input = await request(now);
    const before = await first<{ jobs: number; saved: number }>(
      db,
      `SELECT (SELECT COUNT(*) FROM jobs) AS jobs,
              (SELECT COUNT(*) FROM saved_jobs) AS saved`,
    );
    const published = await publishDiscoveryBundle(db, input, now);
    const repeated = await publishDiscoveryBundle(db, input, now);
    const after = await first<{ jobs: number; saved: number; batches: number }>(
      db,
      `SELECT (SELECT COUNT(*) FROM jobs) AS jobs,
              (SELECT COUNT(*) FROM saved_jobs) AS saved,
              (SELECT COUNT(*) FROM import_batches
                WHERE id = ?) AS batches`,
      `jobs-v5-${input.runId}`,
    );
    expect(published).toMatchObject({
      status: 'PUBLISHED',
      inserted: 3,
      skippedExisting: 0,
      savedJobsUnchanged: true,
      deletedJobs: 0,
    });
    expect(repeated).toMatchObject({ status: 'ALREADY_PUBLISHED', inserted: 3 });
    expect(after).toEqual({
      jobs: Number(before?.jobs || 0) + 3,
      saved: Number(before?.saved || 0),
      batches: 1,
    });
  });

  it('fails closed when a new URL collides with an existing fingerprint', async () => {
    const original = await discoveryJob(now, 'collision-a', {
      companyName: '동일 회사',
      title: '동일 공고',
    });
    await publishDiscoveryBundle(db, await request(now, 1, [original]), now);
    const collision = await discoveryJob(now, 'collision-b', {
      companyName: '동일 회사',
      title: '동일 공고',
    });
    await expect(
      publishDiscoveryBundle(db, await request(now, 2, [collision]), now),
    ).rejects.toThrow('fingerprint');
  });

  it('skips a semantic platform mirror while publishing a distinct role', async () => {
    const applicationStartAt = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    const deadlineAt = new Date(now.getTime() + 10 * 86_400_000).toISOString();
    const existing = await first<{ id: string }>(db, 'SELECT id FROM jobs ORDER BY id LIMIT 1');
    await db
      .prepare(
        `UPDATE jobs
            SET company_name = '우리은행', title = '2026 하반기 신입행원 채용 TECH/IT개발',
                source_name = '공식 채용', source_url = 'https://wooribank.example/jobs/tech',
                status = 'ACTIVE', career_scope = 'NEW_GRAD_ONLY', rolling = 0,
                application_start_at = ?, deadline_at = ?
          WHERE id = ?`,
      )
      .bind(applicationStartAt, deadlineAt, existing!.id)
      .run();
    const mirror = await discoveryJob(now, 'woori-mirror', {
      companyName: '(주)우리은행',
      title: '2026 하반기 우리은행 신입행원 채용 TECH IT개발',
      sourceName: '링커리어',
      applicationStartAt,
      deadlineAt,
    });
    const distinctRole = await discoveryJob(now, 'distinct-role', {
      companyName: '너지',
      title: 'Android 엔지니어 인턴',
      applicationStartAt,
      deadlineAt,
    });

    const published = await publishDiscoveryBundle(
      db,
      await request(now, 3, [mirror, distinctRole]),
      now,
    );
    const stored = await first<{ mirrors: number; distinctRoles: number }>(
      db,
      `SELECT
         (SELECT COUNT(*) FROM jobs WHERE source_url = ?) AS mirrors,
         (SELECT COUNT(*) FROM jobs WHERE source_url = ?) AS distinctRoles`,
      mirror.sourceUrl,
      distinctRole.sourceUrl,
    );

    expect(published).toMatchObject({ inserted: 1, skippedExisting: 1 });
    expect(stored).toEqual({ mirrors: 0, distinctRoles: 1 });
  });

  it('protects the HTTP publish endpoint with a separate bearer token', async () => {
    const input = await request(now);
    const call = (token?: string, configured = true) =>
      handleD1Api(
        new Request('https://careerground.example/api/v1/internal/jobs-v5/publish', {
          method: 'POST',
          headers: token
            ? { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
            : { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
        {
          DB: db,
          REQUEST_LOGGING: 'false',
          PUBLISH_API_TOKEN: configured ? 'publish-secret' : undefined,
        },
      );
    expect((await call(undefined, false)).status).toBe(503);
    expect((await call('wrong')).status).toBe(401);
    const response = await call('publish-secret');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'PUBLISHED', inserted: 3 });
  });

  it('returns a typed 422 response for an invalid discovery enum', async () => {
    const input = await request(now);
    input.partitions[0].items[0].companySize = 'MID_SIZED_ENTERPRISE';
    const response = await handleD1Api(
      new Request('https://careerground.example/api/v1/internal/jobs-v5/publish', {
        method: 'POST',
        headers: {
          authorization: 'Bearer publish-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify(input),
      }),
      {
        DB: db,
        REQUEST_LOGGING: 'false',
        PUBLISH_API_TOKEN: 'publish-secret',
      },
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: 'PUBLISH_VALIDATION_FAILED',
      details: { reason: expect.stringContaining('companySize') },
    });
  });

  it('allows one previous-KST-day replay for an overnight recovery', async () => {
    const collectedAt = new Date('2026-08-31T09:00:00.000Z');
    const recoveredAt = new Date('2026-09-01T00:54:00.000Z');
    const input = await request(collectedAt);
    await expect(publishDiscoveryBundle(db, input, recoveredAt)).resolves.toMatchObject({
      status: 'PUBLISHED',
      inserted: 3,
    });
  });

  it('rejects a discovery replay older than the previous KST day', async () => {
    const collectedAt = new Date('2026-08-30T09:00:00.000Z');
    const recoveredAt = new Date('2026-09-01T00:54:00.000Z');
    const input = await request(collectedAt);
    await expect(publishDiscoveryBundle(db, input, recoveredAt)).rejects.toMatchObject({
      status: 422,
      code: 'PUBLISH_VALIDATION_FAILED',
      details: { reason: expect.stringContaining('current or previous') },
    });
  });
});
