import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email = 'member@careerground.local') {
  await page.context().setExtraHTTPHeaders({
    'oai-authenticated-user-id': `e2e:${email.toLowerCase()}`,
    'oai-authenticated-user-email': email.toLowerCase(),
    'oai-authenticated-user-full-name': encodeURIComponent(email.split('@')[0] || 'OpenAI user'),
    'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
  });
  await page.goto('/');
  const onboarding = page.getByRole('heading', { name: '어떻게 불러드릴까요?' });
  const home = page.getByRole('heading', { name: '내 폴더', level: 1 });
  await expect(home.or(onboarding)).toBeVisible();
  if (await onboarding.isVisible()) {
    await page.getByLabel('이름').fill(email.split('@')[0] || 'OpenAI user');
    await page.getByLabel('JavaScript').check();
    await page.getByRole('button', { name: /내 작업대 시작하기/ }).click();
  }
  await expect(home).toBeVisible();
}

export async function logout(page: Page) {
  await page.context().setExtraHTTPHeaders({});
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('link', { name: 'OpenAI 계정으로 계속' })).toBeVisible();
}
