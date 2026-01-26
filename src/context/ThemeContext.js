import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Platform } from 'react-native';

const ThemeContext = createContext();

export const THEMES = {
    default: {
        id: 'default',
        label: 'Default',
        colors: {
            accent: '#ffce6a',
            accentWeak: 'rgba(255, 206, 106, 0.18)',
            background: ['#1a1510', '#141210', '#0f0d0b'],
            cardBg: 'rgba(255, 206, 106, 0.10)',
            cardBorder: 'rgba(255, 206, 106, 0.45)',
            textPrimary: '#f8f3e6',
            particle: '#ffce6a',
            particleEmoji: '✨',
        },
        particleConfig: 'dust',
        price: 0,
    },
    onice: {
        id: 'onice',
        label: 'Onice',
        colors: {
            accent: '#ffffff',
            accentWeak: 'rgba(255, 255, 255, 0.1)',
            background: ['#000000', '#111111', '#1a1a1a'],
            cardBg: 'rgba(255, 255, 255, 0.03)',
            cardBorder: 'rgba(255, 255, 255, 0.4)',
            textPrimary: '#ffffff',
            particle: '#888888',
            particleEmoji: '⚫',
        },
        particleConfig: null, // Nessun effetto (Minimal puro)
        price: 500,
    },
    lucifero: {
        id: 'lucifero',
        label: 'Lucifero',
        colors: {
            accent: '#ea580c',
            accentWeak: 'rgba(234, 88, 12, 0.2)',
            background: ['#000000', '#2a1205', '#450a0a'],
            cardBg: 'rgba(234, 88, 12, 0.08)',
            cardBorder: 'rgba(234, 88, 12, 0.5)',
            textPrimary: '#ffedd5',
            particle: '#fdba74',
            particleEmoji: '🔥',
        },
        particleConfig: 'ash',
        price: 1000,
    },
    leviatano: {
        id: 'leviatano',
        label: 'Leviatano',
        colors: {
            accent: '#3b82f6',
            accentWeak: 'rgba(59, 130, 246, 0.25)',
            background: ['#020617', '#172554', '#1e1b4b'],
            cardBg: 'rgba(59, 130, 246, 0.08)',
            cardBorder: 'rgba(59, 130, 246, 0.5)',
            textPrimary: '#eff6ff',
            particle: '#60a5fa',
            particleEmoji: '🔱',
        },
        particleConfig: 'bubble',
        price: 1000,
    },
    assenzio: {
        id: 'assenzio',
        label: 'Assenzio',
        colors: {
            accent: '#22c55e',
            accentWeak: 'rgba(9, 46, 22, 0.25)',
            background: ['#000000', '#000605ff', '#010201ff'],
            cardBg: 'rgba(34, 197, 94, 0.08)',
            cardBorder: 'rgba(34, 197, 94, 0.6)',
            textPrimary: '#dcfce7',
            particle: '#4ade80',
            particleEmoji: '🫧',
        },
        particleConfig: 'toxicBubble',
        price: 1000,
    },
    ghiaccio: {
        id: 'ghiaccio',
        label: 'Ghiaccio',
        colors: {
            accent: '#abd9f8ff',
            accentWeak: 'rgba(224, 242, 254, 0.25)',
            background: ['#2d667eff', '#09374eff', '#05283aff'],
            cardBg: 'rgba(224, 242, 254, 0.1)',
            cardBorder: 'rgba(224, 242, 254, 0.5)',
            textPrimary: '#a6c9dfff',
            particle: '#9cc3dbff',
            particleEmoji: '❄️',
        },
        particleConfig: null,
        price: 500,
    },
    titanio: {
        id: 'titanio',
        label: 'Titanio',
        colors: {
            accent: '#cbd5e1',
            accentWeak: 'rgba(203, 213, 225, 0.2)',
            background: ['#1e293b', '#334155', '#0f172a'],
            cardBg: 'rgba(255, 255, 255, 0.05)',
            cardBorder: 'rgba(203, 213, 225, 0.5)',
            textPrimary: '#f1f5f9',
            particle: '#94a3b8',
            particleEmoji: '⚙️',
        },
        particleConfig: 'lightSweep',
        price: 1000,
    },
    kyoto: {
        id: 'kyoto',
        label: 'Kyoto',
        colors: {
            accent: '#f43f5e',
            accentWeak: 'rgba(244, 63, 94, 0.25)',
            background: ['#4c0519', '#831843', '#2e1065'],
            cardBg: 'rgba(244, 63, 94, 0.08)',
            cardBorder: 'rgba(244, 63, 94, 0.5)',
            textPrimary: '#ffe4e6',
            particle: null,
            particleEmoji: '🌸',
        },
        particleConfig: null, // Nessun effetto (fiori rimossi)
        price: 500,
    },
    pulsar: {
        id: 'pulsar',
        label: 'Pulsar',
        colors: {
            accent: '#d946ef',
            accentWeak: 'rgba(217, 70, 239, 0.25)',
            background: ['#2e1065', '#1e1b4b', '#4a044e'],
            cardBg: 'rgba(217, 70, 239, 0.1)',
            cardBorder: 'rgba(6, 182, 212, 0.6)',
            textPrimary: '#fae8ff',
            particle: '#22d3ee',
            particleEmoji: '👾',
        },
        particleConfig: 'neonPulse',
        price: 1000,
    },
    matrix: {
        id: 'matrix',
        label: 'Matrix',
        colors: {
            accent: '#00ff41',
            accentWeak: 'rgba(0, 255, 65, 0.15)',
            background: ['#000000', '#021405', '#000000'],
            cardBg: 'rgba(0, 50, 0, 0.8)',
            cardBorder: 'rgba(0, 255, 65, 0.8)',
            textPrimary: '#00ff41',
            particle: '#008F11',
            particleEmoji: '💻',
        },
        particleConfig: 'techRain',
        price: 1000,
    },
    carbonio: {
        id: 'carbonio',
        label: 'Carbonio',
        colors: {
            accent: '#94a3b8',
            accentWeak: 'rgba(148, 163, 184, 0.2)',
            background: ['#0f172a', '#1e293b', '#000000'],
            cardBg: 'rgba(255, 255, 255, 0.05)',
            cardBorder: 'rgba(148, 163, 184, 0.5)',
            textPrimary: '#f8fafc',
            particle: '#cbd5e1',
            particleEmoji: '🗿',
        },
        particleConfig: null,
        price: 500,
    },
    vaticano: {
        id: 'vaticano',
        label: 'Vaticano',
        colors: {
            accent: '#d4af37',
            accentWeak: 'rgba(212, 171, 55, 0.2)',
            background: ['#450404', '#2a0202', '#000000'],
            cardBg: 'rgba(212, 171, 55, 0.08)',
            cardBorder: 'rgba(212, 171, 55, 0.5)',
            textPrimary: '#fde68a',
            particle: '#ffffff',
            particleEmoji: '☁️',
        },
        particleConfig: null, // [REFINED] Removed smoke
        price: 500,
    },
    redlight: {
        id: 'redlight',
        label: 'Red Light',
        colors: {
            accent: '#ff0055',
            accentWeak: 'rgba(255, 0, 85, 0.2)',
            background: ['#2e0000', '#1a0000', '#000000'],
            cardBg: 'rgba(255, 0, 85, 0.08)',
            cardBorder: 'rgba(255, 0, 85, 0.5)',
            textPrimary: '#ffe4e6',
            particle: '#ff0055',
            particleEmoji: '💄',
        },
        particleConfig: null,
        price: 500,
    },
    wallstreet: {
        id: 'wallstreet',
        label: 'Wall Street',
        colors: {
            accent: '#10b981',
            accentWeak: 'rgba(16, 185, 129, 0.2)',
            background: ['#0f172a', '#1e293b', '#020617'],
            cardBg: 'rgba(16, 185, 129, 0.08)',
            cardBorder: 'rgba(16, 185, 129, 0.5)',
            textPrimary: '#f1f5f9',
            particle: '#10b981',
            particleEmoji: '📈',
        },
        particleConfig: 'currencyRain',
        price: 1000,
    },
    crimine: {
        id: 'crimine',
        label: 'Crimine',
        colors: {
            accent: '#facc15', // Giallo Polizia
            accentWeak: 'rgba(250, 204, 21, 0.2)',
            background: ['#1c1917', '#292524', '#0c0a09'], // Asfalto scuro
            cardBg: 'rgba(250, 204, 21, 0.05)',
            cardBorder: 'rgba(250, 204, 21, 0.6)',
            textPrimary: '#fef08a',
            particle: '#ef4444', // Sirene Rosse
            particleEmoji: '🚨',
        },
        particleConfig: 'policeLights',
        price: 1000,
    },
    manicomio: {
        id: 'manicomio',
        label: 'Manicomio',
        colors: {
            accent: '#14b8a6', // Turchese chirurgico
            accentWeak: 'rgba(20, 184, 166, 0.15)',
            background: ['#e5e5e5', '#d4d4d4', '#a3a3a3'], // Grigio imbottito
            cardBg: 'rgba(20, 184, 166, 0.08)',
            cardBorder: 'rgba(20, 184, 166, 0.5)',
            textPrimary: '#0f766e', // Testo scuro per contrasto su background chiaro
            particle: '#ffffff',
            particleEmoji: '💊',
        },
        particleConfig: null, // [REFINED] Removed pills
        price: 1500,
    },
    vegas: {
        id: 'vegas',
        label: 'Las Vegas',
        colors: {
            accent: '#ef4444', // Rosso dadi
            accentWeak: 'rgba(239, 68, 68, 0.2)',
            background: ['#052e16', '#14532d', '#022c22'], // Verde tavolo da gioco
            cardBg: 'rgba(0, 0, 0, 0.3)',
            cardBorder: '#d4af37', // Oro finto
            textPrimary: '#fca5a5',
            particle: '#ef4444',
            particleEmoji: '🎲',
        },
        particleConfig: null, // [REFINED] Removed dice
        price: 1000,
    },
};

export const TEXTURES = {
    gold_leaf: require('../../assets/textures/gold_leaf.png'),
    blood_splatter: require('../../assets/textures/blood_splatter.png'),
    carbon_fiber: require('../../assets/textures/carbon_pattern.png'),
    dollar: require('../../assets/textures/dollar.png'),
    mirror: require('../../assets/textures/mirror.png'),
    petrol: require('../../assets/textures/petrol.png'),
    smoke: require('../../assets/textures/smoke.png'),
};

export const CARD_SKINS = {
    classic: {
        id: 'classic',
        label: 'Bianco Avorio',
        price: 0,
        styles: {
            bg: '#ffffff',
            text: '#1a1a1a',
            border: 'rgba(0,0,0,0.1)',
            texture: null
        }
    },
    mida: {
        id: 'mida',
        label: 'Foglia d\'Oro',
        price: 2500,
        styles: {
            bg: '#fccb06', // [REFINED] Brighter Metallic Gold
            text: '#423100',
            border: '#ffd700',
            texture: 'gold_leaf'
        }
    },
    blood: {
        id: 'blood',
        label: 'Sangue', // Renamed (was Cenere e Sangue)
        price: 2000,
        styles: {
            bg: '#fee2e2', // [REFINED] Lighter/more red-tinted pink
            text: '#991b1b', // [REFINED] More vivid blood red
            border: '#ef4444',
            texture: 'blood_splatter'
        }
    },
    noir: {
        id: 'noir',
        label: 'Noir Elegance',
        price: 2000,
        styles: {
            bg: '#1a1a1a',
            text: '#e2e8f0',
            border: '#475569',
            texture: null // [REFINED] Removed texture
        }
    },
    narco: {
        id: 'narco',
        label: 'Narcodollaro',
        price: 1500,
        styles: {
            bg: '#dcfce7',
            text: '#064e3b',
            border: '#10b981',
            texture: null // [REFINED] Removed texture
        }
    },
    graffi: {
        id: 'graffi',
        label: 'Graffi',
        price: 1000,
        styles: {
            bg: '#f8fafc',
            text: '#0f172a',
            border: '#94a3b8',
            texture: 'mirror'
        }
    },
    petrol: {
        id: 'petrol',
        label: 'Petrolio',
        price: 2200,
        styles: {
            bg: '#000000',
            text: '#f8fafc',
            border: '#8b5cf6', // Iridescent vibe
            texture: 'petrol'
        }
    },
    riscatto: {
        id: 'riscatto',
        label: 'Lettera di Riscatto',
        price: 2000,
        styles: {
            bg: '#e3d5b8', // [REFINED] Old paper/ransom beige
            text: '#222',
            border: '#5c5c5c',
            texture: null // No texture requested
        }
    },

    biohazard: {
        id: 'biohazard',
        label: 'Infetto',
        price: 1200,
        styles: {
            bg: '#fef08a', // Giallo malato
            text: '#451a03', // Marrone ruggine
            border: '#ca8a04',
            texture: null // No texture requested
        }
    }
};

export const AVATAR_FRAMES = {
    basic: { id: 'basic', label: 'Nessuna', price: 0, asset: null },
    glitch: { id: 'glitch', label: 'Errore di Sistema', price: 1000, asset: 'frame_glitch' },
    // [NEW]
    neon: { id: 'neon', label: 'Neon Cyber', price: 1000, asset: 'frame_neon' },
    angel: { id: 'angel', label: 'Serafino', price: 1500, asset: 'frame_angel' },
    demon: { id: 'demon', label: 'Demone', price: 1000, asset: 'frame_demon' },
    pixel: { id: 'pixel', label: '8-Bit Retro', price: 500, asset: 'frame_pixel' },
    love: { id: 'love', label: 'Amore Tossico', price: 1000, asset: 'frame_love' },
    rich: { id: 'rich', label: 'Miliardario', price: 1500, asset: 'frame_rich' },
    capo: { id: 'capo', label: 'CAPO SUPREMO', price: 999999999, asset: 'frame_capo' }, // [NEW] Exclusive
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(THEMES.default); // Default
    const [animationsEnabled, setAnimationsEnabled] = useState(true); // [NEW] Animation Toggle

    // [NEW] Web-specific theme overrides for better visibility
    const getThemeWithOverrides = (theme) => {
        if (Platform.OS === 'web') {
            const webOverrides = {
                default: { background: ['#231d16', '#1a1815', '#141210'] }, // Lightened
                onice: { background: ['#111111', '#1a1a1a', '#222222'] },
                lucifero: { background: ['#1a0c04', '#3d1a08', '#5a0e0e'] },
                leviatano: { background: ['#0a1229', '#1e3a8a', '#2e2a6e'] },
                assenzio: { background: ['#0a1f1a', '#064e3b', '#1a633a'] },
                ghiaccio: { background: ['#2d667eff', '#09374eff', '#05283aff'] },
                matrix: { background: ['#050a06', '#0a2a0e', '#050a06'] },
            };

            const override = webOverrides[theme.id];
            if (override) {
                return {
                    ...theme,
                    colors: {
                        ...theme.colors,
                        ...override
                    }
                };
            }
        }
        return theme;
    };


    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const storedTheme = await AsyncStorage.getItem('cah_theme');
            const storedAnim = await AsyncStorage.getItem('cah_animations'); // [NEW]

            if (storedAnim !== null) {
                setAnimationsEnabled(storedAnim !== 'false');
            }

            if (storedTheme && THEMES[storedTheme]) {
                setCurrentTheme(getThemeWithOverrides(THEMES[storedTheme]));
            } else {
                setCurrentTheme(getThemeWithOverrides(THEMES.default));
            }
        } catch (e) {
            console.warn('Failed to load theme', e);
        }
    };

    const toggleAnimations = async (val) => {
        setAnimationsEnabled(val);
        try {
            await AsyncStorage.setItem('cah_animations', val.toString());
        } catch (e) {
            console.warn('Failed to save anim settings', e);
        }
    };

    const setTheme = async (themeId) => {
        if (THEMES[themeId]) {
            setCurrentTheme(getThemeWithOverrides(THEMES[themeId]));
            try {
                await AsyncStorage.setItem('cah_theme', themeId);
            } catch (e) {
                console.warn('Failed to save theme', e);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: currentTheme, setTheme, themes: THEMES, animationsEnabled, toggleAnimations }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
