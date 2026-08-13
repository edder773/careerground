import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Pencil, Save, Settings, X } from 'lucide-react';
import { useAuth } from '../auth';
import { api, json } from '../lib/api';

type Profile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  githubUsername?: string | null;
  preferredLanguage: string;
  preference?: {
    commentNotifications: boolean;
    deadlineNotifications: boolean;
    reviewNotifications: boolean;
  } | null;
};

export function SettingsPage() {
  const client = useQueryClient();
  const { logout } = useAuth();
  const profile = useQuery({ queryKey: ['profile'], queryFn: () => api<Profile>('/auth/profile') });
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('python');
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [deadlineNotifications, setDeadlineNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [message, setMessage] = useState('');

  const loadProfile = (value: Profile) => {
    setDisplayName(value.displayName);
    setGithubUsername(value.githubUsername || '');
    setAvatarUrl(value.avatarUrl || '');
    setPreferredLanguage(value.preferredLanguage);
    setCommentNotifications(value.preference?.commentNotifications ?? true);
    setDeadlineNotifications(value.preference?.deadlineNotifications ?? true);
    setReviewNotifications(value.preference?.reviewNotifications ?? true);
  };

  useEffect(() => {
    if (profile.data && !editing) loadProfile(profile.data);
  }, [editing, profile.data]);

  const save = useMutation({
    mutationFn: () =>
      api<Profile>('/auth/profile', {
        method: 'PATCH',
        body: json({
          displayName,
          githubUsername: githubUsername || null,
          avatarUrl: avatarUrl || null,
          preferredLanguage,
          commentNotifications,
          deadlineNotifications,
          reviewNotifications,
        }),
      }),
    onSuccess: async () => {
      setMessage('변경한 설정을 저장했습니다.');
      setEditing(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['profile'] }),
        client.invalidateQueries({ queryKey: ['me'] }),
      ]);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (editing && displayName.trim()) save.mutate();
  };

  const cancel = () => {
    if (profile.data) loadProfile(profile.data);
    setEditing(false);
    setMessage('');
  };

  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Settings size={15} /> 내 계정
          </span>
          <h1>설정</h1>
          <p>현재 프로필을 확인하고 필요할 때 변경하세요.</p>
        </div>
      </section>
      {message && (
        <div className="success-panel" role="status">
          {message}
        </div>
      )}
      <form onSubmit={submit}>
        <div className="settings-grid">
          <section className={`settings-card ${editing ? 'is-editing' : ''}`}>
            <header className="settings-card-header">
              <div>
                <h2>프로필</h2>
                <p>{editing ? '변경할 내용을 입력하세요.' : '저장된 프로필 정보입니다.'}</p>
              </div>
              {!editing && (
                <button
                  type="button"
                  className="outline-button compact"
                  onClick={() => {
                    setMessage('');
                    setEditing(true);
                  }}
                >
                  <Pencil /> 변경
                </button>
              )}
            </header>
            <label>
              이메일
              <input value={profile.data?.email || ''} disabled />
            </label>
            <label>
              표시 이름
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                disabled={!editing}
              />
            </label>
            <label>
              GitHub 사용자명
              <input
                value={githubUsername}
                onChange={(event) => setGithubUsername(event.target.value)}
                pattern="[a-zA-Z0-9-]{1,39}"
                disabled={!editing}
              />
            </label>
            <label>
              프로필 이미지 URL
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                disabled={!editing}
              />
            </label>
            <label>
              선호 코드 언어
              <select
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                disabled={!editing}
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
              </select>
            </label>
            {editing && (
              <div className="settings-actions">
                <button type="submit" className="primary-button compact" disabled={save.isPending}>
                  <Save /> 변경 저장
                </button>
                <button type="button" className="ghost-button compact" onClick={cancel}>
                  <X /> 취소
                </button>
              </div>
            )}
            {save.isError && <div className="form-error">설정을 저장하지 못했습니다.</div>}
          </section>
          <section className={`settings-card ${editing ? 'is-editing' : ''}`}>
            <header className="settings-card-header">
              <div>
                <h2>인앱 알림</h2>
                <p>코딩 랭킹은 모든 멤버의 풀이 기록으로 자동 집계됩니다.</p>
              </div>
            </header>
            <label className="check-label">
              <input
                type="checkbox"
                checked={commentNotifications}
                onChange={(event) => setCommentNotifications(event.target.checked)}
                disabled={!editing}
              />
              댓글과 답글
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={deadlineNotifications}
                onChange={(event) => setDeadlineNotifications(event.target.checked)}
                disabled={!editing}
              />
              관심 공고 마감
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={reviewNotifications}
                onChange={(event) => setReviewNotifications(event.target.checked)}
                disabled={!editing}
              />
              학습 복습 예정
            </label>
            <div className="admin-divider" />
            <h2>계정</h2>
            <button type="button" className="ghost-button" onClick={() => void logout()}>
              <LogOut /> OpenAI 계정에서 로그아웃
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
