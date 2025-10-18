import { promises as fs } from 'fs';
import path from 'path';

const roots = [path.resolve('frontend/src'), path.resolve('frontend/index.html')];
const exts = new Set(['.ts', '.tsx', '.html']);

function looksCorrupted(text) {
  return /Ã.|Â|?|?|Ãƒ/.test(text);
}

async function fixFile(file) {
  const raw = await fs.readFile(file, 'utf8');
  if (!looksCorrupted(raw)) return false;
  const fixed = Buffer.from(raw, 'latin1').toString('utf8');
  // Some sequences may still remain; try specific fallbacks
  const final = fixed
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€¢/g, '•')
    .replace(/â€¦/g, '…')
    .replace(/Â/g, '')
    .replace(/Ã/g, '');
  if (final !== raw) {
    await fs.writeFile(file, final, 'utf8');
    return true;
  }
  return false;
}

async function walk(dir, out = []) {
  const stat = await fs.stat(dir).catch(() => null);
  if (!stat) return out;
  if (stat.isFile()) { out.push(dir); return out; }
  const items = await fs.readdir(dir);
  for (const name of items) {
    const p = path.join(dir, name);
    const st = await fs.stat(p);
    if (st.isDirectory()) await walk(p, out);
    else if (exts.has(path.extname(p))) out.push(p);
  }
  return out;
}

const files = [];
for (const root of roots) {
  const st = await fs.stat(root).catch(() => null);
  if (!st) continue;
  if (st.isFile()) files.push(root);
  else files.push(...await walk(root));
}

let changed = 0;
for (const f of files) {
  const did = await fixFile(f);
  if (did) { console.log('fixed', f); changed++; }
}
console.log('changed:', changed);

