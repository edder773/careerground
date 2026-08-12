import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Brain, CheckCircle2, Clock3, Layers3 } from 'lucide-react';
import { api, json } from '../lib/api';

type Unit = {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  flashcards: Array<{ id: string; front: string; back: string }>;
  questions: Array<{ id: string; prompt: string; answer: string }>;
  progress: Array<{ completed: boolean; understanding: number; nextReviewAt: string }>;
};
type Source = { id: string; title: string; subject: string; category: string; units: Unit[] };

export function LearningPage() {
  const client = useQueryClient();
  const learning = useQuery({ queryKey: ['learning'], queryFn: () => api<Source[]>('/learning') });
  const due = useQuery({
    queryKey: ['learning-due'],
    queryFn: () => api<unknown[]>('/learning/due'),
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
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Brain size={15} /> 근거 anchor 기반 콘텐츠
          </span>
          <h1>학습 라이브러리</h1>
          <p>핵심 내용을 학습하고 이해도를 기록해 다음 복습일을 계산합니다.</p>
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
                <p>{source.units.length}개 학습 단위</p>
              </div>
            </header>
            <div className="unit-grid">
              {source.units.map((unit) => (
                <article key={unit.id}>
                  <div className="unit-top">
                    <Layers3 />
                    <span>
                      {unit.progress[0]?.completed ? (
                        <>
                          <CheckCircle2 /> 학습 완료
                        </>
                      ) : (
                        '학습 전'
                      )}
                    </span>
                  </div>
                  <h3>{unit.title}</h3>
                  <p>{unit.summary}</p>
                  <div className="tag-row">
                    {unit.concepts.map((concept) => (
                      <span key={concept}>{concept}</span>
                    ))}
                  </div>
                  <div className="unit-counts">
                    <span>플래시카드 {unit.flashcards.length}</span>
                    <span>문제 {unit.questions.length}</span>
                  </div>
                  <div className="rating-buttons" aria-label="이해도 기록">
                    <span>이해도</span>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => review.mutate({ unitId: unit.id, rating })}
                        aria-label={`이해도 ${rating}점`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
