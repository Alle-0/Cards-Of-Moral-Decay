import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

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
                player.volume = 0.4; // [FIX] Increased volume (was 0.25)

                // Load preference
                const savedSetting = await AsyncStorage.getItem('cah_music_enabled');
                const shouldPlay = savedSetting !== 'false'; // Default true if null

                if (shouldPlay) {
                    try {
                        player.play();
                    } catch (err) {
                        console.warn("[AudioContext] Autoplay blocked, waiting for interaction...", err);

                        if (Platform.OS === 'web') {
                            const resumeAudio = () => {
                                player.play();
                                window.removeEventListener('click', resumeAudio);
                                window.removeEventListener('touchstart', resumeAudio);
                                window.removeEventListener('keydown', resumeAudio);
                            };
                            window.addEventListener('click', resumeAudio);
                            window.addEventListener('touchstart', resumeAudio);
                            window.addEventListener('keydown', resumeAudio);
                        }
                    }
                }

                console.log("[AudioContext] Player initialized. AutoPlay:", shouldPlay);

                if (isMounted) {
                    soundRef.current = player;
                    setSound(player);
                    setIsPlaying(shouldPlay);
                }
            } catch (error) {
                console.warn("[AudioContext] Failed to load background music:", error);
            }
        };

        // Audio mode is handled globally by SoundService or defaults
        loadSound();

        return () => {
            isMounted = false;
            if (soundRef.current) {
                soundRef.current.pause();
            }
        };
    }, []);

    const toggleMusic = async (val) => {
        try {
            // Check explicit value if provided, else toggle
            const shouldPlay = val !== undefined ? val : !isPlaying;

            // Only try to play/pause if sound is loaded
            if (soundRef.current) {
                if (shouldPlay) {
                    soundRef.current.play();
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

    return (
        <AudioContext.Provider value={{ isPlaying, toggleMusic, setVolume }}>
            {children}
        </AudioContext.Provider>
    );
};
