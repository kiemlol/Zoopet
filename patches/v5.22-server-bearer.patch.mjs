// Patch v5.22: Server ho tro Bearer token auth (chi phan server).
// Can thiet vi v5.12 bi xoa khi don dep conflict.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const serverFile = path.join(root, 'server', 'server.mjs');
  let code = await fs.readFile(serverFile, 'utf8');

  if (code.includes('v5.22 bearerToken')) {
    console.log('[v5.22] da patch roi, bo qua.');
    return;
  }

  let changed = false;

  // 1. Them ham bearerToken sau cookieValue
  const cookieLine = "const cookieValue = request => (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);";
  if (code.includes(cookieLine) && !code.includes('const bearerToken')) {
    const bearerDef = "\n// v5.22 bearerToken: lay token tu Authorization header hoac ?token=.\n" +
      "const bearerToken = request => {\n" +
      "  const auth = request.headers.authorization || '';\n" +
      "  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();\n" +
      "  try { const u = new URL(request.url || '/', 'http://localhost'); return u.searchParams.get('token'); }\n" +
      "  catch { return null; }\n" +
      "};";
    code = code.replace(cookieLine, cookieLine + bearerDef);
    changed = true;
  }

  // 2. validSession: uu tien Bearer token
  const oldValid = "const token = cookieValue(request), key = token && sessionKey(token)";
  const newValid = "// v5.22: uu tien Bearer token, fallback cookie\n    const token = bearerToken(request) || cookieValue(request), key = token && sessionKey(token)";
  if (code.includes(oldValid)) {
    code = code.replace(oldValid, newValid);
    changed = true;
  }

  // 3. Logout: dung ca Bearer token
  const oldLogout = "if (session) await commitSessions(next => next.delete(sessionKey(cookieValue(request))));";
  const newLogout = "if (session) { const _tok = (typeof bearerToken!=='undefined'?bearerToken(request):null) || cookieValue(request); if (_tok) await commitSessions(next => next.delete(sessionKey(_tok))); } // v5.22 logout fix";
  if (code.includes(oldLogout)) {
    code = code.replace(oldLogout, newLogout);
    changed = true;
  }

  if (changed) {
    await fs.writeFile(serverFile, code);
    console.log('[v5.22] patched server/server.mjs: Bearer token auth.');
  } else {
    console.log('[v5.22] khong co gi de patch.');
  }
}
