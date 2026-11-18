import { describe, expect, it } from 'vitest';
import { duplicateJobReason } from '../../deployment/sites/job-dedup.ts';
import { buildFinal } from './pipeline.mjs';

const campaign = {
  companyName: '당근',
  sourceUrl: 'https://example.test/campaign',
  title: '[2027 당근 프로덕트 빌더 인턴십] Software Engineer Intern, Backend (채용전환형)',
  deadlineAt: '2026-12-06T23:59:00+09:00',
};
const feed = {
  ...campaign,
  sourceUrl: 'https://example.test/feed',
  title: '[2027 당근 프로덕트 빌더 인턴십] Software Engineer, Backend (채용전환형) - 피드 인프라',
};
const community = {
  ...feed,
  sourceUrl: 'https://example.test/community',
  title: feed.title.replace('피드 인프라', '커뮤니티'),
};

describe('Daangn product builder campaign', () => {
  it('matches the broad campaign to its delivered team posting', () =>
    expect(duplicateJobReason(campaign, feed)).not.toBeNull());
  it('matches in reverse', () => expect(duplicateJobReason(feed, campaign)).not.toBeNull());
  it('keeps distinct team postings distinct', () =>
    expect(duplicateJobReason(community, feed)).toBeNull());
  it('keeps a different year distinct', () =>
    expect(
      duplicateJobReason({ ...campaign, title: campaign.title.replace('2027', '2028') }, feed),
    ).toBeNull());
  it('keeps a different employer distinct', () =>
    expect(duplicateJobReason({ ...campaign, companyName: '다른회사' }, feed)).toBeNull());
  it('does not turn approval of the umbrella into approval of unreviewed teams', () => {
    const result = buildFinal({
      pending: { jobs: [campaign, community] },
      reviews: [{ jobs: [campaign] }, { jobs: [campaign] }, { jobs: [campaign] }],
      now: new Date('2026-11-18T13:00:00Z'),
    });
    expect(result.jobs).toEqual([campaign]);
  });
});
