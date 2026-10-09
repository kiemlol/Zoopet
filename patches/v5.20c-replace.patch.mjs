// Patch v5.20c: Thay the src/main.ts bang ban Khương cung cap (download tu URL tam thoi).
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'main.ts');

  if ((await fs.readFile(file, 'utf8')).includes('v5.20c: replaced by Khương')) {
    console.log('[v5.20c] da patch roi, bo qua.');
    return;
  }

  console.log('[v5.20c] downloading main.ts...');
  const res = await fetch('https://muse.ai/files/1444666598722954/3343867655800014/nlrgt8x8b2rj29st8ksf8mr0/main.ts');
  if (!res.ok) throw new Error('Download main.ts failed: ' + res.status);
  const content = await res.text();
  await fs.writeFile(file, content + '\n// v5.20c: replaced by Khương\n');
  console.log('[v5.20c] replaced src/main.ts.');
}
