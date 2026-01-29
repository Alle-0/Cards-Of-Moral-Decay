import React from 'react';
import { useWebDragScroll } from '../hooks/useWebDragScroll';
import { StyleSheet, View, Text, ScrollView, FlatList, Dimensions, Platform, Pressable } from 'react-native';
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

    const [isSettingTheme, setIsSettingTheme] = React.useState(false);

    const handleSetTheme = async (themeId) => {
        if (isSettingTheme) return;
        setIsSettingTheme(true);
        // Optimistic update prevention or just UI blocking
        await setTheme(themeId);
        // Small delay to prevent rapid-fire changes causing glitches
        setTimeout(() => {
            setIsSettingTheme(false);
        }, 500);
    };

    React.useEffect(() => {
        const themeList = Object.values(themes);
        const index = themeList.findIndex(t => t.id === theme.id);
        if (index !== -1 && scrollRef.current) {
            const row = Math.floor(index / 3);
            const rowHeight = (itemWidth * 1.2) + (gap + 4);
            setTimeout(() => {
                scrollRef.current?.scrollToOffset({ offset: row * rowHeight, animated: true });
            }, 100);
        }
    }, []);

    const renderItem = React.useCallback(({ item: themeItem, index }) => {
        const isSelected = theme.id === themeItem.id;
        const isUnlocked = themeItem.id === 'default' || user?.unlockedThemes?.[themeItem.id];

        // Calc animation delay based on index
        const delay = (index % 6) * 50;

        return (
            <Animated.View
                entering={FadeInDown.delay(delay).springify()}
                style={{
                    width: '31%',
                    marginBottom: gap + 4
                }}
            >
                <PremiumPressable
                    onPress={isUnlocked ? () => handleSetTheme(themeItem.id) : null}
                    disabled={!isUnlocked || isSettingTheme}
                    enableSound={isUnlocked}
                    scaleDown={isUnlocked ? 0.95 : 1}
                    style={[
                        styles.themeCard,
                        {
                            height: (itemWidth * 1.2), // Fixed height based on width
                            backgroundColor: isSelected ? (themeItem.colors.accentWeak || themeItem.colors.accent) : 'rgba(255,255,255,0.03)',
                            borderColor: isSelected ? themeItem.colors.accent : 'rgba(255, 255, 255, 0.08)',
                            borderWidth: 1,
                            opacity: isUnlocked ? (isSettingTheme && !isSelected ? 0.5 : 1) : 0.6,
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
    }, [theme, user, isSettingTheme, itemWidth, gap, t]);

    const themeList = React.useMemo(() => Object.values(themes), [themes]);

    return (
        <View style={{ flex: 1 }}>
            <Animated.FlatList
                ref={scrollRef}
                data={themeList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={3}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 120,
                    paddingHorizontal: 5,
                    paddingTop: 10
                }}
                showsVerticalScrollIndicator={false}
                {...panHandlers}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
                removeClippedSubviews={Platform.OS !== 'web'} // Optimizes memory on mobile
            />

            {!hideBackButton && (
                <PremiumPressable
                    onPress={onBack}
                    enableSound={false}
                    style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                    rippleColor="rgba(255, 255, 255, 0.2)"
                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                >
                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                </PremiumPressable>
            )}
        </View>
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
