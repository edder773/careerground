import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const handoff = readFileSync('.github/workflows/careerground-v5-handoff.yml', 'utf8');
const handoffReceiver = readFileSync('scripts/jobs-v5/handoff.mjs', 'utf8');
const migration = readFileSync('drizzle/0037_careerground_jobs_v5_workflow.sql', 'utf8').replaceAll(
  '\r\n',
  '\n',
);
const deliveryMigration = readFileSync(
  'drizzle/0038_slack_digest_delivery_history.sql',
  'utf8',
).replaceAll('\r\n', '\n');
const retirementMigration = readFileSync(
  'drizzle/0039_retire_legacy_product_surface.sql',
  'utf8',
).replaceAll('\r\n', '\n');
const collectorPrompt = readFileSync(
  'docs/operations/careerground-v5-stable-collector-prompts.md',
  'utf8',
);

describe('CareerGround v5 production workflow policy', () => {
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

  it('retires only the unused product schema with a verified forward migration', () => {
    const ddl = retirementMigration.split('INSERT INTO `app_schema_migrations`')[0];
    const checksum = createHash('sha256').update(ddl).digest('hex');
    const droppedTables = [...ddl.matchAll(/DROP TABLE IF EXISTS `([^`]+)`/gu)].map(
      (match) => match[1],
    );

    expect(retirementMigration).toContain(`sha256:${checksum}`);
    expect(droppedTables).toEqual([
      'workspace_search',
      'daily_challenge_participations',
      'solution_comments',
      'solution_reactions',
      'solution_revisions',
      'solutions',
      'collection_items',
      'collections',
      'auth_sessions',
      'auth_identities',
      'problem_progress',
      'saved_jobs',
      'learning_question_attempts',
      'learning_review_events',
      'learning_progress',
      'flashcards',
      'learning_questions',
      'learning_units',
      'learning_sources',
      'notifications',
      'request_rate_limits',
      'audit_logs',
      'import_previews',
      'job_source_snapshot_items',
      'job_source_snapshots',
      'scheduler_leases',
      'users',
    ]);
    expect(droppedTables).not.toEqual(
      expect.arrayContaining([
        'jobs',
        'job_tech_stacks',
        'coding_problems',
        'daily_challenges',
        'import_batches',
        'workflow_runs',
        'slack_digest_deliveries',
        'slack_digest_items',
      ]),
    );
  });

  it('accepts only schema 2.0 partition pointers, publishes through the protected endpoint, and never sends Slack', () => {
    expect(handoff).toContain('issues:');
    expect(handoff).toContain('types: [opened, reopened]');
    expect(handoff).toContain("github.event.issue.author_association == 'OWNER'");
    expect(handoff).toContain("github.event.issue.author_association == 'MEMBER'");
    expect(handoff).toContain("github.event.issue.author_association == 'COLLABORATOR'");
    expect(handoff).toContain('careerground-v5-handoff');
    expect(handoff).toContain('jobs:v5:validate-discovery');
    expect(handoff).toContain('jobs:v5:publish-discovery');
    expect(handoff).toContain('CAREERGROUND_PUBLISH_TOKEN');
    expect(handoff).toContain('/api/v1/internal/jobs-v5/publish');
    expect(handoff).toContain("event_type: 'jobs-v5-published'");
    expect(handoff).toContain('if: failure()');
    expect(handoff).toContain('[운영 경보] CareerGround v5 handoff 실패');
    expect(handoff).not.toContain('SLACK_WEBHOOK_URL');
    expect(handoff).not.toContain('DIGEST_API_TOKEN');
    expect(handoff).not.toContain('adapt-v4');
    expect(handoff).not.toContain('legacy-compatible');
    expect(handoff).not.toMatch(/^\s+schedule:/mu);
    expect(handoffReceiver).toContain("export const HANDOFF_SCHEMA_VERSION = '2.0'");
    expect(handoffReceiver).not.toContain('LEGACY_HANDOFF_SCHEMA_VERSION');
    expect(handoffReceiver).not.toContain('LEGACY_FINAL');
    expect(handoffReceiver).not.toContain('LEGACY_AUDIT');
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
    expect(collectorPrompt).toContain('PUBLIC_RESEARCH_INSTITUTE');
    expect(collectorPrompt).toContain('신입(공개경쟁)');
    expect(collectorPrompt).toContain('첫 오류만 확인하고 종료하지 않는다');
    expect(collectorPrompt).toContain('허용 목록 밖의 enum이 하나라도 있으면');
  });
});
