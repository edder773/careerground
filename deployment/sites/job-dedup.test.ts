import { describe, expect, it } from 'vitest';
import { duplicateJobReason, jobCompanyKey, jobDigestIdentity } from './job-dedup.js';

const window = {
  applicationStartAt: '2026-08-20T00:00:00.000Z',
  deadlineAt: '2026-09-10T14:59:59.000Z',
};

describe('job campaign and role identity', () => {
  it.each([
    ['KT', '㈜케이티', 'kt'],
    ['IBK기업은행', '중소기업은행(IBK기업은행)', 'ibk-bank'],
    ['KB국민은행', '(주)국민은행', 'kb-kookmin-bank'],
    ['NH농협은행', '농협은행(주)', 'nh-bank'],
    ['서울주택도시공사', '서울주택도시개발공사', 'sh-seoul-housing'],
    ['한솔피엔에스', '한솔PNS IT', 'hansol-pns'],
    ['SK브로드밴드', '에스케이브로드밴드(주)', 'sk-broadband'],
  ])('canonicalizes company aliases: %s / %s', (left, right, expected) => {
    expect(jobCompanyKey(left)).toBe(expected);
    expect(jobCompanyKey(right)).toBe(expected);
  });

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
    [
      {
        companyName: 'KT',
        title: '2026년 KT 대졸신입 채용 - NW인프라운용',
        sourceUrl: 'https://linkareer.example.test/kt-nw',
      },
      {
        companyName: '㈜케이티',
        title: '2026년 KT 대졸신입 채용',
        sourceUrl: 'https://jobkorea.example.test/kt',
      },
      'umbrella-campaign',
    ],
    [
      {
        companyName: 'IBK기업은행',
        title: '2026년 하반기 신입행원 채용 - 디지털/IT',
        sourceUrl: 'https://linkareer.example.test/ibk',
      },
      {
        companyName: '중소기업은행(IBK기업은행)',
        title: '2026년 하반기 신입행원 채용 - 디지털·IT',
        sourceUrl: 'https://job-alio.example.test/ibk',
      },
      'equivalent-title',
    ],
    [
      {
        companyName: 'Applied Materials Korea',
        title: '신입 채용 - Meso Vision / Metrology Algorithm Developer',
        sourceUrl: 'https://jasoseol.example.test/applied-materials',
      },
      {
        companyName: 'Applied Materials Korea',
        title: '[신입] MesoVision Algorithm Developer (석/박사)',
        sourceUrl: 'https://inthiswork.example.test/applied-materials',
      },
      'equivalent-title',
    ],
    [
      {
        companyName: '현대모비스',
        title: '2026년 하반기 신입 채용 - SW·AI·MES 관련 직무',
        sourceUrl: 'https://jasoseol.example.test/hyundai-mobis',
      },
      {
        companyName: '현대모비스',
        title: '2026년 하반기 신입 채용 - 연구직 SW·AI·자율주행',
        sourceUrl: 'https://linkareer.example.test/hyundai-mobis',
      },
      'umbrella-campaign',
    ],
  ])('blocks the production repeat regression: %s', (left, right, expectedReason) => {
    expect(duplicateJobReason({ ...right, ...window }, { ...left, ...window })).toBe(
      expectedReason,
    );
  });

  it('recognizes a generic developer recruitment advertised under its department name', () => {
    const previous = {
      companyName: '예시ERP',
      title: '2026년 예시ERP 신입 개발자 채용',
      ...window,
    };
    const current = { companyName: '예시ERP', title: '개발본부 신입 채용', ...window };
    expect(duplicateJobReason(current, previous)).toBe('equivalent-title');
    expect(duplicateJobReason({ ...current, title: '영업본부 신입 채용' }, previous)).toBeNull();
  });

  it('recognizes the renamed SH employer as one posting across job boards', () => {
    const previous = {
      companyName: '서울주택도시공사',
      title: '2026년 하반기 사무·기술직 신입사원 직무중심 채용',
      sourceUrl: 'https://first.example.test/sh',
      ...window,
    };
    const current = {
      ...previous,
      companyName: '서울주택도시개발공사',
      sourceUrl: 'https://second.example.test/sh',
    };
    expect(duplicateJobReason(current, previous)).toBe('equivalent-title');
  });

  it.each(['풀스택 개발자', 'SAP SD'])(
    'recognizes a company-labelled group recruitment umbrella covering %s',
    (role) => {
      const previous = {
        companyName: '한솔피엔에스',
        title: '[한솔PNS IT] 한솔그룹 2026년 하반기 신입사원 공개채용',
        sourceUrl: 'https://first.example.test/pns',
        ...window,
      };
      const current = {
        companyName: '한솔피엔에스',
        title: `[IT부문] 2026년 하반기 신입사원 공개채용(${role})`,
        sourceUrl: `https://second.example.test/pns/${role}`,
        ...window,
      };
      expect(jobDigestIdentity(previous).umbrella).toBe(true);
      expect(duplicateJobReason(current, previous)).toBe('umbrella-campaign');
    },
  );

  it('uses explicitly named group members without merging every subsidiary', () => {
    const umbrella = {
      companyName: '예시그룹',
      title: '2026년 하반기 신입사원 공개채용',
      itRole: '[예시제지] IT기획, [예시PNS] 웹개발자',
      ...window,
    };
    const member = {
      companyName: '예시제지',
      title: '2026년 하반기 신입사원 공개채용 - IT기획',
      ...window,
    };
    expect(duplicateJobReason(member, umbrella)).toBe('umbrella-campaign');
    expect(duplicateJobReason({ ...member, companyName: '예시화학' }, umbrella)).toBeNull();
    expect(
      duplicateJobReason(
        { ...member, title: '2027년 상반기 신입사원 공개채용 - IT기획' },
        umbrella,
      ),
    ).toBeNull();
    // One previously delivered subsidiary does not cover an entire group announcement.
    expect(duplicateJobReason(umbrella, member)).toBeNull();
  });

  it('keeps specialist PNS roles visible when neither posting is an umbrella', () => {
    const fullStack = {
      companyName: '한솔PNS IT',
      title: '[IT부문] 2026년 하반기 신입사원 공개채용(풀스택 개발자)',
      ...window,
    };
    const sap = {
      ...fullStack,
      companyName: '한솔피엔에스',
      title: '[IT부문] 2026년 하반기 신입사원 공개채용(SAP SD)',
    };
    expect(duplicateJobReason(sap, fullStack)).toBeNull();
  });

  it('keeps AT/DT and Infra roles separate across Korean/English company aliases', () => {
    const atDt = {
      companyName: '에스케이브로드밴드(주)',
      title: '2026년 하반기 SK브로드밴드 Junior Talent 채용(AT/DT)',
      ...window,
    };
    const infra = {
      ...atDt,
      companyName: 'SK브로드밴드',
      title: '2026년 SK브로드밴드 Junior Talent 채용(Infra)',
    };
    expect(duplicateJobReason(infra, atDt)).toBeNull();
  });

  it('blocks a 국민은행 cross-source repeat with a one-day start-date discrepancy', () => {
    const previous = {
      companyName: 'KB국민은행',
      title: '2026년 하반기 신입행원(L1) IT 부문 채용',
      applicationStartAt: '2026-08-31',
      deadlineAt: '2026-09-09',
      sourceUrl: 'https://linkareer.example.test/kb-it',
    };
    const current = {
      companyName: '(주)국민은행',
      title: '2026년 하반기 신입행원(L1) IT부문 채용',
      applicationStartAt: '2026-09-01T00:00:00+09:00',
      deadlineAt: '2026-09-09T18:00:00+09:00',
      sourceUrl: 'https://saramin.example.test/kb-it',
    };

    expect(duplicateJobReason(current, previous)).toBe('equivalent-title');
  });

  it('blocks a repeated campaign after a source corrects the deadline', () => {
    const previous = {
      companyName: 'KB국민은행',
      title: '2026년 하반기 신입행원(L1) IT 부문 채용',
      applicationStartAt: '2026-08-31',
      deadlineAt: '2026-09-09',
      sourceUrl: 'https://first.example.test/kb-it',
    };
    const corrected = {
      companyName: '(주)국민은행',
      title: '2026년 하반기 신입행원(L1) IT부문 채용',
      applicationStartAt: '2026-09-01',
      deadlineAt: '2026-09-16',
      sourceUrl: 'https://second.example.test/kb-it',
    };

    expect(duplicateJobReason(corrected, previous)).toBe('equivalent-title');
  });

  it('blocks a 코스콤 employee-recruitment umbrella after its IT role was delivered', () => {
    const previous = {
      companyName: '㈜코스콤',
      title: '(주) 코스콤 2026년 하반기 신입직원 채용 - IT 개발',
      applicationStartAt: '2026-09-07T00:00:00+09:00',
      deadlineAt: '2026-09-21T17:00:00+09:00',
      sourceUrl: 'https://m.jobkorea.co.kr/Recruit/GI_Read/49928921',
    };
    const current = {
      companyName: '(주)코스콤',
      title: '2026년 하반기 직원(신입/경력/기술) 채용 공고',
      applicationStartAt: '2026-09-07T09:00:00+09:00',
      deadlineAt: '2026-09-21T17:00:00+09:00',
      sourceUrl: 'https://job.incruit.com/jobdb_info/jobpost.asp?job=2609040001963',
    };

    expect(duplicateJobReason(current, previous)).toBe('umbrella-campaign');
  });

  it('blocks a 한국전력기술 umbrella when sources disagree on the opening date', () => {
    const previous = {
      companyName: '한국전력기술주식회사',
      title: '2026년도 하반기 정규직(신입사원) - 전산',
      applicationStartAt: '2026-09-07',
      deadlineAt: '2026-09-22',
      sourceUrl: 'https://m.ncs.go.kr/blind/bl04/RecrtNotifDetail.do?recrtNo=20260908114754',
    };
    const current = {
      companyName: '한국전력기술(주)',
      title: '2026년도 하반기 정규직(신입사원) 채용공고 - IT 직군 포함',
      applicationStartAt: '2026-09-14',
      deadlineAt: '2026-09-22T11:00:00+09:00',
      sourceUrl: 'https://lab.incruit.com/jobs/2609080000146',
    };

    expect(duplicateJobReason(current, previous)).toBe('umbrella-campaign');
  });

  it('treats a company-group recruitment title as the same campaign as its specialist posting', () => {
    const umbrella = {
      companyName: '포스코',
      title: '2026년 하반기 포스코그룹 신입사원/연구원 채용',
      applicationStartAt: '2026-09-01T00:00:00+09:00',
      deadlineAt: '2026-09-16T15:00:00+09:00',
      sourceUrl: 'https://jobkorea.example.test/posco-group',
    };
    const specialist = {
      companyName: '포스코',
      title: '2026년 하반기 신입사원/연구원 채용 - AI',
      applicationStartAt: '2026-09-01T01:00:00+09:00',
      deadlineAt: '2026-09-16T06:00:00+09:00',
      sourceUrl: 'https://jasoseol.example.test/posco-ai',
    };

    expect(duplicateJobReason(specialist, umbrella)).toBe('equivalent-title');
  });

  it('does not merge campaigns from different half-years even when dates are corrected', () => {
    const firstHalf = {
      companyName: '예시회사',
      title: '2026년 상반기 신입 개발자 채용',
      applicationStartAt: '2026-08-31',
      deadlineAt: '2026-09-09',
    };
    const secondHalf = {
      companyName: '예시회사',
      title: '2026년 하반기 신입 개발자 채용',
      applicationStartAt: '2026-09-01',
      deadlineAt: '2026-09-16',
    };

    expect(duplicateJobReason(secondHalf, firstHalf)).toBeNull();
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

  it.each([
    ['KT', 'KT Cloud'],
    ['IBK기업은행', 'IBK투자증권'],
  ])('does not merge separate companies with a shared brand token: %s / %s', (left, right) => {
    expect(jobCompanyKey(left)).not.toBe(jobCompanyKey(right));
  });

  it('keeps separate MesoVision roles in the same recruitment window', () => {
    const algorithm = {
      companyName: 'Applied Materials Korea',
      title: 'MesoVision Algorithm Developer',
      ...window,
    };
    const hardware = {
      companyName: 'Applied Materials Korea',
      title: 'MesoVision Hardware Engineer',
      ...window,
    };

    expect(duplicateJobReason(hardware, algorithm)).toBeNull();
  });

  it.each([
    ['게임 클라이언트 개발자', '광고 수익화 SDK 개발자'],
    ['Digital Twin 플랫폼 개발', 'Remote Operation 플랫폼 개발'],
    ['2026 Junior Talent 채용 - Tech', '2026 Junior Talent 채용 - Infra'],
  ])('keeps separate specialist roles from one company campaign: %s / %s', (left, right) => {
    const leftJob = { companyName: '전문직무 테스트 회사', title: left, ...window };
    const rightJob = { companyName: '전문직무 테스트 회사', title: right, ...window };

    expect(duplicateJobReason(rightJob, leftJob)).toBeNull();
  });
});
