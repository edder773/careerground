import { defineConfig, devices } from '@playwright/test';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://careerground:careerground@127.0.0.1:5432/careerground?schema=public';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  expect: { timeout: 10_000 },
  timeout: 45_000,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @careerground/api dev',
      url: 'http://127.0.0.1:4000/api/v1/health/ready',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        WEB_ORIGIN: 'http://127.0.0.1:5173',
        JWT_ACCESS_SECRET: 'e2e-access-secret-with-at-least-32-characters',
        JWT_REFRESH_SECRET: 'e2e-refresh-secret-with-at-least-32-characters',
        INTERNAL_SERVICE_SECRET: 'e2e-internal-secret-with-at-least-32-characters',
        COOKIE_SECURE: 'false',
        MAX_ACTIVE_USERS: '100',
      },
    },
    {
      command: 'pnpm --filter @careerground/web dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_URL: 'http://127.0.0.1:4000/api/v1',
      },
    },
  ],
});
