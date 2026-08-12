import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { GitCompare, MessageCircle, Pencil, Save, Send, ThumbsUp, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { api, json } from '../lib/api';

type Comment = {
  id: string;
  markdown: string;
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
  visibility: 'PRIVATE' | 'MEMBERS';
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
  comments: Comment[];
};

function SolutionRevisionPanel({ solution }: { solution: Solution }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(solution.code);
  const [description, setDescription] = useState(solution.description);
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
          visibility: solution.visibility,
        }),
      }),
    onSuccess: async () => {
      setEditing(false);
      await client.invalidateQueries({ queryKey: ['solutions'] });
    },
  });
  const [latest, previous] = solution.revisions || [];
  const previousLines = new Set(previous?.code.split('\n') || []);

  return (
    <>
      {editing ? (
        <form
          className="solution-editor"
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
              extensions={[javascript({ typescript: true })]}
            />
          </label>
          <label>
            풀이 설명
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={30_000}
            />
          </label>
          {save.isError && <div className="form-error">새 revision을 저장하지 못했습니다.</div>}
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
          <div className="code-view">
            <CodeMirror
              value={solution.code}
              height="220px"
              editable={false}
              extensions={[javascript({ typescript: true })]}
              basicSetup={{ lineNumbers: true }}
            />
          </div>
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
                {latest.code.split('\n').map((line, index) => (
                  <span
                    key={`${index}-${line}`}
                    className={previousLines.has(line) ? 'same' : 'added'}
                  >
                    {previousLines.has(line) ? '  ' : '+ '} {line || ' '}
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

export function SolutionsPage() {
  const client = useQueryClient();
  const [commenting, setCommenting] = useState<string>();
  const [replyingTo, setReplyingTo] = useState<string>();
  const [comment, setComment] = useState('');
  const solutions = useQuery({
    queryKey: ['solutions'],
    queryFn: () => api<Solution[]>('/coding/solutions'),
  });
  const react = useMutation({
    mutationFn: (id: string) => api(`/coding/solutions/${id}/reaction`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['solutions'] }),
  });
  const createComment = useMutation({
    mutationFn: () =>
      api(`/coding/solutions/${commenting}/comments`, {
        method: 'POST',
        body: json({ markdown: comment, parentId: replyingTo }),
      }),
    onSuccess: async () => {
      setComment('');
      setCommenting(undefined);
      setReplyingTo(undefined);
      await client.invalidateQueries({ queryKey: ['solutions'] });
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (commenting && comment.trim()) createComment.mutate();
  };
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Users size={15} /> 팀 지식
          </span>
          <h1>공유 풀이</h1>
          <p>같은 문제를 다른 관점으로 풀어본 기록을 비교하고 피드백을 남기세요.</p>
        </div>
      </section>
      {solutions.isLoading && <div className="loading-panel">풀이를 불러오는 중…</div>}
      {solutions.isError && <div className="error-panel">공유 풀이를 불러오지 못했습니다.</div>}
      {!solutions.isLoading && !solutions.data?.length && (
        <div className="empty-panel">
          <Users />
          <h3>공유된 풀이가 없습니다</h3>
          <p>코딩테스트에서 첫 멤버 공개 풀이를 작성해보세요.</p>
        </div>
      )}
      <div className="solutions-feed">
        {solutions.data?.map((solution) => (
          <article key={solution.id} className="solution-card">
            <header>
              <div>
                <span>
                  Lv. {solution.problem.level} · {solution.problem.displayTitle}
                </span>
                <h2>{solution.title}</h2>
                <p>
                  {solution.author.displayName} · {solution.language}
                </p>
              </div>
              <button className="reaction-button" onClick={() => react.mutate(solution.id)}>
                <ThumbsUp /> 유용해요 {solution.reactions.length}
              </button>
            </header>
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
                    {item.deletedAt
                      ? '삭제된 댓글입니다.'
                      : item.hiddenAt
                        ? '관리자가 숨긴 댓글입니다.'
                        : item.markdown}
                  </p>
                  {!item.deletedAt && !item.hiddenAt && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setCommenting(solution.id);
                        setReplyingTo(item.id);
                      }}
                    >
                      답글
                    </button>
                  )}
                  {item.replies.map((reply) => (
                    <div className="reply" key={reply.id}>
                      <strong>{reply.author.displayName}</strong>
                      <p>{reply.markdown}</p>
                    </div>
                  ))}
                </div>
              ))}
              {commenting === solution.id ? (
                <form className="comment-form" onSubmit={submit}>
                  <label>
                    <span className="sr-only">{replyingTo ? '답글' : '댓글'}</span>
                    <textarea
                      autoFocus
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
                </form>
              ) : (
                <button className="ghost-button" onClick={() => setCommenting(solution.id)}>
                  댓글 남기기
                </button>
              )}
            </section>
          </article>
        ))}
      </div>
    </div>
  );
}
