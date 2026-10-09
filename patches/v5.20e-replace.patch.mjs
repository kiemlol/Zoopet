// Patch v5.20e: Thay the server/combat-authority.mjs bang ban Khương upload len GitHub.
// Tai tu URL vinh vien: https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/combat-authority.mjs
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, "server/combat-authority.mjs");

  if ((await fs.readFile(file, 'utf8')).includes('v5.20e: replaced by Khương')) {
    console.log('[v5.20e] da patch roi, bo qua.');
    return;
  }

  console.log('[v5.20e] downloading combat-authority.mjs from GitHub...');
  const res = await fetch('https://raw.githubusercontent.com/linhphann66-maker/Zoopet/main/combat-authority.mjs');
  if (!res.ok) throw new Error('[v5.20e] Download failed: ' + res.status);
  const content = await res.text();
  await fs.writeFile(file, content + '\n// v5.20e: replaced by Khương\n');
  console.log('[v5.20e] replaced server/combat-authority.mjs.');
}
