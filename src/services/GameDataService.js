// AsyncStorage removed to prevent local caching
import { ref, get } from 'firebase/database';
import { db } from './firebase'; // Import initialized DB
import { carteNere as baseNereIT, carteBianche as baseBiancheIT } from '../utils/pacchetto_base';
import { carteNere as baseNereEN, carteBianche as baseBiancheEN } from '../data/en/base';

const CACHE_KEY = 'cah_game_data_v4'; // Bumped version
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
        this.chillPack = { nere: [], bianche: [] }; // [NEW] Chill (SFW Extreme)
        this.spicyPack = { nere: [], bianche: [] }; // [NEW] Spicy (NSFW Legal)

        this.isLoaded = false;
        this.minVersion = "4.0.1";
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
            // We fetch the 'packs' root to get everything needed (Base/Dark/Chill/Spicy) efficiently
            // or we could fetch individually if structure is strictly separated.
            // Current structure seems to be game_data/packs/{lang}/{packType}

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
                    this.darkPackIT = {
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

                // IT Chill & Spicy
                if (packs.it && packs.it.chill) {
                    this.chillPackIT = { nere: packs.it.chill.carteNere || [], bianche: packs.it.chill.carteBianche || [] };
                } else { this.chillPackIT = { nere: [], bianche: [] }; }

                if (packs.it && packs.it.spicy) {
                    this.spicyPackIT = { nere: packs.it.spicy.carteNere || [], bianche: packs.it.spicy.carteBianche || [] };
                } else { this.spicyPackIT = { nere: [], bianche: [] }; }


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

                // EN Chill & Spicy
                if (packs.en && packs.en.chill) {
                    this.chillPackEN = { nere: packs.en.chill.carteNere || [], bianche: packs.en.chill.carteBianche || [] };
                } else { this.chillPackEN = { nere: [], bianche: [] }; }

                if (packs.en && packs.en.spicy) {
                    this.spicyPackEN = { nere: packs.en.spicy.carteNere || [], bianche: packs.en.spicy.carteBianche || [] };
                } else { this.spicyPackEN = { nere: [], bianche: [] }; }

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
            this.chillPack = this.chillPackEN || { nere: [], bianche: [] };
            this.spicyPack = this.spicyPackEN || { nere: [], bianche: [] };
        } else {
            this.basePack = this.basePackIT;
            this.darkPack = this.darkPackIT || { nere: [], bianche: [] };
            this.chillPack = this.chillPackIT || { nere: [], bianche: [] };
            this.spicyPack = this.spicyPackIT || { nere: [], bianche: [] };
        }
    }

    getMinVersion() {
        return this.minVersion;
    }

    getDownloadUrl() {
        return this.downloadUrl;
    }

    getPackages(activePacks = { base: true, dark: true, chill: false, spicy: false }) {
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

        if (activePacks.chill) {
            nere = [...nere, ...this.chillPack.nere];
            bianche = [...bianche, ...this.chillPack.bianche];
        }

        if (activePacks.spicy) {
            nere = [...nere, ...this.spicyPack.nere];
            bianche = [...bianche, ...this.spicyPack.bianche];
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
        let chill = this.chillPack;
        let spicy = this.spicyPack;

        if (forcedLang === 'en') {
            base = this.basePackEN;
            dark = this.darkPackEN;
            chill = this.chillPackEN;
            spicy = this.spicyPackEN;
        } else if (forcedLang === 'it') {
            base = this.basePackIT;
            dark = this.darkPackIT;
            chill = this.chillPackIT;
            spicy = this.spicyPackIT;
        }

        return {
            nere: [...(base?.nere || []), ...(dark?.nere || []), ...(chill?.nere || []), ...(spicy?.nere || [])],
            bianche: [...(base?.bianche || []), ...(dark?.bianche || []), ...(chill?.bianche || []), ...(spicy?.bianche || [])]
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
