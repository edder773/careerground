import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { login } from './helpers';

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-320', width: 320, height: 568 },
] as const;

test('captures responsive home screenshots and has no serious accessibility violations', async ({
  page,
}) => {
  await mkdir('test-results/visual', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'OpenAI 계정으로 계속' })).toBeVisible();
  await page.screenshot({
    path: 'test-results/visual/login-openai-desktop.png',
    fullPage: false,
  });
  await login(page, 'visual@careerground.local');
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
    await expect(page.locator('.today-feature strong')).not.toContainText('준비하는 중');
    await page.screenshot({
      path: `test-results/visual/home-${viewport.name}.png`,
      fullPage: false,
    });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((item) => ['critical', 'serious'].includes(item.impact || '')),
  ).toEqual([]);
});

test('captures core domain screens', async ({ page }) => {
  await mkdir('test-results/visual', { recursive: true });
  await login(page, 'visual@careerground.local');
  await page.setViewportSize({ width: 1440, height: 900 });
  const screens = [
    { href: '/coding', heading: '코딩테스트', name: 'coding' },
    { href: '/jobs', heading: '신입 IT 채용공고', name: 'jobs' },
    { href: '/learning', heading: '학습 라이브러리', name: 'learning' },
    { href: '/solutions', heading: '풀이 기록', name: 'solutions' },
    { href: '/notes', heading: '개인 노트', name: 'notes' },
  ];
  for (const screen of screens) {
    await page.goto(screen.href);
    await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible();
    if (screen.name === 'notes') {
      await page.getByRole('button', { name: '새 노트' }).first().click();
      await page.getByRole('textbox', { name: '노트 제목' }).fill('이번 주 준비 기록');
      await page
        .getByRole('textbox', { name: '노트 내용' })
        .fill('# 이번 주 준비\n\n- 코딩테스트 복습\n- 지원 공고 정리');
      await page.getByRole('button', { name: /^저장$/ }).click();
      await expect(page.getByRole('button', { name: /^저장$/ })).toBeEnabled();
      await expect(page.getByRole('textbox', { name: '노트 제목' })).toHaveValue(
        '이번 주 준비 기록',
      );
    }
    if (screen.name === 'jobs') {
      await expect(page.locator('.job-card').first()).toBeVisible();
    }
    await page.screenshot({
      path: `test-results/visual/${screen.name}-desktop.png`,
      fullPage: true,
    });
    if (screen.name === 'jobs') {
      await page.getByRole('button', { name: '달력' }).click();
      await expect(page.getByRole('region', { name: /신입 채용 달력/ })).toBeVisible();
      await expect(page.locator('.calendar-job').first()).toBeVisible();
      await page.screenshot({
        path: 'test-results/visual/jobs-calendar-desktop-1440.png',
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/notes');
  await expect(page.getByRole('heading', { name: '개인 노트' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '노트 제목' })).toHaveValue('이번 주 준비 기록');
  await page.screenshot({ path: 'test-results/visual/notes-mobile-375.png', fullPage: false });

  await page.goto('/jobs');
  await page.getByRole('button', { name: '달력' }).click();
  await expect(page.getByRole('region', { name: /신입 채용 달력/ })).toBeVisible();
  await page.screenshot({
    path: 'test-results/visual/jobs-calendar-mobile-375.png',
    fullPage: false,
  });
});
