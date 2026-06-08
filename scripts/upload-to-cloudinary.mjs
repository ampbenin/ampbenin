import { v2 as cloudinary } from 'cloudinary';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// CLOUDINARY_URL est lu automatiquement depuis process.env (défini dans .env)
// Format : cloudinary://API_KEY:API_SECRET@CLOUD_NAME
if (!process.env.CLOUDINARY_URL) {
  console.error('❌ CLOUDINARY_URL manquante. Ajoutez-la dans .env');
  process.exit(1);
}

const inventory = JSON.parse(readFileSync('./image-inventory.json', 'utf-8'));
const results = [];
let uploaded = 0;
let skipped = 0;
let errors = 0;

for (const item of inventory) {
  // Ignorer les images manquantes ou déjà sur Cloudinary
  if (item.type !== 'local') {
    console.log(`⏭  Ignoré (${item.type}) : ${item.localPath}`);
    results.push(item);
    skipped++;
    continue;
  }

  // Résoudre le chemin local
  const localFile = item.localPath.startsWith('/public')
    ? `.${item.localPath}`
    : `./public${item.localPath}`;

  if (!existsSync(localFile)) {
    console.warn(`⚠  Fichier introuvable : ${localFile}`);
    results.push({ ...item, cloudinaryUrl: null, uploaded: false, error: 'Fichier introuvable' });
    errors++;
    continue;
  }

  try {
    // Déduire un public_id propre depuis le chemin
    const publicId = item.localPath
      .replace(/^\//, '')          // retirer le / initial
      .replace(/\.[^/.]+$/, '');  // retirer l'extension

    const result = await cloudinary.uploader.upload(localFile, {
      folder: 'ong-site',
      public_id: publicId,
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    });

    results.push({ ...item, cloudinaryUrl: result.secure_url, uploaded: true });
    console.log(`✅ ${item.localPath}\n   → ${result.secure_url}`);
    uploaded++;
  } catch (err) {
    results.push({ ...item, cloudinaryUrl: null, uploaded: false, error: err.message });
    console.error(`❌ ${item.localPath} : ${err.message}`);
    errors++;
  }
}

writeFileSync('./image-mapping.json', JSON.stringify(results, null, 2));

console.log('\n────────────────────────────────────────');
console.log(`📊 Résumé :`);
console.log(`   ✅ Uploadées   : ${uploaded}`);
console.log(`   ⏭  Ignorées   : ${skipped}`);
console.log(`   ❌ Erreurs     : ${errors}`);
console.log('📄 Mapping sauvegardé dans image-mapping.json');
