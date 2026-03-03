import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, BackHandler, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import Animated, { FadeIn, ZoomIn, SlideInDown, FadeInDown, SlideInUp, LinearTransition, FadeOut, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import EfficientBlurView from '../components/EfficientBlurView';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RANK_COLORS } from '../constants/Ranks';
import { useGame } from '../context/GameContext';
import PremiumButton from '../components/PremiumButton';
import ConfettiSystem from '../components/ConfettiSystem';
import SoundService from '../services/SoundService';
import ElegantSplashScreen from '../components/ElegantSplashScreen';
import LocalAvatar from '../components/LocalAvatar';
import AvatarWithFrame from '../components/AvatarWithFrame';
import RewardPopup from '../components/RewardPopup';
import { useLanguage } from '../context/LanguageContext';

import HapticsService from '../services/HapticsService'; // [REF]
import { TrashIcon } from '../components/Icons';
import AnalyticsService from '../services/AnalyticsService';

const VictoryScreen = ({ winnerName, onExit }) => {
    const { user, awardMoney } = useAuth();
    const { roomData, isCreator, startGame, leaveRoom } = useGame();
    const { t } = useLanguage();
    const { theme } = useTheme();

    const [exiting, setExiting] = useState(false);
    const [showRankUp, setShowRankUp] = useState(false);
    const [initialRank, setInitialRank] = useState(user?.rank);
    const [rewardAmount, setRewardAmount] = useState(0);
    const [showReward, setShowReward] = useState(false);
    const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false);
    const expandProgress = useSharedValue(0);

    useEffect(() => {
        expandProgress.value = withTiming(isLeaderboardExpanded ? 1 : 0, {
            duration: 550,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [isLeaderboardExpanded]);

    const expandedStyle = useAnimatedStyle(() => ({
        maxHeight: expandProgress.value * 600,
        opacity: expandProgress.value,
        overflow: 'hidden',
    }));
    const confettiRef = useRef(null);

    const isWinnerRando = winnerName === 'Rando';
    const winner = isWinnerRando ? { avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Rando' } : roomData?.giocatori?.[winnerName];

    // Calculate loser BEFORE useEffect to avoid ReferenceError
    const allScoresRaw = { ...(roomData?.punti || {}) };
    if (roomData?.randoPoints !== undefined || winnerName === 'Rando') {
        allScoresRaw['Rando'] = roomData?.randoPoints || 0;
    }

    const allSortedGlobal = Object.entries(allScoresRaw)
        .filter(([name]) => name === 'Rando' || roomData?.giocatori?.[name])
        .sort(([, a], [, b]) => b - a); // Descending (Standard Leaderboard)

    const potentialLosers = [...allSortedGlobal].reverse().filter(([name]) => name !== winnerName);

    // [NEW] Better Tie-Handling: award ALL players with the minimum score
    const minScore = potentialLosers.length > 0 ? potentialLosers[0][1] : 0;
    const tiedLosers = potentialLosers.filter(([_, score]) => score === minScore);
    const isPlayerAmongLosers = tiedLosers.some(([name]) => name === user?.username);

    // Use the first one for representative UI display
    const loser = tiedLosers.length > 0 ? tiedLosers[0] : null;
    const loserName = loser?.[0];
    const isLoserRando = loserName === 'Rando';
    const loserData = isLoserRando
        ? { avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Rando' }
        : roomData?.giocatori?.[loserName];

    useEffect(() => {
        SoundService.play('success');
        if (confettiRef.current) {
            confettiRef.current.explode();
        }

        const timer1 = setTimeout(() => {
            HapticsService.trigger('heavy');
        }, 500);

        const timerShame = setTimeout(() => {
            if (isPlayerAmongLosers) {
                SoundService.play('pop'); // Extra punch for the shame award
                HapticsService.trigger('warning');
            }
        }, 2200);

        // [LEGACY] Track winner event
        AnalyticsService.logGameWin(winnerName, isWinnerRando ? (roomData?.randoPoints || 0) : (roomData?.punti?.[winnerName] || 0));
        const myUsername = user?.username || user?.name;

        const currentOpponents = Object.keys(roomData?.giocatori || {}).filter(name => name !== myUsername);

        if (winnerName === myUsername) {
            awardMoney(150, currentOpponents).then(res => {
                if (res?.success) {
                    setRewardAmount(res.awarded);
                    setTimeout(() => setShowReward(true), 800);
                }
            });
            return () => {
                clearTimeout(timer1);
                clearTimeout(timerShame);
            };
        } else if (isPlayerAmongLosers) {
            awardMoney(100, currentOpponents).then(res => {
                if (res?.success) {
                    setRewardAmount(res.awarded);
                    setTimeout(() => setShowReward(true), 2300);
                }
            });
            return () => {
                clearTimeout(timer1);
                clearTimeout(timerShame);
            };
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timerShame);
        };
    }, [winnerName, isPlayerAmongLosers, user?.name]);


    useEffect(() => {
        if (initialRank && user?.rank && user.rank !== initialRank && user.username.toLowerCase() !== 'alle') {
            setShowRankUp(true);
            SoundService.play('success');
            HapticsService.trigger('success');
        }
    }, [user?.rank, initialRank]);

    const handleRankUpClose = () => {
        setShowRankUp(false);
    };

    const handleRestart = () => {
        if (isCreator) {
            startGame(roomData.puntiPerVincere || 7);
        }
    };

    const handleExit = () => {
        setExiting(true);
    };

    if (exiting) {
        return <ElegantSplashScreen fastMode={true} onFinish={leaveRoom} />;
    }

    return (
        <View style={styles.container}>
            <ConfettiSystem ref={confettiRef} />

            <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    entering={FadeInDown.delay(200).springify().damping(20).stiffness(90)}
                    style={[
                        styles.content,
                        {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Fallback
                            borderRadius: 35,
                            overflow: 'hidden',
                            marginTop: 30,
                            marginBottom: 20,
                            marginHorizontal: 15, // [NEW] Added horizontal margin
                            paddingTop: 10, // Add top padding for the gradient space
                            paddingBottom: 0,
                            paddingHorizontal: 0,
                        }
                    ]}
                >
                    <LinearGradient
                        colors={[theme.colors.accent?.startsWith('#') ? `${theme.colors.accent}20` : theme.colors.accent, 'rgba(255, 255, 255, 0.02)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.5 }}
                    />
                    <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: theme.colors.accent?.startsWith('#') ? `${theme.colors.accent}30` : theme.colors.accent, borderRadius: 35 }]} />

                    <View style={{ width: '100%', paddingVertical: 35, paddingHorizontal: 20, alignItems: 'center' }}>
                        <Animated.Text
                            entering={SlideInDown.springify().damping(15)}
                            style={[styles.title, {
                                color: theme.colors.accent,
                                textShadowColor: 'rgba(212, 175, 55, 0.8)',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 20,
                                letterSpacing: 2
                            }]}
                        >
                            {t('winner_match')}
                        </Animated.Text>

                        <Animated.View
                            entering={ZoomIn.delay(500).springify()}
                            style={[styles.avatarContainer, {
                                borderColor: theme.colors.accent,
                                // Removed shadow mapping per request
                                borderWidth: 0,
                            }]}
                        >
                            <AvatarWithFrame
                                size={138}
                                avatar={winner?.avatar?.startsWith('http') ? winner.avatar : (winner?.avatar || 'Winner')}
                                frameId={isWinnerRando ? 'glitch' : (winner?.activeFrame || 'basic')}
                            />
                        </Animated.View>

                        <Animated.Text
                            entering={FadeIn.delay(800)}
                            style={[styles.winnerName, { color: theme.colors.textPrimary }]}
                        >
                            {winnerName}
                        </Animated.Text>

                        <Animated.Text
                            entering={FadeIn.delay(1000)}
                            style={styles.subtitle}
                        >
                            {t('winner_summary', { points: isWinnerRando ? roomData?.randoPoints : roomData?.punti?.[winnerName] })}
                        </Animated.Text>

                        {/* Leaderboard Section */}
                        <Animated.View
                            entering={FadeInDown.delay(1200).springify()}
                            style={[styles.leaderboardContainer, {
                                overflow: 'hidden',
                                padding: 18,
                                marginTop: 10,
                                backgroundColor: theme.colors.surface?.startsWith('#')
                                    ? theme.colors.surface + 'E6'
                                    : (theme.colors.surface || 'rgba(0,0,0,0.9)')
                            }]}
                        >
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'transparent']}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20 }]} />
                            <Text style={[styles.leaderboardTitle, { color: '#888' }]}>{t('final_leaderboard')}</Text>
                            {(() => {
                                // [NEW] Use the global ranking (already sorted descending)
                                // Filter out the absolute winner and the absolute loser
                                const middlePlayers = allSortedGlobal.filter(([name]) => name !== winnerName && name !== loserName);

                                // [TEMPORARY FOR TESTING] Always show toggle 
                                const itemsToMap = middlePlayers;

                                // We only show the toggle if there are MORE than 1 players (forced for testing)
                                if (itemsToMap.length === 0) {
                                    return (
                                        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                                            <Text style={{ color: '#555', fontFamily: 'Outfit', fontSize: 12 }}>{t('no_other_players') || 'Nessun altro grado criminale assegnato'}</Text>
                                        </View>
                                    );
                                }

                                const items = itemsToMap.map(([name, score], index) => {
                                    const isRowRando = name === 'Rando';
                                    const player = isRowRando ? null : roomData?.giocatori?.[name];
                                    const playerAvatar = isRowRando ? 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Rando' : player?.avatar;
                                    const playerRank = isRowRando ? 'Bot' : (player?.rank || 'Anima Candida');

                                    // Calculate rank based on distinct points to handle ties properly
                                    const distinctScores = [...new Set(allSortedGlobal.map(([, s]) => s))].sort((a, b) => b - a);
                                    const currentRank = distinctScores.indexOf(score) + 1;
                                    return (
                                        <View key={name} style={styles.playerRow}>
                                            <View style={styles.rankBadge}>
                                                <Text style={styles.rankText}>#{currentRank}</Text>
                                            </View>
                                            <View style={styles.smallAvatar}>
                                                <AvatarWithFrame
                                                    size={30}
                                                    avatar={playerAvatar?.startsWith('http') ? playerAvatar : (playerAvatar || 'User')}
                                                    frameId={isRowRando ? 'glitch' : (player?.activeFrame || 'basic')}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>{name}</Text>
                                                <Text style={{ fontSize: 9, color: RANK_COLORS[playerRank] || '#888', fontWeight: 'bold' }}>
                                                    {isRowRando ? 'BOT' : (playerRank ? t(`rank_${playerRank.toLowerCase().replace(/ /g, '_')}`, { defaultValue: playerRank }) : t('rank_anima_candida'))}
                                                </Text>
                                            </View>
                                            <Text style={[styles.playerScore, { color: theme.colors.accent }]}>{score} {t('points_short')}</Text>
                                        </View>
                                    );
                                });

                                return (
                                    <>
                                        {/* Render visible items (top 3) */}
                                        {items.slice(0, 3)}

                                        {/* Expanded content with smooth maxHeight+opacity animation */}
                                        <Animated.View style={expandedStyle}>
                                            {items}
                                        </Animated.View>
                                        {/* Show toggle only if there are more than 3 middle players */}
                                        {middlePlayers.length > 3 && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                    }
                                                    setIsLeaderboardExpanded(!isLeaderboardExpanded);
                                                }}
                                                style={{ marginTop: 15, alignItems: 'center', paddingVertical: 5 }}
                                            >
                                                <Text style={{ fontFamily: 'Outfit', fontSize: 13, color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    {isLeaderboardExpanded ? t('show_less') : `${t('show_all')} (${middlePlayers.length})`}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </>
                                );
                            })()}
                        </Animated.View>

                        {/* [REDESIGNED] Award della Vergogna Section */}
                        {loserName && (
                            <Animated.View
                                entering={ZoomIn.delay(2200).springify()}
                                style={[styles.shameContainer, { overflow: 'hidden', backgroundColor: 'rgba(217, 119, 6, 0.08)' }]}
                            >
                                <LinearGradient
                                    colors={['rgba(217, 119, 6, 0.15)', 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                                <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.4)', borderStyle: 'dashed', borderRadius: 20, opacity: 0.8 }]} />
                                <Text style={[styles.shameTitle, { color: '#d97706' }]}>🏆 {t('shame_award')}</Text>
                                <View style={styles.shameRow}>
                                    <View style={{ marginRight: 20, position: 'relative' }}>
                                        <View style={[styles.shameAvatarContainer, { borderColor: '#d97706', backgroundColor: '#1a1a1a' }]}>
                                            <AvatarWithFrame
                                                size={40}
                                                avatar={loserData?.avatar?.startsWith('http') ? loserData.avatar : (loserData?.avatar || 'Loser')}
                                                frameId={isLoserRando ? 'glitch' : (loserData?.activeFrame || 'basic')}
                                            />
                                        </View>
                                        {/* Trash icon badge over avatar */}
                                        <View style={[styles.shameIcon, { borderColor: '#d97706', width: 22, height: 22, borderRadius: 11, padding: 3 }]}>
                                            <View style={{ transform: [{ rotate: '15deg' }] }}>
                                                <TrashIcon size={14} color="#d97706" />
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.shameTextContainer}>
                                        <Text style={[styles.loserName, { color: '#fff' }]}>{loserName}</Text>
                                        <Text style={[styles.loserPoints, { color: '#d97706', opacity: 0.9 }]}>
                                            {t('shame_award')} {t('shame_award_msg', { points: loser?.[1] })}
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>
                        )}

                        {isCreator ? (
                            <Animated.View
                                entering={FadeIn.delay(1500)}
                                style={{ width: '80%', marginTop: 20, gap: 10, paddingBottom: 40 }}
                            >
                                <PremiumButton
                                    title={t('play_again')}
                                    onPress={handleRestart}
                                />
                                <PremiumButton
                                    title={t('back_home')}
                                    variant="outline"
                                    enableSound={false}
                                    onPress={handleExit}
                                />
                            </Animated.View>
                        ) : (
                            <Animated.View
                                entering={FadeIn.delay(1500)}
                                style={{ width: '80%', marginTop: 20, alignItems: 'center', gap: 20, paddingBottom: 40 }}
                            >
                                <Text style={[styles.waitingText, { color: '#e0e0e0', marginTop: 0, fontStyle: 'normal', textAlign: 'center' }]}>
                                    {t('waiting_restart_msg')}
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 15 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#444' }} />
                                    <Text style={{ marginHorizontal: 10, color: '#666', fontFamily: 'Outfit', fontSize: 12, textTransform: 'uppercase' }}>
                                        {t('or_divider')}
                                    </Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#444' }} />
                                </View>

                                <PremiumButton
                                    title={t('back_home')}
                                    variant="outline"
                                    onPress={handleExit}
                                    enableSound={false}
                                    style={{ width: '100%' }}
                                />
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView >
            {/* [NEW] Rank Up Celebration Overlay */}
            {
                showRankUp && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }]}>
                        <Animated.View
                            entering={ZoomIn.duration(800).springify()}
                            style={{ alignItems: 'center' }}
                        >
                            <Text style={{ color: '#d4af37', fontFamily: 'Cinzel-Bold', fontSize: 14, letterSpacing: 2 }}>{t('new_rank_title') || "NUOVO GRADO RAGGIUNTO"}</Text>
                            <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 42, textAlign: 'center', marginVertical: 20 }}>{user.rank}</Text>
                            <PremiumButton
                                title={t('awesome_btn') || "ECCELLENTE"}
                                onPress={handleRankUpClose}
                                style={{ width: 220, height: 60 }}
                            />
                        </Animated.View>
                    </View>
                )
            }

            <RewardPopup
                amount={rewardAmount}
                visible={showReward}
                onFinish={() => setShowReward(false)}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.9)', // Slightly darker background
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 20,
    },
    content: {
        alignItems: 'center',
        width: '98%', // [NEW] Allows margins
        paddingHorizontal: 0,
    },
    title: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 48,
        marginBottom: 30,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    avatarContainer: {
        width: 150, // Slightly smaller to fit leaderboard
        height: 150,
        borderRadius: 75,
        borderWidth: 0, // Border moved to content animation style
        overflow: 'hidden',
        backgroundColor: 'transparent', // Lightened to allow card effect
        marginBottom: 20,
    },
    winnerName: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 32,
        marginBottom: 5,
    },
    subtitle: {
        fontFamily: 'Outfit',
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 30,
    },
    leaderboardContainer: {
        width: '100%',
        borderRadius: 20,
        gap: 10,
    },
    leaderboardTitle: {
        fontFamily: 'Outfit',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 5,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 10,
        borderRadius: 12,
    },
    rankBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3a3a3c',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rankText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    smallAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    playerName: {
        fontFamily: 'Outfit',
        fontSize: 16,
        flex: 1,
    },
    playerScore: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 16,
    },
    waitingText: {
        fontFamily: 'Outfit',
        fontSize: 14,
        marginTop: 30,
        fontStyle: 'italic',
    },
    shameContainer: {
        width: '100%',
        marginTop: 25,
        borderRadius: 20,
        padding: 18,
    },
    shameTitle: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        color: '#d97706',
        letterSpacing: 1.5,
        marginBottom: 10,
        textAlign: 'center',
    },
    shameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shameAvatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'visible', // Allow icons/glows to escape
        justifyContent: 'center',
        alignItems: 'center',
    },
    shameIcon: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d97706',
    },
    shameTextContainer: {
        flex: 1,
    },
    loserName: {
        fontFamily: 'Outfit-Bold',
        fontSize: 18,
        color: '#fff',
    },
    loserPoints: {
        fontFamily: 'Outfit',
        fontSize: 13,
        color: '#d97706',
        opacity: 0.8,
    },
});

export default VictoryScreen;
