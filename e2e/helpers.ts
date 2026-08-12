import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email = 'member@careerground.local') {
  await page.context().setExtraHTTPHeaders({
    'oai-authenticated-user-id': `e2e:${email.toLowerCase()}`,
    'oai-authenticated-user-email': email.toLowerCase(),
    'oai-authenticated-user-full-name': encodeURIComponent(email.split('@')[0] || 'OpenAI user'),
    'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
}

export async function logout(page: Page) {
  await page.context().setExtraHTTPHeaders({});
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('link', { name: 'OpenAI 계정으로 계속' })).toBeVisible();
}
