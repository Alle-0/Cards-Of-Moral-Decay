const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_URL = "https://carte-vs-umani-default-rtdb.firebaseio.com";
const PACKS_PATH_IT = "game_data/packs/it";
const PACKS_PATH_EN = "game_data/packs/en";

// Path to Service Account Key
const serviceAccountPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
    console.error("Error: Service Account Key path not provided.");
    console.error("Usage: node scripts/upload_packs.js <path-to-service-account.json>");
    process.exit(1);
}

// Load Service Account
let serviceAccount;
try {
    serviceAccount = require(path.resolve(serviceAccountPath));
} catch (error) {
    console.error("Error loading service account:", error.message);
    process.exit(1);
}

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DB_URL
    });
}

const db = admin.database();

async function uploadPack(packName, fileName, lang) {
    const targetPath = path.resolve(process.cwd(), fileName);
    const basePath = lang === 'it' ? PACKS_PATH_IT : PACKS_PATH_EN;

    if (!fs.existsSync(targetPath)) {
        console.error(`File not found: ${targetPath}`);
        return;
    }

    console.log(`Reading ${fileName}...`);
    const content = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

    console.log(`Uploading ${packName} (${lang}) to ${basePath}/${packName}...`);
    try {
        await db.ref(`${basePath}/${packName}`).set(content);
        console.log(`✅ ${packName} (${lang}) uploaded successfully!`);
    } catch (error) {
        console.error(`❌ Failed to upload ${packName} (${lang}):`, error.message);
    }
}

async function main() {
    console.log("Starting upload...");

    // IT Packs
    await uploadPack('chill', 'data/packs/chill_pack_it.json', 'it');
    await uploadPack('spicy', 'data/packs/spicy_pack_it.json', 'it');

    // EN Packs
    await uploadPack('chill', 'data/packs/chill_pack_en.json', 'en');
    await uploadPack('spicy', 'data/packs/spicy_pack_en.json', 'en');

    console.log("Done.");
    process.exit(0);
}

main();
