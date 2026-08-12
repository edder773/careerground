import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ExternalLink,
  Filter,
  MapPin,
} from 'lucide-react';
import { api, json } from '../lib/api';
import { FolderSaveButton } from '../components/FolderSaveButton';

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
const sizeLabels: Record<string, string> = {
  LARGE: '대기업',
  PUBLIC: '공기업/공공기관',
  MID: '중견기업',
  SMALL: '중소기업',
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

export function JobsPage() {
  const client = useQueryClient();
  const [companySize, setCompanySize] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('new');
  const query = new URLSearchParams({
    ...(companySize ? { companySize } : {}),
    ...(category ? { category } : {}),
    sort,
  }).toString();
  const jobs = useQuery({
    queryKey: ['jobs', companySize, category, sort],
    queryFn: () => api<Job[]>(`/jobs?${query}`),
  });
  const save = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      api('/jobs/saved', { method: 'POST', body: json({ jobId, status, memo: '' }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['jobs'] }),
  });
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <BriefcaseBusiness size={15} /> 관리자 import 데이터
          </span>
          <h1>신입 IT 채용공고</h1>
          <p>경력직 전용 공고는 제외하고, 출처와 마지막 확인 시각을 함께 표시합니다.</p>
        </div>
      </section>
      <div className="filter-bar jobs-filter">
        <Filter />
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
            {[
              '백엔드',
              '프론트엔드',
              '데이터 엔지니어링',
              'AI/ML',
              'DevOps/SRE',
              '정보보안',
              'QA/테스트',
              '공기업 전산 일반',
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          정렬
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="new">신규순</option>
            <option value="deadline">마감 임박순</option>
            <option value="company">회사명순</option>
          </select>
        </label>
      </div>
      {jobs.isLoading && <div className="loading-panel">공고를 불러오는 중…</div>}
      {jobs.isError && <div className="error-panel">공고를 불러오지 못했습니다.</div>}
      <div className="job-list">
        {jobs.data?.map((job) => {
          const days = job.deadlineAt
            ? Math.ceil((new Date(job.deadlineAt).getTime() - Date.now()) / 86_400_000)
            : undefined;
          return (
            <article key={job.id} className="job-card">
              <div className="company-tile">
                <Building2 />
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
                    <MapPin />
                    {job.region}
                  </span>
                  <span>
                    <CalendarClock />
                    {job.rolling
                      ? '상시채용'
                      : days !== undefined
                        ? `D-${Math.max(0, days)}`
                        : '마감일 미정'}
                  </span>
                </div>
                <div className="tag-row">
                  {job.techStack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
                <small>
                  출처: {job.source.name} · 마지막 확인{' '}
                  {job.source.lastSuccessAt
                    ? new Date(job.source.lastSuccessAt).toLocaleDateString('ko-KR')
                    : '확인 필요'}
                </small>
              </div>
              <div className="job-actions">
                <FolderSaveButton itemType="JOB_POSTING" targetId={job.id} label={job.title} />
                <button
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
                  원문 <ExternalLink />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
