import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FolderKanban, ShieldCheck, Sparkles } from 'lucide-react';
import { brand } from '@careerground/config';
import { api, json, type User } from '../lib/api';

const googleClientId = '790295034558-q9a41jpu912age0eo0dpdu5pcdh1ipo5.apps.googleusercontent.com';
let googleScript: Promise<void> | null = null;

const loadGoogleIdentity = () => {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScript) return googleScript;
  googleScript = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    const script = existing || document.createElement('script');
    const loaded = () =>
      window.google?.accounts.id ? resolve() : reject(new Error('GIS_MISSING'));
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', () => reject(new Error('GIS_LOAD_FAILED')), { once: true });
    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      document.head.append(script);
    }
  }).catch((error) => {
    googleScript = null;
    throw error;
  });
  return googleScript;
};

export function LoginPage() {
  const client = useQueryClient();
  const buttonHost = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'submitting' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const authenticate = useCallback(
    async (response: GoogleCredentialResponse) => {
      setState('submitting');
      setMessage('Google 계정을 확인하는 중입니다.');
      try {
        const result = await api<{ user: User }>('/auth/google', {
          method: 'POST',
          body: json({ credential: response.credential }),
        });
        client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' });
        client.setQueryData(['me'], result);
      } catch {
        setState('error');
        setMessage('Google 로그인을 완료하지 못했습니다. 다시 시도해주세요.');
      }
    },
    [client],
  );

  useEffect(() => {
    let active = true;
    void loadGoogleIdentity()
      .then(() => {
        if (!active || !buttonHost.current || !window.google) return;
        buttonHost.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => void authenticate(response),
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(buttonHost.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 300,
          locale: 'ko',
        });
        setState('ready');
        setMessage('');
      })
      .catch(() => {
        if (!active) return;
        setState('error');
        setMessage('Google 로그인 도구를 불러오지 못했습니다. 네트워크를 확인해주세요.');
      });
    return () => {
      active = false;
      buttonHost.current?.replaceChildren();
    };
  }, [authenticate]);

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
          <p>학습자료, 신입 채용공고와 추천 코딩 문제를 정돈하는 개인 성장 작업대입니다.</p>
        </div>
        <div className="story-grid">
          <span>학습과 복습</span>
          <span>신입 IT 공고</span>
          <span>문제 즐겨찾기</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="google-login-card">
          <div className="google-login-mark" aria-hidden="true">
            <ShieldCheck />
          </div>
          <span className="eyebrow">CAREERGROUND WORKSPACE</span>
          <h2>Google 계정으로 시작하기</h2>
          <p>로그인한 멤버만 채용공고, 학습자료, 코딩문제와 개인 작업대를 볼 수 있습니다.</p>
          <div
            ref={buttonHost}
            className="google-button-slot"
            aria-busy={state === 'loading' || state === 'submitting'}
          />
          {state === 'loading' && <div className="google-login-skeleton">로그인 준비 중…</div>}
          {message && (
            <div
              className={state === 'error' ? 'google-login-error' : 'google-login-status'}
              role="status"
            >
              {message}
            </div>
          )}
          <small>최초 로그인 후 Google 이름을 확인하거나 수정해 가입을 완료합니다.</small>
        </div>
      </section>
    </main>
  );
}
