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
  await login(page, 'visual@careerground.local');
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
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
  const screens = [
    { href: '/coding', heading: '코딩테스트', name: 'coding' },
    { href: '/jobs', heading: '신입 IT 채용공고', name: 'jobs' },
    { href: '/learning', heading: '학습 라이브러리', name: 'learning' },
    { href: '/solutions', heading: '공유 풀이', name: 'solutions' },
  ];
  for (const screen of screens) {
    await page.goto(screen.href);
    await expect(page.getByRole('heading', { name: screen.heading })).toBeVisible();
    await page.screenshot({
      path: `test-results/visual/${screen.name}-desktop.png`,
      fullPage: true,
    });
  }
});
