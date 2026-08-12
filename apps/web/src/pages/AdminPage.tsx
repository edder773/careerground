import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
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
  processingQueue: unknown[];
  commentReports: unknown[];
};

type DailySetting = {
  allowedLevels: number[];
  repeatExclusionDays: number;
  allowRepeatRelaxation: boolean;
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
  const [sourceFile, setSourceFile] = useState<File>();
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceSubject, setSourceSubject] = useState('');
  const [sourceCategory, setSourceCategory] = useState('');
  const [sourceVersion, setSourceVersion] = useState('1.0');
  const [preview, setPreview] = useState<unknown>();
  const [message, setMessage] = useState('');
  const [levels, setLevels] = useState<number[]>([1, 2]);
  const [repeatDays, setRepeatDays] = useState(60);
  const [allowRelaxation, setAllowRelaxation] = useState(false);
  const [reselectProblemId, setReselectProblemId] = useState('');
  const [confirmKstDate, setConfirmKstDate] = useState('');
  const [problemUrl, setProblemUrl] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemLevel, setProblemLevel] = useState(1);
  const [problemTags, setProblemTags] = useState('');
  useEffect(() => {
    if (!dailySetting.data) return;
    setLevels(dailySetting.data.allowedLevels);
    setRepeatDays(dailySetting.data.repeatExclusionDays);
    setAllowRelaxation(dailySetting.data.allowRepeatRelaxation);
  }, [dailySetting.data]);
  const importMutation = useMutation({
    mutationFn: ({ type, commit }: { type: 'jobs' | 'learning'; commit: boolean }) => {
      const raw = type === 'jobs' ? jobPayload : learningPayload;
      return api(`/${type}/import/${commit ? 'commit' : 'preview'}`, { method: 'POST', body: raw });
    },
    onSuccess: (data, variables) => {
      setPreview(data);
      if (variables.commit) {
        setMessage('transaction 반영이 완료되었습니다.');
        client.invalidateQueries();
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
  const uploadSource = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append('file', sourceFile!);
      form.append('title', sourceTitle);
      form.append('subject', sourceSubject);
      form.append('category', sourceCategory);
      form.append('version', sourceVersion);
      return api<{ status: string }>('/learning/sources/upload', { method: 'POST', body: form });
    },
    onSuccess: async (data) => {
      setSourceFile(undefined);
      setSourceTitle('');
      setMessage(
        data.status === 'REQUIRES_MANUAL_PROCESSING'
          ? '원본을 등록했습니다. PDF/DOCX는 수동 텍스트 추출이 필요합니다.'
          : '학습 원본을 등록했습니다.',
      );
      await client.invalidateQueries({ queryKey: ['learning'] });
    },
  });
  const jobFileImport = useMutation({
    mutationFn: (commit: boolean) => {
      const form = new FormData();
      form.append('file', jobFile!);
      return api(`/jobs/import/file/${commit ? 'commit' : 'preview'}`, {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: async (data, commit) => {
      setPreview(data);
      if (commit) {
        setMessage('채용공고 파일을 transaction으로 반영했습니다.');
        setJobFile(undefined);
        await client.invalidateQueries();
      }
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
          <strong>{overview.data?.processingQueue.length ?? '—'}</strong>
          <span>처리 검토</span>
        </article>
        <article>
          <strong>{overview.data?.commentReports.length ?? '—'}</strong>
          <span>댓글 신고</span>
        </article>
      </section>
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
                <small>{user.role}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-card warning">
          <header>
            <AlertTriangle />
            <div>
              <h2>AI 학습 처리</h2>
              <p>feature flag와 서버 자격증명이 모두 있어야 활성화됩니다.</p>
            </div>
          </header>
          <p>
            키가 없을 때 성공으로 표시하지 않으며, 구조화 package import 경로를 계속 사용할 수
            있습니다.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (sourceFile && sourceTitle && sourceSubject && sourceCategory)
                uploadSource.mutate();
            }}
          >
            <label>
              학습 원본 파일
              <input
                type="file"
                accept=".pdf,.docx,.md,.txt,.csv"
                onChange={(event) => setSourceFile(event.target.files?.[0])}
              />
            </label>
            <label>
              자료 제목
              <input value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} />
            </label>
            <div className="form-row">
              <label>
                과목
                <input
                  value={sourceSubject}
                  onChange={(event) => setSourceSubject(event.target.value)}
                />
              </label>
              <label>
                카테고리
                <input
                  value={sourceCategory}
                  onChange={(event) => setSourceCategory(event.target.value)}
                />
              </label>
              <label>
                버전
                <input
                  value={sourceVersion}
                  onChange={(event) => setSourceVersion(event.target.value)}
                />
              </label>
            </div>
            <button
              className="primary-button compact"
              disabled={
                !sourceFile ||
                !sourceTitle ||
                !sourceSubject ||
                !sourceCategory ||
                uploadSource.isPending
              }
            >
              <Upload /> 원본 등록
            </button>
            {uploadSource.isError && <div className="form-error">{uploadSource.error.message}</div>}
          </form>
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
            <button className="primary-button compact" disabled={!levels.length}>
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
              onChange={(event) => setJobPayload(event.target.value)}
              rows={10}
              placeholder="job import schema JSON"
            />
            <label>
              또는 JSON/CSV 파일
              <input
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={(event) => setJobFile(event.target.files?.[0])}
              />
            </label>
            <div>
              <button
                className="ghost-button"
                disabled={!jobPayload}
                onClick={() => importMutation.mutate({ type: 'jobs', commit: false })}
              >
                미리보기
              </button>
              <button
                className="primary-button compact"
                disabled={!jobPayload}
                onClick={() => importMutation.mutate({ type: 'jobs', commit: true })}
              >
                <Upload /> 승인 반영
              </button>
              <button
                className="ghost-button"
                disabled={!jobFile || jobFileImport.isPending}
                onClick={() => jobFileImport.mutate(false)}
              >
                파일 미리보기
              </button>
              <button
                className="primary-button compact"
                disabled={!jobFile || jobFileImport.isPending}
                onClick={() => jobFileImport.mutate(true)}
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
              onChange={(event) => setLearningPayload(event.target.value)}
              rows={10}
              placeholder="learning import schema JSON"
            />
            <div>
              <button
                className="ghost-button"
                disabled={!learningPayload}
                onClick={() => importMutation.mutate({ type: 'learning', commit: false })}
              >
                미리보기
              </button>
              <button
                className="primary-button compact"
                disabled={!learningPayload}
                onClick={() => importMutation.mutate({ type: 'learning', commit: true })}
              >
                <Upload /> 승인 반영
              </button>
            </div>
          </article>
        </div>
        {importMutation.isError && <div className="form-error">{importMutation.error.message}</div>}
        {preview !== undefined && (
          <pre className="preview-json">{JSON.stringify(preview, null, 2)}</pre>
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
