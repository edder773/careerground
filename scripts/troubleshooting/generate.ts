import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { EvidenceManifest } from './types.js';
import { MockTroubleshootingProvider, OpenAIResponsesProvider } from './provider.js';

const arg = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const path = arg('--manifest');
if (!path)
  throw new Error('사용법: pnpm troubleshoot:generate --manifest <path> [--provider mock|openai]');
const manifest = JSON.parse(await readFile(path, 'utf8')) as EvidenceManifest;
const provider =
  arg('--provider') === 'openai'
    ? new OpenAIResponsesProvider()
    : new MockTroubleshootingProvider();
const publicBlog = !process.argv.includes('--no-public-doc');
const generated = await provider.generate(manifest, { publicBlog });
const date = new Date().toISOString().slice(0, 10);
const generatedByAI = provider instanceof OpenAIResponsesProvider;
const metadata = `generatedByAI: ${generatedByAI}\nmodel: ${generatedByAI ? provider.name : 'none'}\npr: ${manifest.pr}\ncommit: ${manifest.repository.headSha || 'unknown'}\nevidence: ${path}`;
const technical = `---\ntitle: ${generated.title}\ndate: ${date}\ntags: [${generated.tags.join(', ')}]\n${metadata}\n---\n\n${generated.technicalMarkdown}\n`;
await mkdir('docs/troubleshooting', { recursive: true });
await writeFile(join('docs/troubleshooting', `${date}-${generated.slug}.md`), technical);
if (publicBlog) {
  await mkdir('docs/blog', { recursive: true });
  await writeFile(
    join('docs/blog', `${date}-${generated.slug}.md`),
    `---\ntitle: ${generated.title}\ndate: ${date}\ntags: [${generated.tags.join(', ')}]\n${metadata}\n---\n\n${generated.publicBlogMarkdown}\n`,
  );
}
console.log(
  JSON.stringify(
    {
      provider: provider.name,
      technical: `docs/troubleshooting/${date}-${generated.slug}.md`,
      publicBlog,
    },
    null,
    2,
  ),
);
