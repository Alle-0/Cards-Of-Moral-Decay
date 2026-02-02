import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, ZoomIn } from 'react-native-reanimated';
import { DirtyCashIcon } from './Icons'; // Adjust import if needed
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const PaymentResultModal = ({ visible, result, onClose }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const scale = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1);
        } else {
            scale.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    if (!visible || !result) return null;

    const isSuccess = result.success;


    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, animatedStyle, { borderColor: isSuccess ? '#d4af37' : '#ef4444', backgroundColor: theme.colors.background[0] }]}>

                    {/* ICONA */}
                    <View style={[styles.iconContainer, { borderColor: isSuccess ? '#d4af37' : '#ef4444' }]}>
                        {isSuccess ? (
                            <DirtyCashIcon size={40} color="#d4af37" />
                        ) : (
                            <Text style={{ fontSize: 40 }}>❌</Text>
                        )}
                    </View>

                    {/* TITOLO */}
                    <Text style={[styles.title, { color: isSuccess ? '#d4af37' : '#ef4444' }]}>
                        {result.title || (isSuccess ? t('payment_success_title') : t('payment_failed_title'))}
                    </Text>

                    {/* DESCRIZIONE */}
                    <Text style={[styles.message, { color: theme.colors.textPrimary }]}>
                        {result.message || (isSuccess
                            ? (result.type === 'dark_pack'
                                ? t('payment_dark_pack_msg')
                                : t('payment_dc_msg', { amount: result.amount }))
                            : `${t('payment_error')} ${result.error}`)
                        }
                    </Text>

                    {/* BOTTONE */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: isSuccess ? '#d4af37' : '#ef4444' }]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>{t('ok_btn')}</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        width: width * 0.8,
        padding: 30,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        elevation: 10
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    title: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 22,
        marginBottom: 10,
        textAlign: 'center'
    },
    message: {
        fontFamily: 'Outfit',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
        minWidth: 150,
        alignItems: 'center'
    },
    buttonText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 16,
        color: '#000'
    }
});

export default PaymentResultModal;
