import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ledgerEntry, loadLedger, saveSubmission, writeJson } from './store.mjs';
import { buildPending } from './pipeline.mjs';

const directories = [];
afterEach(() => {
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});
const umbrella = {
  companyName: '예시그룹',
  title: '2026년 하반기 신입사원 공개채용',
  sourceUrl: 'https://first.example.test/group',
  deadlineAt: '2026-10-20T23:59:00+09:00',
  itRole: '[예시제지] IT기획',
  rolling: false,
};
const legacy = () => {
  const entry = ledgerEntry(umbrella, '2026-10-02');
  delete entry.itRole;
  return entry;
};

describe('delivered group campaign metadata', () => {
  it('retains the original named IT fields on a newly delivered posting', () => {
    expect(ledgerEntry(umbrella, '2026-10-02')).toMatchObject({ itRole: umbrella.itRole });
  });

  it('recovers a legacy delivery only from an exactly matching archived collector object', () => {
    const dir = mkdtempSync(join(tmpdir(), 'alert-metadata-'));
    directories.push(dir);
    const original = legacy();
    const deliveries = { '2026-10-02': { mode: 'live', status: 'SENT', batches: ['2026-10-01'] } };
    writeJson(join(dir, 'ledger.json'), { sentJobs: [original], deliveries });
    saveSubmission(dir, '2026-10-01', {
      kind: 'collector',
      slot: 1,
      date: '2026-10-01',
      jobs: [umbrella],
    });
    const restored = loadLedger(dir);
    expect(restored.sentJobs).toEqual([{ ...original, itRole: umbrella.itRole }]);
    expect(restored.deliveries).toEqual(deliveries);
    const member = {
      ...umbrella,
      companyName: '예시제지',
      title: '2026년 하반기 신입사원 공개채용 - IT기획',
      sourceUrl: 'https://second.example.test/member',
      itRole: null,
    };
    expect(
      buildPending({
        collectors: [{ jobs: [member] }],
        sentJobs: restored.sentJobs,
        now: new Date('2026-10-06T09:00:00Z'),
      }).jobs,
    ).toEqual([]);
  });

  it('keeps a corrected deadline timestamp unchanged while recovering the same posting metadata', () => {
    const dir = mkdtempSync(join(tmpdir(), 'alert-metadata-'));
    directories.push(dir);
    const original = legacy();
    const deliveries = { '2026-10-02': { mode: 'live', status: 'SENT', batches: ['2026-10-01'] } };
    writeJson(join(dir, 'ledger.json'), { sentJobs: [original], deliveries });
    saveSubmission(dir, '2026-10-01', {
      kind: 'collector',
      slot: 1,
      date: '2026-10-01',
      jobs: [{ ...umbrella, deadlineAt: '2026-10-20T14:59:00+09:00' }],
    });
    expect(loadLedger(dir).sentJobs).toEqual([{ ...original, itRole: umbrella.itRole }]);
  });

  it('does not recover group coverage from a later, undelivered collection', () => {
    const dir = mkdtempSync(join(tmpdir(), 'alert-metadata-'));
    directories.push(dir);
    const original = legacy();
    const deliveries = { '2026-10-02': { mode: 'live', status: 'SENT', batches: ['2026-10-01'] } };
    writeJson(join(dir, 'ledger.json'), { sentJobs: [original], deliveries });
    saveSubmission(dir, '2026-10-06', {
      kind: 'collector',
      slot: 1,
      date: '2026-10-06',
      jobs: [umbrella],
    });
    expect(loadLedger(dir).sentJobs).toEqual([original]);
  });

  it.each(['companyName', 'title', 'deadlineAt', 'sourceUrl'])(
    'does not infer coverage when the archived %s differs',
    (field) => {
      const dir = mkdtempSync(join(tmpdir(), 'alert-metadata-'));
      directories.push(dir);
      const original = legacy();
      writeJson(join(dir, 'ledger.json'), {
        sentJobs: [original],
        deliveries: { '2026-10-02': { mode: 'live', status: 'SENT', batches: ['2026-10-01'] } },
      });
      saveSubmission(dir, '2026-10-01', {
        kind: 'collector',
        slot: 1,
        date: '2026-10-01',
        jobs: [{ ...umbrella, [field]: 'different' }],
      });
      expect(loadLedger(dir).sentJobs).toEqual([original]);
    },
  );
});
