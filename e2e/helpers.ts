import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email = 'member@careerground.local') {
  const apiOrigin = process.env.E2E_API_ORIGIN || 'http://127.0.0.1:4000/api/v1';
  await page.goto(`${apiOrigin}/auth/slack/start?login_hint=${encodeURIComponent(email)}`);
  await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
}
