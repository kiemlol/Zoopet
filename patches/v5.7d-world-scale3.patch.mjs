// v5.7d — pet scale x1.4 (simple robust version)
// Thay the v5.7b va v5.7c bi loi.
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/world.ts');
let text = await readFile(path, 'utf8');

if (text.includes('multiplyScalar(1.4)')) {
  console.log('[v5.7d] already patched, skipping');
} else {
  // Tim ham petFor va them dong scale truoc 'return model;'
  // Dung cach don gian: split theo dong, tim dong chua 'userData.wings=' trong petFor
  const lines = text.split('\n');
  let inPetFor = false;
  let patched = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('petFor(id:string)')) inPetFor = true;
    if (inPetFor && lines[i].includes('userData.wings=')) {
      // Them dong scale sau dong nay
      lines.splice(i + 1, 0, '    model.scale.multiplyScalar(1.4);');
      patched = true;
      break;
    }
    // Thoat khoi petFor khi gap ham tiep theo (2 dong trong lien tiep hoac '  }' + comment)
    if (inPetFor && i > 0 && lines[i].trim() === '}' && lines[i+1]?.trim().startsWith('/**')) break;
  }
  if (!patched) throw new Error('v5.7d: could not find petFor wings line');
  await writeFile(path, lines.join('\n'));
  console.log('[v5.7d] patched src/world.ts: pet scale x1.4');
}
