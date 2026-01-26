import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PremiumModal from './PremiumModal';
import PremiumButton from './PremiumButton';
import { useTheme } from '../context/ThemeContext';

const ConfirmationModal = ({
    visible,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = "OK",
    cancelText = "Annulla",
    singleButton = false
}) => {
    const { theme } = useTheme();

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title={title}
            showClose={false}
        >
            <View style={{ gap: 20 }}>
                <Text style={styles.message}>
                    {message}
                </Text>

                <View style={styles.buttonRow}>
                    {!singleButton && (
                        <PremiumButton
                            title={cancelText}
                            variant="ghost"
                            enableSound={false}
                            onPress={onClose}
                            style={{ flex: 1, borderWidth: 1, borderColor: '#333' }}
                            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
                            textStyle={{ color: '#ccc', fontSize: 13 }}
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
                        style={{ flex: 1, backgroundColor: singleButton ? theme.colors.accent : '#ff453a' }}
                        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
                        textStyle={{ color: singleButton ? '#000' : '#fff', fontSize: 13, fontFamily: 'Cinzel-Bold' }}
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
        gap: 15,
        justifyContent: 'center',
        width: '100%'
    }
});

export default ConfirmationModal;
