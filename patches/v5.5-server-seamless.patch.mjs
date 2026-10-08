// Patch v5.5 — server: qua cong lien mach cho nguoi khac nhin (online).
// Truoc day server ep peer.pose ve diem co dinh ((0,30)/(0,-4.3)) moi lan qua cong:
// nguoi di thi muot (client khong tu teleport) nhung NGUOI KHAC nhin thay "nhay coc".
// Fix kieu ban goc: chi doi zone, de pose chay tu nhien theo stream 10Hz cua client.
// KHI archive/ duoc tai tao DA GOM FIX: xoa file nay.
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EDITS = [["    if (toCommon) {\n      // Rời nhà thăm qua cổng -> về khu chung (Đồng Cỏ Hồ Xanh), không teleport về nhà mình\n      peer.zone = 'common';\n      peer.pose = { ...peer.pose, x: 0, z: 30 };\n    } else {", "    if (toCommon) {\n      // Rời nhà thăm qua cổng -> về khu chung (Đồng Cỏ Hồ Xanh), không teleport về nhà mình.\n      // KHONG ep peer.pose: client tu di bo lien mach, pose chay tu nhien theo stream 10Hz —\n      // ep pose se khien nguoi khac thay \"nhay coc\". Chi can doi zone.\n      peer.zone = 'common';\n    } else {"], ["          // Đi qua cổng ở nhà riêng -> vào khu chung (Đồng Cỏ Hồ Xanh)\n          if (peer.visit) endVisit(peer, true);\n          else { peer.zone = 'common'; peer.pose = { ...peer.pose, x: 0, z: 30 }; peer.lastSent = null; broadcastPose(rooms.get(peer.room), peer); }", "          // Đi qua cổng ở nhà riêng -> vào khu chung (Đồng Cỏ Hồ Xanh).\n          // KHONG ep peer.pose ve (0,30): client di bo lien mach, de pose chay tu nhien.\n          if (peer.visit) endVisit(peer, true);\n          else { peer.zone = 'common'; peer.lastSent = null; broadcastPose(rooms.get(peer.room), peer); }"], ["          // Đi qua cổng ở khu chung -> về nhà riêng\n          peer.zone = null; peer.pose = { ...peer.pose, x: 0, z: -4.3 }; peer.lastSent = null; broadcastPose(rooms.get(peer.room), peer);", "          // Đi qua cổng ở khu chung -> về nhà riêng. KHONG ep pose ve (0,-4.3).\n          peer.zone = null; peer.lastSent = null; broadcastPose(rooms.get(peer.room), peer);"]];

export async function apply(root) {
  const p = join(root, 'server/server.mjs');
  let s = await readFile(p, 'utf8');
  let i = 0;
  for (const [oldStr, newStr] of EDITS) {
    i++;
    const n = s.split(oldStr).length - 1;
    if (n !== 1) throw new Error(`[patch v5.5] diem sua ${i}: tim thay ${n} vi tri, can dung 1 — DUNG LAI de Khương kiem tra`);
    s = s.replace(oldStr, newStr);
  }
  await writeFile(p, s);
  console.log('[patch] v5.5 server seamless: 3 diem sua tren server/server.mjs OK');
}
