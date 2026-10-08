// Patch v5.14 (v2): Tu dong hien modal dang nhap khi mo game.
// Don gian hoa: chi them auto-show, khong sua nut X hay chan Escape phuc tap.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'online.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.14v2')) {
    console.log('[v5.14v2] da patch roi, bo qua.');
    return;
  }

  // Chen auto-show truoc game.enterCommon
  // Su dung bien cuc bo trong closure, khong can bien toan cuc
  const anchor = "  game.enterCommon=enterCommon;";
  const autoShow = `  // v5.14v2: tu dong mo dialog dang nhap neu chua co account/token
  setTimeout(()=>{
    try{
      const hasToken = (()=>{ try{ return !!localStorage.getItem('zp-token'); }catch{ return false; } })();
      // @ts-ignore - account la bien trong closure
      if(!(typeof account!=='undefined'&&account) && !hasToken){
        // @ts-ignore
        if(typeof dialog!=='undefined'&&dialog&&!dialog.open){
          // @ts-ignore
          if(typeof render==='function'){ try{render();}catch{} }
          // @ts-ignore
          dialog.showModal();
        }
      }
    }catch{}
  },1000);
  ` + anchor;

  if (code.includes(anchor) && !code.includes('v5.14v2')) {
    code = code.replace(anchor, autoShow);
    // Danh dau
    code = code.replace("  // v5.14v2:", "  // v5.14v2");
  }

  await fs.writeFile(file, code);
  console.log('[v5.14v2] patched src/online.ts: auto-show auth don gian.');
}
