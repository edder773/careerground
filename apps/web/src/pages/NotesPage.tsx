import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileClock, FileText, Plus, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useAuth } from '../auth';
import { FolderSaveButton } from '../components/FolderSaveButton';
import { api, json } from '../lib/api';

type Revision = { id: string; revision: number; markdown: string; createdAt: string };
type Note = {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  visibility: 'PRIVATE' | 'MEMBERS';
  currentRev: number;
  updatedAt: string;
  revisions: Revision[];
};

function RevisionDiff({ revisions }: { revisions: Revision[] }) {
  const [leftRevision, rightRevision] = revisions.slice(0, 2);
  if (!leftRevision || !rightRevision) return <p className="muted-copy">아직 첫 revision입니다.</p>;
  const before = new Set(rightRevision.markdown.split('\n'));
  return (
    <div className="revision-diff" aria-label="최근 revision 비교">
      <header>
        <span>rev. {rightRevision.revision}</span>
        <span>→</span>
        <span>rev. {leftRevision.revision}</span>
      </header>
      <pre>
        {leftRevision.markdown.split('\n').map((line, index) => (
          <span key={`${index}-${line}`} className={before.has(line) ? 'same' : 'added'}>
            {before.has(line) ? '  ' : '+ '} {line || ' '}
          </span>
        ))}
      </pre>
    </div>
  );
}

export function NotesPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const notes = useQuery({ queryKey: ['notes'], queryFn: () => api<Note[]>('/notes') });
  const [selectedId, setSelectedId] = useState<string>();
  const selected = useMemo(
    () => notes.data?.find((note) => note.id === selectedId),
    [notes.data, selectedId],
  );
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'MEMBERS'>('PRIVATE');
  useEffect(() => {
    setTitle(selected?.title || '');
    setMarkdown(selected?.markdown || '');
    setVisibility(selected?.visibility || 'PRIVATE');
  }, [selected]);
  const save = useMutation({
    mutationFn: () =>
      api<Note>('/notes', {
        method: 'POST',
        body: json({
          id: selected?.userId === user?.id ? selected?.id : undefined,
          title,
          markdown,
          visibility,
        }),
      }),
    onSuccess: async (note) => {
      setSelectedId(note.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['notes'] }),
        client.invalidateQueries({ queryKey: ['collections'] }),
      ]);
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim()) save.mutate();
  };
  const startNew = () => {
    setSelectedId(undefined);
    setTitle('');
    setMarkdown('');
    setVisibility('PRIVATE');
  };

  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <FileClock size={15} /> revision 보존
          </span>
          <h1>개인 노트</h1>
          <p>학습과 지원 과정에서 발견한 내용을 기록하고 필요할 때 팀에 공유하세요.</p>
        </div>
        <button className="primary-button compact" onClick={startNew}>
          <Plus /> 새 노트
        </button>
      </section>
      <div className="notes-layout">
        <aside className="notes-list" aria-label="노트 목록">
          {notes.isLoading && <p>노트를 불러오는 중…</p>}
          {notes.isError && <p className="error-text">노트를 불러오지 못했습니다.</p>}
          {notes.data?.map((note) => (
            <button
              key={note.id}
              className={selectedId === note.id ? 'active' : ''}
              onClick={() => setSelectedId(note.id)}
            >
              <FileText />
              <span>
                <strong>{note.title}</strong>
                <small>
                  rev. {note.currentRev} · {note.visibility === 'MEMBERS' ? '멤버 공개' : '비공개'}
                </small>
              </span>
            </button>
          ))}
          {!notes.isLoading && !notes.data?.length && <p>저장된 노트가 없습니다.</p>}
        </aside>
        <section className="note-editor">
          <form onSubmit={submit}>
            <label>
              제목
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
              />
            </label>
            <label>
              내용 (Markdown)
              <textarea
                value={markdown}
                onChange={(event) => setMarkdown(event.target.value)}
                rows={12}
                maxLength={50_000}
              />
            </label>
            <label>
              공개 범위
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'PRIVATE' | 'MEMBERS')}
              >
                <option value="PRIVATE">나만 보기</option>
                <option value="MEMBERS">멤버 공개</option>
              </select>
            </label>
            {selected && selected.userId !== user?.id && (
              <p className="hint-panel">공유 노트는 새 노트로 복사해 저장됩니다.</p>
            )}
            {save.isError && <div className="form-error">노트를 저장하지 못했습니다.</div>}
            <div className="detail-actions">
              <button className="primary-button compact" disabled={!title.trim() || save.isPending}>
                <Save /> {selected?.userId === user?.id ? '새 revision 저장' : '노트 저장'}
              </button>
              {selected && (
                <FolderSaveButton itemType="NOTE" targetId={selected.id} label={selected.title} />
              )}
            </div>
          </form>
          <article className="note-preview">
            <h2>미리보기</h2>
            <div className="markdown-body">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
            </div>
            {selected && <RevisionDiff revisions={selected.revisions} />}
          </article>
        </section>
      </div>
    </div>
  );
}
