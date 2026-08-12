import { useState, type FormEvent } from 'react';
import { FolderKanban, LockKeyhole, Sparkles } from 'lucide-react';
import { brand } from '@careerground/config';
import { useAuth } from '../auth';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('member@careerground.local');
  const [password, setPassword] = useState('Demo-password-123!');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await login({ email, password });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '로그인하지 못했습니다.');
    } finally {
      setPending(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <FolderKanban /> {brand.name}
        </div>
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> 오늘의 성장을 한곳에
          </span>
          <h1>
            배우고, 지원하고,
            <br />
            함께 해결하세요.
          </h1>
          <p>
            작은 팀의 학습자료, 신입 채용공고, 코딩 풀이를 폴더처럼 정돈하는 개인 성장 작업대입니다.
          </p>
        </div>
        <div className="story-grid">
          <span>학습과 복습</span>
          <span>신입 IT 공고</span>
          <span>공유 풀이</span>
        </div>
      </section>
      <section className="login-panel">
        <form onSubmit={(event) => void submit(event)}>
          <div className="login-icon">
            <LockKeyhole />
          </div>
          <h2>팀 워크스페이스 로그인</h2>
          <p>관리자가 초대한 계정만 사용할 수 있습니다.</p>
          <label>
            이메일
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? '확인 중…' : '로그인'}
          </button>
          <small>개발 seed: member@careerground.local / Demo-password-123!</small>
        </form>
      </section>
    </main>
  );
}
