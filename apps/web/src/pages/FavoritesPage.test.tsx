import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { FavoritesPage } from './FavoritesPage';
import { renderPage } from '../test/render';

describe('favorites workspace', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'careerground.favorites.v1',
      JSON.stringify([
        {
          itemType: 'JOB_POSTING',
          targetId: 'job-one',
          label: '테스트회사 — 신입 개발자',
          href: '/?job=job-one',
        },
        {
          itemType: 'LEARNING_UNIT',
          targetId: 'retired-learning-unit',
          label: '폐기된 학습 항목',
          href: '/learning?unit=retired-learning-unit',
        },
      ]),
    );
  });

  it('shows only job and coding favorites', () => {
    renderPage(<FavoritesPage />);

    expect(screen.getByRole('heading', { name: '즐겨찾기', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('테스트회사 — 신입 개발자')).toBeInTheDocument();
    expect(screen.queryByText('폐기된 학습 항목')).not.toBeInTheDocument();
    expect(screen.getByText('저장한 항목').parentElement).toHaveTextContent('1개');
    expect(screen.getByRole('link', { name: /관심 공고/ })).toHaveAttribute(
      'href',
      '/?saved=1&view=list',
    );
    expect(screen.getByRole('link', { name: /즐겨찾기 문제/ })).toHaveAttribute(
      'href',
      '/coding?favorites=1&view=all',
    );
  });

  it('removes a device-local favorite without an API request', async () => {
    const user = userEvent.setup();
    renderPage(<FavoritesPage />);

    await user.click(
      screen.getByRole('button', { name: '테스트회사 — 신입 개발자 즐겨찾기 해제' }),
    );

    expect(await screen.findByText('아직 저장한 항목이 없습니다')).toBeInTheDocument();
    expect(window.localStorage.getItem('careerground.favorites.v1')).toBe('[]');
  });
});
