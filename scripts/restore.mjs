// restore.mjs — Zoo Pet
// Khoi phuc source code tu archive/ va public-archive/ (duoc chia nho do gioi han push).
// Chay sau khi clone repo:  node scripts/restore.mjs
// Yeu cau: may co san lenh `tar` (Windows 10+, macOS, Linux deu co).

import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { join, dirname, sep } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
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

// Dap cac file hotfix (patch bundle) len source vua giai nen.
// Dinh dang bundle: dong "@@@ZOO_PATCH_FILE@@@ <duong dan tu root>" + nguyen van noi dung file,
// ket thuc bang "@@@ZOO_PATCH_END@@@". Dung khi archive/ chua duoc tai tao de gom fix.
async function applyPatchBundles(patchesDirName) {
  const patchesDir = join(root, patchesDirName);
  let files;
  try {
    files = (await readdir(patchesDir)).filter((f) => f.endsWith('.patchbundle')).sort();
  } catch {
    return;
  }
  for (const f of files) {
    console.log(`[patch] dang dap ${patchesDirName}/${f}...`);
    const text = await readFile(join(patchesDir, f), 'utf8');
    const sections = text.split(/^@@@ZOO_PATCH_FILE@@@ /m);
    let count = 0;
    for (const s of sections) {
      const nl = s.indexOf('\n');
      if (nl < 0) continue;
      const rel = s.slice(0, nl).trim();
      if (!rel || rel === '@@@ZOO_PATCH_END@@@' || rel.startsWith('#')) continue;
      const dest = join(root, rel);
      if (dest !== root && !dest.startsWith(root + sep)) {
        console.log(`[patch] bo qua path la: ${rel}`);
        continue;
      }
      let body = s.slice(nl + 1);
      const endMark = '\n@@@ZOO_PATCH_END@@@';
      const ei = body.indexOf(endMark);
      if (ei >= 0) body = body.slice(0, ei) + '\n';
      else body = body.replace(/\n+$/, '\n');
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, body);
      count++;
    }
    console.log(`[patch] xong ${f}: ${count} file.`);
  }
}

// Chay cac patch dang script (VD: sua phau thuat 1 file lon khong nhét vua patchbundle).
// Moi file patches/*.patch.mjs phai export async function apply(root).
async function applyPatchScripts(patchesDirName) {
  const patchesDir = join(root, patchesDirName);
  let files;
  try {
    files = (await readdir(patchesDir)).filter((f) => f.endsWith('.patch.mjs')).sort();
  } catch {
    return;
  }
  for (const f of files) {
    console.log(`[patch] dang chay ${patchesDirName}/${f}...`);
    const mod = await import(pathToFileURL(join(patchesDir, f)).href);
    await mod.apply(root);
  }
}

// 1. Source code (text)
await restoreArchive('archive', 'src-text.tar.gz');
// 2. Assets binary (public/: model .glb, anh, am thanh)
await restoreArchive('public-archive', 'public.tar.gz');
// 3. Hotfix chua co trong archive/
await applyPatchBundles('patches');
await applyPatchScripts('patches');

console.log('[restore] HOAN TAT! Chay tiep:');
console.log('  npm install        # cai dependencies');
console.log('  npm run dev        # chay game (prebuild tu dong giai ma assets neu can)');
