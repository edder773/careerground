import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateException, DATE, CODE_SHA, APPROVAL } from './job-alert-exception-20261013.mjs';

const valid = () => ({
  env: { JOB_ALERT_BATCH_DATE: DATE, JOB_ALERT_EXCEPTION_APPROVAL: APPROVAL, JOB_ALERT_LIVE: 'true', JOB_ALERT_DRY_RUN: 'false', JOB_ALERT_FORCE: 'false', JOB_ALERT_PRODUCTION_START_DATE: '2026-10-02' },
  now: new Date('2026-10-12T23:30:00Z'),
  ledger: { deliveries: {} },
  readiness: { ready: true, date: DATE, collectorCount: 5, reviewCount: 3, fingerprint: 'unchanged' },
  test: { status: 'SENT', mode: 'live', batchDate: DATE, codeSha: CODE_SHA, runId: '38274617623', reviewCount: 3, heldCount: 0, fingerprint: 'unchanged' },
  release: { status: 'READY', batchDate: DATE, codeSha: CODE_SHA, fingerprint: 'unchanged', testRunId: '38274617623' },
  changedPaths: ['.github/workflows/job-alert.yml', 'scripts/operations/job-alert-exception-20261013.mjs'],
});
test('explicit approved same-day exception passes without changing batch date', () => assert.doesNotThrow(() => validateException(valid())));
for (const [name, change] of [
  ['tomorrow', x => x.now = new Date('2026-10-13T23:30:00Z')],
  ['before 08:00', x => x.now = new Date('2026-10-12T22:59:59Z')],
  ['wrong batch', x => x.env.JOB_ALERT_BATCH_DATE = '2026-10-12'],
  ['missing explicit approval', x => delete x.env.JOB_ALERT_EXCEPTION_APPROVAL],
  ['live off', x => x.env.JOB_ALERT_LIVE = 'false'],
  ['force enabled', x => x.env.JOB_ALERT_FORCE = 'true'],
  ['uncertain delivery', x => x.ledger.deliveries[DATE] = { mode: 'live', status: 'UNCERTAIN' }],
  ['sent delivery', x => x.ledger.deliveries[DATE] = { mode: 'live', status: 'SENT' }],
  ['incomplete batch', x => x.readiness.ready = false],
  ['no READY', x => x.release = null],
  ['changed fingerprint', x => x.readiness.fingerprint = 'changed'],
  ['changed core code', x => x.changedPaths.push('scripts/job-alert/send.mjs')],
  ['uncertain test', x => x.test.status = 'UNCERTAIN'],
  ['wrong release test', x => x.release.testRunId = 'different'],
]) test(`rejects ${name}`, () => { const x = valid(); change(x); assert.throws(() => validateException(x)); });
