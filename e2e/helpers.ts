import { expect, type Page } from '@playwright/test';

export async function login(
  page: Page,
  email = 'member@careerground.local',
  password = 'Demo-password-123!',
) {
  await page.goto('/');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
}
