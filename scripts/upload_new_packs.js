const admin = require('firebase-admin');
const serviceAccount = require('../carte-vs-umani-firebase-adminsdk-fbsvc-7669b709d5.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://carte-vs-umani-default-rtdb.firebaseio.com"
});

const db = admin.database();

const packs = {
    'it/chill': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/it/chill.json'),
    'en/chill': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/en/chill.json'),
    'it/spicy': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/it/spicy.json'),
    'en/spicy': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/en/spicy.json'),
    'it/dark': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/it/dark.json'),
    'en/dark': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/en/dark.json'),
    'it/base': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/it/base.json'),
    'en/base': require('c:/Users/39338/Desktop/cards-against-humanity/extracted_packs/en/base.json')
};

async function upload() {
    console.log("Starting upload...");
    try {
        for (const [path, data] of Object.entries(packs)) {
            const targetPath = `game_data/packs/${path}`;
            console.log(`Uploading to ${targetPath}...`);
            await db.ref(targetPath).set(data);
            console.log(`✅ Uploaded ${path}`);
        }
        console.log('🎉 All packs uploaded successfully!');
    } catch (error) {
        console.error("❌ Upload failed:", error);
    } finally {
        process.exit(0);
    }
}

upload();
