// Patch v5.12: Chuyen sang Bearer token auth.
// Backend: nhan token qua Authorization header hoac ?token= (WebSocket), tra token trong login response.
// Frontend: luu token vao localStorage, gui qua Authorization header, WebSocket kem ?token=.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  // === BACKEND ===
  const serverFile = path.join(root, 'server', 'server.mjs');
  let serverCode = await fs.readFile(serverFile, 'utf8');
  let serverChanged = false;

  if (!serverCode.includes('v5.12 bearerToken')) {
    // 1. Them ham bearerToken sau cookieValue
    const cookieLine = "const cookieValue = request => (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);";
    const bearerDef = "\n// v5.12 bearerToken: lay token tu Authorization header hoac ?token= (cho WebSocket).\n" +
      "const bearerToken = request => {\n" +
      "  const auth = request.headers.authorization || '';\n" +
      "  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();\n" +
      "  try { const u = new URL(request.url || '/', 'http://localhost'); return u.searchParams.get('token'); }\n" +
      "  catch { return null; }\n" +
      "};";
    if (serverCode.includes(cookieLine)) {
      serverCode = serverCode.replace(cookieLine, cookieLine + bearerDef);
      serverChanged = true;
    }

    // 2. validSession: uu tien Bearer token
    const oldValid = "const token = cookieValue(request), key = token && sessionKey(token)";
    const newValid = "// v5.12: uu tien Bearer token, fallback cookie\n    const token = bearerToken(request) || cookieValue(request), key = token && sessionKey(token)";
    if (serverCode.includes(oldValid)) {
      serverCode = serverCode.replace(oldValid, newValid);
      serverChanged = true;
    }

    // 3. sessionCookie: tra ve token de frontend luu (doi thanh ham tra ve token)
    // Thay: await sessionCookie(response, request, account);
    // Them: lay token tu ham moi
    const oldSessionFn = "  async function sessionCookie(response, request, account) {\n    const token = randomBytes(32).toString('hex');";
    const newSessionFn = "  // v5.12: tao session va tra ve token (de frontend luu, gui qua Authorization header).\n" +
      "  async function createSessionToken(account) {\n" +
      "    const token = randomBytes(32).toString('hex');\n" +
      "    await commitSessions(next => next.set(sessionKey(token), { id: account.id, expires: Date.now() + SESSION_MS }));\n" +
      "    return token;\n" +
      "  }\n" +
      "  async function sessionCookie(response, request, account) {\n" +
      "    const token = await createSessionToken(account);";
    if (serverCode.includes(oldSessionFn)) {
      serverCode = serverCode.replace(oldSessionFn, newSessionFn);
      serverChanged = true;
    }

    // 4. Login/register response: them token
    // Tim: return respond(response, 200, { account: publicAccount(account),
    const oldResp = "return respond(response, 200, { account: publicAccount(account), profile: account.profile, revision:account.profileRevision||0, authorityVersion:1, ...await refreshFriends(account) });";
    // Can lay token - sua lai de tao token truoc roi tra ve
    // Cach don gian: sau khi goi sessionCookie, token da duoc tao, nhung ta can lay no.
    // Doi lai: tao token truoc, roi set cookie + tra ve trong response.
    if (serverCode.includes(oldResp)) {
      const newResp = "const __v512_token = await createSessionToken(account);\n" +
        "      { const secure = request.socket.encrypted || process.env.COOKIE_SECURE === '1'; const __ss = process.env.COOKIE_SAMESITE === 'None' ? 'None' : 'Strict'; const __sec = __ss === 'None' ? true : secure; response.setHeader('Set-Cookie', `${COOKIE}=${__v512_token}; HttpOnly; SameSite=${__ss}; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}${__sec ? '; Secure' : ''}`); }\n" +
        "      return respond(response, 200, { account: publicAccount(account), profile: account.profile, revision:account.profileRevision||0, authorityVersion:1, token: __v512_token, ...await refreshFriends(account) });";
      // Xoa dong sessionCookie cu truoc do
      serverCode = serverCode.replace(
        "await sessionCookie(response, request, account);\n      return respond(response, 200, { account: publicAccount(account), profile: account.profile, revision:account.profileRevision||0, authorityVersion:1, ...await refreshFriends(account) });",
        newResp
      );
      serverChanged = true;
    }

    if (serverChanged) {
      await fs.writeFile(serverFile, serverCode);
      console.log('[v5.12] patched server/server.mjs: Bearer token auth.');
    }
  } else {
    console.log('[v5.12] backend da patch roi.');
  }

  // === FRONTEND ===
  const onlineFile = path.join(root, 'src', 'online.ts');
  let onlineCode = await fs.readFile(onlineFile, 'utf8');
  let frontChanged = false;

  if (!onlineCode.includes('v5.12 token')) {
    // 1. Khai bao token storage
    const marker = "let host:string|null=null,party:string|null=null,planet='',visiting:string|null=null,zone:'common'|null=null,offline:SaveState|null=null,roomEpoch=0;";
    if (onlineCode.includes(marker)) {
      onlineCode = onlineCode.replace(marker, marker +
        "\n  // v5.12 token: luu trong localStorage, gui qua Authorization header.\n" +
        "  const TOKEN_KEY='zp-token'; let authToken:string|null=null;\n" +
        "  try{authToken=localStorage.getItem(TOKEN_KEY);}catch{}\n" +
        "  function setToken(t:string|null){authToken=t;try{if(t)localStorage.setItem(TOKEN_KEY,t);else localStorage.removeItem(TOKEN_KEY);}catch{}}");
      frontChanged = true;
    }

    // 2. api(): gui Authorization header
    const oldFetch = "headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});}catch{throw new Error('Connection interrupted. Please try again.');}";
    const newFetch = "headers:(()=>{const h:{[k:string]:string}={'Content-Type':'application/json'};if(authToken)h['Authorization']='Bearer '+authToken;return h;})(),body:data?JSON.stringify(data):undefined});}catch{throw new Error('Connection interrupted. Please try again.');}";
    if (onlineCode.includes(oldFetch)) {
      onlineCode = onlineCode.replace(oldFetch, newFetch);
      frontChanged = true;
    }

    // 3. Luu token sau khi login/register: tim noi xu ly response co account
    // Pattern: const session=await api<Session>('auth/login' hoac register
    // Se thay the de lay token tu response
    // Tim doan: begin(session) hoac tuong tu sau login
    // Don gian: sau moi lan goi api tra ve co .token thi luu
    // Chen vao ham api(): neu response co token thi luu
    const oldReturn = "if(!response.ok)throw Object.assign(new Error(value.error||'Connection interrupted. Please try again.'),{status:response.status});return value as T;";
    const newReturn = "if(!response.ok)throw Object.assign(new Error(value.error||'Connection interrupted. Please try again.'),{status:response.status});\n    // v5.12 token: tu dong luu token neu server tra ve\n    try{const _v=(value as unknown as {token?:string});if(_v&&typeof _v.token==='string'&&_v.token)setToken(_v.token);}catch{}\n    return value as T;";
    if (onlineCode.includes(oldReturn)) {
      onlineCode = onlineCode.replace(oldReturn, newReturn);
      frontChanged = true;
    }

    // 4. WebSocket: kem ?token= vao URL
    // Tim: new WebSocket(
    const wsPattern = /new WebSocket\(`\$\{serviceBase\}socket`\)/;
    if (wsPattern.test(onlineCode)) {
      onlineCode = onlineCode.replace(wsPattern, "new WebSocket(`${serviceBase}socket${authToken?`?token=${encodeURIComponent(authToken)}`:''}`)");
      frontChanged = true;
    } else {
      // Thu pattern khac
      const ws2 = "new WebSocket(`${serviceBase}socket`)";
      if (onlineCode.includes(ws2)) {
        onlineCode = onlineCode.replace(ws2, "new WebSocket(`${serviceBase}socket${authToken?`?token=${encodeURIComponent(authToken)}`:''}`)");
        frontChanged = true;
      }
    }

    // 5. Logout: xoa token
    // Tim ham logout hoac noi goi auth/logout, them setToken(null)
    const logoutCall = "await api('auth/logout',{})";
    if (onlineCode.includes(logoutCall)) {
      onlineCode = onlineCode.replace(logoutCall, "await api('auth/logout',{}); setToken(null)");
      frontChanged = true;
    }
    // expireSession cung nen xoa token
    const expireFn = "function expireSession(){";
    if (onlineCode.includes(expireFn)) {
      onlineCode = onlineCode.replace(expireFn, "function expireSession(){\n    setToken(null);");
      frontChanged = true;
    }

    if (frontChanged) {
      await fs.writeFile(onlineFile, onlineCode);
      console.log('[v5.12] patched src/online.ts: Bearer token frontend.');
    }
  } else {
    console.log('[v5.12] frontend da patch roi.');
  }
}
