// Patch v5.20d: Thay the src/game-bridge.ts bang ban Khương upload len GitHub.
// Tai tu URL vinh vien: https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/game-bridge.ts
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, "src/game-bridge.ts");

  if ((await fs.readFile(file, 'utf8')).includes('v5.20d: replaced by Khương')) {
    console.log('[v5.20d] da patch roi, bo qua.');
    return;
  }

  console.log('[v5.20d] downloading game-bridge.ts from GitHub...');
  const res = await fetch('https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/game-bridge.ts');
  if (!res.ok) throw new Error('[v5.20d] Download failed: ' + res.status);
  const content = await res.text();
  await fs.writeFile(file, content + '\n// v5.20d: replaced by Khương\n');
  console.log('[v5.20d] replaced src/game-bridge.ts.');
}
