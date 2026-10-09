// Patch v5.20c: Thay the src/main.ts bang ban Khương upload len GitHub.
// Tai tu URL vinh vien: https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/main.ts
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, "src/main.ts");

  if ((await fs.readFile(file, 'utf8')).includes('v5.20c: replaced by Khương')) {
    console.log('[v5.20c] da patch roi, bo qua.');
    return;
  }

  console.log('[v5.20c] downloading main.ts from GitHub...');
  const res = await fetch('https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/main.ts');
  if (!res.ok) throw new Error('[v5.20c] Download failed: ' + res.status);
  const content = await res.text();
  await fs.writeFile(file, content + '\n// v5.20c: replaced by Khương\n');
  console.log('[v5.20c] replaced src/main.ts.');
}
