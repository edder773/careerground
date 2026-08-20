import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  MessageCircleQuestion,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useSearchParams } from 'react-router';
import { api, json } from '../lib/api';
import { FavoriteSaveButton } from '../components/FavoriteSaveButton';
import '../styles/learning.css';

type UnitSummary = {
  id: string;
  title: string;
  summaryPreview: string;
  flashcardCount: number;
  questionCount: number;
  progress: Array<{ completed: boolean; nextReviewAt: string | null }>;
};
type Unit = {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  visuals?: Array<{ src: string; alt: string; caption: string; page: number }>;
  flashcards: Array<{ id: string; front: string; back: string }>;
  questions: Array<{
    id: string;
    prompt: string;
    type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
    choices: string[];
    attempts: Array<{ id: string; response: string; correct: boolean; attemptedAt: string }>;
  }>;
  progress: Array<{ completed: boolean; nextReviewAt: string | null }>;
};
type Source = {
  id: string;
  title: string;
  subject: string;
  category: string;
  units: UnitSummary[];
};

const learningUnitQuery = (unitId: string) => ({
  queryKey: ['learning-unit', unitId] as const,
  queryFn: () => api<Unit>(`/learning/units/${unitId}`),
  staleTime: 5 * 60_000,
});

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
  unitId,
  index,
  onClose,
}: {
  unitId: string;
  index: number;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const unit = useQuery(learningUnitQuery(unitId));
  const complete = useMutation({
    mutationFn: () =>
      api('/learning/review', {
        method: 'POST',
        body: json({ unitId, rating: 3 }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['learning'] }),
        client.invalidateQueries({ queryKey: ['learning-unit', unitId] }),
      ]);
    },
  });
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="learning-modal-backdrop" />
        <Dialog.Content className="learning-unit-modal" aria-describedby={undefined}>
          <header>
            <div>
              <span>MODULE {String(index + 1).padStart(2, '0')}</span>
              <Dialog.Title asChild>
                <h2>{unit.data?.title || '학습 단원'}</h2>
              </Dialog.Title>
            </div>
            <Dialog.Close type="button" aria-label="닫기">
              <X />
            </Dialog.Close>
          </header>
          <div className="learning-modal-content">
            {unit.isLoading && <div className="loading-panel">학습 내용을 불러오는 중…</div>}
            {unit.isError && <div className="error-panel">학습 내용을 불러오지 못했습니다.</div>}
            {unit.data && (
              <>
                <div className="learning-concept-map" aria-label="핵심 개념">
                  {unit.data.concepts.map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
                {(unit.data.visuals?.length || 0) > 0 && (
                  <section className="learning-visual-section" aria-label="PDF 시각 자료">
                    <div className="learning-section-title">
                      <ImageIcon />
                      <div>
                        <span>원본 자료</span>
                        <h3>그림·표·코드로 이해하기</h3>
                      </div>
                    </div>
                    <div className="learning-visual-grid">
                      {unit.data.visuals?.map((visual) => (
                        <figure key={visual.src}>
                          <a href={visual.src} target="_blank" rel="noreferrer">
                            <img
                              src={visual.src}
                              alt={visual.alt}
                              loading="lazy"
                              decoding="async"
                            />
                            <span>
                              크게 보기 <ExternalLink />
                            </span>
                          </a>
                          <figcaption>{visual.caption}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                )}
                <article className="learning-markdown">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                    {unit.data.summary}
                  </ReactMarkdown>
                </article>
                <div className="learning-unit-actions">
                  <FavoriteSaveButton
                    itemType="LEARNING_UNIT"
                    targetId={unit.data.id}
                    label={unit.data.title}
                  />
                  <button
                    type="button"
                    className="primary-button compact"
                    disabled={complete.isPending}
                    onClick={() => complete.mutate()}
                  >
                    <CheckCircle2 />
                    {complete.isPending
                      ? '완료 상태 저장 중…'
                      : unit.data.progress[0]?.completed
                        ? '완료 상태 갱신'
                        : '학습 완료'}
                  </button>
                </div>
                {complete.isError && (
                  <div className="form-error" role="alert">
                    학습 완료 상태를 저장하지 못했습니다.
                  </div>
                )}
                <section className="learning-recall-section">
                  <div className="learning-section-title">
                    <Sparkles />
                    <div>
                      <span>기억 꺼내기</span>
                      <h3>플래시카드</h3>
                    </div>
                  </div>
                  <div className="learning-flashcards">
                    {unit.data.flashcards.map((card) => (
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
                    {unit.data.questions.map((question) => (
                      <LearningQuestion key={question.id} question={question} unitId={unitId} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LearningQuestion({
  question,
  unitId,
}: {
  question: Unit['questions'][number];
  unitId: string;
}) {
  const client = useQueryClient();
  const [response, setResponse] = useState('');
  const answer = useMutation({
    mutationFn: () =>
      api<{ correct: boolean; answer: string }>(`/learning/questions/${question.id}/answer`, {
        method: 'POST',
        body: json({ response }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['learning-unit', unitId] }),
  });
  return (
    <form
      className="learning-question-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (response.trim()) answer.mutate();
      }}
    >
      {question.type === 'MULTIPLE_CHOICE' ? (
        <p className="learning-question-prompt">{question.prompt}</p>
      ) : (
        <label htmlFor={`question-${question.id}`}>{question.prompt}</label>
      )}
      {question.type === 'MULTIPLE_CHOICE' ? (
        <fieldset className="learning-choice-list">
          <legend className="sr-only">답 선택</legend>
          {question.choices.map((choice) => (
            <label key={choice}>
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choice}
                checked={response === choice}
                onChange={(event) => setResponse(event.target.value)}
              />
              <span>{choice}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div>
          <input
            id={`question-${question.id}`}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            aria-invalid={answer.data ? !answer.data.correct : undefined}
            aria-describedby={answer.data ? `question-result-${question.id}` : undefined}
          />
        </div>
      )}
      <div className="learning-question-actions">
        <button type="submit" disabled={!response.trim() || answer.isPending}>
          {answer.isPending ? '채점 중…' : '채점하기'}
        </button>
      </div>
      {answer.data && (
        <p
          id={`question-result-${question.id}`}
          role="status"
          className={answer.data.correct ? 'success-text' : 'error-text'}
        >
          {answer.data.correct ? '정답입니다.' : `다시 확인해보세요. 정답: ${answer.data.answer}`}
        </p>
      )}
      {question.attempts.length > 0 && (
        <small>
          이전 시도 {question.attempts.length}회 · 오답{' '}
          {question.attempts.filter((attempt) => !attempt.correct).length}회
        </small>
      )}
    </form>
  );
}

export function LearningPage() {
  const client = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<{ unitId: string; index: number }>();
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const initializedSources = useRef(false);
  const learning = useQuery({
    queryKey: ['learning'],
    queryFn: () => api<Source[]>('/learning'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (initializedSources.current || !learning.data?.length) return;
    initializedSources.current = true;
    setExpandedSources(new Set([learning.data[0]!.id]));
  }, [learning.data]);
  useEffect(() => {
    const requested = searchParams.get('unit');
    if (!requested || !learning.data) return;
    for (const source of learning.data) {
      const index = source.units.findIndex((unit) => unit.id === requested);
      if (index >= 0) {
        setExpandedSources((current) => new Set(current).add(source.id));
        setSelected({ unitId: requested, index });
        return;
      }
    }
  }, [learning.data, searchParams]);

  const toggleSource = (sourceId: string) => {
    setExpandedSources((current) => {
      const next = new Set(current);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  return (
    <div className="learning-page">
      <section className="page-heading learning-heading">
        <div>
          <span className="eyebrow">
            <Brain size={15} /> 이해 중심 학습
          </span>
          <h1>학습 라이브러리</h1>
          <p>개념을 짧게 익히고, 예시·플래시카드·복습 문제로 바로 확인하세요.</p>
        </div>
      </section>
      {learning.isLoading && <div className="loading-panel">학습자료를 불러오는 중…</div>}
      {learning.isError && <div className="error-panel">학습자료를 불러오지 못했습니다.</div>}
      <div className="learning-list">
        {learning.data?.map((source) => (
          <section
            key={source.id}
            className={`learning-source ${expandedSources.has(source.id) ? 'expanded' : ''}`}
          >
            <header>
              <div className="source-icon">
                <BookOpen />
              </div>
              <div>
                <span>
                  {source.subject} · {source.category}
                </span>
                <h2>{source.title}</h2>
                <p>{source.units.length}개 모듈 · 핵심 설명과 원본 슬라이드 캡처</p>
              </div>
              <button
                type="button"
                className="learning-source-toggle"
                aria-expanded={expandedSources.has(source.id)}
                aria-controls={`learning-source-${source.id}`}
                onClick={() => toggleSource(source.id)}
              >
                {expandedSources.has(source.id) ? '접기' : '펼치기'}
                <ChevronDown />
              </button>
            </header>
            {expandedSources.has(source.id) && (
              <div className="unit-grid" id={`learning-source-${source.id}`}>
                {source.units.map((unit, index) => (
                  <article key={unit.id} className="learning-unit-card">
                    <button
                      type="button"
                      className="learning-card-trigger"
                      onPointerEnter={() => void client.prefetchQuery(learningUnitQuery(unit.id))}
                      onFocus={() => void client.prefetchQuery(learningUnitQuery(unit.id))}
                      onClick={() => {
                        setSelected({ unitId: unit.id, index });
                        const next = new URLSearchParams(searchParams);
                        next.set('unit', unit.id);
                        setSearchParams(next, { replace: true });
                      }}
                      aria-label={`${unit.title} 내용 보기`}
                    />
                    <div className="learning-card-content">
                      <div className="unit-top">
                        <span className="module-number">{String(index + 1).padStart(2, '0')}</span>
                        {unit.progress[0]?.completed && (
                          <span>
                            <CheckCircle2 /> 학습 완료
                          </span>
                        )}
                      </div>
                      <h3>{unit.title}</h3>
                      <p>{summaryPreview(unit.summaryPreview)}</p>
                      <div className="unit-counts">
                        <span>플래시카드 {unit.flashcardCount}</span>
                        <span>복습 문제 {unit.questionCount}</span>
                        <span className="learning-card-open">카드를 눌러 바로 보기</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      {selected && (
        <LearningUnitModal
          unitId={selected.unitId}
          index={selected.index}
          onClose={() => {
            setSelected(undefined);
            const next = new URLSearchParams(searchParams);
            next.delete('unit');
            setSearchParams(next, { replace: true });
          }}
        />
      )}
    </div>
  );
}
