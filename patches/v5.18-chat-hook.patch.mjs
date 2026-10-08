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
  // Code goc: else if(message.type==='chat'&&!restoring&&chatRoom){chat.push({name:String(message.name),message:String(message.message)});...
  // message co truong id (từ server broadcast)
  const chatPattern = "chat.push({name:String(message.name),message:String(message.message)})";
  if (code.includes(chatPattern)) {
    const replacement = chatPattern + `;
    // v5.18: hien bong bong tren dau nguoi gui (message.id tu server)
    try{
      const _mid = (message as unknown as {id?:string}).id;
      const _mmsg = String((message as unknown as {message?:string}).message||'');
      if(_mid && typeof world==='function'){
        const w=world() as unknown as {sayRemote?:(i:string,m:string)=>void};
        w.sayRemote?.(_mid, _mmsg);
      }
    }catch{}`;
    code = code.replace(chatPattern, replacement);
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
