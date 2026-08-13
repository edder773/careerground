import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import {
  Clock3,
  Code2,
  Eye,
  FileText,
  Heading1,
  Link2,
  ListChecks,
  PenLine,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { FolderSaveButton } from '../components/FolderSaveButton';
import { api, json } from '../lib/api';

type Revision = { id: string; revision: number; markdown: string; createdAt: string };
type Note = {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  currentRev: number;
  updatedAt: string;
  revisions: Revision[];
};

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value));

function RevisionDiff({ revisions }: { revisions: Revision[] }) {
  const [latest, previous] = revisions.slice(0, 2);
  if (!latest || !previous)
    return <p className="muted-copy">수정 이력이 쌓이면 변경점을 볼 수 있어요.</p>;
  const before = new Set(previous.markdown.split('\n'));
  return (
    <div className="revision-diff" aria-label="최근 수정 비교">
      <header>
        <span>버전 {previous.revision}</span>
        <span>→</span>
        <span>버전 {latest.revision}</span>
      </header>
      <pre>
        {latest.markdown.split('\n').map((line, index) => (
          <span key={`${index}-${line}`} className={before.has(line) ? 'same' : 'added'}>
            {before.has(line) ? '  ' : '+ '} {line || ' '}
          </span>
        ))}
      </pre>
    </div>
  );
}

export function NotesPage() {
  const client = useQueryClient();
  const [searchParams] = useSearchParams();
  const editor = useRef<HTMLTextAreaElement>(null);
  const notes = useQuery({ queryKey: ['notes'], queryFn: () => api<Note[]>('/notes') });
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [mobileView, setMobileView] = useState<'write' | 'preview'>('write');
  const selected = useMemo(
    () => notes.data?.find((note) => note.id === selectedId),
    [notes.data, selectedId],
  );
  const dirty = creating
    ? Boolean(title || markdown)
    : Boolean(selected && (title !== selected.title || markdown !== selected.markdown));
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return notes.data || [];
    return (notes.data || []).filter((note) =>
      `${note.title} ${note.markdown}`.toLowerCase().includes(keyword),
    );
  }, [notes.data, query]);

  useEffect(() => {
    if (!notes.data?.length || selectedId || creating) return;
    const requested = searchParams.get('note');
    setSelectedId(
      notes.data.some((note) => note.id === requested) ? requested! : notes.data[0]?.id,
    );
  }, [notes.data, selectedId, creating, searchParams]);
  useEffect(() => {
    if (!selected || creating) return;
    setTitle(selected.title);
    setMarkdown(selected.markdown);
  }, [selected, creating]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: () =>
      api<Note>('/notes', {
        method: 'POST',
        body: json({
          id: creating ? undefined : selected?.id,
          baseRevision: creating ? undefined : selected?.currentRev,
          title,
          markdown,
        }),
      }),
    onSuccess: async (note) => {
      setCreating(false);
      setSelectedId(note.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['notes'] }),
        client.invalidateQueries({ queryKey: ['collections'] }),
      ]);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/notes/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setSelectedId(undefined);
      setTitle('');
      setMarkdown('');
      await client.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const startNew = () => {
    setCreating(true);
    setSelectedId(undefined);
    setTitle('');
    setMarkdown('');
    setMobileView('write');
  };
  const selectNote = (id: string) => {
    setCreating(false);
    setSelectedId(id);
    setMobileView('write');
  };
  const insert = (before: string, after = '') => {
    const field = editor.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const next = `${markdown.slice(0, start)}${before}${markdown.slice(start, end)}${after}${markdown.slice(end)}`;
    setMarkdown(next);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + before.length, end + before.length);
    });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim()) save.mutate();
  };
  const hasEditor = creating || Boolean(selected);

  return (
    <div className="notes-page">
      <section className="notes-topbar">
        <div>
          <span className="eyebrow">
            <PenLine size={15} /> 나만의 기록
          </span>
          <h1>개인 노트</h1>
          <p>떠오른 내용을 바로 적고, 필요한 자료를 한곳에 정리하세요.</p>
        </div>
        <button className="primary-button compact" onClick={startNew}>
          <Plus /> 새 노트
        </button>
      </section>

      <div className="notes-workbench">
        <aside className="notes-sidebar" aria-label="노트 목록">
          <label className="notes-search">
            <Search />
            <span className="sr-only">노트 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="노트 검색"
            />
          </label>
          <div className="notes-list-heading">
            <strong>내 노트</strong>
            <span>{filtered.length}</span>
          </div>
          <div className="notes-list">
            {notes.isLoading && <p>노트를 불러오는 중…</p>}
            {notes.isError && <p className="error-text">노트를 불러오지 못했습니다.</p>}
            {filtered.map((note) => (
              <button
                key={note.id}
                className={!creating && selectedId === note.id ? 'active' : ''}
                onClick={() => selectNote(note.id)}
              >
                <span className="note-list-icon">
                  <FileText />
                </span>
                <span>
                  <strong>{note.title}</strong>
                  <small>{note.markdown.trim().split('\n')[0] || '내용 없음'}</small>
                  <time dateTime={note.updatedAt}>{dateLabel(note.updatedAt)}</time>
                </span>
              </button>
            ))}
            {!notes.isLoading && !filtered.length && (
              <div className="notes-list-empty">
                <FileText />
                <span>{query ? '검색 결과가 없습니다.' : '첫 노트를 만들어보세요.'}</span>
              </div>
            )}
          </div>
        </aside>

        {hasEditor ? (
          <form className="note-workspace" onSubmit={submit}>
            <header className="note-workspace-header">
              <div>
                <span>{creating ? '새 노트' : `버전 ${selected?.currentRev || 1}`}</span>
                <strong role="status">{dirty ? '저장되지 않은 변경' : '모든 변경 저장됨'}</strong>
                {!creating && selected && (
                  <time dateTime={selected.updatedAt}>{dateLabel(selected.updatedAt)} 수정</time>
                )}
              </div>
              <div className="note-header-actions">
                {!creating && selected && (
                  <>
                    <FolderSaveButton
                      itemType="NOTE"
                      targetId={selected.id}
                      label={selected.title}
                    />
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="노트 삭제"
                      onClick={() => {
                        if (window.confirm(`“${selected.title}” 노트를 삭제할까요?`)) {
                          remove.mutate(selected.id);
                        }
                      }}
                    >
                      <Trash2 />
                    </button>
                  </>
                )}
                <button
                  className="primary-button compact"
                  disabled={!title.trim() || save.isPending}
                >
                  <Save /> {save.isPending ? '저장 중…' : '저장'}
                </button>
              </div>
            </header>
            <input
              className="note-title-input"
              aria-label="노트 제목"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목 없는 노트"
              maxLength={200}
              required
            />
            <div className="note-format-toolbar" aria-label="Markdown 서식">
              <button type="button" onClick={() => insert('# ')} aria-label="제목 서식">
                <Heading1 />
              </button>
              <button type="button" onClick={() => insert('- [ ] ')} aria-label="체크 목록">
                <ListChecks />
              </button>
              <button type="button" onClick={() => insert('[', '](https://)')} aria-label="링크">
                <Link2 />
              </button>
              <button type="button" onClick={() => insert('```\n', '\n```')} aria-label="코드 블록">
                <Code2 />
              </button>
              <span>{markdown.length.toLocaleString()}자</span>
            </div>
            <div className="notes-view-tabs" aria-label="노트 보기 방식">
              <button
                type="button"
                className={mobileView === 'write' ? 'active' : ''}
                onClick={() => setMobileView('write')}
              >
                <PenLine /> 작성
              </button>
              <button
                type="button"
                className={mobileView === 'preview' ? 'active' : ''}
                onClick={() => setMobileView('preview')}
              >
                <Eye /> 미리보기
              </button>
            </div>
            <div className="note-writing-grid" data-mobile-view={mobileView}>
              <label className="note-writing-pane">
                <span className="sr-only">노트 내용</span>
                <textarea
                  ref={editor}
                  value={markdown}
                  onChange={(event) => setMarkdown(event.target.value)}
                  placeholder={
                    '오늘 배운 것, 지원 준비, 해결한 문제를 자유롭게 기록하세요.\n\nMarkdown 문법을 사용할 수 있습니다.'
                  }
                  maxLength={50_000}
                />
              </label>
              <article className="note-preview-pane">
                <header>
                  <Eye /> 미리보기
                </header>
                <div className="markdown-body">
                  {markdown ? (
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
                  ) : (
                    <p className="note-preview-empty">작성한 내용이 여기에 표시됩니다.</p>
                  )}
                </div>
                {!creating && selected && (
                  <details className="note-history">
                    <summary>
                      <Clock3 /> 최근 변경 보기
                    </summary>
                    <RevisionDiff revisions={selected.revisions} />
                  </details>
                )}
              </article>
            </div>
            {save.isError && <div className="form-error">노트를 저장하지 못했습니다.</div>}
          </form>
        ) : (
          <section className="note-welcome">
            <span>
              <PenLine />
            </span>
            <h2>기록을 시작해보세요</h2>
            <p>왼쪽에서 노트를 선택하거나 새 노트를 만드세요.</p>
            <button className="primary-button compact" onClick={startNew}>
              <Plus /> 새 노트
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
