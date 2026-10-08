// Patch v5.11: fix quai giat khi choi online.
// applyEnemySnapshots() dung set truc tiep e.mesh.position, xung dot voi code lam muot
// (e.smooth/view2) o draw -> mesh nhay qua lai giua vi tri snapshot va vi tri muot.
// Fix: chi cap nhat e.x/e.z (logic), de draw tu lam muot visual.
export async function apply(root) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const file = path.join(root, 'src', 'world.ts');
  let code = await fs.readFile(file, 'utf8');

  if (code.includes('v5.11: khong set mesh.position truc tiep')) {
    console.log('[v5.11] da patch roi, bo qua.');
    return;
  }

  // Tim dong set mesh.position trong applyEnemySnapshots va xoa no
  // (giu lai rotation va visible).
  const oldSnippet = "e.scaled=true;e.mesh.position.set(e.x,terrainHeight(this.environment.layout,e)+(e.lift??0),e.z);e.mesh.rotation.y=snapshot.facing??0;";
  const newSnippet = "e.scaled=true;/* v5.11: khong set mesh.position truc tiep o day, de draw lam muot qua e.smooth */e.mesh.rotation.y=snapshot.facing??0;";

  if (!code.includes(oldSnippet)) {
    console.log('[v5.11] khong thay mau, bo qua.');
    return;
  }

  code = code.replace(oldSnippet, newSnippet);
  await fs.writeFile(file, code);
  console.log('[v5.11] patched src/world.ts: bo set mesh.position truc tiep trong applyEnemySnapshots.');
}
