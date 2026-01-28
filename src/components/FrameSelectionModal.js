import React from 'react';
import { useWebDragScroll } from '../hooks/useWebDragScroll';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import PremiumPressable from './PremiumPressable';
import { useTheme, AVATAR_FRAMES } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { ref, update } from 'firebase/database';
import { db } from '../services/firebase';
import { LockIcon } from './Icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LocalAvatar from './LocalAvatar';
import AvatarWithFrame from './AvatarWithFrame';
import { useLanguage } from '../context/LanguageContext';

const FrameSelectionModal = ({ onBack, hideBackButton }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { user, equipFrame } = useAuth();
    const { roomCode, user: gameUser } = useGame(); // [FIX] Get game user identity
    const windowWidth = Dimensions.get('window').width;
    const { scrollRef, panHandlers } = useWebDragScroll(); // [FIX] Enable web drag scrolling

    // Auto-scroll logic
    React.useEffect(() => {
        const frames = Object.values(AVATAR_FRAMES);
        const selectedIndex = frames.findIndex(f => f.id === user?.activeFrame);

        if (selectedIndex !== -1 && scrollRef.current) {
            // Wait for layout to be stable
            setTimeout(() => {
                const row = Math.floor(selectedIndex / 3); // 3 items per row approx
                const itemHeight = 110; // Approx

                scrollRef.current.scrollTo({
                    y: row * itemHeight,
                    animated: true
                });
            }, 100);
        }
    }, [user?.activeFrame]);

    const handleEquip = async (frameId) => {
        // 1. Update User Profile (Local + DB)
        await equipFrame(frameId);

        // 2. Update Room Player Data (if in room)
        // Use gameUser.name to match the actual player key in the room (case-sensitive)
        if (roomCode && gameUser?.name) {
            const playerRef = ref(db, `stanze/${roomCode}/giocatori/${gameUser.name}`);
            await update(playerRef, { activeFrame: frameId });
        }
    };

    const itemWidth = '31%'; // 3 columns

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                ref={scrollRef}
                {...panHandlers}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 120,
                    paddingHorizontal: 4
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
                    {Object.values(AVATAR_FRAMES).map((frame, index) => {
                        const isSelected = (user?.activeFrame || 'basic') === frame.id;
                        const isUnlocked = frame.id === 'basic' || user?.unlockedFrames?.[frame.id] || parseFloat(frame.price) === 0;

                        return (
                            <Animated.View
                                key={frame.id}
                                entering={FadeInDown.delay(index * 50).springify()}
                                style={{ width: itemWidth }}
                            >
                                <PremiumPressable
                                    onPress={isUnlocked ? () => handleEquip(frame.id) : null}
                                    disabled={!isUnlocked}
                                    enableSound={isUnlocked}
                                    scaleDown={isUnlocked ? 0.95 : 1}
                                    style={[
                                        styles.frameCard,
                                        {
                                            paddingVertical: 15,
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            borderColor: isSelected ? theme.colors.accent : (isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'),
                                            borderWidth: isSelected ? 2 : 1,
                                            opacity: isUnlocked ? 1 : 0.5
                                        }
                                    ]}
                                    contentContainerStyle={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                    }}
                                >
                                    {/* Frame Preview using standardized component */}
                                    <AvatarWithFrame
                                        avatar={user?.avatar || 'user'}
                                        frameId={frame.id}
                                        size={60}
                                        style={{ marginBottom: 10 }}
                                    />

                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.frameLabel,
                                            { color: isSelected ? theme.colors.accent : '#a1a1aa' }
                                        ]}
                                    >
                                        {t('frame_' + frame.id, frame.label)}
                                    </Text>

                                    {!isUnlocked && (
                                        <View style={{ position: 'absolute', top: 5, right: 5 }}>
                                            <LockIcon size={12} color="#666" />
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
                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                </PremiumPressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    frameCard: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    frameLabel: {
        fontSize: 11,
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

export default FrameSelectionModal;
