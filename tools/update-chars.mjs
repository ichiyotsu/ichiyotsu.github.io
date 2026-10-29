/**
 * Rebuild assets/fonts/chars.txt from the visible copy of the site.
 *
 * Usage (Node 18+):
 *   node tools/update-chars.mjs
 *
 * Then regenerate the Smiley Sans subset with fonttools; see
 * assets/fonts/README.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', '404.html'];

const stripped = pages
  .map((page) => readFileSync(join(root, page), 'utf8'))
  .join('\n')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ');

const chars = new Set();
for (let code = 0x20; code <= 0x7e; code += 1) chars.add(String.fromCharCode(code));
'，。！？：；、（）《》“”‘’—…·「」『』【】〔〕～－＋×÷＝％＃＠＆＊'.split('').forEach((char) => chars.add(char));
[...stripped].forEach((char) => {
  if (char !== '\n' && char !== '\r' && char !== '\t') chars.add(char);
});

const output = [...chars].sort().join('');
writeFileSync(join(root, 'assets/fonts/chars.txt'), output, 'utf8');
console.log(`Wrote assets/fonts/chars.txt — ${[...chars].length} unique characters.`);
