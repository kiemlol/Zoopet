// Patch v5.20a: Thay the src/online.ts bang ban Khương upload len GitHub.
// Tai tu URL vinh vien: https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/online.ts
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, "src/online.ts");

  if ((await fs.readFile(file, 'utf8')).includes('v5.20a: replaced by Khương')) {
    console.log('[v5.20a] da patch roi, bo qua.');
    return;
  }

  console.log('[v5.20a] downloading online.ts from GitHub...');
  const res = await fetch('https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/online.ts');
  if (!res.ok) throw new Error('[v5.20a] Download failed: ' + res.status);
  const content = await res.text();
  await fs.writeFile(file, content + '\n// v5.20a: replaced by Khương\n');
  console.log('[v5.20a] replaced src/online.ts.');
}
