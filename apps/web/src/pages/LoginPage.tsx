import { FolderKanban, Sparkles } from 'lucide-react';
import { brand } from '@careerground/config';

export function LoginPage() {
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
        <div className="openai-login-card">
          <div className="openai-mark" aria-hidden="true">
            <Sparkles />
          </div>
          <span className="eyebrow">CAREERGROUND WORKSPACE</span>
          <h2>OpenAI 계정으로 시작하기</h2>
          <p>OpenAI 계정으로 안전하게 로그인하고 개인 작업대를 이어서 사용하세요.</p>
          <a className="openai-button" href="/signin-with-chatgpt?return_to=%2F">
            <span className="openai-button-mark" aria-hidden="true">
              O
            </span>
            OpenAI 계정으로 계속
          </a>
          <small>로그인은 OpenAI 계정 한 가지 방식만 사용합니다.</small>
        </div>
      </section>
    </main>
  );
}
