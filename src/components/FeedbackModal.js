import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { submitFeedback } from '../services/firebase';
import PremiumModal from './PremiumModal';
import { APP_VERSION } from '../constants/Config';

const FEEDBACK_COOLDOWN_KEY = '@feedback_last_sent';
const COOLDOWN_HOURS = 24;
const MAX_CHARS = 250;

const FeedbackModal = ({ visible, onClose, onSuccess }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { t } = useLanguage();

    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setMessage('');
            setError('');
            setIsSubmitting(false);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!message.trim()) {
            setError(t('feedback_empty_error') || 'Il messaggio non può essere vuoto.');
            return;
        }

        if (message.length > MAX_CHARS) {
            setError(t('feedback_length_error') || `Massimo ${MAX_CHARS} caratteri consentiti.`);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // 1. Check Rate Limit
            const lastSentTimestamp = await AsyncStorage.getItem(FEEDBACK_COOLDOWN_KEY);
            if (lastSentTimestamp) {
                const now = Date.now();
                const past = parseInt(lastSentTimestamp, 10);
                const diffHours = (now - past) / (1000 * 60 * 60);

                if (diffHours < COOLDOWN_HOURS) {
                    const hoursLeft = Math.ceil(COOLDOWN_HOURS - diffHours);
                    setError(t('feedback_cooldown_error')?.replace('%{hours}', hoursLeft) || `Attendi ${hoursLeft} ore prima di inviare un nuovo feedback.`);
                    setIsSubmitting(false);
                    return;
                }
            }

            // 2. Prepare Payload
            const feedbackData = {
                userId: user?.uid || 'anonymous',
                name: user?.username || 'Anonimo',
                message: message.trim(),
                timestamp: Date.now(),
                appVersion: APP_VERSION || 'unknown'
            };

            // 3. Submit to Firebase
            await submitFeedback(feedbackData);

            // 4. Update Cooldown & Success
            await AsyncStorage.setItem(FEEDBACK_COOLDOWN_KEY, Date.now().toString());
            onSuccess();
            onClose();

        } catch (err) {
            console.error("Feedback error", err);
            setError(t('feedback_submit_error') || "Errore durante l'invio. Riprova più tardi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title={t('feedback_title') || 'INVIA FEEDBACK'}
        >
            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    {t('feedback_subtitle') || 'Segnala bug o suggerisci miglioramenti.'}
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        { borderColor: error ? '#ef4444' : 'rgba(255,255,255,0.2)' }
                    ]}
                    placeholder={t('feedback_placeholder') || 'Scrivi qui il tuo messaggio...'}
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                    maxLength={MAX_CHARS}
                    value={message}
                    onChangeText={(text) => {
                        setMessage(text);
                        if (error) setError('');
                    }}
                    editable={!isSubmitting}
                />

                <View style={styles.charCountContainer}>
                    <Text style={styles.charCount}>
                        {message.length}/{MAX_CHARS}
                    </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.cancelButtonText}>{t('cancel_btn') || 'ANNULLA'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, { backgroundColor: theme.colors.accent }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || !message.trim()}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <Text style={[styles.submitButtonText, { color: '#000' }]}>{t('suggest_card_submit') || 'INVIA'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    content: {
        padding: 24,
    },
    title: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Outfit',
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        fontFamily: 'Outfit',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderRadius: 8,
        color: '#fff',
        padding: 12,
        height: 120,
        textAlignVertical: 'top',
        fontSize: 15,
    },
    charCountContainer: {
        alignItems: 'flex-end',
        marginTop: 4,
        marginBottom: 10,
    },
    charCount: {
        fontFamily: 'Outfit',
        color: '#666',
        fontSize: 12,
    },
    errorText: {
        fontFamily: 'Outfit',
        color: '#ef4444',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
    },
    cancelButtonText: {
        fontFamily: 'Outfit-Bold',
        color: '#aaa',
        fontSize: 14,
    },
    submitButton: {
    },
    submitButtonText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
        letterSpacing: 1,
    }
});

export default FeedbackModal;
