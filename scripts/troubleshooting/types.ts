export type EvidenceManifest = {
  schemaVersion: '1.0';
  pr: string;
  collectedAt: string;
  repository: { baseSha: string | null; headSha: string | null; branch: string | null };
  changedFiles: Array<{ path: string; added: number; deleted: number }>;
  checks: Array<{
    name: string;
    status: 'passed' | 'failed' | 'not-run';
    command: string;
    summary: string;
  }>;
  bundle: Array<{ path: string; bytes: number }>;
  screenshots: Array<{ path: string; viewport: string; phase: 'before' | 'after' | 'diff' }>;
  benchmark: { status: 'not-applicable' | 'collected'; p50Ms?: number; p95Ms?: number };
  privacy: { scannedFiles: number; findings: string[]; redacted: boolean };
  notes: string[];
};

export type GeneratedDocuments = {
  title: string;
  slug: string;
  technicalMarkdown: string;
  publicBlogMarkdown: string;
  tags: string[];
  claims: string[];
};

export interface TroubleshootingProvider {
  readonly name: string;
  generate(
    manifest: EvidenceManifest,
    options: { publicBlog: boolean },
  ): Promise<GeneratedDocuments>;
}
