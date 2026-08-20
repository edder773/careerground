import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FavoriteSaveButton } from './FavoriteSaveButton';
import { renderPage, response } from '../test/render';

describe('FavoriteSaveButton', () => {
  it('creates one favorites collection on first save and toggles the item with one click', async () => {
    const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
    let collections: Array<{
      id: string;
      name: string;
      parentId: null;
      items: Array<{ id: string; itemType: string; targetId: string; label: string }>;
    }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method, body });
        if (url.endsWith('/collections') && method === 'GET') return response(collections);
        if (url.endsWith('/collections') && method === 'POST') {
          const created = { id: 'favorites', name: '즐겨찾기', parentId: null, items: [] };
          collections = [created];
          return response(created);
        }
        if (url.endsWith('/collections/favorites/items') && method === 'POST') {
          const item = {
            id: 'favorite-item',
            ...body,
          } as (typeof collections)[number]['items'][number];
          collections[0]!.items.push(item);
          return response(item);
        }
        return response({});
      }),
    );
    const user = userEvent.setup();
    renderPage(
      <FavoriteSaveButton itemType="LEARNING_UNIT" targetId="unit-1" label="자료구조 기초" />,
    );

    await user.click(await screen.findByRole('button', { name: '자료구조 기초 즐겨찾기' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '자료구조 기초 즐겨찾기 해제' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(calls.filter((call) => call.method === 'POST')).toEqual([
      expect.objectContaining({
        url: 'http://localhost:4000/api/v1/collections',
        body: expect.objectContaining({ name: '즐겨찾기', icon: 'star' }),
      }),
      expect.objectContaining({
        url: 'http://localhost:4000/api/v1/collections/favorites/items',
        body: expect.objectContaining({ itemType: 'LEARNING_UNIT', targetId: 'unit-1' }),
      }),
    ]);
  });
});
