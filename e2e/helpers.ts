import { expect, type Page } from '@playwright/test';

export async function login(
  page: Page,
  email = 'member@careerground.local',
  completeOnboarding = true,
  displayName = email.split('@')[0] || 'Google user',
) {
  const response = await page.request.post('/api/v1/auth/test', {
    data: {
      subject: `e2e:${email.toLowerCase()}`,
      email: email.toLowerCase(),
      displayName,
    },
  });
  expect(response.ok()).toBe(true);
  await page.goto('/');
  const onboarding = page.getByRole('heading', { name: '어떻게 불러드릴까요?' });
  const home = page.getByRole('heading', { name: '내 폴더', level: 1 });
  await expect(home.or(onboarding)).toBeVisible();
  if (!completeOnboarding) {
    await expect(onboarding).toBeVisible();
    return;
  }
  if (await onboarding.isVisible()) {
    await page.getByLabel('이름').fill(displayName);
    await page.getByLabel('JavaScript').check();
    await page.getByRole('button', { name: /내 작업대 시작하기/ }).click();
  }
  await expect(home).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('heading', { name: 'Google 계정으로 시작하기' })).toBeVisible();
}
