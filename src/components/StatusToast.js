import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    withSequence, 
    withDelay,
    FadeInUp,
    FadeOutUp
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const StatusToast = ({ notification, onClear }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClear();
            }, 1000); 
            return () => clearTimeout(timer);
        }
    }, [notification?.timestamp, onClear]);

    if (!notification || (notification.type !== 'online' && notification.type !== 'offline')) {
        return null;
    }

    const isOffline = notification.type === 'offline';
    const statusColor = isOffline ? '#94a3b8' : '#4ade80';

    return (
        <Animated.View 
            entering={FadeInUp.duration(300)}
            exiting={FadeOutUp.duration(300)}
            style={[
                styles.container,
                { 
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }
            ]}
        >
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={styles.text}>
                <Text style={styles.name}>{notification.name}</Text>
                {notification.type === 'offline' ? ` ${t('is_offline_short') || 'OFFLINE'}` : ` ${t('is_online_short') || 'ONLINE'}`}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 45,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        zIndex: 9999,
        // Premium shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 6,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginRight: 6,
    },
    text: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'OutfitBold',
        fontSize: 9,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    name: {
        color: '#fff',
    }
});

export default StatusToast;
