// Patch v5.3 — qua cong khi het tham: (1) khong dung di chuyen, (2) het khựng thua.
// (1) setVisiting goi closeDialog() vo dieu kien -> clearHeldInput() -> joystick.clear()
//     be gay joystick dang giu o cong. Fix: chi closeDialog khi thuc su co dialog mo.
// (2) world.refreshPlayer() rebuild avatar moi lan vao/ra tham trong khi ngoai hinh
//     khong he doi -> thua + khựng 1 frame. Bo (ban goc cung khong rebuild).
// KHI archive/ duoc tai tao DA GOM FIX: xoa file nay.
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EDITS = [["    visiting=owner;resetCombat();closeDialog();", "    visiting=owner;resetCombat();\n    // closeDialog() xoa ca input dang giu (joystick.clear) → chi goi khi thuc su co dialog mo,\n    // de di bo qua cong khi het tham khong bi dung lai nhuong cho.\n    if(modal||document.querySelector('dialog[open]'))closeDialog();"], ["      if(expanded){syncVisitPresentation();world.refreshPlayer();}", "      if(expanded){syncVisitPresentation();}"], ["    world.refreshPlayer();$('#visit-banner').hidden=!owner;$('#visit-banner').textContent=t(owner?t('Visiting {owner} · look around their garden',{owner}):'');updateLabels();", "    // Khong refreshPlayer o day: ngoai hinh (gear/mau) khong doi khi tham nha —\n    // rebuild avatar la thua va gay khựng 1 frame khi qua cong (ban goc cung khong lam).\n    $('#visit-banner').hidden=!owner;$('#visit-banner').textContent=t(owner?t('Visiting {owner} · look around their garden',{owner}):'');updateLabels();"]];

export async function apply(root) {
  const p = join(root, 'src/main.ts');
  let s = await readFile(p, 'utf8');
  let i = 0;
  for (const [oldStr, newStr] of EDITS) {
    i++;
    const n = s.split(oldStr).length - 1;
    if (n !== 1) throw new Error(`[patch v5.3] diem sua ${i}: tim thay ${n} vi tri, can dung 1 — DUNG LAI de Khương kiem tra`);
    s = s.replace(oldStr, newStr);
  }
  await writeFile(p, s);
  console.log('[patch] v5.3 gate flow: 3 diem sua tren src/main.ts OK');
}
