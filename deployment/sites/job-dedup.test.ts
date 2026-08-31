import { describe, expect, it } from 'vitest';
import { duplicateJobReason, jobCompanyKey, jobDigestIdentity } from './job-dedup.js';

const window = {
  applicationStartAt: '2026-08-20T00:00:00.000Z',
  deadlineAt: '2026-09-10T14:59:59.000Z',
};

describe('job campaign and role identity', () => {
  it.each([
    [
      { companyName: '미래에셋자산운용', title: 'OMS 개발 및 운영(채용연계형 인턴)', ...window },
      {
        companyName: '미래에셋자산운용',
        title: '주문관리시스템(OMS) 개발 및 운영 채용연계형 인턴',
        ...window,
      },
    ],
    [
      { companyName: '우리은행', title: '2026 하반기 신입행원 채용 TECH/IT개발', ...window },
      {
        companyName: '우리은행',
        title: '2026 하반기 우리은행 신입행원 채용 TECH IT개발',
        ...window,
      },
    ],
    [
      { companyName: '넥슨코리아', title: '2026 넥토리얼 Game Programmer', ...window },
      { companyName: '넥슨컴퍼니', title: '2026년 채용형 인턴십 넥토리얼', ...window },
    ],
    [
      {
        companyName: 'LG에너지솔루션',
        title: '2026년 하반기 신입사원 수시채용 IT/SW/AI',
        ...window,
      },
      { companyName: 'LG에너지솔루션', title: 'Digital Twin 플랫폼 개발', ...window },
    ],
  ])('recognizes a cross-source repeat from the same recruitment campaign', (left, right) => {
    expect(duplicateJobReason(right, left)).not.toBeNull();
  });

  it.each([
    ['iOS 엔지니어 인턴', 'Android 엔지니어 인턴'],
    ['데이터 분석가 인턴', 'Flutter 개발자 인턴'],
    ['백엔드 엔지니어', '프론트엔드 엔지니어'],
  ])('keeps distinct roles visible: %s / %s', (leftTitle, rightTitle) => {
    const left = { companyName: '넛지헬스케어', title: leftTitle, ...window };
    const right = { companyName: '너지', title: rightTitle, ...window };

    expect(jobCompanyKey(left.companyName)).toBe(jobCompanyKey(right.companyName));
    expect(jobDigestIdentity(left).roleKey).not.toBe(jobDigestIdentity(right).roleKey);
    expect(duplicateJobReason(right, left)).toBeNull();
  });

  it('does not collapse separate annual campaigns or separate source URLs without a matching role', () => {
    const previous = {
      companyName: '예시회사',
      title: '2025 백엔드 개발자 신입 채용',
      applicationStartAt: '2025-08-20T00:00:00.000Z',
      deadlineAt: '2025-09-10T14:59:59.000Z',
      sourceUrl: 'https://example.test/2025',
    };
    const current = {
      companyName: '예시회사',
      title: '2026 백엔드 개발자 신입 채용',
      ...window,
      sourceUrl: 'https://example.test/2026',
    };

    expect(duplicateJobReason(current, previous)).toBeNull();
  });
});
