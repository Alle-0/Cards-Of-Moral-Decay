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
        price: 0,
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
            accent: '#abd9f8',
            accentWeak: 'rgba(224, 242, 254, 0.25)',
            background: ['#2d667e', '#09374e', '#05283a'],
            cardBg: 'rgba(224, 242, 254, 0.1)',
            cardBorder: 'rgba(224, 242, 254, 0.5)',
            textPrimary: '#a6c9df',
            particle: '#9cc3db',
            particleEmoji: '❄️',
        },
        particleConfig: null,
        price: 0,
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
        price: 1000,
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
        price: 1500,
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
        price: 1500,
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
            background: ['#8a8a8aff', '#585858ff', '#4d4d4dff'], // Grigio imbottito
            cardBg: 'rgba(20, 184, 166, 0.08)',
            cardBorder: 'rgba(20, 184, 166, 0.5)',
            textPrimary: '#0f766e', // Testo scuro per contrasto su background chiaro
            particle: '#ffffff',
            particleEmoji: '💊',
        },
        particleConfig: null, // [REFINED] Removed pills
        price: 500,
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
    abisso: {
        id: 'abisso',
        label: 'Abisso Lovecraft',
        colors: {
            accent: '#8b5cf6', // Viola scuro
            accentWeak: 'rgba(139, 92, 246, 0.15)',
            background: ['#020617', '#0f172a', '#000000'], // Blu notte profondo
            cardBg: 'rgba(0, 0, 0, 0.6)',
            cardBorder: '#4c1d95',
            textPrimary: '#e2e8f0',
            particle: '#7c3aed',
            particleEmoji: '👁️',
        },
        particleConfig: 'voidFloat',
        price: 2000,
    },
    cioccolato: {
        id: 'cioccolato',
        label: 'Diabete',
        colors: {
            accent: '#fcd34d', // Oro caramello
            accentWeak: 'rgba(252, 211, 77, 0.2)',
            background: ['#451a03', '#78350f', '#271007'], // Cioccolato fondente
            cardBg: 'rgba(255, 255, 255, 0.05)',
            cardBorder: '#d97706',
            textPrimary: '#fffbeb',
            particle: '#fca5a5',
            particleEmoji: '🍩',
        },
        particleConfig: null,
        price: 500,
    },
};

export const TEXTURES = {
    gold_leaf: require('../../assets/textures/gold_leaf.jpg'),
    mirror: require('../../assets/textures/mirror.jpg'),
    petrol: require('../../assets/textures/petrol.jpg'),
    smoke: require('../../assets/textures/smoke.png'),
    holo: require('../../assets/textures/hologram.jpg'),
    leather: require('../../assets/textures/leather.jpg'),
    marble: require('../../assets/textures/marble.jpg'),
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
            bg: '#fccb06',
            text: '#423100',
            border: '#ffd700',
            texture: 'gold_leaf',
            textureOpacity: 0.4
        }
    },
    blood: {
        id: 'blood',
        label: 'Sangue',
        price: 2500,
        styles: {
            bg: '#fee2e2',
            text: '#991b1b',
            border: '#ef4444',
            texture: null
        }
    },
    noir: {
        id: 'noir',
        label: 'Noir Elegance',
        price: 3000,
        styles: {
            bg: '#1a1a1a',
            text: '#e2e8f0',
            border: '#475569',
            texture: null
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
            texture: null
        }
    },
    graffi: {
        id: 'graffi',
        label: 'Ombre',
        price: 1000,
        styles: {
            bg: '#f8fafc',
            text: '#0f172a',
            border: '#94a3b8',
            texture: 'mirror',
            textureOpacity: 0.15
        }
    },
    petrol: {
        id: 'petrol',
        label: 'Petrolio',
        price: 1500,
        styles: {
            bg: '#000000',
            text: '#f8fafc',
            border: '#8b5cf6',
            texture: 'petrol',
            textureOpacity: 0.3
        }
    },
    riscatto: {
        id: 'riscatto',
        label: 'Lettera di Riscatto',
        price: 1000,
        styles: {
            bg: '#e3d5b8',
            text: '#222',
            border: '#5c5c5c',
            texture: null
        }
    },
    biohazard: {
        id: 'biohazard',
        label: 'Infetto',
        price: 1000,
        styles: {
            bg: '#fef08a',
            text: '#451a03',
            border: '#ca8a04',
            texture: null
        }
    },
    holo: {
        id: 'holo',
        label: 'Olografica Rara',
        price: 3000,
        styles: {
            bg: '#1e293b',
            text: '#ffffff',
            border: '#ffffff',
            texture: 'holo',
            textureOpacity: 0.5
        }
    },
    pelle: {
        id: 'pelle',
        label: 'Necronomicon',
        price: 1500,
        styles: {
            bg: '#451a03',
            text: '#fcd34d',
            border: '#78350f',
            texture: 'leather',
            textureOpacity: 0.3
        }
    },
    marmo: {
        id: 'marmo',
        label: 'Marmo di Carrara',
        price: 2500,
        styles: {
            bg: '#f8fafc',
            text: '#1e293b',
            border: '#64748b',
            texture: 'marble',
            textureOpacity: 0.6 // [FIX] High visibility for light marble
        }
    },
    magma: {
        id: 'magma',
        label: 'Magma',
        price: 2000,
        styles: {
            bg: '#250800',
            text: '#fb923c',
            border: '#ef4444',
            texture: null, // [FIX] Removed petrol texture for cleaner look
            textureOpacity: 0
        }
    }
};

export const AVATAR_FRAMES = {
    basic: { id: 'basic', label: 'Nessuna', price: 0, asset: null },
    glitch: { id: 'glitch', label: 'Errore di Sistema', price: 1000, asset: 'frame_glitch' },
    // [NEW]
    neon: { id: 'neon', label: 'Neon Cyber', price: 1500, asset: 'frame_neon' },
    angel: { id: 'angel', label: 'Serafino', price: 3000, asset: 'frame_angel' },
    demon: { id: 'demon', label: 'Demone', price: 2000, asset: 'frame_demon' },
    pixel: { id: 'pixel', label: '8-Bit Retro', price: 500, asset: 'frame_pixel' },
    love: { id: 'love', label: 'Amore Tossico', price: 2000, asset: 'frame_love' },
    rich: { id: 'rich', label: 'Miliardario', price: 10000, asset: 'frame_rich' },
    capo: { id: 'capo', label: 'CAPO SUPREMO', price: 999999999, asset: 'frame_capo' },
    wanted: { id: 'wanted', label: 'WANTED', price: 2000, asset: 'frame_wanted' },
    toilet: { id: 'toilet', label: 'Trono di Ceramica', price: 500, asset: 'frame_toilet' },
    cat: { id: 'cat', label: 'Gattara', price: 1500, asset: 'frame_cat' },
    ice_king: { id: 'ice_king', label: 'Re dei Ghiacci', price: 5000, asset: 'frame_ice_king' },
    midas_touch: { id: 'midas_touch', label: 'Tocco di Mida', price: 10000, asset: 'frame_midas_touch' },
};

export const ThemeProvider = ({ children }) => {
    // [NEW] Web-specific theme overrides for better visibility
    const getThemeWithOverrides = (inputTheme) => {
        if (!inputTheme) return THEMES.default;

        if (Platform.OS === 'web') {
            const webOverrides = {
                default: { background: ['#231d16', '#1a1815', '#141210'] }, // Lightened
                onice: { background: ['#111111', '#1a1a1a', '#222222'] },
                lucifero: { background: ['#1a0c04', '#3d1a08', '#5a0e0e'] },
                leviatano: { background: ['#0a1229', '#1e3a8a', '#2e2a6e'] },
                assenzio: { background: ['#0a1f1a', '#064e3b', '#1a633a'] },
                ghiaccio: { background: ['#2d667e', '#09374e', '#05283a'] },
                matrix: { background: ['#050a06', '#0a2a0e', '#050a06'] },
                abisso: { background: ['#01030e', '#090d1a', '#000000'] },
                cioccolato: { background: ['#381502', '#5f2b0c', '#1a0b05'] },
            };

            const override = webOverrides[inputTheme.id];
            if (override) {
                return {
                    ...inputTheme,
                    colors: {
                        ...inputTheme.colors,
                        ...override,
                    }
                };
            }
        }
        return inputTheme;
    };

    const [currentTheme, setCurrentTheme] = useState(() => getThemeWithOverrides(THEMES.default)); // [FIX] Immediate web override
    const [animationsEnabled, setAnimationsEnabled] = useState(true); // [NEW] Animation Toggle


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
