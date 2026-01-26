import React from 'react';
import { useWebDragScroll } from '../hooks/useWebDragScroll';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Pressable, Image } from 'react-native';
import PremiumPressable from './PremiumPressable';
import { useTheme, CARD_SKINS, TEXTURES } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext'; // [NEW]
import { ref, update } from 'firebase/database'; // [NEW]
import { db } from '../services/firebase'; // [NEW]
import { LockIcon } from './Icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const SkinSelectionModal = ({ onBack, hideBackButton }) => {
    const { theme } = useTheme();
    const { user, equipSkin } = useAuth();
    const { roomCode } = useGame(); // [NEW]
    const windowWidth = Dimensions.get('window').width;
    const { scrollRef, panHandlers } = useWebDragScroll(); // [FIX] Enable web drag scrolling

    const initialScrollDone = React.useRef(false);

    // [Refined] Auto-scroll logic - Only once!
    React.useEffect(() => {
        if (initialScrollDone.current || !user?.activeCardSkin) return;

        const skins = Object.values(CARD_SKINS);
        const selectedIndex = skins.findIndex(s => s.id === user?.activeCardSkin);

        if (selectedIndex !== -1 && scrollRef.current) {
            initialScrollDone.current = true; // Mark as done
            // Wait for layout to be stable
            setTimeout(() => {
                const row = Math.floor(selectedIndex / 3); // [FIX] 3 columns

                // More precise calculation based on styles
                const numericItemWidth = (windowWidth - 32) / 3;
                const gridItemHeight = numericItemWidth * 1.25 + 12; // Height + RowGap

                // [FIX] Scroll behavior - Simplified
                // Scroll to the row, leaving a bit of headroom (20px)
                const targetY = row > 0 ? (row * gridItemHeight) - 20 : 0;

                scrollRef.current.scrollTo({
                    y: targetY,
                    animated: true
                });
            }, 100);
        }
    }, [user?.activeCardSkin]);

    const handleEquip = async (skinId) => {
        // 1. Update User Profile (Local + DB Persistence only)
        await equipSkin(skinId);
        // [FIX] Removed Room Sync - Skins are effectively personal now.
    };

    // [FIX] Switch to 3 columns to match Frame/Theme selection size
    // Window - padding (roughly 20-40) / 3
    const numericItemWidth = (windowWidth - 32) / 3;

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                ref={scrollRef} // [NEW] Attach ref
                {...panHandlers} // [FIX] helper for web drag
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 100,
                    paddingHorizontal: 4,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        rowGap: 12,
                        minHeight: '100%'
                    }}
                >
                    {/* ... mapped items ... */}
                    {Object.values(CARD_SKINS).map((skin, index) => {
                        const isSelected = user?.activeCardSkin === skin.id;
                        const isUnlocked = user?.unlockedSkins?.[skin.id];

                        return (
                            <Animated.View
                                key={skin.id}
                                entering={FadeInDown.delay(index * 50).springify()}
                                style={{ width: '31%' }}
                            >
                                <PremiumPressable
                                    onPress={isUnlocked ? () => handleEquip(skin.id) : null}
                                    disabled={!isUnlocked}
                                    enableSound={isUnlocked}
                                    scaleDown={isUnlocked ? 0.95 : 1}
                                    style={[
                                        styles.skinCard,
                                        {
                                            height: numericItemWidth * 1.25, // Fixed Numeric Height (Aspect Ratio 1.25)
                                            backgroundColor: '#18181b',
                                            borderColor: isSelected ? theme.colors.accent : (isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'),
                                            borderWidth: isSelected ? 2 : 1,
                                            opacity: isUnlocked ? 1 : 0.5
                                        }
                                    ]}
                                    contentContainerStyle={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        width: '100%',
                                        padding: 8
                                    }}
                                >
                                    {/* Skin Preview */}
                                    <View style={[styles.previewContainer, {
                                        backgroundColor: skin.styles.bg,
                                        borderColor: skin.styles.border,
                                        borderWidth: 1,
                                        overflow: 'hidden'
                                    }]}>
                                        {/* Texture Preview */}
                                        {skin.styles.texture && TEXTURES[skin.styles.texture] && (
                                            <Image
                                                source={TEXTURES[skin.styles.texture]}
                                                style={[StyleSheet.absoluteFill, { opacity: skin.styles.textureOpacity || 0.15 }]}
                                                resizeMode="cover"
                                            />
                                        )}
                                        {/* Simulated Text Lines */}
                                        <View style={{ width: '70%', height: 4, borderRadius: 2, backgroundColor: skin.styles.text, opacity: 0.4, marginBottom: 4 }} />
                                        <View style={{ width: '50%', height: 4, borderRadius: 2, backgroundColor: skin.styles.text, opacity: 0.4 }} />
                                    </View>

                                    <Text
                                        numberOfLines={2}
                                        adjustsFontSizeToFit={true}
                                        minimumFontScale={0.85}
                                        style={[
                                            styles.skinLabel,
                                            { color: isSelected ? theme.colors.accent : '#a1a1aa' }
                                        ]}
                                    >
                                        {skin.label}
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
    skinCard: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewContainer: {
        width: 40,
        height: 56,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2
    },
    skinLabel: {
        fontSize: 11.5,
        letterSpacing: -0.5,
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        textAlign: 'center',
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

export default SkinSelectionModal;
