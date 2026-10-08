// Patch v5.14: Tu dong hien modal dang nhap khi mo game (nhu ban goc).
// - Neu chua co token/account: tu dong mo dialog auth, khong cho tat (an nut X).
// - Sau khi login thanh cong: reload trang (nhu ban goc).
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'online.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.14: auto-show auth')) {
    console.log('[v5.14] da patch roi, bo qua.');
    return;
  }

  // 1. Them bien danh dau che do bat buoc dang nhap
  const marker = "let authSubmit:HTMLButtonElement|null=null;";
  const forcedVar = marker + "\n  // v5.14: auto-show auth - hien modal dang nhap ngay khi mo game neu chua co token.\n  let forcedAuth=false;";
  if (code.includes(marker)) {
    code = code.replace(marker, forcedVar);
  }

  // 2. Trong ham render(): neu forcedAuth thi an nut X
  const closeBtn = "const header=el('header','social-header'),heading=el('h2','',t('Play together')),close=button('✕',()=>dialog.close(),'social-close');";
  const closeBtnNew = "const header=el('header','social-header'),heading=el('h2','',t('Play together')),close=button('✕',()=>{if(!forcedAuth)dialog.close();},'social-close');";
  if (code.includes(closeBtn)) {
    code = code.replace(closeBtn, closeBtnNew);
  }

  // 3. Sau khi dinh nghia xong cac ham, tu dong hien dialog neu chua login
  // Tim cuoi file hoac cho thich hop de chen auto-show
  // Chen truoc dong: game.enterCommon=enterCommon;
  const anchor = "  game.enterCommon=enterCommon;";
  const autoShow = "  // v5.14: auto-show auth - neu chua co token thi hien modal dang nhap ngay.\n" +
    "  // (giong ban goc: modal che toan man hinh, khong tat duoc)\n" +
    "  setTimeout(()=>{\n" +
    "    if(!account && !authToken){\n" +
    "      forcedAuth=true;\n" +
    "      const cb=dialog.querySelector('.social-close') as HTMLElement;\n" +
    "      if(cb)cb.style.display='none';\n" +
    "      tab='world';register=false;render();\n" +
    "      if(!dialog.open)dialog.showModal();\n" +
    "    }\n" +
    "  },800);\n" +
    "  // Khi login thanh cong (begin), tat che do forced va reload (nhu ban goc)\n" +
    "  const __origBegin=begin;\n" +
    "  (begin as unknown as (s:unknown)=>void)=(s:unknown)=>{\n" +
    "    const wasForced=forcedAuth;\n" +
    "    forcedAuth=false;\n" +
    "    __origBegin(s);\n" +
    "    if(wasForced){\n" +
    "      try{location.reload();}catch{}\n" +
    "    }\n" +
    "  };\n" +
    "  " + anchor;
  if (code.includes(anchor)) {
    code = code.replace(anchor, autoShow);
  }

  // 4. Chan tat dialog bang click ra ngoai khi forcedAuth
  const clickHandler = "dialog.addEventListener('click',event=>{if(event.target===dialog&&event.clientX&&(event.clientX<dialog.getBoundingClientRect().left||event.clientX>dialog.getBoundingClientRect().right))dialog.close();});";
  const clickHandlerNew = "dialog.addEventListener('click',event=>{if(forcedAuth)return;if(event.target===dialog&&event.clientX&&(event.clientX<dialog.getBoundingClientRect().left||event.clientX>dialog.getBoundingClientRect().right))dialog.close();});";
  if (code.includes(clickHandler)) {
    code = code.replace(clickHandler, clickHandlerNew);
  }

  // 5. Chan phim Escape tat dialog khi forcedAuth
  // Them sau khi tao dialog
  const dialogDef = "const dialog=el('dialog','social-dialog');dialog.id='online-dialog';";
  const escBlock = dialogDef + "\n  dialog.addEventListener('cancel',e=>{if(forcedAuth)e.preventDefault();});";
  if (code.includes(dialogDef)) {
    code = code.replace(dialogDef, escBlock);
  }

  await fs.writeFile(file, code);
  console.log('[v5.14] patched src/online.ts: auto-show auth modal khi mo game.');
}
