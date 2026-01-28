// src/components/PaywallModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import PremiumButton from './PremiumButton';
import { useTheme } from '../context/ThemeContext';
import RevenueCatService from '../services/RevenueCatService';
import ToastNotification from './ToastNotification';

// Try to import RevenueCatUI, fallback if not available
let RevenueCatUI;
try {
    RevenueCatUI = require('react-native-purchases-ui').RevenueCatUI;
} catch (error) {
    console.warn('[PaywallModal] RevenueCat UI package not installed');
}

const PaywallModal = ({ visible, onClose, onPurchaseSuccess }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const handlePurchase = async () => {
        // Check if RevenueCat UI is available
        if (!RevenueCatUI) {
            setToast({
                visible: true,
                message: 'RevenueCat packages not installed. Please run: npm install --save react-native-purchases react-native-purchases-ui',
                type: 'error'
            });
            setTimeout(() => onClose(), 3000);
            return;
        }
        try {
            setLoading(true);

            // Present RevenueCat Paywall
            const result = await RevenueCatUI.presentPaywall({
                requiredEntitlementIdentifier: 'Cards Of Moral Decay Pro'
            });

            if (result === RevenueCatUI.PAYWALL_RESULT.PURCHASED) {
                setToast({
                    visible: true,
                    message: 'Subscription activated! 🎉',
                    type: 'success'
                });

                if (onPurchaseSuccess) {
                    onPurchaseSuccess();
                }

                setTimeout(() => {
                    onClose();
                }, 1500);
            } else if (result === RevenueCatUI.PAYWALL_RESULT.CANCELLED) {
                console.log('[Paywall] User cancelled');
            } else if (result === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
                setToast({
                    visible: true,
                    message: 'Purchases restored! ✅',
                    type: 'success'
                });

                if (onPurchaseSuccess) {
                    onPurchaseSuccess();
                }
            }
        } catch (error) {
            console.error('[Paywall] Error:', error);
            setToast({
                visible: true,
                message: 'Purchase failed. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            handlePurchase();
        }
    }, [visible]);

    return (
        <>
            <Modal
                visible={visible && loading}
                transparent
                animationType="fade"
            >
                <View style={styles.loadingContainer}>
                    <View style={[styles.loadingBox, { backgroundColor: theme.colors.cardBackground }]}>
                        <ActivityIndicator size="large" color={theme.colors.accent} />
                        <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
                            Loading subscription options...
                        </Text>
                    </View>
                </View>
            </Modal>

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />
        </>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        gap: 15,
    },
    loadingText: {
        fontFamily: 'Outfit',
        fontSize: 14,
    },
});

export default PaywallModal;
