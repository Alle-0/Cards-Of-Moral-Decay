import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, get } from 'firebase/database';
import { db } from './firebase'; // Import initialized DB
import { carteNere as defaultCarteNere, carteBianche as defaultCarteBianche } from '../utils/data';

const CACHE_KEY = 'cah_game_data_v1';
const DB_PATH = 'game_data';

class GameDataService {
    constructor() {
        this.carteNere = defaultCarteNere;
        this.carteBianche = defaultCarteBianche;
        this.isLoaded = false;
        this.minVersion = "2.0.1";
        this.downloadUrl = null;
    }

    // Initialize data: Load from Cache -> Then Fetch from Firebase
    async initialize() {
        try {
            // 1. Try to load from cache first for speed
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                this.carteNere = parsed.carteNere || defaultCarteNere;
                this.carteBianche = parsed.carteBianche || defaultCarteBianche;
                console.log('GameData loaded from cache');
            }
        } catch (e) {
            console.error('Failed to load cache', e);
        }

        // 2. Fetch fresh data in background
        this.fetchAndCache();
    }

    async fetchAndCache() {
        try {
            // [OPTIMIZATION] 1. First, only fetch small control fields (bandwidth saver!)
            const versionRef = ref(db, 'game_data/version');
            const minVerRef = ref(db, 'game_data/min_version');
            const durlRef = ref(db, 'game_data/url');

            const [vSnap, mvSnap, duSnap] = await Promise.all([
                get(versionRef),
                get(minVerRef),
                get(durlRef)
            ]);

            const remoteVersion = vSnap.val();
            this.minVersion = mvSnap.val() || "2.0.1";
            this.downloadUrl = duSnap.val() || null;

            // 2. Check if we actually need to download the heavy card data
            // We compare the remote 'version' (timestamp) with what we have in cache
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            const parsedCache = cachedData ? JSON.parse(cachedData) : null;
            const localVersion = parsedCache?.version;

            if (localVersion === remoteVersion && parsedCache?.carteBianche) {
                console.log('GameData is up to date (Version: ' + localVersion + '). Skipping heavy download.');
                return;
            }

            // 3. ONLY if version is different, download the whole node
            console.log('GameData update detected (Local: ' + localVersion + ' -> Remote: ' + remoteVersion + '). Downloading...');
            const snapshot = await get(ref(db, DB_PATH));
            if (snapshot.exists()) {
                const json = snapshot.val();
                if (json.carteNere && json.carteBianche) {
                    this.carteNere = json.carteNere;
                    this.carteBianche = json.carteBianche;

                    // Save everything to cache
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
                    console.log('GameData heavy sync complete.');
                }
            }
        } catch (e) {
            console.warn('Failed to fetch remote game data from Firebase', e);
        }
    }

    getCarteNere() {
        return this.carteNere;
    }

    getCarteBianche() {
        return this.carteBianche;
    }

    getMinVersion() {
        return this.minVersion;
    }

    getDownloadUrl() {
        return this.downloadUrl;
    }

    // --- NANO DATA UTILITIES ---

    getWhiteCardIndex(text) {
        if (!text) return -1;
        const normalized = text.trim();
        return this.carteBianche.findIndex(c => c.trim() === normalized);
    }

    getWhiteCardByIndex(index) {
        if (index === undefined || index === null || index < 0) return null;
        return this.carteBianche[index] || null;
    }

    getBlackCardIndex(card) {
        if (!card || !card.testo) return -1;
        const normalized = card.testo.trim();
        return this.carteNere.findIndex(c => c.testo.trim() === normalized);
    }

    getBlackCardByIndex(index) {
        if (index === undefined || index === null || index < 0) return null;
        return this.carteNere[index] || null;
    }
}

export default new GameDataService();
