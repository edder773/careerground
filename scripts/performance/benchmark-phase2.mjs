/* global console, process, Request, Response */
import { performance } from 'node:perf_hooks';
import worker from '../../deployment/sites/worker.ts';
import { handleD1Api } from '../../deployment/sites/d1-api.ts';
import { LocalD1 } from '../../deployment/sites/local-d1.ts';

const headers = {
  'oai-authenticated-user-id': 'phase-two-user',
  'oai-authenticated-user-email': 'phase-two@example.test',
  'oai-authenticated-user-full-name': 'Phase%20Two',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
};

const percentile = (values, ratio) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
};

async function sampleColdBootstrap() {
  const db = new LocalD1();
  const env = {
    DB: db,
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
    OPENAI_ADMIN_EMAILS: '',
    MAX_ACTIVE_USERS: '100',
    REQUEST_LOGGING: 'false',
  };
  const onboarding = await handleD1Api(
    new Request('https://benchmark.invalid/api/v1/auth/onboarding', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Phase Two', preferredLanguage: 'javascript' }),
    }),
    env,
  );
  if (!onboarding.ok) throw new Error(`onboarding failed: ${onboarding.status}`);
  await onboarding.arrayBuffer();
  db.resetQueryCount();
  const started = performance.now();
  const response = await worker.fetch(
    new Request('https://benchmark.invalid/api/v1/bootstrap?home=1', { headers }),
    env,
    { waitUntil() {}, passThroughOnException() {} },
  );
  const durationMs = performance.now() - started;
  if (!response.ok) throw new Error(`bootstrap failed: ${response.status}`);
  await response.arrayBuffer();
  const preparedStatementCount = db.getQueryCount();
  db.close();
  return { durationMs, preparedStatementCount };
}

const samples = [];
for (let attempt = 0; attempt < 9; attempt += 1) samples.push(await sampleColdBootstrap());
const durations = samples.map((sample) => sample.durationMs);

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      environment: {
        runtime: process.version,
        database: 'fresh node:sqlite D1 compatibility adapter per sample',
        scope:
          'first authenticated home Worker request; excludes network and production D1 latency',
      },
      samples: samples.length,
      p50Ms: Number(percentile(durations, 0.5).toFixed(2)),
      p95Ms: Number(percentile(durations, 0.95).toFixed(2)),
      maxPreparedStatementCount: Math.max(
        ...samples.map((sample) => sample.preparedStatementCount),
      ),
    },
    null,
    2,
  ),
);
