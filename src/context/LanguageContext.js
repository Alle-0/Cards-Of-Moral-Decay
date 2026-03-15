// src/context/LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';
import GameDataService from '../services/GameDataService';
import * as Localization from 'expo-localization'; // [NEW]

const LanguageContext = createContext();

import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'user_language_preference';

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('en'); // Default fallback
    const [isLoaded, setIsLoaded] = useState(false);

    // Wrapper to update Service when state changes
    const setLanguage = async (lang) => {
        setLanguageState(lang);
        GameDataService.setLanguage(lang);
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        } catch (e) {
            console.error('Failed to save language preference', e);
        }
    };

    // Funzione per tradurre UI con supporto interpolazione
    // Funzione per tradurre UI con supporto interpolazione e valore di default
    const t = (key, params = {}) => {
        // Fallback strategy: translations[lang][key] -> params.defaultValue -> key
        let text = translations[language][key];

        if (!text) {
            text = params.defaultValue || key;
        }

        // Interpolazione parametri %{key}
        Object.keys(params).forEach(paramKey => {
            if (paramKey !== 'defaultValue') {
                text = text.replace(new RegExp(`%\\{${paramKey}\\}`, 'g'), params[paramKey]);
            }
        });

        return text;
    };

    // Initialize Service with default or saved language
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

                if (savedLanguage) {
                    setLanguageState(savedLanguage);
                    GameDataService.setLanguage(savedLanguage);
                } else {
                    // [NEW] Auto-detect language
                    const locales = Localization.getLocales();
                    const deviceLanguage = locales[0]?.languageCode === 'it' ? 'it' : 'en';

                    setLanguageState(deviceLanguage);
                    GameDataService.setLanguage(deviceLanguage);
                }
            } catch (e) {
                // console.error('Failed to load language preference', e); // Removed or wrapped
                GameDataService.setLanguage(language);
            } finally {
                setIsLoaded(true);
            }
        };

        loadLanguage();
    }, []);

    const contextValue = {
        language,
        setLanguage,
        t,
        isLoaded,
        // Expose a helper to get localized decks if needed directly, 
        // though GameDataService.getPackages is the authority.
        getLocalizedDeck: (activePacks) => GameDataService.getPackages(activePacks)
    };

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
