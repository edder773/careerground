import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  MessageCircleQuestion,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { api } from '../lib/api';

type Unit = {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  visuals?: Array<{ src: string; alt: string; caption: string; page: number }>;
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
}: {
  unit: Unit;
  index: number;
  onClose: () => void;
}) {
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
                <h2>{unit.title}</h2>
              </Dialog.Title>
            </div>
            <Dialog.Close type="button" aria-label="닫기">
              <X />
            </Dialog.Close>
          </header>
          <div className="learning-modal-content">
            <div className="learning-concept-map" aria-label="핵심 개념">
              {unit.concepts.map((concept) => (
                <span key={concept}>{concept}</span>
              ))}
            </div>
            {(unit.visuals?.length || 0) > 0 && (
              <section className="learning-visual-section" aria-label="PDF 시각 자료">
                <div className="learning-section-title">
                  <ImageIcon />
                  <div>
                    <span>원본 자료</span>
                    <h3>그림·표·코드로 이해하기</h3>
                  </div>
                </div>
                <div className="learning-visual-grid">
                  {unit.visuals?.map((visual) => (
                    <figure key={visual.src}>
                      <a href={visual.src} target="_blank" rel="noreferrer">
                        <img src={visual.src} alt={visual.alt} loading="lazy" decoding="async" />
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LearningPage() {
  const [selected, setSelected] = useState<{ unit: Unit; index: number }>();
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const initializedSources = useRef(false);
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
  useEffect(() => {
    if (initializedSources.current || !learning.data?.length) return;
    initializedSources.current = true;
    setExpandedSources(new Set([learning.data[0]!.id]));
  }, [learning.data]);

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
                      onClick={() => setSelected({ unit, index })}
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
            )}
          </section>
        ))}
      </div>
      {selected && (
        <LearningUnitModal
          unit={selected.unit}
          index={selected.index}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
