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
});
