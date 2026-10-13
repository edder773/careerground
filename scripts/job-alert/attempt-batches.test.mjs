import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseSubmissionTitle } from './job-list.mjs';
import { approveTest, batchReadiness, dispatchAlert } from './dispatch.mjs';
import { processAlert, receive } from './run.mjs';
import { loadLedger, openBatchDates, readJson, saveSubmission, writeJson } from './store.mjs';

const DAY = '2026-10-13';
const ATTEMPT = `${DAY}-A2`;
const NOW = new Date(`${DAY}T23:15:00+09:00`);
const NEXT = new Date('2026-10-14T08:00:00+09:00');
const posting = (id) => ({
  companyName: `가상회사 ${id}`,
  title: '신입 소프트웨어 개발자',
  sourceName: 'Saramin',
  sourceUrl: `https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=${id}`,
  deadlineAt: '2026-10-30T23:59:00+09:00',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
});
let root, source, testDir, eventPath, env, posts;
const seed = (batch, id = 2) => {
  for (const kind of ['collector', 'reviewer']) {
    for (let slot = 1; slot <= (kind === 'collector' ? 5 : 3); slot++) {
      saveSubmission(source, batch, { kind, slot, date: batch, jobs: [posting(id)] });
    }
  }
};
const fetchImpl = async (url, init = {}) => {
  if (init.method === 'POST') {
    posts.push(String(url));
    return new globalThis.Response('ok');
  }
  return new globalThis.Response('not found', { status: 404 });
};
const dispatch = (extra = {}, now = NOW) =>
  dispatchAlert({ env: { ...env, ...extra }, now, fetchImpl });
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'alert-attempt-regression-'));
  source = join(root, 'source');
  testDir = join(root, 'test');
  eventPath = join(root, 'event.json');
  posts = [];
  seed(DAY, 1);
  seed(ATTEMPT);
  writeJson(join(source, 'ledger.json'), {
    sentJobs: [{ ...posting(1), sentOn: DAY }],
    deliveries: { [DAY]: { mode: 'live', status: 'SENT', batches: [DAY], jobCount: 1 } },
  });
  writeJson(join(testDir, 'results', `${DAY}.json`), {
    batchDate: DAY,
    mode: 'live',
    status: 'SENT',
    jobCount: 1,
    codeSha: 'old-code',
  });
  env = {
    JOB_ALERT_DATA_DIR: source,
    JOB_ALERT_TEST_DATA_DIR: testDir,
    JOB_ALERT_DESTINATION: 'test',
    JOB_ALERT_LIVE: 'true',
    JOB_ALERT_BATCH_DATE: ATTEMPT,
    JOB_ALERT_PRODUCTION_START_DATE: '2026-10-02',
    SLACK_TEST_WEBHOOK_URL: 'https://hooks.slack.com/services/TTEST/BTEST/fake',
    SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/TPROD/BPROD/fake',
    CAREERGROUND_SITE_URL: 'https://careerground.example.test/',
    BAEUMZIP_URL: 'https://modumunje.example.test/',
    GITHUB_SHA: 'new-code',
    GITHUB_RUN_ID: 'new-test',
  };
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('same-day recovery attempt isolation', () => {
  it('accepts an explicit recovery identity without changing legacy issue titles', () => {
    expect(parseSubmissionTitle(`[JOB-ALERT][${ATTEMPT}][collector-5]`)).toEqual({
      kind: 'collector',
      slot: 5,
      date: ATTEMPT,
    });
    expect(parseSubmissionTitle(`[JOB-ALERT][${DAY}][reviewer-3]`)).toEqual({
      kind: 'reviewer',
      slot: 3,
      date: DAY,
    });
    for (const batch of [
      `${DAY}-A1`,
      `${DAY}-A0`,
      `${DAY}-A02`,
      '2026-02-31-A2',
      '../2026-10-13-A2',
    ]) {
      expect(parseSubmissionTitle(`[JOB-ALERT][${batch}][collector-1]`)).toBeNull();
    }
  });
  it('recognizes the new complete attempt independently of the closed earlier batch', () => {
    expect(batchReadiness(source, ATTEMPT).ready).toBe(true);
    expect(openBatchDates(source, loadLedger(source), NOW)).toEqual([ATTEMPT]);
    seed(`${DAY}-A10`);
    expect(openBatchDates(source, loadLedger(source), NOW)).toEqual([ATTEMPT, `${DAY}-A10`]);
  });
  it('tests the new attempt once while retaining the earlier receipt and production ledger', async () => {
    const originalLedger = readFileSync(join(source, 'ledger.json'), 'utf8');
    const originalReceipt = readFileSync(join(testDir, 'results', `${DAY}.json`), 'utf8');
    const result = await dispatch();
    expect(result.status).toBe('sent');
    expect(result.final.jobs).toEqual([posting(2)]);
    expect((await dispatch()).reason).toBe('already-sent');
    expect(posts).toHaveLength(1);
    expect(readFileSync(join(source, 'ledger.json'), 'utf8')).toBe(originalLedger);
    expect(readFileSync(join(testDir, 'results', `${DAY}.json`), 'utf8')).toBe(originalReceipt);
    expect(readJson(join(testDir, 'results', `${ATTEMPT}.json`)).batchDate).toBe(ATTEMPT);
  });
  it('stores attempt submissions separately and keeps a closed batch immutable', () => {
    const old = readFileSync(join(source, 'batches', DAY, 'reviewer-1.json'), 'utf8');
    writeJson(eventPath, {
      issue: {
        title: `[JOB-ALERT][${ATTEMPT}][reviewer-1]`,
        author_association: 'OWNER',
        body: '{"jobs":[]}',
      },
    });
    receive({
      env: { ...env, GITHUB_EVENT_PATH: eventPath, JOB_ALERT_STRICT_BATCH: 'true' },
      now: NOW,
    });
    expect(readJson(join(source, 'batches', ATTEMPT, 'reviewer-1.json')).jobs).toEqual([]);
    writeJson(eventPath, {
      issue: {
        title: `[JOB-ALERT][${DAY}][reviewer-1]`,
        author_association: 'OWNER',
        body: '{"jobs":[]}',
      },
    });
    const response = receive({
      env: { ...env, GITHUB_EVENT_PATH: eventPath, JOB_ALERT_STRICT_BATCH: 'true' },
      now: NOW,
    });
    expect(response.report.join('\n')).toContain('종료된 배치');
    expect(readFileSync(join(source, 'batches', DAY, 'reviewer-1.json'), 'utf8')).toBe(old);
  });
  it("rebuilds the declared recovery pending after midnight without changing tomorrow's list", async () => {
    const tomorrow = join(source, 'pending', '2026-10-14.json');
    writeJson(tomorrow, { date: '2026-10-14', jobs: [] });
    const before = readFileSync(tomorrow, 'utf8');
    writeJson(eventPath, {
      issue: {
        title: `[JOB-ALERT][${ATTEMPT}][collector-1]`,
        author_association: 'OWNER',
        body: JSON.stringify({ jobs: [posting(2)] }),
      },
    });
    const result = await processAlert({
      env: {
        ...env,
        GITHUB_EVENT_NAME: 'issues',
        GITHUB_EVENT_PATH: eventPath,
        JOB_ALERT_DEFER_SEND: 'true',
      },
      now: new Date('2026-10-14T00:15:00+09:00'),
      fetchImpl,
    });
    expect(result.result.pending.date).toBe(ATTEMPT);
    expect(readJson(join(source, 'pending', `${ATTEMPT}.json`)).collectorCount).toBe(5);
    expect(readFileSync(tomorrow, 'utf8')).toBe(before);
    expect(posts).toHaveLength(0);
  });
  it('releases and sends only the approved attempt after 08:00 on the next business day', async () => {
    await expect(dispatch({ JOB_ALERT_DESTINATION: 'production' }, NEXT)).rejects.toThrow(
      '승인 기록',
    );
    await dispatch();
    approveTest({ env, now: NOW });
    expect(
      (
        await dispatch(
          { JOB_ALERT_DESTINATION: 'production' },
          new Date('2026-10-14T07:59:59+09:00'),
        )
      ).reason,
    ).toBe('before-08:00');
    const result = await dispatch(
      { JOB_ALERT_DESTINATION: 'production', JOB_ALERT_BATCH_DATE: '' },
      NEXT,
    );
    expect(result.status).toBe('sent');
    expect(result.batchDate).toBe(ATTEMPT);
    expect(result.final.jobs).toEqual([posting(2)]);
    expect(readJson(join(source, 'ledger.json')).deliveries['2026-10-14'].batches).toEqual([
      ATTEMPT,
    ]);
    expect((await dispatch({ JOB_ALERT_DESTINATION: 'production' }, NEXT)).reason).toBe(
      'already-sent',
    );
    expect(posts).toHaveLength(2);
  });
  it('does not allow a same-day attempt into production', async () => {
    await expect(dispatch({ JOB_ALERT_DESTINATION: 'production' })).rejects.toThrow('이전 날짜');
    expect(posts).toHaveLength(0);
  });
  it('keeps force from bypassing the holiday and unavailable-calendar guards for attempts', async () => {
    for (const [now, reason] of [
      ['2026-10-09T21:00:00+09:00', 'public-holiday'],
      ['2027-01-08T21:00:00+09:00', 'holiday-calendar-unavailable'],
    ]) {
      const batch = `${now.slice(0, 10)}-A2`;
      seed(batch);
      const result = await dispatch(
        { JOB_ALERT_BATCH_DATE: batch, JOB_ALERT_FORCE: 'true' },
        new Date(now),
      );
      expect(result.reason).toBe(reason);
    }
    expect(posts).toHaveLength(0);
  });
});
