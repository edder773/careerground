import { mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { approveTest, batchReadiness, dispatchAlert } from './dispatch.mjs';
import { processAlert, receive } from './run.mjs';
import { readJson, saveSubmission, writeJson } from './store.mjs';

const TEST_NOW = new Date('2026-10-02T00:00:00Z');
const PROD_NOW = new Date('2026-10-02T23:00:00Z');
const BATCH = '2026-10-02';
const TEST_HOOK = 'https://hooks.slack.com/services/TTEST/BTEST/fake';
const PROD_HOOK = 'https://hooks.slack.com/services/TPROD/BPROD/fake';
const job = {
  companyName: '테스트 회사',
  title: '신입 백엔드 개발',
  sourceName: 'Saramin',
  sourceUrl: 'https://www.saramin.co.kr/job-search/view?rec_idx=1',
  deadlineAt: '2026-10-20T23:59:00+09:00',
  rolling: false,
  careerScope: '신입',
  itRole: null,
};
let root, source, testDir, posts, env;
const seed = (date) => {
  for (const kind of ['collector', 'reviewer']) {
    for (let slot = 1; slot <= (kind === 'collector' ? 5 : 3); slot++)
      saveSubmission(source, date, { kind, slot, date, jobs: [job] });
  }
};
const fetchImpl = async (url, init = {}) => {
  if (String(url).endsWith('/api/v1/jobs')) return globalThis.Response.json([]);
  if (init.method === 'POST') {
    posts.push({ url: String(url), body: JSON.parse(init.body) });
    return new globalThis.Response('ok');
  }
  return new globalThis.Response('not found', { status: 404 });
};
const test = (overrides = {}) =>
  dispatchAlert({ env: { ...env, ...overrides }, now: TEST_NOW, fetchImpl });
const prod = (overrides = {}, now = PROD_NOW) =>
  dispatchAlert({
    env: { ...env, JOB_ALERT_DESTINATION: 'production', ...overrides },
    now,
    fetchImpl,
  });
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'job-alert-stage-'));
  source = join(root, 'source');
  testDir = join(root, 'test');
  posts = [];
  writeJson(join(source, 'ledger.json'), { sentJobs: [], deliveries: {} });
  seed(BATCH);
  env = {
    JOB_ALERT_DATA_DIR: source,
    JOB_ALERT_TEST_DATA_DIR: testDir,
    JOB_ALERT_DESTINATION: 'test',
    JOB_ALERT_LIVE: 'true',
    JOB_ALERT_FORCE: 'true',
    JOB_ALERT_BATCH_DATE: BATCH,
    JOB_ALERT_PRODUCTION_START_DATE: '2026-10-03',
    SLACK_TEST_WEBHOOK_URL: TEST_HOOK,
    SLACK_WEBHOOK_URL: PROD_HOOK,
    CAREERGROUND_SITE_URL: 'https://careerground.example/',
    BAEUMZIP_URL: 'https://modumunje.example/',
    GITHUB_SHA: 'code-v1',
    GITHUB_RUN_ID: 'run-1',
  };
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('staged job alert', () => {
  it('sends using only the test connection, leaving all source data untouched', async () => {
    const before = readFileSync(join(source, 'ledger.json'), 'utf8');
    const result = await test();
    expect(result.status).toBe('sent');
    expect(result.final.jobs).toHaveLength(1);
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toBe(TEST_HOOK);
    expect(posts[0].body.text).toMatch(/^\[테스트\]/u);
    expect(readFileSync(join(source, 'ledger.json'), 'utf8')).toBe(before);
    expect(readJson(join(testDir, 'ledger.json'))).not.toHaveProperty('sentJobs');
    expect(readJson(join(testDir, 'results', `${BATCH}.json`))).toMatchObject({
      status: 'SENT',
      mode: 'live',
      codeSha: 'code-v1',
      reviewCount: 3,
    });
  });
  it('fails closed when the test connection is missing, even if production is configured', async () => {
    await expect(test({ SLACK_TEST_WEBHOOK_URL: '' })).rejects.toThrow('SLACK_TEST_WEBHOOK_URL');
    expect(posts).toHaveLength(0);
  });
  it('requires all five collectors and three reviewers', async () => {
    unlinkSync(join(source, 'batches', BATCH, 'reviewer-3.json'));
    await expect(test()).rejects.toThrow('검증 2/3');
    expect(posts).toHaveLength(0);
    seed(BATCH);
    unlinkSync(join(source, 'batches', BATCH, 'collector-5.json'));
    await expect(test()).rejects.toThrow('수집 4/5');
  });
  it('does not allow a preview to approve live production', async () => {
    expect((await test({ JOB_ALERT_DRY_RUN: 'true' })).status).toBe('dry-run');
    expect(() => approveTest({ env, now: TEST_NOW })).toThrow('정상 테스트');
    expect(posts).toHaveLength(0);
    expect((await test()).status).toBe('sent');
  });
  it('does not relabel an old success as a newly tested code version', async () => {
    await test();
    expect((await test({ GITHUB_SHA: 'code-v2', GITHUB_RUN_ID: 'run-2' })).reason).toBe(
      'already-sent',
    );
    expect(readJson(join(testDir, 'results', `${BATCH}.json`)).codeSha).toBe('code-v1');
    expect(() => approveTest({ env: { ...env, GITHUB_SHA: 'code-v2' }, now: TEST_NOW })).toThrow(
      '정상 테스트',
    );
    expect(
      (await test({ GITHUB_SHA: 'code-v2', GITHUB_RUN_ID: 'run-2', JOB_ALERT_RETEST: 'true' }))
        .status,
    ).toBe('sent');
    expect(posts).toHaveLength(2);
    expect(readJson(join(testDir, 'results', `${BATCH}.json`)).codeSha).toBe('code-v2');
  });
  it('blocks automatic retries and approval after an uncertain test receipt', async () => {
    await expect(
      dispatchAlert({
        env,
        now: TEST_NOW,
        fetchImpl: async (url, init = {}) => {
          if (init.method === 'POST') throw new Error('network uncertain');
          return fetchImpl(url, init);
        },
      }),
    ).rejects.toThrow('uncertain');
    expect(readJson(join(testDir, 'results', `${BATCH}.json`)).status).toBe('UNCERTAIN');
    expect((await test()).reason).toBe('already-sent');
    await expect(test({ JOB_ALERT_RETEST: 'true' })).rejects.toThrow('불확실');
    expect(() => approveTest({ env, now: TEST_NOW })).toThrow('정상 테스트');
    expect(posts).toHaveLength(0);
  });
  it('requires receipt approval and an unchanged tested batch and code', async () => {
    await expect(prod()).rejects.toThrow('승인 기록');
    await test();
    const release = approveTest({ env, now: TEST_NOW });
    expect(release.status).toBe('READY');
    await expect(prod({ GITHUB_SHA: 'unverified-code' })).rejects.toThrow('승인 기록');
    saveSubmission(source, BATCH, { kind: 'reviewer', slot: 1, date: BATCH, jobs: [] });
    expect(() => approveTest({ env, now: TEST_NOW })).toThrow('정상 테스트');
    await expect(prod()).rejects.toThrow('승인 기록');
  });
  it('sends the approved batch at 08:00 next day once, even for the explicit first holiday override', async () => {
    await test();
    approveTest({ env, now: TEST_NOW });
    expect((await prod({}, new Date('2026-10-02T22:59:59Z'))).reason).toBe('before-08:00');
    const result = await prod();
    expect(result.status).toBe('sent');
    expect(result.final.jobs).toHaveLength(1);
    expect(posts.map((x) => x.url)).toEqual([TEST_HOOK, PROD_HOOK]);
    expect((await prod()).reason).toBe('already-sent');
    expect((await prod({}, new Date('2026-10-04T23:00:00Z'))).reason).toBe('batch-closed');
  });
  it('preserves disabled production, date guard, and normal weekend policy', async () => {
    expect((await prod({ JOB_ALERT_LIVE: 'false' })).reason).toBe('production-disabled');
    expect((await prod({}, TEST_NOW)).reason).toBe('before-production-start');
    await test();
    approveTest({ env, now: TEST_NOW });
    expect((await prod({ JOB_ALERT_FORCE: 'false' })).reason).toBe('weekend');
  });
  it('ignores old previews when locating a ready prior batch, and pins it separately from today', async () => {
    await test();
    approveTest({ env, now: TEST_NOW });
    writeJson(join(source, 'ledger.json'), {
      sentJobs: [],
      deliveries: { [BATCH]: { mode: 'dry-run', status: 'PREVIEW', batches: [BATCH] } },
    });
    seed('2026-10-03');
    const result = await prod({ JOB_ALERT_BATCH_DATE: '' });
    expect(result.status).toBe('sent');
    expect(result.batchDate).toBe(BATCH);
    expect(result.pending.batches).toEqual([BATCH]);
  });
  it('stores strict reviewers under the submitted date and defers every issue send', async () => {
    seed('2026-10-01');
    const eventPath = join(root, 'event.json');
    writeJson(eventPath, {
      issue: {
        title: '[JOB-ALERT][2026-10-01][reviewer-1]',
        body: JSON.stringify({ jobs: [] }),
        author_association: 'OWNER',
      },
    });
    const eventEnv = {
      ...env,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_EVENT_NAME: 'issues',
      JOB_ALERT_STRICT_BATCH: 'true',
      JOB_ALERT_DEFER_SEND: 'true',
    };
    receive({ env: eventEnv, now: TEST_NOW });
    expect(readJson(join(source, 'batches', '2026-10-01', 'reviewer-1.json')).jobs).toEqual([]);
    expect(readJson(join(source, 'batches', BATCH, 'reviewer-1.json')).jobs).toHaveLength(1);
    const result = await processAlert({ env: eventEnv, now: TEST_NOW, fetchImpl });
    expect(result.result.reason).toBe('submission-only');
    expect(result.result.pending.batches).toEqual([BATCH]);
    expect(readJson(join(source, 'ledger.json')).deliveries).toEqual({});
    expect(posts).toHaveLength(0);
  });
  it('validates calendar dates', () => {
    expect(() => batchReadiness(source, '2026-02-31')).toThrow('유효한');
  });
});
