import { useEffect, useState, type FormEvent } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import CodeMirror from '@uiw/react-codemirror';
import { GitCompare, MessageCircle, Pencil, Save, Send, ThumbsUp, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ApiError, api, json } from '../lib/api';
import {
  codeEditorAccessibility,
  loadLanguageExtensions,
  type EditorExtensions,
} from '../lib/code-editor';
import { myersDiff } from '../lib/myers-diff';
import '../styles/solutions.css';

type Comment = {
  id: string;
  markdown: string | null;
  redacted?: 'DELETED' | 'HIDDEN' | null;
  deletedAt?: string;
  hiddenAt?: string;
  author: { displayName: string };
  replies: Comment[];
};
type Solution = {
  id: string;
  problemId: string;
  title: string;
  language: string;
  code: string;
  description: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  lessons?: string;
  solved: boolean;
  currentRev: number;
  canEdit?: boolean;
  revisions: Array<{
    id: string;
    revision: number;
    code: string;
    description: string;
    createdAt: string;
  }>;
  author: { id: string; displayName: string };
  problem: { displayTitle: string; level: number };
  reactions: Array<{ id: string }>;
  reactionCount?: number;
  reactedByMe?: boolean;
  comments: Comment[];
};
type SolutionSummary = Pick<
  Solution,
  | 'id'
  | 'problemId'
  | 'title'
  | 'language'
  | 'timeComplexity'
  | 'spaceComplexity'
  | 'solved'
  | 'currentRev'
  | 'canEdit'
  | 'author'
  | 'problem'
  | 'reactionCount'
  | 'reactedByMe'
> & {
  descriptionPreview: string;
  commentCount: number;
};
type CursorPage<T> = { items: T[]; nextCursor: string | null; total: number };

function SolutionRevisionPanel({ solution }: { solution: Solution }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(solution.code);
  const [description, setDescription] = useState(solution.description);
  const [baseRevision, setBaseRevision] = useState(solution.currentRev);
  const [conflict, setConflict] = useState<{
    code: string;
    description: string;
    currentRev: number;
  }>();
  const [extensions, setExtensions] = useState<EditorExtensions>([]);
  useEffect(() => {
    let active = true;
    void loadLanguageExtensions(solution.language).then((loaded) => {
      if (active) setExtensions(loaded);
    });
    return () => {
      active = false;
    };
  }, [solution.language]);
  const save = useMutation({
    mutationFn: () =>
      api('/coding/solutions', {
        method: 'POST',
        body: json({
          id: solution.id,
          problemId: solution.problemId,
          title: solution.title,
          language: solution.language,
          code,
          description,
          timeComplexity: solution.timeComplexity,
          spaceComplexity: solution.spaceComplexity,
          lessons: solution.lessons,
          solved: solution.solved,
          baseRevision,
        }),
      }),
    onSuccess: async () => {
      setEditing(false);
      setConflict(undefined);
      await client.invalidateQueries({ queryKey: ['solutions'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'REVISION_CONFLICT') {
        const current = (error.details as { current?: typeof conflict } | undefined)?.current;
        if (current?.code !== undefined && current.currentRev !== undefined) setConflict(current);
      }
    },
  });
  const [latest, previous] = solution.revisions || [];
  const revisionDiff = previous && latest ? myersDiff(previous.code, latest.code) : [];

  return (
    <>
      {editing ? (
        <form
          className="solution-editor"
          aria-describedby={save.isError ? `revision-error-${solution.id}` : undefined}
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label>
            <span className="sr-only">풀이 코드</span>
            <CodeMirror
              value={code}
              height="260px"
              onChange={setCode}
              extensions={[codeEditorAccessibility, ...extensions]}
            />
          </label>
          <label>
            풀이 설명
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={30_000}
              aria-invalid={save.isError || undefined}
              aria-describedby={save.isError ? `revision-error-${solution.id}` : undefined}
            />
          </label>
          {save.isError && (
            <div className="form-error" id={`revision-error-${solution.id}`} role="alert">
              새 revision을 저장하지 못했습니다.
            </div>
          )}
          {conflict && (
            <section className="revision-conflict" role="alert">
              <h3>다른 곳에서 먼저 수정된 풀이가 있습니다</h3>
              <div>
                <article>
                  <strong>내 변경</strong>
                  <pre>{code}</pre>
                </article>
                <article>
                  <strong>서버 revision {conflict.currentRev}</strong>
                  <pre>{conflict.code}</pre>
                </article>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCode(conflict.code);
                  setDescription(conflict.description);
                  setBaseRevision(conflict.currentRev);
                  setConflict(undefined);
                }}
              >
                서버 버전 불러오기
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaseRevision(conflict.currentRev);
                  setConflict(undefined);
                }}
              >
                내 변경을 최신 revision 위에 다시 저장
              </button>
            </section>
          )}
          <div className="detail-actions">
            <button className="primary-button compact" disabled={!code.trim()}>
              <Save /> revision 저장
            </button>
            <button type="button" className="ghost-button" onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </form>
      ) : (
        <>
          <pre className="code-view static-code" tabIndex={0} aria-label={`${solution.title} 코드`}>
            <code>{solution.code.split('\n').slice(0, 80).join('\n')}</code>
          </pre>
          <div className="markdown-body">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{solution.description}</ReactMarkdown>
          </div>
        </>
      )}
      <div className="revision-actions">
        <details>
          <summary>
            <GitCompare /> revision {solution.currentRev} · 최근 변경 보기
          </summary>
          {!previous || !latest ? (
            <p>아직 비교할 이전 revision이 없습니다.</p>
          ) : (
            <div className="revision-diff">
              <header>
                <span>rev. {previous.revision}</span>
                <span>→</span>
                <span>rev. {latest.revision}</span>
              </header>
              <pre>
                {revisionDiff.map((line, index) => (
                  <span key={`${index}-${line.type}`} className={line.type}>
                    {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}{' '}
                    {line.value || ' '}
                  </span>
                ))}
              </pre>
            </div>
          )}
        </details>
        {solution.canEdit && !editing && (
          <button className="ghost-button" onClick={() => setEditing(true)}>
            <Pencil /> 풀이 수정
          </button>
        )}
      </div>
    </>
  );
}

function SolutionFeedItem({
  summary,
  initiallyExpanded,
  onReact,
}: {
  summary: SolutionSummary;
  initiallyExpanded: boolean;
  onReact: (active: boolean) => void;
}) {
  const client = useQueryClient();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [replyingTo, setReplyingTo] = useState<string>();
  const [comment, setComment] = useState('');
  const detail = useQuery({
    queryKey: ['solution-detail', summary.id],
    queryFn: () => api<Solution>(`/coding/solutions/${summary.id}`),
    enabled: expanded,
    staleTime: 60_000,
  });
  const createComment = useMutation({
    mutationFn: () =>
      api(`/coding/solutions/${summary.id}/comments`, {
        method: 'POST',
        body: json({ markdown: comment, parentId: replyingTo }),
      }),
    onSuccess: async () => {
      setComment('');
      setReplyingTo(undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['solution-detail', summary.id] }),
        client.invalidateQueries({ queryKey: ['solutions'] }),
      ]);
    },
  });
  const solution = detail.data;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim()) createComment.mutate();
  };
  return (
    <article className="solution-card">
      <header>
        <div>
          <span>
            Lv. {summary.problem.level} · {summary.problem.displayTitle}
          </span>
          <h2>{summary.title}</h2>
          <p>
            {summary.author.displayName} · {summary.language}
          </p>
        </div>
        <button
          className="reaction-button"
          aria-pressed={Boolean(summary.reactedByMe)}
          onClick={() => onReact(!summary.reactedByMe)}
        >
          <ThumbsUp /> 유용해요 {summary.reactionCount || 0}
        </button>
      </header>
      {!expanded && (
        <div className="solution-summary">
          <p>{summary.descriptionPreview || '기록된 코드와 설명을 확인해보세요.'}</p>
          <button type="button" className="ghost-button" onClick={() => setExpanded(true)}>
            코드·revision·댓글 보기 ({summary.commentCount})
          </button>
        </div>
      )}
      {expanded && detail.isLoading && (
        <div className="loading-panel">풀이 상세를 불러오는 중…</div>
      )}
      {expanded && detail.isError && (
        <div className="error-panel">
          풀이 상세를 불러오지 못했습니다.
          <button type="button" onClick={() => detail.refetch()}>
            다시 시도
          </button>
        </div>
      )}
      {solution && (
        <>
          <SolutionRevisionPanel solution={solution} />
          {(solution.timeComplexity || solution.spaceComplexity) && (
            <div className="complexity-row">
              <span>시간 {solution.timeComplexity || '—'}</span>
              <span>공간 {solution.spaceComplexity || '—'}</span>
            </div>
          )}
          <section className="comments">
            <h3>
              <MessageCircle /> 댓글{' '}
              {solution.comments.reduce((sum, item) => sum + 1 + item.replies.length, 0)}
            </h3>
            {solution.comments.map((item) => (
              <div key={item.id} className="comment">
                <strong>{item.author.displayName}</strong>
                <p>
                  {item.redacted === 'DELETED' || item.deletedAt
                    ? '삭제된 댓글입니다.'
                    : item.redacted === 'HIDDEN' || item.hiddenAt
                      ? '관리자가 숨긴 댓글입니다.'
                      : item.markdown}
                </p>
                {!item.deletedAt && !item.hiddenAt && (
                  <button className="text-button" onClick={() => setReplyingTo(item.id)}>
                    답글
                  </button>
                )}
                {item.replies.map((reply) => (
                  <div className="reply" key={reply.id}>
                    <strong>{reply.author.displayName}</strong>
                    <p>
                      {reply.redacted === 'DELETED' || reply.deletedAt
                        ? '삭제된 답글입니다.'
                        : reply.redacted === 'HIDDEN' || reply.hiddenAt
                          ? '관리자가 숨긴 답글입니다.'
                          : reply.markdown}
                    </p>
                  </div>
                ))}
              </div>
            ))}
            <form className="comment-form" onSubmit={submit}>
              <label>
                <span className="sr-only">{replyingTo ? '답글' : '댓글'}</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={4000}
                  rows={2}
                  placeholder={replyingTo ? '답글을 입력하세요' : '댓글을 입력하세요'}
                />
              </label>
              <button className="primary-button compact" disabled={!comment.trim()}>
                <Send /> 등록
              </button>
              {replyingTo && (
                <button
                  type="button"
                  className="ghost-button compact"
                  onClick={() => setReplyingTo(undefined)}
                >
                  답글 취소
                </button>
              )}
            </form>
          </section>
          <button type="button" className="text-button" onClick={() => setExpanded(false)}>
            상세 접기
          </button>
        </>
      )}
    </article>
  );
}

export function SolutionsPage() {
  const client = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const problemId = searchParams.get('problemId') || '';
  const problemTitle = searchParams.get('title') || '';
  const requestedSolution = searchParams.get('solution') || '';
  const solutions = useInfiniteQuery({
    queryKey: ['solutions', problemId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams({ page: 'cursor', limit: '10' });
      if (problemId) query.set('problemId', problemId);
      if (pageParam) query.set('cursor', pageParam);
      return api<CursorPage<SolutionSummary>>(`/coding/solutions?${query.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
  const solutionRows = solutions.data?.pages.flatMap((page) => page.items) || [];
  const react = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api(`/coding/solutions/${id}/reaction`, {
        method: 'PUT',
        body: json({ active }),
      }),
    onMutate: async ({ id, active }) => {
      await client.cancelQueries({ queryKey: ['solutions'] });
      const snapshots = client.getQueriesData<InfiniteData<CursorPage<SolutionSummary>>>({
        queryKey: ['solutions'],
      });
      client.setQueriesData<InfiniteData<CursorPage<SolutionSummary>>>(
        { queryKey: ['solutions'] },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  items: page.items.map((solution) =>
                    solution.id === id
                      ? {
                          ...solution,
                          reactedByMe: active,
                          reactionCount: Math.max(
                            0,
                            (solution.reactionCount || 0) + (active ? 1 : -1),
                          ),
                        }
                      : solution,
                  ),
                })),
              }
            : current,
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) =>
      context?.snapshots.forEach(([key, value]) => client.setQueryData(key, value)),
    onSettled: () => client.invalidateQueries({ queryKey: ['solutions'] }),
  });
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Users size={15} /> 함께 보는 코드
          </span>
          <h1>{problemId ? `${problemTitle || '선택한 문제'} 다른 풀이` : '풀이 기록'}</h1>
          <p>기록된 코드를 비교하고 더 나은 접근 방법을 함께 찾아보세요.</p>
        </div>
        {problemId && (
          <button className="ghost-button" onClick={() => setSearchParams({})}>
            전체 풀이 보기
          </button>
        )}
      </section>
      {solutions.isLoading && <div className="loading-panel">풀이를 불러오는 중…</div>}
      {solutions.isError && <div className="error-panel">풀이 기록을 불러오지 못했습니다.</div>}
      {!solutions.isLoading && !solutionRows.length && (
        <div className="empty-panel">
          <Users />
          <h2>아직 풀이 기록이 없습니다</h2>
          <p>코딩테스트에서 이 문제의 첫 풀이를 기록해보세요.</p>
        </div>
      )}
      <div className="solutions-feed">
        {solutionRows.map((solution) => (
          <SolutionFeedItem
            key={solution.id}
            summary={solution}
            initiallyExpanded={requestedSolution === solution.id}
            onReact={(active) => react.mutate({ id: solution.id, active })}
          />
        ))}
      </div>
      {solutions.hasNextPage && (
        <button
          type="button"
          className="load-more-button"
          disabled={solutions.isFetchingNextPage}
          onClick={() => solutions.fetchNextPage()}
        >
          {solutions.isFetchingNextPage ? '풀이를 불러오는 중…' : '풀이 더 보기'}
        </button>
      )}
    </div>
  );
}
