import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Bookmark,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Globe2,
  List,
  MapPin,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderSaveButton } from '../components/FolderSaveButton';
import { api, json } from '../lib/api';

type Job = {
  id: string;
  title: string;
  category: string;
  region: string;
  remote: boolean;
  techStack: string[];
  publishedAt?: string;
  collectedAt?: string;
  deadlineAt?: string;
  rolling: boolean;
  summary: string;
  sourceUrl: string;
  company: { name: string; size: string };
  source: { name: string; lastSuccessAt?: string };
  savedBy: Array<{ status: string; memo: string }>;
};

type ViewMode = 'calendar' | 'list';
type CalendarEventType = 'start' | 'deadline' | 'rolling';
type CalendarEvent = { job: Job; type: CalendarEventType };

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
const calendarEventLabels: Record<CalendarEventType, string> = {
  start: '시작일',
  deadline: '마감일',
  rolling: '상시',
};

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

function startDate(job: Job) {
  return job.publishedAt || job.collectedAt;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(`${value}T00:00:00+09:00`));
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

function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="job-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="job-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-detail-title"
      >
        <header>
          <div className="company-tile">
            <Building2 aria-hidden="true" />
          </div>
          <div>
            <span>{sizeLabels[job.company.size] || job.company.size}</span>
            <h2 id="job-detail-title">{job.company.name}</h2>
          </div>
          <button
            type="button"
            className="job-modal-close"
            onClick={onClose}
            aria-label="닫기"
            autoFocus
          >
            <X />
          </button>
        </header>
        <div className="job-modal-body">
          <div className="job-modal-title">
            <span>{job.category}</span>
            <h3>{job.title}</h3>
            <p>{job.summary}</p>
          </div>
          <div className="job-modal-schedule" aria-label="채용 일정">
            <div className="schedule-start">
              <span>시작일</span>
              <strong>{startDate(job) ? deadlineLabel(startDate(job)) : '확인 필요'}</strong>
            </div>
            {job.rolling ? (
              <div className="schedule-rolling">
                <span>상시</span>
                <strong>채용 완료 시까지</strong>
              </div>
            ) : (
              <div className="schedule-deadline">
                <span>마감일</span>
                <strong>{deadlineLabel(job.deadlineAt)}</strong>
              </div>
            )}
          </div>
          <div className="job-modal-meta">
            <span>
              <MapPin aria-hidden="true" /> {job.region}
            </span>
            {job.remote && <span>재택 가능</span>}
          </div>
          <div className="tag-row">
            {job.techStack.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
          <SourceDetails job={job} />
        </div>
        <footer>
          <FolderSaveButton itemType="JOB_POSTING" targetId={job.id} label={job.title} />
          <a href={job.sourceUrl} target="_blank" rel="noreferrer">
            {job.source.name}에서 보기 <ExternalLink />
          </a>
        </footer>
      </section>
    </div>
  );
}

function ScheduleListDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: CalendarEvent[];
  onSelect: (jobId: string) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="schedule-dialog-overlay" />
        <DialogPrimitive.Content className="schedule-list-dialog">
          <header>
            <div>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="job-modal-close" aria-label="닫기">
              <X />
            </DialogPrimitive.Close>
          </header>
          <div className="schedule-dialog-list">
            {items.map(({ job, type }) => (
              <button
                type="button"
                key={`${job.id}-${type}`}
                className="schedule-list-item"
                onClick={() => {
                  onOpenChange(false);
                  onSelect(job.id);
                }}
                aria-label={`${job.company.name} ${job.title} 상세 보기`}
              >
                <span className={`schedule-list-badge schedule-${type}`}>
                  {calendarEventLabels[type]}
                </span>
                <span className="schedule-list-copy">
                  <strong>{job.company.name}</strong>
                  <b>{job.title}</b>
                  <small>
                    {job.category} · {job.source.name}
                  </small>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = new Set(value);
  const selectedLabels = value.map(
    (selectedValue) =>
      options.find((option) => option.value === selectedValue)?.label || selectedValue,
  );
  const summary =
    value.length === 0
      ? '전체'
      : value.length <= 2
        ? selectedLabels.join(' · ')
        : `${value.length}개 선택`;
  const toggle = (optionValue: string, checked: boolean) => {
    onChange(
      checked
        ? [...value, optionValue]
        : value.filter((currentValue) => currentValue !== optionValue),
    );
  };
  useEffect(() => {
    if (!open) return undefined;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event instanceof PointerEvent && !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="multi-filter-root" ref={root}>
      <button
        type="button"
        className="multi-filter-trigger"
        aria-label={`${label}: ${summary}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        data-state={open ? 'open' : 'closed'}
      >
        <span>
          <small>{label}</small>
          <strong>{summary}</strong>
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="multi-filter-menu" role="menu" aria-label={`${label} 복수 선택`}>
          <span className="multi-filter-label">{label} 복수 선택</span>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className="multi-filter-option"
              role="menuitemcheckbox"
              aria-checked={selected.has(option.value)}
              onClick={() => toggle(option.value, !selected.has(option.value))}
              data-state={selected.has(option.value) ? 'checked' : 'unchecked'}
            >
              <span className="multi-filter-check">
                {selected.has(option.value) && <Check aria-hidden="true" />}
              </span>
              {option.label}
            </button>
          ))}
          {value.length > 0 && (
            <>
              <span className="multi-filter-separator" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="multi-filter-clear"
                onClick={() => onChange([])}
              >
                선택 초기화
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function JobsPage() {
  const client = useQueryClient();
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState('new');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [visibleMonth, setVisibleMonth] = useState(monthStart);
  const [selectedJobId, setSelectedJobId] = useState<string>();
  const [rollingOpen, setRollingOpen] = useState(false);
  const [expandedDateKey, setExpandedDateKey] = useState<string>();

  const bounds = monthBounds(visibleMonth);
  const categories = useQuery({
    queryKey: ['jobs', 'categories'],
    queryFn: () => api<string[]>('/jobs/categories'),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const queryParams = new URLSearchParams({
    sort: viewMode === 'calendar' ? 'deadline' : sort,
    ...(viewMode === 'calendar'
      ? { calendar: 'true', deadlineFrom: bounds.from, deadlineTo: bounds.to }
      : {}),
  });
  companySizes.forEach((value) => queryParams.append('companySize', value));
  selectedCategories.forEach((value) => queryParams.append('category', value));
  const query = queryParams.toString();
  const jobs = useQuery({
    queryKey: [
      'jobs',
      viewMode,
      companySizes.join('|'),
      selectedCategories.join('|'),
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

  const calendarData = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    const rollingJobs: Job[] = [];
    for (const job of jobs.data || []) {
      if (job.rolling) {
        rollingJobs.push(job);
        continue;
      }
      const startedAt = startDate(job);
      if (startedAt) {
        const key = koreaDateKey(startedAt);
        grouped.set(key, [...(grouped.get(key) || []), { job, type: 'start' }]);
      }
      if (job.deadlineAt) {
        const key = koreaDateKey(job.deadlineAt);
        grouped.set(key, [...(grouped.get(key) || []), { job, type: 'deadline' }]);
      }
    }
    return {
      eventsByDate: grouped,
      rollingJobs,
      eventCount:
        rollingJobs.length + [...grouped.values()].reduce((sum, events) => sum + events.length, 0),
    };
  }, [jobs.data]);
  const selectedJob = jobs.data?.find((job) => job.id === selectedJobId);
  const expandedDateEvents = expandedDateKey
    ? calendarData.eventsByDate.get(expandedDateKey) || []
    : [];
  const dates = calendarDates(visibleMonth);
  const today = koreaDateKey(new Date());
  const monthLabel = `${visibleMonth.getUTCFullYear()}년 ${visibleMonth.getUTCMonth() + 1}월`;

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedJobId(undefined);
    setRollingOpen(false);
    setExpandedDateKey(undefined);
  };

  return (
    <div className="jobs-page">
      <section className="page-heading jobs-heading">
        <div>
          <span className="eyebrow">
            <CalendarDays size={15} /> 신입 채용 일정
          </span>
          <h1>신입 IT 채용공고</h1>
          <p>시작일·마감일·상시채용을 달력에서 구분하고, 지원 상태는 목록에서 관리하세요.</p>
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
        <MultiSelectFilter
          label="기업 규모"
          options={Object.entries(sizeLabels).map(([value, label]) => ({ value, label }))}
          value={companySizes}
          onChange={setCompanySizes}
        />
        <MultiSelectFilter
          label="직무"
          options={(categories.data || []).map((value) => ({ value, label: value }))}
          value={selectedCategories}
          onChange={setSelectedCategories}
        />
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
              <span>{calendarData.eventCount}개 채용 일정</span>
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
          <div className="job-calendar-legend" aria-label="일정 색상 안내">
            <span className="schedule-start">시작일</span>
            <span className="schedule-deadline">마감일</span>
            <span className="schedule-rolling">상시</span>
          </div>
          {calendarData.rollingJobs.length > 0 && (
            <section className="rolling-job-summary" aria-label="상시 채용 공고">
              <div>
                <span className="schedule-rolling">상시</span>
                <strong>{calendarData.rollingJobs.length}개 상시채용 공고</strong>
                <small>마감일 없이 진행 중인 공고만 한 번에 확인하세요.</small>
              </div>
              <button type="button" onClick={() => setRollingOpen(true)}>
                상시채용 확인하기 <ChevronRight />
              </button>
            </section>
          )}
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
                  const dayEvents = calendarData.eventsByDate.get(item.key) || [];
                  return (
                    <div
                      key={item.key}
                      className={`calendar-day ${item.currentMonth ? '' : 'outside'} ${item.key === today ? 'today' : ''}`}
                      aria-label={`${item.date.getUTCFullYear()}년 ${item.date.getUTCMonth() + 1}월 ${item.date.getUTCDate()}일`}
                    >
                      <time dateTime={item.key}>{item.date.getUTCDate()}</time>
                      <div className="calendar-events">
                        {dayEvents.slice(0, 4).map(({ job, type }) => (
                          <button
                            type="button"
                            key={`${job.id}-${type}`}
                            className={`calendar-job schedule-${type} ${selectedJobId === job.id ? 'selected' : ''}`}
                            title={`${calendarEventLabels[type]} · ${job.company.name} · ${job.title}`}
                            aria-label={`${job.company.name} ${job.title} ${calendarEventLabels[type]} 상세 보기`}
                            onClick={() => setSelectedJobId(job.id)}
                          >
                            <span>{calendarEventLabels[type]}</span>
                            <strong>{job.company.name}</strong>
                          </button>
                        ))}
                        {dayEvents.length > 4 && (
                          <button
                            type="button"
                            className="calendar-more"
                            onClick={() => setExpandedDateKey(item.key)}
                            aria-label={`${dateLabel(item.key)} 추가 공고 ${dayEvents.length - 4}개 보기`}
                          >
                            +{dayEvents.length - 4}개 더 보기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {calendarData.eventCount === 0 && (
            <div className="calendar-empty">
              <CalendarClock />
              <div>
                <strong>{monthLabel}에 표시할 채용 일정이 없습니다.</strong>
                <span>다른 달로 이동하거나 필터 범위를 넓혀보세요.</span>
              </div>
            </div>
          )}
        </section>
      )}

      <ScheduleListDialog
        open={rollingOpen}
        onOpenChange={setRollingOpen}
        title="상시채용 공고"
        description={`현재 조건에 맞는 상시채용 ${calendarData.rollingJobs.length}개를 모았습니다.`}
        items={calendarData.rollingJobs.map((job) => ({ job, type: 'rolling' }))}
        onSelect={setSelectedJobId}
      />
      <ScheduleListDialog
        open={Boolean(expandedDateKey)}
        onOpenChange={(open) => {
          if (!open) setExpandedDateKey(undefined);
        }}
        title={expandedDateKey ? `${dateLabel(expandedDateKey)} 채용 일정` : '채용 일정'}
        description={`시작일과 마감일을 포함한 ${expandedDateEvents.length}개 일정을 확인하세요.`}
        items={expandedDateEvents}
        onSelect={setSelectedJobId}
      />

      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJobId(undefined)} />
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
