import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  List,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  JobDetailModal,
  JobFilterPanel,
  ScheduleListDialog,
  SourceDetails,
  initialJobFontSize,
} from '../features/jobs/JobControls';
import {
  JOB_PAGE_SIZE,
  applicationLabels,
  calendarDates,
  calendarEventLabels,
  categoryLabel,
  compareJobs,
  dateLabel,
  deadlineLabel,
  dedupeOrdered,
  fallsWithinCalendar,
  fontSizeOptions,
  koreaDateKey,
  latestLabel,
  monthBounds,
  monthStart,
  moveMonth,
  searchableJobText,
  sizeLabels,
  sortOptions,
  weekDays,
  type CalendarEvent,
  type Job,
  type JobBootstrapPayload,
  type JobFontSize,
  type SortMode,
  type ViewMode,
} from '../features/jobs/job-domain';
import { api, json } from '../lib/api';

export function JobsPage() {
  const client = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const companySizes = useMemo(
    () => dedupeOrdered(searchParams.getAll('companySize')),
    [searchParams],
  );
  const selectedCategories = useMemo(
    () => dedupeOrdered(searchParams.getAll('category').map(categoryLabel)),
    [searchParams],
  );
  const requestedSort = searchParams.get('sort');
  const sort: SortMode =
    requestedSort === 'deadline' || requestedSort === 'company' ? requestedSort : 'new';
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});
  const search = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(search);
  const companySearch = searchParams.get('company') || '';
  const [companySearchInput, setCompanySearchInput] = useState(companySearch);
  const rawSavedFilter = searchParams.get('saved');
  const savedOnly = rawSavedFilter === '1' || rawSavedFilter === 'true';
  const requestedJob = searchParams.get('job');
  const [fontSize, setFontSize] = useState<JobFontSize>(initialJobFontSize);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [visibleCount, setVisibleCount] = useState(JOB_PAGE_SIZE);
  const [visibleMonth, setVisibleMonth] = useState(monthStart);
  const [selectedJobId, setSelectedJobId] = useState<string>();
  const [rollingOpen, setRollingOpen] = useState(false);
  const [expandedDateKey, setExpandedDateKey] = useState<string>();
  const [focusedCalendarDate, setFocusedCalendarDate] = useState(koreaDateKey(new Date()));
  const calendarCells = useRef(new Map<string, HTMLDivElement>());
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const updateSearchParams = useCallback(
    (update: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParamsRef.current);
      update(next);
      searchParamsRef.current = next;
      setSearchParams(next, { replace: true });
    },
    [setSearchParams],
  );
  const setUrlParam = useCallback(
    (key: string, value: string) => {
      updateSearchParams((next) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
    },
    [updateSearchParams],
  );
  const setJobFilters = useCallback(
    (sizes: string[], categories: string[]) => {
      updateSearchParams((next) => {
        next.delete('companySize');
        next.delete('category');
        dedupeOrdered(sizes).forEach((value) => next.append('companySize', value));
        dedupeOrdered(categories).forEach((value) => next.append('category', value));
      });
    },
    [updateSearchParams],
  );

  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== search) setUrlParam('q', searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, searchInput, setUrlParam]);
  useEffect(() => setCompanySearchInput(companySearch), [companySearch]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (companySearchInput !== companySearch) {
        setUrlParam('company', companySearchInput.trim());
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [companySearch, companySearchInput, setUrlParam]);

  const bounds = monthBounds(visibleMonth);
  const catalogQuery = useQuery({
    queryKey: ['jobs', 'catalog'],
    queryFn: async () => {
      const payload = await api<JobBootstrapPayload>('/jobs/bootstrap?catalog=true');
      client.setQueryData(['notification-unread-count'], { count: payload.unreadCount });
      client.setQueryData(['jobs', 'categories'], payload.categories);
      return Array.isArray(payload.data) ? payload.data : payload.data.items;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const catalog = catalogQuery.data || [];
  const categories = useMemo(
    () =>
      [...new Set(catalog.map((job) => categoryLabel(job.category)))].sort((left, right) =>
        left.localeCompare(right, 'ko'),
      ),
    [catalog],
  );
  const filteredJobs = useMemo(() => {
    const sizes = new Set(companySizes);
    const selected = new Set(selectedCategories);
    const terms = search.normalize('NFKC').toLocaleLowerCase('ko-KR').split(/\s+/).filter(Boolean);
    const companyTerms = companySearchInput
      .normalize('NFKC')
      .toLocaleLowerCase('ko-KR')
      .split(/\s+/)
      .filter(Boolean);
    return catalog
      .filter((job) => !sizes.size || sizes.has(job.company.size))
      .filter((job) => !selected.size || selected.has(categoryLabel(job.category)))
      .filter((job) => !savedOnly || job.bookmarked)
      .filter((job) => {
        if (!companyTerms.length) return true;
        const companyName = job.company.name.normalize('NFKC').toLocaleLowerCase('ko-KR');
        return companyTerms.every((term) => companyName.includes(term));
      })
      .filter(
        (job) => !terms.length || terms.every((term) => searchableJobText(job).includes(term)),
      )
      .sort(compareJobs(sort));
  }, [catalog, companySearchInput, companySizes, savedOnly, search, selectedCategories, sort]);
  const calendarJobs = useMemo(() => {
    const from = Date.parse(bounds.from);
    const to = Date.parse(bounds.to);
    return filteredJobs.filter((job) => fallsWithinCalendar(job, from, to));
  }, [bounds.from, bounds.to, filteredJobs]);
  useEffect(
    () => setVisibleCount(JOB_PAGE_SIZE),
    [companySearchInput, companySizes, savedOnly, search, selectedCategories, sort],
  );
  const jobRows = viewMode === 'calendar' ? calendarJobs : filteredJobs.slice(0, visibleCount);
  const jobTotal = viewMode === 'calendar' ? calendarJobs.length : filteredJobs.length;
  const hasMoreJobs = viewMode === 'list' && visibleCount < filteredJobs.length;
  const jobs = catalogQuery;
  const bookmark = useMutation({
    mutationFn: ({ jobId, bookmarked }: { jobId: string; bookmarked: boolean }) =>
      api(`/jobs/${jobId}/bookmark`, { method: 'PATCH', body: json({ bookmarked }) }),
    onMutate: async ({ jobId, bookmarked }) => {
      await client.cancelQueries({ queryKey: ['jobs', 'catalog'] });
      const snapshot = client.getQueryData<Job[]>(['jobs', 'catalog']);
      const update = (current: Job[] | undefined) =>
        current?.map((job) =>
          job.id === jobId
            ? {
                ...job,
                bookmarked,
                savedBy: [
                  {
                    status: job.savedBy[0]?.status || 'INTERESTED',
                    memo: job.savedBy[0]?.memo || '',
                    bookmarked,
                  },
                ],
              }
            : job,
        );
      client.setQueryData<Job[]>(['jobs', 'catalog'], update);
      return { snapshot };
    },
    onError: (_error, _variables, context) =>
      client.setQueryData(['jobs', 'catalog'], context?.snapshot),
  });
  const application = useMutation({
    mutationFn: ({ jobId, patch }: { jobId: string; patch: { status?: string; memo?: string } }) =>
      api(`/jobs/${jobId}/application`, { method: 'PATCH', body: json(patch) }),
    onMutate: async ({ jobId, patch }) => {
      await client.cancelQueries({ queryKey: ['jobs', 'catalog'] });
      const snapshot = client.getQueryData<Job[]>(['jobs', 'catalog']);
      const update = (current: Job[] | undefined) =>
        current?.map((job) =>
          job.id === jobId
            ? {
                ...job,
                savedBy: [
                  {
                    status: patch.status ?? job.savedBy[0]?.status ?? 'INTERESTED',
                    memo: patch.memo ?? job.savedBy[0]?.memo ?? '',
                    bookmarked: job.bookmarked,
                  },
                ],
              }
            : job,
        );
      client.setQueryData<Job[]>(['jobs', 'catalog'], update);
      return { snapshot };
    },
    onError: (_error, _variables, context) =>
      client.setQueryData(['jobs', 'catalog'], context?.snapshot),
  });

  useEffect(() => {
    if (!requestedJob || !jobRows.length) return;
    document.getElementById(`job-${requestedJob}`)?.scrollIntoView({ block: 'center' });
    setSelectedJobId(requestedJob);
  }, [jobRows, requestedJob]);

  const calendarData = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    const rollingJobs: Job[] = [];
    for (const job of jobRows) {
      if (job.rolling) {
        rollingJobs.push(job);
        continue;
      }
      if (job.applicationStartAt) {
        const key = koreaDateKey(job.applicationStartAt);
        grouped.set(key, [...(grouped.get(key) || []), { job, type: 'application' }]);
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
  }, [jobRows]);
  const selectedJobSummary = jobRows.find((job) => job.id === selectedJobId);
  const selectedJobDetail = useQuery({
    queryKey: ['jobs', 'detail', selectedJobId],
    queryFn: () => api<Job>(`/jobs/${selectedJobId}`),
    enabled: Boolean(selectedJobId),
    staleTime: 60_000,
  });
  const selectedJob = selectedJobDetail.data || selectedJobSummary;
  const expandedDateEvents = expandedDateKey
    ? calendarData.eventsByDate.get(expandedDateKey) || []
    : [];
  const dates = calendarDates(visibleMonth);
  const today = koreaDateKey(new Date());
  const monthLabel = `${visibleMonth.getUTCFullYear()}년 ${visibleMonth.getUTCMonth() + 1}월`;
  const activeCalendarDate = dates.some((item) => item.key === focusedCalendarDate)
    ? focusedCalendarDate
    : dates.find((item) => item.currentMonth)?.key || dates[0]?.key;
  const calendarWeeks = Array.from({ length: Math.ceil(dates.length / 7) }, (_, index) =>
    dates.slice(index * 7, index * 7 + 7),
  );
  const moveCalendarFocus = (currentKey: string, offset: number) => {
    const index = dates.findIndex((item) => item.key === currentKey);
    const target = dates[Math.max(0, Math.min(dates.length - 1, index + offset))];
    if (!target) return;
    setFocusedCalendarDate(target.key);
    requestAnimationFrame(() => calendarCells.current.get(target.key)?.focus());
  };

  useEffect(() => {
    try {
      window.localStorage.setItem('careerground.jobs.font-size', fontSize);
    } catch {
      // The preference stays in memory when storage is unavailable.
    }
  }, [fontSize]);

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedJobId(undefined);
    setRollingOpen(false);
    setExpandedDateKey(undefined);
  };

  const openJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const next = new URLSearchParams(searchParams);
    next.set('job', jobId);
    setSearchParams(next, { replace: true });
  };

  const closeJob = () => {
    setSelectedJobId(undefined);
    const next = new URLSearchParams(searchParams);
    next.delete('job');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="jobs-page" data-font-size={fontSize}>
      <section className="page-heading jobs-heading">
        <div>
          <span className="eyebrow">
            <CalendarDays size={15} /> 신입 채용 일정
          </span>
          <h1>신입 IT 채용공고</h1>
          <p>
            달력에는 접수 시작일과 마감일만 표시하며, 확인되지 않은 날짜는 임의로 대체하지 않습니다.
          </p>
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
        <label>
          회사명 검색
          <input
            type="search"
            value={companySearchInput}
            onChange={(event) => setCompanySearchInput(event.target.value)}
            placeholder="예: NAVER, 카카오"
          />
        </label>
        {viewMode === 'list' && (
          <>
            <label>
              공고 검색
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="직무, 기술 스택, 지역"
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(event) => setUrlParam('saved', event.target.checked ? '1' : '')}
              />
              저장한 공고만
            </label>
          </>
        )}
        <JobFilterPanel
          companySizes={companySizes}
          categories={categories}
          selectedCategories={selectedCategories}
          onApply={setJobFilters}
        />
        {companySizes.map((value) => (
          <button
            type="button"
            key={value}
            className="job-filter-chip"
            onClick={() =>
              setJobFilters(
                companySizes.filter((item) => item !== value),
                selectedCategories,
              )
            }
          >
            {sizeLabels[value] || value} <X />
          </button>
        ))}
        {selectedCategories.map((value) => (
          <button
            type="button"
            key={value}
            className="job-filter-chip"
            onClick={() =>
              setJobFilters(
                companySizes,
                selectedCategories.filter((item) => item !== value),
              )
            }
          >
            {categoryLabel(value)} <X />
          </button>
        ))}
        {jobs.isFetching && !jobs.isLoading && (
          <span className="jobs-refreshing">최신 정보 반영 중</span>
        )}
      </div>

      <div className="jobs-list-tools">
        <strong>{jobTotal}개 공고</strong>
        {viewMode === 'list' && (
          <div className="jobs-sort-buttons" role="group" aria-label="채용공고 정렬">
            <SlidersHorizontal aria-hidden="true" />
            {sortOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={sort === option.value ? 'active' : ''}
                aria-pressed={sort === option.value}
                onClick={() => setUrlParam('sort', option.value === 'new' ? '' : option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="jobs-font-buttons" role="group" aria-label="채용공고 글자 크기">
          <span>글자 크기</span>
          {fontSizeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={fontSize === option.value ? 'active' : ''}
              aria-pressed={fontSize === option.value}
              onClick={() => setFontSize(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
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
            <span className="schedule-application">접수 시작일</span>
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
            <div className="job-calendar" role="grid" aria-label={`${monthLabel} 채용 일정`}>
              <div className="calendar-weekdays" role="row">
                {weekDays.map((day) => (
                  <span key={day} role="columnheader">
                    {day}
                  </span>
                ))}
              </div>
              <div className="calendar-grid" role="rowgroup">
                {calendarWeeks.map((week, weekIndex) => (
                  <div className="calendar-week" role="row" key={weekIndex}>
                    {week.map((item) => {
                      const dayEvents = calendarData.eventsByDate.get(item.key) || [];
                      return (
                        <div
                          key={item.key}
                          ref={(node) => {
                            if (node) calendarCells.current.set(item.key, node);
                            else calendarCells.current.delete(item.key);
                          }}
                          role="gridcell"
                          tabIndex={item.key === activeCalendarDate ? 0 : -1}
                          className={`calendar-day ${item.currentMonth ? '' : 'outside'} ${item.key === today ? 'today' : ''}`}
                          aria-label={`${item.date.getUTCFullYear()}년 ${item.date.getUTCMonth() + 1}월 ${item.date.getUTCDate()}일, 일정 ${dayEvents.length}개`}
                          onFocus={() => setFocusedCalendarDate(item.key)}
                          onKeyDown={(event) => {
                            const offsets: Record<string, number> = {
                              ArrowLeft: -1,
                              ArrowRight: 1,
                              ArrowUp: -7,
                              ArrowDown: 7,
                              Home: -(item.date.getUTCDay() || 0),
                              End: 6 - item.date.getUTCDay(),
                            };
                            const offset = offsets[event.key];
                            if (offset === undefined) return;
                            event.preventDefault();
                            moveCalendarFocus(item.key, offset);
                          }}
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
                                onClick={() => openJob(job.id)}
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
                ))}
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
        onSelect={openJob}
      />
      <ScheduleListDialog
        open={Boolean(expandedDateKey)}
        onOpenChange={(open) => {
          if (!open) setExpandedDateKey(undefined);
        }}
        title={expandedDateKey ? `${dateLabel(expandedDateKey)} 채용 일정` : '채용 일정'}
        description={`접수 시작일과 마감일을 포함한 ${expandedDateEvents.length}개 일정을 확인하세요.`}
        items={expandedDateEvents}
        onSelect={openJob}
      />

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={closeJob}
          onBookmark={(bookmarked) => bookmark.mutate({ jobId: selectedJob.id, bookmarked })}
          onApplication={(patch) => application.mutateAsync({ jobId: selectedJob.id, patch })}
          pending={bookmark.isPending || application.isPending}
        />
      )}

      {viewMode === 'list' && (
        <>
          <div className="job-list">
            {jobRows.map((job) => {
              const days = job.deadlineAt
                ? Math.ceil((new Date(job.deadlineAt).getTime() - Date.now()) / 86_400_000)
                : undefined;
              return (
                <article
                  key={job.id}
                  id={`job-${job.id}`}
                  className={`job-card ${job.id === requestedJob ? 'search-target' : ''}`}
                >
                  <div className="company-tile">
                    <Building2 aria-hidden="true" />
                  </div>
                  <div className="job-main">
                    <div className="job-meta">
                      <span>{sizeLabels[job.company.size] || job.company.size}</span>
                      <span>{categoryLabel(job.category)}</span>
                      {job.remote && <span>재택 가능</span>}
                    </div>
                    <button
                      type="button"
                      className="job-card-detail"
                      onClick={() => openJob(job.id)}
                      aria-label={`${job.company.name} ${job.title} 상세 보기`}
                    >
                      <h2>{job.title}</h2>
                      <strong>{job.company.name}</strong>
                    </button>
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
                    <div className="job-card-schedule" aria-label={`${job.title} 주요 일정`}>
                      <div className="schedule-published">
                        <span>등록일</span>
                        <strong>{latestLabel(job.publishedAt)}</strong>
                      </div>
                      <div className="schedule-application">
                        <span>접수 시작일</span>
                        <strong>{latestLabel(job.applicationStartAt)}</strong>
                      </div>
                      <div
                        className={`${job.rolling ? 'schedule-rolling' : 'schedule-deadline'} ${days !== undefined && days >= 0 && days <= 7 ? 'urgent' : ''}`}
                      >
                        <span>{job.rolling ? '상시채용' : '마감일'}</span>
                        <strong>
                          {job.rolling ? '채용 완료 시까지' : deadlineLabel(job.deadlineAt)}
                        </strong>
                        {!job.rolling && days !== undefined && days >= 0 && <b>D-{days}</b>}
                      </div>
                    </div>
                    <div className="tag-row">
                      {job.techStack.map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                    <SourceDetails job={job} />
                  </div>
                  <div className="job-actions">
                    <button
                      disabled={bookmark.isPending && bookmark.variables?.jobId === job.id}
                      onClick={() =>
                        bookmark.mutate({ jobId: job.id, bookmarked: !job.bookmarked })
                      }
                      className={job.bookmarked ? 'saved' : ''}
                      aria-pressed={job.bookmarked}
                    >
                      <Bookmark fill={job.bookmarked ? 'currentColor' : 'none'} />
                      {job.bookmarked ? '관심 공고' : '관심 저장'}
                    </button>
                    {job.savedBy.length > 0 && (
                      <label className="application-status">
                        <span className="sr-only">{job.title} 지원 상태</span>
                        <select
                          aria-label={`${job.title} 지원 상태`}
                          disabled={
                            application.isPending && application.variables?.jobId === job.id
                          }
                          value={job.savedBy[0]?.status || 'INTERESTED'}
                          onChange={(event) =>
                            application.mutate({
                              jobId: job.id,
                              patch: { status: event.target.value },
                            })
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
                    {job.savedBy.length > 0 && (
                      <label className="application-memo">
                        <span className="sr-only">{job.title} 지원 메모</span>
                        <textarea
                          aria-label={`${job.title} 지원 메모`}
                          rows={2}
                          value={memoDrafts[job.id] ?? job.savedBy[0]?.memo ?? ''}
                          onChange={(event) =>
                            setMemoDrafts((current) => ({
                              ...current,
                              [job.id]: event.target.value,
                            }))
                          }
                          onBlur={() => {
                            const memo = memoDrafts[job.id];
                            if (memo !== undefined && memo !== job.savedBy[0]?.memo) {
                              application.mutate({ jobId: job.id, patch: { memo } });
                            }
                          }}
                          placeholder="지원 메모"
                        />
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
          {hasMoreJobs && (
            <button
              type="button"
              className="load-more-button"
              onClick={() => setVisibleCount((current) => current + JOB_PAGE_SIZE)}
            >
              공고 더 보기 ({jobRows.length}/{jobTotal})
            </button>
          )}
        </>
      )}
    </div>
  );
}
