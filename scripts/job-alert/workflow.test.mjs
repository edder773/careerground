import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/job-alert.yml', 'utf8');

describe('job alert workflow', () => {
  it('keeps one-line run commands free of YAML comment markers', () => {
    // " #" starts a YAML comment and silently truncates a plain one-line command.
    const truncated = workflow.split('\n').filter((line) => /^\s+run: [^|>].*\s#/u.test(line));
    expect(truncated).toEqual([]);
  });
});
