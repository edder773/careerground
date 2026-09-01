import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('.github/workflows/careerground-jobs-v5.yml', 'utf8');
const handoff = readFileSync('.github/workflows/careerground-v5-handoff.yml', 'utf8');
const migration = readFileSync('drizzle/0037_careerground_jobs_v5_workflow.sql', 'utf8').replaceAll(
  '\r\n',
  '\n',
);
const deliveryMigration = readFileSync(
  'drizzle/0038_slack_digest_delivery_history.sql',
  'utf8',
).replaceAll('\r\n', '\n');
const collectorPrompt = readFileSync(
  'docs/operations/careerground-v5-stable-collector-prompts.md',
  'utf8',
);

describe('CareerGround v5 workflow pre-cutover policy', () => {
  it('is manual-only until schedule activation is approved', () => {
    expect(source).toContain('workflow_dispatch:');
    expect(source).not.toMatch(/^\s+schedule:/mu);
    expect(source).toContain('18:00 Asia/Seoul');
  });

  it('runs partitions independently and blocks publish after any collection failure', () => {
    expect(source).toContain('fail-fast: false');
    expect(source).toContain('partition: [1, 2, 3]');
    expect(source).toContain('needs: [preflight, validate]');
    expect(source).toContain("github.ref == 'refs/heads/main'");
    expect(source).toContain('inputs.approvedRunId == needs.preflight.outputs.run_id');
  });

  it('always records notify state but contains no Slack transport or secret', () => {
    expect(source).toMatch(/notify:[\s\S]+if: always\(\)/u);
    expect(source).not.toContain('SLACK_WEBHOOK_URL');
    expect(source).not.toContain('hooks.slack.com/services');
    expect(source).toContain('slackSent');
  });

  it('refuses real collection while the external collector is unavailable', () => {
    expect(source).toContain('External partition collector is MANUAL_REQUIRED');
    expect(source).toContain("if: inputs.mode != 'DRY_RUN'");
  });

  it('keeps the forward migration checksum and protected-table policy consistent', () => {
    const ddl = migration.split('INSERT INTO `app_schema_migrations`')[0];
    const checksum = createHash('sha256').update(ddl).digest('hex');
    expect(migration).toContain(`sha256:${checksum}`);
    expect(migration).not.toMatch(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?`?saved_jobs/iu);
    expect(migration).not.toMatch(/DELETE\s+FROM\s+`?jobs/iu);
  });

  it('persists Slack delivery item identities with a verified forward migration', () => {
    const ddl = deliveryMigration.split('INSERT INTO `app_schema_migrations`')[0];
    const checksum = createHash('sha256').update(ddl).digest('hex');
    expect(deliveryMigration).toContain(`sha256:${checksum}`);
    expect(deliveryMigration).toContain('CREATE TABLE `slack_digest_items`');
    expect(deliveryMigration).not.toMatch(/DELETE\s+FROM/iu);
  });

  it('accepts only trusted issue pointers, publishes through the protected endpoint, and never sends Slack', () => {
    expect(handoff).toContain('issues:');
    expect(handoff).toContain('types: [opened, reopened]');
    expect(handoff).toContain("github.event.issue.author_association == 'OWNER'");
    expect(handoff).toContain("github.event.issue.author_association == 'MEMBER'");
    expect(handoff).toContain("github.event.issue.author_association == 'COLLABORATOR'");
    expect(handoff).toContain('careerground-v5-handoff');
    expect(handoff).toContain('jobs:v5:adapt-v4');
    expect(handoff).toContain('jobs:v5:validate-discovery');
    expect(handoff).toContain('jobs:v5:publish-discovery');
    expect(handoff).toContain('CAREERGROUND_PUBLISH_TOKEN');
    expect(handoff).toContain('/api/v1/internal/jobs-v5/publish');
    expect(handoff).toContain("handoff_schema_version == '2.0'");
    expect(handoff).toContain("event_type: 'jobs-v5-published'");
    expect(handoff).not.toContain('SLACK_WEBHOOK_URL');
    expect(handoff).not.toContain('DIGEST_API_TOKEN');
    expect(handoff).not.toMatch(/^\s+schedule:/mu);
    expect(handoff.indexOf('jobs:v5:publish-discovery')).toBeLessThan(
      handoff.indexOf('jobs:v5:handoff mark-processed'),
    );
  });

  it('requires a canonical enum audit before the collector creates a GitHub handoff', () => {
    const auditIndex = collectorPrompt.indexOf('GitHub 전달 전에');
    const handoffIndex = collectorPrompt.indexOf('[5. GitHub 자동 전달]');
    expect(auditIndex).toBeGreaterThan(0);
    expect(auditIndex).toBeLessThan(handoffIndex);
    expect(collectorPrompt).toContain('MIDSIZE_ENTERPRISE');
    expect(collectorPrompt).toContain('companySize에는 반드시 `MID`만 기록');
    expect(collectorPrompt).toContain('허용 목록 밖의 enum이 하나라도 있으면');
  });
});
