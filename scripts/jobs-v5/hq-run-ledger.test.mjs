import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assessRunLedger,
  collectionIdentity,
  createRunLedger,
  freezeRunInputs,
  transitionRunLedger,
} from './hq-run-ledger.mjs';

const runId = 'CG-2026-09-28-A1';
const inputManifestId = 'frozen-manifest';
const observedAt = '2026-09-28T20:00:00+09:00';
const digest = 'a'.repeat(64);
const reviewThreads = {
  1: '11111111-1111-1111-1111-111111111111',
  2: '22222222-2222-2222-2222-222222222222',
  3: '33333333-3333-3333-3333-333333333333',
};
const manifest = {
  runId,
  targetAsOfDate: '2026-09-28',
  attempt: 1,
  candidateCount: 15,
  candidateIndex: Array.from({ length: 15 }, (_, index) => ({
    candidateId: `P1-${String(index + 1).padStart(4, '0')}`,
  })),
  currentState: { fileId: 'state', sha256: digest },
  collections: [1, 2, 3, 4, 5].map((partitionId) => ({
    partitionId,
    fileId: `file-${partitionId}`,
    size: 100,
    sha256: digest,
    rowCount: partitionId,
  })),
};
const base = () =>
  createRunLedger({
    manifest,
    manifestId: inputManifestId,
    manifestSha256: digest,
    createdAt: observedAt,
    scheduledDispatchAt: observedAt,
    scheduledCollectAt: '2026-09-28T20:30:00+09:00',
    reviewThreads,
  });
const event = (ledger, role, type, extra = {}) => ({
  runId,
  inputManifestId,
  role,
  stageKey: ledger.requests[role].stageKey,
  type,
  observedAt,
  ...extra,
});

describe('two-wake HQ ledger', () => {
  it('freezes only five complete same-run collection files and a complete current-state snapshot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cg-hq-freeze-'));
    const sources = [
      ['JobKorea', 'Wanted', 'Catch'],
      ['Superookie', 'Work24', 'Saramin'],
      ['Jumpit', 'Inthiswork', 'Remember Career'],
      ['RocketPunch', 'Incruit', 'LinkedIn Korea'],
      ['Jasoseol', 'Linkareer', 'JOB-ALIO'],
    ];
    const collections = sources.map((assignedSources, index) => {
      const partitionId = index + 1;
      const path = join(dir, `P${partitionId}.json`);
      writeFileSync(
        path,
        JSON.stringify({
          runId,
          targetAsOfDate: '2026-09-28',
          attempt: 1,
          partitionId,
          status: 'COMPLETE',
          baseline: {
            fileId: '1l08BzJYaFzrDWg4d3OV9b3DPdDpU_8Cc',
            rowCount: 392,
          },
          assignedSources,
          sourceCoverage: assignedSources.map((sourceName) => ({ sourceName })),
          rowCount: 0,
          items: [],
        }),
      );
      return { path, fileId: `collection-${partitionId}`, fileName: `P${partitionId}.json` };
    });
    const statePath = join(dir, 'current-state.json');
    writeFileSync(
      statePath,
      JSON.stringify({
        runId,
        capturedAt: observedAt,
        complete: true,
        truncated: false,
        tables: {
          jobs: [],
          slack_digest_items: [],
          slack_digest_job_reservations: [],
          slack_digest_deliveries: [],
        },
      }),
    );
    const input = {
      targetAsOfDate: '2026-09-28',
      collections,
      currentState: { path: statePath, fileId: 'state-id', fileName: 'current-state.json' },
      frozenAt: observedAt,
    };
    const frozen = freezeRunInputs(input);
    expect(frozen.candidateCount).toBe(0);
    expect(frozen.collections).toHaveLength(5);
    expect(frozen.collections[0]).toMatchObject({ partitionId: 1, fileId: 'collection-1' });
    expect(frozen.currentState).toMatchObject({ fileId: 'state-id' });
    const verifiedBaseline = JSON.parse(readFileSync(collections[2].path, 'utf8'));
    verifiedBaseline.baseline = {
      fileId: '1l08BzJYaFzrDWg4d3OV9b3DPdDpU_8Cc',
      status: 'VERIFIED',
      expectedRowCount: 392,
      actualRowCount: 392,
      expectedSha256: '7773b227a6c37335282fbeea48f479a294e8f71585b5dbc5644aaf5f445cfa57',
      actualSha256: '7773b227a6c37335282fbeea48f479a294e8f71585b5dbc5644aaf5f445cfa57',
    };
    writeFileSync(collections[2].path, JSON.stringify(verifiedBaseline));
    expect(freezeRunInputs(input).candidateCount).toBe(0);
    verifiedBaseline.baseline.actualSha256 = '0'.repeat(64);
    writeFileSync(collections[2].path, JSON.stringify(verifiedBaseline));
    expect(() => freezeRunInputs(input)).toThrow(
      expect.objectContaining({ code: 'INPUT_NOT_READY' }),
    );
    verifiedBaseline.baseline.actualSha256 = verifiedBaseline.baseline.expectedSha256;
    verifiedBaseline.baseline.rowCount = 391;
    writeFileSync(collections[2].path, JSON.stringify(verifiedBaseline));
    expect(() => freezeRunInputs(input)).toThrow(
      expect.objectContaining({ code: 'INPUT_NOT_READY' }),
    );
    delete verifiedBaseline.baseline.rowCount;
    writeFileSync(collections[2].path, JSON.stringify(verifiedBaseline));
    const changed = JSON.parse(readFileSync(collections[4].path, 'utf8'));
    changed.rowCount = 1;
    writeFileSync(collections[4].path, JSON.stringify(changed));
    expect(() => freezeRunInputs(input)).toThrow(
      expect.objectContaining({ code: 'INPUT_NOT_READY' }),
    );
  });
  it('freezes five inputs and rejects a changed collection identity', () => {
    const ledger = base();
    expect(ledger.candidateCount).toBe(15);
    expect(ledger.collectionIdentity).toBe(collectionIdentity(manifest.collections));
    expect(
      collectionIdentity(
        manifest.collections.map((item, index) => (index === 0 ? { ...item, size: 101 } : item)),
      ),
    ).not.toBe(ledger.collectionIdentity);
    expect(() => collectionIdentity(manifest.collections.slice(1))).toThrow();
  });

  it('records intent before a message and survives a repeated 20:00 wake without resending', () => {
    const initial = base();
    const intent = transitionRunLedger(initial, event(initial, 1, 'DISPATCH_INTENT'));
    expect(intent.requests[1].status).toBe('INTENT_RECORDED');
    expect(transitionRunLedger(intent, event(intent, 1, 'DISPATCH_INTENT'))).toEqual(intent);
    const confirmed = transitionRunLedger(
      intent,
      event(intent, 1, 'CHAT_MESSAGE_VERIFIED', {
        threadId: reviewThreads[1],
        userMessageId: 'user-message-1',
      }),
    );
    expect(confirmed.requests[1].status).toBe('REQUESTED');
    expect(transitionRunLedger(confirmed, event(confirmed, 1, 'DISPATCH_INTENT'))).toEqual(
      confirmed,
    );
    expect(() =>
      transitionRunLedger(
        confirmed,
        event(confirmed, 1, 'CHAT_MESSAGE_VERIFIED', {
          threadId: reviewThreads[1],
          userMessageId: 'other-message',
        }),
      ),
    ).toThrow(expect.objectContaining({ code: 'LEDGER_DISPATCH_UNCERTAIN' }));
  });

  it('keeps an interrupted dispatch uncertain until the actual Chat message is observed', () => {
    const initial = base();
    const intent = transitionRunLedger(initial, event(initial, 2, 'DISPATCH_INTENT'));
    const uncertain = transitionRunLedger(
      intent,
      event(intent, 2, 'DISPATCH_UNCERTAIN', {
        reason: 'REQUEST_SAVED_BUT_NO_RESPONSE',
      }),
    );
    expect(assessRunLedger(uncertain).missingRoles).toContainEqual({
      role: 2,
      status: 'DISPATCH_UNCERTAIN',
      userMessageId: null,
    });
    const recovered = transitionRunLedger(
      uncertain,
      event(uncertain, 2, 'CHAT_MESSAGE_VERIFIED', {
        threadId: reviewThreads[2],
        userMessageId: 'persisted-user-message',
      }),
    );
    expect(recovered.requests[2].userMessageId).toBe('persisted-user-message');
  });

  it('waits once at 20:30 for the missing role and rejects another run or conflicting report', () => {
    let ledger = base();
    for (const role of [1, 2, 3]) {
      ledger = transitionRunLedger(ledger, event(ledger, role, 'DISPATCH_INTENT'));
      ledger = transitionRunLedger(
        ledger,
        event(ledger, role, 'CHAT_MESSAGE_VERIFIED', {
          threadId: reviewThreads[role],
          userMessageId: `message-${role}`,
        }),
      );
    }
    for (const role of [1, 2]) {
      ledger = transitionRunLedger(
        ledger,
        event(ledger, role, 'REVIEW_FILE_VERIFIED', {
          fileId: `review-${role}`,
          sha256: digest,
          size: 500,
        }),
      );
    }
    expect(assessRunLedger(ledger)).toMatchObject({
      status: 'REVIEW_INCOMPLETE',
      reviewedRoles: [1, 2],
      missingRoles: [{ role: 3, status: 'REQUESTED' }],
      shouldRetryAutomatically: false,
    });
    expect(() =>
      transitionRunLedger(ledger, {
        ...event(ledger, 3, 'REVIEW_FILE_VERIFIED', {
          fileId: 'review-3',
          sha256: digest,
          size: 500,
        }),
        runId: 'CG-2026-09-27-A1',
      }),
    ).toThrow(expect.objectContaining({ code: 'LEDGER_EVENT_INVALID' }));
    ledger = transitionRunLedger(
      ledger,
      event(ledger, 3, 'REVIEW_FILE_VERIFIED', {
        fileId: 'review-3',
        sha256: digest,
        size: 500,
      }),
    );
    expect(assessRunLedger(ledger).status).toBe('REVIEWS_READY');
    expect(() =>
      transitionRunLedger(
        ledger,
        event(ledger, 3, 'REVIEW_FILE_VERIFIED', {
          fileId: 'other-review',
          sha256: digest,
          size: 500,
        }),
      ),
    ).toThrow(expect.objectContaining({ code: 'LEDGER_REVIEW_CONFLICT' }));
  });
});
