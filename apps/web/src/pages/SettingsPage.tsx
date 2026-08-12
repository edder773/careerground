import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, LogOut, Save, Settings, Trash2 } from 'lucide-react';
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
  dataDeletionRequested?: string | null;
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
  const exportData = useMutation({
    mutationFn: () => api<Record<string, unknown>>('/auth/export'),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `careerground-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });
  const deleteRequest = useMutation({
    mutationFn: () => api('/auth/delete-request', { method: 'POST' }),
    onSuccess: async () => {
      setMessage('데이터 삭제 요청을 접수했습니다. 관리자가 확인한 뒤 처리합니다.');
      await client.invalidateQueries({ queryKey: ['profile'] });
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
      <div className="settings-grid">
        <form className="settings-card" onSubmit={submit}>
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
              pattern="[a-zA-Z0-9-]{1,39}"
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
          <button className="primary-button compact" disabled={save.isPending}>
            <Save /> 설정 저장
          </button>
          {save.isError && <div className="form-error">설정을 저장하지 못했습니다.</div>}
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
          <h2>개인정보와 계정</h2>
          <button className="ghost-button" onClick={() => exportData.mutate()}>
            <Download /> 내 데이터 JSON 내보내기
          </button>
          <button className="ghost-button" onClick={() => void logout()}>
            <LogOut /> OpenAI 계정에서 로그아웃
          </button>
          <button
            className="ghost-button danger"
            disabled={Boolean(profile.data?.dataDeletionRequested)}
            onClick={() => {
              if (window.confirm('내 데이터 삭제 요청을 접수할까요?')) deleteRequest.mutate();
            }}
          >
            <Trash2 />
            {profile.data?.dataDeletionRequested ? '삭제 요청 접수됨' : '데이터 삭제 요청'}
          </button>
        </div>
      </div>
    </div>
  );
}
