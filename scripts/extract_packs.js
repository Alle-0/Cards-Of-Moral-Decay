const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_URL = "https://carte-vs-umani-default-rtdb.firebaseio.com";
const PACKS_ROOT = "game_data/packs";
const OUTPUT_DIR = "extracted_packs";

// Service Account
const serviceAccountPath = path.resolve(__dirname, '../carte-vs-umani-firebase-adminsdk-fbsvc-7669b709d5.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error("Error: Service Account Key not found at " + serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DB_URL
    });
}

const db = admin.database();

async function extractPacks() {
    console.log("Fetching all packs from " + PACKS_ROOT + "...");

    try {
        const snapshot = await db.ref(PACKS_ROOT).once('value');
        const data = snapshot.val();

        if (!data) {
            console.log("No packs found in database.");
            return;
        }

        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR);
        }

        // The structure is game_data/packs/{lang}/{packName}
        for (const lang in data) {
            console.log(`Processing language: ${lang}`);
            const langDir = path.join(OUTPUT_DIR, lang);
            if (!fs.existsSync(langDir)) {
                fs.mkdirSync(langDir);
            }

            for (const packName in data[lang]) {
                const packData = data[lang][packName];
                const outputPath = path.join(langDir, `${packName}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(packData, null, 2));
                console.log(`✅ Extracted ${packName} (${lang}) -> ${outputPath}`);
            }
        }

        console.log("\nFinished extraction.");
    } catch (error) {
        console.error("❌ Extraction failed:", error.message);
    } finally {
        process.exit(0);
    }
}

extractPacks();
