import type { EvidenceManifest, GeneratedDocuments, TroubleshootingProvider } from './types.js';
import { redact } from './redact.js';

export class MockTroubleshootingProvider implements TroubleshootingProvider {
  readonly name = 'deterministic-mock';
  async generate(
    manifest: EvidenceManifest,
    options: { publicBlog: boolean },
  ): Promise<GeneratedDocuments> {
    const files =
      manifest.changedFiles
        .map((file) => `- \`${file.path}\`: +${file.added}/-${file.deleted}`)
        .join('\n') || '- 변경 파일 통계 없음';
    const checks =
      manifest.checks
        .map((check) => `- ${check.name}: ${check.status} — ${check.summary}`)
        .join('\n') || '- 검증 결과 없음';
    const metric =
      manifest.benchmark.status === 'collected'
        ? `p50 ${manifest.benchmark.p50Ms}ms / p95 ${manifest.benchmark.p95Ms}ms`
        : '정량 측정 불가';
    return {
      title: `PR ${manifest.pr} 근거 기반 변경 기록`,
      slug: `pr-${manifest.pr}-evidence`,
      tags: ['evidence', 'engineering'],
      claims: [`changedFiles=${manifest.changedFiles.length}`, `checks=${manifest.checks.length}`],
      technicalMarkdown: `# PR ${manifest.pr} 근거 기반 변경 기록\n\n## 현상과 영향\n\nEvidence manifest만으로는 별도 장애 현상을 확정할 수 없습니다.\n\n## 재현과 근거\n\n${files}\n\n## 검증\n\n${checks}\n\n## 지표\n\n${metric}\n\n## 회귀 방지\n\nmanifest에 기록된 검증을 동일 조건으로 반복합니다.`,
      publicBlogMarkdown: options.publicBlog
        ? `# 근거에서 시작하는 변경 기록\n\n이 글은 공개 가능한 evidence만으로 작성되었습니다. 측정되지 않은 수치나 확인되지 않은 원인은 주장하지 않습니다.\n\n## 배운 점\n\n변경 파일과 자동 검증 결과를 한 manifest에 고정하면 문서가 구현과 어긋나는 위험을 줄일 수 있습니다.\n\n## 측정\n\n${metric}`
        : '',
    };
  }
}

export class OpenAIResponsesProvider implements TroubleshootingProvider {
  readonly name = 'openai-responses';
  async generate(
    manifest: EvidenceManifest,
    options: { publicBlog: boolean },
  ): Promise<GeneratedDocuments> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TROUBLESHOOTING_MODEL;
    if (!apiKey || !model)
      throw new Error('OPENAI_API_KEY와 OPENAI_TROUBLESHOOTING_MODEL이 필요합니다.');
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
        technicalMarkdown: { type: 'string' },
        publicBlogMarkdown: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        claims: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'slug', 'technicalMarkdown', 'publicBlogMarkdown', 'tags', 'claims'],
    };
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content:
              'Generate Korean troubleshooting documentation using only facts in the evidence manifest. Never invent a metric, root cause, or test result. Redact private identifiers. If measurement is absent, write 정량 측정 불가.',
          },
          {
            role: 'user',
            content: redact(JSON.stringify({ publicBlog: options.publicBlog, manifest })),
          },
        ],
        text: {
          format: { type: 'json_schema', name: 'troubleshooting_documents', strict: true, schema },
        },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI Responses API failed: ${response.status}`);
    const body = (await response.json()) as {
      status?: string;
      output?: Array<{
        type?: string;
        content?: Array<{ type?: string; text?: string; refusal?: string }>;
      }>;
    };
    if (body.status === 'incomplete') throw new Error('OpenAI response was incomplete');
    const content = body.output?.flatMap((item) => item.content || []) || [];
    const refusal = content.find((item) => item.type === 'refusal');
    if (refusal)
      throw new Error(
        `OpenAI refused the documentation request: ${refusal.refusal || 'unknown reason'}`,
      );
    const text = content.find((item) => item.type === 'output_text')?.text;
    if (!text) throw new Error('OpenAI response did not include output_text');
    return JSON.parse(text) as GeneratedDocuments;
  }
}
