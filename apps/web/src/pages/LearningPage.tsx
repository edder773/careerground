import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Layers3,
  MessageCircleQuestion,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { api, json } from '../lib/api';

type Unit = {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  flashcards: Array<{ id: string; front: string; back: string }>;
  questions: Array<{ id: string; prompt: string; answer: string; choices?: string[] }>;
  progress: Array<{ completed: boolean; understanding: number; nextReviewAt: string }>;
};
type Source = { id: string; title: string; subject: string; category: string; units: Unit[] };

function summaryPreview(markdown: string) {
  const paragraphs = markdown
    .replace(/```[\s\S]*?```/g, '')
    .split('\n')
    .map((line) =>
      line
        .replace(/^#+\s*/, '')
        .replace(/[*_>`]/g, '')
        .trim(),
    )
    .filter((line) => line && !['이 단원의 목표', '핵심 개념'].includes(line));
  return paragraphs[0] || '핵심 개념과 실무 예시를 단계별로 학습합니다.';
}

function LearningUnitModal({
  unit,
  index,
  onClose,
  onReview,
  reviewing,
}: {
  unit: Unit;
  index: number;
  onClose: () => void;
  onReview: (rating: number) => void;
  reviewing: boolean;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="learning-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="learning-unit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="learning-unit-title"
      >
        <header>
          <div>
            <span>MODULE {String(index + 1).padStart(2, '0')}</span>
            <h2 id="learning-unit-title">{unit.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" autoFocus>
            <X />
          </button>
        </header>
        <div className="learning-modal-content">
          <div className="learning-concept-map" aria-label="핵심 개념">
            {unit.concepts.map((concept) => (
              <span key={concept}>{concept}</span>
            ))}
          </div>
          <article className="learning-markdown">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{unit.summary}</ReactMarkdown>
          </article>
          <section className="learning-recall-section">
            <div className="learning-section-title">
              <Sparkles />
              <div>
                <span>기억 꺼내기</span>
                <h3>플래시카드</h3>
              </div>
            </div>
            <div className="learning-flashcards">
              {unit.flashcards.map((card) => (
                <details key={card.id}>
                  <summary>{card.front}</summary>
                  <p>{card.back}</p>
                </details>
              ))}
            </div>
          </section>
          <section className="learning-recall-section">
            <div className="learning-section-title">
              <MessageCircleQuestion />
              <div>
                <span>이해 확인</span>
                <h3>복습 문제</h3>
              </div>
            </div>
            <div className="learning-questions">
              {unit.questions.map((question) => (
                <details key={question.id}>
                  <summary>{question.prompt}</summary>
                  {question.choices && question.choices.length > 0 && (
                    <ul>
                      {question.choices.map((choice) => (
                        <li key={choice}>{choice}</li>
                      ))}
                    </ul>
                  )}
                  <p>
                    <strong>정답</strong> {question.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
        <footer>
          <span>이 단원을 얼마나 이해했나요?</span>
          <div className="rating-buttons" aria-label={`${unit.title} 이해도 기록`}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                type="button"
                key={rating}
                disabled={reviewing}
                onClick={() => onReview(rating)}
                aria-label={`${unit.title} 이해도 ${rating}점`}
              >
                {rating}
              </button>
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
}

export function LearningPage() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<{ unit: Unit; index: number }>();
  const learning = useQuery({
    queryKey: ['learning'],
    queryFn: () => api<Source[]>('/learning'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const due = useQuery({
    queryKey: ['learning-due'],
    queryFn: () => api<unknown[]>('/learning/due'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const review = useMutation({
    mutationFn: ({ unitId, rating }: { unitId: string; rating: number }) =>
      api('/learning/review', { method: 'POST', body: json({ unitId, rating }) }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['learning'] }),
        client.invalidateQueries({ queryKey: ['learning-due'] }),
      ]);
    },
  });

  return (
    <div className="learning-page">
      <section className="page-heading learning-heading">
        <div>
          <span className="eyebrow">
            <Brain size={15} /> 이해 중심의 생성형 AI 학습
          </span>
          <h1>학습 라이브러리</h1>
          <p>개념을 짧게 익히고, 예시·플래시카드·복습 문제로 바로 확인하세요.</p>
        </div>
        <div className="heading-stat">
          <Clock3 />
          <span>복습 예정</span>
          <strong>{due.data?.length ?? '—'}</strong>
        </div>
      </section>
      {learning.isLoading && <div className="loading-panel">학습자료를 불러오는 중…</div>}
      {learning.isError && <div className="error-panel">학습자료를 불러오지 못했습니다.</div>}
      <div className="learning-list">
        {learning.data?.map((source) => (
          <section key={source.id} className="learning-source">
            <header>
              <div className="source-icon">
                <BookOpen />
              </div>
              <div>
                <span>
                  {source.subject} · {source.category}
                </span>
                <h2>{source.title}</h2>
                <p>{source.units.length}개 모듈 · 원문을 복제하지 않고 실습형으로 재구성</p>
              </div>
            </header>
            <div className="unit-grid">
              {source.units.map((unit, index) => (
                <article key={unit.id} className="learning-unit-card">
                  <button
                    type="button"
                    className="learning-card-trigger"
                    onClick={() => setSelected({ unit, index })}
                    aria-label={`${unit.title} 내용 보기`}
                  />
                  <div className="learning-card-content">
                    <div className="unit-top">
                      <span className="module-number">{String(index + 1).padStart(2, '0')}</span>
                      <span>
                        {unit.progress[0]?.completed ? (
                          <>
                            <CheckCircle2 /> 학습 완료
                          </>
                        ) : (
                          <>
                            <Layers3 /> 학습 전
                          </>
                        )}
                      </span>
                    </div>
                    <h3>{unit.title}</h3>
                    <p>{summaryPreview(unit.summary)}</p>
                    <div className="tag-row">
                      {unit.concepts.slice(0, 5).map((concept) => (
                        <span key={concept}>{concept}</span>
                      ))}
                    </div>
                    <div className="unit-counts">
                      <span>플래시카드 {unit.flashcards.length}</span>
                      <span>복습 문제 {unit.questions.length}</span>
                      <span className="learning-card-open">카드를 눌러 바로 보기</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {selected && (
        <LearningUnitModal
          unit={selected.unit}
          index={selected.index}
          onClose={() => setSelected(undefined)}
          reviewing={review.isPending}
          onReview={(rating) => review.mutate({ unitId: selected.unit.id, rating })}
        />
      )}
    </div>
  );
}
