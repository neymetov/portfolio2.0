// Converts heavy PNG/JPG pictures in public/images to WebP next to the originals and points the JSON content
// (src/data) at the WebP files. Originals are kept. Run it again after uploading big pictures in Keystatic.
//
//   node scripts/optimize-images.mjs            # report only
//   node scripts/optimize-images.mjs --write    # convert and update the JSON references
//   --min-kb=500   only touch files bigger than this (default 500)
//   --max-width=2400   scale down wider pictures (default 2400)
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const args = process.argv.slice(2);
const write = args.includes('--write');
const arg = (name, fallback) => Number(args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const minBytes = arg('min-kb', 500) * 1024;
const maxWidth = arg('max-width', 2400);

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
};

const mb = (n) => (n / 1048576).toFixed(2).padStart(6);
const files = (await walk(join(root, 'public/images'))).filter((f) => /\.(png|jpe?g)$/i.test(f));
const jsonFiles = (await walk(join(root, 'src/data'))).filter((f) => f.endsWith('.json'));
const jsons = new Map(await Promise.all(jsonFiles.map(async (f) => [f, await readFile(f, 'utf8')])));

const renames = [];
for (const file of files) {
  const { size } = await stat(file);
  if (size < minBytes) continue;
  const meta = await sharp(file).metadata();
  const target = file.replace(/\.(png|jpe?g)$/i, '.webp');
  const buffer = await sharp(file).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 82, effort: 5, alphaQuality: 90 }).toBuffer();
  const rel = relative(join(root, 'public'), file);
  const keep = buffer.length < size * 0.7;
  console.log(`${mb(size)} MB -> ${mb(buffer.length)} MB  ${meta.width}x${meta.height}${meta.hasAlpha ? ' alpha' : ''}  ${keep ? '' : '(kept: not smaller enough) '}${rel}`);
  if (!keep || !write) continue;
  await writeFile(target, buffer);
  renames.push(['/' + rel, '/' + relative(join(root, 'public'), target)]);
}

if (write) {
  for (const [file, text] of jsons) {
    let next = text;
    for (const [from, to] of renames) next = next.split(`"${from}"`).join(`"${to}"`);
    if (next !== text) {
      await writeFile(file, next);
      console.log('updated', relative(root, file));
    }
  }
}
if (!write) console.log('\nDry run. Add --write to convert and update the references.');
