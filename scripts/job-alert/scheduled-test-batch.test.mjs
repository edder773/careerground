import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dispatchAlert } from './dispatch.mjs';
import { saveSubmission, writeJson } from './store.mjs';

const job = {
  companyName: '합성 테스트 회사',
  title: '신입 서버 개발',
  sourceName: 'Synthetic',
  sourceUrl: 'https://example.com/synthetic-job',
  deadlineAt: '2026-12-31T23:59:00+09:00',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
};
let root, source, testDir, posts;
const seed = (date) => {
  for (const kind of ['collector', 'reviewer']) {
    for (let slot = 1; slot <= (kind === 'collector' ? 5 : 3); slot++)
      saveSubmission(source, date, { kind, slot, date, jobs: [job] });
  }
};
const run = (at, overrides = {}) =>
  dispatchAlert({
    env: {
      JOB_ALERT_DATA_DIR: source,
      JOB_ALERT_TEST_DATA_DIR: testDir,
      JOB_ALERT_DESTINATION: 'test',
      JOB_ALERT_DRY_RUN: 'false',
      JOB_ALERT_FORCE: 'false',
      SLACK_TEST_WEBHOOK_URL: 'https://hooks.slack.com/services/TTEST/BTEST/synthetic',
      CAREERGROUND_SITE_URL: 'https://example.com/',
      BAEUMZIP_URL: 'https://example.com/',
      GITHUB_EVENT_NAME: 'schedule',
      GITHUB_SHA: 'synthetic-code',
      GITHUB_RUN_ID: 'synthetic-run',
      ...overrides,
    },
    now: new Date(at),
    fetchImpl: async (url, init = {}) => {
      if (init.method === 'POST') {
        posts.push(JSON.parse(init.body));
        return new globalThis.Response('ok');
      }
      return new globalThis.Response('not found', { status: 404 });
    },
  });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'job-alert-scheduled-batch-'));
  source = join(root, 'source');
  testDir = join(root, 'test');
  posts = [];
  writeJson(join(source, 'ledger.json'), { sentJobs: [], deliveries: {} });
  for (const date of ['2026-10-23', '2026-10-26', '2026-10-27', '2026-10-28']) seed(date);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('scheduled test batch across delayed execution', () => {
  it('uses the same evening batch at its normal 21:00 KST slot', async () => {
    expect((await run('2026-10-27T21:00:00+09:00')).batchDate).toBe('2026-10-27');
    expect(posts).toHaveLength(1);
  });
  it('keeps the prior evening batch after execution crosses midnight', async () => {
    const ledgerBefore = readFileSync(join(source, 'ledger.json'), 'utf8');
    const result = await run('2026-10-28T02:08:51+09:00');
    expect(result.batchDate).toBe('2026-10-27');
    expect(result).toMatchObject({ status: 'skipped', reason: 'too-early' });
    expect(posts).toHaveLength(0);
    expect(readFileSync(join(source, 'ledger.json'), 'utf8')).toBe(ledgerBefore);
  });
  it('uses Friday for a delayed weekday schedule reaching Monday morning', async () => {
    expect((await run('2026-10-26T07:40:00+09:00')).batchDate).toBe('2026-10-23');
  });
  it('preserves an explicit recovery batch without substituting another date', async () => {
    expect(
      (await run('2026-10-28T07:40:00+09:00', { JOB_ALERT_BATCH_DATE: '2026-10-26' })).batchDate,
    ).toBe('2026-10-26');
  });
  it('keeps the current date default for a manual test', async () => {
    expect(
      (await run('2026-10-28T07:40:00+09:00', { GITHUB_EVENT_NAME: 'workflow_dispatch' }))
        .batchDate,
    ).toBe('2026-10-28');
  });
  it('blocks a delayed scheduled test on an actual weekend without a POST', async () => {
    const result = await run('2026-10-24T02:00:00+09:00');
    expect(result).toMatchObject({ status: 'skipped', reason: 'weekend' });
    expect(posts).toHaveLength(0);
  });
  it('fails closed on an incomplete intended batch instead of using another ready date', async () => {
    rmSync(join(source, 'batches', '2026-10-27', 'reviewer-3.json'));
    await expect(run('2026-10-28T02:08:51+09:00')).rejects.toThrow(
      '배치 미완료: 2026-10-27, 수집 5/5, 검증 2/3',
    );
    expect(posts).toHaveLength(0);
  });
  it('blocks a duplicate scheduled test of the already sent intended batch', async () => {
    expect((await run('2026-10-27T21:00:00+09:00')).status).toBe('sent');
    const delayed = await run('2026-10-28T07:40:00+09:00');
    expect(delayed).toMatchObject({ status: 'skipped', reason: 'already-sent' });
    expect(posts).toHaveLength(1);
  });
});
