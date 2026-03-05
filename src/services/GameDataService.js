// AsyncStorage removed to prevent local caching
import { ref, get } from 'firebase/database';
import { db } from './firebase'; // Import initialized DB

const CACHE_KEY = 'cah_game_data_v5'; // Bumped version
const DARK_CACHE_KEY = 'cah_dark_data_v1';
const DB_PATH = 'game_data';

class GameDataService {
    constructor() {
        this.language = 'it'; // Default

        // IT Defaults
        this.basePackIT = { nere: [], bianche: [] };
        // EN Defaults
        this.basePackEN = { nere: [], bianche: [] };

        // Current Base (Starts as IT)
        this.basePack = this.basePackIT;

        this.darkPack = { nere: [], bianche: [] };
        this.chillPack = { nere: [], bianche: [] }; // [NEW] Chill (SFW Extreme)
        this.spicyPack = { nere: [], bianche: [] }; // [NEW] Spicy (NSFW Legal)

        this.isLoaded = false;
        this.minVersion = "4.11.2";
        this.downloadUrl = null;
        this.cachedAllCards = { it: null, en: null }; // [NEW] Cache
        this.lookupMaps = { it: { nere: new Map(), bianche: new Map() }, en: { nere: new Map(), bianche: new Map() } }; // [NEW] Reverse lookups
    }

    // Initialize data: Fetch from Firebase (Memory Only)
    async initialize() {
        return this.fetchAndCache();
    }

    async fetchAndCache() {
        try {
            this.isLoaded = false; // Reset if re-fetching
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

                // Reset Cache & Maps
                this.cachedAllCards = { it: null, en: null };
                this.lookupMaps = { it: { nere: new Map(), bianche: new Map() }, en: { nere: new Map(), bianche: new Map() } };

                // Update active packs based on current language
                this.updateActivePacks();
                this.isLoaded = true;
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

    getPackages(activePacks = { base: true, dark: true, chill: false, spicy: false }, forcedLang = null) {
        let nere = [];
        let bianche = [];

        const lang = forcedLang || this.language;
        let base, dark, chill, spicy;

        if (lang === 'en') {
            base = this.basePackEN;
            dark = this.darkPackEN;
            chill = this.chillPackEN;
            spicy = this.spicyPackEN;
        } else {
            base = this.basePackIT;
            dark = this.darkPackIT;
            chill = this.chillPackIT;
            spicy = this.spicyPackIT;
        }

        if (activePacks.base) {
            nere = [...nere, ...(base?.nere || [])];
            bianche = [...bianche, ...(base?.bianche || [])];
        }

        if (activePacks.dark) {
            nere = [...nere, ...(dark?.nere || [])];
            bianche = [...bianche, ...(dark?.bianche || [])];
        }

        if (activePacks.chill) {
            nere = [...nere, ...(chill?.nere || [])];
            bianche = [...bianche, ...(chill?.bianche || [])];
        }

        if (activePacks.spicy) {
            nere = [...nere, ...(spicy?.nere || [])];
            bianche = [...bianche, ...(spicy?.bianche || [])];
        }

        return { carteNere: nere, carteBianche: bianche };
    }

    setLanguage(lang) {
        if (this.language !== lang) {
            this.language = lang;
            this.updateActivePacks();
        }
    }

    // --- NANO DATA UTILITIES (Operates on Base + Loaded Dark) ---
    // Helper to get ALL currently loaded cards available in memory
    getAllCards(forcedLang = null) {
        const langTarget = forcedLang || this.language;

        // [OPTIMIZATION] Return cached if available
        if (this.cachedAllCards[langTarget]) {
            return this.cachedAllCards[langTarget];
        }

        let base, dark, chill, spicy;

        if (langTarget === 'en') {
            base = this.basePackEN;
            dark = this.darkPackEN;
            chill = this.chillPackEN;
            spicy = this.spicyPackEN;
        } else {
            base = this.basePackIT;
            dark = this.darkPackIT;
            chill = this.chillPackIT;
            spicy = this.spicyPackIT;
        }

        const result = {
            nere: [...(base?.nere || []), ...(dark?.nere || []), ...(chill?.nere || []), ...(spicy?.nere || [])],
            bianche: [...(base?.bianche || []), ...(dark?.bianche || []), ...(chill?.bianche || []), ...(spicy?.bianche || [])]
        };

        // Populate Maps
        this.lookupMaps[langTarget].nere.clear();
        result.nere.forEach((c, idx) => { if (c && c.testo) this.lookupMaps[langTarget].nere.set(c.testo.trim(), idx); });
        this.lookupMaps[langTarget].bianche.clear();
        result.bianche.forEach((c, idx) => { if (c) this.lookupMaps[langTarget].bianche.set(c.trim(), idx); });

        // Cache the result
        this.cachedAllCards[langTarget] = result;
        return result;
    }

    getWhiteCardIndex(text, forcedLang = null) {
        if (!text) return -1;
        const lang = forcedLang || this.language;
        if (!this.cachedAllCards[lang]) this.getAllCards(lang); // Ensure maps populated

        const normalized = text.trim();
        const idx = this.lookupMaps[lang].bianche.get(normalized);
        return idx !== undefined ? idx : -1;
    }

    getWhiteCardByIndex(index, forcedLang = null) {
        if (index === undefined || index === null || index < 0) return null;
        const all = this.getAllCards(forcedLang).bianche;
        return all[index] || null;
    }

    getBlackCardIndex(card, forcedLang = null) {
        if (!card || !card.testo) return -1;
        const lang = forcedLang || this.language;
        if (!this.cachedAllCards[lang]) this.getAllCards(lang); // Ensure maps populated

        const normalized = card.testo.trim();
        const idx = this.lookupMaps[lang].nere.get(normalized);
        return idx !== undefined ? idx : -1;
    }

    getBlackCardByIndex(index, forcedLang = null) {
        if (index === undefined || index === null || index < 0) return null;
        const all = this.getAllCards(forcedLang).nere;
        return all[index] || null;
    }
}

export default new GameDataService();
