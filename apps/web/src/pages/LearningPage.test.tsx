import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LearningPage } from './LearningPage';
import { renderPage, response } from '../test/render';

const unit = (id: string, title: string, image: string) => ({
  id,
  title,
  summary: `## 이 단원의 목표\n\n${title}을 이해합니다.`,
  concepts: ['핵심 개념'],
  visuals: [
    {
      src: image,
      alt: `${title} 원본 PDF 슬라이드`,
      caption: '제공된 PDF 원본 캡처',
      page: 10,
    },
  ],
  flashcards: [{ id: `${id}-card`, front: '질문', back: '답' }],
  questions: [{ id: `${id}-question`, prompt: '확인 문제', attempts: [] }],
  progress: [],
});

const unitSummary = (value: ReturnType<typeof unit>) => ({
  id: value.id,
  title: value.title,
  summaryPreview: value.summary,
  flashcardCount: value.flashcards.length,
  questionCount: value.questions.length,
  progress: value.progress,
});

describe('learning library', () => {
  it('collapses sources and opens the original PDF capture directly from a card', async () => {
    const units = [
      unit('unit-one', '통계적 사고', '/learning/statistical-thinking.webp'),
      unit('unit-two', 'Git 작업 흐름', '/learning/git-mental-model.webp'),
    ];
    const sources = [
      {
        id: 'source-one',
        title: '첫 번째 PDF',
        subject: '통계',
        category: '기초',
        units: [unitSummary(units[0]!)],
      },
      {
        id: 'source-two',
        title: '두 번째 PDF',
        subject: 'Git',
        category: '환경 구성',
        units: [unitSummary(units[1]!)],
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/learning/due')) return response([]);
        if (url.endsWith('/learning/units/unit-one')) return response(units[0]);
        if (url.endsWith('/learning/units/unit-two')) return response(units[1]);
        return response(sources);
      }),
    );
    const user = userEvent.setup();
    renderPage(<LearningPage />);

    expect(await screen.findByRole('heading', { name: '첫 번째 PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '통계적 사고 내용 보기' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Git 작업 흐름 내용 보기' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('학습 전')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '펼치기' }));
    expect(screen.getByRole('button', { name: 'Git 작업 흐름 내용 보기' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '통계적 사고 내용 보기' }));

    const dialog = screen.getByRole('dialog', { name: '통계적 사고' });
    const modal = within(dialog);
    const capture = modal.getByRole('img', { name: '통계적 사고 원본 PDF 슬라이드' });
    expect(capture).toHaveAttribute('src', '/learning/statistical-thinking.webp');
    expect(modal.getByRole('link', { name: /크게 보기/ })).toHaveAttribute(
      'href',
      '/learning/statistical-thinking.webp',
    );

    expect(modal.queryByText('이 단원을 얼마나 이해했나요?')).not.toBeInTheDocument();
    expect(modal.queryByRole('button', { name: /이해도/ })).not.toBeInTheDocument();
  });
});
