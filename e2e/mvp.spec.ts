import { expect, test } from '@playwright/test';

test.describe('CareerGround focused public workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '채용 캘린더', level: 1 })).toBeVisible();
  });

  test('opens with the recruitment calendar and only four destinations', async ({ page }) => {
    await expect(page.getByRole('grid', { name: /채용 일정/ })).toBeVisible();
    await expect(page.getByRole('button', { name: '달력' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const navigation = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(navigation.getByRole('link')).toHaveCount(4);
    await expect(navigation).toContainText('채용공고코딩테스트자격증즐겨찾기');
    await expect(page.getByRole('button', { name: '검색' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '학습' })).toHaveCount(0);
    await expect(page.getByText(/로그인|Google 계정/)).toHaveCount(0);
  });

  test('stores coding favorites on the current device', async ({ page }) => {
    await page.getByRole('link', { name: '코딩테스트' }).first().click();
    const firstProblem = page.locator('.problem-grid article').first();
    const title = await firstProblem.getByRole('heading').innerText();
    const favoriteButton = firstProblem.getByRole('button', { name: /즐겨찾기/ });
    if ((await favoriteButton.getAttribute('aria-pressed')) !== 'true')
      await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await page.getByRole('button', { name: '즐겨찾기', exact: true }).click();
    await expect(page.locator('.problem-grid article').filter({ hasText: title })).toBeVisible();

    await page.getByRole('link', { name: '즐겨찾기' }).first().click();
    await expect(page.getByRole('heading', { name: '즐겨찾기', level: 1 })).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  test('shows recommendations and the public coding catalog only', async ({ page }) => {
    await page.getByRole('link', { name: '코딩테스트' }).first().click();
    const daily = page.getByRole('region', { name: '오늘의 추천 문제' });
    await expect(daily.locator('article')).toHaveCount(3);
    await expect(daily.getByText('Lv. 1', { exact: true })).toBeVisible();
    await expect(daily.getByText('Lv. 2', { exact: true })).toBeVisible();
    await expect(daily.getByText(/SQL · Lv\. [34]/)).toBeVisible();
    await expect(daily.getByRole('link', { name: /문제 열기/ })).toHaveCount(3);
    await expect(page.getByText(/풀이 기록|다른 풀이|코딩 랭킹/)).toHaveCount(0);
  });

  test('filters the list and stores an interest marker without account data', async ({ page }) => {
    await page.getByRole('button', { name: '목록' }).click();
    await expect(page).toHaveURL(/view=list/);
    await page.getByRole('button', { name: /^채용공고 필터/ }).click();
    const filter = page.getByRole('dialog', { name: '채용공고 전체 필터' });
    await filter.getByRole('checkbox', { name: '대기업' }).check();
    await filter.getByRole('checkbox', { name: '중견기업' }).check();
    await filter.getByRole('checkbox', { name: '백엔드', exact: true }).check();
    await filter.getByRole('button', { name: '3개 조건 적용' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.getAll('companySize'))
      .toEqual(['LARGE', 'MID']);

    await page.getByRole('button', { name: /^채용공고 필터/ }).click();
    await filter.getByRole('button', { name: '전체 해제' }).click();
    await filter.getByRole('button', { name: '전체 공고 보기' }).click();
    await expect
      .poll(() => {
        const params = new URL(page.url()).searchParams;
        return params.getAll('companySize').length + params.getAll('category').length;
      })
      .toBe(0);
    await expect(page.locator('.job-filter-chip')).toHaveCount(0);
    const firstCardId = await page.locator('.job-card').first().getAttribute('id');
    expect(firstCardId).toMatch(/^job-job-/);
    const targetId = firstCardId!.slice('job-'.length);
    const targetCard = page.locator(`#${firstCardId}`);
    await targetCard.getByRole('button', { name: '관심 저장' }).click();
    await expect
      .poll(() =>
        page.evaluate(
          (id) =>
            JSON.parse(localStorage.getItem('careerground.favorites.v1') || '[]').some(
              (item: { itemType?: string; targetId?: string }) =>
                item.itemType === 'JOB_POSTING' && item.targetId === id,
            ),
          targetId,
        ),
      )
      .toBe(true);

    await page.goto('/?saved=1&view=list');
    await expect(page.locator(`#${firstCardId}`)).toBeVisible();
    await expect(
      page.locator(`#${firstCardId}`).getByRole('button', { name: '관심 공고' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps old links usable while retired screens return to the calendar', async ({ page }) => {
    await page.goto('/jobs?view=list');
    await expect(page).toHaveURL(/\/?view=list$/);
    await expect(page.getByRole('heading', { name: '채용 캘린더' })).toBeVisible();

    await page.goto('/learning');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('grid', { name: /채용 일정/ })).toBeVisible();
  });
});
