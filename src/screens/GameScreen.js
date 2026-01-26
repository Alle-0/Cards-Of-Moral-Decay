import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, StatusBar, Platform, Dimensions, useWindowDimensions, TouchableWithoutFeedback, Image, BackHandler } from 'react-native';
import Animated, { ZoomIn, useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, runOnUI, measure, useAnimatedRef, Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { useAuth, RANK_COLORS } from '../context/AuthContext';
import { THEMES, CARD_SKINS, AVATAR_FRAMES, TEXTURES, useTheme } from '../context/ThemeContext';
import PremiumBackground from '../components/PremiumBackground';
import PremiumButton from '../components/PremiumButton';
import PlayerHand from '../components/PlayerHand';
import GameTable from '../components/GameTable';
import LeaderboardDrawer from '../components/LeaderboardDrawer';
import DominusOverlay from '../components/DominusOverlay';
import PremiumModal from '../components/PremiumModal';
import ConfirmationModal from '../components/ConfirmationModal'; // [NEW]
import JokerOverlay from '../components/JokerOverlay'; // [NEW]
import VictoryScreen from './VictoryScreen'; // [NEW]
import SettingsModal from '../components/SettingsModal';
import ConfettiSystem from '../components/ConfettiSystem';
import PremiumIconButton from '../components/PremiumIconButton';
import PremiumPressable from '../components/PremiumPressable';
import { SvgUri } from 'react-native-svg';
import LocalAvatar from '../components/LocalAvatar';
import AvatarWithFrame from '../components/AvatarWithFrame'; // [NEW]
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService'; // [FIX] Import added
import { RankIcon, SettingsIcon, LockIcon, RobotIcon, DirtyCashIcon, ScaleIcon, CrownIcon, HaloIcon, HornsIcon, HeartIcon, ThornsIcon, MoneyIcon } from '../components/Icons'; // [NEW] Icons
import ShopScreen from './ShopScreen'; // [NEW]

const GameScreen = ({ onStartLoading }) => {
    const {
        user, roomCode, roomData,
        isCreator, isDominus, myHand,
        leaveRoom, startGame, playCards, confirmDominusSelection, nextRound,
        discardCard, useAIJoker, forceReveal, kickPlayer, bribeHand
    } = useGame();
    const { theme } = useTheme();
    const { bribe: payBribe, awardMoney, logout, user: authUser } = useAuth(); // [NEW] get authUser for skins



    const [selectedCards, setSelectedCards] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // [FIX] Persistent state for Winner Modal to allow exit animation
    const [persistedWinnerInfo, setPersistedWinnerInfo] = useState(null);
    const [showWinnerModal, setShowWinnerModal] = useState(false);

    // [NEW] Screen Shake Animation
    const shakeTranslateX = useSharedValue(0);
    const shakeTranslateY = useSharedValue(0);

    const triggerShake = () => {
        const DURATION = 50;
        const INTENSITY = 8;
        shakeTranslateX.value = withSequence(
            withTiming(INTENSITY, { duration: DURATION }),
            withTiming(-INTENSITY, { duration: DURATION }),
            withTiming(INTENSITY / 2, { duration: DURATION }),
            withTiming(-INTENSITY / 2, { duration: DURATION }),
            withTiming(0, { duration: DURATION })
        );
        shakeTranslateY.value = withSequence(
            withTiming(INTENSITY / 2, { duration: DURATION }),
            withTiming(-INTENSITY, { duration: DURATION }),
            withTiming(INTENSITY, { duration: DURATION }),
            withTiming(0, { duration: DURATION })
        );
    };

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: shakeTranslateX.value },
            { translateY: shakeTranslateY.value }
        ]
    }));

    useEffect(() => {
        if (roomData?.vincitoreTurno && roomData?.statoTurno === 'SHOWING_WINNER') {
            setPersistedWinnerInfo({
                name: roomData.vincitoreTurno,
                avatar: roomData.giocatori?.[roomData.vincitoreTurno]?.avatar,
                winningCards: roomData.carteGiocate?.[roomData.vincitoreTurno]
            });
            setShowWinnerModal(true);
        } else {
            setShowWinnerModal(false);
        }
    }, [roomData?.vincitoreTurno, roomData?.statoTurno]);

    // [NEW] Economy Integration
    const [lastPaidTurn, setLastPaidTurn] = useState(null);

    useEffect(() => {
        // Round Win Reward (10 DC)
        if (roomData?.statoTurno === 'SHOWING_WINNER' && roomData?.vincitoreTurno === user.name) {
            if (!lastPaidTurn) {
                awardMoney(100);
                setLastPaidTurn("PAID");
            }
        } else if (roomData?.statoTurno !== 'SHOWING_WINNER') {
            setLastPaidTurn(null);
        }
    }, [roomData?.statoTurno, roomData?.vincitoreTurno, user?.name]);

    // [NEW] Browser Back Button Support for PWA
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handlePopState = (e) => {
            if (roomData?.statoPartita === 'GAME' || roomData?.statoPartita === 'LOBBY') {
                window.history.pushState(null, null, window.location.pathname);
                showLeaveConfirmation();
            }
        };

        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [roomData?.statoPartita]);

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    // [FIX] Generic Modal Config
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: "",
        message: "",
        singleButton: true,
        confirmText: "OK",
        onConfirm: null
    });

    const showLeaveConfirmation = () => {
        setModalConfig({
            visible: true,
            title: "Abbandona Partita",
            message: "Sei sicuro di voler uscire dalla stanza corrente?",
            singleButton: false,
            confirmText: "Esci",
            onConfirm: async () => {
                if (onStartLoading) onStartLoading(true);
                await leaveRoom();
                setModalConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    const handleLogoutRequest = () => {
        setModalConfig({
            visible: true,
            title: "Disconnetti",
            message: "Vuoi uscire dall'account?\nDovrai effettuare nuovamente il login.",
            singleButton: false,
            confirmText: "Esci",
            onConfirm: async () => {
                if (onStartLoading) onStartLoading(true); // Optional splash
                await logout();
                setModalConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    const [showShop, setShowShop] = useState(false); // [NEW] Shop State

    // [NEW] Custom Back Handler for Game
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const backAction = () => {
            showLeaveConfirmation();
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const [targetPoints, setTargetPoints] = useState(7);
    const [showJokerConfirm, setShowJokerConfirm] = useState(false);
    const [showBribeConfirm, setShowBribeConfirm] = useState(false); // [NEW] Bribe Modal State
    const [isAnimatingJoker, setIsAnimatingJoker] = useState(false);
    const [isAnimatingPlay, setIsAnimatingPlay] = useState(false);
    const [tempPlayedText, setTempPlayedText] = useState(null);

    const handleSettingsPress = () => {
        setShowSettingsModal(true);
    };

    const closeSettings = () => {
        setShowSettingsModal(false);
    };

    const handleBribe = () => {
        setShowBribeConfirm(true);
    };

    const confirmBribe = async () => {
        setShowBribeConfirm(false);
        const paid = await payBribe(async () => {
            await bribeHand();
            SoundService.play('money');
        });

        if (paid) {
            HapticsService.trigger('success');
        } else {
            // Show error if failed (e.g. not enough money)
            triggerShake(); // [NEW] Shake on error
            setModalConfig({
                visible: true,
                title: "Rifiutato",
                message: "Non hai abbastanza fondi per corrompere il mazziere.",
                singleButton: true,
                confirmText: "Peccato",
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        }
    };

    // Joker Logic
    const handleJokerPress = () => {
        setShowJokerConfirm(true);
    };

    // [REMOVED] Parallax Effect moved to Modals

    const handleConfirmJoker = () => {
        setShowJokerConfirm(false);
        // Start animation, logic continues in onFinish of JokerOverlay
        setIsAnimatingJoker(true);
    };

    // Confetti Ref
    const confettiRef = React.useRef();

    // Reset selection on round change
    useEffect(() => {
        setSelectedCards([]);
    }, [roomData?.turnoCorrente]);

    // Show winner modal (Side effects only)
    useEffect(() => {
        if (roomData?.statoTurno === 'SHOWING_WINNER') {
            SoundService.play('success');

            // Auto-advance after 5 seconds if Dominus
            if (isDominus) {
                const timer = setTimeout(() => {
                    nextRound();
                }, 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [roomData?.statoTurno, isDominus]);

    const handleSelectCard = (card) => {
        const blanks = roomData?.cartaNera?.blanks || 1;

        if (selectedCards.includes(card)) {
            setSelectedCards(selectedCards.filter(c => c !== card));
        } else {
            if (selectedCards.length < blanks) {
                // SoundService.play('pop'); // Handled by PremiumPressable
                setSelectedCards([...selectedCards, card]);
            } else if (blanks === 1) {
                // Swap if single pick
                // SoundService.play('pop'); // Handled by PremiumPressable
                setSelectedCards([card]);
            }
        }
    };

    const handlePlay = async () => {
        const blanks = roomData?.cartaNera?.blanks || 1;
        if (selectedCards.length !== blanks) return;

        try {
            // Trigger local animation first
            setTempPlayedText(selectedCards.join(' / ')); // [FIX] Show actual text immediately
            setIsAnimatingPlay(true);
            SoundService.play('card_play'); // Sound Effect

            // Wait for cards to "fly away"
            setTimeout(async () => {
                await playCards(selectedCards);
                // Note: We do NOT set isAnimatingPlay(false) here.
                // We wait for the roomData to update (via useEffect below) to confirm the play.
                // This prevents the hand from "bouncing" up and down.
            }, 600);
        } catch (e) {
            setIsAnimatingPlay(false);
            setIsAnimatingPlay(false);
            SoundService.play('error');
            HapticsService.trigger('error');
            triggerShake(); // [NEW] Shake on error
            // Alert.alert("Errore", e.message);
            setModalConfig({
                visible: true,
                title: "Errore",
                message: e.message,
                singleButton: true,
                confirmText: "Capito"
            });
        }
    };

    // [NEW] Sync animation state with server confirmation
    useEffect(() => {
        if (isAnimatingPlay && roomData?.carteGiocate?.[user.name]) {
            setIsAnimatingPlay(false);
            setSelectedCards([]); // Clear selection to prevent stale state on next round
        }
    }, [roomData?.carteGiocate, user.name, isAnimatingPlay]);

    const handlePickWinner = (player) => {
        if (!isDominus) {
            // Alert.alert("Aspetta!", "Solo il Dominus può scegliere il vincitore.");
            setModalConfig({
                visible: true,
                title: "Aspetta!",
                message: "Solo il Dominus può scegliere il vincitore.",
                singleButton: true,
                confirmText: "OK"
            });
            return;
        }
        confirmDominusSelection(player);
    };

    // Prepare Player List for Drawer
    const playersList = Object.keys(roomData?.giocatori || {}).map(name => ({
        name,
        points: roomData?.punti?.[name] || 0,
        // Robust check for Dominus
        isDominus: (roomData?.dominus || '').trim() === name.trim(),
        avatar: roomData?.giocatori?.[name]?.avatar,
        activeFrame: roomData?.giocatori?.[name]?.activeFrame, // [NEW] Read frame
        rank: roomData?.giocatori?.[name]?.rank // [NEW] Read rank from room
    })).sort((a, b) => b.points - a.points);

    // --- RENDER HELPERS ---
    const renderHeader = () => (
        <View style={styles.header} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={[styles.headerLogo, { color: theme.colors.accent }]}>MORAL DECAY</Text>
                <View style={styles.codePill}>
                    <Text style={styles.codeText}>#{roomCode}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>

                <PremiumIconButton
                    icon={
                        <RankIcon size={24} color={theme.colors.accent} />
                    }
                    onPress={() => setShowLeaderboard(true)}
                    badge={playersList.length > 0 ? playersList.length : null}
                    size={48}
                    hitSlop={30}
                />

                <PremiumIconButton
                    icon={
                        <SettingsIcon size={26} color={theme.colors.accent} />
                    }
                    onPress={handleSettingsPress}
                    size={48}
                    hitSlop={30}
                />
            </View>
        </View>
    );

    const renderLobbyContent = () => (
        <View style={styles.lobbyCenter}>
            <Text style={[styles.lobbyTitle, { color: theme.colors.textPrimary, fontFamily: 'Cinzel Decorative-Bold' }]}>
                In attesa...
            </Text>

            {/* [NEW] Player Grid - Social Visuals */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 15,
                marginVertical: 30,
                width: '100%',
                maxWidth: 400
            }}>
                {playersList.map((p, index) => (
                    <Animated.View
                        key={p.name}
                        entering={ZoomIn.delay(index * 100).springify()}
                        style={{ alignItems: 'center' }}
                    >
                        <View style={{ marginBottom: 8 }}>
                            <AvatarWithFrame
                                avatar={p.avatar || p.name}
                                frameId={p.activeFrame || 'basic'}
                                size={60}
                                isDominus={p.isDominus}
                            />
                        </View>
                        <Text style={{
                            color: '#e2e8f0',
                            fontFamily: 'Outfit',
                            fontSize: 12,
                            textAlign: 'center',
                            maxWidth: 70
                        }} numberOfLines={1}>
                            {p.name}
                        </Text>
                    </Animated.View>
                ))}
            </View>

            {isCreator && (
                <View style={{ width: '100%', alignItems: 'center', marginBottom: 30 }}>
                    <Text style={{
                        color: '#888',
                        fontFamily: 'Cinzel-Bold',
                        marginBottom: 15,
                        textAlign: 'center',
                        fontSize: 12,
                        letterSpacing: 2,
                        includeFontPadding: false, // [FIX] Prevent overlap
                        textAlignVertical: 'center'
                    }}>
                        PUNTI PER VINCERE
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 15, zIndex: 10, elevation: 10 }}>
                        {[3, 5, 7, 10].map(points => (
                            <PremiumPressable
                                key={points}
                                onPress={() => setTargetPoints(points)}
                                rippleColor={targetPoints === points ? 'rgba(0,0,0,0.1)' : 'rgba(255, 215, 0, 0.2)'}
                                enableSound={false}
                                scaleDown={0.9}
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    borderWidth: 1,
                                    backgroundColor: targetPoints === points ? theme.colors.accent : 'rgba(255,255,255,0.05)',
                                    borderColor: targetPoints === points ? theme.colors.accent : 'rgba(255,255,255,0.1)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Text style={{
                                    color: targetPoints === points ? '#000' : '#e2e8f0',
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                    fontFamily: 'Outfit-Bold',
                                    textAlign: 'center',
                                    includeFontPadding: false,
                                    textAlignVertical: 'center', // Android specific helpful addition
                                    marginTop: Platform.OS === 'android' ? -2 : 0 // Micro-adjustment if needed, but start clean first. I'll stick to standard props first.
                                }}>
                                    {points}
                                </Text>
                            </PremiumPressable>
                        ))}
                    </View>
                </View>
            )}

            {isCreator ? (
                <PremiumButton
                    title="Inizia Partita"
                    haptic="heavy" // Heavy confirmation
                    onPress={() => {
                        console.log("Start Game Pressed with points:", targetPoints);
                        startGame(targetPoints);
                    }}
                    style={{ minWidth: 200, backgroundColor: theme.colors.accent }}
                    textStyle={{ color: '#000' }}
                />
            ) : (
                <Text style={{ color: '#64748b', fontFamily: 'Outfit', fontStyle: 'italic', marginTop: 10 }}>
                    In attesa che l'host inizi la partita...
                </Text>
            )}
        </View>
    );

    const renderGameContent = () => (
        <>
            <GameTable
                blackCard={roomData?.cartaNera}
                playedCards={roomData?.carteGiocate}
                status={roomData?.statoTurno}
                showPlayedArea={isDominus || !roomData?.carteGiocate?.[user.name]}
                isDominus={isDominus}
                onSelectWinner={handlePickWinner}
                dominusName={roomData?.dominus}
                playerCount={playersList.length}
                players={roomData?.giocatori} // [NEW] Pass players for skins
                style={[
                    !isDominus ? { flex: 0.7, maxHeight: '45%' } : { flex: 1 },
                    Platform.OS === 'web' && !isDominus ? { maxHeight: '40%' } : {}
                ]}
            />

            {isDominus && (roomData?.statoTurno === 'WAITING_CARDS' || roomData?.statoTurno === 'DOMINUS_CHOOSING') && (
                <DominusOverlay
                    status={roomData?.statoTurno}
                    onSkip={nextRound}
                    onReveal={forceReveal}
                />
            )}


            {(() => {
                if (isAnimatingPlay || roomData?.carteGiocate?.[user.name]) {
                    const playedRef = roomData?.carteGiocate?.[user.name];
                    const skin = CARD_SKINS[authUser?.activeCardSkin || 'classic'] || CARD_SKINS.classic; // [FIX] Use local auth user skin
                    let playedText = "Carta Giocata";
                    // Use temp text if animating, otherwise real data
                    if (isAnimatingPlay && tempPlayedText) playedText = tempPlayedText;
                    else if (typeof playedRef === 'string') playedText = playedRef;
                    else if (playedRef?.text) playedText = playedRef.text;
                    else if (Array.isArray(playedRef)) {
                        // Join texts if it's an array (strings or objects)
                        playedText = playedRef.map(c => (typeof c === 'string' ? c : c?.text || '')).join(' / ');
                    }

                    return (
                        <View style={{
                            position: 'absolute',
                            top: 40, bottom: 0, left: 0, right: 0, // Full screen coverage
                            justifyContent: 'center', alignItems: 'center',
                            zIndex: 900, // Below Header (999) and Leaderboard (1001)
                            pointerEvents: 'box-none'
                        }}>

                            <View style={{ transform: [{ translateY: 60 }] }}>
                                <Animated.View
                                    entering={ZoomIn.delay(700).duration(400).easing(Easing.out(Easing.back(1.5)))}
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 20,
                                        width: 200,
                                        minHeight: 250,
                                        borderWidth: 2,
                                        borderColor: '#676767ff',
                                        borderStyle: 'dashed',
                                        borderRadius: 20,
                                        backgroundColor: 'rgba(26, 26, 26, 0.60)', // Semi-transparent dark bg
                                        position: 'relative',
                                        shadowColor: "#000", shadowOffset: { width: 0, height: 5 },
                                        shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
                                    }}
                                >
                                    <View style={{
                                        position: 'absolute',
                                        top: -14,
                                        backgroundColor: 'rgba(26, 26, 26, 1)', // Match container transparency
                                        paddingHorizontal: 10,
                                        zIndex: 10,
                                        borderRadius: 12,
                                        paddingVertical: 5,
                                    }}>
                                        <Text style={{
                                            color: '#858585ff',
                                            fontFamily: 'Cinzel-Bold',
                                            fontSize: 12,
                                            letterSpacing: 1.5,
                                            textTransform: 'uppercase',
                                        }}>
                                            HAI GIOCATO
                                        </Text>
                                    </View>

                                    <View style={{
                                        width: 140, height: 190,
                                        backgroundColor: skin ? skin.styles.bg : 'white',
                                        borderRadius: 14, padding: 15,
                                        justifyContent: 'center', alignItems: 'center',
                                        shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
                                        shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
                                        transform: [{ rotate: '-2deg' }],
                                        overflow: 'hidden', // [NEW] Ensure texture stays inside
                                        borderWidth: 1,
                                        borderColor: skin ? skin.styles.border : 'rgba(0,0,0,0.1)'
                                    }}>
                                        {/* [NEW] TEXTURE LAYER */}
                                        {skin?.styles?.texture && TEXTURES[skin.styles.texture] && (() => {
                                            const hash = playedText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                            const rotations = [0, 90, 180, 270];
                                            const rotation = rotations[hash % 4];
                                            const baseScale = skin.id === 'omissis' ? 0.7 : 1.3;
                                            const scaleFactor = baseScale + (hash % 5) * 0.1;

                                            return (
                                                <Image
                                                    source={TEXTURES[skin.styles.texture]}
                                                    style={[
                                                        StyleSheet.absoluteFill,
                                                        {
                                                            opacity: skin.id === 'mida' ? 0.4 : 0.15,
                                                            borderRadius: 14,
                                                            transform: [
                                                                { rotate: `${rotation}deg` },
                                                                { scale: scaleFactor }
                                                            ]
                                                        }
                                                    ]}
                                                    resizeMode="cover"
                                                />
                                            );
                                        })()}

                                        <Text style={{
                                            color: skin ? skin.styles.text : '#222',
                                            fontFamily: skin?.id === 'narco' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') :
                                                skin?.id === 'omissis' ? (Platform.OS === 'ios' ? 'Courier-Bold' : 'serif') : 'Outfit',
                                            fontWeight: skin?.id === 'mida' ? 'bold' : 'bold',
                                            fontSize: 18,
                                            textAlign: 'left',
                                            width: '100%',
                                            lineHeight: 24
                                        }}>
                                            {playedText}
                                        </Text>

                                        {/* [NEW] CENSOR BAR LAYER FOR OMISSIS */}
                                        {skin?.id === 'omissis' && (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: '20%',
                                                    left: 10,
                                                    right: 10,
                                                    height: 15,
                                                    backgroundColor: '#000',
                                                    opacity: 0.8,
                                                    transform: [{ rotate: '-2deg' }]
                                                }}
                                            />
                                        )}

                                        <View style={{ position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center' }}>
                                            <LockIcon size={22} color={skin ? skin.styles.text : "#222"} />
                                        </View>
                                    </View>
                                </Animated.View>
                            </View>
                        </View>
                    );
                }
                return null;
            })()}



            {!isDominus && (
                <View style={[styles.footer, { flex: 1.3 }]}>
                    <PlayerHand
                        hand={myHand}
                        selectedCards={selectedCards}
                        onSelectCard={handleSelectCard}
                        maxSelection={roomData?.cartaNera?.blanks || 1}
                        disabled={!!roomData?.carteGiocate?.[user.name]}
                        isPlaying={isAnimatingPlay}
                        onPlay={handlePlay}
                        jokers={roomData?.giocatori?.[user.name]?.jokers || 0}
                        onAIJoker={handleJokerPress}
                        onDiscard={(card) => {
                            discardCard(card);
                            if (selectedCards.includes(card)) {
                                setSelectedCards(prev => prev.filter(c => c !== card));
                            }
                        }}
                        onBribe={!isDominus ? handleBribe : null}
                        hasDiscarded={!!roomData?.giocatori?.[user.name]?.hasDiscarded}
                        skin={CARD_SKINS[authUser?.activeCardSkin || 'classic'] || CARD_SKINS.classic}
                        balance={authUser?.balance || 0}
                    />
                </View>
            )}



            <PremiumModal
                visible={showWinnerModal}
                onClose={() => { }} // User can't close it manually
                title="" // Custom Header inside
                showClose={false}
            >
                <View style={{ alignItems: 'center', width: '100%', paddingTop: 10 }}>
                    {/* CUSTOM HEADER */}
                    <View style={{ width: '100%', alignItems: 'center', marginBottom: 50 }}>
                        <Text style={{
                            fontFamily: 'Cinzel Decorative-Bold',
                            color: theme.colors.accent,
                            fontSize: 24,
                            textAlign: 'center',
                            textShadowColor: theme.colors.accent,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 10
                        }}>
                            VINCITORE
                        </Text>
                        <Text style={{
                            fontFamily: 'Cinzel Decorative-Bold',
                            color: theme.colors.accent,
                            fontSize: 18,
                            textAlign: 'center',
                            opacity: 0.8
                        }}>
                            DEL TURNO
                        </Text>
                    </View>

                    {/* AVATAR (Overlapping) */}
                    <View style={{
                        position: 'absolute',
                        top: 60,
                        zIndex: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 5 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 10
                    }}>
                        <AvatarWithFrame
                            avatar={persistedWinnerInfo?.avatar?.startsWith('http') ? persistedWinnerInfo.avatar : (persistedWinnerInfo?.avatar || 'User')}
                            frameId={playersList.find(p => p.name === persistedWinnerInfo?.name)?.activeFrame || 'basic'}
                            size={90}
                        />
                    </View>

                    {/* NAME */}
                    <Text style={{
                        fontFamily: 'Cinzel-Bold', color: '#fff', fontSize: 24, marginBottom: 20, marginTop: 40,
                        textAlign: 'center'
                    }}>
                        {persistedWinnerInfo?.name}
                    </Text>

                    {/* CARD */}
                    {(() => {
                        const winningCards = persistedWinnerInfo?.winningCards;
                        let text = "Carta non trovata";
                        if (Array.isArray(winningCards)) text = winningCards.join(' / ');
                        else if (winningCards && typeof winningCards === 'object') text = winningCards.text || Object.values(winningCards).join(' / ');
                        else if (typeof winningCards === 'string') text = winningCards;

                        return (
                            <View style={{
                                width: '90%', minHeight: 140, backgroundColor: 'white',
                                borderRadius: 16, padding: 20,
                                justifyContent: 'center', alignItems: 'center',
                                shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
                                transform: [{ rotate: '-2deg' }], marginBottom: 20,
                                borderWidth: 1, borderColor: '#ccc'
                            }}>
                                <Text style={{ color: '#222', fontFamily: 'Outfit-Bold', fontSize: 20, textAlign: 'center', lineHeight: 28 }}>
                                    {text}
                                </Text>
                                <View style={{ position: 'absolute', bottom: 10, right: 10 }}>
                                    <Text style={{ fontSize: 10, color: '#666', fontFamily: 'Outfit-Bold' }}>CARDS OF MORAL DECAY</Text>
                                </View>
                            </View>
                        );
                    })()}

                    <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 12, marginTop: 10 }}>
                        Il prossimo round inizierà a breve...
                    </Text>
                </View>
            </PremiumModal>
        </>
    );

    return (
        <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
            <PremiumBackground showParticles={roomData?.statoPartita !== 'LOBBY'}>
                <StatusBar hidden={true} />

                <View style={styles.container}>
                    <ConfettiSystem ref={confettiRef} />
                    {!roomData ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontFamily: 'Outfit' }}>Caricamento...</Text>
                        </View>
                    ) : roomData.statoPartita === 'GAME_OVER' ? (
                        <VictoryScreen winnerName={roomData.vincitorePartita} />
                    ) : (
                        <>
                            {renderHeader()}
                            {roomData.statoPartita === 'LOBBY' ? (
                                <Animated.View key="lobby" entering={FadeIn.duration(800)} style={{ flex: 1, width: '100%' }}>
                                    {renderLobbyContent()}
                                </Animated.View>
                            ) : (
                                <Animated.View key="game" entering={FadeIn.duration(800)} style={{ flex: 1, width: '100%' }}>
                                    {renderGameContent()}
                                </Animated.View>
                            )}
                        </>
                    )}
                    <PremiumModal
                        visible={showJokerConfirm}
                        onClose={() => setShowJokerConfirm(false)}
                        title="USARE IL JOKER?"
                    >
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <View style={{ marginBottom: 20 }}>
                                <RobotIcon size={80} color={theme.colors.textPrimary} />
                            </View>
                            <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 20 }}>
                                Ti verrà data una delle carte migliori per questo turno e verrà posizionata come ultima nella tua mano.
                            </Text>
                            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)', marginBottom: 30 }}>
                                <Text style={{ color: '#ef4444', textAlign: 'center', fontFamily: 'Cinzel-Bold', fontSize: 14 }}>⚠️ ATTENZIONE:</Text>
                                <Text style={{ color: '#fca5a5', textAlign: 'center', fontFamily: 'Outfit', fontSize: 14, marginTop: 5 }}>La prima carta della tua mano verrà eliminata!</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 15, width: '100%' }}>
                                <PremiumButton title="ANNULLA" variant="ghost" enableSound={false} onPress={() => setShowJokerConfirm(false)} style={{ flex: 1 }} textStyle={{ fontSize: 16 }} />
                                <PremiumButton title="CONFERMA" enableSound={false} onPress={handleConfirmJoker} style={{ flex: 1, backgroundColor: '#3e7e3dff', borderColor: '#1f6140ff' }} textStyle={{ color: 'white', fontSize: 12 }} />
                            </View>
                        </View>
                    </PremiumModal>

                    {/* [NEW] Bribe Confirmation Modal */}
                    <PremiumModal
                        visible={showBribeConfirm}
                        onClose={() => setShowBribeConfirm(false)}
                        title="CORRUZIONE"
                    >
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <View style={{ marginBottom: 20 }}>
                                <DirtyCashIcon size={80} color="#10b981" />
                            </View>
                            <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 20 }}>
                                Vuoi allungare una mazzetta al mazziere per cambiare le tue carte?
                            </Text>

                            <View style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                padding: 15,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: 'rgba(16, 185, 129, 0.3)',
                                marginBottom: 15,
                                width: '100%'
                            }}>
                                <Text style={{ color: '#10b981', textAlign: 'center', fontFamily: 'Cinzel-Bold', fontSize: 18 }}>COSTO: 100 DC</Text>
                            </View>

                            <View style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                padding: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                marginBottom: 30,
                                width: '100%'
                            }}>
                                <Text style={{ color: '#fca5a5', textAlign: 'center', fontFamily: 'Outfit', fontSize: 13 }}>
                                    ⚠️ La tua mano attuale verrà scartata e ne pescherai una nuova.
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 15, width: '100%' }}>
                                <PremiumButton
                                    title="NON ORA"
                                    variant="ghost"
                                    enableSound={false}
                                    onPress={() => setShowBribeConfirm(false)}
                                    style={{ flex: 1 }}
                                    textStyle={{ fontSize: 12 }}
                                />
                                <PremiumButton
                                    title="PAGA 100 DC"
                                    enableSound={false}
                                    onPress={confirmBribe}
                                    style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#059669' }}
                                    textStyle={{ color: 'white', fontSize: 10, fontFamily: 'Cinzel-Bold' }}
                                />
                            </View>
                        </View>
                    </PremiumModal>
                </View>

                <LeaderboardDrawer
                    visible={showLeaderboard}
                    onClose={() => setShowLeaderboard(false)}
                    players={playersList}
                    currentUserName={user?.name}
                    isCreator={isCreator}
                    onKick={kickPlayer}
                    status={roomData?.statoTurno} // [NEW] Pass turn status
                    playedPlayers={roomData?.carteGiocate ? Object.keys(roomData.carteGiocate) : []} // [NEW] Pass who played
                />

                <SettingsModal
                    visible={showSettingsModal}
                    onClose={closeSettings}
                    onStartLoading={onStartLoading} // Pass the splash trigger
                    onLeaveRequest={showLeaveConfirmation} // [FIX] Trigger generic function
                    onLogoutRequest={handleLogoutRequest} // [NEW]
                />

                {/* [NEW] Generic Confirmation Modal */}
                <ConfirmationModal
                    visible={modalConfig.visible}
                    onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    singleButton={modalConfig.singleButton}
                    confirmText={modalConfig.confirmText}
                    onConfirm={modalConfig.onConfirm}
                />

                <PremiumModal
                    visible={showShop}
                    onClose={() => setShowShop(false)}
                    title="MERCATO NERO"
                    showClose={true}
                >
                    <View style={{ height: 450, width: '100%' }}>
                        <ShopScreen onClose={() => setShowShop(false)} />
                    </View>
                </PremiumModal>

                {/* [NEW] AI Joker Animation Overlay */}
                <JokerOverlay
                    visible={isAnimatingJoker}
                    onFinish={() => {
                        setIsAnimatingJoker(false);
                        useAIJoker(); // Trigger logic after animation
                    }}
                />
            </PremiumBackground>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50, // Increased for safe area
        zIndex: 999, // Ensure it's above everything else
        elevation: 10, // For Android
    },
    headerLogo: {
        fontFamily: 'Cinzel Decorative-Bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    codePill: {
        backgroundColor: '#1c1c1e',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    codeText: {
        color: '#888',
        fontSize: 12,
        fontFamily: 'System', // Monospace feel
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -8,
        backgroundColor: '#4a4a4f',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: '#111'
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    roomCode: {
        fontSize: 18,
    },
    lobbyCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lobbyTitle: {
        fontSize: 32,
        marginBottom: 10,
    },
    footer: {
        flex: 1,
        // justifyContent: 'flex-end', // Removed to let flex items stack naturally
        // paddingBottom: 50, // Removed to avoid pushing Hand up
    }
});

export default GameScreen;
