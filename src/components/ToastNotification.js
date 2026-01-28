import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { CheckIcon, CrossIcon } from './Icons';

const ToastNotification = ({ message, visible, onClose, type = 'error' }) => {
    const { theme } = useTheme();

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInDown.duration(400)}
            exiting={FadeOutDown}
            style={[
                styles.container,
                {
                    borderColor: type === 'success' ? '#4ade80' : theme.colors.cardBorder,
                    borderWidth: type === 'success' ? 1.5 : 1
                }
            ]}
        >
            <View style={styles.iconContainer}>
                {type === 'success' ? (
                    <CheckIcon size={24} color="#4ade80" />
                ) : (
                    <CrossIcon size={24} color="#FF453A" />
                )}
            </View>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 120,
        alignSelf: 'center',
        width: '90%',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        // backgroundColor: 'rgba(255, 69, 58, 0.2)', // Subtle red background
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        color: '#FF453A',
        fontSize: 24,
        fontWeight: 'bold',
    },
    message: {
        color: '#FFFFFF',
        fontFamily: 'Cinzel',
        fontSize: 16,
        flex: 1,
        textTransform: 'uppercase',
    }
});

export default ToastNotification;
