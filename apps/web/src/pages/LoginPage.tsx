import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Sparkles } from 'lucide-react';
import { brand } from '@careerground/config';
import { api, apiBaseUrl } from '../lib/api';

type SlackConfig = { provider: 'slack'; configured: boolean };

export function LoginPage() {
  const config = useQuery({
    queryKey: ['slack-config'],
    queryFn: () => api<SlackConfig>('/auth/slack/config'),
    retry: false,
  });
  const authError = new URLSearchParams(window.location.search).get('auth_error');
  const configured = config.data?.configured === true;
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
          <p>학습자료, 신입 채용공고, 코딩 풀이를 폴더처럼 정돈하는 개인 성장 작업대입니다.</p>
        </div>
        <div className="story-grid">
          <span>학습과 복습</span>
          <span>신입 IT 공고</span>
          <span>공유 풀이</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="slack-login-card">
          <div className="slack-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="eyebrow">CAREERGROUND WORKSPACE</span>
          <h2>Slack으로 시작하기</h2>
          <p>Slack 프로필로 안전하게 로그인하고 개인 작업대를 이어서 사용하세요.</p>
          {authError && (
            <div className="form-error" role="alert">
              {authError}
            </div>
          )}
          <a
            className={`slack-button${configured ? '' : ' disabled'}`}
            href={configured ? `${apiBaseUrl}/auth/slack/start` : undefined}
            aria-disabled={!configured}
          >
            <span className="slack-button-mark" aria-hidden="true">
              ✦
            </span>
            Slack으로 계속
          </a>
          {config.isLoading ? (
            <small>Slack 연결 상태를 확인하는 중…</small>
          ) : configured ? (
            <small>로그인은 Slack OpenID Connect 한 가지 방식만 사용합니다.</small>
          ) : (
            <small>운영자가 Slack App 연결 정보를 설정하면 로그인이 활성화됩니다.</small>
          )}
        </div>
      </section>
    </main>
  );
}
