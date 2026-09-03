import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const source = (path: string) => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
const jobsCss = source(`${repositoryRoot}apps/web/src/styles/jobs.css`);
const shellCss = source(`${repositoryRoot}apps/web/src/styles/shell.css`);
const shell = source(`${repositoryRoot}apps/web/src/components/AppShell.tsx`);
const jobs = source(`${repositoryRoot}apps/web/src/pages/JobsPage.tsx`);

describe('recruitment-first responsive contracts', () => {
  it('keeps the large desktop calendar and the four-destination shell explicit', () => {
    expect(jobs).toContain("searchParams.get('view') === 'list' ? 'list' : 'calendar'");
    expect(jobsCss).toContain('.jobs-calendar-home .calendar-day');
    expect(jobsCss).toContain('min-height: 132px;');
    expect(shell).toContain("{ to: '/', label: '채용공고'");
    expect(shell).toContain("{ to: '/coding', label: '코딩테스트'");
    expect(shell).toContain("{ to: '/favorites', label: '즐겨찾기'");
    expect(shell).toContain("label: '자격증'");
    expect(shell).not.toContain("label: '학습'");
    expect(shell).not.toContain('전체 검색');
  });

  it('keeps the 375×812 mobile calendar scrollable inside the workspace', () => {
    const mobile = jobsCss.slice(jobsCss.lastIndexOf('@media (max-width: 640px)'));
    expect(jobsCss).toContain('.job-calendar-scroll {\n  overflow-x: auto;');
    expect(mobile).toContain('min-width: 760px;');
    expect(jobsCss).toContain('.jobs-calendar-home .calendar-day {\n    min-height: 118px;');
    expect(shellCss).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
  });
});
