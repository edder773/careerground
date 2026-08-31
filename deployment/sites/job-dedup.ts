export type ComparableJob = {
  companyName: string;
  title: string;
  applicationStartAt?: string | null;
  deadlineAt?: string | null;
  sourceUrl?: string | null;
};

export type JobDuplicateReason =
  'same-source' | 'equivalent-title' | 'shared-campaign-role' | 'umbrella-campaign';

export type JobDigestIdentity = {
  companyKey: string;
  campaignKey: string;
  roleKey: string;
  umbrella: boolean;
};

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
  '상시',
  '부문',
  '부문별',
  '직군',
]);

const roleNoiseWords = new Set([
  ...titleStopWords,
  '담당자',
  '경력무관',
  '대졸',
  '정규직',
  '계약직',
  '전환형',
]);

const compact = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/주식회사/g, '')
    .replace(/\(주\)|㈜/g, '')
    .replace(/[^0-9a-z가-힣]/g, '');

export function jobCompanyKey(value: string) {
  const normalized = compact(value)
    .replace(/코퍼레이션$/u, '')
    .replace(/컴퍼니$/u, '')
    .replace(/corporation$|company$|corp$|inc$/u, '');
  if (/^(넥슨|넥슨코리아|nexon|nexonkorea)$/u.test(normalized)) return 'nexon';
  if (/^(lg에너지솔루션|엘지에너지솔루션|lgenergysolution)$/u.test(normalized)) {
    return 'lg-energy-solution';
  }
  if (/^(미래에셋자산운용|miraeassetglobalinvestments)$/u.test(normalized)) {
    return 'mirae-asset-global-investments';
  }
  if (/^(우리은행|wooribank)$/u.test(normalized)) return 'woori-bank';
  if (/^(넛지헬스케어|너지|nudgehealthcare)$/u.test(normalized)) return 'nudge-healthcare';
  return normalized;
}

const normalizedTitle = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\boms\b/gu, ' 주문관리시스템 ')
    .replace(/주문\s*관리\s*시스템/gu, '주문관리시스템')
    .replace(/it\s*개발/gu, 'it 개발')
    .replace(/s\s*\/\s*w/gu, 'sw');

const rawTitleTokens = (value: string) =>
  normalizedTitle(value)
    .replace(/[^0-9a-z가-힣+#]+/gu, ' ')
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

const kstDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateKey = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return kstDayFormatter.format(parsed);
};

const companyTokens = (job: ComparableJob) =>
  new Set([
    compact(job.companyName),
    jobCompanyKey(job.companyName),
    ...rawTitleTokens(job.companyName).map(compact),
  ]);

const meaningfulTitleTokens = (job: ComparableJob) => {
  const excludedCompanyTokens = companyTokens(job);
  return rawTitleTokens(job.title).filter((token) => {
    const normalized = compact(token);
    return (
      normalized &&
      !excludedCompanyTokens.has(normalized) &&
      !titleStopWords.has(token) &&
      !/^20\d{2}년?$/u.test(token)
    );
  });
};

const namedCampaignTokens = (job: ComparableJob) =>
  meaningfulTitleTokens(job).filter(
    (token) =>
      /토리얼$/u.test(token) || /공채$/u.test(token) || /recruit|recruitment|campus/iu.test(token),
  );

const roleTokens = (job: ComparableJob) => {
  const campaigns = new Set(namedCampaignTokens(job));
  return meaningfulTitleTokens(job).filter(
    (token) => !roleNoiseWords.has(token) && !campaigns.has(token),
  );
};

const recruitmentWindowKey = (job: ComparableJob) => {
  const start = dateKey(job.applicationStartAt) || 'open';
  const deadline = dateKey(job.deadlineAt) || 'rolling';
  return `${start}:${deadline}`;
};

const titleLooksUmbrella = (job: ComparableJob, roles: string[]) => {
  const title = normalizedTitle(job.title);
  if (/전\s*(부문|직군)|부문별/gu.test(title)) return true;
  if (/(신입사원|신입행원|공채|공개채용|수시채용)/u.test(title)) {
    const broadDomains = new Set(
      roles.filter((token) => ['it', 'sw', 'ai', 'tech', '개발', '데이터'].includes(token)),
    );
    if (broadDomains.size >= 2) return true;
  }
  return roles.length === 0;
};

const normalizedSourceUrl = (value?: string | null) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/iu.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/u, '') || '/';
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
};

export function jobDigestIdentity(job: ComparableJob): JobDigestIdentity {
  const companyKey = jobCompanyKey(job.companyName);
  const campaignNames = namedCampaignTokens(job).sort();
  const roles = [...new Set(roleTokens(job).map(compact).filter(Boolean))].sort();
  const umbrella = titleLooksUmbrella(job, roles);
  return {
    companyKey,
    campaignKey: [
      companyKey,
      recruitmentWindowKey(job),
      campaignNames.length ? campaignNames.join('+') : 'unnamed',
    ].join('|'),
    roleKey: umbrella ? '*' : roles.join('+') || '*',
    umbrella,
  };
}

const sameRecruitmentWindow = (left: ComparableJob, right: ComparableJob) => {
  const leftDeadline = dateKey(left.deadlineAt);
  const rightDeadline = dateKey(right.deadlineAt);
  if (leftDeadline && rightDeadline && leftDeadline !== rightDeadline) return false;
  const leftStart = dateKey(left.applicationStartAt);
  const rightStart = dateKey(right.applicationStartAt);
  if (leftStart && rightStart && leftStart !== rightStart) return false;
  return Boolean((leftDeadline && rightDeadline) || (leftStart && rightStart));
};

const intersection = (left: Set<string>, right: Set<string>) =>
  [...left].filter((token) => right.has(token));

const equivalentTitles = (left: ComparableJob, right: ComparableJob) => {
  const leftTokens = new Set(meaningfulTitleTokens(left).map(compact));
  const rightTokens = new Set(meaningfulTitleTokens(right).map(compact));
  if (!leftTokens.size || !rightTokens.size) return false;
  const shared = intersection(leftTokens, rightTokens).length;
  const smallerSize = Math.min(leftTokens.size, rightTokens.size);
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return shared >= 1 && (shared / smallerSize >= 0.8 || shared / unionSize >= 0.72);
};

const sameRole = (left: JobDigestIdentity, right: JobDigestIdentity) => {
  if (left.roleKey === right.roleKey) return true;
  const leftTokens = new Set(left.roleKey.split('+'));
  const rightTokens = new Set(right.roleKey.split('+'));
  const shared = intersection(leftTokens, rightTokens).length;
  const smaller = Math.min(leftTokens.size, rightTokens.size);
  return smaller > 0 && shared / smaller >= 0.8;
};

export function duplicateJobReason(
  candidate: ComparableJob,
  existing: ComparableJob,
): JobDuplicateReason | null {
  const candidateCompany = jobCompanyKey(candidate.companyName);
  if (!candidateCompany || candidateCompany !== jobCompanyKey(existing.companyName)) return null;
  const candidateUrl = normalizedSourceUrl(candidate.sourceUrl);
  const existingUrl = normalizedSourceUrl(existing.sourceUrl);
  if (candidateUrl && candidateUrl === existingUrl) return 'same-source';
  if (!sameRecruitmentWindow(candidate, existing)) return null;
  if (equivalentTitles(candidate, existing)) return 'equivalent-title';
  const candidateIdentity = jobDigestIdentity(candidate);
  const existingIdentity = jobDigestIdentity(existing);
  if (candidateIdentity.umbrella || existingIdentity.umbrella) return 'umbrella-campaign';
  if (sameRole(candidateIdentity, existingIdentity)) return 'shared-campaign-role';
  return null;
}
