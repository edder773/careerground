import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const normalizedSource = (path: string) => readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
const css = normalizedSource(`${repositoryRoot}apps/web/src/styles.css`);
const home = normalizedSource(`${repositoryRoot}apps/web/src/pages/HomePage.tsx`);
const learning = normalizedSource(`${repositoryRoot}apps/web/src/pages/LearningPage.tsx`);
const settings = normalizedSource(`${repositoryRoot}apps/web/src/pages/SettingsPage.tsx`);
const polish = css.slice(css.indexOf('/* Cohesive UI polish'));

describe('UI polish responsive contracts', () => {
  it('keeps the 1440×900 desktop hierarchy explicit', () => {
    expect(polish).toContain(
      'grid-template-columns: minmax(460px, 1.8fr) repeat(3, minmax(132px, 0.55fr))',
    );
    expect(polish).toContain('grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr)');
    expect(polish).toContain('.jobs-page .job-actions {\n  width: 132px;');
    expect(home).toContain('className="today-summary-link"');
    expect(home).toContain('className="virtual-folders"');
    expect(learning).toContain('className="learning-due-copy"');
    expect(settings).toContain('className="settings-profile-summary"');
  });

  it('keeps the 375×812 mobile reflow explicit', () => {
    const mobile = polish.slice(polish.indexOf('@media (max-width: 640px)'));
    expect(mobile).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(mobile).toContain('grid-column: 1 / -1');
    expect(mobile).toContain('.virtual-folders {\n    grid-template-columns: 1fr;');
    expect(mobile).toContain('.settings-profile-summary > div {\n    grid-template-columns: 1fr;');
    expect(mobile).toContain('.jobs-page .job-actions {\n    grid-template-columns: 1fr;');
  });
});
