import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

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
    };
  });
  expect(metrics).not.toBeNull();
  expect(Math.abs(metrics!.centerDeltaX)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(metrics!.centerDeltaY)).toBeLessThanOrEqual(0.5);
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

test('captures the calendar-first home at required viewports', async ({ page }) => {
  await mkdir('test-results/visual', { recursive: true });
  for (const viewport of [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'mobile-375', width: 375, height: 812 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '채용 캘린더', level: 1 })).toBeVisible();
    await expect(page.getByRole('grid', { name: /채용 일정/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '달력' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    if (viewport.width > 900) {
      const navigation = page.getByRole('navigation', { name: '주요 메뉴' });
      await expect(navigation.getByRole('link')).toHaveCount(4);
      await expect(navigation).toContainText('채용공고코딩테스트자격증즐겨찾기');
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/visual/home-calendar-${viewport.name}.png`,
      fullPage: false,
    });
    await expectNoSeriousViolations(page);
  }
});

test('keeps the searchable and sortable list view', async ({ page }) => {
  await mkdir('test-results/visual', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?view=list');
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
    path: 'test-results/visual/jobs-list-filter-desktop-1440.png',
    fullPage: false,
  });
  await filterDialog.getByRole('button', { name: '필터 닫기' }).click();
  await expectNoSeriousViolations(page);
});

test('opens crowded dates, rolling jobs, and job details in dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.job-calendar-legend')).not.toContainText('등록일');
  await expect(page.locator('.job-calendar-legend')).toContainText('접수 시작일');
  await page.getByRole('button', { name: /상시채용 확인하기/ }).click();
  const rollingModal = page.getByRole('dialog', { name: '상시채용 공고' });
  await expect(rollingModal).toBeVisible();
  await rollingModal.getByRole('button', { name: '닫기' }).click();
  await page.locator('.calendar-job').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({
    path: 'test-results/visual/home-calendar-modal-desktop-1440.png',
    fullPage: false,
  });
});

test('keeps the mobile calendar and filters inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: '모바일 주요 메뉴' }).getByRole('link'),
  ).toHaveCount(4);
  const calendarScroll = page.locator('.job-calendar-scroll');
  expect(
    await calendarScroll.evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
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
  await expectNoSeriousViolations(page);
});
