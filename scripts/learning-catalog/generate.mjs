import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { catalog } from './catalog-data.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, '../..');
const outputJson = resolve(rootDirectory, 'data/imports/learning_catalog_20260821.json');
const outputVisuals = resolve(rootDirectory, 'data/imports/learning_catalog_20260821_visuals.json');
const outputSql = resolve(rootDirectory, 'drizzle/0029_expand_learning_catalog_20260821.sql');
const timestamp = '2026-08-21T06:00:00.000Z';
const migrationVersion = '0029_expand_learning_catalog_20260821';

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const idSegment = (value) => value.replaceAll(/[^a-z0-9-]/g, '-');

const summary = (item) => `## 이 단원의 목표

${item.goal}

### 핵심 이론

${item.theory.map((line) => `- ${line}`).join('\n')}

### 작동 흐름

${item.theory.map((line, index) => `${index + 1}. ${line}`).join('\n')}

### 실무 적용

${item.practice}

### 실수 방지 체크

${item.pitfalls.map((line) => `- ${line}`).join('\n')}

### 학습 후 확인

- 핵심 개념을 자기 말로 설명할 수 있는가?
- 위 실무 적용을 작은 예제로 직접 재현할 수 있는가?
- 실패 조건과 검증 방법을 함께 설명할 수 있는가?`;

export const buildPayload = () => ({
  version: '2026.08.21',
  duplicatePolicy: {
    suppliedFiles: 11,
    uniqueSources: catalog.length,
    rule: 'sha256 checksum and source version',
  },
  sources: catalog.map((item) => ({
    key: item.key,
    title: item.title,
    subject: item.subject,
    category: item.category,
    sourceVersion: item.sourceVersion,
    sourceChecksum: item.sourceChecksum,
    sourceFiles: item.sourceFiles,
    units: item.units.map((learningUnit, index) => ({
      anchor: learningUnit.anchor,
      title: learningUnit.title,
      summaryMarkdown: summary(learningUnit),
      concepts: learningUnit.concepts,
      visuals: [
        {
          src: `/learning/${learningUnit.anchor}.webp`,
          alt: `${learningUnit.title}의 핵심 구조를 설명하는 원본 PDF 슬라이드`,
          caption: `원본 PDF ${learningUnit.page}쪽의 핵심 그림·표·코드입니다. 이미지는 보조 자료이며, 위 학습 정리는 원문을 그대로 옮기지 않고 학습 흐름에 맞게 재구성했습니다.`,
          page: learningUnit.page,
        },
      ],
      flashcards: [
        {
          front: learningUnit.recall,
          back: learningUnit.answer,
        },
        {
          front: `${learningUnit.title}에서 반드시 구분해야 할 개념은 무엇인가요?`,
          back: learningUnit.concepts.join(', '),
        },
      ],
      questions: [
        {
          type: 'SHORT_ANSWER',
          prompt: learningUnit.recall,
          answer: learningUnit.answer,
          choices: [],
        },
      ],
      position: index,
    })),
  })),
});

const buildSql = (payload) => {
  const statements = [];

  for (const item of payload.sources) {
    const sourceId = `source-${idSegment(item.key)}`;
    statements.push(`INSERT INTO learning_sources
  (id, title, subject, category, source_version, source_checksum, status, created_at, updated_at)
VALUES
  (${quote(sourceId)}, ${quote(item.title)}, ${quote(item.subject)}, ${quote(item.category)}, ${quote(item.sourceVersion)}, ${quote(item.sourceChecksum)}, 'READY', ${quote(timestamp)}, ${quote(timestamp)})
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  subject = excluded.subject,
  category = excluded.category,
  source_version = excluded.source_version,
  source_checksum = excluded.source_checksum,
  status = excluded.status,
  updated_at = excluded.updated_at`);

    for (const [unitIndex, learningUnit] of item.units.entries()) {
      const unitId = `unit-${idSegment(item.key)}-${String(unitIndex + 1).padStart(2, '0')}`;
      statements.push(`INSERT INTO learning_units
  (id, source_id, anchor, title, summary, concepts, visuals, position, published, created_at, updated_at)
VALUES
  (${quote(unitId)}, ${quote(sourceId)}, ${quote(learningUnit.anchor)}, ${quote(learningUnit.title)}, ${quote(learningUnit.summaryMarkdown)}, ${quote(JSON.stringify(learningUnit.concepts))}, ${quote(JSON.stringify(learningUnit.visuals))}, ${learningUnit.position}, 1, ${quote(timestamp)}, ${quote(timestamp)})
ON CONFLICT(id) DO UPDATE SET
  source_id = excluded.source_id,
  anchor = excluded.anchor,
  title = excluded.title,
  summary = excluded.summary,
  concepts = excluded.concepts,
  visuals = excluded.visuals,
  position = excluded.position,
  published = excluded.published,
  updated_at = excluded.updated_at`);

      for (const [cardIndex, card] of learningUnit.flashcards.entries()) {
        const cardId = `flash-${idSegment(item.key)}-${unitIndex + 1}-${cardIndex + 1}`;
        statements.push(`INSERT INTO flashcards
  (id, unit_id, front, back, created_at)
VALUES
  (${quote(cardId)}, ${quote(unitId)}, ${quote(card.front)}, ${quote(card.back)}, ${quote(timestamp)})
ON CONFLICT(id) DO UPDATE SET
  unit_id = excluded.unit_id,
  front = excluded.front,
  back = excluded.back`);
      }

      for (const [questionIndex, question] of learningUnit.questions.entries()) {
        const questionId = `question-${idSegment(item.key)}-${unitIndex + 1}-${questionIndex + 1}`;
        statements.push(`INSERT INTO learning_questions
  (id, unit_id, prompt, answer, type, choices, created_at)
VALUES
  (${quote(questionId)}, ${quote(unitId)}, ${quote(question.prompt)}, ${quote(question.answer)}, ${quote(question.type)}, ${quote(JSON.stringify(question.choices))}, ${quote(timestamp)})
ON CONFLICT(id) DO UPDATE SET
  unit_id = excluded.unit_id,
  prompt = excluded.prompt,
  answer = excluded.answer,
  type = excluded.type,
  choices = excluded.choices`);
      }
    }
  }

  const checksum = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  statements.push(`INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
VALUES (${quote(migrationVersion)}, ${quote(`sha256:${checksum}`)}, ${quote(timestamp)})`);
  statements.push('PRAGMA optimize');
  return `${statements.join(';\n--> statement-breakpoint\n')};\n`;
};

const buildVisualManifest = (payload) => ({
  version: payload.version,
  sources: payload.sources.map((item) => ({
    key: item.key,
    sourceChecksum: item.sourceChecksum,
    sourceFiles: item.sourceFiles,
    visuals: item.units.map((learningUnit) => ({
      page: learningUnit.visuals[0].page,
      output: learningUnit.visuals[0].src.replace('/learning/', ''),
    })),
  })),
});

export const generateCatalogFiles = async () => {
  const payload = buildPayload();
  await mkdir(dirname(outputJson), { recursive: true });
  await writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(outputVisuals, `${JSON.stringify(buildVisualManifest(payload), null, 2)}\n`);
  await writeFile(outputSql, buildSql(payload));
  return {
    sources: payload.sources.length,
    units: payload.sources.reduce((sum, item) => sum + item.units.length, 0),
    outputJson,
    outputVisuals,
    outputSql,
  };
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(await generateCatalogFiles(), null, 2)}\n`);
}
