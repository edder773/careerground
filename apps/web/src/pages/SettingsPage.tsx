import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Save, Settings } from 'lucide-react';
import { useAuth } from '../auth';
import { api, json } from '../lib/api';

type Profile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  githubUsername?: string | null;
  preferredLanguage: string;
  rankingOptIn: boolean;
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
  const [displayName, setDisplayName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('python');
  const [rankingOptIn, setRankingOptIn] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [deadlineNotifications, setDeadlineNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [message, setMessage] = useState('');
  const dirty = Boolean(
    profile.data &&
    (displayName !== profile.data.displayName ||
      githubUsername !== (profile.data.githubUsername || '') ||
      avatarUrl !== (profile.data.avatarUrl || '') ||
      preferredLanguage !== profile.data.preferredLanguage ||
      rankingOptIn !== profile.data.rankingOptIn ||
      commentNotifications !== (profile.data.preference?.commentNotifications ?? true) ||
      deadlineNotifications !== (profile.data.preference?.deadlineNotifications ?? true) ||
      reviewNotifications !== (profile.data.preference?.reviewNotifications ?? true)),
  );
  useEffect(() => {
    if (!profile.data) return;
    setDisplayName(profile.data.displayName);
    setGithubUsername(profile.data.githubUsername || '');
    setAvatarUrl(profile.data.avatarUrl || '');
    setPreferredLanguage(profile.data.preferredLanguage);
    setRankingOptIn(profile.data.rankingOptIn);
    setCommentNotifications(profile.data.preference?.commentNotifications ?? true);
    setDeadlineNotifications(profile.data.preference?.deadlineNotifications ?? true);
    setReviewNotifications(profile.data.preference?.reviewNotifications ?? true);
  }, [profile.data]);
  const save = useMutation({
    mutationFn: () =>
      api<Profile>('/auth/profile', {
        method: 'PATCH',
        body: json({
          displayName,
          githubUsername: githubUsername || null,
          avatarUrl: avatarUrl || null,
          preferredLanguage,
          rankingOptIn,
          commentNotifications,
          deadlineNotifications,
          reviewNotifications,
        }),
      }),
    onSuccess: async () => {
      setMessage('설정을 저장했습니다.');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['profile'] }),
        client.invalidateQueries({ queryKey: ['me'] }),
      ]);
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (displayName.trim()) save.mutate();
  };

  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Settings size={15} /> 내 계정
          </span>
          <h1>설정</h1>
          <p>프로필, 랭킹 참여, 인앱 알림과 개인정보 요청을 관리합니다.</p>
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
      <div className="settings-grid">
        <form className="settings-card" onSubmit={submit} aria-busy={profile.isLoading}>
          <fieldset disabled={!profile.data || profile.isError || profile.isLoading}>
            <h2>프로필과 기본값</h2>
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
              />
            </label>
            <label>
              GitHub 사용자명
              <input
                value={githubUsername}
                onChange={(event) => setGithubUsername(event.target.value)}
                pattern="(?!-)(?!.*--)[a-zA-Z0-9-]{1,39}(?<!-)"
              />
            </label>
            <label>
              프로필 이미지 URL
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
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
            <label className="check-label">
              <input
                type="checkbox"
                checked={rankingOptIn}
                onChange={(event) => setRankingOptIn(event.target.checked)}
              />
              코딩 랭킹에 참여
            </label>
            <button className="primary-button compact" disabled={save.isPending || !dirty}>
              <Save /> 설정 저장
            </button>
            {save.isError && <div className="form-error">설정을 저장하지 못했습니다.</div>}
          </fieldset>
        </form>
        <div className="settings-card">
          <h2>인앱 알림</h2>
          <label className="check-label">
            <input
              type="checkbox"
              checked={commentNotifications}
              onChange={(event) => setCommentNotifications(event.target.checked)}
            />
            댓글과 답글
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={deadlineNotifications}
              onChange={(event) => setDeadlineNotifications(event.target.checked)}
            />
            관심 공고 마감
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={reviewNotifications}
              onChange={(event) => setReviewNotifications(event.target.checked)}
            />
            학습 복습 예정
          </label>
          <p>변경한 알림 설정은 왼쪽의 “설정 저장” 버튼으로 함께 저장됩니다.</p>
          <div className="admin-divider" />
          <h2>계정</h2>
          <button className="ghost-button" onClick={() => void logout()}>
            <LogOut /> OpenAI 계정에서 로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
