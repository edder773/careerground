import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { duplicateJobReason } from '../../deployment/sites/job-dedup.ts';
const job = (title, overrides = {}) => ({
  companyName: '카카오뱅크',
  title,
  deadlineAt: '2026-11-25T23:59:00+09:00',
  ...overrides,
});
const a = job('DevOps 엔지니어 (채용연계형 인턴)');
const b = job('DevOps 엔지니어링팀 정규직 전환형 인턴 채용');
describe('DevOps internship mirrors', () => {
  it('deduplicates the two sources in both orders', () => {
    assert.ok(duplicateJobReason(a, b));
    assert.ok(duplicateJobReason(b, a));
  });
  it('keeps other companies', () =>
    assert.equal(duplicateJobReason(a, job(b.title, { companyName: '다른은행' })), null));
  it('keeps different deadlines', () =>
    assert.equal(
      duplicateJobReason(a, job(b.title, { deadlineAt: '2026-12-25T23:59:00+09:00' })),
      null,
    ));
  it('keeps a different specialist role', () =>
    assert.equal(duplicateJobReason(a, job('백엔드 엔지니어링팀 정규직 전환형 인턴 채용')), null));
  it('keeps conflicting recruitment years', () =>
    assert.equal(
      duplicateJobReason(
        job('2026 DevOps 엔지니어 (채용연계형 인턴)'),
        job('2025 DevOps 엔지니어링팀 정규직 전환형 인턴 채용'),
      ),
      null,
    ));
});
