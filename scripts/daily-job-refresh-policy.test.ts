import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const policyUrl = new URL('../docs/operations/daily-job-refresh-automation.md', import.meta.url);

describe('daily job refresh discovery policy', () => {
  it('requires a company-name backstop for generic recruiting titles', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('### 3.1 회사명 보완 탐색');
    expect(policy).toContain(
      '플랫폼별 키워드 탐색을 마친 뒤에는 회사명을 기준으로 한 보완 탐색을 반드시 수행한다.',
    );
    expect(policy).toContain('공식 채용 페이지와 최소 2개 공개 채용 출처에서 검색한다.');
    expect(policy).toContain('포괄 제목의 공고는 제목만으로 IT 또는 비IT를 판정하지 않는다.');
    expect(policy).toContain('`company-backstop.json`');
    expect(policy).toContain(
      '`ACTIVE_CANDIDATE`는 상세 직무와 현재 지원 가능 상태가 모두 확인된 경우에만 사용한다.',
    );
  });
});
