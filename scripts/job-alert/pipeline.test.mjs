import { describe, expect, it } from 'vitest';
import { buildFinal, buildPending } from './pipeline.mjs';

const now = new Date('2026-10-01T22:30:00Z'); // 2026-10-02 07:30 KST

const job = (id, overrides = {}) => ({
  companyName: `회사${id}`,
  title: `${id}번 신입 개발자`,
  sourceName: 'Saramin',
  sourceUrl: `https://www.saramin.co.kr/job-search/view?rec_idx=${id}`,
  deadlineAt: '2026-10-20T23:59:00+09:00',
  rolling: false,
  careerScope: 'NEW_GRAD_ONLY',
  ...overrides,
});

const pendingOf = (jobs) => ({ jobs });
const review = (...jobs) => ({ jobs });

describe('job alert pending list', () => {
  it('drops expired, rolling, already sent, and cross-source duplicate postings', () => {
    const kakao = job(1, {
      companyName: '(주)카카오',
      title: '2026 하반기 신입 백엔드 개발자 채용',
    });
    const kakaoMirror = job(2, {
      companyName: '카카오',
      title: '[카카오] 2026 하반기 백엔드 개발자 신입 채용',
      sourceUrl: 'https://www.jobkorea.co.kr/Recruit/GI_Read/2',
    });
    const { jobs, skipped } = buildPending({
      collectors: [
        { jobs: [kakao, job(3, { deadlineAt: '2026-09-30T23:59:00+09:00' })] },
        { jobs: [kakaoMirror, job(4, { rolling: true, deadlineAt: null }), job(5)] },
      ],
      sentJobs: [job(5, { sourceUrl: 'https://www.saramin.co.kr/job-search/view?rec_idx=5' })],
      now,
    });

    expect(jobs).toEqual([kakao]);
    expect(skipped).toEqual({ notAlertable: 2, restricted: 0, alreadySent: 1, duplicate: 1 });
  });

  it('drops postings open only to a protected group', () => {
    const veterans = job(1, { title: '2026년도 하반기 보훈 채용공고' });
    const { jobs, skipped } = buildPending({
      collectors: [{ jobs: [veterans, job(2, { title: '장애인 제한경쟁 신입 채용' }), job(3)] }],
      sentJobs: [],
      now,
    });
    expect(jobs).toEqual([job(3)]);
    expect(skipped.restricted).toBe(2);
  });

  it('treats a subsidiary posting listed under its parent company as a duplicate', () => {
    const parentListing = job(1, {
      companyName: '삼일회계법인',
      title: 'AC Digital팀 [삼일피더블유씨엑셀러레이션센터] 웹서비스 개발자 신입 채용',
      deadlineAt: '2026-10-06T23:59:00+09:00',
    });
    const subsidiary = job(2, {
      companyName: '삼일피더블유씨엑셀러레이션센터',
      title: '[삼일피더블유씨엑셀러레이션센터] 웹서비스 개발자 신입 채용',
      deadlineAt: '2026-10-06T23:59:00+09:00',
    });
    const otherRole = job(3, {
      companyName: '삼일피더블유씨엑셀러레이션센터',
      title: '데이터 엔지니어 신입 채용',
      deadlineAt: '2026-10-06T23:59:00+09:00',
    });
    const { jobs, skipped } = buildPending({
      collectors: [{ jobs: [parentListing] }, { jobs: [subsidiary, otherRole] }],
      sentJobs: [],
      now,
    });
    expect(jobs).toEqual([otherRole, parentListing]);
    expect(skipped.duplicate).toBe(1);
  });

  it('deduplicates NH bank aliases within a batch and against sent postings', () => {
    const original = job(1, {
      companyName: 'NH농협은행',
      title: '2026년 NH농협은행 신규직원 6급 채용(금융, 테크)',
      itRole: '테크',
    });
    const mirror = job(2, {
      companyName: '농협은행(주)',
      title: '2026년 NH농협은행 신규직원 6급(금융, 테크) 채용',
      itRole: '테크',
    });
    const separateEmployer = job(3, {
      companyName: '농협중앙회',
      title: original.title,
    });
    const current = buildPending({
      collectors: [{ jobs: [original] }, { jobs: [mirror, separateEmployer] }],
      sentJobs: [],
      now,
    });
    expect(current.jobs).toHaveLength(2);
    expect(current.jobs).toEqual(expect.arrayContaining([original, separateEmployer]));
    expect(current.skipped.duplicate).toBe(1);

    const subsequent = buildPending({
      collectors: [{ jobs: [mirror, separateEmployer] }],
      sentJobs: [original],
      now,
    });
    expect(subsequent.jobs).toEqual([separateEmployer]);
    expect(subsequent.skipped.alreadySent).toBe(1);
  });

  it('blocks a renamed employer and generic subsidiary umbrella against earlier deliveries', () => {
    const sh = job(1, {
      companyName: '서울주택도시공사',
      title: '2026년 하반기 사무·기술직 신입사원 직무중심 채용',
    });
    const renamedSh = job(2, { companyName: '서울주택도시개발공사', title: sh.title });
    const umbrella = job(3, {
      companyName: '한솔피엔에스',
      title: '[한솔PNS IT] 한솔그룹 2026년 하반기 신입사원 공개채용',
    });
    const fullStack = job(4, {
      companyName: '한솔피엔에스',
      title: '[IT부문] 2026년 하반기 신입사원 공개채용(풀스택 개발자)',
    });
    const sap = job(5, {
      companyName: '한솔피엔에스',
      title: '[IT부문] 2026년 하반기 신입사원 공개채용(SAP SD)',
    });
    const nextCampaign = job(6, {
      companyName: '한솔PNS IT',
      title: '2027년 상반기 신입사원 공개채용(SAP SD)',
    });
    const result = buildPending({
      collectors: [{ jobs: [renamedSh, fullStack, sap, nextCampaign] }],
      sentJobs: [sh, umbrella],
      now,
    });
    expect(result.jobs).toEqual([nextCampaign]);
    expect(result.skipped.alreadySent).toBe(3);
    const withinBatch = buildPending({
      collectors: [{ jobs: [umbrella, fullStack, sap] }],
      sentJobs: [],
      now,
    });
    expect(withinBatch.jobs).toEqual([umbrella]);
    expect(withinBatch.skipped.duplicate).toBe(2);
  });

  it('remembers explicitly covered subsidiaries in a group-wide delivery', () => {
    const umbrella = job(1, {
      companyName: '예시그룹',
      title: '2026년 하반기 신입사원 공개채용',
      itRole: '[예시제지] IT기획, [예시PNS] 웹개발자',
    });
    const member = job(2, {
      companyName: '예시제지',
      title: '2026년 하반기 신입사원 공개채용 - IT기획',
    });
    const unrelated = job(3, { companyName: '예시화학', title: member.title });
    const nextYear = job(4, {
      companyName: '예시제지',
      title: '2027년 상반기 신입사원 공개채용 - IT기획',
    });
    const result = buildPending({
      collectors: [{ jobs: [member, unrelated, nextYear] }],
      sentJobs: [umbrella],
      now,
    });
    expect(result.jobs).toEqual(expect.arrayContaining([unrelated, nextYear]));
    expect(result.jobs).toHaveLength(2);
    expect(result.skipped.alreadySent).toBe(1);
    const withinBatch = buildPending({
      collectors: [{ jobs: [umbrella, member, unrelated] }],
      sentJobs: [],
      now,
    });
    expect(withinBatch.jobs).toEqual(expect.arrayContaining([umbrella, unrelated]));
    expect(withinBatch.jobs).toHaveLength(2);
  });

  it('does not re-alert a generic developer campaign under its department heading', () => {
    const previous = job(1, { companyName: '예시ERP', title: '2026년 예시ERP 신입 개발자 채용' });
    const current = job(2, { companyName: '예시ERP', title: '개발본부 신입 채용' });
    expect(
      buildPending({ collectors: [{ jobs: [current] }], sentJobs: [previous], now }).jobs,
    ).toEqual([]);
  });

  it('orders the list by deadline', () => {
    const late = job(1, { deadlineAt: '2026-10-30T23:59:00+09:00' });
    const early = job(2, { deadlineAt: '2026-10-05T23:59:00+09:00' });
    expect(buildPending({ collectors: [{ jobs: [late, early] }], sentJobs: [], now }).jobs).toEqual(
      [early, late],
    );
  });
});

describe('job alert final list', () => {
  const pending = pendingOf([job(1), job(2), job(3)]);

  it('keeps jobs passed by at least two of three reviewers', () => {
    const final = buildFinal({
      pending,
      reviews: [review(job(1), job(2)), review(job(1)), review(job(2), job(3))],
      now,
    });
    expect(final.jobs.map((item) => item.sourceUrl)).toEqual([job(1).sourceUrl, job(2).sourceUrl]);
    expect(final).toMatchObject({ quorum: 2, reviewCount: 3, notPassed: 1, heldCount: 0 });
  });

  it('requires the only reviewer to agree when one review arrived', () => {
    const final = buildFinal({ pending, reviews: [review(job(3))], now });
    expect(final.jobs).toEqual([job(3)]);
    expect(final.quorum).toBe(1);
  });

  it('holds every job when no reviewer answered', () => {
    expect(buildFinal({ pending, reviews: [], now })).toMatchObject({
      jobs: [],
      heldCount: 3,
      quorum: 0,
    });
  });

  it('sends the collected copy even when a reviewer rewrites the posting', () => {
    const rewritten = job(1, { title: '1번 신입 개발자 (수정)', deadlineAt: '2027-01-01' });
    const final = buildFinal({ pending, reviews: [review(rewritten), review(job(1))], now });
    expect(final.jobs).toEqual([job(1)]);
  });

  it('ignores reviewer passes for postings that were never collected', () => {
    const final = buildFinal({ pending, reviews: [review(job(9)), review(job(9))], now });
    expect(final.jobs).toEqual([]);
  });
});
