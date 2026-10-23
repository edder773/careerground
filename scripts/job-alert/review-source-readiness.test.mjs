import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { receive } from './run.mjs';
import { loadSubmissions, saveSubmission, writeJson } from './store.mjs';

const DAY = '2026-10-23';
const NOW = new Date(DAY + 'T20:00:00+09:00');
const job = {
  companyName: '가상회사',
  title: '신입 소프트웨어 개발자',
  sourceName: 'Saramin',
  sourceUrl: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=123',
  deadlineAt: '2026-11-10',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
  itRole: '개발',
};
let root, env;
const collect = (date, count, jobs = []) => {
  for (let slot = 1; slot <= count; slot++)
    saveSubmission(root, date, { kind: 'collector', slot, date, jobs });
};
const review = (date = DAY, jobs = []) => {
  writeJson(env.GITHUB_EVENT_PATH, {
    issue: {
      title: '[JOB-ALERT][' + date + '][reviewer-1]',
      author_association: 'OWNER',
      body: JSON.stringify({ jobs }),
    },
  });
  return receive({ env, now: NOW });
};
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'review-source-'));
  env = {
    JOB_ALERT_DATA_DIR: root,
    JOB_ALERT_STRICT_BATCH: 'true',
    GITHUB_EVENT_PATH: join(root, 'event.json'),
  };
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
describe('strict reviewer collection prerequisites', () => {
  it('rejects an empty review before any collection exists', () => {
    expect(review().report.join(' ')).toContain('수집 배치 미완료');
    expect(loadSubmissions(root, DAY, 'reviewer')).toEqual([]);
  });
  it('rejects a nonempty review while one collector is missing', () => {
    collect(DAY, 4, [job]);
    expect(review(DAY, [job]).report.join(' ')).toContain('수집 배치 미완료');
    expect(loadSubmissions(root, DAY, 'reviewer')).toEqual([]);
  });
  it('does not borrow the five collectors from another attempt', () => {
    collect(DAY, 5);
    expect(review(DAY + '-A2').report.join(' ')).toContain('수집 배치 미완료');
    expect(loadSubmissions(root, DAY + '-A2', 'reviewer')).toEqual([]);
  });
  it('requires all five unique slots with matching batch metadata', () => {
    collect(DAY, 5);
    saveSubmission(root, DAY, { kind: 'collector', slot: 5, date: '2026-10-22', jobs: [] });
    expect(review().report.join(' ')).toContain('수집 배치 미완료');
    expect(loadSubmissions(root, DAY, 'reviewer')).toEqual([]);
  });
  it('allows a genuine empty review after five complete empty collections', () => {
    collect(DAY, 5);
    expect(review().report.join(' ')).toContain('공고 0건 접수');
    expect(loadSubmissions(root, DAY, 'reviewer')).toHaveLength(1);
  });
  it('allows the unchanged reviewed job after all five collectors exist', () => {
    collect(DAY, 5, [job]);
    expect(review(DAY, [job]).report.join(' ')).toContain('공고 1건 접수');
    expect(loadSubmissions(root, DAY, 'reviewer')[0].jobs).toEqual([
      { ...job, deadlineAt: '2026-11-10T23:59:00+09:00' },
    ]);
  });
});
