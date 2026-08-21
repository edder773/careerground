import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath, URL } from 'node:url';

import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const rootDirectory = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const manifestPath = resolve(rootDirectory, 'data/imports/learning_catalog_20260821_visuals.json');
const outputDirectory = resolve(rootDirectory, 'apps/web/public/learning');
const sourceFlag = process.argv.indexOf('--source-dir');
const sourceDirectory = sourceFlag >= 0 ? resolve(process.argv[sourceFlag + 1]) : null;

if (!sourceDirectory) {
  throw new Error(
    '사용법: node scripts/learning-catalog/render-visuals.mjs --source-dir <PDF 폴더>',
  );
}

const checksum = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const availableFiles = await readdir(sourceDirectory);
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'careerground-learning-'));
let rendered = 0;

try {
  for (const source of manifest.sources) {
    const normalizedSourceFiles = new Set(
      source.sourceFiles.map((candidate) => candidate.normalize('NFC')),
    );
    const exactCandidates = availableFiles.filter((candidate) =>
      normalizedSourceFiles.has(candidate.normalize('NFC')),
    );
    const candidates = exactCandidates.length
      ? exactCandidates
      : availableFiles.filter((candidate) => candidate.toLowerCase().endsWith('.pdf'));
    let sourcePath;
    for (const candidate of candidates) {
      const candidatePath = join(sourceDirectory, candidate);
      if ((await checksum(candidatePath)) === source.sourceChecksum) {
        sourcePath = candidatePath;
        break;
      }
    }
    if (!sourcePath) {
      throw new Error(`${source.key}: checksum이 일치하는 PDF를 찾지 못했습니다.`);
    }

    for (const visual of source.visuals) {
      const temporaryPrefix = join(
        temporaryDirectory,
        `${source.key}-${visual.page}-${basename(visual.output, '.webp')}`,
      );
      await execFileAsync('pdftoppm', [
        '-f',
        String(visual.page),
        '-l',
        String(visual.page),
        '-singlefile',
        '-jpeg',
        '-jpegopt',
        'quality=90',
        '-scale-to-x',
        '1600',
        '-scale-to-y',
        '-1',
        sourcePath,
        temporaryPrefix,
      ]);
      await sharp(`${temporaryPrefix}.jpg`)
        .webp({ quality: 82, effort: 5 })
        .toFile(join(outputDirectory, visual.output));
      rendered += 1;
    }
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({ rendered, outputDirectory }, null, 2)}\n`);
