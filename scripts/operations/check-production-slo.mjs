import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { pathToFileURL, URL } from 'node:url';

const DEFAULT_BASE_URL = 'https://careerground-workspace.edder773.chatgpt.site';
const DEFAULT_OUTPUT = 'work/operations/production-slo.json';
const MIGRATION_AUTHORITY_URL = new URL(
  '../../deployment/sites/migration-authority.ts',
  import.meta.url,
);
const BUILD_INFO_URL = new URL('../../deployment/sites/build-info.ts', import.meta.url);

export const readSourceSchemaVersion = (source = readFileSync(MIGRATION_AUTHORITY_URL, 'utf8')) => {
  const match = source.match(/EXPECTED_SCHEMA_VERSION\s*=\s*'([^']+)'/u);
  if (!match?.[1]) {
    throw new Error('Repository migration authority does not declare EXPECTED_SCHEMA_VERSION.');
  }
  return match[1];
};

export const SOURCE_SCHEMA_VERSION = readSourceSchemaVersion();

export const readSourceBuildFeature = (source = readFileSync(BUILD_INFO_URL, 'utf8')) => {
  const match = source.match(/BUILD_FEATURE_VERSION\s*=\s*'([^']+)'/u);
  if (!match?.[1]) throw new Error('Repository build info does not declare BUILD_FEATURE_VERSION.');
  return match[1];
};

export const SOURCE_BUILD_FEATURE = readSourceBuildFeature();

const timedRequest = async (url, init = {}) => {
  const startedAt = performance.now();
  const response = await globalThis.fetch(url, {
    ...init,
    signal: init.signal || globalThis.AbortSignal.timeout(10_000),
  });
  return { response, durationMs: performance.now() - startedAt };
};

const readAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] || '';
};

const metaContent = (html, attribute, value) => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (readAttribute(tag, attribute).toLowerCase() === value.toLowerCase()) {
      return readAttribute(tag, 'content');
    }
  }
  return '';
};

const cspSources = (policy, directiveName) => {
  const directive = policy
    .split(';')
    .map((value) => value.trim().split(/\s+/))
    .find(([name]) => name?.toLowerCase() === directiveName.toLowerCase());
  return directive?.slice(1) || [];
};

const nearestRankPercentile = (values, percentile) => {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1)];
};

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function runProductionSlo({
  baseUrl = DEFAULT_BASE_URL,
  request = timedRequest,
  readinessSamples = 5,
  coldStartBudgetMs = 5_000,
  warmLatencyBudgetMs = 2_500,
  expectedSchemaVersion = SOURCE_SCHEMA_VERSION,
  expectedBuildFeature = SOURCE_BUILD_FEATURE,
  expectedBuildCommit = '',
} = {}) {
  const normalizedBase = new URL(baseUrl).origin;
  const checks = [];
  const failures = [];
  const record = (id, passed, detail) => {
    checks.push({ id, passed, detail });
    if (!passed) failures.push(`${id}: ${detail}`);
  };
  const perform = async (id, path, init) => {
    try {
      const target = path.startsWith('https://') ? path : `${normalizedBase}${path}`;
      return await request(target, init);
    } catch (error) {
      record(id, false, error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const liveResult = await perform('live.request', '/api/v1/health/live');
  let livePayload = null;
  if (liveResult) {
    livePayload = await safeJson(liveResult.response);
    record('live.status', liveResult.response.status === 200, `HTTP ${liveResult.response.status}`);
    record(
      'live.contract',
      livePayload?.status === 'ok' && livePayload?.database === 'd1',
      `status=${livePayload?.status || 'invalid'} database=${livePayload?.database || 'invalid'}`,
    );
  }

  const readinessDurations = [];
  let readinessPayload = null;
  let readinessHeaders = null;
  for (let index = 0; index < readinessSamples; index += 1) {
    const result = await perform(`readiness.sample-${index + 1}.request`, '/api/v1/health/ready');
    if (!result) continue;
    readinessDurations.push(Number(result.durationMs.toFixed(1)));
    const payload = await safeJson(result.response);
    readinessPayload = payload;
    readinessHeaders = result.response.headers;
    const canary = payload?.canary;
    const canaryIsHealthy = ['jobs', 'problems', 'learning', 'searchRows'].every(
      (key) => Number.isInteger(canary?.[key]) && canary[key] > 0,
    );
    const contractIsHealthy =
      result.response.status === 200 &&
      payload?.status === 'ok' &&
      payload?.database === 'd1' &&
      payload?.schema?.ready === true &&
      payload?.schema?.expectedVersion === expectedSchemaVersion &&
      payload?.schema?.appliedVersion === expectedSchemaVersion &&
      payload?.build?.featureVersion === expectedBuildFeature &&
      (!expectedBuildCommit || payload?.build?.commitSha === expectedBuildCommit) &&
      canaryIsHealthy;
    record(
      `readiness.sample-${index + 1}.contract`,
      contractIsHealthy,
      contractIsHealthy
        ? `HTTP 200 source=${expectedSchemaVersion} schema=${payload.schema.appliedVersion} feature=${payload.build.featureVersion} commit=${payload.build.commitSha}`
        : `HTTP ${result.response.status} source=${expectedSchemaVersion} expected=${payload?.schema?.expectedVersion || 'invalid'} applied=${payload?.schema?.appliedVersion || 'invalid'} feature=${payload?.build?.featureVersion || 'invalid'} commit=${payload?.build?.commitSha || 'invalid'} canary=${JSON.stringify(canary || null)}`,
    );
  }

  record(
    'readiness.sample-count',
    readinessDurations.length === readinessSamples,
    `${readinessDurations.length}/${readinessSamples} samples completed`,
  );
  const readinessColdStartMs = readinessDurations[0] ?? null;
  record(
    'readiness.cold-start',
    readinessColdStartMs !== null && readinessColdStartMs <= coldStartBudgetMs,
    readinessColdStartMs === null
      ? 'no cold-start latency sample'
      : `${readinessColdStartMs.toFixed(1)}ms <= ${coldStartBudgetMs}ms`,
  );
  const readinessWarmDurations = readinessDurations.slice(1);
  const readinessWarmP95Ms = nearestRankPercentile(readinessWarmDurations, 95);
  record(
    'readiness.warm-p95',
    readinessWarmP95Ms !== null && readinessWarmP95Ms <= warmLatencyBudgetMs,
    readinessWarmP95Ms === null
      ? 'no warm latency samples'
      : `${readinessWarmP95Ms.toFixed(1)}ms <= ${warmLatencyBudgetMs}ms`,
  );

  if (readinessHeaders) {
    const contentSecurityPolicy = readinessHeaders.get('content-security-policy') || '';
    const apiDefaultSources = cspSources(contentSecurityPolicy, 'default-src');
    const apiFrameAncestors = cspSources(contentSecurityPolicy, 'frame-ancestors');
    const apiObjectSources = cspSources(contentSecurityPolicy, 'object-src');
    record(
      'api-security.content-security-policy',
      apiDefaultSources.includes("'self'") &&
        apiFrameAncestors.includes("'none'") &&
        apiObjectSources.includes("'none'"),
      contentSecurityPolicy || 'missing header',
    );
    record(
      'api-security.content-type-options',
      readinessHeaders.get('x-content-type-options')?.toLowerCase() === 'nosniff',
      readinessHeaders.get('x-content-type-options') || 'missing header',
    );
    record(
      'api-security.referrer-policy',
      readinessHeaders.get('referrer-policy') === 'strict-origin-when-cross-origin',
      readinessHeaders.get('referrer-policy') || 'missing header',
    );
    record(
      'api-security.permissions-policy',
      readinessHeaders.get('permissions-policy') === 'camera=(), microphone=(), geolocation=()',
      readinessHeaders.get('permissions-policy') || 'missing header',
    );
    record(
      'api-security.frame-protection',
      readinessHeaders.get('x-frame-options') === 'DENY',
      readinessHeaders.get('x-frame-options') || 'missing header',
    );
    record(
      'api-observability.request-id',
      Boolean(readinessHeaders.get('x-request-id')),
      readinessHeaders.get('x-request-id') || 'missing header',
    );
    record(
      'api-observability.server-timing',
      /^app;dur=\d+(?:\.\d+)?$/.test(readinessHeaders.get('server-timing') || ''),
      readinessHeaders.get('server-timing') || 'missing header',
    );
  }

  const rootResult = await perform('static-root.request', '/');
  if (rootResult) {
    const html = await rootResult.response.text();
    record(
      'static-root.status',
      rootResult.response.status === 200,
      `HTTP ${rootResult.response.status}`,
    );
    record('static-root.mount', html.includes('<div id="root"></div>'), 'React mount node');
    const csp = metaContent(html, 'http-equiv', 'Content-Security-Policy');
    const staticDefaultSources = cspSources(csp, 'default-src');
    const staticObjectSources = cspSources(csp, 'object-src');
    const staticScriptSources = cspSources(csp, 'script-src');
    const staticFrameSources = cspSources(csp, 'frame-src');
    record(
      'static-security.content-security-policy',
      staticDefaultSources.includes("'self'") &&
        staticObjectSources.includes("'none'") &&
        staticScriptSources.length === 1 &&
        staticScriptSources[0] === "'self'" &&
        staticFrameSources.includes("'none'"),
      csp || 'missing CSP meta policy',
    );
    const referrerPolicy = metaContent(html, 'name', 'referrer');
    record(
      'static-security.referrer-policy',
      referrerPolicy === 'strict-origin-when-cross-origin',
      referrerPolicy || 'missing referrer meta policy',
    );
  }

  for (const path of ['/jobs', '/coding', '/learning']) {
    const id = path.slice(1);
    const result = await perform(`spa-deep-link.${id}.request`, path, {
      headers: { accept: 'text/html,application/xhtml+xml' },
    });
    if (!result) continue;
    const html = await result.response.text();
    const finalPath = result.response.url ? new URL(result.response.url).pathname : path;
    const passed =
      result.response.status === 200 &&
      result.response.redirected === false &&
      finalPath === path &&
      html.includes('<div id="root"></div>');
    record(
      `spa-deep-link.${id}.contract`,
      passed,
      `HTTP ${result.response.status} redirected=${result.response.redirected} finalPath=${finalPath}`,
    );
  }

  const faviconResult = await perform('static-favicon.request', '/favicon.svg');
  if (faviconResult) {
    record(
      'static-favicon.status',
      faviconResult.response.status === 200,
      `HTTP ${faviconResult.response.status}`,
    );
  }

  for (const [name, path] of [
    ['jobs', '/api/v1/jobs?limit=1'],
    ['learning', '/api/v1/learning'],
    ['coding', '/api/v1/coding/problems?track=ALGORITHM'],
  ]) {
    const result = await perform(`public-catalog.${name}.request`, path);
    if (!result) continue;
    const payload = await safeJson(result.response);
    const isCollection = Array.isArray(payload) || Array.isArray(payload?.items);
    record(
      `public-catalog.${name}.contract`,
      result.response.status === 200 && isCollection,
      `HTTP ${result.response.status} collection=${isCollection}`,
    );
  }

  const retiredAuth = await perform('retired-auth.request', '/api/v1/auth/config');
  if (retiredAuth) {
    const payload = await safeJson(retiredAuth.response);
    record(
      'retired-auth.contract',
      retiredAuth.response.status === 404 && payload?.code === 'ROUTE_RETIRED',
      `HTTP ${retiredAuth.response.status} code=${payload?.code || 'invalid'}`,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: normalizedBase,
    passed: failures.length === 0,
    latency: {
      readinessSamplesMs: readinessDurations,
      readinessColdStartMs,
      coldStartBudgetMs,
      readinessWarmSamplesMs: readinessWarmDurations,
      readinessWarmP95Ms,
      warmBudgetMs: warmLatencyBudgetMs,
    },
    schema: readinessPayload?.schema
      ? {
          sourceVersion: expectedSchemaVersion,
          ready: readinessPayload.schema.ready,
          expectedVersion: readinessPayload.schema.expectedVersion,
          appliedVersion: readinessPayload.schema.appliedVersion,
        }
      : null,
    build: readinessPayload?.build || null,
    canary: readinessPayload?.canary || null,
    checks,
    failures,
  };
}

export const formatSloSummary = (report) => {
  const result = report.passed ? 'PASS' : 'FAIL';
  const sourceVersion = report.schema?.sourceVersion || SOURCE_SCHEMA_VERSION;
  const version = report.schema?.appliedVersion || 'unavailable';
  const buildFeature = report.build?.featureVersion || 'unavailable';
  const buildCommit = report.build?.commitSha || 'unavailable';
  const coldStart =
    report.latency.readinessColdStartMs === null
      ? 'unavailable'
      : `${report.latency.readinessColdStartMs.toFixed(1)} ms`;
  const warmP95 =
    report.latency.readinessWarmP95Ms === null
      ? 'unavailable'
      : `${report.latency.readinessWarmP95Ms.toFixed(1)} ms`;
  const lines = [
    '## Production SLO smoke',
    '',
    `- Result: **${result}**`,
    `- Source schema: \`${sourceVersion}\``,
    `- Deployed schema: \`${version}\``,
    `- Deployed feature: \`${buildFeature}\``,
    `- Deployed commit: \`${buildCommit}\``,
    `- Readiness cold start: **${coldStart}** (budget ${report.latency.coldStartBudgetMs} ms)`,
    `- Readiness warm p95: **${warmP95}** (budget ${report.latency.warmBudgetMs} ms)`,
    `- Checks: ${report.checks.filter((check) => check.passed).length}/${report.checks.length} passed`,
  ];
  if (report.failures.length) {
    lines.push('', '### Failures', '', ...report.failures.map((failure) => `- ${failure}`));
  }
  return `${lines.join('\n')}\n`;
};

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const report = await runProductionSlo({
    baseUrl: process.env.SLO_BASE_URL || DEFAULT_BASE_URL,
    readinessSamples: Number(process.env.SLO_READINESS_SAMPLES || 5),
    coldStartBudgetMs: Number(process.env.SLO_READINESS_COLD_START_BUDGET_MS || 5_000),
    warmLatencyBudgetMs: Number(process.env.SLO_READINESS_WARM_P95_BUDGET_MS || 2_500),
    expectedBuildCommit: process.env.SLO_EXPECTED_BUILD_COMMIT || '',
  });
  const outputPath = resolve(process.env.SLO_OUTPUT_FILE || DEFAULT_OUTPUT);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const summary = formatSloSummary(report);
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
  }
  if (!report.passed) process.exitCode = 1;
}
