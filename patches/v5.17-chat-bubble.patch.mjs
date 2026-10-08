// Patch v5.17: Bong bong chat tren dau nhu ban goc.
// - Moi remote player co 1 div.bubble, append vao #chat-bubbles (tao moi).
// - Moi frame: project vi tri 3D (tren dau) ra 2D, cap nhat vi tri bubble.
// - say(msg): hien bubble 5s.
// - Nguoi choi local cung co bubble.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'world.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.17: chat bubble')) {
    console.log('[v5.17] da patch roi, bo qua.');
    return;
  }

  // 1. Them CSS va container cho bubbles (o dau file, sau import)
  const cssInject = `
  // v5.17: chat bubble - CSS va container
  if(typeof document!=='undefined' && !document.getElementById('chat-bubbles')){
    const st=document.createElement('style');
    st.textContent=\`
      #chat-bubbles{position:fixed;inset:0;pointer-events:none;z-index:35;overflow:hidden}
      #chat-bubbles .bubble{position:absolute;left:0;top:0;background:#fff;color:#000;font-weight:700;font-size:14px;border-radius:14px;padding:4px 12px;max-width:220px;text-align:center;box-shadow:0 1px 6px #0003;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #chat-bubbles .bubble:after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #fff}
    \`;
    document.head.appendChild(st);
    const cb=document.createElement('div');
    cb.id='chat-bubbles';
    document.body.appendChild(cb);
  }
  `;

  // Chen sau dong import dau tien
  const importLine = "import * as T from 'three';";
  if (code.includes(importLine)) {
    code = code.replace(importLine, importLine + "\n" + cssInject);
  }

  // 2. Them bubble vao remotePlayers Map type: them truong bubble?:HTMLDivElement, bubbleT?:number
  const mapDecl = "remotePlayers=new Map<string,{mesh:T.Group;pose:RemotePose}>();";
  const mapDeclNew = "remotePlayers=new Map<string,{mesh:T.Group;pose:RemotePose;bubble?:HTMLDivElement;bubbleT?:number}>();";
  if (code.includes(mapDecl)) {
    code = code.replace(mapDecl, mapDeclNew);
  }

  // 3. Trong addRemotePlayer: tao bubble div
  const addRemote = "this.remotePlayers.set(id,{mesh:avatar,pose:{...pose}});";
  const addRemoteNew = `this.remotePlayers.set(id,{mesh:avatar,pose:{...pose}});
    // v5.17: tao bubble cho remote player
    try{
      const cb=document.getElementById('chat-bubbles');
      if(cb){
        const b=document.createElement('div');
        b.className='bubble';
        b.style.display='none';
        cb.appendChild(b);
        this.remotePlayers.get(id)!.bubble=b;
        this.remotePlayers.get(id)!.bubbleT=0;
      }
    }catch{}`;
  if (code.includes(addRemote)) {
    code = code.replace(addRemote, addRemoteNew);
  }

  // 4. Trong removeRemotePlayer: xoa bubble
  const removeRemote = "this.remoteRoot.remove(remote.mesh);this.disposeTree(remote.mesh);this.remotePlayers.delete(id);";
  const removeRemoteNew = `this.remoteRoot.remove(remote.mesh);this.disposeTree(remote.mesh);
    // v5.17: xoa bubble
    try{remote.bubble?.remove();}catch{}
    this.remotePlayers.delete(id);`;
  if (code.includes(removeRemote)) {
    code = code.replace(removeRemote, removeRemoteNew);
  }

  // 5. Them method say(id, msg) de hien bubble
  // Chen truoc ham clearRemotePlayers
  const clearFn = "  clearRemotePlayers(){";
  const sayMethod = `  // v5.17: hien bong bong chat tren dau (nhu ban goc)
  sayRemote(id:string,msg:string){
    const r=this.remotePlayers?.get(id);
    if(!r||!r.bubble)return;
    r.bubble.textContent=msg;
    r.bubbleT=5;
    r.bubble.style.display='block';
  }
  ` + clearFn;
  if (code.includes(clearFn)) {
    code = code.replace(clearFn, sayMethod);
  }

  // 6. Cap nhat vi tri bubble moi frame: tim vong lap update remote players
  // Tim cho co: for(const [id,remote] of this.remotePlayers
  // Them code project 3D->2D sau khi cap nhat pose
  // Don gian: them vao cuoi ham update (tim 'update(dt:number')
  // Thay vao do, them 1 ham rieng duoc goi moi frame tu online.ts hoac main.ts
  // Tam thoi: expose ham updateBubbles
  const updateAnchor = "  clearRemotePlayers(){";
  const updateBubblesFn = `  // v5.17: cap nhat vi tri bong bong moi frame (goi tu game loop)
  updateChatBubbles(){
    try{
      const cb=document.getElementById('chat-bubbles');
      if(!cb)return;
      const v=new T.Vector3();
      for(const [id,r] of this.remotePlayers??[]){
        if(!r.bubble)continue;
        // Dem nguoc timer
        if((r.bubbleT??0)>0){
          r.bubbleT=(r.bubbleT??0)-1/60; // gia dinh 60fps, se duoc goi moi frame
          if((r.bubbleT??0)<=0){ r.bubble.style.display='none'; continue; }
        }else{
          r.bubble.style.display='none';
          continue;
        }
        // Chi hien khi remote visible
        if(!r.mesh.visible){ r.bubble.style.display='none'; continue; }
        // Project vi tri 3D (tren dau) ra 2D
        r.mesh.getWorldPosition(v);
        v.y+=2.2; // tren dau
        v.project(this.camera);
        // Kiem tra co truoc camera khong
        if(v.z>1){ r.bubble.style.display='none'; continue; }
        const x=(v.x*0.5+0.5)*innerWidth;
        const y=(-v.y*0.5+0.5)*innerHeight;
        r.bubble.style.display='block';
        // Giong ban goc: translate(f, p-34) translate(-50%,-100%)
        r.bubble.style.transform=\`translate(\${x}px, \${y-34}px) translate(-50%,-100%)\`;
      }
    }catch{}
  }
  ` + updateAnchor;
  if (code.includes(updateAnchor)) {
    code = code.replace(updateAnchor, updateBubblesFn);
  }

  await fs.writeFile(file, code);
  console.log('[v5.17] patched src/world.ts: bong bong chat tren dau.');
}
