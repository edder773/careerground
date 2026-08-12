import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpenText, Bot, ExternalLink, FileText, Search, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import './styles.css';

const modules = import.meta.glob('../../../docs/{troubleshooting,blog}/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
type Post = {
  slug: string;
  type: 'troubleshooting' | 'blog';
  title: string;
  date: string;
  tags: string[];
  pr?: string;
  generatedByAI: boolean;
  body: string;
};

function parse(path: string, raw: string): Post {
  const [, front = '', body = raw] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];
  const values = Object.fromEntries(
    front.split('\n').map((line) => {
      const index = line.indexOf(':');
      return index > 0
        ? [
            line.slice(0, index).trim(),
            line
              .slice(index + 1)
              .trim()
              .replace(/^['"]|['"]$/g, ''),
          ]
        : ['', ''];
    }),
  );
  const title =
    values.title || body.match(/^#\s+(.+)$/m)?.[1] || path.split('/').pop()!.replace('.md', '');
  return {
    slug: path,
    type: path.includes('/blog/') ? 'blog' : 'troubleshooting',
    title,
    date: values.date || '',
    tags: (values.tags || '')
      .replaceAll('[', '')
      .replaceAll(']', '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
    pr: values.pr,
    generatedByAI: values.generatedByAI === 'true',
    body,
  };
}
const posts = Object.entries(modules)
  .map(([path, raw]) => parse(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date));

function App() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | Post['type']>('all');
  const [selected, setSelected] = useState<Post>();
  const filtered = useMemo(
    () =>
      posts.filter(
        (post) =>
          (type === 'all' || post.type === type) &&
          `${post.title} ${post.tags.join(' ')} ${post.body}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, type],
  );
  return (
    <div className="docs-app">
      <header>
        <a href="/" className="docs-brand">
          <span>
            <BookOpenText />
          </span>
          <div>
            <strong>CareerGround</strong>
            <small>Engineering Notes</small>
          </div>
        </a>
        <nav>
          <button className={type === 'all' ? 'active' : ''} onClick={() => setType('all')}>
            전체
          </button>
          <button
            className={type === 'troubleshooting' ? 'active' : ''}
            onClick={() => setType('troubleshooting')}
          >
            기술 문서
          </button>
          <button className={type === 'blog' ? 'active' : ''} onClick={() => setType('blog')}>
            블로그
          </button>
        </nav>
      </header>
      <main>
        <section className="docs-hero">
          <span>
            <Bot /> evidence-first documentation
          </span>
          <h1>
            문제를 근거로 남기고
            <br />
            배움을 공유합니다.
          </h1>
          <p>
            CareerGround의 문제 해결 과정, 회귀 테스트, 공개 가능한 학습 노트를 탐색하세요. AI 생성
            문서는 evidence manifest 밖의 사실을 주장하지 않습니다.
          </p>
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 태그, 내용 검색"
            />
          </label>
        </section>
        <section className="docs-grid">
          <aside>
            <strong>카테고리</strong>
            <button onClick={() => setType('troubleshooting')}>
              <FileText />
              트러블슈팅 <span>{posts.filter((x) => x.type === 'troubleshooting').length}</span>
            </button>
            <button onClick={() => setType('blog')}>
              <BookOpenText />
              학습 블로그 <span>{posts.filter((x) => x.type === 'blog').length}</span>
            </button>
            <div className="ai-note">
              <Bot />
              <p>AI 생성 문서는 상단에 명확히 표시됩니다.</p>
            </div>
          </aside>
          <div className="post-list">
            {!filtered.length && <div className="empty">조건에 맞는 문서가 없습니다.</div>}
            {filtered.map((post) => (
              <article key={post.slug} onClick={() => setSelected(post)}>
                <div className="post-meta">
                  <span>{post.type === 'blog' ? 'BLOG' : 'TROUBLESHOOTING'}</span>
                  {post.generatedByAI && <span className="ai">AI GENERATED</span>}
                  <time>{post.date}</time>
                </div>
                <h2>{post.title}</h2>
                <p>{post.body.replace(/[#*`>-]/g, '').slice(0, 180)}…</p>
                <div>
                  {post.tags.map((tag) => (
                    <span key={tag}>
                      <Tag />
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        CareerGround Engineering Notes · 공개 문서는 사용자 코드, 업로드 원문, 이메일, 내부 URL을
        포함하지 않습니다.
      </footer>
      {selected && (
        <div className="reader-overlay" onClick={() => setSelected(undefined)}>
          <article className="reader" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelected(undefined)}>닫기</button>
            <div className="post-meta">
              <span>{selected.type}</span>
              {selected.generatedByAI && <span className="ai">AI GENERATED</span>}
            </div>
            <h1>{selected.title}</h1>
            {selected.pr && (
              <a href={selected.pr} target="_blank" rel="noreferrer">
                관련 PR <ExternalLink />
              </a>
            )}
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{selected.body}</ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
