import { describe, expect, it } from 'vitest';
import {
  evaluateScheduleDelay,
  formatScheduleDelaySummary,
  scheduleClockFromCron,
} from './check-schedule-delay.mjs';

describe('daily digest schedule delay checker', () => {
  it('accepts a run that starts within the 15 minute budget', () => {
    const report = evaluateScheduleDelay({ observedAt: '2026-08-26T23:02:00.000Z' });

    expect(report).toMatchObject({
      expectedAt: '2026-08-26T23:01:00.000Z',
      observedAt: '2026-08-26T23:02:00.000Z',
      delayMinutes: 1,
      status: 'pass',
    });
    expect(formatScheduleDelaySummary(report)).toContain('Result: **PASS**');
  });

  it('flags the reported 08:27 KST start as a 26 minute delay', () => {
    const report = evaluateScheduleDelay({ observedAt: '2026-08-25T23:27:00.000Z' });

    expect(report.delayMinutes).toBe(26);
    expect(report.status).toBe('fail');
  });

  it('measures a fallback against its own schedule instead of the 08:01 primary', () => {
    const report = evaluateScheduleDelay({
      observedAt: '2026-08-31T01:27:00.000Z',
      scheduleCron: '31 8 * * 1-5',
    });

    expect(report.expectedAt).toBe('2026-08-30T23:31:00.000Z');
    expect(report.delayMinutes).toBe(116);
    expect(scheduleClockFromCron('31 8 * * 1-5')).toEqual({ hour: 8, minute: 31 });
  });

  it('keeps the previous expected date when a run is delayed past KST midnight', () => {
    const report = evaluateScheduleDelay({ observedAt: '2026-08-26T15:05:00.000Z' });

    expect(report.expectedAt).toBe('2026-08-25T23:01:00.000Z');
    expect(report.delayMinutes).toBe(964);
    expect(report.status).toBe('fail');
  });

  it('rejects invalid timestamps and schedule ranges', () => {
    expect(() => evaluateScheduleDelay({ observedAt: 'not-a-date' })).toThrow(/ISO 8601/);
    expect(() => evaluateScheduleDelay({ expectedHour: 25 })).toThrow(/allowed range/);
  });
});
