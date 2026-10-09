// Patch v5.20b: Thay the src/world.ts bang ban Khương cung cap (download tu URL tam thoi).
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'world.ts');

  if ((await fs.readFile(file, 'utf8')).includes('v5.20b: replaced by Khương')) {
    console.log('[v5.20b] da patch roi, bo qua.');
    return;
  }

  console.log('[v5.20b] downloading world.ts...');
  const res = await fetch('https://muse.ai/files/1444666598722954/2153782635516418/32p6zhfifm8z83nwp0b96yj2/world.ts');
  if (!res.ok) throw new Error('Download world.ts failed: ' + res.status);
  const content = await res.text();
  // Them marker de nhan biet da patch
  await fs.writeFile(file, content + '\n// v5.20b: replaced by Khương\n');
  console.log('[v5.20b] replaced src/world.ts.');
}
