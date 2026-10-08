// Patch v5.13: fix quai giat khi online (phan 2).
// Van de: code lam muot (e.smooth) co nguong snap 7m - neu quai di chuyen >7m
// giua cac snapshot (do lag hoac toc do cao) thi snap truc tiep gay giat.
// Fix: tang nguong snap len 20m, chi snap khi thuc su teleport xa.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'world.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.13: tang nguong snap')) {
    console.log('[v5.13] da patch roi, bo qua.');
    return;
  }

  const pattern = /if\(view2\)\{if\(Math\.hypot\(e\.x-view2\.x,e\.z-view2\.z\)>7\)\{view2\.x=e\.x;view2\.z=e\.z;\}/;
  const replacement = "if(view2){/* v5.13: tang nguong snap 7->20m de tranh giat khi lag */if(Math.hypot(e.x-view2.x,e.z-view2.z)>20){view2.x=e.x;view2.z=e.z;}";

  if (!pattern.test(code)) {
    console.log('[v5.13] khong thay mau (regex), bo qua.');
    return;
  }

  code = code.replace(pattern, replacement);
  await fs.writeFile(file, code);
  console.log('[v5.13] patched src/world.ts: tang nguong snap 7->20m.');
}
