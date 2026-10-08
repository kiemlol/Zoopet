// Patch v5.9: backend ho tro CORS cho frontend chay rieng host.
// Them CORS headers cho moi API response khi origin duoc phep,
// va xu ly OPTIONS preflight.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'server', 'server.mjs');
  let code = await fs.readFile(file, 'utf8');

  const marker = '  async function api(request, response, url) {';
  if (!code.includes(marker)) {
    console.log('[v5.9] khong thay api(), bo qua.');
    return;
  }

  // Chen xu ly CORS ngay dau ham api(), sau dong mo ham.
  // Chi ap dung khi origin duoc allowedOrigin chap nhan.
  const corsBlock = `  async function api(request, response, url) {
    // v5.9: CORS cho frontend chay rieng host (Railway tach frontend/backend).
    {
      const origin = request.headers.origin;
      if (origin) {
        try {
          const u = new URL(origin);
          const allowed = (() => {
            try {
              const expected = request.headers.host;
              if (u.host === expected) return true;
              const list = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
              return list.includes(origin);
            } catch { return false; }
          })();
          if (allowed) {
            const corsHeaders = {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Credentials': 'true',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning',
              'Access-Control-Max-Age': '600',
              'Vary': 'Origin',
            };
            if (request.method === 'OPTIONS') {
              response.writeHead(204, corsHeaders);
              return response.end();
            }
            // Gan headers vao moi response cua api()
            const _writeHead = response.writeHead.bind(response);
            response.writeHead = (status, headers) => _writeHead(status, { ...corsHeaders, ...(headers || {}) });
          }
        } catch {}
      }
    }`;

  if (code.includes('// v5.9: CORS cho frontend')) {
    console.log('[v5.9] da patch roi, bo qua.');
    return;
  }

  code = code.replace(marker, corsBlock);
  await fs.writeFile(file, code);
  console.log('[v5.9] patched server/server.mjs: CORS cho cross-origin API.');
}
