import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, BackHandler } from 'react-native';
import Animated, { FadeIn, ZoomIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth, RANK_COLORS } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import PremiumButton from '../components/PremiumButton';
import ConfettiSystem from '../components/ConfettiSystem';
import SoundService from '../services/SoundService';
import ElegantSplashScreen from '../components/ElegantSplashScreen';
import LocalAvatar from '../components/LocalAvatar';
import { useLanguage } from '../context/LanguageContext';

import * as Haptics from 'expo-haptics'; // [NEW]
import { TrashIcon } from '../components/Icons';
import AnalyticsService from '../services/AnalyticsService';

const VictoryScreen = ({ winnerName }) => {
    const { theme } = useTheme();
    const { user, awardMoney } = useAuth();
    const { roomData, isCreator, startGame, leaveRoom } = useGame();
    const { t } = useLanguage();
    const [exiting, setExiting] = React.useState(false);
    const confettiRef = useRef();

    const winner = roomData?.giocatori?.[winnerName];

    // Calculate loser BEFORE useEffect to avoid ReferenceError
    const allScores = Object.entries(roomData?.punti || {})
        .filter(([name]) => roomData?.giocatori?.[name])
        .sort(([, a], [, b]) => a - b);

    const potentialLosers = allScores.filter(([name]) => name !== winnerName);
    const loser = potentialLosers.length > 0 ? potentialLosers[0] : null;
    const loserName = loser?.[0];
    const loserData = roomData?.giocatori?.[loserName];

    useEffect(() => {
        SoundService.play('success');
        if (confettiRef.current) {
            confettiRef.current.explode();
        }

        const timer1 = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 500);

        const timerShame = setTimeout(() => {
            if (loserName) {
                SoundService.play('pop'); // Extra punch for the shame award
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        }, 2200);

        // [LEGACY] Track winner event
        AnalyticsService.logGameWin(winnerName, roomData?.punti?.[winnerName] || 0);

        if (winnerName === user.name) {
            awardMoney(250);
        } else if (loserName === user.name) {
            awardMoney(150);
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timerShame);
        };
    }, [winnerName, loserName, user?.name]);


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

            <Animated.View
                entering={FadeIn.delay(200).duration(800)}
                style={styles.content}
            >
                <Animated.Text
                    entering={SlideInDown.springify()}
                    style={[styles.title, { color: theme.colors.accent }]}
                >
                    {t('winner_match')}
                </Animated.Text>

                <Animated.View
                    entering={ZoomIn.delay(500).springify()}
                    style={[styles.avatarContainer, { borderColor: theme.colors.accent }]}
                >
                    <LocalAvatar
                        size={138}
                        seed={winner?.avatar?.startsWith('http') ? winner.avatar : (winner?.avatar || 'Winner')}
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
                    {t('winner_summary', { points: roomData?.punti?.[winnerName] })}
                </Animated.Text>

                {/* Leaderboard Section */}
                <Animated.View entering={FadeIn.delay(1200)} style={styles.leaderboardContainer}>
                    <Text style={[styles.leaderboardTitle, { color: '#888' }]}>{t('final_leaderboard')}</Text>
                    {Object.entries(roomData?.punti || {})
                        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                        .filter(([name]) => name !== winnerName && roomData?.giocatori?.[name])
                        .map(([name, score], index) => {
                            const player = roomData?.giocatori?.[name];
                            return (
                                <View key={name} style={styles.playerRow}>
                                    <View style={styles.rankBadge}>
                                        <Text style={styles.rankText}>#{index + 2}</Text>
                                    </View>
                                    <View style={styles.smallAvatar}>
                                        <LocalAvatar
                                            size={30}
                                            seed={player?.avatar?.startsWith('http') ? player.avatar : (player?.avatar || 'User')}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>{name}</Text>
                                        <Text style={{ fontSize: 9, color: RANK_COLORS[player?.rank || 'Anima Candida'] || '#888', fontWeight: 'bold' }}>
                                            {player?.rank ? t(`rank_${player.rank.toLowerCase().replace(/ /g, '_')}`, { defaultValue: player.rank }) : t('rank_anima_candida')}
                                        </Text>
                                    </View>
                                    <Text style={[styles.playerScore, { color: theme.colors.accent }]}>{score} {t('points_short')}</Text>
                                </View>
                            );
                        })}
                </Animated.View>

                {/* [REDESIGNED] Award della Vergogna Section */}
                {loserName && (
                    <Animated.View
                        entering={ZoomIn.delay(2200).duration(600).springify()}
                        style={[styles.shameContainer, { borderColor: '#d97706' }]}
                    >
                        <Text style={[styles.shameTitle, { color: '#d97706' }]}>🏆 {t('shame_award')}</Text>
                        <View style={styles.shameRow}>
                            <View style={{ marginRight: 20, position: 'relative' }}>
                                <View style={[styles.shameAvatarContainer, { borderColor: '#d97706', backgroundColor: '#1a1a1a' }]}>
                                    <LocalAvatar
                                        size={40}
                                        seed={loserData?.avatar?.startsWith('http') ? loserData.avatar : (loserData?.avatar || 'Loser')}
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
                    <Animated.View entering={FadeIn.delay(1500)} style={{ width: '80%', marginTop: 10, gap: 10 }}>
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
                    <Animated.View entering={FadeIn.delay(1500)} style={{ width: '80%', marginTop: 10, alignItems: 'center', gap: 20 }}>
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
            </Animated.View>
        </View>
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
    content: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        marginVertical: 40,
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
        borderWidth: 6,
        overflow: 'hidden',
        backgroundColor: '#222',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
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
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 15,
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
        backgroundColor: '#2c2c2e',
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
        backgroundColor: '#444',
        overflow: 'hidden',
        marginRight: 10,
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
        marginTop: 20,
        backgroundColor: 'rgba(217, 119, 6, 0.05)',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(217, 119, 6, 0.2)',
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
        borderWidth: 2,
        borderColor: '#d97706',
        overflow: 'hidden',
        backgroundColor: '#222',
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
