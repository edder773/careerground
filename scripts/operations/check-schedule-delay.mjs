import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const KST_OFFSET_MINUTES = 9 * 60;
const DEFAULT_OUTPUT = 'work/operations/daily-schedule-delay.json';

const finiteInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const kstDateParts = (date) => {
  const shifted = new Date(date.getTime() + KST_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
};

const expectedKstInstant = (observedAt, hour, minute) => {
  const { year, month, day } = kstDateParts(observedAt);
  let expectedAt = new Date(Date.UTC(year, month, day, hour, minute) - KST_OFFSET_MINUTES * 60_000);
  if (observedAt < expectedAt) {
    expectedAt = new Date(expectedAt.getTime() - 24 * 60 * 60_000);
  }
  return expectedAt;
};

export const scheduleClockFromCron = (value) => {
  const fields = String(value || '')
    .trim()
    .split(/\s+/u);
  if (fields.length < 2 || !/^\d{1,2}$/u.test(fields[0]) || !/^\d{1,2}$/u.test(fields[1])) {
    return null;
  }
  const minute = Number(fields[0]);
  const hour = Number(fields[1]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
};

export function evaluateScheduleDelay({
  observedAt = new Date(),
  expectedHour = 8,
  expectedMinute = 1,
  thresholdMinutes = 15,
  scheduleCron = '',
} = {}) {
  const observed = observedAt instanceof Date ? observedAt : new Date(observedAt);
  if (Number.isNaN(observed.getTime())) throw new Error('SCHEDULE_OBSERVED_AT must be ISO 8601.');
  const scheduledClock = scheduleClockFromCron(scheduleCron);
  const hour = scheduledClock?.hour ?? finiteInteger(expectedHour, 8);
  const minute = scheduledClock?.minute ?? finiteInteger(expectedMinute, 1);
  const threshold = finiteInteger(thresholdMinutes, 15);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || threshold < 0) {
    throw new Error('Schedule delay configuration is outside the allowed range.');
  }
  const expectedAt = expectedKstInstant(observed, hour, minute);
  const delayMs = Math.max(0, observed.getTime() - expectedAt.getTime());
  const delayMinutes = Number((delayMs / 60_000).toFixed(2));
  return {
    schema: 'careerground-schedule-delay/v1',
    checkedAt: new Date().toISOString(),
    timeZone: 'Asia/Seoul',
    expectedAt: expectedAt.toISOString(),
    observedAt: observed.toISOString(),
    delayMinutes,
    thresholdMinutes: threshold,
    status: delayMinutes <= threshold ? 'pass' : 'fail',
  };
}

export const formatScheduleDelaySummary = (report) =>
  [
    '## Daily digest schedule delay',
    '',
    `- Result: **${report.status.toUpperCase()}**`,
    `- Expected: ${report.expectedAt}`,
    `- Observed: ${report.observedAt}`,
    `- Delay: **${report.delayMinutes.toFixed(2)} minutes** (budget ${report.thresholdMinutes} minutes)`,
    '',
  ].join('\n');

export const formatScheduleDelayOutputs = (report) =>
  [
    `expected_at=${report.expectedAt}`,
    `observed_at=${report.observedAt}`,
    `delay_minutes=${report.delayMinutes}`,
    `threshold_minutes=${report.thresholdMinutes}`,
    '',
  ].join('\n');

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const report = evaluateScheduleDelay({
    observedAt: process.env.SCHEDULE_OBSERVED_AT || new Date(),
    expectedHour: process.env.SCHEDULE_EXPECTED_HOUR || 8,
    expectedMinute: process.env.SCHEDULE_EXPECTED_MINUTE || 1,
    scheduleCron: process.env.SCHEDULE_CRON || '',
    thresholdMinutes: process.env.SCHEDULE_DELAY_BUDGET_MINUTES || 15,
  });
  const outputPath = resolve(process.env.SCHEDULE_DELAY_OUTPUT_FILE || DEFAULT_OUTPUT);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const summary = formatScheduleDelaySummary(report);
  process.stdout.write(summary);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, formatScheduleDelayOutputs(report), 'utf8');
  }
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
  if (report.status === 'fail') process.exitCode = 1;
}
