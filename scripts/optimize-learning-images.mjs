import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const directory = 'apps/web/public/learning';
const files = (await readdir(directory)).filter((file) => file.endsWith('.jpg')).sort();
let beforeBytes = 0;
let afterBytes = 0;
for (const file of files) {
  const input = join(directory, file);
  const output = join(directory, file.replace(/\.jpg$/, '.webp'));
  beforeBytes += (await stat(input)).size;
  await sharp(input).webp({ quality: 82, effort: 6, smartSubsample: true }).toFile(output);
  afterBytes += (await stat(output)).size;
}
process.stdout.write(
  `${JSON.stringify({ files: files.length, beforeBytes, afterBytes, reductionPercent: Number(((1 - afterBytes / beforeBytes) * 100).toFixed(1)) })}\n`,
);
