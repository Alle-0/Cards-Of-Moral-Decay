import React, { useState, useEffect } from 'react';
import { View, Text, Platform, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import PremiumButton from './PremiumButton';
import { useLanguage } from '../context/LanguageContext';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { CrossIcon } from './Icons';

const PwaInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        if (ios) {
            setTimeout(() => setIsVisible(true), 3000);
        } else {
            const handler = (e) => {
                e.preventDefault();
                setInstallPrompt(e);
                setTimeout(() => setIsVisible(true), 3000);
            };
            window.addEventListener('beforeinstallprompt', handler);
            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            Alert.alert(
                t('install_app_title'),
                t('install_app_ios_instr')
            );
            return;
        }

        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        setInstallPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };
    // [DEV ONLY] Debug Button removed for production
    // if (!isVisible && __DEV__ && Platform.OS === 'web') { ... }

    if (!isVisible) return null;

    return (
        <Animated.View
            entering={SlideInDown.duration(500)}
            exiting={SlideOutDown.duration(500)}
            style={styles.container}
        >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

            <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeBtn}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                <CrossIcon size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.textColumn}>
                    <Text style={styles.title}>{t('install_app_title')}</Text>
                    <Text style={styles.msg}>{t('install_app_msg')}</Text>
                </View>

                <View style={styles.actionColumn}>
                    <PremiumButton
                        title={t('install_btn')}
                        onPress={handleInstall}
                        scaleDown={0.95}
                        // Compact styling
                        style={{
                            backgroundColor: '#d4af37',
                            // height: 24, // REMOVED fixed height to fix centering
                            minHeight: 0,
                            borderRadius: 6,
                            minWidth: undefined,
                            borderWidth: 0,
                        }}
                        contentContainerStyle={{
                            paddingVertical: 6, // Slightly more padding
                            paddingHorizontal: 12
                        }}
                        textStyle={{
                            color: '#050505',
                            fontFamily: 'Cinzel-Bold',
                            fontSize: 11, // legible size
                            lineHeight: 13,
                            letterSpacing: 0.5,
                            marginTop: 0
                        }}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        zIndex: 10000,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        maxWidth: 420, // Slightly narrower for cleaner look
        alignSelf: 'center'
    },
    closeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 20,
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
    },
    textColumn: {
        flex: 1,
        paddingRight: 16, // Ensure text doesn't touch buttons
        justifyContent: 'center'
    },
    actionColumn: {
        // No fixed width, let visual elements define it
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingTop: 8 // Push down slightly to avoid close button visual line if close is top-right
    },
    title: {
        color: '#d4af37',
        fontFamily: 'Cinzel-Bold',
        fontSize: 13,
        marginBottom: 3,
        letterSpacing: 0.5
    },
    msg: {
        color: '#ccc',
        fontFamily: 'Outfit',
        fontSize: 11,
        lineHeight: 15,
        opacity: 0.9
    }
});

export default PwaInstallPrompt;
