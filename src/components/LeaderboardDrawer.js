import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, PanResponder, TouchableWithoutFeedback, ScrollView, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS, Easing, interpolate, Extrapolate, withRepeat, interpolateColor } from 'react-native-reanimated';
import { useTheme, AVATAR_FRAMES } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext'; // [NEW]
import EfficientBlurView from './EfficientBlurView'; // [NEW]
import PremiumIconButton from './PremiumIconButton';
import { Image } from 'react-native';
import PremiumModal from './PremiumModal';
import PremiumButton from './PremiumButton';
import ConfirmationModal from './ConfirmationModal';

import LocalAvatar from './LocalAvatar';
import { TrashIcon, CrownIcon, HaloIcon, HornsIcon, HeartIcon, MoneyIcon, ThornsIcon, CrossIcon, ReportIcon } from './Icons';
import AvatarWithFrame from './AvatarWithFrame'; // [NEW] Standardized
import { useAuth, RANK_COLORS } from '../context/AuthContext'; // [FIX] Added useAuth

const SCREEN_HEIGHT = Dimensions.get('screen').height + 120;

const getRankColor = (rank) => RANK_COLORS[rank] || '#888';

const LeaderboardDrawer = memo(({ visible, onClose, players = [], currentUserName, isCreator, onKick, status, playedPlayers = [], isDesktop }) => {
    const { reportPlayer } = useAuth();
    // ... (rest of component start)

    const { theme } = useTheme();
    const { t } = useLanguage();

    // Calculate content height - adjusted for tighter handle
    // 75 per player + 100 base (header) + 40 for handle area roughly
    const calculatedHeight = Math.max(players.length * 75 + 130, 200);
    const defaultHeight = Math.min(calculatedHeight, SCREEN_HEIGHT * 0.85);

    const height = useSharedValue(0);
    const offsetX = useSharedValue(400); // Start off-screen right
    const opacity = useSharedValue(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false); // [NEW] Track animation state

    const startHeight = useRef(0);
    const [playerToKick, setPlayerToKick] = useState(null); // Data
    const [showKickModal, setShowKickModal] = useState(false); // Visibility

    const [playerToReport, setPlayerToReport] = useState(null);
    const [reportedPlayerName, setReportedPlayerName] = useState(''); // [FIX] Stable name for modal
    const [showReportModal, setShowReportModal] = useState(false);

    const ANIM_CONFIG = {
        duration: 250,
        easing: Easing.out(Easing.quad),
    };

    useEffect(() => {
        if (visible) {
            setIsAnimating(true);
            if (isDesktop) {
                offsetX.value = withTiming(0, ANIM_CONFIG, (finished) => {
                    if (finished) runOnJS(setIsAnimating)(false);
                });
            } else {
                height.value = withTiming(defaultHeight, ANIM_CONFIG, (finished) => {
                    if (finished) runOnJS(setIsAnimating)(false);
                });
            }
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            setIsAnimating(true);
            if (isDesktop) {
                offsetX.value = withTiming(400, { duration: 250 }, (finished) => {
                    if (finished) runOnJS(setIsAnimating)(false);
                });
            } else {
                height.value = withTiming(0, { duration: 250 }, (finished) => {
                    if (finished) runOnJS(setIsAnimating)(false);
                });
            }
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible, defaultHeight, isDesktop]);

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
        if (isDesktop) {
            return {
                transform: [{ translateX: offsetX.value }],
                opacity: opacity.value,
                height: '100%',
            };
        }
        return {
            height: height.value,
            opacity: opacity.value
        };
    });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Handle Opacity: Fade out when approaching full screen
    const handleStyle = useAnimatedStyle(() => {
        if (isDesktop) return { opacity: 0 };
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
                    <Animated.View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]} pointerEvents="none">
                        {(!isAnimating || Platform.OS === 'ios') && (
                            <EfficientBlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                        )}
                    </Animated.View>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                        android_disableSound={true}
                        android_ripple={null}
                    />
                </>
            )}


            <Animated.View
                style={[styles.drawer, isDesktop && styles.desktopDrawer, animatedStyle]}
                pointerEvents={visible ? 'auto' : 'none'}
                renderToHardwareTextureAndroid={true} // [NEW] Smooth optimization
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.accent, fontFamily: 'Cinzel-Bold' }]}>
                        {t('leaderboard_title')}
                    </Text>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <CrossIcon size={20} color="#888" />
                    </Pressable>
                </View>

                {/* List Container */}
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.list}>
                            {players.map((player, index) => (
                                <View key={player.name} style={[styles.playerRow, { borderColor: (player.name || '').trim().toLowerCase() === (currentUserName || '').trim().toLowerCase() ? theme.colors.accent : 'rgba(255,255,255,0.1)' }]}>
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
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                                {player.name}
                                            </Text>
                                        </View>
                                        <Text style={{
                                            fontSize: 10,
                                            color: getRankColor(player.rank || 'Anima Candida'),
                                            fontFamily: 'Outfit',
                                            fontWeight: 'bold',
                                            marginTop: 0
                                        }}>
                                            {(() => {
                                                const r = player.rank || 'Anima Candida';
                                                // If already a key (starts with rank_), use it. Else format it.
                                                const key = r.startsWith('rank_') ? r : 'rank_' + r.toLowerCase().replace(/ /g, '_');
                                                return t(key, { defaultValue: r });
                                            })()}
                                        </Text>
                                    </View>
                                    <View style={{ width: 45, alignItems: 'flex-end', marginRight: 10 }}>
                                        <Text style={[styles.score, { color: theme.colors.accent }]}>
                                            {player.points || 0}
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', width: isCreator ? 84 : 42, justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {isCreator && (
                                            (player.name || '').trim().toLowerCase() !== (currentUserName || '').trim().toLowerCase() && player.name !== 'Rando' ? (
                                                <PremiumIconButton
                                                    icon={<TrashIcon size={18} color="#ff6b6b" />}
                                                    size={32}
                                                    onPress={() => onKick && onKick(player)}
                                                    style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', borderColor: 'rgba(255, 107, 107, 0.3)', borderWidth: 1, borderRadius: 20 }}
                                                    hoverColor="rgba(255, 107, 107, 0.25)"
                                                />
                                            ) : (
                                                <View style={{ width: 32 }} />
                                            )
                                        )}

                                        {(player.name || '').trim().toLowerCase() !== (currentUserName || '').trim().toLowerCase() && player.name !== 'Rando' && (
                                            <PremiumIconButton
                                                icon={<ReportIcon size={18} color="#ef4444" />}
                                                size={32}
                                                onPress={() => {
                                                    setPlayerToReport(player);
                                                    setReportedPlayerName(player.name); // [FIX]
                                                    setShowReportModal(true);
                                                }}
                                                style={{ marginLeft: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderRadius: 20 }}
                                                hoverColor="rgba(239, 68, 68, 0.2)"
                                            />
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Draggable Handle Area - Fades out at Fullscreen */}
                {!isDesktop && (
                    <Animated.View
                        style={[styles.handleContainer, handleStyle]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.handle} />
                    </Animated.View>
                )}

                {/* Report Confirmation Modal */}
                <ConfirmationModal
                    visible={showReportModal}
                    title={t('report_player_title', { defaultValue: 'SEGNALA GIOCATORE' })}
                    message={t('report_player_msg', { name: reportedPlayerName })}
                    confirmText={t('report_btn', { defaultValue: 'SEGNALA' })}
                    onConfirm={async () => {
                        if (playerToReport) {
                            try {
                                await reportPlayer(playerToReport.name);
                            } catch (e) {
                                console.error("[REPORT] Failed:", e);
                            }
                            setShowReportModal(false);
                            // We don't clear playerToReport here immediately to avoid "undefined" 
                            // flashes if the modal takes time to unmount.
                            // The onClose or a timeout can handle it.
                        }
                    }}
                    onClose={() => {
                        setShowReportModal(false);
                        setPlayerToReport(null);
                    }}
                />

            </Animated.View>
        </>
    );
});

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 3000, // Higher than GameScreen header (2000)
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(20, 20, 25, 0.95)',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 50,
        zIndex: 3100, // Higher than backdrop and header
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: Platform.OS === 'android' ? 4 : 20, // [PERF] Lower elevation on Android
        overflow: 'hidden',
    },
    desktopDrawer: {
        bottom: 0,
        left: 'auto',
        width: 350,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 24,
        borderTopLeftRadius: 24,
        paddingTop: 30,
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
                withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
                -1,
                false
            );
        } else {
            ringProgress.value = 0;
        }
    }, [isThinking]);

    const ringStyle = useAnimatedStyle(() => {
        // The thickness of the pulse ring grows from 0 to 6
        const thickness = interpolate(ringProgress.value, [0, 1], [0, 8]);
        const opacity = interpolate(ringProgress.value, [0, 0.7, 1], [0.6, 0.3, 0]);
        // To keep the hole exactly at the avatar's border, 
        // we pull the container outward by the same amount as the border thickness
        const offset = -thickness;
        // Base avatar size is 36, so base radius is 18.
        const radius = 18 + thickness;

        return {
            opacity,
            top: offset,
            bottom: offset,
            left: offset,
            right: offset,
            borderWidth: thickness,
            borderRadius: radius,
        };
    });

    return (
        <View style={{ position: 'relative', margin: 4, marginRight: 14 }}>
            {/* Pulse Ring (Behind) */}
            {isThinking && (
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            backgroundColor: 'transparent',
                            borderColor: theme.colors.accent,
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

            {/* Online/Offline Badge (Bottom Right) */}
            <View style={{
                position: 'absolute',
                bottom: -2, right: -2,
                width: 12, height: 12,
                borderRadius: 6,
                backgroundColor: (player.isOnline || player.name === 'Rando') ? '#4ade80' : '#666',
                borderWidth: 2,
                borderColor: '#18181b',
                zIndex: 20
            }} />
        </View>
    );
});

export default LeaderboardDrawer;
