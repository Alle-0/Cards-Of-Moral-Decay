import React from 'react';
import { useWebDragScroll } from '../hooks/useWebDragScroll';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Pressable } from 'react-native';
import PremiumPressable from './PremiumPressable';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LockIcon } from './Icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ThemeSelectionModal = ({ onBack, hideBackButton }) => {
    const { theme, themes, setTheme } = useTheme();
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
                    paddingBottom: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        columnGap: gap,
                        rowGap: gap + 4,
                        justifyContent: 'flex-start',
                        minHeight: '100%', // Ensure it fills the scrollview
                        cursor: 'default' // Avoid pointer cursor on background
                    }}
                >
                    {Object.values(themes).map((t, index) => {
                        const isSelected = theme.id === t.id;
                        // Default is always unlocked, others check user profile
                        const isUnlocked = t.id === 'default' || user?.unlockedThemes?.[t.id];

                        return (
                            <Animated.View
                                key={t.id}
                                entering={FadeInDown.delay(index * 50).springify()}
                            >
                                <PremiumPressable
                                    onPress={isUnlocked ? () => setTheme(t.id) : null}
                                    disabled={!isUnlocked}
                                    enableSound={isUnlocked}
                                    scaleDown={isUnlocked ? 0.95 : 1}
                                    style={[
                                        styles.themeCard,
                                        {
                                            width: itemWidth,
                                            height: itemWidth * 1.2,
                                            backgroundColor: '#18181b', // Dark container
                                            borderColor: isSelected ? t.colors.accent : (isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'),
                                            borderWidth: isSelected ? 2 : 1,
                                            opacity: isUnlocked ? 1 : 0.5
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
                                    <View style={[
                                        styles.colorCircle,
                                        {
                                            backgroundColor: t.colors.accent,
                                            shadowColor: t.colors.accent,
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }
                                    ]}>
                                        <Text style={{
                                            fontSize: 18,
                                            textAlign: 'center',
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            lineHeight: 22,
                                            height: 22
                                        }}>{t.colors.particleEmoji}</Text>
                                    </View>
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.themeLabel,
                                            { color: isSelected ? t.colors.accent : '#a1a1aa' }
                                        ]}
                                    >
                                        {t.label}
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

            {!hideBackButton && (
                <PremiumPressable
                    onPress={onBack}
                    enableSound={false}
                    style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                    rippleColor="rgba(255, 255, 255, 0.2)"
                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                >
                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Indietro</Text>
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
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3,
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
