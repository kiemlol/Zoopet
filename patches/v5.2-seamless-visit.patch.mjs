// Patch v5.2 — tham nha lien mach (seamless gate), chay boi scripts/restore.mjs.
// Van de: vao/ra nha tham goi rebuildHomePresentation -> world.build() rebuild TOAN BO
// (respawn quai, cameraTarget.copy(position) gay luot camera) -> khựng + chuyen canh.
// Fix kieu ban goc (farm.showRemote/decor.showRemote): chi sync luong + decor.
// KHI archive/ duoc tai tao DA GOM FIX: xoa file nay.
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EDITS = [["function rebuildHomePresentation(planet:M.PlanetId){\n  const shared=network.role&&world.planet===planet, enemies=shared?world.enemySnapshots():null,environment=shared?world.environmentSnapshot():null;\n  world.build(planet);if(enemies)world.applyEnemySnapshots(enemies);if(environment)world.applyEnvironmentSnapshot(environment);\n}", "function rebuildHomePresentation(planet:M.PlanetId){\n  const shared=network.role&&world.planet===planet, enemies=shared?world.enemySnapshots():null,environment=shared?world.environmentSnapshot():null;\n  world.build(planet);if(enemies)world.applyEnemySnapshots(enemies);if(environment)world.applyEnvironmentSnapshot(environment);\n}\n/** Nhe nhu ban goc (farm.showRemote/decor.showRemote): vao/ra nha dang tham chi\n *  dong bo luong + decor (thu farm tu dong theo world.state moi frame), KHONG\n *  rebuild scene, KHONG respawn quai, KHONG cham camera → qua cong lien mach nhu\n *  di tu nha minh ra khu chung. */\nfunction syncVisitPresentation(){\n  if(world.planet!=='home')return;\n  const n=world.state.plots.length;\n  if(world.plotMeshes.length>n)world.dropPlotsFrom(n); // dropPlotsFrom tu goi syncCrops+syncBeds\n  else world.syncCrops();\n  world.syncDecorations();\n}"], [";world.state=visitHome;rebuildHomePresentation('home');}\n    else{visitHome=null;world.state=state;rebuildHomePresentation(state.planet);}", ";world.state=visitHome;syncVisitPresentation();}\n    else{visitHome=null;world.state=state;syncVisitPresentation();}"], ["if(expanded){const position=world.position.clone();rebuildHomePresentation('home');world.position.copy(position);world.refreshPlayer();}", "if(expanded){syncVisitPresentation();world.refreshPlayer();}"]];

export async function apply(root) {
  const p = join(root, 'src/main.ts');
  let s = await readFile(p, 'utf8');
  let i = 0;
  for (const [oldStr, newStr] of EDITS) {
    i++;
    const n = s.split(oldStr).length - 1;
    if (n !== 1) throw new Error(`[patch v5.2] diem sua ${i}: tim thay ${n} vi tri, can dung 1 — DUNG LAI de Khương kiem tra`);
    s = s.replace(oldStr, newStr);
  }
  await writeFile(p, s);
  console.log('[patch] v5.2 seamless visit: 3 diem sua tren src/main.ts OK');
}
