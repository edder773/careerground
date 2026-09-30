import { describe, expect, it } from 'vitest';
import { canonicalizeHttpUrl } from './canonical-json.mjs';

describe('canonicalizeHttpUrl', () => {
  it('preserves a mobile-only Saramin posting route', () => {
    expect(
      canonicalizeHttpUrl(
        'https://m.saramin.co.kr/job-search/view?rec_idx=55130970&utm_source=test',
      ),
    ).toBe('https://m.saramin.co.kr/job-search/view?rec_idx=55130970');
  });

  it('keeps an actual desktop Saramin route on its original host', () => {
    expect(
      canonicalizeHttpUrl('https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=55130970'),
    ).toBe('https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=55130970');
  });
});
