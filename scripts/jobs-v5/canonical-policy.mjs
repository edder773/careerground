const CANONICAL_VALUES = {
  careerScope: ['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE'],
  employmentType: ['FULL_TIME', 'INTERNSHIP', 'INTERN_TO_FULL_TIME', 'CONTRACT', 'UNCONFIRMED'],
  companySize: ['LARGE', 'PUBLIC', 'MID', 'SMALL', 'STARTUP', 'FOREIGN', 'UNCLASSIFIED'],
};

export const CANONICAL_DISCOVERY_ENUMS = Object.freeze(
  Object.fromEntries(
    Object.entries(CANONICAL_VALUES).map(([field, values]) => [field, Object.freeze([...values])]),
  ),
);

const ALLOWED_VALUES = Object.fromEntries(
  Object.entries(CANONICAL_VALUES).map(([field, values]) => [field, new Set(values)]),
);
const CAREER_SCOPE_ALIASES = new Map([
  ['신입', 'NEW_GRAD_ONLY'],
  ['신입 공개경쟁', 'NEW_GRAD_ONLY'],
  ['신입(공개경쟁)', 'NEW_GRAD_ONLY'],
  ['채용연계형 인턴', 'NEW_GRAD_ONLY'],
  ['신입/경력', 'NEW_GRAD_ELIGIBLE'],
  ['신입·경력', 'NEW_GRAD_ELIGIBLE'],
  ['경력무관', 'NEW_GRAD_ELIGIBLE'],
  ['0~2년', 'NEW_GRAD_ELIGIBLE'],
]);
const COMPANY_SIZE_ALIASES = new Map([
  ['LARGE_ENTERPRISE', 'LARGE'],
  ['대기업', 'LARGE'],
  ['PUBLIC_INSTITUTION', 'PUBLIC'],
  ['PUBLIC_RESEARCH_INSTITUTE', 'PUBLIC'],
  ['GOVERNMENT_RESEARCH_INSTITUTE', 'PUBLIC'],
  ['GOVERNMENT_FUNDED_RESEARCH_INSTITUTE', 'PUBLIC'],
  ['공공기관', 'PUBLIC'],
  ['공공연구기관', 'PUBLIC'],
  ['정부출연연구기관', 'PUBLIC'],
  ['MID_SIZED', 'MID'],
  ['MID_SIZED_ENTERPRISE', 'MID'],
  ['중견기업', 'MID'],
  ['SMALL_BUSINESS', 'SMALL'],
  ['중소기업', 'SMALL'],
  ['스타트업', 'STARTUP'],
  ['외국계기업', 'FOREIGN'],
  ['금융권', 'UNCLASSIFIED'],
  ['미상', 'UNCLASSIFIED'],
  ['미확인', 'UNCLASSIFIED'],
  ['UNKNOWN', 'UNCLASSIFIED'],
  ['UNKNOWN_COMPANY_SIZE', 'UNCLASSIFIED'],
  ['N/A', 'UNCLASSIFIED'],
  ['기타/미확인', 'UNCLASSIFIED'],
]);
const COMPANY_SIZE_COMPACT_ALIASES = new Map([
  ['LARGEENTERPRISE', 'LARGE'],
  ['PUBLICINSTITUTION', 'PUBLIC'],
  ['PUBLICRESEARCHINSTITUTE', 'PUBLIC'],
  ['GOVERNMENTRESEARCHINSTITUTE', 'PUBLIC'],
  ['GOVERNMENTFUNDEDRESEARCHINSTITUTE', 'PUBLIC'],
  ['MIDSIZE', 'MID'],
  ['MIDSIZED', 'MID'],
  ['MIDSIZEENTERPRISE', 'MID'],
  ['MIDSIZEDENTERPRISE', 'MID'],
  ['MEDIUMSIZE', 'MID'],
  ['MEDIUMSIZED', 'MID'],
  ['MEDIUMSIZEENTERPRISE', 'MID'],
  ['MEDIUMSIZEDENTERPRISE', 'MID'],
  ['SMALLBUSINESS', 'SMALL'],
  ['UNKNOWNCOMPANYSIZE', 'UNCLASSIFIED'],
  ['UNKNOWN', 'UNCLASSIFIED'],
  ['NA', 'UNCLASSIFIED'],
]);
const EMPLOYMENT_TYPE_ALIASES = new Map([
  ['신입', 'FULL_TIME'],
  ['신입사원', 'FULL_TIME'],
  ['신입행원', 'FULL_TIME'],
  ['정규직', 'FULL_TIME'],
  ['정규직(신입)', 'FULL_TIME'],
  ['신입 정규직', 'FULL_TIME'],
  ['인턴', 'INTERNSHIP'],
  ['인턴십', 'INTERNSHIP'],
  ['체험형인턴', 'INTERNSHIP'],
  ['체험형 인턴', 'INTERNSHIP'],
  ['채용연계형 인턴', 'INTERN_TO_FULL_TIME'],
  ['채용 전환형 인턴', 'INTERN_TO_FULL_TIME'],
  ['전환형 인턴', 'INTERN_TO_FULL_TIME'],
  ['정규직 전환형 인턴', 'INTERN_TO_FULL_TIME'],
  ['계약직', 'CONTRACT'],
  ['계약직(신입)', 'CONTRACT'],
  ['미상', 'UNCONFIRMED'],
  ['미확인', 'UNCONFIRMED'],
  ['UNKNOWN', 'UNCONFIRMED'],
]);

function normalizedText(value, fallback = '') {
  return (
    String(value ?? '')
      .normalize('NFKC')
      .trim() || fallback
  );
}

function normalizeAlias(value, aliases) {
  const normalized = normalizedText(value);
  return aliases.get(normalized) ?? normalized;
}

function normalizeCareerScope(value) {
  const normalized = normalizeAlias(value, CAREER_SCOPE_ALIASES);
  if (ALLOWED_VALUES.careerScope.has(normalized)) return normalized;
  const compact = normalized.replace(/[\s()[\]{}_-]+/gu, '');
  return compact === '신입공개경쟁' ? 'NEW_GRAD_ONLY' : normalized;
}

function normalizeCompanySize(value) {
  const normalized = normalizedText(value, 'UNCLASSIFIED');
  const exactAlias = COMPANY_SIZE_ALIASES.get(normalized);
  if (exactAlias) return exactAlias;
  const enumToken = normalized
    .toUpperCase()
    .replace(/[^A-Z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '');
  if (ALLOWED_VALUES.companySize.has(enumToken)) return enumToken;
  return COMPANY_SIZE_COMPACT_ALIASES.get(enumToken.replaceAll('_', '')) ?? normalized;
}

export function inspectDiscoveryEnums(item = {}) {
  const values = {
    careerScope: normalizeCareerScope(item.careerScope),
    employmentType: normalizeAlias(item.employmentType, EMPLOYMENT_TYPE_ALIASES),
    companySize: normalizeCompanySize(item.companySize),
  };
  const originals = {
    careerScope: normalizedText(item.careerScope),
    employmentType: normalizedText(item.employmentType),
    companySize: normalizedText(item.companySize, 'UNCLASSIFIED'),
  };
  const changes = Object.keys(values)
    .filter((field) => originals[field] !== values[field])
    .map((field) => ({ field, from: originals[field], to: values[field] }));
  const violations = Object.keys(values)
    .filter((field) => !ALLOWED_VALUES[field].has(values[field]))
    .map((field) => ({ field, value: originals[field], normalized: values[field] }));
  return { values, changes, violations };
}

export function unsupportedDiscoveryEnumValues(items, partitionId = undefined) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item, itemIndex) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    return inspectDiscoveryEnums(item).violations.map((violation) => ({
      ...(partitionId === undefined ? {} : { partitionId }),
      itemIndex,
      ...violation,
    }));
  });
}
