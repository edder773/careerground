import { readFile, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';

const sources = [
  {
    file: 'data_analysis_statistics_day1_learning.json',
    key: 'statistics-day1',
  },
  {
    file: 'data_analysis_statistics_day2_learning.json',
    key: 'statistics-day2',
  },
  {
    file: 'git_ai_environment_learning.json',
    key: 'git-ai-environment',
  },
];
const timestamp = '2026-08-13T04:00:00.000Z';
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const statements = ['UPDATE users SET ranking_opt_in = 1'];

for (const sourceDefinition of sources) {
  const inputUrl = new URL(`../data/imports/${sourceDefinition.file}`, import.meta.url);
  const payload = JSON.parse(await readFile(inputUrl, 'utf8'));
  const sourceId = `source-${sourceDefinition.key}`;
  statements.push(`INSERT OR REPLACE INTO learning_sources
     (id, title, subject, category, status, created_at, updated_at)
   VALUES
     (${quote(sourceId)}, ${quote(payload.source.title)}, ${quote(payload.source.subject)}, ${quote(payload.source.category)}, 'READY', ${quote(timestamp)}, ${quote(timestamp)})`);

  for (const [unitIndex, unit] of payload.units.entries()) {
    const unitId = `unit-${sourceDefinition.key}-${String(unitIndex + 1).padStart(2, '0')}`;
    statements.push(`INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       (${quote(unitId)}, ${quote(sourceId)}, ${quote(unit.anchor)}, ${quote(unit.title)}, ${quote(unit.summaryMarkdown)}, ${quote(JSON.stringify(unit.concepts))}, ${unitIndex}, 1, ${quote(timestamp)}, ${quote(timestamp)})`);

    for (const [cardIndex, card] of unit.flashcards.entries()) {
      statements.push(`INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         (${quote(`flash-${sourceDefinition.key}-${unitIndex + 1}-${cardIndex + 1}`)}, ${quote(unitId)}, ${quote(card.front)}, ${quote(card.back)}, ${quote(timestamp)})`);
    }

    for (const [questionIndex, question] of unit.questions.entries()) {
      const choices = question.choices?.length ? `\n\n선택지: ${question.choices.join(' / ')}` : '';
      statements.push(`INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         (${quote(`question-${sourceDefinition.key}-${unitIndex + 1}-${questionIndex + 1}`)}, ${quote(unitId)}, ${quote(`${question.prompt}${choices}`)}, ${quote(question.answer)}, ${quote(timestamp)})`);
    }
  }
}

statements.push('PRAGMA optimize');
const outputUrl = new URL(
  '../drizzle-history/0007_learning_catalog_expansion.sql',
  import.meta.url,
);
await writeFile(outputUrl, `${statements.join(';--> statement-breakpoint\n')};\n`);
