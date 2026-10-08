// restore.mjs — Zoo Pet
// Khoi phuc source code tu archive/ va public-archive/ (duoc chia nho do gioi han push).
// Chay sau khi clone repo:  node scripts/restore.mjs
// Yeu cau: may co san lenh `tar` (Windows 10+, macOS, Linux deu co).

import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function restoreArchive(archiveDirName, outputName) {
  const archiveDir = join(root, archiveDirName);
  let files;
  try {
    files = (await readdir(archiveDir)).filter((f) => f.endsWith('.b64')).sort();
  } catch {
    console.log(`[restore] khong tim thay ${archiveDirName}/, bo qua.`);
    return;
  }
  if (files.length === 0) {
    console.log(`[restore] ${archiveDirName}/ trong, bo qua.`);
    return;
  }
  console.log(`[restore] dang ghep ${files.length} phan ${archiveDirName}...`);
  let b64 = '';
  for (const f of files) {
    b64 += (await readFile(join(archiveDir, f), 'utf8')).replace(/\s/g, '');
  }
  const tgzPath = join(root, outputName);
  await writeFile(tgzPath, Buffer.from(b64, 'base64'));
  console.log(`[restore] dang giai nen ${outputName}...`);
  // Bo qua render.yaml trong archive de giu ban moi nhat o root repo
  const exclude = outputName === 'src-text.tar.gz' ? `--exclude='./render.yaml'` : '';
  execSync(`tar -xzf "${tgzPath}" -C "${root}" ${exclude}`, { stdio: 'inherit' });
  await unlink(tgzPath);
  console.log(`[restore] xong ${archiveDirName}.`);
}

// 1. Source code (text)
await restoreArchive('archive', 'src-text.tar.gz');
// 2. Assets binary (public/: model .glb, anh, am thanh)
await restoreArchive('public-archive', 'public.tar.gz');

console.log('[restore] HOAN TAT! Chay tiep:');
console.log('  npm install        # cai dependencies');
console.log('  npm run dev        # chay game (prebuild tu dong giai ma assets neu can)');
