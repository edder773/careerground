import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Code2, FolderKanban } from 'lucide-react';
import { api, json } from '../lib/api';

const languages = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
] as const;

export function OnboardingPage({ initialDisplayName = '' }: { initialDisplayName?: string }) {
  const client = useQueryClient();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [preferredLanguage, setPreferredLanguage] = useState('python');
  const complete = useMutation({
    mutationFn: () =>
      api('/auth/onboarding', {
        method: 'POST',
        body: json({ displayName, preferredLanguage }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['me'] }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (displayName.trim().length >= 2) complete.mutate();
  };

  return (
    <main className="onboarding-page">
      <section className="onboarding-window">
        <div className="onboarding-brand">
          <span className="brand-mark" aria-hidden="true">
            <FolderKanban />
          </span>
          <div>
            <strong>CareerGround</strong>
            <span>내 작업대를 준비해볼까요?</span>
          </div>
        </div>
        <form
          onSubmit={submit}
          aria-describedby={complete.isError ? 'onboarding-submit-error' : undefined}
        >
          <span className="onboarding-step">첫 설정</span>
          <h1>어떻게 불러드릴까요?</h1>
          <p>Google 이름을 확인하고, CareerGround에서 사용할 이름을 정해주세요.</p>
          <label className="onboarding-name">
            이름
            <input
              autoFocus
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={2}
              maxLength={80}
              placeholder="예: 김그라운드"
              autoComplete="name"
              required
              aria-invalid={complete.isError || undefined}
              aria-describedby={complete.isError ? 'onboarding-submit-error' : undefined}
            />
          </label>
          <fieldset>
            <legend>
              <Code2 /> 주로 사용하는 언어
            </legend>
            <div className="language-choice-grid">
              {languages.map((language) => (
                <label key={language.value}>
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value={language.value}
                    checked={preferredLanguage === language.value}
                    onChange={(event) => setPreferredLanguage(event.target.value)}
                  />
                  <span>{language.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {complete.isError && (
            <div className="form-error" id="onboarding-submit-error" role="alert">
              첫 설정을 저장하지 못했습니다. 다시 시도해주세요.
            </div>
          )}
          <button
            className="primary-button onboarding-submit"
            disabled={displayName.trim().length < 2 || complete.isPending}
          >
            {complete.isPending ? '작업대 준비 중…' : '내 작업대 시작하기'} <ArrowRight />
          </button>
        </form>
      </section>
    </main>
  );
}
