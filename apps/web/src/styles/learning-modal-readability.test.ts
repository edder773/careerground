import { describe, expect, it } from 'vitest';
import styles from '../styles.css?raw';

describe('learning modal readability contract', () => {
  it('uses a large desktop reading surface and legible type', () => {
    expect(styles).toContain('width: min(1040px, calc(100vw - 48px));');
    expect(styles).toContain('height: min(880px, calc(100dvh - 48px));');
    expect(styles).toMatch(/\.learning-markdown\s*\{[^}]*font-size:\s*16px;/s);
    expect(styles).toMatch(/\.learning-unit-modal header h2\s*\{[^}]*font-size:\s*30px;/s);
    expect(styles).toMatch(
      /\.learning-unit-modal header button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s,
    );
    expect(styles).toMatch(/\.learning-flashcards summary,[\s\S]*?font-size:\s*15px;/);
  });

  it('fills a 375px mobile viewport without shrinking the reading type', () => {
    expect(styles).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.learning-unit-modal\s*\{[^}]*width:\s*100%;[^}]*height:\s*100dvh;[^}]*max-height:\s*100dvh;/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.learning-unit-modal header h2\s*\{[^}]*font-size:\s*23px;/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.learning-modal-content\s*\{[^}]*padding:\s*22px 20px 32px;/,
    );
  });
});
