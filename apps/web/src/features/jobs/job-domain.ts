export type Job = {
  id: string;
  title: string;
  category: string;
  region: string;
  remote: boolean;
  techStack: string[];
  publishedAt?: string;
  applicationStartAt?: string;
  collectedAt?: string;
  deadlineAt?: string;
  rolling: boolean;
  summary: string;
  sourceUrl: string;
  company: { name: string; size: string };
  source: { name: string; lastSuccessAt?: string };
  bookmarked: boolean;
  savedBy: Array<{ status: string; memo: string; bookmarked: boolean }>;
};

export type ViewMode = 'calendar' | 'list';
export type SortMode = 'new' | 'deadline' | 'company';
export type JobFontSize = 'comfortable' | 'large' | 'largest';
export type CalendarEventType = 'application' | 'deadline' | 'rolling';
export type CalendarEvent = { job: Job; type: CalendarEventType };
export type JobBootstrapPayload = {
  categories: string[];
  data: Job[] | { items: Job[]; nextCursor: string | null; total: number };
};

const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
export const JOB_PAGE_SIZE = 40;
export const sizeLabels: Record<string, string> = {
  LARGE: '대기업',
  PUBLIC: '공기업/공공기관',
  MID: '중견기업',
  SMALL: '중소기업',
  STARTUP: '스타트업',
  FOREIGN: '외국계',
  UNCLASSIFIED: '규모 확인 필요',
};
const categoryLabels: Record<string, string> = {
  AI_AGENT_ENGINEERING: 'AI 에이전트 엔지니어링',
  AI_DATA_ENGINEERING: 'AI·데이터 엔지니어링',
  AI_ENGINEERING: 'AI 엔지니어링',
  AI_ML: 'AI·머신러닝',
  AI_RESEARCH: 'AI 연구',
  AI_ROBOTICS: 'AI·로보틱스',
  AI_SOFTWARE: 'AI 소프트웨어',
  ANDROID: '안드로이드',
  BACKEND: '백엔드',
  BACKEND_AND_AI: '백엔드·AI',
  BACKEND_AND_AI_DATA: '백엔드·AI·데이터',
  COMPUTER_VISION: '컴퓨터 비전',
  CORPORATE_IT: '사내 IT',
  DATA_ANALYTICS: '데이터 분석',
  DATA_ENGINEERING: '데이터 엔지니어링',
  DATA_SCIENCE: '데이터 사이언스',
  DATABASE: '데이터베이스',
  DATABASE_AND_WEB: '데이터베이스·웹 개발',
  DESKTOP_APPLICATION: '데스크톱 애플리케이션',
  DEVOPS: '데브옵스',
  DEVOPS_BUILD_SYSTEM: '데브옵스·빌드 시스템',
  EMBEDDED_OR_CONTROL_SOFTWARE: '임베디드·제어 소프트웨어',
  EMBEDDED_SOFTWARE: '임베디드 소프트웨어',
  FINANCIAL_IT: '금융 IT',
  FRONTEND: '프론트엔드',
  FULLSTACK: '풀스택',
  FULL_STACK_DEVELOPMENT: '풀스택',
  GAME_CLIENT: '게임 클라이언트',
  GAME_DEVELOPMENT: '게임 개발',
  INDUSTRIAL_SOFTWARE: '산업용 소프트웨어',
  IOS: 'iOS 개발',
  ML_ENGINEERING: '머신러닝 엔지니어링',
  MOBILE_ANDROID: '안드로이드',
  MOBILE_DEVELOPMENT: '모바일 개발',
  MULTI_IT_ROLE: 'IT 직군 통합',
  MULTI_IT_ROLES: 'IT 직군 통합',
  MULTI_ROLE: '복수 직무',
  PUBLIC_ICT: '공공기관 IT',
  ROBOTICS_AUTONOMOUS: '자율주행·로보틱스',
  SOFTWARE_DEVELOPMENT: '소프트웨어 개발',
  SOFTWARE_ENGINEERING: '소프트웨어 엔지니어링',
  SOLUTION_DEVELOPMENT: '솔루션 개발',
  SOLUTION_ENGINEERING: '솔루션 엔지니어링',
  SYSTEM_OPERATIONS: '시스템 운영',
  SYSTEM_SOFTWARE: '시스템 소프트웨어',
  TECHNICAL_CONSULTING: '기술 컨설팅',
  WEB_DEVELOPMENT: '웹 개발',
};
export const categoryLabel = (value: string) =>
  categoryLabels[value] || (/[가-힣]/.test(value) ? value : '기타 IT 직무');
export const applicationLabels: Record<string, string> = {
  INTERESTED: '관심',
  PLANNED: '지원 예정',
  APPLIED: '지원 완료',
  SCREENING: '서류 전형',
  INTERVIEW: '면접',
  REJECTED: '불합격',
  ACCEPTED: '합격',
  ON_HOLD: '보류',
};
export const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
export const calendarEventLabels: Record<CalendarEventType, string> = {
  application: '접수 시작일',
  deadline: '마감일',
  rolling: '상시',
};
export const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: 'new', label: '최신순' },
  { value: 'deadline', label: '마감 임박순' },
  { value: 'company', label: '회사명순' },
];
export const fontSizeOptions: Array<{ value: JobFontSize; label: string }> = [
  { value: 'comfortable', label: '보통' },
  { value: 'large', label: '크게' },
  { value: 'largest', label: '아주 크게' },
];

export function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
}

export function moveMonth(month: Date, amount: number) {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1));
}

export function dedupeOrdered(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function monthBounds(month: Date) {
  const dates = calendarDates(month);
  const first = dates[0]?.date || month;
  const last = dates.at(-1)?.date || month;
  const from = new Date(first.getTime() - KOREA_OFFSET_MS);
  const to = new Date(last.getTime() + 86_400_000 - KOREA_OFFSET_MS);
  return { from: from.toISOString(), to: to.toISOString() };
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function koreaDateKey(value: string | Date) {
  const koreaTime = new Date(value).getTime() + KOREA_OFFSET_MS;
  const date = new Date(koreaTime);
  return dateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calendarDates(month: Date) {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const firstWeekDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(Date.UTC(year, monthIndex, index - firstWeekDay + 1));
    return {
      date: value,
      key: dateKey(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
      currentMonth: value.getUTCMonth() === monthIndex,
    };
  });
}

export function sourceHost(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return sourceUrl;
  }
}

export function latestLabel(value?: string) {
  if (!value) return '확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

export function deadlineLabel(value?: string) {
  if (!value) return '마감일 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

export const searchableJobText = (job: Job) =>
  [
    job.title,
    job.category,
    job.region,
    job.summary,
    job.company.name,
    job.company.size,
    job.source.name,
    ...job.techStack,
  ]
    .join(' ')
    .normalize('NFKC')
    .toLocaleLowerCase('ko-KR');

export const compareJobs = (mode: SortMode) => (left: Job, right: Job) => {
  if (mode === 'deadline') {
    const deadline = (left.deadlineAt || '9999').localeCompare(right.deadlineAt || '9999');
    return deadline || left.id.localeCompare(right.id);
  }
  if (mode === 'company') {
    const company = left.company.name.localeCompare(right.company.name, 'ko');
    return company || left.id.localeCompare(right.id);
  }
  const collected = (right.collectedAt || '').localeCompare(left.collectedAt || '');
  return collected || right.id.localeCompare(left.id);
};

export const fallsWithinCalendar = (job: Job, from: number, to: number) => {
  if (job.rolling) return true;
  return [job.applicationStartAt, job.deadlineAt].some((value) => {
    if (!value) return false;
    const timestamp = Date.parse(value);
    return timestamp >= from && timestamp < to;
  });
};

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${value}T00:00:00+09:00`));
}
