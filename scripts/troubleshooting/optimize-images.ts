import { readdir, mkdir } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import sharp from 'sharp';

const index = process.argv.indexOf('--dir');
const root = index >= 0 ? process.argv[index + 1] : undefined;
if (!root) throw new Error('사용법: pnpm evidence:optimize-images --dir <screenshot-dir>');
const outputIndex = process.argv.indexOf('--out');
const outputRoot = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
async function walk(path: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(child)));
    else output.push(child);
  }
  return output;
}
for (const path of (await walk(root)).filter((value) => /\.(png|jpe?g)$/i.test(value))) {
  const outputDirectory = outputRoot
    ? join(outputRoot, dirname(relative(root, path)))
    : dirname(path);
  const output = join(outputDirectory, `${basename(path, extname(path))}.webp`);
  await mkdir(dirname(output), { recursive: true });
  await sharp(path).webp({ quality: 82, effort: 5 }).toFile(output);
  console.log(output);
}
