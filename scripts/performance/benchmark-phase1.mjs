/* global console, process, Request */
import { performance } from 'node:perf_hooks';
import { handleD1Api } from '../../deployment/sites/d1-api.ts';
import { LocalD1 } from '../../deployment/sites/local-d1.ts';
import { createGoogleTestSession } from './google-test-session.mjs';

const db = new LocalD1();
const env = {
  DB: db,
  ADMIN_EMAILS: '',
  AUTH_TEST_MODE: 'true',
  MAX_ACTIVE_USERS: '100',
  REQUEST_LOGGING: 'false',
};
const sessionCookie = await createGoogleTestSession(env, {
  subject: 'phase-one-user',
  email: 'phase-one@example.test',
  displayName: 'Phase One',
});
const headers = { cookie: sessionCookie };

async function api(path, init = {}) {
  return handleD1Api(
    new Request(`https://benchmark.invalid/api/v1${path}`, {
      ...init,
      headers: { ...headers, ...(init.body ? { 'content-type': 'application/json' } : {}) },
    }),
    env,
  );
}

const percentile = (values, ratio) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
};

async function assertOk(response, label) {
  if (!response.ok) throw new Error(`${label} failed: ${response.status}`);
  await response.arrayBuffer();
}

async function loadLegacyHome() {
  await assertOk(await api('/auth/me'), '/auth/me');
  const paths = [
    '/collections',
    '/dashboard',
    '/coding/daily-challenges',
    '/notifications/unread-count',
  ];
  for (const path of paths) await assertOk(await api(path), path);
}

async function measure(label, operation) {
  await operation();
  const samples = [];
  let statementCount = 0;
  for (let attempt = 0; attempt < 9; attempt += 1) {
    db.resetQueryCount();
    const started = performance.now();
    await operation();
    samples.push(performance.now() - started);
    statementCount = Math.max(statementCount, db.getQueryCount());
  }
  return {
    label,
    p50Ms: Number(percentile(samples, 0.5).toFixed(2)),
    p95Ms: Number(percentile(samples, 0.95).toFixed(2)),
    preparedStatementCount: statementCount,
  };
}

await assertOk(
  await api('/auth/onboarding', {
    method: 'POST',
    body: JSON.stringify({ displayName: 'Phase One', preferredLanguage: 'javascript' }),
  }),
  '/auth/onboarding',
);
await loadLegacyHome();
const legacyHome = await measure(
  'auth plus four home endpoint handlers (sequential local adapter)',
  loadLegacyHome,
);

const bootstrapProbe = await api('/bootstrap?home=1');
let bootstrap = { available: bootstrapProbe.status !== 404, status: bootstrapProbe.status };
if (bootstrapProbe.ok) {
  await bootstrapProbe.arrayBuffer();
  bootstrap = {
    available: true,
    ...(await measure('single bootstrap request', async () => {
      await assertOk(await api('/bootstrap?home=1'), '/bootstrap?home=1');
    })),
  };
}

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      environment: {
        runtime: process.version,
        database: 'node:sqlite in-memory D1 compatibility adapter',
        scope: 'local API control-flow benchmark; excludes network and production D1 latency',
      },
      samplesPerScenario: 9,
      scenarios: { legacyHome, bootstrap },
    },
    null,
    2,
  ),
);

db.close();
