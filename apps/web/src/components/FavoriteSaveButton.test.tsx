import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FavoriteSaveButton } from './FavoriteSaveButton';
import { renderPage } from '../test/render';

describe('FavoriteSaveButton', () => {
  it('stores and toggles a favorite in the current browser', async () => {
    const user = userEvent.setup();
    renderPage(
      <FavoriteSaveButton itemType="LEARNING_UNIT" targetId="unit-1" label="자료구조 기초" />,
    );

    await user.click(await screen.findByRole('button', { name: '자료구조 기초 즐겨찾기' }));

    expect(screen.getByRole('button', { name: '자료구조 기초 즐겨찾기 해제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(JSON.parse(window.localStorage.getItem('careerground.favorites.v1') || '[]')).toEqual([
      expect.objectContaining({ itemType: 'LEARNING_UNIT', targetId: 'unit-1' }),
    ]);

    await user.click(screen.getByRole('button', { name: '자료구조 기초 즐겨찾기 해제' }));
    expect(screen.getByRole('button', { name: '자료구조 기초 즐겨찾기' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
