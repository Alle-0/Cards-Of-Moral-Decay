// src/context/LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';
import GameDataService from '../services/GameDataService';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('en'); // Default EN

    // Wrapper to update Service when state changes
    const setLanguage = (lang) => {
        setLanguageState(lang);
        GameDataService.setLanguage(lang);
    };

    // Funzione per tradurre UI con supporto interpolazione
    const t = (key, params = {}) => {
        let text = translations[language][key] || key;

        // Interpolazione parametri %{key}
        Object.keys(params).forEach(paramKey => {
            text = text.replace(new RegExp(`%\\{${paramKey}\\}`, 'g'), params[paramKey]);
        });

        return text;
    };

    // Initialize Service with default
    useEffect(() => {
        GameDataService.setLanguage(language);
    }, []);

    const contextValue = {
        language,
        setLanguage,
        t,
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
