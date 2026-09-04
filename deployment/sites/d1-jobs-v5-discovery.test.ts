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

  it('publishes only new ACTIVE jobs and is idempotent', async () => {
    const input = await request(now);
    const before = await first<{ jobs: number }>(db, 'SELECT COUNT(*) AS jobs FROM jobs');
    const published = await publishDiscoveryBundle(db, input, now);
    const repeated = await publishDiscoveryBundle(db, input, now);
    const after = await first<{ jobs: number; batches: number }>(
      db,
      `SELECT (SELECT COUNT(*) FROM jobs) AS jobs,
              (SELECT COUNT(*) FROM import_batches
                WHERE id = ?) AS batches`,
      `jobs-v5-${input.runId}`,
    );
    expect(published).toMatchObject({
      status: 'PUBLISHED',
      inserted: 3,
      skippedExisting: 0,
      deletedJobs: 0,
    });
    expect(repeated).toMatchObject({ status: 'ALREADY_PUBLISHED', inserted: 3 });
    expect(after).toEqual({
      jobs: Number(before?.jobs || 0) + 3,
      batches: 1,
    });
  });

  it('groups every inserted job under the shared publication snapshot timestamp', async () => {
    const collectedAt = new Date(now.getTime() - 5 * 60_000);
    const input = await request(collectedAt);

    await publishDiscoveryBundle(db, input, now);

    const snapshot = await first<{
      createdAt: string;
      createdAtCount: number;
      updatedAt: string;
      updatedAtCount: number;
    }>(
      db,
      `SELECT MIN(created_at) AS createdAt,
              COUNT(DISTINCT created_at) AS createdAtCount,
              MIN(updated_at) AS updatedAt,
              COUNT(DISTINCT updated_at) AS updatedAtCount
         FROM jobs
        WHERE source_url LIKE 'https://automation-%'`,
    );

    expect(snapshot).toEqual({
      createdAt: now.toISOString(),
      createdAtCount: 1,
      updatedAt: now.toISOString(),
      updatedAtCount: 1,
    });
  });

  it('rolls back a failed staging batch without changing jobs or publication ledgers', async () => {
    const input = await request(now);
    const before = await first<{ jobs: number }>(db, 'SELECT COUNT(*) AS jobs FROM jobs');
    db.failNextBatch(1);

    await expect(publishDiscoveryBundle(db, input, now)).rejects.toThrow(
      'injected D1 batch failure',
    );

    const after = await first<{ jobs: number; runs: number; publications: number }>(
      db,
      `SELECT
         (SELECT COUNT(*) FROM jobs) AS jobs,
         (SELECT COUNT(*) FROM workflow_runs WHERE run_id = ?) AS runs,
         (SELECT COUNT(*) FROM workflow_publications WHERE run_id = ?) AS publications`,
      input.runId,
      input.runId,
    );
    expect(after).toEqual({ jobs: before?.jobs, runs: 0, publications: 0 });
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
    ).rejects.toMatchObject({
      status: 422,
      code: 'PUBLISH_IDENTITY_CONFLICT',
      details: { reason: 'FINGERPRINT_COLLISION' },
    });
  });

  it('skips an alternate platform URL when its stable source posting key already exists', async () => {
    const sourcePostingId = '19391543';
    const canonicalJobKey = `source:matchingbank.example.test:${sourcePostingId}`;
    const originalUrl = `https://matchingbank.example.test/jobs/view.asp?id_num=${sourcePostingId}`;
    const printUrl = `https://matchingbank.example.test/jobs/ifrm_default_view_print.asp?id_num=${sourcePostingId}&print=true`;
    const original = await discoveryJob(now, 'canonical-original', {
      id: `job-${(await sha256(originalUrl)).slice(0, 24)}`,
      sourceUrl: originalUrl,
      sourcePostingId,
      canonicalJobKey,
      title: '웹 앱 개발자 채용',
    });
    const printView = await discoveryJob(now, 'canonical-print', {
      id: `job-${(await sha256(printUrl)).slice(0, 24)}`,
      sourceUrl: printUrl,
      sourcePostingId,
      canonicalJobKey,
      title: '웹·앱 개발자 채용 인쇄 화면',
    });

    await publishDiscoveryBundle(db, await request(now, 1, [original]), now);
    const repeated = await publishDiscoveryBundle(db, await request(now, 2, [printView]), now);
    const stored = await first<{ original: number; printView: number }>(
      db,
      `SELECT
         (SELECT COUNT(*) FROM jobs WHERE source_url = ?) AS original,
         (SELECT COUNT(*) FROM jobs WHERE source_url = ?) AS printView`,
      originalUrl,
      printUrl,
    );

    expect(repeated).toMatchObject({ inserted: 0, skippedExisting: 1 });
    expect(stored).toEqual({ original: 1, printView: 0 });
  });

  it('skips a legacy mobile host alias with the same source posting id and fingerprint', async () => {
    const sourcePostingId = '54870782';
    const mobileUrl = `https://m.saramin.co.kr/job-search/view?rec_idx=${sourcePostingId}`;
    const desktopUrl = `https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=${sourcePostingId}`;
    const shared = {
      sourcePostingId,
      companyName: '비식별 제조 회사',
      title: '제조지능화 디지털트윈 신입 채용',
    };
    const mobile = await discoveryJob(now, 'host-alias-mobile', {
      ...shared,
      id: `job-${(await sha256(mobileUrl)).slice(0, 24)}`,
      sourceUrl: mobileUrl,
      canonicalJobKey: `source:m.saramin.co.kr:${sourcePostingId}`,
    });
    const desktop = await discoveryJob(now, 'host-alias-desktop', {
      ...shared,
      id: `job-${(await sha256(desktopUrl)).slice(0, 24)}`,
      sourceUrl: desktopUrl,
      canonicalJobKey: `source:www.saramin.co.kr:${sourcePostingId}`,
    });

    await publishDiscoveryBundle(db, await request(now, 1, [mobile]), now);
    const repeated = await publishDiscoveryBundle(db, await request(now, 2, [desktop]), now);
    const stored = await first<{ mobile: number; desktop: number }>(
      db,
      `SELECT
         (SELECT COUNT(*) FROM jobs WHERE source_url = ?) AS mobile,
         (SELECT COUNT(*) FROM jobs WHERE source_url = ?) AS desktop`,
      mobileUrl,
      desktopUrl,
    );

    expect(repeated).toMatchObject({ inserted: 0, skippedExisting: 1 });
    expect(stored).toEqual({ mobile: 1, desktop: 0 });
  });

  it('skips a company-alias campaign mirror while publishing a distinct role', async () => {
    const applicationStartAt = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    const deadlineAt = new Date(now.getTime() + 10 * 86_400_000).toISOString();
    const existing = await first<{ id: string }>(db, 'SELECT id FROM jobs ORDER BY id LIMIT 1');
    await db
      .prepare(
        `UPDATE jobs
            SET company_name = 'KT', title = '2026년 KT 대졸신입 채용 - NW인프라운용',
                source_name = '링커리어', source_url = 'https://linkareer.example/jobs/kt-nw',
                status = 'ACTIVE', career_scope = 'NEW_GRAD_ONLY', rolling = 0,
                application_start_at = ?, deadline_at = ?
          WHERE id = ?`,
      )
      .bind(applicationStartAt, deadlineAt, existing!.id)
      .run();
    const mirror = await discoveryJob(now, 'kt-mirror', {
      companyName: '㈜케이티',
      title: '2026년 KT 대졸신입 채용',
      sourceName: '잡코리아',
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

  it('does not reinsert an inactive historical campaign after a corrected deadline', async () => {
    const previous = await discoveryJob(now, 'historical-kb', {
      companyName: 'KB국민은행',
      title: '2026년 하반기 신입행원(L1) IT 부문 채용',
      applicationStartAt: '2026-08-31T00:00:00.000Z',
      deadlineAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
    });
    await publishDiscoveryBundle(db, await request(now, 1, [previous]), now);
    await db.prepare("UPDATE jobs SET status = 'EXPIRED' WHERE id = ?").bind(previous.id).run();

    const corrected = await discoveryJob(now, 'historical-kb-mirror', {
      companyName: '(주)국민은행',
      title: '2026년 하반기 신입행원(L1) IT부문 채용',
      applicationStartAt: '2026-09-01T00:00:00.000Z',
      deadlineAt: new Date(now.getTime() + 14 * 86_400_000).toISOString(),
    });
    const repeated = await publishDiscoveryBundle(db, await request(now, 2, [corrected]), now);
    const stored = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM jobs WHERE source_url = ?',
      corrected.sourceUrl,
    );

    expect(repeated).toMatchObject({ inserted: 0, skippedExisting: 1 });
    expect(stored).toEqual({ count: 0 });
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

  it('rejects a non-canonical employment type at the protected publish boundary', async () => {
    const input = await request(now);
    input.partitions[0].items[0].employmentType = 'PERMANENT_EMPLOYEE';
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
      details: { reason: expect.stringContaining('employmentType') },
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
