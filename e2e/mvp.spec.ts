import { expect, test } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('CareerGround MVP vertical slices', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('OpenAI-only authentication and common Finder workspace load', async ({ page }) => {
    await expect(page.getByText('CareerGround', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeVisible();
    await expect(page.getByRole('button', { name: '검색' })).toBeVisible();
    await logout(page);
    await expect(page.getByRole('link', { name: 'OpenAI 계정으로 계속' })).toBeVisible();
    await expect(page.getByLabel('이메일')).toHaveCount(0);
    await expect(page.getByLabel('비밀번호')).toHaveCount(0);
  });

  test('first login requires a name and one of four code languages', async ({ page }) => {
    await logout(page);
    const email = `onboarding-${Date.now()}@example.com`;
    await page.context().setExtraHTTPHeaders({
      'oai-authenticated-user-id': `e2e:${email}`,
      'oai-authenticated-user-email': email,
      'oai-authenticated-user-full-name': 'OpenAI%20User',
      'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '어떻게 불러드릴까요?' })).toBeVisible();
    await expect(page.locator('input[name="preferredLanguage"]')).toHaveCount(4);
    await expect(page.getByRole('button', { name: /내 작업대 시작하기/ })).toBeDisabled();
    await page.getByLabel('이름').fill('첫 가입자');
    await page.getByLabel('C++').check();
    await page.getByRole('button', { name: /내 작업대 시작하기/ }).click();
    await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
  });

  test('creates, renames, and adds a link to a personal folder', async ({ page }) => {
    const suffix = Date.now().toString().slice(-7);
    const initialName = `E2E 폴더 ${suffix}`;
    const renamed = `검증 폴더 ${suffix}`;
    await page.getByRole('button', { name: '새 폴더' }).click();
    await page.getByLabel('폴더 이름').fill(initialName);
    await page.getByRole('button', { name: '만들기' }).click();
    const folderCard = page.locator('.folder-card').filter({ hasText: initialName });
    await expect(folderCard).toBeVisible();

    await folderCard.click();
    await page.getByRole('button', { name: '이름 변경' }).click();
    await page.getByLabel('새 폴더 이름').fill(renamed);
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByRole('heading', { name: renamed })).toBeVisible();

    await page.getByRole('button', { name: '링크 추가' }).click();
    await page.getByLabel('외부 링크').fill('https://example.com/e2e');
    await page.getByLabel('표시 이름').fill('E2E 참고 링크');
    await page.getByRole('button', { name: '추가', exact: true }).click();
    await expect(page.getByText('E2E 참고 링크')).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/jobs$/),
      page.getByRole('link', { name: '채용공고' }).first().click(),
    ]);
    await expect(page.getByRole('heading', { name: '신입 IT 채용공고' })).toBeVisible();
    await page.getByRole('button', { name: '폴더에 저장' }).first().click();
    await page
      .getByRole('dialog', { name: /저장할 폴더 선택/ })
      .getByRole('button', { name: renamed })
      .click();
    await expect(page.getByRole('button', { name: `${renamed}에 저장됨` }).first()).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/coding$/),
      page.getByRole('link', { name: '코딩테스트' }).first().click(),
    ]);
    await expect(page.getByRole('heading', { name: '코딩테스트' })).toBeVisible();
    await page.getByRole('button', { name: '폴더에 저장' }).first().click();
    await page
      .getByRole('dialog', { name: /저장할 폴더 선택/ })
      .getByRole('button', { name: renamed })
      .click();
    await expect(page.getByRole('button', { name: `${renamed}에 저장됨` }).first()).toBeVisible();
  });

  test('filters problems and records a member-visible solution', async ({ page }) => {
    await page.getByRole('link', { name: '코딩테스트' }).first().click();
    await expect(page.getByRole('heading', { name: '코딩테스트' })).toBeVisible();
    const dailySection = page.getByRole('region', { name: '오늘의 문제' });
    await expect(dailySection.locator('article')).toHaveCount(3);
    await expect(dailySection.getByText(/오늘 두 문제|오늘의 두 문제/)).toHaveCount(0);
    await expect(dailySection.getByText('Lv. 1', { exact: true })).toBeVisible();
    await expect(dailySection.getByText('Lv. 2', { exact: true })).toBeVisible();
    await expect(dailySection.getByText(/SQL · Lv\. [34]/)).toBeVisible();
    await expect(dailySection.getByRole('link', { name: '다른 풀이 보기' })).toHaveCount(3);
    const record = dailySection.getByRole('button', { name: '풀이 기록' }).first();
    await expect(record).toBeVisible();
    await record.click();
    await expect(page.getByRole('dialog', { name: /.+/ })).toBeVisible();
    const description = `다른 멤버 공개 검증 ${Date.now()}`;
    await page.getByLabel('언어').selectOption('javascript');
    await page.locator('.cm-content').fill('function solution(value) { return value; }');
    await page.getByLabel('풀이 설명').fill(description);
    await page.getByRole('button', { name: '해결 기록 저장' }).click();
    await expect(page.locator('.editor-panel')).toBeHidden();

    await dailySection.getByRole('link', { name: '다른 풀이 보기' }).first().click();
    await expect(page).toHaveURL(/\/solutions\?problemId=/);
    await expect(page.getByRole('heading', { name: /다른 풀이/ })).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();

    await logout(page);
    await login(page, `solution-reader-${Date.now()}@example.com`);
    await page.getByRole('link', { name: '풀이 기록' }).first().click();
    await expect(page.getByText(description)).toBeVisible();
  });

  test('reacts to a solution record and adds a comment', async ({ page }) => {
    await page.getByRole('link', { name: '풀이 기록' }).first().click();
    await expect(page.getByRole('heading', { name: '풀이 기록' })).toBeVisible();
    await page
      .getByRole('button', { name: /유용해요/ })
      .first()
      .click();
    await page.getByRole('button', { name: '댓글 남기기' }).first().click();
    await page.getByLabel('댓글').fill(`E2E 댓글 ${Date.now()}`);
    await page.getByRole('button', { name: '등록' }).click();
    await expect(page.getByRole('button', { name: '댓글 남기기' }).first()).toBeVisible();
  });

  test('filters and saves an entry-level IT job', async ({ page }) => {
    await page.getByRole('link', { name: '채용공고' }).first().click();
    await expect(page.getByRole('heading', { name: '신입 IT 채용공고' })).toBeVisible();
    await page.getByRole('button', { name: /^채용공고 필터/ }).click();
    const filterDialog = page.getByRole('dialog', { name: '채용공고 전체 필터' });
    await filterDialog.getByRole('checkbox', { name: '대기업' }).check();
    await filterDialog.getByRole('checkbox', { name: '중견기업' }).check();
    await expect(filterDialog.getByText('2개 조건 적용')).toBeVisible();
    await filterDialog.getByRole('checkbox', { name: '중견기업' }).uncheck();
    await filterDialog.getByRole('button', { name: '1개 조건 적용' }).click();
    const save = page.getByRole('button', { name: /관심 저장|관심 공고/ }).first();
    await expect(save).toBeVisible();
    await save.click();
    await expect(page.getByRole('button', { name: '관심 공고' }).first()).toBeVisible();
    const status = page.getByLabel(/지원 상태/).first();
    await status.selectOption('APPLIED');
    await expect(status).toHaveValue('APPLIED');

    await page.getByRole('button', { name: /^채용공고 필터/ }).click();
    await filterDialog.getByRole('button', { name: '전체 해제' }).click();
    expect(await filterDialog.getByRole('checkbox').count()).toBeGreaterThan(4);
    await filterDialog.getByRole('button', { name: '전체 공고 보기' }).click();
    await page
      .getByRole('group', { name: '채용공고 정렬' })
      .getByRole('button', {
        name: '마감 임박순',
      })
      .click();
    await expect(
      page
        .getByRole('group', { name: '채용공고 정렬' })
        .getByRole('button', { name: '마감 임박순' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page
      .getByRole('group', { name: '채용공고 글자 크기' })
      .getByRole('button', { name: '크게', exact: true })
      .click();
    await expect(page.locator('.jobs-page')).toHaveAttribute('data-font-size', 'large');
    await page.getByRole('button', { name: '달력' }).click();
    await expect(page.getByRole('region', { name: /신입 채용 달력/ })).toBeVisible();
    await expect(page.locator('.calendar-job strong').first()).toBeVisible();
  });

  test('opens learning content directly without an understanding rating', async ({ page }) => {
    await page.getByRole('link', { name: '학습' }).first().click();
    await expect(page.getByRole('heading', { name: '학습 라이브러리' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '데이터 분석 기초: 변수에서 가설검정까지' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '데이터 관계 읽기: 상관과 회귀' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '개발 입문: Git, 환경 구성, AI 코딩' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /학습 시작/ })).toHaveCount(0);
    await expect(page.getByText('학습 전')).toHaveCount(0);
    await page
      .getByRole('button', { name: /내용 보기/ })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('이 단원을 얼마나 이해했나요?')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /이해도 [1-5]점/ })).toHaveCount(0);
    await page.getByRole('button', { name: '닫기' }).click();
  });

  test('shows dense ranking calculation details', async ({ page }) => {
    await page.getByRole('link', { name: '랭킹' }).first().click();
    await expect(page.getByRole('table', { name: '코딩 랭킹' })).toBeVisible();
    await expect(page.getByText('동점은 같은 순위로 표시합니다.')).toBeVisible();
    await expect(page.getByText(/모든 멤버.*자동 계산/)).toBeVisible();
  });

  test('profile settings begin read-only and expose an explicit change action', async ({
    page,
  }) => {
    await page.getByRole('link', { name: '설정' }).first().click();
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();
    const displayName = page.getByLabel('표시 이름');
    await expect(displayName).toBeDisabled();
    await expect(page.getByRole('button', { name: '변경', exact: true })).toBeVisible();
    await expect(page.getByText(/데이터 JSON 내보내기|데이터 삭제 요청/)).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: /랭킹/ })).toHaveCount(0);
    await page.getByRole('button', { name: '변경', exact: true }).click();
    await expect(displayName).toBeEnabled();
    await expect(page.getByRole('button', { name: '변경 저장' })).toBeVisible();
    await page.getByRole('button', { name: '취소' }).click();
    await expect(displayName).toBeDisabled();
  });

  test('searches across the workspace and marks notifications read', async ({ page }) => {
    await page.getByRole('button', { name: '검색' }).click();
    await page.getByPlaceholder('폴더, 공고, 문제, 풀이, 학습자료…').fill('백엔드');
    await expect(page.getByText(/개 결과/)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: '알림' }).first().click();
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible();
    await page.getByRole('button', { name: '모두 읽음' }).click();
  });

  test('admin previews and commits structured job and learning imports without crawling', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '로그아웃' }).click();
    await login(page, 'admin@careerground.local');
    await page.getByRole('link', { name: '관리자' }).first().click();
    await expect(page.getByRole('heading', { name: '관리자 센터' })).toBeVisible();
    await expect(page.getByText('AI 학습 처리', { exact: true })).toHaveCount(0);
    const now = new Date().toISOString();
    const companyName = `E2E 회사 ${Date.now()}`;
    const payload = {
      version: '1.0',
      collectedAt: now,
      sourceCount: 1,
      items: [
        {
          sourceName: 'e2e-fixture',
          sourceUrl: `https://example.com/jobs/${Date.now()}`,
          companyName,
          title: '신입 백엔드 개발자',
          category: '백엔드',
          careerScope: 'NEW_GRAD_ONLY',
          careerEvidence: '신입 지원 가능',
          companySize: 'SMALL',
          companySizeEvidence: 'E2E fixture evidence',
          employmentType: 'FULL_TIME',
          region: '서울',
          remote: false,
          techStack: ['TypeScript'],
          rolling: true,
          collectedAt: now,
          lastVerifiedAt: now,
          summary: 'E2E preview fixture',
          status: 'ACTIVE',
        },
      ],
    };
    await page.getByPlaceholder('job import schema JSON').fill(JSON.stringify(payload));
    await page.getByRole('button', { name: '미리보기', exact: true }).first().click();
    await expect(page.locator('.preview-json')).toContainText('E2E 회사');
    const jobCommit = page.waitForResponse(
      (response) =>
        response.url().endsWith('/jobs/import/commit') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '승인 반영', exact: true }).first().click();
    expect((await jobCommit).ok()).toBe(true);
    await expect(page.getByRole('status')).toContainText('반영이 완료');

    await page.getByRole('link', { name: '채용공고' }).first().click();
    await page.getByRole('button', { name: /^채용공고 필터/ }).click();
    const jobFilter = page.getByRole('dialog', { name: '채용공고 전체 필터' });
    await jobFilter.getByRole('checkbox', { name: '중소기업' }).check();
    await jobFilter.getByRole('button', { name: '1개 조건 적용' }).click();
    await expect(page.getByText(companyName, { exact: true })).toBeVisible();

    await page.getByRole('link', { name: '관리자' }).first().click();
    const learningTitle = `E2E 학습자료 ${Date.now()}`;
    const learningPayload = {
      version: '1.0',
      source: {
        title: learningTitle,
        subject: '컴퓨터 과학',
        category: 'E2E',
        sourceVersion: '1',
        checksum: Date.now().toString(16).padStart(64, '0'),
      },
      units: [
        {
          anchor: 'e2e:unit:1',
          title: 'E2E 학습 단위',
          summaryMarkdown: '근거 anchor가 있는 테스트 학습 단위입니다.',
          concepts: ['idempotency'],
          flashcards: [{ front: 'idempotency란?', back: '같은 요청을 반복해도 결과가 같다.' }],
          questions: [{ type: 'SHORT_ANSWER', prompt: '핵심은?', answer: '반복 안전성' }],
        },
      ],
    };
    await page
      .getByPlaceholder('learning import schema JSON')
      .fill(JSON.stringify(learningPayload));
    await page.getByRole('button', { name: '미리보기', exact: true }).nth(1).click();
    await expect(page.locator('.preview-json')).toContainText(learningTitle);
    const learningCommit = page.waitForResponse(
      (response) =>
        response.url().endsWith('/learning/import/commit') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '승인 반영', exact: true }).nth(1).click();
    expect((await learningCommit).ok()).toBe(true);
    await page.getByRole('link', { name: '학습' }).first().click();
    await expect(page.getByRole('heading', { name: learningTitle })).toBeVisible();
  });

  test('OpenAI first login provisions a MEMBER and MEMBER cannot open admin', async ({ page }) => {
    await logout(page);
    await login(page, 'admin@careerground.local');
    await page.getByRole('link', { name: '관리자' }).first().click();
    await expect(page.getByRole('heading', { name: 'OpenAI 멤버' })).toBeVisible();
    await logout(page);
    await login(page, `openai-member-${Date.now()}@example.com`);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: '내 폴더', level: 1 })).toBeVisible();
  });
});
