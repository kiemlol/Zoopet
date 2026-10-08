// v5.7e — pet scale x1.4 (dung format chuan: export async function apply)
// Thay the v5.7b/c/d bi loi (thieu export apply).
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export async function apply(root) {
  const p = join(root, 'src/world.ts');
  let text = await readFile(p, 'utf8');

  if (text.includes('multiplyScalar(1.4)')) {
    console.log('[v5.7e] already patched, skipping');
    return;
  }

  // Tim ham petFor va them dong scale sau dong userData.wings=
  const lines = text.split('\n');
  let inPetFor = false;
  let patched = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('petFor(id:string)')) inPetFor = true;
    if (inPetFor && lines[i].includes('userData.wings=')) {
      lines.splice(i + 1, 0, '    model.scale.multiplyScalar(1.4);');
      patched = true;
      break;
    }
    if (inPetFor && i > 0 && lines[i].trim() === '}' && lines[i+1]?.trim().startsWith('/**')) break;
  }
  if (!patched) throw new Error('[v5.7e] could not find petFor wings line');
  await writeFile(p, lines.join('\n'));
  console.log('[v5.7e] patched src/world.ts: pet scale x1.4');
}
