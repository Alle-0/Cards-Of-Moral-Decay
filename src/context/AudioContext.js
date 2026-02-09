import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

const FADE_DURATION = 2000; // 2 seconds
const FADE_STEPS = 20; // Number of volume steps


export const AudioProvider = ({ children }) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const soundRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const loadSound = async () => {
            try {
                // Cleanup existing player
                if (soundRef.current) {
                    soundRef.current.pause();
                    soundRef.current = null;
                }

                // Determine file based on Platform/Browser
                let audioFile;

                if (Platform.OS === 'ios') {
                    // iOS prefers m4a (AAC)
                    audioFile = require('../../assets/audio/Soundtrack.m4a');
                } else if (Platform.OS === 'web') {
                    // Check for Safari agent
                    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                    if (isSafari) {
                        audioFile = require('../../assets/audio/Soundtrack.m4a');
                    } else {
                        // Chrome/Firefox/Edge prefer OGG
                        audioFile = require('../../assets/audio/Soundtrack.ogg');
                    }
                } else {
                    // Android generally handles OGG well
                    audioFile = require('../../assets/audio/Soundtrack.ogg');
                }

                console.log("[AudioContext] Loading sound...");
                console.log("[AudioContext] Platform:", Platform.OS);

                // Initialize Player with expo-audio
                const player = createAudioPlayer(audioFile);
                player.loop = true;
                player.volume = 0.4;

                // [MODIFIED] Removed Auto-Play logic. 
                // Music is now started explicitly by App.js via playMusic()

                console.log("[AudioContext] Player initialized. Waiting for explicit start.");

                if (isMounted) {
                    soundRef.current = player;
                    setSound(player);
                    // setIsPlaying(shouldPlay); // Don't set playing yet
                }
            } catch (error) {
                console.warn("[AudioContext] Failed to load background music:", error);
            }
        };

        // Audio mode is handled globally by SoundService or defaults
        loadSound();

        return () => {
            isMounted = false;
            // Don't stop on unmount to keep bg music alive if needed, or handle cleanup
            if (soundRef.current) {
                // soundRef.current.pause(); 
            }
        };
    }, []);

    const safePlay = async (player) => {
        if (!player) return;
        try {
            const result = player.play();
            // [IMPORTANT] Attach catch IMMEDIATELY in the same event loop tick 
            // to prevent Chromium from reporting "Uncaught (in promise)"
            if (result && typeof result.catch === 'function') {
                result.catch(e => {
                    if (e.name === 'NotAllowedError') {
                        console.log("[AudioContext] Autoplay blocked, waiting for interaction.");
                    } else {
                        console.warn("[AudioContext] play() aborted:", e.message);
                    }
                });
            }

            if (result && typeof result.then === 'function') {
                await result;
            }
        } catch (e) {
            // Already handled in the catch above, but kept for async consistency
        }
    };

    const playMusic = async ({ fade = false } = {}) => {
        if (!soundRef.current) {
            console.warn("[AudioContext] Cannot play, sound not loaded");
            return;
        }

        try {
            const savedSetting = await AsyncStorage.getItem('cah_music_enabled');
            if (savedSetting === 'false') {
                console.log("[AudioContext] Music disabled by user pref.");
                setIsPlaying(false);
                return;
            }

            if (fade) {
                console.log("[AudioContext] Starting music with fade-in...");
                soundRef.current.volume = 0;
                await safePlay(soundRef.current);

                let step = 0;
                const interval = setInterval(() => {
                    step++;
                    const progress = step / FADE_STEPS; // 0 to 1
                    // Ease out quadratic for smoother entry
                    const vol = progress * (2 - progress) * 0.4;

                    if (soundRef.current) {
                        soundRef.current.volume = Math.min(vol, 0.4);
                    }

                    if (step >= FADE_STEPS) {
                        clearInterval(interval);
                        if (soundRef.current) soundRef.current.volume = 0.4;
                    }
                }, FADE_DURATION / FADE_STEPS);
            } else {
                soundRef.current.volume = 0.4;
                await safePlay(soundRef.current);
            }
            setIsPlaying(true);
        } catch (e) {
            console.warn("[AudioContext] playMusic top-level error", e);
        }
    };

    const toggleMusic = async (val) => {
        try {
            // Check explicit value if provided, else toggle
            const shouldPlay = val !== undefined ? val : !isPlaying;

            // Only try to play/pause if sound is loaded
            if (soundRef.current) {
                if (shouldPlay) {
                    await safePlay(soundRef.current);
                } else {
                    soundRef.current.pause();
                }
            } else {
                console.warn("[AudioContext] Sound player not ready, saving state anyway.");
                // Optionally retry loading here? For now just save state.
            }

            setIsPlaying(shouldPlay);
            await AsyncStorage.setItem('cah_music_enabled', shouldPlay.toString());
        } catch (error) {
            console.warn("Error toggling music", error);
        }
    };

    const setVolume = (vol) => {
        if (!soundRef.current) return;
        try {
            soundRef.current.volume = vol;
        } catch (error) {
            console.warn("Error setting volume", error);
        }
    };

    // [NEW] Web Interaction Fallback
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleInteraction = () => {
            if (isPlaying && soundRef.current) {
                safePlay(soundRef.current);
                // Once it plays successfully, we can remove the listeners
                window.removeEventListener('click', handleInteraction);
                window.removeEventListener('touchstart', handleInteraction);
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [isPlaying]);

    return (
        <AudioContext.Provider value={{ isPlaying, toggleMusic, setVolume, playMusic }}>
            {children}
        </AudioContext.Provider>
    );
};

