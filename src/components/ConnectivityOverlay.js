import React from 'react';
import { StyleSheet, View, Text, StatusBar, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldIcon } from './Icons';

const ConnectivityOverlay = ({ isConnected }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    if (isConnected) return null;

    return (
        <Animated.View
            entering={FadeInUp.duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={[
                styles.container,
                {
                    paddingTop: Platform.OS === 'ios' ? insets.top : 10,
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.accent + '44'
                }
            ]}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '22' }]}>
                    <ShieldIcon size={16} color={theme.colors.accent} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.colors.accent }]}>
                        {t('offline_title')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('offline_msg')}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        paddingHorizontal: 20,
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 2,
    },
    subtitle: {
        fontFamily: 'Outfit',
        color: '#aaa',
        fontSize: 11,
        lineHeight: 14,
    }
});

export default ConnectivityOverlay;
