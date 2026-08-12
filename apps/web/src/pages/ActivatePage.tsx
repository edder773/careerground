import { useState, type FormEvent } from 'react';
import { FolderKanban, KeyRound } from 'lucide-react';
import { brand } from '@careerground/config';
import { useAuth } from '../auth';

export function ActivatePage() {
  const { activate } = useAuth();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return setError('초대 링크에 token이 없습니다. 관리자에게 새 링크를 요청하세요.');
    if (password !== confirm) return setError('비밀번호 확인이 일치하지 않습니다.');
    setPending(true);
    setError('');
    try {
      await activate({ token, displayName, password });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '계정을 활성화하지 못했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="activation-page">
      <form onSubmit={(event) => void submit(event)}>
        <div className="activation-brand">
          <FolderKanban /> <span>{brand.name}</span>
        </div>
        <div className="login-icon">
          <KeyRound />
        </div>
        <h1>초대 계정 활성화</h1>
        <p>표시 이름과 12자 이상의 비밀번호를 정하면 바로 개인 작업대를 시작합니다.</p>
        <label>
          표시 이름
          <input
            autoFocus
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          새 비밀번호
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            required
          />
        </label>
        <label>
          비밀번호 확인
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            minLength={12}
            required
          />
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button className="primary-button" disabled={pending}>
          {pending ? '활성화 중…' : '계정 활성화'}
        </button>
      </form>
    </main>
  );
}
