import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Download,
  FileJson,
  History,
  Settings2,
  ShieldCheck,
  Upload,
  UserPlus,
} from 'lucide-react';
import { api, json } from '../lib/api';

type Overview = {
  activeUsers: number;
  maxActiveUsers: number;
  importBatches: Array<{
    id: string;
    createdAt: string;
    originalCount: number;
    rejectedCount: number;
  }>;
  capabilities: { processingQueue: boolean; commentReports: boolean };
};

type DailySetting = {
  allowedLevels: number[];
  repeatExclusionDays: number;
  allowRepeatRelaxation: boolean;
};
type Readiness = {
  status: 'ok' | 'not-ready';
  database: 'd1';
  schema: { expectedVersion: string; appliedVersion: string | null; ready: boolean };
  canary: { jobs: number; problems: number; learning: number; searchRows: number } | null;
};

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
};

type AuditLog = {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  actor?: { displayName: string; email: string };
};

type CodingProblem = { id: string; displayTitle: string; level: number };
type DailyChallenge = { id: string; problemId: string; problem: CodingProblem };
type ImportPreview = {
  previewToken: string;
  checksum: string;
  expiresAt: string;
  counts?: Record<string, number>;
  rows?: Array<{
    index: number;
    outcome: string;
    reason: string;
    companyName: string;
    title: string;
  }>;
  source?: { title?: string; sourceVersion?: string };
  unitCount?: number;
  flashcardCount?: number;
  questionCount?: number;
  snapshot?: { mode: 'FULL'; sources: string[] } | null;
  removalCandidates?: Array<{
    id: string;
    sourceName: string;
    companyName: string;
    title: string;
    sourceUrl: string;
  }>;
};
type ActivePreview = {
  kind: 'jobs' | 'learning';
  source: 'text' | 'file';
  signature: string;
  data: ImportPreview;
};

export function AdminPage() {
  const client = useQueryClient();
  const overview = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api<Overview>('/admin/overview'),
  });
  const dailySetting = useQuery({
    queryKey: ['admin-daily-setting'],
    queryFn: () => api<DailySetting>('/admin/daily-challenge-setting'),
  });
  const readiness = useQuery({
    queryKey: ['admin-readiness'],
    queryFn: () => api<Readiness>('/health/ready'),
    refetchInterval: 60_000,
  });
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api<AdminUser[]>('/auth/users'),
  });
  const auditLogs = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api<AuditLog[]>('/admin/audit-logs'),
  });
  const problems = useQuery({
    queryKey: ['admin-coding-problems'],
    queryFn: () => api<CodingProblem[]>('/coding/problems'),
  });
  const challenge = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: () => api<DailyChallenge>('/coding/daily-challenge'),
  });
  const [jobPayload, setJobPayload] = useState('');
  const [jobFile, setJobFile] = useState<File>();
  const [learningPayload, setLearningPayload] = useState('');
  const [preview, setPreview] = useState<ActivePreview>();
  const [message, setMessage] = useState('');
  const [levels, setLevels] = useState<number[]>([1, 2]);
  const [repeatDays, setRepeatDays] = useState(60);
  const [allowRelaxation, setAllowRelaxation] = useState(false);
  const [reselectProblemId, setReselectProblemId] = useState('');
  const [confirmKstDate, setConfirmKstDate] = useState('');
  const [problemUrl, setProblemUrl] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemLevel, setProblemLevel] = useState(1);
  const [problemTrack, setProblemTrack] = useState<'ALGORITHM' | 'SQL'>('ALGORITHM');
  const [problemTags, setProblemTags] = useState('');
  const [previewPage, setPreviewPage] = useState(0);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [removalAcknowledged, setRemovalAcknowledged] = useState(false);
  useEffect(() => {
    if (!dailySetting.data) return;
    setLevels(dailySetting.data.allowedLevels);
    setRepeatDays(dailySetting.data.repeatExclusionDays);
    setAllowRelaxation(dailySetting.data.allowRepeatRelaxation);
  }, [dailySetting.data]);
  const importMutation = useMutation({
    mutationFn: ({ type, commit }: { type: 'jobs' | 'learning'; commit: boolean }) => {
      const raw = type === 'jobs' ? jobPayload : learningPayload;
      if (commit) {
        if (!preview || preview.kind !== type) throw new Error('미리보기를 먼저 실행해주세요.');
        return api(`/${type}/import/commit`, {
          method: 'POST',
          body: json({
            previewToken: preview.data.previewToken,
            checksum: preview.data.checksum,
            acknowledgeAllRows: reviewAcknowledged,
            reviewedRowCount:
              preview.kind === 'jobs'
                ? preview.data.rows?.length || 0
                : preview.data.unitCount || 0,
            acknowledgeRemovals: removalAcknowledged,
            removalCount: preview.data.removalCandidates?.length || 0,
          }),
        });
      }
      return api<ImportPreview>(`/${type}/import/preview`, { method: 'POST', body: raw });
    },
    onSuccess: (data, variables) => {
      if (variables.commit) {
        setMessage('transaction 반영이 완료되었습니다.');
        setPreview(undefined);
        void Promise.all([
          client.invalidateQueries({ queryKey: ['admin-overview'] }),
          client.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
          client.invalidateQueries({ queryKey: [variables.type === 'jobs' ? 'jobs' : 'learning'] }),
        ]);
      } else {
        const signature = variables.type === 'jobs' ? jobPayload : learningPayload;
        setPreview({
          kind: variables.type,
          source: 'text',
          signature,
          data: data as ImportPreview,
        });
        setPreviewPage(0);
        setReviewAcknowledged(false);
        setRemovalAcknowledged(false);
      }
    },
  });
  const settingMutation = useMutation({
    mutationFn: () =>
      api('/admin/daily-challenge-setting', {
        method: 'PATCH',
        body: json({
          allowedLevels: levels,
          repeatExclusionDays: repeatDays,
          allowRepeatRelaxation: allowRelaxation,
        }),
      }),
    onSuccess: async () => {
      setMessage('오늘의 문제 선정 규칙을 저장했습니다.');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin-daily-setting'] }),
        client.invalidateQueries({ queryKey: ['daily-challenge'] }),
        client.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
    },
  });
  const reselectMutation = useMutation({
    mutationFn: () =>
      api('/coding/daily-challenge/reselect', {
        method: 'POST',
        body: json({ problemId: reselectProblemId, confirmKstDate }),
      }),
    onSuccess: async () => {
      setConfirmKstDate('');
      setReselectProblemId('');
      setMessage('오늘의 문제를 수동 재선정하고 감사 로그에 기록했습니다.');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['daily-challenge'] }),
        client.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
    },
  });
  const jobFileImport = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append('file', jobFile!);
      return api<ImportPreview>('/jobs/import/file/preview', {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: (data) => {
      const signature = jobFile ? `${jobFile.name}:${jobFile.size}:${jobFile.lastModified}` : '';
      setPreview({ kind: 'jobs', source: 'file', signature, data });
      setPreviewPage(0);
      setReviewAcknowledged(false);
      setRemovalAcknowledged(false);
    },
  });
  const commitFilePreview = useMutation({
    mutationFn: () => {
      if (!preview || preview.kind !== 'jobs' || preview.source !== 'file') {
        throw new Error('파일 미리보기를 먼저 실행해주세요.');
      }
      return api('/jobs/import/commit', {
        method: 'POST',
        body: json({
          previewToken: preview.data.previewToken,
          checksum: preview.data.checksum,
          acknowledgeAllRows: reviewAcknowledged,
          reviewedRowCount: preview.data.rows?.length || 0,
          acknowledgeRemovals: removalAcknowledged,
          removalCount: preview.data.removalCandidates?.length || 0,
        }),
      });
    },
    onSuccess: async () => {
      setMessage('검토한 파일 checksum을 transaction으로 반영했습니다.');
      setPreview(undefined);
      setJobFile(undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin-overview'] }),
        client.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
        client.invalidateQueries({ queryKey: ['jobs'] }),
      ]);
    },
  });
  const createProblem = useMutation({
    mutationFn: () =>
      api('/coding/problems', {
        method: 'POST',
        body: json({
          sourceUrl: problemUrl,
          displayTitle: problemTitle,
          level: problemLevel,
          track: problemTrack,
          tags: problemTags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: async () => {
      setProblemUrl('');
      setProblemTitle('');
      setProblemTags('');
      setMessage('프로그래머스 원본 링크 문제를 등록했습니다.');
      await client.invalidateQueries({ queryKey: ['admin-coding-problems'] });
    },
  });
  const updateUser = useMutation({
    mutationFn: ({ id, role, isActive }: Pick<AdminUser, 'id' | 'role' | 'isActive'>) =>
      api(`/auth/users/${id}`, {
        method: 'PATCH',
        body: json({ role, isActive }),
      }),
    onSuccess: async () => {
      setMessage('사용자 접근 권한을 변경하고 감사 로그에 기록했습니다.');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin-users'] }),
        client.invalidateQueries({ queryKey: ['admin-overview'] }),
        client.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
    },
  });
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={15} /> 권한이 필요한 작업
          </span>
          <h1>관리자 센터</h1>
          <p>OpenAI 멤버, 정형 데이터 import, 검토 큐와 감사 로그를 관리합니다.</p>
        </div>
      </section>
      {message && (
        <div className="success-panel" role="status">
          {message}
        </div>
      )}
      <section className="admin-stats">
        <article>
          <strong>
            {overview.data?.activeUsers ?? '—'} / {overview.data?.maxActiveUsers ?? 10}
          </strong>
          <span>활성 사용자</span>
        </article>
        <article>
          <strong>{overview.data?.importBatches.length ?? '—'}</strong>
          <span>최근 import batch</span>
        </article>
        <article>
          <strong>{readiness.data?.status === 'ok' ? '정상' : '확인 필요'}</strong>
          <span>D1 schema {readiness.data?.schema.appliedVersion || '조회 중'}</span>
        </article>
      </section>
      {readiness.isError && (
        <div className="error-panel" role="alert">
          운영 준비 상태를 확인하지 못했습니다.
          <button type="button" onClick={() => void readiness.refetch()}>
            다시 확인
          </button>
        </div>
      )}
      <div className="admin-grid">
        <section className="admin-card">
          <header>
            <UserPlus />
            <div>
              <h2>OpenAI 멤버</h2>
              <p>OpenAI 로그인을 마친 멤버만 자동 등록됩니다.</p>
            </div>
          </header>
          <div className="member-list" aria-label="OpenAI 멤버 목록">
            {users.data?.map((user) => (
              <div key={user.id}>
                <strong>{user.displayName}</strong>
                <span>{user.email}</span>
                <label>
                  <span className="sr-only">{user.displayName} 역할</span>
                  <select
                    value={user.role}
                    disabled={updateUser.isPending}
                    onChange={(event) =>
                      updateUser.mutate({
                        id: user.id,
                        role: event.target.value as AdminUser['role'],
                        isActive: user.isActive,
                      })
                    }
                  >
                    <option value="MEMBER">멤버</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={user.isActive}
                    disabled={updateUser.isPending}
                    onChange={(event) =>
                      updateUser.mutate({
                        id: user.id,
                        role: user.role,
                        isActive: event.target.checked,
                      })
                    }
                  />
                  활성
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="admin-card admin-wide-card">
        <header>
          <FileJson />
          <div>
            <h2>코딩테스트 문제 등록</h2>
            <p>프로그래머스 원본 링크와 관리용 표시 정보만 저장합니다.</p>
          </div>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (problemUrl && problemTitle) createProblem.mutate();
          }}
        >
          <label>
            프로그래머스 문제 URL
            <input
              type="url"
              value={problemUrl}
              onChange={(event) => setProblemUrl(event.target.value)}
              placeholder="https://school.programmers.co.kr/learn/courses/30/lessons/..."
              required
            />
          </label>
          <div className="form-row">
            <label>
              표시 제목
              <input
                value={problemTitle}
                onChange={(event) => setProblemTitle(event.target.value)}
                required
              />
            </label>
            <label>
              레벨
              <select
                value={problemLevel}
                onChange={(event) => setProblemLevel(Number(event.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    Lv. {level}
                  </option>
                ))}
              </select>
            </label>
            <label>
              문제 유형
              <select
                value={problemTrack}
                onChange={(event) => setProblemTrack(event.target.value as 'ALGORITHM' | 'SQL')}
              >
                <option value="ALGORITHM">알고리즘</option>
                <option value="SQL">SQL</option>
              </select>
            </label>
            <label>
              태그 (쉼표 구분)
              <input value={problemTags} onChange={(event) => setProblemTags(event.target.value)} />
            </label>
          </div>
          <button className="primary-button compact" disabled={createProblem.isPending}>
            문제 등록
          </button>
          {createProblem.isError && <div className="form-error">{createProblem.error.message}</div>}
        </form>
      </section>
      <div className="admin-grid">
        <section className="admin-card">
          <header>
            <Settings2 />
            <div>
              <h2>오늘의 문제 규칙</h2>
              <p>허용 난이도와 최근 문제 제외 기간을 명시적으로 관리합니다.</p>
            </div>
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (levels.length) settingMutation.mutate();
            }}
          >
            <fieldset>
              <legend>허용 레벨</legend>
              <div className="checkbox-row">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <label key={level}>
                    <input
                      type="checkbox"
                      checked={levels.includes(level)}
                      onChange={() =>
                        setLevels((current) =>
                          current.includes(level)
                            ? current.filter((item) => item !== level)
                            : [...current, level].sort(),
                        )
                      }
                    />
                    Lv. {level}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              최근 문제 제외 일수
              <input
                type="number"
                min={0}
                max={365}
                value={repeatDays}
                onChange={(event) => setRepeatDays(Number(event.target.value))}
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={allowRelaxation}
                onChange={(event) => setAllowRelaxation(event.target.checked)}
              />
              후보가 없으면 제외 기간을 완화
            </label>
            <button
              className="primary-button compact"
              disabled={
                !dailySetting.data ||
                dailySetting.isLoading ||
                settingMutation.isPending ||
                !levels.length
              }
            >
              규칙 저장
            </button>
          </form>
          <div className="admin-divider" />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (reselectProblemId && confirmKstDate) reselectMutation.mutate();
            }}
          >
            <strong>오늘의 문제 수동 재선정</strong>
            <p>
              현재: {challenge.data?.problem.displayTitle || '확인 중'} · 참여 기록이 생기기 전만
              가능합니다.
            </p>
            <label>
              새 문제
              <select
                value={reselectProblemId}
                onChange={(event) => setReselectProblemId(event.target.value)}
              >
                <option value="">선택하세요</option>
                {problems.data
                  ?.filter((problem) => problem.id !== challenge.data?.problemId)
                  .map((problem) => (
                    <option key={problem.id} value={problem.id}>
                      Lv. {problem.level} · {problem.displayTitle}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              확인 날짜 (KST, YYYY-MM-DD)
              <input
                value={confirmKstDate}
                onChange={(event) => setConfirmKstDate(event.target.value)}
                placeholder="2026-08-12"
                pattern="\d{4}-\d{2}-\d{2}"
              />
            </label>
            {reselectMutation.isError && (
              <div className="form-error">{reselectMutation.error.message}</div>
            )}
            <button
              className="ghost-button danger"
              disabled={!reselectProblemId || !confirmKstDate || reselectMutation.isPending}
            >
              확인 후 재선정
            </button>
          </form>
        </section>
      </div>
      <section className="import-section">
        <div className="section-title">
          <div>
            <h2>정형 데이터 import</h2>
            <span>preview → 승인</span>
          </div>
          <p>이 애플리케이션은 외부 사이트를 크롤링하지 않습니다.</p>
        </div>
        <div className="import-grid">
          <article>
            <header>
              <FileJson />
              <h3>신입 IT 채용공고 JSON</h3>
            </header>
            <textarea
              value={jobPayload}
              onChange={(event) => {
                setJobPayload(event.target.value);
                if (preview?.kind === 'jobs' && preview.source === 'text') setPreview(undefined);
              }}
              rows={10}
              placeholder="job import schema JSON"
            />
            <label>
              또는 JSON/CSV 파일
              <input
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={(event) => {
                  setJobFile(event.target.files?.[0]);
                  if (preview?.kind === 'jobs' && preview.source === 'file') setPreview(undefined);
                }}
              />
            </label>
            <div>
              <button
                className="ghost-button"
                disabled={!jobPayload || importMutation.isPending}
                onClick={() => importMutation.mutate({ type: 'jobs', commit: false })}
              >
                미리보기
              </button>
              <button
                className="primary-button compact"
                disabled={
                  !jobPayload ||
                  importMutation.isPending ||
                  preview?.kind !== 'jobs' ||
                  preview.source !== 'text' ||
                  preview.signature !== jobPayload ||
                  !reviewAcknowledged ||
                  (Boolean(preview.data.removalCandidates?.length) && !removalAcknowledged)
                }
                onClick={() => importMutation.mutate({ type: 'jobs', commit: true })}
              >
                <Upload /> 승인 반영
              </button>
              <button
                className="ghost-button"
                disabled={!jobFile || jobFileImport.isPending}
                onClick={() => jobFileImport.mutate()}
              >
                파일 미리보기
              </button>
              <button
                className="primary-button compact"
                disabled={
                  !jobFile ||
                  commitFilePreview.isPending ||
                  preview?.kind !== 'jobs' ||
                  preview.source !== 'file' ||
                  preview.signature !== `${jobFile.name}:${jobFile.size}:${jobFile.lastModified}` ||
                  !reviewAcknowledged ||
                  (Boolean(preview.data.removalCandidates?.length) && !removalAcknowledged)
                }
                onClick={() => commitFilePreview.mutate()}
              >
                <Upload /> 파일 승인 반영
              </button>
            </div>
          </article>
          <article>
            <header>
              <FileJson />
              <h3>학습 package JSON</h3>
            </header>
            <textarea
              value={learningPayload}
              onChange={(event) => {
                setLearningPayload(event.target.value);
                if (preview?.kind === 'learning') setPreview(undefined);
              }}
              rows={10}
              placeholder="learning import schema JSON"
            />
            <div>
              <button
                className="ghost-button"
                disabled={!learningPayload || importMutation.isPending}
                onClick={() => importMutation.mutate({ type: 'learning', commit: false })}
              >
                미리보기
              </button>
              <button
                className="primary-button compact"
                disabled={
                  !learningPayload ||
                  importMutation.isPending ||
                  preview?.kind !== 'learning' ||
                  preview.source !== 'text' ||
                  preview.signature !== learningPayload ||
                  !reviewAcknowledged
                }
                onClick={() => importMutation.mutate({ type: 'learning', commit: true })}
              >
                <Upload /> 승인 반영
              </button>
            </div>
          </article>
        </div>
        {importMutation.isError && <div className="form-error">{importMutation.error.message}</div>}
        {preview && (
          <section className="import-preview" aria-label="import 미리보기 결과">
            <header>
              <strong>{preview.kind === 'jobs' ? '채용공고' : '학습자료'} 검토 결과</strong>
              <span>checksum {preview.data.checksum.slice(0, 12)}…</span>
              <time dateTime={preview.data.expiresAt}>
                {new Date(preview.data.expiresAt).toLocaleTimeString('ko-KR')} 만료
              </time>
            </header>
            {preview.data.counts && (
              <dl className="preview-counts">
                {Object.entries(preview.data.counts).map(([label, count]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{count}</dd>
                  </div>
                ))}
              </dl>
            )}
            {preview.data.rows && (
              <>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(preview.data, null, 2)], {
                      type: 'application/json',
                    });
                    const href = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = href;
                    anchor.download = `careerground-${preview.kind}-preview-${preview.data.checksum.slice(0, 12)}.json`;
                    anchor.click();
                    URL.revokeObjectURL(href);
                  }}
                >
                  <Download /> 전체 diff 다운로드
                </button>
                <div className="table-scroll" tabIndex={0}>
                  <table>
                    <thead>
                      <tr>
                        <th>행</th>
                        <th>판정</th>
                        <th>회사</th>
                        <th>공고</th>
                        <th>사유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.rows
                        .slice(previewPage * 100, previewPage * 100 + 100)
                        .map((row) => (
                          <tr key={`${row.index}-${row.title}`}>
                            <td>{row.index + 1}</td>
                            <td>{row.outcome}</td>
                            <td>{row.companyName}</td>
                            <td>{row.title}</td>
                            <td>{row.reason}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <nav className="preview-pagination" aria-label="미리보기 페이지">
                  <button
                    type="button"
                    disabled={previewPage === 0}
                    onClick={() => setPreviewPage((page) => page - 1)}
                  >
                    이전 100행
                  </button>
                  <span>
                    {previewPage + 1} / {Math.max(1, Math.ceil(preview.data.rows.length / 100))}
                  </span>
                  <button
                    type="button"
                    disabled={(previewPage + 1) * 100 >= preview.data.rows.length}
                    onClick={() => setPreviewPage((page) => page + 1)}
                  >
                    다음 100행
                  </button>
                </nav>
              </>
            )}
            {(preview.data.removalCandidates?.length || 0) > 0 && (
              <section className="import-removal-warning" role="alert">
                <AlertTriangle />
                <div>
                  <strong>
                    FULL snapshot 제거 대상 {preview.data.removalCandidates?.length}건
                  </strong>
                  <p>승인하면 아래 공고가 REMOVED 상태로 바뀝니다.</p>
                  <ul>
                    {preview.data.removalCandidates?.slice(0, 20).map((job) => (
                      <li key={job.id}>
                        {job.sourceName} · {job.companyName} · {job.title}
                      </li>
                    ))}
                  </ul>
                  {(preview.data.removalCandidates?.length || 0) > 20 && (
                    <small>나머지는 전체 diff 다운로드에서 확인할 수 있습니다.</small>
                  )}
                  <label>
                    <input
                      type="checkbox"
                      checked={removalAcknowledged}
                      onChange={(event) => setRemovalAcknowledged(event.target.checked)}
                    />
                    제거 대상 전체를 별도로 확인했습니다.
                  </label>
                </div>
              </section>
            )}
            {preview.data.source && (
              <p>
                {preview.data.source.title} · {preview.data.unitCount ?? 0}개 단원 · flashcard{' '}
                {preview.data.flashcardCount ?? 0}개 · 문항 {preview.data.questionCount ?? 0}개
              </p>
            )}
            <label className="import-review-ack">
              <input
                type="checkbox"
                checked={reviewAcknowledged}
                onChange={(event) => setReviewAcknowledged(event.target.checked)}
              />
              화면의 전체 페이지와 다운로드 diff를 검토했습니다.
            </label>
          </section>
        )}
      </section>
      <section className="audit-section">
        <div className="section-title">
          <div>
            <h2>
              <History /> 감사 로그
            </h2>
            <span>최근 {auditLogs.data?.length ?? 0}건</span>
          </div>
          <p>관리 작업과 중요 상태 변경을 시간순으로 확인합니다.</p>
        </div>
        {auditLogs.isError && <div className="error-panel">감사 로그를 불러오지 못했습니다.</div>}
        <div className="audit-list">
          {auditLogs.data?.slice(0, 30).map((log) => (
            <article key={log.id}>
              <div>
                <strong>{log.action.replaceAll('_', ' ')}</strong>
                <span>{log.actor?.displayName || '시스템'}</span>
              </div>
              <time dateTime={log.createdAt}>
                {new Intl.DateTimeFormat('ko-KR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(log.createdAt))}
              </time>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
