/**
 * Bocca di Sapone - Profanity Filter Utility
 * Light-weight manual list of forbidden words (Italian & English)
 */

const FORBIDDEN_WORDS = [
    // English (Slurs, Profanities, Hate Speech, Extremism)
    'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'nazi', 'hitler', 'negro', 'nigger', 'nigga',
    'faggot', 'kike', 'spic', 'chink', 'dyke', 'porn', 'cock', 'clit', 'vagina', 'penis', 'cum', 'whore', 'slut',
    'bastard', 'motherfucker', 'retard', 'wanker', 'twat', 'piss', 'bollocks', 'tosser', 'fag', 'coon', 'wetback',
    'kkk', 'ku-klux-klan', 'aryan', 'white-power', 'neo-nazi', 'holocaust', 'stalin', 'lenin', 'mao', 'comunista',
    'comunismo', 'communism', 'communist', 'gay', 'trans', 'god', 'jesus', 'christ', 'christian', 'islam', 'muslim',
    // Italian (Bestemmie, Insulti Gravi, Slurs, Politica Estrema)
    'stronzo', 'cazzo', 'vaffanculo', 'merda', 'troia', 'puttana', 'coglion', 'bastardo', 'dio', 'madonna', 'porco',
    'bestia', 'mussolini', 'duce', 'fascio', 'fascista', 'nazista', 'finocchio', 'negro', 'frocio', 'negra', 'zoccola',
    'bucchino', 'pompino', 'segone', 'ricchione', 'terrone', 'polentone', 'handicappato', 'mongoloide', 'cretino', 'idiota',
    'baldracca', 'mignotta', 'bagascia', 'leccaculo', 'leccapalle', 'minchia', 'ficcatelo', 'infame', 'canaglia',
    'brigate-rosse', 'lotta-continua', 'falce-e-martello', 'falcemartello', 'gulag', 'che-guevara', 'falce-martello',
    'terrorista', 'terrorismo',
];

export const isProfane = (text) => {
    if (!text || typeof text !== 'string') return false;

    // 1. Basic normalization
    let cleanText = text.toLowerCase().trim();

    // 2. Leet-speak normalization (handle common substitutions)
    // We create a version of the text with common substitutions reversed
    const substitutions = {
        '4': 'a', '@': 'a',
        '3': 'e',
        '1': 'i', '!': 'i', '|': 'i', 'l': 'i', // Treat 'l' as 'i' for many slurs
        '0': 'o',
        '5': 's', '$': 's',
        '7': 't',
        '8': 'b',
        'v': 'u' // v instead of u (latin style)
    };

    let normalizedText = cleanText;
    // Safely replace each character
    for (const [key, val] of Object.entries(substitutions)) {
        // Use split/join to avoid regex escaping issues for characters like |, !, $
        normalizedText = normalizedText.split(key).join(val);
    }

    // Check both protected versions
    return FORBIDDEN_WORDS.some(word => {
        return cleanText.includes(word) || normalizedText.includes(word);
    });
};

export const validateUsername = (username) => {
    if (!username || username.trim().length < 2) return { valid: false, error: 'username_too_short' };
    if (username.length > 20) return { valid: false, error: 'username_too_long' };

    // Allow letters, numbers, underscores, and spaces.
    // Must start and end with non-space character (standard trim handle)
    if (!/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*[a-zA-Z0-9_]$|^[a-zA-Z0-9_]$/.test(username)) {
        return { valid: false, error: 'username_invalid_chars' };
    }

    if (isProfane(username)) return { valid: false, error: 'username_offensive' };

    return { valid: true };
};
