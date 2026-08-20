import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { Link, useSearchParams } from 'react-router';
import CodeMirror from '@uiw/react-codemirror';
import { Code2, ExternalLink, Filter, Flame, Save, Star } from 'lucide-react';
import { api, json } from '../lib/api';
import { useAuth } from '../auth';
import {
  codeEditorAccessibility,
  loadLanguageExtensions,
  type EditorExtensions,
} from '../lib/code-editor';

type Problem = {
  id: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM' | 'SQL';
  tags: string[];
  sourceUrl: string;
  progress: Array<{ status: string; favorite: boolean }>;
  _count: { solutions: number };
};
type Challenge = { id: string; problemId: string; problem: Problem };
type CodeLanguage = 'python' | 'java' | 'javascript' | 'cpp' | 'sql';
type ProblemScope = 'solved' | 'favorites' | 'all';
type CursorPage<T> = { items: T[]; nextCursor: string | null; total: number };
type SolutionDraft = {
  code: string;
  description: string;
  language: CodeLanguage;
  savedAt: string;
};

const draftKey = (userId: string, problemId: string) =>
  `cg-solution-draft:v2:${userId}:${problemId}`;

function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Browser storage is an optional crash-recovery aid.
  }
}

function readDraft(key: string): SolutionDraft | undefined {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null') as Partial<SolutionDraft>;
    if (!parsed || typeof parsed.code !== 'string' || typeof parsed.description !== 'string') {
      return undefined;
    }
    if (!['python', 'java', 'javascript', 'cpp', 'sql'].includes(String(parsed.language))) {
      return undefined;
    }
    return {
      code: parsed.code,
      description: parsed.description,
      language: parsed.language as CodeLanguage,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    removeDraft(key);
    return undefined;
  }
}

function solutionsUrl(problem: Problem) {
  return `/solutions?${new URLSearchParams({
    problemId: problem.id,
    title: problem.displayTitle,
  }).toString()}`;
}

export function CodingPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [track, setTrack] = useState<'ALGORITHM' | 'SQL'>(
    searchParams.get('track') === 'SQL' ? 'SQL' : 'ALGORITHM',
  );
  const [scope, setScope] = useState<ProblemScope>(() => {
    if (searchParams.get('favorites') === '1') return 'favorites';
    return searchParams.get('view') === 'all' || searchParams.has('problem') ? 'all' : 'solved';
  });
  const [selected, setSelected] = useState<Problem>();
  const [language, setLanguage] = useState<CodeLanguage>(user?.preferredLanguage || 'python');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [restoredDraftAt, setRestoredDraftAt] = useState<string>();
  const [editorExtensions, setEditorExtensions] = useState<EditorExtensions>([]);
  useEffect(() => {
    if (user?.preferredLanguage) setLanguage(user.preferredLanguage);
  }, [user?.preferredLanguage]);
  useEffect(() => {
    let active = true;
    void loadLanguageExtensions(language).then((extensions) => {
      if (active) setEditorExtensions(extensions);
    });
    return () => {
      active = false;
    };
  }, [language]);
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (track === 'SQL') next.set('track', track);
    else next.delete('track');
    if (level) next.set('level', level);
    else next.delete('level');
    if (scope === 'all') next.set('view', 'all');
    else next.delete('view');
    if (scope === 'favorites') next.set('favorites', '1');
    else next.delete('favorites');
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [level, scope, searchParams, setSearchParams, track]);
  const problems = useInfiniteQuery({
    queryKey: ['problems', scope, track, level],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams({ track, page: 'cursor', limit: '60' });
      if (level) query.set('level', level);
      if (scope === 'solved') query.set('scope', 'solved');
      if (scope === 'favorites') query.set('favorites', '1');
      if (pageParam) query.set('cursor', pageParam);
      return api<CursorPage<Problem>>(`/coding/problems?${query.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
  const challenge = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => api<Challenge[]>('/coding/daily-challenges'),
  });
  const save = useMutation({
    mutationFn: async () => {
      const activeChallenge = challenge.data?.find(
        (item) => selected && item.problem.id === selected.id,
      );
      return api(activeChallenge ? '/coding/solutions/complete' : '/coding/solutions', {
        method: 'POST',
        body: json({
          problemId: selected!.id,
          title: `${selected!.displayTitle} 풀이`,
          language,
          code,
          description,
          lessons: '',
          solved: true,
          challengeId: activeChallenge?.id,
        }),
      });
    },
    onSuccess: async () => {
      if (selected && user) removeDraft(draftKey(user.id, selected.id));
      setSelected(undefined);
      setCode('');
      setDescription('');
      await client.invalidateQueries({ queryKey: ['problems'] });
    },
  });
  const favorite = useMutation({
    mutationFn: ({ problemId, active }: { problemId: string; active: boolean }) =>
      api(`/coding/problems/${problemId}/favorite`, {
        method: 'PATCH',
        body: json({ favorite: active }),
      }),
    onMutate: async ({ problemId, active }) => {
      await client.cancelQueries({ queryKey: ['problems'] });
      const snapshots = client.getQueriesData<InfiniteData<CursorPage<Problem>>>({
        queryKey: ['problems'],
      });
      client.setQueriesData<InfiniteData<CursorPage<Problem>>>(
        { queryKey: ['problems'] },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  items: page.items.map((problem) =>
                    problem.id === problemId
                      ? {
                          ...problem,
                          progress: [
                            {
                              status: problem.progress[0]?.status || 'UNTRIED',
                              favorite: active,
                            },
                          ],
                        }
                      : problem,
                  ),
                })),
              }
            : current,
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) =>
      context?.snapshots.forEach(([key, data]) => client.setQueryData(key, data)),
    onSettled: () => client.invalidateQueries({ queryKey: ['problems'] }),
  });
  useEffect(() => {
    if (!selected || !user) return;
    const key = draftKey(user.id, selected.id);
    const timer = window.setTimeout(() => {
      if (!code && !description) {
        removeDraft(key);
        return;
      }
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            code: code.slice(0, 200_000),
            description: description.slice(0, 30_000),
            language,
            savedAt: new Date().toISOString(),
          } satisfies SolutionDraft),
        );
      } catch {
        // Explicit server save remains available when storage is full or unavailable.
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [code, description, language, selected, user]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!selected || (!code && !description)) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [code, description, selected]);
  const openEditor = (problem: Problem) => {
    setSelected(problem);
    setRestoredDraftAt(undefined);
    setLanguage(problem.track === 'SQL' ? 'sql' : user?.preferredLanguage || 'python');
    removeDraft(`cg-solution-draft:${problem.id}`);
    const key = user ? draftKey(user.id, problem.id) : undefined;
    const draft = key ? readDraft(key) : undefined;
    if (!draft) {
      setCode('');
      setDescription('');
      return;
    }
    setCode(draft.code);
    setDescription(draft.description);
    setLanguage(draft.language);
    setRestoredDraftAt(draft.savedAt);
  };
  const closeEditor = () => {
    if ((code || description) && !window.confirm('저장하지 않은 풀이가 있습니다. 닫을까요?'))
      return;
    setSelected(undefined);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selected && code.trim()) save.mutate();
  };
  const dailyIds = useMemo(
    () => new Set((challenge.data || []).map((item) => item.problem.id)),
    [challenge.data],
  );
  const list = useMemo(
    () => problems.data?.pages.flatMap((page) => page.items) || [],
    [problems.data],
  );
  const problemTotal = problems.data?.pages[0]?.total || 0;
  const requestedProblem = searchParams.get('problem');
  const requestedProblemQuery = useQuery({
    queryKey: ['problem-detail', requestedProblem],
    queryFn: () => api<Problem>(`/coding/problems/${requestedProblem}`),
    enabled: Boolean(requestedProblem && !list.some((problem) => problem.id === requestedProblem)),
  });
  const displayList = useMemo(
    () =>
      requestedProblemQuery.data &&
      !list.some((problem) => problem.id === requestedProblemQuery.data.id)
        ? [requestedProblemQuery.data, ...list]
        : list,
    [list, requestedProblemQuery.data],
  );
  useEffect(() => {
    if (!requestedProblem || !displayList.length) return;
    document.getElementById(`problem-${requestedProblem}`)?.scrollIntoView({ block: 'center' });
  }, [displayList, requestedProblem]);
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
                <span>
                  {item.problem.track === 'SQL' && 'SQL · '}Lv. {item.problem.level}
                </span>
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
      {challenge.isError && (
        <div className="error-panel" role="alert">
          오늘의 문제를 준비하지 못했습니다.
          <button type="button" onClick={() => void challenge.refetch()}>
            다시 시도
          </button>
        </div>
      )}
      <div className="problem-scope-tabs" role="group" aria-label="문제 목록">
        <button
          type="button"
          aria-pressed={scope === 'solved'}
          className={scope === 'solved' ? 'active' : ''}
          onClick={() => setScope('solved')}
        >
          내가 푼 문제
        </button>
        <button
          type="button"
          aria-pressed={scope === 'favorites'}
          className={scope === 'favorites' ? 'active' : ''}
          onClick={() => setScope('favorites')}
        >
          즐겨찾기
        </button>
        <button
          type="button"
          aria-pressed={scope === 'all'}
          className={scope === 'all' ? 'active' : ''}
          onClick={() => setScope('all')}
        >
          전체 문제
        </button>
      </div>
      <div className="filter-bar">
        <Filter />
        <div className="problem-track-tabs" role="group" aria-label="문제 유형">
          <button
            type="button"
            className={track === 'ALGORITHM' ? 'active' : ''}
            aria-pressed={track === 'ALGORITHM'}
            onClick={() => {
              setTrack('ALGORITHM');
              setLevel('');
            }}
          >
            알고리즘
          </button>
          <button
            type="button"
            className={track === 'SQL' ? 'active' : ''}
            aria-pressed={track === 'SQL'}
            onClick={() => {
              setTrack('SQL');
              setLevel('');
            }}
          >
            SQL
          </button>
        </div>
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
        <span>
          {scope === 'solved'
            ? `${problemTotal.toLocaleString()}개 해결 기록 · 내가 해결한 문제만 모아봅니다.`
            : scope === 'favorites'
              ? `${problemTotal.toLocaleString()}개 즐겨찾기 · 별표한 문제만 모아봅니다.`
              : `${problemTotal.toLocaleString()}개 문제 · 문제를 선택해 코드와 풀이 과정을 기록하세요.`}
        </span>
      </div>
      {problems.isLoading && <div className="loading-panel">문제 목록을 불러오는 중…</div>}
      {problems.isError && <div className="error-panel">문제 목록을 불러오지 못했습니다.</div>}
      {!problems.isLoading && !problems.isError && displayList.length === 0 && (
        <div className="empty-panel coding-problem-empty">
          <h2>
            {scope === 'solved'
              ? '아직 해결한 문제가 없습니다'
              : scope === 'favorites'
                ? '즐겨찾기한 문제가 없습니다'
                : '조건에 맞는 문제가 없습니다'}
          </h2>
          <p>
            {scope === 'solved'
              ? '전체 문제에서 첫 문제를 골라 풀이를 기록해보세요.'
              : scope === 'favorites'
                ? '전체 문제에서 별표를 눌러 즐겨찾기에 추가해보세요.'
                : '문제 유형이나 레벨 조건을 바꿔보세요.'}
          </p>
          {scope !== 'all' && (
            <button
              type="button"
              className="primary-button compact"
              onClick={() => setScope('all')}
            >
              전체 문제 둘러보기
            </button>
          )}
        </div>
      )}
      <div className="problem-grid">
        {displayList.map((problem) => (
          <article
            key={problem.id}
            id={`problem-${problem.id}`}
            className={`${dailyIds.has(problem.id) ? 'daily' : ''} ${problem.id === requestedProblem ? 'search-target' : ''}`}
          >
            <div className="problem-top">
              <span className="level-pill">Lv. {problem.level}</span>
              <span className={`track-pill ${problem.track === 'SQL' ? 'sql' : ''}`}>
                {problem.track === 'SQL' ? 'SQL' : '알고리즘'}
              </span>
              {dailyIds.has(problem.id) && <span className="today-pill">TODAY</span>}
              <button
                aria-label={`${problem.displayTitle} 즐겨찾기`}
                aria-pressed={Boolean(problem.progress[0]?.favorite)}
                disabled={favorite.isPending && favorite.variables?.problemId === problem.id}
                onClick={() =>
                  favorite.mutate({
                    problemId: problem.id,
                    active: !problem.progress[0]?.favorite,
                  })
                }
              >
                <Star size={17} fill={problem.progress[0]?.favorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <h2>{problem.displayTitle}</h2>
            <div className="tag-row">
              {problem.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p>
              {problem._count.solutions}개 풀이 기록 ·{' '}
              {{
                UNTRIED: '미도전',
                IN_PROGRESS: '풀이 중',
                SOLVED: '해결 기록',
                RETRY: '재도전',
              }[problem.progress[0]?.status || 'UNTRIED'] || '미도전'}
            </p>
            <div className="card-actions">
              <a href={problem.sourceUrl} target="_blank" rel="noreferrer">
                원본 <ExternalLink />
              </a>
              <button onClick={() => openEditor(problem)}>풀이 기록</button>
              <Link to={solutionsUrl(problem)}>다른 풀이 보기</Link>
            </div>
          </article>
        ))}
      </div>
      {problems.hasNextPage && (
        <button
          type="button"
          className="load-more-button"
          disabled={problems.isFetchingNextPage}
          onClick={() => problems.fetchNextPage()}
        >
          {problems.isFetchingNextPage ? '문제를 불러오는 중…' : '문제 더 보기'}
        </button>
      )}
      {selected && (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) closeEditor();
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="editor-backdrop" />
            <Dialog.Content className="editor-panel" aria-describedby={undefined}>
              <div className="editor-heading">
                <div>
                  <span>새 풀이</span>
                  <Dialog.Title asChild>
                    <h2>{selected.displayTitle}</h2>
                  </Dialog.Title>
                </div>
                <button className="ghost-button" type="button" onClick={closeEditor}>
                  닫기
                </button>
              </div>
              <form
                onSubmit={submit}
                aria-describedby={save.isError ? 'solution-submit-error' : undefined}
              >
                <div className="form-row">
                  <label>
                    언어
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value as CodeLanguage)}
                    >
                      {selected.track === 'SQL' ? (
                        <option value="sql">SQL</option>
                      ) : (
                        <>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="javascript">JavaScript</option>
                          <option value="cpp">C++</option>
                        </>
                      )}
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
                      extensions={[codeEditorAccessibility, ...editorExtensions]}
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
                    aria-invalid={save.isError || undefined}
                    aria-describedby={save.isError ? 'solution-submit-error' : undefined}
                  />
                </label>
                {save.isError && (
                  <div className="form-error" id="solution-submit-error" role="alert">
                    {save.error.message}
                  </div>
                )}
                {restoredDraftAt && (
                  <div className="draft-restored" role="status">
                    <span>
                      {new Date(restoredDraftAt).toLocaleString('ko-KR')}에 자동 저장한 초안을
                      복원했습니다.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (user) removeDraft(draftKey(user.id, selected.id));
                        setCode('');
                        setDescription('');
                        setRestoredDraftAt(undefined);
                      }}
                    >
                      초안 폐기
                    </button>
                  </div>
                )}
                <button className="primary-button" disabled={!code.trim() || save.isPending}>
                  <Save /> {save.isPending ? '저장 중…' : '해결 기록 저장'}
                </button>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
