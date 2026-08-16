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
  'oai-authenticated-user-id': 'learning-performance-user',
  'oai-authenticated-user-email': 'learning-performance@example.test',
  'oai-authenticated-user-full-name': 'Learning%20Performance',
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

async function sample(paths) {
  const samples = [];
  for (let attempt = 0; attempt < sampleCount; attempt += 1) {
    measured.reset();
    const started = performance.now();
    let payload;
    let responseBytes = 0;
    for (const path of paths) {
      payload = await request(path);
      responseBytes += new TextEncoder().encode(JSON.stringify(payload)).byteLength;
    }
    samples.push({
      durationMs: performance.now() - started,
      dispatches: measured.metrics.dispatches,
      statements: measured.metrics.statements,
      responseBytes,
      payload,
    });
  }
  return {
    p50Ms: Number(
      percentile(
        samples.map((entry) => entry.durationMs),
        0.5,
      ).toFixed(2),
    ),
    p95Ms: Number(
      percentile(
        samples.map((entry) => entry.durationMs),
        0.95,
      ).toFixed(2),
    ),
    maxD1Dispatches: Math.max(...samples.map((entry) => entry.dispatches)),
    maxD1Statements: Math.max(...samples.map((entry) => entry.statements)),
    responseBytes: samples[0].responseBytes,
    payload: samples[0].payload,
  };
}

await request('/auth/me');
const library = await request('/learning');
const units = library.flatMap((source) => source.units);
const unitId = units[0]?.id;
if (!unitId) throw new Error('Learning benchmark requires at least one published unit.');
await request(`/learning/units/${encodeURIComponent(unitId)}`);

const initialData = await sample(['/bootstrap', '/learning']);
const list = await sample(['/learning']);
const detail = await sample([`/learning/units/${encodeURIComponent(unitId)}`]);

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      environment: {
        runtime: process.version,
        database: 'node:sqlite in-memory D1 compatibility adapter',
        data: 'repository migrations and learning seed',
        artificialDispatchLatencyMs,
        scope: 'steady authenticated learning reads with controlled D1 dispatch delay',
      },
      samples: sampleCount,
      dataShape: {
        sources: library.length,
        units: units.length,
        selectedUnit: {
          flashcards: detail.payload.flashcards.length,
          questions: detail.payload.questions.length,
          attempts: detail.payload.questions.reduce(
            (sum, question) => sum + question.attempts.length,
            0,
          ),
        },
      },
      initialDataSequence: {
        p50Ms: initialData.p50Ms,
        p95Ms: initialData.p95Ms,
        maxD1Dispatches: initialData.maxD1Dispatches,
        maxD1Statements: initialData.maxD1Statements,
        responseBytes: initialData.responseBytes,
      },
      library: {
        p50Ms: list.p50Ms,
        p95Ms: list.p95Ms,
        maxD1Dispatches: list.maxD1Dispatches,
        maxD1Statements: list.maxD1Statements,
        responseBytes: list.responseBytes,
      },
      unitDetail: {
        p50Ms: detail.p50Ms,
        p95Ms: detail.p95Ms,
        maxD1Dispatches: detail.maxD1Dispatches,
        maxD1Statements: detail.maxD1Statements,
        responseBytes: detail.responseBytes,
      },
      interpretation:
        'The artificial delay exposes dispatch waves only; it is not a production latency claim.',
    },
    null,
    2,
  ),
);

base.close();
