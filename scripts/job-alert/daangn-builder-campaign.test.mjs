import { describe, expect, it } from 'vitest';
import { duplicateJobReason } from '../../deployment/sites/job-dedup.ts';

const campaign = {
  companyName: '당근',
  title: '[2027 당근 프로덕트 빌더 인턴십] Software Engineer Intern, Backend (채용전환형)',
  deadlineAt: '2026-12-06T23:59:00+09:00',
};
const feed = {
  ...campaign,
  title: '[2027 당근 프로덕트 빌더 인턴십] Software Engineer, Backend (채용전환형) - 피드 인프라',
};
const community = { ...feed, title: feed.title.replace('피드 인프라', '커뮤니티') };

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
});
