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
] as const;

export const EXPECTED_SCHEMA_VERSION = '0037_careerground_jobs_v5_workflow';
export const EXPECTED_SCHEMA_CHECKSUM =
  'sha256:ca8661ea422f28bb15cf9a9dc7302c8fb15c3668c3224a8b2f8a5691d0354caf';
