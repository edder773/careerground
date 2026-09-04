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
  '관련',
  '채용',
  '모집',
  '공고',
  '신입',
  '신입채용',
  '신입사원',
  '신입행원',
  '대졸신입',
  '대졸신입사원',
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
  '직무',
  '학사',
  '석',
  '석사',
  '박사',
  '석박사',
]);

const roleNoiseWords = new Set([
  ...titleStopWords,
  '담당자',
  '경력무관',
  '대졸',
  '정규직',
  '계약직',
  '전환형',
  '학사',
  '석',
  '석사',
  '박사',
  '석박사',
]);

const compact = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/주식회사/g, '')
    .replace(/\(주\)|㈜/g, '')
    .replace(/[^0-9a-z가-힣]/g, '');

const canonicalCompanyAliases = new Map<string, string>([
  ['넥슨', 'nexon'],
  ['넥슨코리아', 'nexon'],
  ['nexon', 'nexon'],
  ['nexonkorea', 'nexon'],
  ['lg에너지솔루션', 'lg-energy-solution'],
  ['엘지에너지솔루션', 'lg-energy-solution'],
  ['lgenergysolution', 'lg-energy-solution'],
  ['미래에셋자산운용', 'mirae-asset-global-investments'],
  ['miraeassetglobalinvestments', 'mirae-asset-global-investments'],
  ['우리은행', 'woori-bank'],
  ['wooribank', 'woori-bank'],
  ['국민은행', 'kb-kookmin-bank'],
  ['kb국민은행', 'kb-kookmin-bank'],
  ['kbkookminbank', 'kb-kookmin-bank'],
  ['넛지헬스케어', 'nudge-healthcare'],
  ['너지', 'nudge-healthcare'],
  ['nudgehealthcare', 'nudge-healthcare'],
  ['kt', 'kt'],
  ['케이티', 'kt'],
  ['ibk', 'ibk-bank'],
  ['ibk기업은행', 'ibk-bank'],
  ['기업은행', 'ibk-bank'],
  ['중소기업은행', 'ibk-bank'],
  ['중소기업은행ibk기업은행', 'ibk-bank'],
]);

export function jobCompanyKey(value: string) {
  const normalized = compact(value)
    .replace(/코퍼레이션$/u, '')
    .replace(/컴퍼니$/u, '')
    .replace(/corporation$|company$|corp$|inc$/u, '');
  return canonicalCompanyAliases.get(normalized) || normalized;
}

const normalizedTitle = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\boms\b/gu, ' 주문관리시스템 ')
    .replace(/주문\s*관리\s*시스템/gu, '주문관리시스템')
    .replace(/it\s*개발/gu, 'it 개발')
    .replace(/([a-z0-9+#])부문/giu, '$1 부문')
    .replace(/s\s*\/\s*w/gu, 'sw');

const rawTitleTokens = (value: string) =>
  normalizedTitle(value)
    .replace(/[^0-9a-z가-힣+#]+/gu, ' ')
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

const comparableTokenVariants = (tokens: string[]) => {
  const variants = [...tokens];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = tokens[index]!;
    const right = tokens[index + 1]!;
    if (/^[a-z][a-z0-9+#]*$/iu.test(left) && /^[a-z][a-z0-9+#]*$/iu.test(right)) {
      variants.push(`${left}${right}`);
    }
  }
  return [...new Set(variants)];
};

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
  if (/전\s*(부문|직군)|부문별|관련\s*직무/gu.test(title)) return true;
  if (/(신입(?:사원|행원)?\s*채용|공채|공개채용|수시채용)/u.test(title)) {
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
  const roles = [
    ...new Set(comparableTokenVariants(roleTokens(job)).map(compact).filter(Boolean)),
  ].sort();
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
  if (leftDeadline && rightDeadline) {
    if (!leftStart || !rightStart) return true;
    const leftDay = Date.parse(`${leftStart}T00:00:00Z`);
    const rightDay = Date.parse(`${rightStart}T00:00:00Z`);
    return Math.abs(leftDay - rightDay) <= 86_400_000;
  }
  return Boolean(leftStart && rightStart && leftStart === rightStart);
};

const intersection = (left: Set<string>, right: Set<string>) =>
  [...left].filter((token) => right.has(token));

const equivalentTitles = (left: ComparableJob, right: ComparableJob) => {
  const leftTokens = new Set(comparableTokenVariants(meaningfulTitleTokens(left)).map(compact));
  const rightTokens = new Set(comparableTokenVariants(meaningfulTitleTokens(right)).map(compact));
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
