import { describe, expect, it, vi } from 'vitest';
import { buildPublishRequest, publishDiscovery } from './publish-discovery.mjs';

const handoff = {
  status: 'READY',
  schemaVersion: '2.0',
  targetAsOfDate: '2026-08-28',
  artifacts: [1, 2, 3].map((partition) => ({ partition, attempt: 2 })),
};
const report = {
  status: 'VERIFIED_DISCOVERY',
  workflowId: 'CG-JOBS-PROD-V5',
  targetAsOfDate: '2026-08-28',
  runId: 'CG-2026-08-28-A2-discovery',
};

describe('CareerGround v5 discovery publisher client', () => {
  it('builds a deterministic publish request from the selected handoff attempt', () => {
    expect(buildPublishRequest({ handoff, report, partitions: [{}, {}, {}] })).toMatchObject({
      artifactType: 'CAREERGROUND_DISCOVERY_PUBLISH_REQUEST',
      runId: 'CG-2026-08-28-A2-discovery',
      attempt: 2,
    });
  });

  it('sends the token only as a bearer header and accepts an idempotent receipt', async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      expect(init.headers.authorization).toBe('Bearer secret-value');
      expect(String(init.body)).not.toContain('secret-value');
      return new globalThis.Response(JSON.stringify({ status: 'ALREADY_PUBLISHED', inserted: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    await expect(
      publishDiscovery({
        endpoint: 'https://careerground.example/api/v1/internal/jobs-v5/publish',
        token: 'secret-value',
        request: { runId: report.runId },
        fetchImpl,
      }),
    ).resolves.toMatchObject({ status: 'ALREADY_PUBLISHED' });
  });

  it('retries a transient server failure with bounded exponential backoff', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new globalThis.Response(JSON.stringify({ code: 'DATABASE_ERROR' }), { status: 503 }),
      )
      .mockResolvedValueOnce(
        new globalThis.Response(JSON.stringify({ status: 'PUBLISHED', inserted: 2 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    const sleepImpl = vi.fn(async () => undefined);
    await expect(
      publishDiscovery({
        endpoint: 'https://careerground.example/api/v1/internal/jobs-v5/publish',
        token: 'secret-value',
        request: { runId: report.runId },
        fetchImpl,
        sleepImpl,
      }),
    ).resolves.toMatchObject({ status: 'PUBLISHED', inserted: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledWith(1_000);
  });

  it('does not retry a contract rejection', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new globalThis.Response(JSON.stringify({ code: 'PUBLISH_VALIDATION_FAILED' }), {
          status: 422,
        }),
    );
    const sleepImpl = vi.fn(async () => undefined);
    await expect(
      publishDiscovery({
        endpoint: 'https://careerground.example/api/v1/internal/jobs-v5/publish',
        token: 'secret-value',
        request: { runId: report.runId },
        fetchImpl,
        sleepImpl,
      }),
    ).rejects.toThrow('HTTP 422 (PUBLISH_VALIDATION_FAILED)');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleepImpl).not.toHaveBeenCalled();
  });
});
