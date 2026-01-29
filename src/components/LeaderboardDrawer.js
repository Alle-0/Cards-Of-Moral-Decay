import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, PanResponder, TouchableWithoutFeedback } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS, Easing, interpolate, Extrapolate, withRepeat, interpolateColor } from 'react-native-reanimated';
import { useTheme, AVATAR_FRAMES } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext'; // [NEW]
import EfficientBlurView from './EfficientBlurView'; // [NEW]
import { SvgUri } from 'react-native-svg';
import PremiumIconButton from './PremiumIconButton';
import { Image } from 'react-native';
import PremiumModal from './PremiumModal';
import PremiumButton from './PremiumButton';

import LocalAvatar from './LocalAvatar';
import { TrashIcon, CrownIcon, HaloIcon, HornsIcon, HeartIcon, MoneyIcon, ThornsIcon, CrossIcon } from './Icons';
import AvatarWithFrame from './AvatarWithFrame'; // [NEW] Standardized
import { RANK_COLORS } from '../context/AuthContext'; // [NEW]

const SCREEN_HEIGHT = Dimensions.get('screen').height + 120;

const getRankColor = (rank) => RANK_COLORS[rank] || '#888';

const LeaderboardDrawer = memo(({ visible, onClose, players = [], currentUserName, isCreator, onKick, status, playedPlayers = [] }) => {
    // ... (rest of component start)

    const { theme } = useTheme();
    const { t } = useLanguage();

    // Calculate content height - adjusted for tighter handle
    // 75 per player + 100 base (header) + 40 for handle area roughly
    const calculatedHeight = Math.max(players.length * 75 + 130, 200);
    const defaultHeight = Math.min(calculatedHeight, SCREEN_HEIGHT * 0.85);

    const height = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [isDragging, setIsDragging] = useState(false);

    const startHeight = useRef(0);
    const [playerToKick, setPlayerToKick] = useState(null); // Data
    const [showKickModal, setShowKickModal] = useState(false); // Visibility

    const ANIM_CONFIG = {
        duration: 250,
        easing: Easing.out(Easing.quad),
    };



    useEffect(() => {
        if (visible) {
            height.value = withTiming(defaultHeight, ANIM_CONFIG);
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            height.value = withTiming(0, { duration: 250 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible, defaultHeight]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                runOnJS(setIsDragging)(true);
                startHeight.current = height.value;
            },
            onPanResponderMove: (_, gestureState) => {
                let newH = startHeight.current + gestureState.dy;

                // Constraints
                if (newH > SCREEN_HEIGHT) newH = SCREEN_HEIGHT;
                if (newH < 0) newH = 0;
                height.value = newH;
            },
            onPanResponderRelease: (_, gestureState) => {
                runOnJS(setIsDragging)(false);

                if (gestureState.dy > 60) {
                    // Drag Down -> Fullscreen
                    height.value = withTiming(SCREEN_HEIGHT, ANIM_CONFIG);
                } else if (gestureState.dy < -40) {
                    // Drag Up -> Check close
                    if (height.value > defaultHeight + 50) {
                        // Back to default
                        height.value = withTiming(defaultHeight, ANIM_CONFIG);
                    } else {
                        // Close
                        onClose();
                    }
                } else {
                    // Snap to nearest
                    if (height.value > (SCREEN_HEIGHT + defaultHeight) / 2) {
                        height.value = withTiming(SCREEN_HEIGHT, ANIM_CONFIG);
                    } else {
                        height.value = withTiming(defaultHeight, ANIM_CONFIG);
                    }
                }
            },
        })
    ).current;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: height.value,
            opacity: opacity.value
        };
    });

    // Handle Opacity: Fade out when approaching full screen
    const handleStyle = useAnimatedStyle(() => {
        const op = interpolate(
            height.value,
            [SCREEN_HEIGHT - 220, SCREEN_HEIGHT - 120], // Adjusted for buffer
            [1, 0],
            Extrapolate.CLAMP
        );
        return { opacity: op };
    });

    // Removed unsafe height.value check. Content is hidden via opacity/pointerEvents in styles.

    return (
        <>
            {visible && (
                <>
                    <View style={styles.backdrop} pointerEvents="none">
                        <EfficientBlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                    </View>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                        android_disableSound={true}
                        android_ripple={null}
                    />
                </>
            )}


            <Animated.View style={[styles.drawer, animatedStyle]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.accent, fontFamily: 'Cinzel-Bold' }]}>
                        {t('leaderboard_title')}
                    </Text>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <CrossIcon size={20} color="#888" />
                    </Pressable>
                </View>

                {/* List Container */}
                <View style={styles.list}>
                    {players.map((player, index) => (
                        <View key={player.name} style={[styles.playerRow, { borderColor: player.name === currentUserName ? theme.colors.accent : 'rgba(255,255,255,0.1)' }]}>
                            {/* ... rank and avatar ... */}
                            <View style={styles.rankContainer}>
                                <Text style={[styles.rank, { color: index === 0 ? '#ffd700' : '#888' }]}>
                                    {index + 1}
                                </Text>
                            </View>

                            <AvatarItem
                                player={player}
                                theme={theme}
                                isThinking={status === 'WAITING_CARDS' && !playedPlayers.includes(player.name) && !player.isDominus}
                            />

                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                                <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                    {player.name}
                                </Text>
                                <Text style={{
                                    fontSize: 10,
                                    color: getRankColor(player.rank || 'Anima Candida'),
                                    fontFamily: 'Outfit',
                                    fontWeight: 'bold',
                                    marginTop: 0
                                }}>
                                    {player.rank ? t('rank_' + player.rank.toLowerCase().replace(/ /g, '_'), player.rank) : t('rank_anima_candida')}
                                </Text>
                            </View>
                            <Text style={[styles.score, { color: theme.colors.accent }]}>
                                {player.points || 0}
                            </Text>

                            {isCreator && (
                                player.name !== currentUserName ? (
                                    <PremiumIconButton
                                        icon={
                                            <TrashIcon size={18} color="#ff6b6b" />
                                        }
                                        size={32}
                                        onPress={() => {
                                            onKick && onKick(player);
                                        }}
                                        style={{ marginLeft: 10, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderColor: 'rgba(255, 107, 107, 0.3)', borderWidth: 1, borderRadius: 20 }}
                                    />
                                ) : (
                                    <View style={{ width: 32, height: 32, marginLeft: 10 }} />
                                )
                            )}
                        </View>
                    ))}
                </View>

                {/* Draggable Handle Area - Fades out at Fullscreen */}
                <Animated.View
                    style={[styles.handleContainer, handleStyle]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.handle} />
                </Animated.View>

            </Animated.View>
        </>
    );
});

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000, // Higher than GameScreen header (999)
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(20, 20, 25, 0.98)',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 50,
        zIndex: 1001, // Higher than backdrop and header
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
    },
    closeBtn: {
        padding: 5,
    },
    closeText: {
        color: '#888',
        fontSize: 20,
    },
    list: {
        flex: 1,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    rankContainer: {
        width: 25,
        alignItems: 'center',
        marginRight: 5
    },
    rank: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    avatarFrame: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#222',
        marginRight: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1
    },
    name: {
        flexShrink: 1,
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Outfit-Bold',
    },
    handleContainer: {
        width: '100%',
        paddingVertical: 15, // Reduced from Top 15 / Bottom 40 to symmetric 15 for better look
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    handle: {
        width: 40, // Slightly smaller width
        height: 4, // Slightly thinner
        backgroundColor: 'rgba(255,255,255,0.2)', // More subtle
        borderRadius: 2,
    },
});

// [NEW] Avatar Item Component to handle individual animations
const AvatarItem = memo(({ player, isThinking, theme }) => {
    // Shared value for the pulse ring (0 -> 1)
    const ringProgress = useSharedValue(0);

    // [NEW] Frame Logic
    const activeFrameId = player.activeFrame || 'basic';
    const frame = AVATAR_FRAMES[activeFrameId] || AVATAR_FRAMES.basic;

    useEffect(() => {
        if (isThinking) {
            ringProgress.value = withRepeat(
                withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
        } else {
            ringProgress.value = 0;
        }
    }, [isThinking]);

    const ringStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(ringProgress.value, [0, 0.7, 1], [0.6, 0.3, 0]),
            transform: [
                { scale: interpolate(ringProgress.value, [0, 1], [1, 1.5]) } // Expands to 1.5x
            ],
        };
    });

    return (
        <View style={{ position: 'relative', margin: 4, marginRight: 14 }}>
            {/* Pulse Ring (Behind) */}
            {isThinking && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: theme.colors.accent,
                            borderRadius: 20,
                            zIndex: -1,
                        },
                        ringStyle
                    ]}
                />
            )}

            {/* Avatar Frame Container */}
            <View style={{ margin: 0, marginRight: 0 }}>
                <AvatarWithFrame
                    avatar={player.avatar && player.avatar.startsWith('http') ? player.avatar : (player.avatar || 'User')}
                    frameId={activeFrameId}
                    size={36}
                    isDominus={false} // Crown handled externally in LeaderboardDrawer
                />
            </View>

            {/* Crown (Top Right - DOMINUS) */}
            {player.isDominus && (
                <View style={{
                    position: 'absolute',
                    top: -10, right: -6,
                    backgroundColor: '#18181b', borderRadius: 12,
                    padding: 4, borderWidth: 1, borderColor: '#ffd700',
                    zIndex: 20
                }}>
                    <CrownIcon size={14} color="#ffd700" />
                </View>
            )}
        </View>
    );
});

export default LeaderboardDrawer;
