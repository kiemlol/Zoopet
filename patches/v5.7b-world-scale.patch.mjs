// v5.7b — tang kich co thu cung 40% trong petFor()
// Surgical patch: tim dung 1 vi tri, thay the, throw neu khong khop.
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/world.ts');
let text = await readFile(path, 'utf8');

const OLD = `    model.userData.wings=model.children.filter(c=>/_wing_[lr]/.test(c.name)).map(c=>({node:c,base:c.rotation.z,side:/_wing_l/.test(c.name)?-1:1}));
    return model;`;
const NEW = `    model.userData.wings=model.children.filter(c=>/_wing_[lr]/.test(c.name)).map(c=>({node:c,base:c.rotation.z,side:/_wing_l/.test(c.name)?-1:1}));
    // Tăng kích cỡ thú cưng 40% (theo yêu cầu: pet hiện tại bé quá)
    model.scale.multiplyScalar(1.4);
    return model;`;

const count = text.split(OLD).length - 1;
if (count !== 1) throw new Error(`v5.7b: expected 1 match, found ${count}`);
text = text.replace(OLD, NEW);
await writeFile(path, text);
console.log('[v5.7b] patched src/world.ts: pet scale x1.4');
