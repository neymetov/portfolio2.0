// Checks that nothing points at a file or page that does not exist.
//
//   node scripts/check-site.mjs assets   content (src/data) and source code -> files in public/   (no build needed)
//   node scripts/check-site.mjs links    built pages in dist/ -> other pages and files             (run after a build)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const mode = process.argv[2];
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const missing = [];
const note = (from, target) => missing.push(`${from.replace(root + '/', '')}  ->  ${target}`);

if (mode === 'assets') {
  const FILE = /^\/(images|fonts|cv)\/.+\.[a-z0-9]+$|^\/(og-default\.jpg|favicon\.svg)$/i;
  const check = (from, value) => {
    if (FILE.test(value) && !existsSync(join(root, 'public', decodeURI(value)))) note(from, value);
  };
  for (const file of walk(join(root, 'src/data')).filter((f) => f.endsWith('.json'))) {
    const visit = (value) => {
      if (typeof value === 'string') check(file, value);
      else if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    };
    visit(JSON.parse(readFileSync(file, 'utf8')));
  }
  for (const file of walk(join(root, 'src')).filter((f) => /\.(astro|ts|tsx|css)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/['"(](\/(?:images|fonts|cv)\/[^'")\s${]+\.[a-z0-9]+|\/og-default\.jpg|\/favicon\.svg)['")]/gi)) check(file, match[1]);
  }
  for (const file of ['keystatic.config.ts']) {
    // Keystatic directories must exist as public folders so uploads land where the site reads them
    for (const match of readFileSync(join(root, file), 'utf8').matchAll(/directory: '(public\/[^']+)'/g)) {
      if (!existsSync(join(root, match[1]))) note(file, match[1] + ' (upload folder)');
    }
  }
} else if (mode === 'links') {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) {
    console.error('dist/ not found: run `npm run build` first');
    process.exit(2);
  }
  const OPEN = ['/keystatic', '/api/', '/cdn-cgi/']; // served by the worker, not present as files
  const exists = (path) => {
    const clean = decodeURI(path.split('#')[0].split('?')[0]).replace(/\/+$/, '') || '/';
    if (OPEN.some((p) => clean === p.replace(/\/$/, '') || clean.startsWith(p))) return true;
    if (extname(clean)) return existsSync(join(dist, clean));
    return existsSync(join(dist, clean, 'index.html')) || existsSync(join(dist, clean + '.html'));
  };
  for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/\s(?:href|src|data-src|poster)="([^"]+)"/g)) {
      const value = match[1];
      if (!value.startsWith('/') || value.startsWith('//')) continue;
      if (!exists(value)) note(file, value);
    }
  }
} else {
  console.error('usage: node scripts/check-site.mjs assets|links');
  process.exit(2);
}

if (missing.length) {
  console.error(`${missing.length} broken reference(s):\n` + [...new Set(missing)].join('\n'));
  process.exit(1);
}
console.log(`check-site ${mode}: ok`);
