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
import { LockIcon, CrownIcon, ThornsIcon, HaloIcon, HornsIcon, HeartIcon, MoneyIcon } from './Icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LocalAvatar from './LocalAvatar';

const FrameSelectionModal = ({ onBack, hideBackButton }) => {
    const { theme } = useTheme();
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
                    paddingBottom: 20,
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
                                            backgroundColor: '#18181b',
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
                                    {/* Frame Preview */}
                                    <View style={{
                                        width: 60, height: 60, borderRadius: 30,
                                        marginBottom: 10,
                                        justifyContent: 'center', alignItems: 'center',
                                        backgroundColor: '#111',
                                        position: 'relative'
                                    }}>
                                        {/* [NEW] Frames - Back Layer (Glows & Effects) */}
                                        {/* NEON GLOW [ANDROID] */}
                                        {frame.id === 'neon' && Platform.OS === 'android' && (
                                            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                                                <Svg height="150%" width="150%" viewBox="0 0 100 100">
                                                    <Defs>
                                                        <RadialGradient id="neon_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                                            <Stop offset="0.55" stopColor="#06b6d4" stopOpacity="0" />
                                                            <Stop offset="0.7" stopColor="#06b6d4" stopOpacity="0.4" />
                                                            <Stop offset="0.85" stopColor="#06b6d4" stopOpacity="0" />
                                                        </RadialGradient>
                                                    </Defs>
                                                    <Circle cx="50" cy="50" r="50" fill="url(#neon_grad)" />
                                                </Svg>
                                            </View>
                                        )}
                                        {/* ANGEL GLOW [ANDROID] */}
                                        {frame.id === 'angel' && Platform.OS === 'android' && (
                                            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                                                <Svg height="150%" width="150%" viewBox="0 0 100 100">
                                                    <Defs>
                                                        <RadialGradient id="angel_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                                            <Stop offset="0.55" stopColor="#fbbf24" stopOpacity="0" />
                                                            <Stop offset="0.7" stopColor="#fbbf24" stopOpacity="0.4" />
                                                            <Stop offset="0.85" stopColor="#fbbf24" stopOpacity="0" />
                                                        </RadialGradient>
                                                    </Defs>
                                                    <Circle cx="50" cy="50" r="50" fill="url(#angel_grad)" />
                                                </Svg>
                                            </View>
                                        )}
                                        {/* DEMON GLOW [ANDROID] */}
                                        {frame.id === 'demon' && Platform.OS === 'android' && (
                                            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                                                <Svg height="150%" width="150%" viewBox="0 0 100 100">
                                                    <Defs>
                                                        <RadialGradient id="demon_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                                            <Stop offset="0.55" stopColor="#ef4444" stopOpacity="0" />
                                                            <Stop offset="0.7" stopColor="#ef4444" stopOpacity="0.4" />
                                                            <Stop offset="0.85" stopColor="#ef4444" stopOpacity="0" />
                                                        </RadialGradient>
                                                    </Defs>
                                                    <Circle cx="50" cy="50" r="50" fill="url(#demon_grad)" />
                                                </Svg>
                                            </View>
                                        )}
                                        {/* CAPO GLOW [ANDROID] */}
                                        {frame.id === 'capo' && Platform.OS === 'android' && (
                                            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                                                <Svg height="150%" width="150%" viewBox="0 0 100 100">
                                                    <Defs>
                                                        <RadialGradient id="capo_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                                            <Stop offset="0.55" stopColor="#ff00ff" stopOpacity="0" />
                                                            <Stop offset="0.7" stopColor="#ff00ff" stopOpacity="0.3" />
                                                            <Stop offset="0.85" stopColor="#ff00ff" stopOpacity="0" />
                                                        </RadialGradient>
                                                    </Defs>
                                                    <Circle cx="50" cy="50" r="50" fill="url(#capo_grad)" />
                                                </Svg>
                                            </View>
                                        )}

                                        <LocalAvatar seed={user?.username || 'user'} size={45} />

                                        {/* Visual Fallback for Frames */}
                                        {frame.id === 'glitch' && <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 3, borderColor: '#00ff00', borderStyle: 'dashed' }]} />}



                                        {/* [NEW] Frames */}
                                        {frame.id === 'neon' && <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 3, borderColor: '#06b6d4', shadowColor: '#06b6d4', shadowOpacity: 0.8, shadowRadius: 8, elevation: Platform.OS === 'android' ? 0 : 5 }]} />}
                                        {frame.id === 'angel' && (
                                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 3, borderColor: '#fff', shadowColor: '#fbbf24', shadowOpacity: 0.9, shadowRadius: 10, elevation: Platform.OS === 'android' ? 0 : 5 }]} />
                                                <View style={{ position: 'absolute', top: -16, width: '100%', alignItems: 'center' }}>
                                                    <HaloIcon size={30} color="#fbbf24" />
                                                </View>
                                            </View>
                                        )}
                                        {frame.id === 'demon' && (
                                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 4, borderColor: '#7f1d1d', shadowColor: '#ef4444', shadowOpacity: 0.6, shadowRadius: 6, elevation: Platform.OS === 'android' ? 0 : 5 }]} />
                                                <View style={{ position: 'absolute', top: -14, width: '100%', alignItems: 'center' }}>
                                                    <HornsIcon size={30} color="#ef4444" />
                                                </View>
                                            </View>
                                        )}
                                        {frame.id === 'pixel' && <View style={[StyleSheet.absoluteFill, { borderRadius: 4, borderWidth: 4, borderColor: '#ec4899', borderStyle: 'dotted' }]} />}
                                        {frame.id === 'love' && (
                                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 3, borderColor: '#f472b6' }]} />
                                                <View style={{ position: 'absolute', bottom: -10, width: '100%', alignItems: 'center' }}>
                                                    <HeartIcon size={24} color="#f472b6" />
                                                </View>
                                            </View>
                                        )}
                                        {frame.id === 'rich' && (
                                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 4, borderColor: '#10b981', borderStyle: 'solid' }]} />
                                                <View style={{ position: 'absolute', top: -14, width: '100%', alignItems: 'center' }}>
                                                    <MoneyIcon size={28} color="#10b981" />
                                                </View>
                                            </View>
                                        )}
                                        {frame.id === 'capo' && (

                                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                                {/* Glow Layer */}
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 6, borderColor: '#ff00ff', opacity: 0.5 }]} />
                                                {/* Main Gold Frame */}
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 3, borderColor: '#ffd700', shadowColor: '#ffd700', shadowOpacity: 0.8, shadowRadius: 10, elevation: Platform.OS === 'android' ? 0 : 5 }]} />
                                                {/* Inner Detail */}
                                                <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 1, borderColor: '#ff00ff', margin: 3 }]} />
                                                {/* Floating Crown */}
                                                <View style={{ position: 'absolute', top: -14, width: '100%', alignItems: 'center' }}>
                                                    <CrownIcon size={18} color="#ffd700" />
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.frameLabel,
                                            { color: isSelected ? theme.colors.accent : '#a1a1aa' }
                                        ]}
                                    >
                                        {frame.label}
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
                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Indietro</Text>
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
