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
};

const languageLabels: Record<string, string> = {
  python: 'Python',
  java: 'Java',
  javascript: 'JavaScript',
  cpp: 'C++',
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
  const [message, setMessage] = useState('');

  const loadProfile = (value: Profile) => {
    setDisplayName(value.displayName);
    setGithubUsername(value.githubUsername || '');
    setAvatarUrl(value.avatarUrl || '');
    setPreferredLanguage(value.preferredLanguage);
  };
  const dirty = Boolean(
    profile.data &&
    (displayName !== profile.data.displayName ||
      githubUsername !== (profile.data.githubUsername || '') ||
      avatarUrl !== (profile.data.avatarUrl || '') ||
      preferredLanguage !== profile.data.preferredLanguage),
  );

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
    if (editing && dirty && displayName.trim()) save.mutate();
  };
  const cancel = () => {
    if (profile.data) loadProfile(profile.data);
    setEditing(false);
    setMessage('');
  };

  return (
    <div className="settings-page">
      <section className="page-heading settings-heading">
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
      {profile.isLoading && <div className="loading-panel">프로필을 불러오는 중…</div>}
      {profile.isError && (
        <div className="error-panel" role="alert">
          프로필을 불러오지 못해 편집을 잠갔습니다.
          <button type="button" onClick={() => void profile.refetch()}>
            다시 시도
          </button>
        </div>
      )}
      <form
        onSubmit={submit}
        aria-busy={profile.isLoading}
        aria-describedby={save.isError ? 'settings-submit-error' : undefined}
      >
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
                  disabled={!profile.data || profile.isError || profile.isLoading}
                  onClick={() => {
                    setMessage('');
                    setEditing(true);
                  }}
                >
                  <Pencil /> 변경
                </button>
              )}
            </header>
            {editing ? (
              <div className="settings-edit-fields">
                <label>
                  이메일
                  <input value={profile.data?.email || ''} disabled />
                  <small>로그인 계정의 이메일은 여기서 변경할 수 없습니다.</small>
                </label>
                <label>
                  표시 이름
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    required
                    aria-invalid={save.isError || undefined}
                    aria-describedby={save.isError ? 'settings-submit-error' : undefined}
                  />
                </label>
                <label>
                  GitHub 사용자명
                  <input
                    value={githubUsername}
                    onChange={(event) => setGithubUsername(event.target.value)}
                    pattern="(?!-)(?!.*--)[a-zA-Z0-9-]{1,39}(?<!-)"
                    placeholder="미등록"
                  />
                </label>
                <label>
                  프로필 이미지 URL
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://"
                  />
                </label>
                <label>
                  선호 코드 언어
                  <select
                    value={preferredLanguage}
                    onChange={(event) => setPreferredLanguage(event.target.value)}
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                  </select>
                </label>
              </div>
            ) : (
              <dl className="settings-profile-summary">
                <div>
                  <dt>이메일</dt>
                  <dd>{profile.data?.email || '—'}</dd>
                </div>
                <div>
                  <dt>표시 이름</dt>
                  <dd>{profile.data?.displayName || '—'}</dd>
                </div>
                <div>
                  <dt>GitHub 사용자명</dt>
                  <dd>{profile.data?.githubUsername || '미등록'}</dd>
                </div>
                <div>
                  <dt>프로필 이미지</dt>
                  <dd>{profile.data?.avatarUrl ? '등록됨' : '미등록'}</dd>
                </div>
                <div>
                  <dt>선호 코드 언어</dt>
                  <dd>{languageLabels[profile.data?.preferredLanguage || ''] || '—'}</dd>
                </div>
              </dl>
            )}
          </section>
          <div className="settings-side-stack">
            <section className="settings-card account-card">
              <header className="settings-card-header">
                <div>
                  <h2>계정</h2>
                  <p>현재 기기에서 CareerGround 사용을 종료합니다.</p>
                </div>
              </header>
              <button type="button" className="account-logout-button" onClick={() => void logout()}>
                <LogOut /> Google 계정에서 로그아웃
              </button>
            </section>
          </div>
        </div>
        {editing && (
          <div className="settings-form-actions">
            <button
              type="submit"
              className="primary-button compact"
              disabled={save.isPending || !dirty}
            >
              <Save /> 변경 저장
            </button>
            <button type="button" className="ghost-button compact" onClick={cancel}>
              <X /> 취소
            </button>
            {save.isError && (
              <div className="form-error" id="settings-submit-error" role="alert">
                설정을 저장하지 못했습니다.
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
