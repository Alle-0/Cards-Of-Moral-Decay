import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PremiumModal from './PremiumModal';
import PremiumButton from './PremiumButton';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ConfirmationModal = ({
    visible,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = "OK",
    cancelText = null,
    singleButton = false
}) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title={title}
            showClose={false}
        >
            <View style={{ gap: 20, paddingHorizontal: 20, paddingBottom: 20 }}>
                <Text style={styles.message}>
                    {message}
                </Text>

                <View style={styles.buttonRow}>
                    {!singleButton && (
                        <PremiumButton
                            title={cancelText || t('cancel_btn')}
                            variant="ghost"
                            enableSound={false}
                            onPress={onClose}
                            style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                            contentContainerStyle={{ paddingVertical: 12 }}
                            textStyle={{ fontSize: 13 }}
                        />
                    )}
                    <PremiumButton
                        title={confirmText}
                        variant={singleButton ? "primary" : "danger"}
                        enableSound={false}
                        onPress={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingVertical: 12 }}
                        textStyle={{ fontSize: 13, fontFamily: 'Cinzel-Bold' }}
                    />
                </View>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    message: {
        fontSize: 18,
        color: '#ccc',
        textAlign: 'center',
        fontFamily: 'Outfit',
        lineHeight: 24,
        paddingHorizontal: 10,
        marginBottom: 10
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        width: '100%'
    }
});

export default ConfirmationModal;
