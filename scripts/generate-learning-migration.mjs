import { readFile, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';

const inputUrl = new URL(
  '../data/imports/generative_ai_prompt_context_learning.json',
  import.meta.url,
);
const outputUrl = new URL('../drizzle-history/0005_naive_blindfold.sql', import.meta.url);
const payload = JSON.parse(await readFile(inputUrl, 'utf8'));
const timestamp = '2026-08-13T00:00:00.000Z';
const sourceId = 'source-generative-ai-context';
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const statements = [
  'DROP INDEX `idx_daily_challenges_date`',
  'ALTER TABLE `daily_challenges` ADD `level_slot` integer DEFAULT 1 NOT NULL',
  `UPDATE daily_challenges
      SET level_slot = COALESCE(
        (SELECT CASE WHEN level = 1 THEN 1 ELSE 2 END
           FROM coding_problems
          WHERE coding_problems.id = daily_challenges.problem_id),
        1
      )`,
  'CREATE UNIQUE INDEX `idx_daily_challenges_date_level` ON `daily_challenges` (`kst_date`,`level_slot`)',
  `INSERT OR REPLACE INTO learning_sources
     (id, title, subject, category, status, created_at, updated_at)
   VALUES
     (${quote(sourceId)}, ${quote(payload.source.title)}, ${quote(payload.source.subject)}, ${quote(payload.source.category)}, 'READY', ${quote(timestamp)}, ${quote(timestamp)})`,
];

for (const [unitIndex, unit] of payload.units.entries()) {
  const unitId = `unit-generative-ai-${String(unitIndex + 1).padStart(2, '0')}`;
  statements.push(`INSERT OR REPLACE INTO learning_units
     (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
   VALUES
     (${quote(unitId)}, ${quote(sourceId)}, ${quote(unit.anchor)}, ${quote(unit.title)}, ${quote(unit.summaryMarkdown)}, ${quote(JSON.stringify(unit.concepts))}, ${unitIndex}, 1, ${quote(timestamp)}, ${quote(timestamp)})`);

  for (const [cardIndex, card] of unit.flashcards.entries()) {
    statements.push(`INSERT OR REPLACE INTO flashcards
       (id, unit_id, front, back, created_at)
     VALUES
       (${quote(`flash-generative-ai-${unitIndex + 1}-${cardIndex + 1}`)}, ${quote(unitId)}, ${quote(card.front)}, ${quote(card.back)}, ${quote(timestamp)})`);
  }

  for (const [questionIndex, question] of unit.questions.entries()) {
    const choices = question.choices?.length ? `\n\n선택지: ${question.choices.join(' / ')}` : '';
    statements.push(`INSERT OR REPLACE INTO learning_questions
       (id, unit_id, prompt, answer, created_at)
     VALUES
       (${quote(`question-generative-ai-${unitIndex + 1}-${questionIndex + 1}`)}, ${quote(unitId)}, ${quote(`${question.prompt}${choices}`)}, ${quote(question.answer)}, ${quote(timestamp)})`);
  }
}

statements.push('PRAGMA optimize');
await writeFile(outputUrl, `${statements.join(';--> statement-breakpoint\n')} ;\n`);
