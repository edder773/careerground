import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-320', width: 320, height: 568 },
] as const;

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((item) =>
      ['critical', 'serious', 'moderate'].includes(item.impact || ''),
    ),
  ).toEqual([]);
}

async function expectCenteredFilterCheck(checkbox: Locator) {
  const check = checkbox.locator('..').locator('.multi-filter-check');
  const metrics = await check.evaluate((element) => {
    const icon = element.querySelector('svg');
    if (!icon) return null;
    const containerBox = element.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    return {
      centerDeltaX: iconBox.x + iconBox.width / 2 - (containerBox.x + containerBox.width / 2),
      centerDeltaY: iconBox.y + iconBox.height / 2 - (containerBox.y + containerBox.height / 2),
      iconWidth: iconBox.width,
      iconHeight: iconBox.height,
      lineHeight: getComputedStyle(element).lineHeight,
    };
  });
  expect(metrics).not.toBeNull();
  expect(Math.abs(metrics!.centerDeltaX)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(metrics!.centerDeltaY)).toBeLessThanOrEqual(0.5);
  expect(metrics!.iconWidth).toBe(12);
  expect(metrics!.iconHeight).toBe(12);
  expect(metrics!.lineHeight).toBe('0px');
}

async function expectKoreanCategoryFilters(filterDialog: Locator) {
  const labels = await filterDialog
    .getByRole('group', { name: '직무' })
    .locator('label > span:last-child')
    .allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  expect(labels.every((label) => /[가-힣]/.test(label))).toBe(true);
  expect(new Set(labels).size).toBe(labels.length);
}

test('captures the anonymous responsive workspace and accessibility state', async ({
  page,
}, testInfo) => {
  await mkdir('test-results/visual', { recursive: true });
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '즐겨찾기', level: 1 })).toBeVisible();
    await expect(page.locator('.today-problem-list a')).toHaveCount(3);
    await expect(page.getByText(/로그인|Google 계정/)).toHaveCount(0);
    const primaryNavigation = page.getByRole('navigation', { name: '주요 메뉴' });
    if (viewport.width > 900) {
      await expect(primaryNavigation).toContainText('둘러보기홈채용공고');
      await expect(primaryNavigation).toContainText('학습 도구학습코딩테스트자격증');
      await expect(primaryNavigation).not.toContainText('함께 성장');
      await expect(
        primaryNavigation.getByRole('link', { name: '자격증 새 창에서 열기' }),
      ).toHaveAttribute('href', 'https://baeumzip.site');
    }
    await page.screenshot({
      path: `test-results/visual/home-${viewport.name}.png`,
      fullPage: false,
    });
    if (viewport.name === 'mobile-375' && testInfo.project.name === 'chromium') {
      await expect(page).toHaveScreenshot('home-mobile-shell.png', {
        mask: [page.locator('.today-problem-list')],
      });
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: '검색' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoSeriousViolations(page);
  await page.keyboard.press('Escape');
});

test('captures public coding, jobs, and learning screens', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir('test-results/visual', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  const screens = [
    { href: '/coding', heading: '코딩테스트', name: 'coding' },
    { href: '/jobs', heading: '신입 IT 채용공고', name: 'jobs' },
    { href: '/learning', heading: '학습 라이브러리', name: 'learning' },
  ];
  for (const screen of screens) {
    await page.goto(screen.href);
    await expect(page.getByRole('heading', { name: screen.heading, exact: true })).toBeVisible();
    if (screen.name === 'jobs') {
      const firstJobCard = page.locator('.job-card').first();
      await expect(firstJobCard).toBeVisible();
      const activeCompanyName = (
        await firstJobCard.locator('.job-card-detail strong').innerText()
      ).trim();
      const companySearch = page.getByRole('searchbox', { name: '회사명 검색' });
      await companySearch.fill(activeCompanyName);
      const values = await page.locator('.job-card').allTextContents();
      expect(values.length).toBeGreaterThan(0);
      expect(values.every((value) => value.includes(activeCompanyName))).toBe(true);
      await companySearch.fill('');
      await page.getByRole('button', { name: /^채용공고 필터/ }).click();
      const filterDialog = page.getByRole('dialog', { name: '채용공고 전체 필터' });
      const largeCompany = filterDialog.getByRole('checkbox', { name: '대기업' });
      await largeCompany.check();
      await filterDialog.getByRole('checkbox', { name: '백엔드', exact: true }).check();
      await expectCenteredFilterCheck(largeCompany);
      await expectKoreanCategoryFilters(filterDialog);
      await page.screenshot({
        path: 'test-results/visual/jobs-multi-filter-desktop-1440.png',
        fullPage: false,
      });
      await filterDialog.getByRole('button', { name: '필터 닫기' }).click();
    }
    if (screen.name === 'coding') {
      const daily = page.getByRole('region', { name: '오늘의 추천 문제' });
      await expect(daily.locator('article')).toHaveCount(3);
      await expect(daily.getByRole('link', { name: /문제 열기/ })).toHaveCount(3);
      await expect(page.getByText(/풀이 기록|다른 풀이|코딩 랭킹/)).toHaveCount(0);
    }
    await page.screenshot({
      path: `test-results/visual/${screen.name}-desktop.png`,
      fullPage: true,
    });
    await expectNoSeriousViolations(page);
  }

  await page.goto('/jobs');
  await page.getByRole('button', { name: '달력' }).click();
  await expect(page.locator('.job-calendar-legend')).not.toContainText('등록일');
  await expect(page.locator('.job-calendar-legend')).toContainText('접수 시작일');
  await page.screenshot({
    path: 'test-results/visual/jobs-calendar-desktop-1440.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: /상시채용 확인하기/ }).click();
  const rollingModal = page.getByRole('dialog', { name: '상시채용 공고' });
  await expect(rollingModal).toBeVisible();
  await rollingModal.getByRole('button', { name: '닫기' }).click();
  await page.locator('.calendar-job').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({
    path: 'test-results/visual/jobs-calendar-modal-desktop-1440.png',
    fullPage: false,
  });
});

test('keeps public pages usable on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '즐겨찾기' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/jobs');
  await page.getByRole('button', { name: /^채용공고 필터/ }).click();
  const mobileFilter = page.getByRole('dialog', { name: '채용공고 전체 필터' });
  const largeCompany = mobileFilter.getByRole('checkbox', { name: '대기업' });
  await largeCompany.check();
  await mobileFilter.getByRole('checkbox', { name: '백엔드', exact: true }).check();
  await expectCenteredFilterCheck(largeCompany);
  await expectKoreanCategoryFilters(mobileFilter);
  const mobileFilterBox = await mobileFilter.boundingBox();
  expect(mobileFilterBox).not.toBeNull();
  expect(mobileFilterBox!.x).toBeGreaterThanOrEqual(0);
  expect(mobileFilterBox!.y).toBeGreaterThanOrEqual(0);
  expect(mobileFilterBox!.x + mobileFilterBox!.width).toBeLessThanOrEqual(375);
  expect(mobileFilterBox!.y + mobileFilterBox!.height).toBeLessThanOrEqual(812);
  await mobileFilter.getByRole('button', { name: '필터 닫기' }).click();

  await page.goto('/coding');
  await expect(page.getByRole('region', { name: '오늘의 추천 문제' })).toBeVisible();
  await expect(page.getByRole('button', { name: '전체 문제', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '즐겨찾기', exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await expectNoSeriousViolations(page);
});

test('stacks the three daily recommendations without wrapping titles', async ({ page }) => {
  await mkdir('test-results/visual', { recursive: true });
  for (const viewport of [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'mobile-375', width: 375, height: 812 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    const rows = page.locator('.today-problem-list a');
    await expect(rows).toHaveCount(3);
    const layout = await rows.evaluateAll((elements) =>
      elements.map((element) => {
        const row = element.getBoundingClientRect();
        const title = element.querySelector('strong');
        return {
          left: Math.round(row.left),
          top: Math.round(row.top),
          whiteSpace: title ? getComputedStyle(title).whiteSpace : '',
        };
      }),
    );
    expect(new Set(layout.map((item) => item.left)).size).toBe(1);
    expect(layout[0]!.top).toBeLessThan(layout[1]!.top);
    expect(layout[1]!.top).toBeLessThan(layout[2]!.top);
    expect(layout.every((item) => item.whiteSpace === 'nowrap')).toBe(true);
  }
});
