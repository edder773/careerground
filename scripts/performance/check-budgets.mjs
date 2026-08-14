import { spawnSync } from 'node:child_process';
import process from 'node:process';

const run = spawnSync(
  process.execPath,
  ['--import', 'tsx', 'scripts/performance/benchmark-d1.mjs'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  },
);
if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout);
  process.exit(run.status || 1);
}
const report = JSON.parse(run.stdout);
const budgets = {
  jobsCursor: { p95Ms: 250, responseBytes: 80_000, dbQueryCount: 8 },
  codingProblemsCursor: { p95Ms: 150, responseBytes: 40_000, dbQueryCount: 8 },
  solutionsCursor: { p95Ms: 250, responseBytes: 40_000, dbQueryCount: 8 },
  search: { p95Ms: 150, responseBytes: 20_000, dbQueryCount: 5 },
  notifications: { p95Ms: 150, responseBytes: 40_000, dbQueryCount: 6 },
};
const failures = [];
for (const [name, limits] of Object.entries(budgets)) {
  const metrics = report.metrics[name];
  if (!metrics) {
    failures.push(`${name}: metric missing`);
    continue;
  }
  for (const [field, maximum] of Object.entries(limits)) {
    if (Number(metrics[field]) > maximum) {
      failures.push(`${name}.${field}=${metrics[field]} > ${maximum}`);
    }
  }
}
process.stdout.write(
  `${JSON.stringify({ budgets, metrics: report.metrics, failures }, null, 2)}\n`,
);
if (failures.length) process.exit(1);
