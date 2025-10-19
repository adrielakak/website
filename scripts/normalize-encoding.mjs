import { promises as fs } from 'fs';
import path from 'path';

const roots = [
  path.resolve('frontend/src'),
  path.resolve('frontend/index.html'),
  path.resolve('backend')
];

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.html']);

const replacements = [
  ['â€”', '—'], ['â€“', '–'], ['â€¢', '•'], ['â€¦', '…'],
  ['â€˜', '‘'], ['â€™', '’'], ['â€œ', '“'], ['â€�', '”'],
  ['Â ', ' '], ['Â', ''], ['â‚¬', '€'],
  ['Ã©', 'é'], ['Ã¨', 'è'], ['Ãª', 'ê'], ['Ã«', 'ë'],
  ['Ã ', 'à'], ['Ã¢', 'â'], ['Ã§', 'ç'],
  ['Ã¹', 'ù'], ['Ã»', 'û'], ['Ã¼', 'ü'],
  ['Ã´', 'ô'], ['Ã¶', 'ö'], ['Ã¯', 'ï'], ['Ã¸', 'ø'],
  ['Ã‰', 'É'], ['Ãˆ', 'È'], ['ÃŠ', 'Ê'], ['Ã‹', 'Ë'],
  ['Ã€', 'À'], ['Ã‚', 'Â'], ['Ã‡', 'Ç'], ['Ã™', 'Ù'],
  ['Ã›', 'Û'], ['Ãœ', 'Ü'], ['Ã”', 'Ô'], ['Ã–', 'Ö'],
  ['Ã�', 'Í'], ['ÃŽ', 'Î'], ['ÃŒ', 'Ì'], ['Ã“', 'Ó'],
  ['Theatre', 'Théâtre'], ['Th��tre', 'Théâtre'],
  ['AlloCinÃ©', 'AlloCiné'], ['WikipÃ©dia', 'Wikipédia']
];

function applyReplacements(text) {
  let out = text;
  for (const [from, to] of replacements) out = out.split(from).join(to);
  return out;
}

async function walk(dir, out = []) {
  const st = await fs.stat(dir).catch(() => null);
  if (!st) return out;
  if (st.isFile()) { out.push(dir); return out; }
  for (const name of await fs.readdir(dir)) {
    const p = path.join(dir, name);
    const s = await fs.stat(p);
    if (s.isDirectory()) {
      // Skip vendor/build directories
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
      await walk(p, out);
    }
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
  const raw = await fs.readFile(f, 'utf8');
  const fixed = applyReplacements(raw);
  if (fixed !== raw) {
    await fs.writeFile(f, fixed, 'utf8');
    console.log('fixed', f);
    changed++;
  }
}
console.log('changed:', changed);
