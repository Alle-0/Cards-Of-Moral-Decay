import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

// [IMPORTANT] Files confirmed in src/sounds/
const SOUND_MAP = {
    'tap': require('../sounds/pop.mp3'),           // Lightweight tap
    'card_slide': require('../sounds/deal.mp3'),   // Card moving
    'card_play': require('../sounds/play.mp3'),    // Card hitting table
    'success': require('../sounds/win.wav'),       // Win round/game
    'purchase': require('../sounds/win.wav'),      // Purchase success
    'notification': require('../sounds/deal.mp3'), // Generic notification
    'error': require('../sounds/error.mp3'),       // Errors
    'shuffle': require('../sounds/deal.mp3'),      // Deck shuffle
};

class SoundService {
    constructor() {
        this._muted = false;
        this.isLoaded = false;
        this.preloadedSounds = {}; // Cache for frequent sounds
    }

    async loadSounds() {
        if (this.isLoaded) return;

        try {
            // 1. Setup Audio Mode (expo-audio SDK 54 style)
            await setAudioModeAsync({
                playsInSilentMode: true,
                interruptionMode: 'duckOthers',
                shouldRouteThroughEarpiece: false,
            });

            // 2. Load Mute Preference
            const savedMuted = await AsyncStorage.getItem('cah_muted');
            this._muted = savedMuted === 'true';

            // 3. Preload frequent sounds
            const soundsToPreload = ['tap', 'card_play', 'success'];

            for (const name of soundsToPreload) {
                const source = SOUND_MAP[name];
                if (source) {
                    try {
                        // In expo-audio, createPlayer is synchronous but the resource might load async
                        const player = createAudioPlayer(source);
                        player.volume = 0.7; // [FIX] Increased effects volume
                        this.preloadedSounds[name] = player;
                    } catch (preloadError) {
                        console.warn(`[SoundService] Failed to preload '${name}'`, preloadError);
                    }
                }
            }

            this.isLoaded = true;
        } catch (e) {
            console.warn("[SoundService] Setup Error", e);
        }
    }

    isMuted() {
        return this._muted;
    }

    async setMuted(muted) {
        this._muted = muted;
        try {
            await AsyncStorage.setItem('cah_muted', muted.toString());
        } catch (e) {
            console.warn("Failed to save mute setting", e);
        }
    }

    async toggleMute() {
        await this.setMuted(!this._muted);
        return this._muted;
    }

    async play(name) {
        if (this._muted) return;

        // [FIX] Debounce 'tap' to prevent double triggers
        const now = Date.now();
        if (name === 'tap' && this.lastTap && now - this.lastTap < 100) {
            return;
        }
        if (name === 'tap') this.lastTap = now;

        // 1. Try Preloaded Sound First
        const preloaded = this.preloadedSounds[name];
        if (preloaded) {
            try {
                preloaded.seekTo(0);
                const result = preloaded.play();
                if (result && typeof result.catch === 'function') {
                    result.catch(() => { }); // DEFENSIVE: Handle immediately for web
                }
            } catch (e) {
                console.log(`[SoundService] Replay Error '${name}':`, e.message);
                // Attempt to recreate the player if it failed
                try {
                    const player = createAudioPlayer(SOUND_MAP[name]);
                    this.preloadedSounds[name] = player;
                    const result = player.play();
                    if (result && typeof result.catch === 'function') {
                        result.catch(() => { }); // DEFENSIVE: Handle immediately for web
                    }
                } catch (reloadError) {
                    console.log(`[SoundService] New player launch failed '${name}':`, reloadError.message);
                }
            }
            return;
        }

        // 2. Fallback for non-preloaded sounds
        const soundSource = SOUND_MAP[name];
        if (!soundSource) {
            console.warn(`Sound '${name}' not defined in SOUND_MAP`);
            return;
        }

        try {
            const player = createAudioPlayer(soundSource);
            player.volume = 0.3; // [FIX] Lower effects volume
            const result = player.play();
            if (result && typeof result.catch === 'function') {
                result.catch(() => { }); // [CRITICAL] Suppress Uncaught promise rejection for web
            }
        } catch (error) {
            // Log but don't crash
            console.log(`[SoundService] playOnce failed for '${name}':`, error.message);
        }
    }

    // Cleanup
    async unloadAll() {
        try {
            // In expo-audio, we don't have unloadAsync exactly, 
            // but we can remove listeners or null the references
            this.preloadedSounds = {};
            this.isLoaded = false;
        } catch (e) {
            console.warn("Unload Error", e);
        }
    }
}

export default new SoundService();
