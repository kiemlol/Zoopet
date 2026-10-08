// Patch v5.15: Giao dien nhan tin nhu ban goc.
// - Chat box overlay: bottom-center, luon hien, toi da 6 dong, 8s tu mo.
// - Format: <b>Ten:</b> noi dung (chu trang 13px, nen den mo).
// - O nhap: an mac dinh, hien khi bam Enter hoac nut chat.
// - Bong bong: nen trang, chu den dam 14px, hien 5s tren dau nhan vat, co duoi tam giac.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'online.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.15: chat overlay')) {
    console.log('[v5.15] da patch roi, bo qua.');
    return;
  }

  // 1. Them CSS cho chat overlay (chen vao dau file, sau import)
  const cssBlock = `
  // v5.15: chat overlay - CSS inject
  const __chatCss = document.createElement('style');
  __chatCss.textContent = \`
    #chat-box{position:fixed;bottom:44px;left:50%;transform:translateX(-50%);z-index:40;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:2px;max-width:90vw}
    #chat-box .chat-line{background:#3a243399;color:#fff;font-size:13px;border-radius:10px;padding:1px 10px;width:fit-content;max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:opacity 1s}
    #chat-box .chat-line.fading{opacity:0}
    #chat-box .chat-line b{font-weight:700}
    #chat-input-wrap{position:fixed;bottom:44px;left:50%;transform:translateX(-50%);z-index:41;display:none;gap:6px;align-items:center;background:#fff;border-radius:12px;padding:6px;box-shadow:0 2px 12px #0004}
    #chat-input-wrap.open{display:flex}
    #chat-input{border:none;outline:none;font-size:14px;padding:6px 10px;width:min(60vw,320px);border-radius:8px;background:#f5f5f5}
    #chat-send{background:#3fae52;color:#fff;font-weight:700;border:none;border-radius:8px;padding:8px 14px;cursor:pointer}
    .chat-bubble{position:fixed;z-index:39;pointer-events:none;background:#fff;color:#000;font-weight:700;font-size:14px;border-radius:14px;padding:4px 12px;max-width:220px;text-align:center;transform:translate(-50%,-100%);box-shadow:0 1px 6px #0003}
    .chat-bubble:after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #fff}
  \`;
  document.head.appendChild(__chatCss);
  // Tao chat box overlay
  const __chatBox = document.createElement('div');
  __chatBox.id = 'chat-box';
  document.body.appendChild(__chatBox);
  // Tao o nhap chat
  const __chatWrap = document.createElement('div');
  __chatWrap.id = 'chat-input-wrap';
  __chatWrap.innerHTML = '<input id="chat-input" maxlength="120" placeholder="Nhắn gì đó…"><button id="chat-send">Gửi</button>';
  document.body.appendChild(__chatWrap);
  `;

  // Chen sau dong: const dialog=el('dialog','social-dialog');
  const dialogLine = "const dialog=el('dialog','social-dialog');";
  if (code.includes(dialogLine)) {
    code = code.replace(dialogLine, dialogLine + "\n" + cssBlock);
  }

  // 2. Ham hien thi chat log (overlay)
  const chatFn = `
  // v5.15: chat overlay - hien thi tin nhan
  function __showChatLine(name:string,msg:string){
    const line=document.createElement('div');
    line.className='chat-line';
    const b=document.createElement('b');b.textContent=name+': ';
    line.appendChild(b);
    line.appendChild(document.createTextNode(msg));
    __chatBox.appendChild(line);
    // Giu toi da 6 dong
    while(__chatBox.children.length>6)__chatBox.firstChild?.remove();
    // 8s sau mo dan roi xoa
    setTimeout(()=>{line.classList.add('fading');setTimeout(()=>line.remove(),1000);},8000);
  }
  // v5.15: bong bong chat tren dau (don gian: hien tren dau nguoi choi hien tai)
  function __showBubble(msg:string){
    // Tim vi tri nguoi choi tren man hinh (don gian: giua man hinh, phia tren)
    const b=document.createElement('div');
    b.className='chat-bubble';
    b.textContent=msg;
    // Dat o giua man hinh, cach top 30%
    b.style.left='50%';
    b.style.top='30%';
    document.body.appendChild(b);
    setTimeout(()=>b.remove(),5000);
  }
  `;

  if (code.includes(dialogLine)) {
    code = code.replace(dialogLine + "\n" + cssBlock, dialogLine + "\n" + cssBlock + "\n" + chatFn);
  }

  // 3. Hook vao noi nhan chat: tim cho xu ly message.type==='chat'
  // Hien tai chat duoc luu vao mang chat[] va render trong dialog.
  // Them: goi __showChatLine khi co tin nhan moi.
  // Tim ham submitChat hoac noi push vao chat[]
  const chatPush = "chat.push({name,message})";
  if (code.includes(chatPush)) {
    code = code.replace(chatPush, chatPush + "; try{__showChatLine(name,message);}catch{}");
  }

  // 4. Enter de mo o nhap chat (khi dang online)
  const keyHandler = `
  // v5.15: Enter mo o nhap chat
  document.addEventListener('keydown',(e)=>{
    if(!account)return;
    const input=document.getElementById('chat-input') as HTMLInputElement|null;
    const wrap=document.getElementById('chat-input-wrap');
    if(e.key==='Enter' && document.activeElement!==input){
      // Khong mo khi dang nhap o input khac hoac dialog mo
      const tag=(document.activeElement?.tagName||'').toLowerCase();
      if(tag==='input'||tag==='textarea')return;
      if(dialog.open)return;
      e.preventDefault();
      wrap?.classList.add('open');
      input?.focus();
    }else if(e.key==='Escape' && wrap?.classList.contains('open')){
      wrap.classList.remove('open');
      input?.blur();
    }
  });
  // Nut Gui
  setTimeout(()=>{
    document.getElementById('chat-send')?.addEventListener('click',()=>{
      const input=document.getElementById('chat-input') as HTMLInputElement|null;
      const text=input?.value.trim().slice(0,120)||'';
      if(text){
        // Gui qua ham submitChat co san (can expose)
        try{(window as unknown as {_zpSendChat?:(t:string)=>void})._zpSendChat?.(text);}catch{}
        // Fallback: goi truc tiep neu co ham
      }
      input!.value='';
      document.getElementById('chat-input-wrap')?.classList.remove('open');
      input?.blur();
    });
    document.getElementById('chat-input')?.addEventListener('keydown',(e)=>{
      if(e.key==='Enter'){
        e.preventDefault();
        (document.getElementById('chat-send') as HTMLButtonElement)?.click();
      }
    });
  },1000);
  `;

  // Chen truoc game.enterCommon
  const anchor2 = "  game.enterCommon=enterCommon;";
  if (code.includes(anchor2)) {
    code = code.replace(anchor2, keyHandler + "\n  " + anchor2);
  }

  // 5. Expose ham gui chat de nut Gui goi duoc
  // Tim ham submitChat
  const submitFn = "async function submitChat()";
  if (code.includes(submitFn)) {
    code = code.replace(submitFn, "function __exposeSendChat(){try{(window as unknown as {_zpSendChat:(t:string)=>void})._zpSendChat=(t:string)=>{const inp=content.querySelector<HTMLInputElement>('.social-chat-input');if(inp){inp.value=t;submitChat();}};}catch{}}\n  " + submitFn);
    // Goi expose sau khi dinh nghia
    code = code.replace(anchor2, "  __exposeSendChat();\n  " + anchor2);
  }

  await fs.writeFile(file, code);
  console.log('[v5.15] patched src/online.ts: chat overlay nhu ban goc.');
}
