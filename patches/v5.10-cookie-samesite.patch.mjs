// Patch v5.10: cookie SameSite=None de session giu duoc khi frontend/backend khac origin.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'server', 'server.mjs');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.10: SameSite=None')) {
    console.log('[v5.10] da patch roi, bo qua.');
    return;
  }

  const old1 = "SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${secure ? '; Secure' : ''}`);";
  const new1 = "SameSite=${__sameSite}; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${__secure ? '; Secure' : ''}`);\n" +
    "    // v5.10: SameSite=None cho phep cookie di kem request cross-origin.";

  // Chen khai bao __sameSite/__secure truoc dong setHeader
  const anchor = "    const secure = request.socket.encrypted || process.env.COOKIE_SECURE === '1';";
  const inject = anchor + "\n" +
    "    // v5.10: SameSite=None khi COOKIE_SAMESITE=None (frontend/backend rieng host).";
  // Cach don gian: thay the cum SameSite=Strict bang bien, va chen dinh nghia bien o tren
  if (!code.includes(old1)) {
    console.log('[v5.10] khong thay mau, bo qua.');
    return;
  }

  // Buoc 1: chen dinh nghia bien sau dong secure
  const defLine = "    const __sameSite = process.env.COOKIE_SAMESITE === 'None' ? 'None' : 'Strict';\n" +
    "    const __secure = __sameSite === 'None' ? true : secure;";
  code = code.replace(anchor, anchor + "\n" + defLine);

  // Buoc 2: thay SameSite=Strict thanh SameSite=${__sameSite} va secure thanh __secure trong sessionCookie
  // (chi thay dong co SESSION_MS de khong dung vao dong logout)
  code = code.replace(
    "SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${secure ? '; Secure' : ''}",
    "SameSite=${__sameSite}; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${__secure ? '; Secure' : ''}"
  );

  await fs.writeFile(file, code);
  console.log('[v5.10] patched server/server.mjs: cookie SameSite=None khi COOKIE_SAMESITE=None.');
}
