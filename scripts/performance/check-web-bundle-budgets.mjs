import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export const DEFAULT_WEB_BUNDLE_BUDGETS = {
  maxJavaScriptGzipBytes: 110_000,
  maxCssGzipBytes: 30_000,
  initialRouteGzipBytes: 180_000,
};

const assetFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return assetFiles(path);
    return /\.(?:js|css)$/.test(entry.name) ? [path] : [];
  });

export function inspectWebBundle(distDirectory, budgets = DEFAULT_WEB_BUNDLE_BUDGETS) {
  const root = resolve(distDirectory);
  const indexPath = join(root, 'index.html');
  if (!statSync(indexPath).isFile()) throw new Error(`Web build index is missing: ${indexPath}`);
  const assets = assetFiles(join(root, 'assets')).map((path) => {
    const bytes = readFileSync(path);
    return {
      path: relative(root, path).replaceAll('\\', '/'),
      rawBytes: bytes.length,
      gzipBytes: gzipSync(bytes, { level: 9 }).length,
      type: path.endsWith('.css') ? 'css' : 'javascript',
    };
  });
  const indexHtml = readFileSync(indexPath, 'utf8');
  const initialPaths = new Set(
    [...indexHtml.matchAll(/(?:src|href)=["']\/?(assets\/[^"']+\.(?:js|css))["']/g)].map(
      (match) => match[1],
    ),
  );
  const initialAssets = assets.filter((asset) => initialPaths.has(asset.path));
  const initialRouteGzipBytes = initialAssets.reduce((total, asset) => total + asset.gzipBytes, 0);
  const failures = [];
  for (const asset of assets) {
    const budget = asset.type === 'css' ? budgets.maxCssGzipBytes : budgets.maxJavaScriptGzipBytes;
    if (asset.gzipBytes > budget) {
      failures.push(`${asset.path}: ${asset.gzipBytes} gzip bytes > ${budget}`);
    }
  }
  if (!initialAssets.length) failures.push('initial route assets were not found in index.html');
  if (initialRouteGzipBytes > budgets.initialRouteGzipBytes) {
    failures.push(
      `initial route: ${initialRouteGzipBytes} gzip bytes > ${budgets.initialRouteGzipBytes}`,
    );
  }
  return {
    distDirectory: root,
    budgets,
    initialRoute: {
      assets: initialAssets.map((asset) => asset.path),
      gzipBytes: initialRouteGzipBytes,
    },
    largestJavaScript:
      assets
        .filter((asset) => asset.type === 'javascript')
        .sort((left, right) => right.gzipBytes - left.gzipBytes)[0] || null,
    largestCss:
      assets
        .filter((asset) => asset.type === 'css')
        .sort((left, right) => right.gzipBytes - left.gzipBytes)[0] || null,
    assetCount: assets.length,
    failures,
  };
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const report = inspectWebBundle(process.env.WEB_DIST_DIR || 'apps/web/dist');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.failures.length) process.exitCode = 1;
}
