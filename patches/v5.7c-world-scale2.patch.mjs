// v5.7c — tang kich co thu cung 40% (thay the v5.7b bi loi)
// Dung regex thay vi exact match de tranh loi whitespace.
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/world.ts');
let text = await readFile(path, 'utf8');

// Tim dong wings va them scale sau no (neu chua co)
const pattern = /(\s+model\.userData\.wings=model\.children\.filter\(c=>\/_wing_\[lr\]\/\.test\(c\.name\)\)\.map\(c=>\(\{node:c,base:c\.rotation\.z,side:\/_wing_l\/\.test\(c\.name\)\?-1:1\}\)\);)(\s+return model;)/;
if (text.includes('multiplyScalar(1.4)')) {
  console.log('[v5.7c] already patched, skipping');
} else {
  const matches = text.match(pattern);
  if (!matches) throw new Error('v5.7c: pattern not found in src/world.ts');
  text = text.replace(pattern, `$1\n    // Tăng kích cỡ thú cưng 40% (theo yêu cầu: pet hiện tại bé quá)\n    model.scale.multiplyScalar(1.4);$2`);
  await writeFile(path, text);
  console.log('[v5.7c] patched src/world.ts: pet scale x1.4');
}
