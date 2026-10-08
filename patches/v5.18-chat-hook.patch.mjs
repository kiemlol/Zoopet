// Patch v5.18: Hook chat vao bong bong + goi update moi frame.
// - Khi nhan tin nhan chat: goi world().sayRemote(id, msg) de hien bong bong.
// - Moi frame: goi world().updateChatBubbles() de cap nhat vi tri.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'online.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.18: hook chat bubble')) {
    console.log('[v5.18] da patch roi, bo qua.');
    return;
  }

  // 1. Khi nhan chat: goi sayRemote
  // Tim cho xu ly message.type==='chat'
  // Pattern hien tai: chat.push({name,message}) hoac tuong tu
  // Them goi sayRemote sau khi push
  const chatPushPatterns = [
    "chat.push({name,message}); try{__showChatLine(name,message);}catch{}",
    "chat.push({name,message})"
  ];
  for (const pat of chatPushPatterns) {
    if (code.includes(pat)) {
      // Can biet id cua nguoi gui - tim bien id gan do
      // Don gian: them try-catch goi sayRemote neu co id
      const replacement = pat + `;
    // v5.18: hien bong bong tren dau
    try{
      const _id = (typeof id!=='undefined'?id:null) || (typeof senderId!=='undefined'?senderId:null);
      if(_id && typeof world==='function'){ const w=world() as unknown as {sayRemote?:(i:string,m:string)=>void}; w.sayRemote?.(_id, message); }
    }catch{}`;
      code = code.replace(pat, replacement);
      break;
    }
  }

  // 2. Goi updateChatBubbles moi frame: them vao game.onFrame
  const onFramePattern = "game.onFrame(dt=>{";
  const onFrameNew = `game.onFrame(dt=>{
    // v5.18: cap nhat vi tri bong bong chat
    try{ (world() as unknown as {updateChatBubbles?:()=>void}).updateChatBubbles?.(); }catch{}`;
  if (code.includes(onFramePattern)) {
    code = code.replace(onFramePattern, onFrameNew);
  }

  await fs.writeFile(file, code);
  console.log('[v5.18] patched src/online.ts: hook chat bubble.');
}
