import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, Platform } from 'react-native';
import PremiumModal from './PremiumModal';
import PremiumPressable from './PremiumPressable';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';
import SoundService from '../services/SoundService';

/**
 * CardSuggestionModal
 * Allows players to suggest new white or black cards.
 * Data is saved to Firebase Realtime Database: suggestions/cards
 */
const CardSuggestionModal = ({ visible, onClose, onSuccess }) => {
    const { t, language } = useLanguage();
    const { user, spendMoney } = useAuth();
    const { theme } = useTheme();
    const [type, setType] = useState('white'); // 'white' | 'black'
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim() || loading) return;

        const cost = 25;
        if (user?.balance < cost) {
            alert(t('insufficient_funds_msg') || "Fondi insufficienti!");
            return;
        }

        setLoading(true);
        try {
            const suggestionsRef = ref(db, 'suggestions/cards');
            await push(suggestionsRef, {
                text: text.trim(),
                type,
                username: user?.username || 'Anonymous',
                language,
                timestamp: serverTimestamp(),
                cost_paid: cost
            });

            // Deduct money
            await spendMoney(cost);

            SoundService.play('tap'); // Using tap for feedback
            setText('');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("[SUGGESTION] Failed to submit:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title={t('suggest_card_title')}
        >
            <View style={styles.container}>
                <Text style={styles.desc}>{t('suggest_card_desc_cost') || "Invia la tua idea folle per una nuova carta nera o bianca (Costo: 25 DC)."}</Text>

                <View style={styles.typeContainer}>
                    <PremiumPressable
                        style={[styles.typeButton, type === 'white' && { borderColor: theme.colors.accent, backgroundColor: 'rgba(255,215,0,0.1)' }]}
                        onPress={() => setType('white')}
                        haptic="light"
                    >
                        <Text style={[styles.typeText, type === 'white' && { color: theme.colors.accent }]}>{t('card_type_white')}</Text>
                    </PremiumPressable>
                    <PremiumPressable
                        style={[styles.typeButton, type === 'black' && { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }]}
                        onPress={() => setType('black')}
                        haptic="light"
                    >
                        <Text style={[styles.typeText, type === 'black' && { color: '#fff' }]}>{t('card_type_black')}</Text>
                    </PremiumPressable>
                </View>

                <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder={t('suggest_card_placeholder')}
                    placeholderTextColor="#666"
                    multiline
                    value={text}
                    onChangeText={setText}
                    maxLength={300}
                />

                <PremiumPressable
                    style={[styles.submitButton, (!text.trim() || loading || (user?.balance < 25)) && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!text.trim() || loading || (user?.balance < 25)}
                    haptic="success"
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text
                            style={styles.submitText}
                        >
                            {t('suggest_card_submit')} (25 DC)
                        </Text>
                    )}
                </PremiumPressable>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        gap: 20,
    },
    desc: {
        fontFamily: 'Outfit',
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    typeText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 15,
        fontFamily: 'Outfit',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            }
        })
    },
    submitButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitText: {
        fontFamily: 'Cinzel-Bold',
        color: '#000',
        fontSize: 17,
        textAlign: 'center',
        letterSpacing: 0.5,
        includeFontPadding: false,
    }
});

export default CardSuggestionModal;
