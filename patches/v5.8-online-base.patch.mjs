// Patch v5.8: frontend goi API/WebSocket ve backend rieng qua VITE_ONLINE_URL
// (thay vi goi ve chinh frontend qua BASE_URL nhu truoc).
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'online.ts');
  let code = await fs.readFile(file, 'utf8');

  const oldLine = '  const serviceBase=import.meta.env.BASE_URL;';
  if (!code.includes(oldLine)) {
    // Da patch roi hoac code doi — bo qua de tranh patch 2 lan.
    console.log('[v5.8] src/online.ts khong thay dong serviceBase goc, bo qua.');
    return;
  }

  const newBlock = [
    '  // Neu build co VITE_ONLINE_URL (backend chay rieng host), API/WebSocket goi ve backend.',
    '  // Nguoc lai giu nguyen hanh vi cu (frontend+backend cung host).',
    '  const __onlineUrl=String(import.meta.env.VITE_ONLINE_URL||"").replace(/\\/+$/,"");',
    '  const serviceBase=__onlineUrl?__onlineUrl+"/":import.meta.env.BASE_URL;',
  ].join('\n');

  code = code.replace(oldLine, newBlock);

  // Fetch cross-origin can gui cookie session -> doi credentials sang include
  // khi goi sang host khac.
  const oldFetch = "fetch(`${serviceBase}api/${path}`,{method,credentials:'same-origin',";
  const newFetch = "fetch(`${serviceBase}api/${path}`,{method,credentials:__onlineUrl?'include':'same-origin',";
  if (code.includes(oldFetch)) {
    code = code.replace(oldFetch, newFetch);
  }

  await fs.writeFile(file, code);
  console.log('[v5.8] patched src/online.ts: serviceBase dung VITE_ONLINE_URL khi co.');
}
