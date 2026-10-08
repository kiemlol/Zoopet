// restore.mjs — Zoo Pet
// Khoi phuc source code tu archive/ (duoc chia nho do gioi han push).
// Chay sau khi clone repo:  node scripts/restore.mjs
// Yeu cau: may co san lenh `tar` (Windows 10+, macOS, Linux deu co).

import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const archiveDir = join(root, 'archive');

const files = (await readdir(archiveDir))
  .filter((f) => f.endsWith('.b64'))
  .sort();

if (files.length === 0) {
  console.log('[restore] khong tim thay file archive/.');
  process.exit(1);
}

console.log(`[restore] dang ghep ${files.length} phan archive...`);
let b64 = '';
for (const f of files) {
  b64 += (await readFile(join(archiveDir, f), 'utf8')).replace(/\s/g, '');
}

const tgzPath = join(root, 'src-text.tar.gz');
await writeFile(tgzPath, Buffer.from(b64, 'base64'));
console.log('[restore] dang giai nen...');
execSync(`tar -xzf "${tgzPath}" -C "${root}"`, { stdio: 'inherit' });
await unlink(tgzPath);

console.log('[restore] xong! Chay tiep:');
console.log('  npm run prebuild   # giai ma assets binary (.b64 -> that)');
console.log('  npm install        # cai dependencies');
console.log('  npm run dev        # chay game');
