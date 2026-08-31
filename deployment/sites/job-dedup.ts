export type ComparableJob = {
  companyName: string;
  title: string;
  applicationStartAt?: string | null;
  deadlineAt?: string | null;
};

export type JobDuplicateReason = 'equivalent-title' | 'shared-campaign' | 'umbrella-campaign';

const titleStopWords = new Set([
  '및',
  '채용',
  '모집',
  '공고',
  '신입',
  '신입사원',
  '신입행원',
  '인턴',
  '인턴십',
  '채용형',
  '채용연계형',
  '수시채용',
  '공개채용',
  '상반기',
  '하반기',
]);

const genericCampaignWords = new Set([
  ...titleStopWords,
  '개발',
  '개발자',
  '엔지니어',
  'engineer',
  'developer',
  '운영',
  '플랫폼',
  'platform',
  'programmer',
  'game',
]);

const compact = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/주식회사/g, '')
    .replace(/\(주\)|㈜/g, '')
    .replace(/[^0-9a-z가-힣]/g, '');

export function jobCompanyKey(value: string) {
  const normalized = compact(value);
  if (/^(넥슨|넥슨코리아|넥슨컴퍼니|nexon|nexonkorea)$/.test(normalized)) return 'nexon';
  if (/^(lg에너지솔루션|엘지에너지솔루션|lgenergysolution)$/.test(normalized)) {
    return 'lg-energy-solution';
  }
  return normalized;
}

const rawTitleTokens = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\boms\b/g, ' 주문관리시스템 ')
    .replace(/주문\s*관리\s*시스템/g, '주문관리시스템')
    .replace(/[^0-9a-z가-힣+#]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const kstDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const titleTokens = (job: ComparableJob) => {
  const companyTokens = new Set([
    compact(job.companyName),
    jobCompanyKey(job.companyName),
    ...rawTitleTokens(job.companyName).map(compact),
  ]);
  return new Set(
    rawTitleTokens(job.title).filter((token) => {
      const normalized = compact(token);
      return (
        normalized &&
        !companyTokens.has(normalized) &&
        !titleStopWords.has(token) &&
        !/^20\d{2}년?$/.test(token)
      );
    }),
  );
};

const dateKey = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return kstDayFormatter.format(parsed);
};

const sameRecruitmentWindow = (left: ComparableJob, right: ComparableJob) => {
  const leftDeadline = dateKey(left.deadlineAt);
  const rightDeadline = dateKey(right.deadlineAt);
  if (leftDeadline && rightDeadline) return leftDeadline === rightDeadline;
  const leftStart = dateKey(left.applicationStartAt);
  const rightStart = dateKey(right.applicationStartAt);
  return Boolean(leftStart && rightStart && leftStart === rightStart);
};

const intersection = (left: Set<string>, right: Set<string>) =>
  [...left].filter((token) => right.has(token));

const equivalentTitles = (left: ComparableJob, right: ComparableJob) => {
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  if (!leftTokens.size || !rightTokens.size) return false;
  const shared = intersection(leftTokens, rightTokens).length;
  const smallerSize = Math.min(leftTokens.size, rightTokens.size);
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return shared >= 2 && (shared / smallerSize >= 0.8 || shared / unionSize >= 0.72);
};

const sharedCampaignName = (left: ComparableJob, right: ComparableJob) => {
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  return intersection(leftTokens, rightTokens).some(
    (token) =>
      !genericCampaignWords.has(token) &&
      (/^[가-힣]{4,}$/.test(token) || /^[a-z0-9+#]{6,}$/.test(token)),
  );
};

const isUmbrellaTitle = (value: string) => {
  const normalized = value.normalize('NFKC').toLowerCase();
  const isRecruitment = /(신입사원|신입행원|공채|공개채용|수시채용|전\s*부문)/.test(normalized);
  if (!isRecruitment) return false;
  const domains = new Set(
    rawTitleTokens(normalized).filter((token) =>
      ['it', 'sw', 'ai', 'tech', '개발', '데이터', '소프트웨어'].includes(token),
    ),
  );
  return domains.size >= 2 || /전\s*부문|전\s*직군/.test(normalized);
};

export function duplicateJobReason(
  candidate: ComparableJob,
  existing: ComparableJob,
): JobDuplicateReason | null {
  if (!jobCompanyKey(candidate.companyName)) return null;
  if (jobCompanyKey(candidate.companyName) !== jobCompanyKey(existing.companyName)) return null;
  const sameWindow = sameRecruitmentWindow(candidate, existing);
  if (equivalentTitles(candidate, existing) && sameWindow) return 'equivalent-title';
  if (sameWindow && sharedCampaignName(candidate, existing)) return 'shared-campaign';
  if (sameWindow && (isUmbrellaTitle(candidate.title) || isUmbrellaTitle(existing.title))) {
    return 'umbrella-campaign';
  }
  return null;
}
