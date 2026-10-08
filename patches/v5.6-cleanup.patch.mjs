// Patch v5.6 — xoa cong + bien thua o khu chung; an bien kham pha khi ra khoi vuon.
// 1) world.ts: xoa khoi "cong ve nha rieng" + bien "Dong Co Ho Xanh" o (0,28)/(4,30) —
//    do sot lai tu ban nhap v5 dau (tham chieu COMMON_HOME_GATE da khong con ton tai).
//    Co che hien tai la di bo lien mach qua ranh gioi r=18, khong can cong co dinh.
// 2) main.ts: bien "kham pha hanh tinh" (#discovery-progress) neo vao diem (2.6,14.5)
//    trong vuon, chi an khi cach xa 16m — ra khu chung (0,28) chi cach ~13.7m nen van
//    hien, nhin nhu "di theo" nhan vat. Them dieu kien: ra khoi vuon (r>18) thi an.
// KHI archive/ duoc tai tao DA GOM FIX: xoa file nay.
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EDITS = [["src/world.ts", "      // === Khu chung (Đồng Cỏ Hồ Xanh): cổng về nhà + biển hiệu + trang trí ===\n      // Cổng \"về nhà riêng\" ở khu chung (khớp với common-gates.ts COMMON_HOME_GATE)\n      {\n        const hg=this.kit('gate')??group(cyl('#b18c59',.14,.14,3.1,-1.7,1.55),cyl('#b18c59',.14,.14,3.1,1.7,1.55),box('#7fd4a8',3.75,.25,.25,0,3));\n        hg.position.set(0,0,28);this.root.add(hg);\n        // Biển \"Đồng Cỏ Hồ Xanh\"\n        const signPost=group(box('#8a6a4a',.25,2.2,.25,0,1.1),box('#f5e6c8',3.2,1.1,.15,0,2.4));\n        signPost.position.set(4,0,30);signPost.rotation.y=-.4;this.root.add(signPost);this.obstacle(4,30,.6);\n      }\n      for(const [x,z] of [[-13,-8],[-14,7],[3,-13],[10,-11],[14,5],[-2,15]])this.tree(x,z,.75,true,rng);", "      for(const [x,z] of [[-13,-8],[-14,7],[3,-13],[10,-11],[14,5],[-2,15]])this.tree(x,z,.75,true,rng);"], ["src/main.ts", "const hide=!started||world.planet!=='home'||Math.hypot(world.position.x-2.6,world.position.z-14.5)>16||!point.front||!!modal||!!world.interior; // indoors the well is out of sight", "const hide=!started||world.planet!=='home'||Math.hypot(world.position.x-2.6,world.position.z-14.5)>16||Math.hypot(world.position.x,world.position.z)>18||!point.front||!!modal||!!world.interior; // ra khoi vuon (khu chung) thi an: bien nay chi danh cho khu vuon nha"]];

export async function apply(root) {
  let i = 0;
  for (const [file, oldStr, newStr] of EDITS) {
    i++;
    const p = join(root, file);
    const s = await readFile(p, 'utf8');
    const n = s.split(oldStr).length - 1;
    if (n !== 1) throw new Error(`[patch v5.6] diem sua ${i} (${file}): tim thay ${n} vi tri, can dung 1 — DUNG LAI de Khương kiem tra`);
    await writeFile(p, s.replace(oldStr, newStr));
  }
  console.log('[patch] v5.6: xoa cong/bien thua khu chung + an bien kham pha ngoai vuon OK');
}
