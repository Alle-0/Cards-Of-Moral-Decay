import React from 'react';
import { useWebDragScroll } from '../hooks/useWebDragScroll';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Pressable } from 'react-native';
import PremiumPressable from './PremiumPressable';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LockIcon } from './Icons';
import { LinearGradient } from 'expo-linear-gradient';

import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';

const ThemeSelectionModal = ({ onBack, hideBackButton }) => {
    const { theme, themes, setTheme } = useTheme();
    const { t } = useLanguage();
    const { user } = useAuth();
    const windowWidth = Dimensions.get('window').width;

    // Calculate item width for 3 columns with gap
    // Window - padding (24*2) - gap (10*2) / 3
    // Window - padding (24*2) - gap (10*2) / 3
    const containerPadding = 0;
    const gap = 8;
    const availableWidth = Math.min(windowWidth * 0.85, 340) - 48; // Total width inside modal padding
    const itemWidth = Math.floor((availableWidth - (gap * 2)) / 3) - 2; // -2px checks out against rounding errors

    const { scrollRef, panHandlers } = useWebDragScroll(); // [FIX] Enable web drag scrolling

    React.useEffect(() => {
        const themeList = Object.values(themes);
        const index = themeList.findIndex(t => t.id === theme.id);
        if (index !== -1 && scrollRef.current) {
            const row = Math.floor(index / 3);
            const rowHeight = (itemWidth * 1.2) + (gap + 4);
            // Scroll to the row, maybe center it? For now top of row is fine.
            // Timeout ensures layout is ready
            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: row * rowHeight, animated: true });
            }, 100);
        }
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                ref={scrollRef}
                {...panHandlers}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1, // Window frame
                    paddingBottom: 120,
                    paddingHorizontal: 5,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        rowGap: gap + 4,
                        minHeight: '100%', // Ensure it fills the scrollview
                        cursor: 'default' // Avoid pointer cursor on background
                    }}
                >
                    {Object.values(themes).map((themeItem, index) => {
                        const isSelected = theme.id === themeItem.id;
                        // Default is always unlocked, others check user profile
                        const isUnlocked = themeItem.id === 'default' || user?.unlockedThemes?.[themeItem.id];

                        return (
                            <Animated.View
                                key={themeItem.id}
                                entering={FadeInDown.delay(index * 50).springify()}
                                style={{ width: '31%' }}
                            >
                                <PremiumPressable
                                    onPress={isUnlocked ? () => setTheme(themeItem.id) : null}
                                    disabled={!isUnlocked}
                                    enableSound={isUnlocked}
                                    scaleDown={isUnlocked ? 0.95 : 1}
                                    style={[
                                        styles.themeCard,
                                        {
                                            height: (windowWidth - 40) / 3 * 1.2,
                                            backgroundColor: isSelected ? (themeItem.colors.accentWeak || themeItem.colors.accent) : 'rgba(255,255,255,0.03)',
                                            borderColor: isSelected ? themeItem.colors.accent : 'rgba(255, 255, 255, 0.08)',
                                            borderWidth: 1,
                                            opacity: isUnlocked ? 1 : 0.6,
                                        }
                                    ]}
                                    contentContainerStyle={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        gap: 6,
                                        width: '100%',
                                        ...(Platform.OS === 'web' ? { flex: 1 } : {})
                                    }}
                                >
                                    <View style={[styles.previewCircle, { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#000' }]}>
                                        <LinearGradient
                                            colors={themeItem.colors.background}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={{
                                            position: 'absolute', bottom: 6, right: 6,
                                            width: 14, height: 14, borderRadius: 7,
                                            backgroundColor: themeItem.colors.accent,
                                            borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)',
                                        }} />
                                    </View>
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.themeLabel,
                                            { color: isSelected ? themeItem.colors.accent : '#a1a1aa' }
                                        ]}
                                    >
                                        {t('theme_' + themeItem.id, themeItem.label)}
                                    </Text>
                                    {!isUnlocked && (
                                        <View style={{ position: 'absolute', top: 5, right: 5 }}>
                                            <LockIcon size={14} color="#666" />
                                        </View>
                                    )}
                                </PremiumPressable>
                            </Animated.View>
                        );
                    })}
                </Pressable>
            </ScrollView>

            {
                !hideBackButton && (
                    <PremiumPressable
                        onPress={onBack}
                        enableSound={false}
                        style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                        rippleColor="rgba(255, 255, 255, 0.2)"
                        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                    >
                        <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                    </PremiumPressable>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    themeCard: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: '#000',
    },
    accentDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        position: 'absolute',
        bottom: 6,
        right: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.3)',
    },
    themeLabel: {
        fontSize: 10,
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    backButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    backButtonText: {
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        fontSize: 15,
    }
});

export default ThemeSelectionModal;
