const admin = require('firebase-admin');
const path = require('path');

// Configuration
const DB_URL = "https://carte-vs-umani-default-rtdb.firebaseio.com";

// Path to Service Account Key
const serviceAccountPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
    console.error("Error: Service Account Key path not provided.");
    console.error("Usage: node scripts/count_db_packs.js <path-to-service-account.json>");
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

async function countPacks() {
    console.log("Fetching pack data...");
    try {
        const snapshot = await db.ref('game_data/packs').once('value');
        const data = snapshot.val();

        if (!data) {
            console.log("No pack data found.");
            return;
        }

        const count = (pack) => {
            const black = (pack?.carteNere || []).length;
            const white = (pack?.carteBianche || []).length;
            return { black, white, total: black + white };
        };

        console.log("--- PACK COUNTS ---");

        // IT
        console.log("IT Base:", count(data.base || data.it?.base)); // Legacy or new structure
        console.log("IT Dark:", count(data.dark || data.it?.dark));
        console.log("IT Chill:", count(data.it?.chill));
        console.log("IT Spicy:", count(data.it?.spicy));

        // EN
        console.log("EN Base:", count(data.en?.base));
        console.log("EN Dark:", count(data.en?.dark));
        console.log("EN Chill:", count(data.en?.chill));
        console.log("EN Spicy:", count(data.en?.spicy));

    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        process.exit(0);
    }
}

countPacks();
