import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Bookmark,
  Building2,
  Check,
  ChevronRight,
  ExternalLink,
  Filter,
  Globe2,
  MapPin,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  applicationLabels,
  calendarEventLabels,
  categoryLabel,
  deadlineLabel,
  latestLabel,
  sizeLabels,
  sourceHost,
  type CalendarEvent,
  type Job,
  type JobFontSize,
} from './job-domain';

export function SourceDetails({ job, compact = false }: { job: Job; compact?: boolean }) {
  return (
    <div className={`job-source ${compact ? 'compact' : ''}`}>
      <div className="job-source-name">
        <Globe2 aria-hidden="true" />
        <span>출처</span>
        <strong>{job.source.name}</strong>
      </div>
      <span className="job-source-host">{sourceHost(job.sourceUrl)}</span>
      <span className="job-source-latest">확인일 {latestLabel(job.source.lastSuccessAt)}</span>
    </div>
  );
}

export function JobDetailModal({
  job,
  onClose,
  onBookmark,
  onApplication,
  pending,
}: {
  job: Job;
  onClose: () => void;
  onBookmark: (bookmarked: boolean) => void;
  onApplication: (patch: { status?: string; memo?: string }) => Promise<unknown>;
  pending: boolean;
}) {
  const serverMemo = job.savedBy[0]?.memo || '';
  const [memo, setMemo] = useState(serverMemo);
  const [memoStatus, setMemoStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const onApplicationRef = useRef(onApplication);
  useEffect(() => {
    onApplicationRef.current = onApplication;
  }, [onApplication]);
  useEffect(() => {
    setMemo(serverMemo);
    setMemoStatus('idle');
  }, [job.id, serverMemo]);
  useEffect(() => {
    if (memo === serverMemo) return;
    setMemoStatus('saving');
    const timer = window.setTimeout(() => {
      void onApplicationRef.current({ memo }).then(
        () => setMemoStatus('saved'),
        () => setMemoStatus('error'),
      );
    }, 700);
    return () => window.clearTimeout(timer);
  }, [memo, serverMemo]);
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="job-modal-backdrop" />
        <DialogPrimitive.Content className="job-detail-modal" aria-describedby={undefined}>
          <header>
            <div className="company-tile">
              <Building2 aria-hidden="true" />
            </div>
            <div>
              <span>{sizeLabels[job.company.size] || job.company.size}</span>
              <DialogPrimitive.Title asChild>
                <h2>{job.company.name}</h2>
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close className="job-modal-close" aria-label="닫기">
              <X />
            </DialogPrimitive.Close>
          </header>
          <div className="job-modal-body">
            <div className="job-modal-title">
              <span>{categoryLabel(job.category)}</span>
              <h3>{job.title}</h3>
              <p>{job.summary}</p>
            </div>
            <div className="job-modal-schedule" aria-label="채용 일정">
              <div className="schedule-published">
                <span>등록일</span>
                <strong>{job.publishedAt ? deadlineLabel(job.publishedAt) : '확인 필요'}</strong>
              </div>
              <div className="schedule-application">
                <span>접수 시작일</span>
                <strong>
                  {job.applicationStartAt ? deadlineLabel(job.applicationStartAt) : '확인 필요'}
                </strong>
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
            <button
              type="button"
              className={job.bookmarked ? 'saved' : ''}
              aria-pressed={job.bookmarked}
              disabled={pending}
              onClick={() => onBookmark(!job.bookmarked)}
            >
              <Bookmark fill={job.bookmarked ? 'currentColor' : 'none'} />
              {job.bookmarked ? '관심 공고' : '관심 저장'}
            </button>
            {job.savedBy.length > 0 && (
              <label className="application-status">
                <span className="sr-only">{job.title} 지원 상태</span>
                <select
                  value={job.savedBy[0]?.status || 'INTERESTED'}
                  disabled={pending}
                  onChange={(event) => void onApplication({ status: event.target.value })}
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
                  rows={2}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  placeholder="지원 메모"
                />
                <small role="status">
                  {memoStatus === 'saving'
                    ? '저장 중…'
                    : memoStatus === 'saved'
                      ? '저장됨'
                      : memoStatus === 'error'
                        ? '저장 실패 · 내용을 유지했습니다'
                        : ''}
                </small>
              </label>
            )}
            <a href={job.sourceUrl} target="_blank" rel="noreferrer">
              {job.source.name}에서 보기 <ExternalLink />
            </a>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ScheduleListDialog({
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
                    {categoryLabel(job.category)} · {job.source.name}
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

export function initialJobFontSize(): JobFontSize {
  try {
    const stored = window.localStorage.getItem('careerground.jobs.font-size');
    if (stored === 'large' || stored === 'largest') return stored;
  } catch {
    // Device preferences are optional; the comfortable default remains usable.
  }
  return 'comfortable';
}

export function JobFilterPanel({
  companySizes,
  categories,
  selectedCategories,
  onApply,
}: {
  companySizes: string[];
  categories: string[];
  selectedCategories: string[];
  onApply: (companySizes: string[], categories: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftSizes, setDraftSizes] = useState(companySizes);
  const [draftCategories, setDraftCategories] = useState(selectedCategories);
  const selectedSizes = new Set(open ? draftSizes : companySizes);
  const selectedJobs = new Set(open ? draftCategories : selectedCategories);
  const selectedCount =
    (open ? draftSizes : companySizes).length +
    (open ? draftCategories : selectedCategories).length;
  const toggle = (
    value: string,
    checked: boolean,
    current: string[],
    onChange: (value: string[]) => void,
  ) => onChange(checked ? [...current, value] : current.filter((item) => item !== value));
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setDraftSizes(companySizes);
          setDraftCategories(selectedCategories);
        }
        setOpen(nextOpen);
      }}
    >
      <div className="multi-filter-root">
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="job-filter-trigger"
            aria-label={`채용공고 필터${selectedCount ? `, ${selectedCount}개 선택` : ''}`}
            aria-expanded={open}
            data-state={open ? 'open' : 'closed'}
          >
            <Filter aria-hidden="true" />
            <span>필터</span>
            {selectedCount > 0 && <strong>{selectedCount}</strong>}
          </button>
        </DialogPrimitive.Trigger>
      </div>
      {open && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="job-filter-overlay" />
          <DialogPrimitive.Content
            className="job-filter-panel"
            aria-label="채용공고 전체 필터"
            aria-describedby={undefined}
          >
            <header>
              <div>
                <DialogPrimitive.Title asChild>
                  <strong>
                    <span aria-hidden="true">모든 필터</span>
                    <span className="sr-only">채용공고 전체 필터</span>
                  </strong>
                </DialogPrimitive.Title>
                <span>여러 조건을 체크해 함께 적용할 수 있습니다.</span>
              </div>
              <DialogPrimitive.Close asChild>
                <button type="button" aria-label="필터 닫기">
                  <X />
                </button>
              </DialogPrimitive.Close>
            </header>
            <div className="job-filter-scroll">
              <fieldset>
                <legend>기업 규모</legend>
                <div className="job-filter-options company-size-options">
                  {Object.entries(sizeLabels).map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={selectedSizes.has(value)}
                        onChange={(event) =>
                          toggle(value, event.target.checked, draftSizes, setDraftSizes)
                        }
                      />
                      <span className="multi-filter-check">
                        {selectedSizes.has(value) && (
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        )}
                      </span>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>직무</legend>
                <div className="job-filter-options category-options">
                  {categories.map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={selectedJobs.has(value)}
                        onChange={(event) =>
                          toggle(value, event.target.checked, draftCategories, setDraftCategories)
                        }
                      />
                      <span className="multi-filter-check">
                        {selectedJobs.has(value) && (
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        )}
                      </span>
                      <span>{categoryLabel(value)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <footer>
              <button
                type="button"
                className="job-filter-clear"
                disabled={selectedCount === 0}
                onClick={() => {
                  setDraftSizes([]);
                  setDraftCategories([]);
                }}
              >
                전체 해제
              </button>
              <button
                type="button"
                className="job-filter-done"
                onClick={() => {
                  onApply(draftSizes, draftCategories);
                  setOpen(false);
                }}
              >
                {selectedCount ? `${selectedCount}개 조건 적용` : '전체 공고 보기'}
              </button>
            </footer>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}
