import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const policyUrl = new URL('../docs/operations/daily-job-refresh-automation.md', import.meta.url);

describe('daily Library job import policy', () => {
  it('uses only the latest final CareerGround Library JSON as job input', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('careerground-jobs-live-YYYY-MM-DD-final.json');
    expect(policy).toContain('파일명의 날짜가 가장 최근인 최종 파일을 선택한다.');
    expect(policy).toContain('선택한 라이브러리 파일의 실제 JSON 전체를 읽어 검증한다.');
    expect(policy).toContain(
      '채용 플랫폼, 기업 채용 페이지, 검색 엔진에서 신규 공고를 직접 찾지 않는다.',
    );
    expect(policy).toContain('라이브러리 JSON의 공고 URL을 다시 열어 상태를 재판정하지 않는다.');
  });

  it('allows only new ACTIVE inserts and preserves every existing row', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('`EXISTING_SKIPPED`');
    expect(policy).toContain('`NEW_ACTIVE`');
    expect(policy).toContain('`NON_ACTIVE_EXCLUDED`');
    expect(policy).toContain('기존 `jobs` 행을 `UPDATE`·`DELETE`하지 않는다.');
    expect(policy).toContain('`saved_jobs`를 `INSERT`·`UPDATE`·`DELETE`하지 않는다.');
    expect(policy).toContain('이 작업의 허용 변경은 `NEW_ACTIVE`의 `INSERT`뿐이다.');
  });

  it('fails closed for incomplete DB reads and duplicate conflicts', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('`truncated`, `omitted_rows`, `omitted_columns`, `truncated_values`');
    expect(policy).toContain('`CONFLICT_REVIEW_REQUIRED`');
    expect(policy).toContain('같은 `id` 또는 `fingerprint`가 있으면');
    expect(policy).toContain('데이터 무결성 실패로 중단한다.');
  });

  it('requires a forward-only insert migration and post-deploy DB verification', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('pnpm jobs:library:insert');
    expect(policy).toContain('ON CONFLICT(source_url) DO NOTHING');
    expect(policy).toContain('신규 URL이 모두 `ACTIVE`로 한 번씩 존재');
    expect(policy).toContain('업데이트 0건, 삭제 0건');
  });
});
