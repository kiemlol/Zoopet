// Patch v5.4 — qua cong khong con khựng/nhap nhay bots.
// Nguyen nhan: bots.ts render AI neighbours QUA world.remotePlayers (chung map voi
// player online). Moi lan qua cong, enterCommon/exitCommon -> renderPlayers() ->
// updateRemotePlayers([]) (offline, players rong) XOA avatar cua TAT CA bots, roi
// 1/12s sau bots tu addRemotePlayer lai -> rebuild avatar -> khựng + bots nhap nhay.
// Fix: updateRemotePlayers khong xoa id bot: (bots tu quan ly vong doi cua minh).
// KHI archive/ duoc tai tao DA GOM FIX: xoa file nay.
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EDITS = [["import * as T from 'three';", "import * as T from 'three';\nimport {isBotId} from './bot-logic.ts';"], ["  updateRemotePlayers(players:Array<RemotePose&{id:string}>){const ids=new Set(players.map(p=>p.id));for(const id of this.remotePlayers?.keys()??[])if(!ids.has(id))this.removeRemotePlayer(id);for(const pose of players)this.updateRemotePlayer(pose.id,pose);}", "  /** AI neighbours (bots.ts) tu quan ly avatar cua minh qua add/update/removeRemotePlayer —\n   *  updateRemotePlayers (danh sach player online) KHONG duoc xoa chung, neu khong moi lan\n   *  qua cong (renderPlayers) bots se bi huy avatar roi dung lai sau 1/12s → khựng + nhap nhay. */\n  updateRemotePlayers(players:Array<RemotePose&{id:string}>){const ids=new Set(players.map(p=>p.id));for(const id of this.remotePlayers?.keys()??[])if(!ids.has(id)&&!isBotId(id))this.removeRemotePlayer(id);for(const pose of players)this.updateRemotePlayer(pose.id,pose);}"]];

export async function apply(root) {
  const p = join(root, 'src/world.ts');
  let s = await readFile(p, 'utf8');
  let i = 0;
  for (const [oldStr, newStr] of EDITS) {
    i++;
    const n = s.split(oldStr).length - 1;
    if (n !== 1) throw new Error(`[patch v5.4] diem sua ${i}: tim thay ${n} vi tri, can dung 1 — DUNG LAI de Khương kiem tra`);
    s = s.replace(oldStr, newStr);
  }
  await writeFile(p, s);
  console.log('[patch] v5.4 bot avatar: 2 diem sua tren src/world.ts OK');
}
