// Patch v5.21: Host dong bo HP nhung khong bi ghi de vi tri.
// Khi host nhan snapshot enemies tu server, bo qua vi tri (de AI muot)
// nhung van cap nhat HP/trang thai.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'online.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.21: host HP-only sync')) {
    console.log('[v5.21] da patch roi, bo qua.');
    return;
  }

  // Tim doan: if(host!==account?.id)world().applyEnemySnapshots(message.enemies);
  // Thay bang: if host -> chi sync HP, khong sync vi tri
  const pattern = /if\(host!==account\?\.id\)world\(\)\.applyEnemySnapshots\(message\.enemies\);/;
  const replacement = `if(host!==account?.id){world().applyEnemySnapshots(message.enemies);}else{
      // v5.21: host HP-only sync - bo qua vi tri de AI muot, chi lay HP/trang thai
      try{
        const _w=world(); const _list=(_w as unknown as {enemies?:Array<{id:string;hp?:number;maxHp?:number}>}).enemies;
        if(_list&&message.enemies)for(const _s of message.enemies as Array<{id:string;hp?:number;maxHp?:number}>){
          const _e=_list.find(e=>e.id===_s.id);
          if(_e){ if(typeof _s.hp==='number')_e.hp=_s.hp; if(typeof _s.maxHp==='number')_e.maxHp=_s.maxHp; }
        }
      }catch{}
    }`;

  if (!pattern.test(code)) {
    console.log('[v5.21] khong thay pattern, bo qua.');
    return;
  }

  code = code.replace(pattern, replacement);
  await fs.writeFile(file, code);
  console.log('[v5.21] patched src/online.ts: host HP-only sync.');
}
