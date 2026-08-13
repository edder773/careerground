import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { Code2, ExternalLink, Filter, Flame, Save, Star } from 'lucide-react';
import { api, json } from '../lib/api';
import { FolderSaveButton } from '../components/FolderSaveButton';
import { useAuth } from '../auth';

type Problem = {
  id: string;
  displayTitle: string;
  level: number;
  tags: string[];
  sourceUrl: string;
  progress: Array<{ status: string; favorite: boolean }>;
  _count: { solutions: number };
};
type Challenge = { id: string; problemId: string; problem: Problem };
type CodeLanguage = 'python' | 'java' | 'javascript' | 'cpp';

function solutionsUrl(problem: Problem) {
  return `/solutions?${new URLSearchParams({
    problemId: problem.id,
    title: problem.displayTitle,
  }).toString()}`;
}

export function CodingPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [level, setLevel] = useState('');
  const [selected, setSelected] = useState<Problem>();
  const [language, setLanguage] = useState<CodeLanguage>(user?.preferredLanguage || 'python');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    if (user?.preferredLanguage) setLanguage(user.preferredLanguage);
  }, [user?.preferredLanguage]);
  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(undefined);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);
  const problems = useQuery({
    queryKey: ['problems', level],
    queryFn: () => api<Problem[]>(`/coding/problems${level ? `?level=${level}` : ''}`),
  });
  const challenge = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => api<Challenge[]>('/coding/daily-challenges'),
  });
  const save = useMutation({
    mutationFn: async () => {
      const solution = await api('/coding/solutions', {
        method: 'POST',
        body: json({
          problemId: selected!.id,
          title: `${selected!.displayTitle} 풀이`,
          language,
          code,
          description,
          lessons: '',
          solved: true,
        }),
      });
      const activeChallenge = challenge.data?.find(
        (item) => selected && item.problem.id === selected.id,
      );
      if (activeChallenge) {
        await api(`/coding/daily-challenge/${activeChallenge.id}/complete`, { method: 'POST' });
      }
      return solution;
    },
    onSuccess: async () => {
      setSelected(undefined);
      setCode('');
      setDescription('');
      await client.invalidateQueries({ queryKey: ['problems'] });
    },
  });
  const progress = useMutation({
    mutationFn: (problemId: string) =>
      api(`/coding/problems/${problemId}/progress`, {
        method: 'PATCH',
        body: json({ status: 'IN_PROGRESS' }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['problems'] }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selected && code.trim()) save.mutate();
  };
  const dailyIds = useMemo(
    () => new Set((challenge.data || []).map((item) => item.problem.id)),
    [challenge.data],
  );
  const list = useMemo(() => problems.data || [], [problems.data]);
  const openEditor = (problem: Problem) => {
    setSelected(problem);
    progress.mutate(problem.id);
  };
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Code2 size={15} /> 코딩 연습
          </span>
          <h1>코딩테스트</h1>
          <p>문제 원문은 프로그래머스에서 확인하고, 이곳에는 내 코드와 풀이만 기록합니다.</p>
        </div>
      </section>
      {challenge.data && challenge.data.length > 0 && (
        <section className="daily-hero daily-pair" aria-label="오늘의 문제">
          <header>
            <span>
              <Flame size={16} /> 오늘의 문제
            </span>
          </header>
          <div className="daily-challenge-grid">
            {challenge.data.map((item) => (
              <article key={item.id}>
                <span>Lv. {item.problem.level}</span>
                <strong>{item.problem.displayTitle}</strong>
                <div className="tag-row">
                  {item.problem.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="daily-challenge-actions">
                  <a
                    href={item.problem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${item.problem.displayTitle} 원본 열기`}
                  >
                    문제 열기 <ExternalLink />
                  </a>
                  <button type="button" onClick={() => openEditor(item.problem)}>
                    풀이 기록
                  </button>
                  <Link to={solutionsUrl(item.problem)}>다른 풀이 보기</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="filter-bar">
        <Filter />
        <label>
          레벨
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="">전체</option>
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                Lv. {value}
              </option>
            ))}
          </select>
        </label>
        <span>문제를 선택해 코드와 풀이 과정을 기록하세요.</span>
      </div>
      {problems.isLoading && <div className="loading-panel">문제 목록을 불러오는 중…</div>}
      {problems.isError && <div className="error-panel">문제 목록을 불러오지 못했습니다.</div>}
      <div className="problem-grid">
        {list.map((problem) => (
          <article key={problem.id} className={dailyIds.has(problem.id) ? 'daily' : ''}>
            <div className="problem-top">
              <span className="level-pill">Lv. {problem.level}</span>
              {dailyIds.has(problem.id) && <span className="today-pill">TODAY</span>}
              <button aria-label="즐겨찾기">
                <Star size={17} fill={problem.progress[0]?.favorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <h3>{problem.displayTitle}</h3>
            <div className="tag-row">
              {problem.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p>
              {problem._count.solutions}개 풀이 기록 · {problem.progress[0]?.status || 'UNTRIED'}
            </p>
            <div className="card-actions">
              <a href={problem.sourceUrl} target="_blank" rel="noreferrer">
                원본 <ExternalLink />
              </a>
              <button onClick={() => openEditor(problem)}>풀이 기록</button>
              <Link to={solutionsUrl(problem)}>다른 풀이 보기</Link>
              <FolderSaveButton
                itemType="CODING_PROBLEM"
                targetId={problem.id}
                label={problem.displayTitle}
              />
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <div
          className="editor-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelected(undefined);
          }}
        >
          <section
            className="editor-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="solution-editor-title"
          >
            <div className="editor-heading">
              <div>
                <span>새 풀이</span>
                <h2 id="solution-editor-title">{selected.displayTitle}</h2>
              </div>
              <button className="ghost-button" onClick={() => setSelected(undefined)} autoFocus>
                닫기
              </button>
            </div>
            <form onSubmit={submit}>
              <div className="form-row">
                <label>
                  언어
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as CodeLanguage)}
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                  </select>
                </label>
                <p className="solution-visibility-note">
                  저장한 풀이는 다른 멤버도 바로 볼 수 있습니다.
                </p>
              </div>
              <label>
                코드
                <div className="code-editor">
                  <CodeMirror
                    value={code}
                    height="260px"
                    extensions={
                      language === 'python'
                        ? [python()]
                        : language === 'javascript'
                          ? [javascript()]
                          : []
                    }
                    onChange={setCode}
                  />
                </div>
              </label>
              <label>
                풀이 설명
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  placeholder="접근 방식, 복잡도, 배운 점을 Markdown으로 남겨보세요."
                />
              </label>
              {save.isError && <div className="form-error">{save.error.message}</div>}
              <button className="primary-button" disabled={!code.trim() || save.isPending}>
                <Save /> {save.isPending ? '저장 중…' : '해결 기록 저장'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
