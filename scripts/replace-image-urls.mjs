import { readFileSync, writeFileSync, existsSync } from 'fs';

const TRANSFORMS = {
  hero:       'f_auto,q_auto:good,w_1920',
  content:    'f_auto,q_auto,w_800',
  thumbnail:  'f_auto,q_auto,w_400,h_400,c_fill,g_face',
  logo:       'f_auto,q_auto,w_300',
  background: 'f_auto,q_auto,w_1600',
};

function cldUrl(rawUrl, category) {
  const transform = TRANSFORMS[category] ?? TRANSFORMS.content;
  return rawUrl.replace('/upload/', `/upload/${transform}/`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (!existsSync('./image-mapping.json')) {
  console.error("image-mapping.json introuvable.");
  process.exit(1);
}

const mapping = JSON.parse(readFileSync('./image-mapping.json', 'utf-8'));
const uploaded = mapping.filter(item => item.uploaded && item.cloudinaryUrl);

if (uploaded.length === 0) {
  console.error('Aucune image uploadee dans image-mapping.json');
  process.exit(1);
}

console.log(`Recherche: ${uploaded.length} images uploadees...`);

const filesToProcess = new Set();
for (const item of uploaded) {
  for (const file of item.usedIn) {
    filesToProcess.add(file);
  }
}

let totalFiles = 0;
let totalReplacements = 0;
let totalErrors = 0;

for (const relPath of filesToProcess) {
  if (!existsSync(relPath)) {
    console.warn(`MANQUANT: ${relPath}`);
    totalErrors++;
    continue;
  }

  let content = readFileSync(relPath, 'utf-8');
  const originalContent = content;
  let fileReplacements = 0;

  for (const item of uploaded) {
    if (!item.usedIn.includes(relPath)) continue;

    const localPath = item.localPath;
    const transform = cldUrl(item.cloudinaryUrl, item.category);

    const countBefore = (content.match(new RegExp(escapeRegex(localPath), 'g')) || []).length;
    if (countBefore === 0) continue;

    content = content.replaceAll(localPath, transform);
    fileReplacements += countBefore;
    totalReplacements += countBefore;

    console.log(`  REMPLACE ${localPath} (${countBefore}x)`);
  }

  if (content !== originalContent) {
    writeFileSync(relPath, content, 'utf-8');
    console.log(`SAUVEGARDE: ${relPath} — ${fileReplacements} remplacement(s)`);
    totalFiles++;
  }
}

console.log('');
console.log(`Fichiers modifies : ${totalFiles}`);
console.log(`Remplacements     : ${totalReplacements}`);
console.log(`Erreurs           : ${totalErrors}`);
