// AsyncStorage removed to prevent local caching
import { ref, get } from 'firebase/database';
import { db } from './firebase'; // Import initialized DB
import { carteNere as baseNereIT, carteBianche as baseBiancheIT } from '../utils/pacchetto_base';
import { carteNere as baseNereEN, carteBianche as baseBiancheEN } from '../data/en/base';

const CACHE_KEY = 'cah_game_data_v3'; // Bumped version
const DARK_CACHE_KEY = 'cah_dark_data_v1';
const DB_PATH = 'game_data';

class GameDataService {
    constructor() {
        this.language = 'it'; // Default

        // IT Defaults
        this.basePackIT = { nere: baseNereIT, bianche: baseBiancheIT };
        // EN Defaults
        this.basePackEN = { nere: baseNereEN, bianche: baseBiancheEN };

        // Current Base (Starts as IT)
        this.basePack = this.basePackIT;

        this.darkPack = { nere: [], bianche: [] };

        this.isLoaded = false;
        this.minVersion = "3.8.1";
        this.downloadUrl = null;
    }

    // Initialize data: Fetch from Firebase (Memory Only)
    async initialize() {
        // Fetch fresh data in background
        this.fetchAndCache();
    }

    async fetchAndCache() {
        try {
            // [OPTIMIZATION] 1. First, only fetch small control fields
            const versionRef = ref(db, 'game_data/version'); // Legacy version check, kept for compatibility
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

            // 2. Fetch Packs based on Language
            const currentLang = this.language; // 'it' or 'en'
            const basePackRef = ref(db, `game_data/packs/${currentLang}/base`);
            const darkPackRef = ref(db, `game_data/packs/${currentLang}/dark`);

            // Also keep a listener or fetch for the other language if we want instant switch?
            // For now, let's just fetch the CURRENT language pack.
            // If user switches language, we might need to fetch again or pre-fetch both.
            // Let's pre-fetch BOTH IT and EN to allow instant switching.

            const packsRef = ref(db, 'game_data/packs');
            const [packsSnap] = await Promise.all([get(packsRef)]);

            if (packsSnap.exists()) {
                const packs = packsSnap.val();

                // IT Packs
                if (packs.it && packs.it.base) {
                    this.basePackIT = {
                        nere: packs.it.base.carteNere || [],
                        bianche: packs.it.base.carteBianche || []
                    };
                }
                // Also support legacy root 'base' if 'it' is missing, but we are moving to 'it'.
                if (packs.base && !packs.it) {
                    this.basePackIT = {
                        nere: packs.base.carteNere || [],
                        bianche: packs.base.carteBianche || []
                    };
                }

                // IT Dark
                if (packs.it && packs.it.dark) {
                    this.darkPackIT = { // We need to store IT dark separate from EN dark
                        nere: packs.it.dark.carteNere || [],
                        bianche: packs.it.dark.carteBianche || []
                    };
                } else if (packs.dark && !packs.it) { // Legacy
                    this.darkPackIT = {
                        nere: packs.dark.carteNere || [],
                        bianche: packs.dark.carteBianche || []
                    };
                } else {
                    this.darkPackIT = { nere: [], bianche: [] };
                }


                // EN Packs
                if (packs.en && packs.en.base) {
                    this.basePackEN = {
                        nere: packs.en.base.carteNere || [],
                        bianche: packs.en.base.carteBianche || []
                    };
                }
                if (packs.en && packs.en.dark) {
                    this.darkPackEN = {
                        nere: packs.en.dark.carteNere || [],
                        bianche: packs.en.dark.carteBianche || []
                    };
                } else {
                    this.darkPackEN = { nere: [], bianche: [] };
                }

                // console.log('Packs (IT/EN) synced from Firebase.');

                // Update active packs based on current language
                this.updateActivePacks();
            }

        } catch (e) {
            console.warn('Failed to fetch remote game data from Firebase', e);
        }
    }

    updateActivePacks() {
        if (this.language === 'en') {
            this.basePack = this.basePackEN;
            this.darkPack = this.darkPackEN || { nere: [], bianche: [] };
        } else {
            this.basePack = this.basePackIT;
            this.darkPack = this.darkPackIT || { nere: [], bianche: [] };
        }
    }

    getMinVersion() {
        return this.minVersion;
    }

    getDownloadUrl() {
        return this.downloadUrl;
    }

    getPackages(activePacks = { base: true, dark: true }) {
        let nere = [];
        let bianche = [];

        if (activePacks.base) {
            nere = [...nere, ...this.basePack.nere];
            bianche = [...bianche, ...this.basePack.bianche];
        }

        if (activePacks.dark) {
            nere = [...nere, ...this.darkPack.nere];
            bianche = [...bianche, ...this.darkPack.bianche];
        }

        return { carteNere: nere, carteBianche: bianche };
    }

    setLanguage(lang) {
        this.language = lang;
        this.updateActivePacks();
        // console.log(`[GameDataService] Language set to ${lang}`);
    }

    // --- NANO DATA UTILITIES (Operates on Base + Loaded Dark) ---
    // Helper to get ALL currently loaded cards available in memory
    getAllCards(forcedLang = null) {
        let base = this.basePack;
        let dark = this.darkPack;

        if (forcedLang === 'en') {
            base = this.basePackEN;
            dark = this.darkPackEN;
        } else if (forcedLang === 'it') {
            base = this.basePackIT;
            dark = this.darkPackIT;
        }

        return {
            nere: [...(base?.nere || []), ...(dark?.nere || [])],
            bianche: [...(base?.bianche || []), ...(dark?.bianche || [])]
        };
    }

    getWhiteCardIndex(text, forcedLang = null) {
        if (!text) return -1;
        const normalized = text.trim();
        const all = this.getAllCards(forcedLang).bianche;
        return all.findIndex(c => c.trim() === normalized);
    }

    getWhiteCardByIndex(index, forcedLang = null) {
        if (index === undefined || index === null || index < 0) return null;
        const all = this.getAllCards(forcedLang).bianche;
        return all[index] || null;
    }

    getBlackCardIndex(card, forcedLang = null) {
        if (!card || !card.testo) return -1;
        const normalized = card.testo.trim();
        const all = this.getAllCards(forcedLang).nere;
        return all.findIndex(c => c.testo.trim() === normalized);
    }

    getBlackCardByIndex(index, forcedLang = null) {
        if (index === undefined || index === null || index < 0) return null;
        const all = this.getAllCards(forcedLang).nere;
        return all[index] || null;
    }
}

export default new GameDataService();
