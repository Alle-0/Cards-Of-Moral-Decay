// src/components/CustomerCenterModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ToastNotification from './ToastNotification';

// Try to import RevenueCatUI, fallback if not available
let RevenueCatUI;
try {
    RevenueCatUI = require('react-native-purchases-ui').RevenueCatUI;
} catch (error) {
    console.warn('[CustomerCenterModal] RevenueCat UI package not installed');
}

const CustomerCenterModal = ({ visible, onClose }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const handleOpenCustomerCenter = async () => {
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

            // Present RevenueCat Customer Center
            await RevenueCatUI.presentCustomerCenter();

            // Close modal after customer center is dismissed
            onClose();
        } catch (error) {
            console.error('[CustomerCenter] Error:', error);
            setToast({
                visible: true,
                message: 'Failed to open subscription management.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            handleOpenCustomerCenter();
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
                            Loading subscription management...
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

export default CustomerCenterModal;
