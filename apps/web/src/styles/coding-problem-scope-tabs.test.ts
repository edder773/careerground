import { describe, expect, it } from 'vitest';
import styles from './foundation.css?raw';

describe('coding problem scope tabs layout', () => {
  it('keeps the desktop tabs readable at 1440x900', () => {
    expect(styles).toMatch(
      /\.problem-scope-tabs \{[\s\S]*?width: fit-content;[\s\S]*?margin: 0 0 12px;/,
    );
    expect(styles).toMatch(
      /\.problem-scope-tabs button \{[\s\S]*?min-width: 132px;[\s\S]*?min-height: 40px;[\s\S]*?font-size: 12px;/,
    );
  });

  it('uses equal full-width tabs at 375x812', () => {
    expect(styles).toMatch(
      /@media \(max-width: 760px\) \{[\s\S]*?\.problem-scope-tabs \{[\s\S]*?width: 100%;[\s\S]*?\.problem-scope-tabs button \{[\s\S]*?min-width: 0;[\s\S]*?flex: 1;/,
    );
  });
});
