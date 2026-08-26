import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const policyUrl = new URL('../docs/operations/daily-job-refresh-automation.md', import.meta.url);

describe('daily validator-confirmed job sync policy', () => {
  it('uses only the latest exact final JSON and same-date merge audit', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('careerground-jobs-live-YYYY-MM-DD-final.json');
    expect(policy).toContain('careerground-merge-audit-YYYY-MM-DD.json');
    expect(policy).toContain('실제 파일 전체를 읽거나 materialize한다');
    expect(policy).toContain('최종 JSON 원본 바이트의 SHA-256과 일치');
    expect(policy).toContain(
      '채용 플랫폼, 기업 채용 페이지, 검색 엔진 또는 공고 URL에 접근하지 않는다',
    );
  });

  it('inserts only new ACTIVE rows and excludes uncertain new rows', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('기준선에 없는 `ACTIVE`');
    expect(policy).toContain('신규 `DEADLINE_UNKNOWN`, `NEEDS_REVIEW`, `EXPIRED`, `REMOVED`');
    expect(policy).toContain('INSERT하지 않는다');
    expect(policy).toContain('ON CONFLICT(source_url) DO NOTHING');
  });

  it('allows only audit-confirmed existing updates and permanently forbids destructive changes', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('`existingStatusChanges` 또는 `existingOtherFieldChanges`');
    expect(policy).toContain('`finalRecheckStatus=CONFIRMED`');
    expect(policy).toContain('`RETAINED_UNCONFIRMED`');
    expect(policy).toContain('`DELETE FROM jobs`를 사용하지 않는다');
    expect(policy).toContain('`saved_jobs`를 INSERT·UPDATE·DELETE하지 않는다');
  });

  it('fails closed for incomplete reads, conflicts, and unsafe migrations', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('`truncated`, `omitted_rows`, `omitted_columns`, `truncated_values`');
    expect(policy).toContain('기준선 `id` 또는 `fingerprint`와 충돌');
    expect(policy).toContain('pnpm jobs:validator:sync');
    expect(policy).toContain('신규 URL의 ACTIVE 단일 존재');
    expect(policy).toContain('`saved_jobs` 불변');
  });

  it('bounds the timestamp precision exception to one serialized second', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('차이가 999ms 이하');
    expect(policy).toContain('다음 초이거나 1,000ms 이상이면 실패');
  });
});
