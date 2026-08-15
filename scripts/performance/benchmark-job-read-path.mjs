/* global Request, TextEncoder, console, process, setTimeout */
import { performance } from 'node:perf_hooks';
import { handleD1Api } from '../../deployment/sites/d1-api.ts';
import { LocalD1 } from '../../deployment/sites/local-d1.ts';

const artificialDispatchLatencyMs = 25;
const sampleCount = 9;

const delay = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

class MeasuredStatement {
  constructor(inner, metrics) {
    this.inner = inner;
    this.metrics = metrics;
  }

  bind(...values) {
    return new MeasuredStatement(this.inner.bind(...values), this.metrics);
  }

  async first() {
    this.metrics.dispatches += 1;
    this.metrics.statements += 1;
    await delay(artificialDispatchLatencyMs);
    return this.inner.first();
  }

  async all() {
    this.metrics.dispatches += 1;
    this.metrics.statements += 1;
    await delay(artificialDispatchLatencyMs);
    return this.inner.all();
  }

  async run() {
    this.metrics.dispatches += 1;
    this.metrics.statements += 1;
    await delay(artificialDispatchLatencyMs);
    return this.inner.run();
  }
}

class MeasuredD1 {
  constructor(inner) {
    this.inner = inner;
    this.metrics = { dispatches: 0, statements: 0 };
  }

  prepare(sql) {
    return new MeasuredStatement(this.inner.prepare(sql), this.metrics);
  }

  async batch(statements) {
    this.metrics.dispatches += 1;
    this.metrics.statements += statements.length;
    await delay(artificialDispatchLatencyMs);
    return this.inner.batch(statements.map((statement) => statement.inner));
  }

  reset() {
    this.metrics.dispatches = 0;
    this.metrics.statements = 0;
  }
}

const headers = {
  'oai-authenticated-user-id': 'job-performance-user',
  'oai-authenticated-user-email': 'job-performance@example.test',
  'oai-authenticated-user-full-name': 'Job%20Performance',
  'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
};

const base = new LocalD1();
const measured = new MeasuredD1(base);
const env = {
  DB: measured,
  OPENAI_ADMIN_EMAILS: '',
  MAX_ACTIVE_USERS: '100',
  REQUEST_LOGGING: 'false',
};

async function request(path) {
  const response = await handleD1Api(
    new Request(`https://performance.invalid/api/v1${path}`, { headers }),
    env,
  );
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  return response.json();
}

const percentile = (values, ratio) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
};

await request('/auth/me');
await request('/jobs?sort=new&page=cursor&limit=40');

const samples = [];
for (let attempt = 0; attempt < sampleCount; attempt += 1) {
  measured.reset();
  const started = performance.now();
  const page = await request('/jobs?sort=new&page=cursor&limit=40');
  samples.push({
    durationMs: performance.now() - started,
    dispatches: measured.metrics.dispatches,
    statements: measured.metrics.statements,
    itemCount: page.items.length,
    total: page.total,
  });
}

const catalogSamples = [];
for (let attempt = 0; attempt < sampleCount; attempt += 1) {
  measured.reset();
  const started = performance.now();
  const payload = await request('/jobs/bootstrap?catalog=true');
  catalogSamples.push({
    durationMs: performance.now() - started,
    dispatches: measured.metrics.dispatches,
    statements: measured.metrics.statements,
    itemCount: payload.data.length,
    responseBytes: new TextEncoder().encode(JSON.stringify(payload)).byteLength,
  });
}

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      environment: {
        runtime: process.version,
        database: 'node:sqlite in-memory D1 compatibility adapter',
        data: 'repository migrations and catalog seed',
        artificialDispatchLatencyMs,
        scope: 'steady authenticated GET /jobs first cursor page',
      },
      samples: sampleCount,
      p50Ms: Number(
        percentile(
          samples.map((sample) => sample.durationMs),
          0.5,
        ).toFixed(2),
      ),
      p95Ms: Number(
        percentile(
          samples.map((sample) => sample.durationMs),
          0.95,
        ).toFixed(2),
      ),
      maxD1Dispatches: Math.max(...samples.map((sample) => sample.dispatches)),
      maxD1Statements: Math.max(...samples.map((sample) => sample.statements)),
      itemCount: samples[0].itemCount,
      total: samples[0].total,
      catalog: {
        p50Ms: Number(
          percentile(
            catalogSamples.map((sample) => sample.durationMs),
            0.5,
          ).toFixed(2),
        ),
        p95Ms: Number(
          percentile(
            catalogSamples.map((sample) => sample.durationMs),
            0.95,
          ).toFixed(2),
        ),
        maxD1Dispatches: Math.max(...catalogSamples.map((sample) => sample.dispatches)),
        maxD1Statements: Math.max(...catalogSamples.map((sample) => sample.statements)),
        itemCount: catalogSamples[0].itemCount,
        responseBytes: catalogSamples[0].responseBytes,
      },
    },
    null,
    2,
  ),
);

base.close();
