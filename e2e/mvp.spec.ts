import { expect, test } from '@playwright/test';

test.describe('CareerGround public catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '즐겨찾기', level: 1 })).toBeVisible();
  });

  test('opens the Finder workspace without login or settings', async ({ page }) => {
    await expect(page.getByText('CareerGround', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeVisible();
    await expect(page.getByRole('button', { name: '검색' })).toBeVisible();
    await expect(page.getByText(/로그인|Google 계정/)).toHaveCount(0);
    await expect(page.getByRole('link', { name: '설정' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '로그아웃' })).toHaveCount(0);
    await expect(page.locator('.today-problem-list a')).toHaveCount(3);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });

  test('stores coding favorites on the current device', async ({ page }) => {
    await page.getByRole('link', { name: '코딩테스트' }).first().click();
    await expect(page.getByRole('heading', { name: '코딩테스트' })).toBeVisible();
    const firstProblem = page.locator('.problem-grid article').first();
    const title = await firstProblem.getByRole('heading').innerText();
    const favoriteButton = firstProblem.getByRole('button', { name: /즐겨찾기/ });
    if ((await favoriteButton.getAttribute('aria-pressed')) !== 'true')
      await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await page.getByRole('button', { name: '즐겨찾기', exact: true }).click();
    await expect(page.locator('.problem-grid article').filter({ hasText: title })).toBeVisible();

    await page.getByRole('link', { name: '홈' }).first().click();
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
    await expect(page.getByRole('link', { name: '알림' })).toHaveCount(0);

    await page.goto('/solutions');
    await expect(page).toHaveURL(/\/coding$/);
    await page.goto('/rankings');
    await expect(page).toHaveURL(/\/coding$/);
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/$/);
  });

  test('filters jobs and stores an interest marker without account data', async ({ page }) => {
    await page.getByRole('link', { name: '채용공고' }).first().click();
    await expect(page.getByRole('heading', { name: '신입 IT 채용공고' })).toBeVisible();
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
    await expect(filter).toBeHidden();
    await page.reload();
    await expect(page.getByRole('heading', { name: '신입 IT 채용공고' })).toBeVisible();
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
    await expect(page.getByLabel(/지원 상태|지원 메모/)).toHaveCount(0);

    await page.goto('/jobs?saved=1');
    await expect(page.locator(`#${firstCardId}`)).toBeVisible();
    await expect(
      page.locator(`#${firstCardId}`).getByRole('button', { name: '관심 공고' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('opens learning content without account progress controls', async ({ page }) => {
    await page.getByRole('link', { name: '학습' }).first().click();
    await expect(page.getByRole('heading', { name: '학습 라이브러리' })).toBeVisible();
    await page
      .getByRole('button', { name: /내용 보기/ })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: /학습 완료|완료 상태/ })).toHaveCount(0);
    await expect(page.getByText(/이전 시도|학습 전/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /즐겨찾기/ })).toBeVisible();
  });

  test('searches public jobs, problems, and learning material', async ({ page }) => {
    await page.getByRole('button', { name: '검색' }).click();
    await page.getByPlaceholder('폴더, 공고, 문제, 학습자료…').fill('백엔드');
    await expect(page.getByText(/개 결과/)).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
