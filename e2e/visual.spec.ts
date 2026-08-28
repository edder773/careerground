import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { login } from './helpers';

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

async function mockGoogleIdentityScript(page: Page) {
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.google={accounts:{id:{initialize:function(){},renderButton:function(parent){var button=document.createElement('button');button.type='button';button.textContent='G  Google 계정으로 계속';button.setAttribute('aria-label','Google 계정으로 계속');button.style.cssText='width:300px;height:44px;border:1px solid #dadce0;border-radius:4px;background:#fff;color:#3c4043;font:500 14px Arial,sans-serif;cursor:pointer';parent.appendChild(button)}}}};`,
    }),
  );
}

test('captures responsive home screenshots and has no serious accessibility violations', async ({
  page,
}, testInfo) => {
  await mkdir('test-results/visual', { recursive: true });
  await mockGoogleIdentityScript(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Google 계정으로 시작하기' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google 계정으로 계속' })).toBeVisible();
  await expect(page.getByText('로그인 준비 중…')).toBeHidden();
  if (testInfo.project.name === 'chromium') {
    await expect(page).toHaveScreenshot('login-google.png');
  }
  await page.screenshot({
    path: 'test-results/visual/login-google-desktop.png',
    fullPage: false,
  });
  await expectNoSeriousViolations(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole('button', { name: 'Google 계정으로 계속' })).toBeVisible();
  if (testInfo.project.name === 'chromium') {
    await expect(page).toHaveScreenshot('login-google-mobile.png', {
      maxDiffPixelRatio: 0.06,
    });
  }
  await expectNoSeriousViolations(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, 'visual@careerground.local');
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await expect(page.getByRole('heading', { name: '즐겨찾기', level: 1 })).toBeVisible();
    await expect(page.locator('.today-problem-list a')).toHaveCount(3);
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

test('captures core domain screens', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir('test-results/visual', { recursive: true });
  await login(page, 'visual@careerground.local');
  await page.setViewportSize({ width: 1440, height: 900 });
  const screens = [
    { href: '/coding', heading: '코딩테스트', name: 'coding' },
    { href: '/jobs', heading: '신입 IT 채용공고', name: 'jobs' },
    { href: '/learning', heading: '학습 라이브러리', name: 'learning' },
    { href: '/settings', heading: '설정', name: 'settings' },
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
      expect(activeCompanyName.length).toBeGreaterThan(0);
      const companySearch = page.getByRole('searchbox', { name: '회사명 검색' });
      await expect(companySearch).toBeVisible();
      await companySearch.fill(activeCompanyName);
      await expect(page.locator('.job-card').first()).toContainText(activeCompanyName);
      const companyResults = await page.locator('.job-card').allTextContents();
      expect(companyResults.length).toBeGreaterThan(0);
      expect(companyResults.every((value) => value.includes(activeCompanyName))).toBe(true);
      await companySearch.fill('');
      await page.getByRole('button', { name: /^채용공고 필터/ }).click();
      const filterDialog = page.getByRole('dialog', { name: '채용공고 전체 필터' });
      await expect(filterDialog).toBeVisible();
      expect(await filterDialog.getByRole('checkbox').count()).toBeGreaterThan(4);
      const largeCompany = filterDialog.getByRole('checkbox', { name: '대기업' });
      await largeCompany.check();
      await filterDialog.getByRole('checkbox', { name: '백엔드', exact: true }).check();
      await expect(largeCompany.locator('..').locator('.multi-filter-check svg')).toBeVisible();
      await expectCenteredFilterCheck(largeCompany);
      await expect(filterDialog.getByText('BACKEND', { exact: true })).toHaveCount(0);
      await expectKoreanCategoryFilters(filterDialog);
      await page.waitForTimeout(220);
      await page.screenshot({
        path: 'test-results/visual/jobs-multi-filter-desktop-1440.png',
        fullPage: false,
      });
      await filterDialog.getByRole('button', { name: '필터 닫기' }).click();
    }
    if (screen.name === 'settings') {
      await expect(page.getByLabel('표시 이름')).toHaveCount(0);
      await expect(page.getByRole('button', { name: '변경', exact: true })).toBeVisible();
    }
    await page.screenshot({
      path: `test-results/visual/${screen.name}-desktop.png`,
      fullPage: true,
    });
    if (screen.name === 'coding') {
      const daily = page.getByRole('region', { name: '오늘의 추천 문제' });
      await expect(daily.locator('article')).toHaveCount(3);
      await expect(daily.getByRole('link', { name: /문제 열기/ })).toHaveCount(3);
      await expect(daily.getByRole('button', { name: /즐겨찾기/ })).toHaveCount(3);
      await expect(page.getByText(/풀이 기록|다른 풀이|코딩 랭킹/)).toHaveCount(0);
      await page.screenshot({
        path: 'test-results/visual/coding-catalog-desktop-1440.png',
        fullPage: true,
      });
    }
    if (screen.name === 'learning') {
      const promptLearning = page
        .locator('.learning-source')
        .filter({ hasText: '생성형 AI 실전: Prompt와 Context Engineering' });
      await expect(promptLearning).toBeVisible();
      const promptToggle = promptLearning.getByRole('button', { name: '펼치기' });
      if (await promptToggle.isVisible()) await promptToggle.click();
      await promptLearning
        .getByRole('button', { name: /내용 보기/ })
        .first()
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.waitForTimeout(220);
      await page.screenshot({
        path: 'test-results/visual/learning-module-desktop-1440.png',
        fullPage: false,
      });
      await page.getByRole('button', { name: '닫기' }).click();
    }
    if (screen.name === 'jobs') {
      await page.getByRole('button', { name: '달력' }).click();
      await expect(page.getByRole('region', { name: /신입 채용 달력/ })).toBeVisible();
      await expect(page.locator('.calendar-job').first()).toBeVisible();
      await expect(page.locator('.job-calendar-legend')).not.toContainText('등록일');
      await expect(page.locator('.job-calendar-legend')).toContainText('접수 시작일');
      await expect(page.getByText('시작·확인일', { exact: true })).toHaveCount(0);
      await page.screenshot({
        path: 'test-results/visual/jobs-calendar-desktop-1440.png',
        fullPage: true,
      });
      await page.getByRole('button', { name: /상시채용 확인하기/ }).click();
      await expect(page.getByRole('dialog', { name: '상시채용 공고' })).toBeVisible();
      await page.waitForTimeout(220);
      await page.screenshot({
        path: 'test-results/visual/jobs-rolling-modal-desktop-1440.png',
        fullPage: false,
      });
      await page
        .getByRole('dialog', { name: '상시채용 공고' })
        .getByRole('button', { name: '닫기' })
        .click();
      await page.locator('.calendar-job').first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.waitForTimeout(220);
      await page.screenshot({
        path: 'test-results/visual/jobs-calendar-modal-desktop-1440.png',
        fullPage: false,
      });
      await page.getByRole('button', { name: '닫기' }).click();
    }
    await expectNoSeriousViolations(page);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: '변경', exact: true })).toBeVisible();
  await expect(page.getByLabel('표시 이름')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/visual/settings-mobile-375.png', fullPage: false });

  await page.goto('/coding');
  await expect(page.getByRole('region', { name: '오늘의 추천 문제' })).toBeVisible();
  await expect(page.getByRole('button', { name: '전체 문제', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '즐겨찾기', exact: true })).toBeVisible();
  await page.screenshot({
    path: 'test-results/visual/coding-catalog-mobile-375.png',
    fullPage: false,
  });

  await page.goto('/jobs');
  await page.getByRole('button', { name: /^채용공고 필터/ }).click();
  const mobileFilter = page.getByRole('dialog', { name: '채용공고 전체 필터' });
  await expect(mobileFilter).toBeVisible();
  await expect(page.locator('.job-filter-overlay')).toBeVisible();
  const mobileLargeCompany = mobileFilter.getByRole('checkbox', { name: '대기업' });
  await mobileLargeCompany.check();
  await mobileFilter.getByRole('checkbox', { name: '백엔드', exact: true }).check();
  await expect(mobileLargeCompany.locator('..').locator('.multi-filter-check svg')).toBeVisible();
  await expectCenteredFilterCheck(mobileLargeCompany);
  await expect(mobileFilter.getByText('BACKEND', { exact: true })).toHaveCount(0);
  await expectKoreanCategoryFilters(mobileFilter);
  await page.waitForTimeout(220);
  expect(await mobileFilter.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  );
  const mobileFilterBox = await mobileFilter.boundingBox();
  expect(mobileFilterBox).not.toBeNull();
  expect(mobileFilterBox!.x).toBeGreaterThanOrEqual(0);
  expect(mobileFilterBox!.y).toBeGreaterThanOrEqual(0);
  expect(mobileFilterBox!.x + mobileFilterBox!.width).toBeLessThanOrEqual(375);
  expect(mobileFilterBox!.y + mobileFilterBox!.height).toBeLessThanOrEqual(812);
  await page.screenshot({
    path: 'test-results/visual/jobs-multi-filter-mobile-375.png',
    fullPage: false,
  });
  await mobileFilter.getByRole('button', { name: '필터 닫기' }).click();
  await expect(page.getByRole('searchbox', { name: '회사명 검색' })).toBeVisible();
  await page.getByRole('button', { name: '달력' }).click();
  await expect(page.getByRole('region', { name: /신입 채용 달력/ })).toBeVisible();
  await expect(page.locator('.job-calendar-legend')).not.toContainText('등록일');
  await expect(page.locator('.job-calendar-legend')).toContainText('접수 시작일');
  await expect(page.getByText('시작·확인일', { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/visual/jobs-calendar-mobile-375.png',
    fullPage: false,
  });
  await page.getByRole('button', { name: /상시채용 확인하기/ }).click();
  await expect(page.getByRole('dialog', { name: '상시채용 공고' })).toBeVisible();
  await page.waitForTimeout(220);
  await page.screenshot({
    path: 'test-results/visual/jobs-rolling-modal-mobile-375.png',
    fullPage: false,
  });
  await page
    .getByRole('dialog', { name: '상시채용 공고' })
    .getByRole('button', { name: '닫기' })
    .click();
  await page.locator('.calendar-job').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(220);
  await page.screenshot({
    path: 'test-results/visual/jobs-calendar-modal-mobile-375.png',
    fullPage: false,
  });
  await page.getByRole('button', { name: '닫기' }).click();

  await page.goto('/learning');
  const promptLearning = page
    .locator('.learning-source')
    .filter({ hasText: '생성형 AI 실전: Prompt와 Context Engineering' });
  await expect(promptLearning).toBeVisible();
  const promptToggle = promptLearning.getByRole('button', { name: '펼치기' });
  if (await promptToggle.isVisible()) await promptToggle.click();
  await promptLearning
    .getByRole('button', { name: /내용 보기/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(220);
  await page.screenshot({
    path: 'test-results/visual/learning-module-mobile-375.png',
    fullPage: false,
  });
  await page.getByRole('button', { name: '닫기' }).click();

  await page.goto('/coding');
  const daily = page.getByRole('region', { name: '오늘의 추천 문제' });
  await expect(daily.locator('article')).toHaveCount(3);
  await expect(daily.getByRole('link', { name: /문제 열기/ })).toHaveCount(3);
  await expect(daily.getByRole('button', { name: /즐겨찾기/ })).toHaveCount(3);
  await page.screenshot({
    path: 'test-results/visual/coding-recommendations-mobile-375.png',
    fullPage: false,
  });
});

test('keeps registration out of the calendar on desktop and mobile', async ({ page }) => {
  await mkdir('test-results/visual', { recursive: true });
  await login(page, 'calendar-label@careerground.local');

  for (const viewport of [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'mobile-375', width: 375, height: 812 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/jobs');
    await expect(page.getByRole('searchbox', { name: '회사명 검색' })).toBeVisible();
    await page.getByRole('button', { name: '달력' }).click();
    await expect(page.getByRole('region', { name: /신입 채용 달력/ })).toBeVisible();
    await expect(page.locator('.job-calendar-legend')).not.toContainText('등록일');
    await expect(page.locator('.job-calendar-legend')).toContainText('접수 시작일');
    await expect(page.getByText('시작·확인일', { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: `test-results/visual/jobs-calendar-label-${viewport.name}.png`,
      fullPage: false,
    });
  }
});

test('stacks the three daily recommendations without wrapping their titles', async ({ page }) => {
  await mkdir('test-results/visual', { recursive: true });
  await login(page, 'daily-layout@careerground.local');

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
    await page.screenshot({
      path: `test-results/visual/home-daily-vertical-${viewport.name}.png`,
      fullPage: false,
    });
  }
});

test('reflows at 200% equivalent width and keeps the coding catalog usable on narrow screens', async ({
  page,
}) => {
  await login(page, 'visual-accessibility@careerground.local');
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();
  await expect(page.getByRole('button', { name: '변경', exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/coding');
  await expect(page.getByRole('region', { name: '오늘의 추천 문제' })).toBeVisible();
  await expect(page.getByRole('button', { name: '전체 문제', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '즐겨찾기', exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.getByRole('region', { name: '오늘의 추천 문제' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await expectNoSeriousViolations(page);
});
