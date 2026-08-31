export const PRODUCTION_MIGRATION_FLOOR = 25;

export const PRODUCTION_MIGRATIONS = [
  '0025_automation_job_refresh_baseline.sql',
  '0026_reconcile_job_catalog_20260821.sql',
  '0027_add_company_backstop_jobs_20260821.sql',
  '0028_add_approved_rescan_jobs_20260821.sql',
  '0028_promote_primary_admin.sql',
  '0029_expand_learning_catalog_20260821.sql',
  '0030_reconcile_job_catalog_20260824.sql',
  '0031_import_verified_library_jobs_20260824.sql',
  '0032_import_library_jobs_20260825.sql',
  '0033_fix_sql_problem_classification_20260825.sql',
  '0034_migration_authority_and_delivery_integrity.sql',
  '0035_sync_validator_jobs_20260825.sql',
  '0036_sync_validator_jobs_20260826.sql',
  '0037_careerground_jobs_v5_workflow.sql',
  '0038_slack_digest_delivery_history.sql',
] as const;

export const EXPECTED_SCHEMA_VERSION = '0038_slack_digest_delivery_history';
export const EXPECTED_SCHEMA_CHECKSUM =
  'sha256:7ced2b9151cbeeb97cd51079893afa7fdfa7da4031519a3e46b8a2360c8e015a';
