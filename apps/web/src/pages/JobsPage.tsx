import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Globe2,
  List,
  MapPin,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FolderSaveButton } from '../components/FolderSaveButton';
import { api, json } from '../lib/api';

type Job = {
  id: string;
  title: string;
  category: string;
  region: string;
  remote: boolean;
  techStack: string[];
  deadlineAt?: string;
  rolling: boolean;
  summary: string;
  sourceUrl: string;
  company: { name: string; size: string };
  source: { name: string; lastSuccessAt?: string };
  savedBy: Array<{ status: string; memo: string }>;
};

type ViewMode = 'calendar' | 'list';

const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
const sizeLabels: Record<string, string> = {
  LARGE: '대기업',
  PUBLIC: '공기업/공공기관',
  MID: '중견기업',
  SMALL: '중소기업',
  STARTUP: '스타트업',
  FOREIGN: '외국계',
  UNCLASSIFIED: '규모 확인 필요',
};
const applicationLabels: Record<string, string> = {
  INTERESTED: '관심',
  PLANNED: '지원 예정',
  APPLIED: '지원 완료',
  SCREENING: '서류 전형',
  INTERVIEW: '면접',
  REJECTED: '불합격',
  ACCEPTED: '합격',
  ON_HOLD: '보류',
};
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
}

function moveMonth(month: Date, amount: number) {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1));
}

function monthBounds(month: Date) {
  const from = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1) - KOREA_OFFSET_MS);
  const to = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1) - KOREA_OFFSET_MS,
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function koreaDateKey(value: string | Date) {
  const koreaTime = new Date(value).getTime() + KOREA_OFFSET_MS;
  const date = new Date(koreaTime);
  return dateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function calendarDates(month: Date) {
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

function sourceHost(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return sourceUrl;
  }
}

function latestLabel(value?: string) {
  if (!value) return '확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function deadlineLabel(value?: string) {
  if (!value) return '마감일 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function SourceDetails({ job, compact = false }: { job: Job; compact?: boolean }) {
  return (
    <div className={`job-source ${compact ? 'compact' : ''}`}>
      <div className="job-source-name">
        <Globe2 aria-hidden="true" />
        <span>출처</span>
        <strong>{job.source.name}</strong>
      </div>
      <span className="job-source-host">{sourceHost(job.sourceUrl)}</span>
      <span className="job-source-latest">최신일 {latestLabel(job.source.lastSuccessAt)}</span>
    </div>
  );
}

export function JobsPage() {
  const client = useQueryClient();
  const [companySize, setCompanySize] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('new');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [visibleMonth, setVisibleMonth] = useState(monthStart);
  const [selectedJobId, setSelectedJobId] = useState<string>();

  const bounds = monthBounds(visibleMonth);
  const categories = useQuery({
    queryKey: ['jobs', 'categories'],
    queryFn: () => api<string[]>('/jobs/categories'),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const query = new URLSearchParams({
    ...(companySize ? { companySize } : {}),
    ...(category ? { category } : {}),
    sort: viewMode === 'calendar' ? 'deadline' : sort,
    ...(viewMode === 'calendar' ? { deadlineFrom: bounds.from, deadlineTo: bounds.to } : {}),
  }).toString();
  const jobs = useQuery({
    queryKey: [
      'jobs',
      viewMode,
      companySize,
      category,
      viewMode === 'calendar'
        ? `${visibleMonth.getUTCFullYear()}-${visibleMonth.getUTCMonth()}`
        : sort,
    ],
    queryFn: () => api<Job[]>(`/jobs?${query}`),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
  const save = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      api('/jobs/saved', { method: 'POST', body: json({ jobId, status, memo: '' }) }),
    onMutate: ({ jobId, status }) => {
      client.setQueriesData<Job[]>({ queryKey: ['jobs'] }, (current) =>
        current?.map((job) =>
          job.id === jobId
            ? {
                ...job,
                savedBy: [{ status, memo: job.savedBy[0]?.memo || '' }],
              }
            : job,
        ),
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const jobsByDate = useMemo(() => {
    const grouped = new Map<string, Job[]>();
    for (const job of jobs.data || []) {
      if (!job.deadlineAt || job.rolling) continue;
      const key = koreaDateKey(job.deadlineAt);
      grouped.set(key, [...(grouped.get(key) || []), job]);
    }
    return grouped;
  }, [jobs.data]);
  const selectedJob = jobs.data?.find((job) => job.id === selectedJobId);
  const dates = calendarDates(visibleMonth);
  const today = koreaDateKey(new Date());
  const monthLabel = `${visibleMonth.getUTCFullYear()}년 ${visibleMonth.getUTCMonth() + 1}월`;

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedJobId(undefined);
  };

  return (
    <div className="jobs-page">
      <section className="page-heading jobs-heading">
        <div>
          <span className="eyebrow">
            <CalendarDays size={15} /> 신입 채용 일정
          </span>
          <h1>신입 IT 채용공고</h1>
          <p>마감일은 달력에서 한눈에, 상세 조건과 지원 상태는 목록에서 확인하세요.</p>
        </div>
        <div className="jobs-view-switch" role="group" aria-label="채용공고 보기 방식">
          <button
            type="button"
            className={viewMode === 'calendar' ? 'active' : ''}
            aria-pressed={viewMode === 'calendar'}
            onClick={() => setMode('calendar')}
          >
            <CalendarDays /> 달력
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            aria-pressed={viewMode === 'list'}
            onClick={() => setMode('list')}
          >
            <List /> 목록
          </button>
        </div>
      </section>

      <div className="filter-bar jobs-filter">
        <Filter aria-hidden="true" />
        <label>
          기업 규모
          <select value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
            <option value="">전체</option>
            {Object.entries(sizeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          직무
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">전체 IT 직무</option>
            {(categories.data || []).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {viewMode === 'list' && (
          <label>
            정렬
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="new">신규순</option>
              <option value="deadline">마감 임박순</option>
              <option value="company">회사명순</option>
            </select>
          </label>
        )}
        {jobs.isFetching && !jobs.isLoading && (
          <span className="jobs-refreshing">최신 정보 반영 중</span>
        )}
      </div>

      {jobs.isLoading && <div className="loading-panel">공고를 불러오는 중…</div>}
      {jobs.isError && <div className="error-panel">공고를 불러오지 못했습니다.</div>}

      {viewMode === 'calendar' && !jobs.isLoading && !jobs.isError && (
        <section className="job-calendar-panel" aria-label={`${monthLabel} 신입 채용 달력`}>
          <header className="job-calendar-header">
            <div>
              <span>{jobs.data?.length || 0}개 마감 일정</span>
              <h2>{monthLabel}</h2>
            </div>
            <nav aria-label="달력 월 이동">
              <button
                type="button"
                onClick={() => setVisibleMonth((month) => moveMonth(month, -1))}
                aria-label="이전 달"
              >
                <ChevronLeft />
              </button>
              <button type="button" onClick={() => setVisibleMonth(monthStart())}>
                오늘
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth((month) => moveMonth(month, 1))}
                aria-label="다음 달"
              >
                <ChevronRight />
              </button>
            </nav>
          </header>
          <p className="calendar-scroll-hint">좌우로 밀어 전체 달력을 볼 수 있어요.</p>
          <div className="job-calendar-scroll">
            <div className="job-calendar">
              <div className="calendar-weekdays" aria-hidden="true">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {dates.map((item) => {
                  const dayJobs = jobsByDate.get(item.key) || [];
                  return (
                    <div
                      key={item.key}
                      className={`calendar-day ${item.currentMonth ? '' : 'outside'} ${item.key === today ? 'today' : ''}`}
                      aria-label={`${item.date.getUTCFullYear()}년 ${item.date.getUTCMonth() + 1}월 ${item.date.getUTCDate()}일`}
                    >
                      <time dateTime={item.key}>{item.date.getUTCDate()}</time>
                      <div className="calendar-events">
                        {dayJobs.slice(0, 3).map((job, index) => (
                          <button
                            type="button"
                            key={job.id}
                            className={`calendar-job event-color-${index % 4} ${selectedJobId === job.id ? 'selected' : ''}`}
                            title={`${job.company.name} · ${job.title}`}
                            aria-label={`${job.company.name} ${job.title} 상세 보기`}
                            onClick={() => setSelectedJobId(job.id)}
                          >
                            <strong>{job.company.name}</strong>
                            <span>{job.title}</span>
                          </button>
                        ))}
                        {dayJobs.length > 3 && (
                          <span className="calendar-more">+{dayJobs.length - 3}개</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {jobs.data?.length === 0 && (
            <div className="calendar-empty">
              <CalendarClock />
              <div>
                <strong>{monthLabel}에 마감하는 공고가 없습니다.</strong>
                <span>다른 달로 이동하거나 필터 범위를 넓혀보세요.</span>
              </div>
            </div>
          )}
          {selectedJob && (
            <article className="calendar-job-detail" aria-live="polite">
              <div className="company-tile">
                <Building2 aria-hidden="true" />
              </div>
              <div>
                <span className="calendar-detail-deadline">
                  {deadlineLabel(selectedJob.deadlineAt)} 마감
                </span>
                <h3>{selectedJob.company.name}</h3>
                <strong>{selectedJob.title}</strong>
                <p>{selectedJob.summary}</p>
                <SourceDetails job={selectedJob} compact />
              </div>
              <div className="calendar-detail-actions">
                <FolderSaveButton
                  itemType="JOB_POSTING"
                  targetId={selectedJob.id}
                  label={selectedJob.title}
                />
                <a href={selectedJob.sourceUrl} target="_blank" rel="noreferrer">
                  {selectedJob.source.name}에서 보기 <ExternalLink />
                </a>
              </div>
            </article>
          )}
        </section>
      )}

      {viewMode === 'list' && (
        <div className="job-list">
          {jobs.data?.map((job) => {
            const days = job.deadlineAt
              ? Math.ceil((new Date(job.deadlineAt).getTime() - Date.now()) / 86_400_000)
              : undefined;
            return (
              <article key={job.id} className="job-card">
                <div className="company-tile">
                  <Building2 aria-hidden="true" />
                </div>
                <div className="job-main">
                  <div className="job-meta">
                    <span>{sizeLabels[job.company.size] || job.company.size}</span>
                    <span>{job.category}</span>
                    {job.remote && <span>재택 가능</span>}
                  </div>
                  <h2>{job.title}</h2>
                  <strong>{job.company.name}</strong>
                  <p>{job.summary}</p>
                  <div className="job-details">
                    <span>
                      <MapPin aria-hidden="true" />
                      {job.region}
                    </span>
                    <span>
                      <CalendarClock aria-hidden="true" />
                      {job.rolling
                        ? '상시채용'
                        : days !== undefined
                          ? days < 0
                            ? '마감'
                            : `D-${days}`
                          : '마감일 미정'}
                    </span>
                  </div>
                  <div className="tag-row">
                    {job.techStack.map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <SourceDetails job={job} />
                </div>
                <div className="job-actions">
                  <FolderSaveButton itemType="JOB_POSTING" targetId={job.id} label={job.title} />
                  <button
                    disabled={save.isPending}
                    onClick={() => save.mutate({ jobId: job.id, status: 'INTERESTED' })}
                    className={job.savedBy.length ? 'saved' : ''}
                  >
                    <Bookmark fill={job.savedBy.length ? 'currentColor' : 'none'} />
                    {job.savedBy.length ? '관심 공고' : '관심 저장'}
                  </button>
                  {job.savedBy.length > 0 && (
                    <label className="application-status">
                      <span className="sr-only">{job.title} 지원 상태</span>
                      <select
                        aria-label={`${job.title} 지원 상태`}
                        disabled={save.isPending}
                        value={job.savedBy[0]?.status || 'INTERESTED'}
                        onChange={(event) =>
                          save.mutate({ jobId: job.id, status: event.target.value })
                        }
                      >
                        {Object.entries(applicationLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <a href={job.sourceUrl} target="_blank" rel="noreferrer">
                    {job.source.name}에서 보기 <ExternalLink />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
