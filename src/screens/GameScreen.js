import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, StatusBar, Platform, Dimensions, useWindowDimensions, TouchableWithoutFeedback, Image, BackHandler, Share, Alert, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn, ZoomOut, useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, runOnUI, measure, useAnimatedRef, Easing, FadeIn, FadeOut, withRepeat, interpolate, withSequence } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { useAuth, RANK_COLORS } from '../context/AuthContext';
import { THEMES, CARD_SKINS, AVATAR_FRAMES, TEXTURES, useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext'; // [NEW]
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
import InfoScreen from './InfoScreen'; // [NEW]
import ConfettiSystem from '../components/ConfettiSystem';
import PremiumIconButton from '../components/PremiumIconButton';
import PremiumPressable from '../components/PremiumPressable';
import { SvgUri } from 'react-native-svg';
import LocalAvatar from '../components/LocalAvatar';
import AvatarWithFrame from '../components/AvatarWithFrame'; // [NEW]
import RoundWinnerModal from '../components/RoundWinnerModal'; // [NEW]
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService'; // [FIX] Import added
import * as Clipboard from 'expo-clipboard';
import ToastNotification from '../components/ToastNotification';
import EfficientBlurView from '../components/EfficientBlurView'; // [NEW]
import { CardsIcon, CheckIcon, ThornsIcon, LockIcon, RankIcon, SettingsIcon, RobotIcon, DirtyCashIcon, ScaleIcon, CrownIcon, HaloIcon, HornsIcon, HeartIcon, MoneyIcon, ShareIcon, EyeIcon } from '../components/Icons';
import ShopScreen from './ShopScreen'; // [NEW]
import AnalyticsService from '../services/AnalyticsService';
import { BASE_URL } from '../constants/Config';
import { DARK_PACK_PREVIEW, BASE_PACK_PREVIEW } from '../constants/PreviewData';
import CensoredText from '../components/CensoredText'; // [NEW]


// --- NUOVI COMPONENTI GRAFICI (Mettili prima di GameScreen o in fondo) ---

// 1. Divisore Art Deco (Sostituisce i titoli fluttuanti)
const SectionHeader = ({ title }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 2, width: '100%' }}>
        <LinearGradient
            colors={['transparent', 'rgba(212, 175, 55, 0.4)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 1 }}
        />
        <Text style={{
            fontFamily: 'Cinzel-Bold',
            color: '#d4af37',
            fontSize: 9,
            marginHorizontal: 12,
            letterSpacing: 1.2
        }}>
            {title}
        </Text>
        <LinearGradient
            colors={['rgba(212, 175, 55, 0.4)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 1 }}
        />
    </View>
);

// 2. Card Pacchetto Minimale (Sostituisce le scatole 3D)
// 2. Card Pacchetto Minimale (Sostituisce le scatole 3D)
const MinimalPackCard = ({ label, type, selected, onPress, owned = true, onPreview }) => {
    const isDark = type === 'dark';
    const baseColor = isDark ? '#ef4444' : '#FDB931';
    const { t } = useLanguage();

    return (
        <View style={{ width: '100%', height: 52, marginBottom: 6 }}>
            {/* 1. Main Interaction Layer (Background + Click) */}
            <PremiumPressable
                onPress={owned ? onPress : null}
                scaleDown={0.97}
                style={{
                    width: '100%',
                    height: '100%',
                    opacity: owned ? 1 : 0.6
                }}
                contentContainerStyle={{ height: '100%' }}
            >
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: selected ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.4)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: selected ? baseColor : 'rgba(255,255,255,0.05)',
                    height: '100%',
                    paddingRight: 60 // Make room for floating elements
                }}>
                    {/* Icona Sinistra */}
                    <View style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: selected ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        borderWidth: selected ? 1 : 0,
                        borderColor: 'rgba(255,255,255,0.05)'
                    }}>
                        {isDark ?
                            <ThornsIcon size={20} color={selected ? baseColor : '#555'} /> :
                            <CardsIcon size={20} color={selected ? baseColor : '#555'} />
                        }
                    </View>

                    {/* Testo Centrale */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{
                            fontFamily: 'Cinzel-Bold',
                            color: selected ? baseColor : '#888',
                            fontSize: 12,
                            letterSpacing: 0.5
                        }}>
                            {label}
                        </Text>
                        <Text style={{ fontFamily: 'Outfit', fontSize: 8, color: '#444' }}>
                            {isDark ? t('adult_content') : t('starter_set')}
                        </Text>
                    </View>
                </View>
            </PremiumPressable>

            {/* 2. Floating Action Layer (Sibling to Pressable) */}
            <View
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingRight: 12,
                    gap: 10
                }}
                pointerEvents="box-none"
            >
                {onPreview && (
                    <TouchableOpacity
                        onPress={onPreview}
                        style={{ padding: 8 }}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <EyeIcon size={20} color="#d4af37" />
                    </TouchableOpacity>
                )}
                {!owned && <LockIcon size={14} color="#444" />}
                {owned && selected && <CheckIcon size={14} color={baseColor} />}
            </View>
        </View>
    );
};

const GameScreen = ({ onStartLoading }) => {
    const {
        user, roomCode, roomData,
        isCreator, isDominus, myHand,
        leaveRoom, startGame, playCards, confirmDominusSelection, nextRound,
        discardCard, useAIJoker, forceReveal, kickPlayer, bribeHand,
        updateRoomSettings, roomPlayerName
    } = useGame();
    const { theme } = useTheme();
    const { bribe: payBribe, awardMoney, logout, user: authUser } = useAuth(); // [NEW] get authUser for skins
    const { t } = useLanguage(); // [NEW]
    const { height: screenHeight, width: screenWidth } = useWindowDimensions();
    const isSmallScreen = screenHeight < 700;



    const [selectedCards, setSelectedCards] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [previewPack, setPreviewPack] = useState(null); // [NEW] Preview Config

    const handlePreviewPack = (packId) => {
        SoundService.play('tap');
        setPreviewPack(packId);
    };

    const handleClosePreview = () => {
        SoundService.play('tap');
        setPreviewPack(null);
    };

    // --- GAME LOGIC ---X] Persistent state for Winner Modal to allow exit animation
    const [persistedWinnerInfo, setPersistedWinnerInfo] = useState(null);
    const [showWinnerModal, setShowWinnerModal] = useState(false);

    const [targetPoints, setTargetPoints] = useState(roomData?.puntiPerVincere || 7);
    const [roomLanguage, setRoomLanguage] = useState(roomData?.roomLanguage || 'it');
    const [allowedPackages, setAllowedPackages] = useState(roomData?.allowedPackages || { base: true, dark: false });
    const [showJokerConfirm, setShowJokerConfirm] = useState(false);
    const [showBribeConfirm, setShowBribeConfirm] = useState(false); // [NEW] Bribe Modal State
    const [showInfo, setShowInfo] = useState(false); // [NEW]
    const [showShop, setShowShop] = useState(false); // [NEW] Shop Overlay State
    const [isAnimatingJoker, setIsAnimatingJoker] = useState(false);
    const [isAnimatingPlay, setIsAnimatingPlay] = useState(false);
    const [optimisticWinner, setOptimisticWinner] = useState(null); // [NEW] Optimistic UI
    const [tempPlayedText, setTempPlayedText] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' }); // [NEW]
    const [showDominusAlert, setShowDominusAlert] = useState(false); // [NEW] Dominus Alert
    const [hasAutoShared, setHasAutoShared] = useState(false); // [NEW] Auto-share state

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
        // [FIX] Priority: GAME_OVER suppresses Round Winner
        if (roomData?.statoPartita === 'GAME_OVER') {
            setShowWinnerModal(false);
            return;
        }

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
    }, [roomData?.vincitoreTurno, roomData?.statoTurno, roomData?.statoPartita]);

    // [NEW] Dominus Detection Alert
    useEffect(() => {
        if (roomData?.dominus === user?.name && roomData?.statoTurno === 'WAITING_CARDS' && roomData?.statoPartita !== 'GAME_OVER') {
            setShowDominusAlert(true);
            SoundService.play('success'); // Play a sound for prominence
            const timer = setTimeout(() => {
                setShowDominusAlert(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowDominusAlert(false);
        }
    }, [roomData?.dominus, user?.name, roomData?.statoTurno]);



    // [NEW] Economy Integration
    const [lastPaidTurn, setLastPaidTurn] = useState(null);

    useEffect(() => {
        if (roomData?.statoTurno === 'SHOWING_WINNER' && roomData?.vincitoreTurno === (roomPlayerName || user.name)) {
            if (!lastPaidTurn) {
                awardMoney(50);
                setLastPaidTurn("PAID");
            }
        } else if (roomData?.statoTurno !== 'SHOWING_WINNER') {
            setLastPaidTurn(null);
        }

        // Sync local settings if changed by another device or initial load
        if (roomData?.puntiPerVincere !== undefined && roomData.puntiPerVincere !== targetPoints) {
            setTargetPoints(roomData.puntiPerVincere);
        }
        if (roomData?.roomLanguage && roomData.roomLanguage !== roomLanguage) {
            setRoomLanguage(roomData.roomLanguage);
        }
        if (roomData?.allowedPackages) {
            // Shallow compare
            if (JSON.stringify(roomData.allowedPackages) !== JSON.stringify(allowedPackages)) {
                setAllowedPackages(roomData.allowedPackages);
            }
        }
        // [NEW] Clear selection state when a new round starts
        if (roomData?.statoTurno === 'WAITING_CARDS') {
            setOptimisticWinner(null);
        }
    }, [roomData?.statoTurno, roomData?.vincitoreTurno, user?.name, roomData?.puntiPerVincere, roomData?.roomLanguage, roomData?.allowedPackages]);

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
        confirmText: t('default_confirm'),
        onConfirm: null
    });

    const showLeaveConfirmation = () => {
        setModalConfig({
            visible: true,
            title: t('leave_game_title'),
            message: t('leave_game_msg'),
            singleButton: false,
            confirmText: t('exit_btn'),
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
            title: t('logout_title'),
            message: t('logout_msg'),
            singleButton: false,
            confirmText: t('exit_btn'),
            onConfirm: async () => {
                if (onStartLoading) onStartLoading(true); // Optional splash
                await logout();
                setModalConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    // [NEW] Handle Kick Request with Confirmation
    const handleKickRequest = (player) => {
        setModalConfig({
            visible: true,
            title: t('kick_player_title') || "Elimina Giocatore?",
            message: t('kick_player_msg', { name: player.name }),
            confirmText: "KICK",
            singleButton: false,
            onConfirm: () => kickPlayer(player.name)
        });
    };

    // [NEW] Custom Back Handler for Game
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const backAction = () => {
            if (showInfo) {
                setShowInfo(false);
                return true;
            }
            if (showShop) {
                setShowShop(false);
                return true;
            }
            if (showLeaderboard) {
                setShowLeaderboard(false);
                return true;
            }
            showLeaveConfirmation();
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [showLeaderboard, showShop, showInfo]);

    // States moved to top

    // [NEW] Lobby Pulse Animation
    const lobbyPulse = useSharedValue(1);
    useEffect(() => {
        if (roomData?.statoPartita === 'LOBBY') {
            lobbyPulse.value = withRepeat(
                withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                -1,
                true
            );
        } else {
            lobbyPulse.value = 1;
        }
    }, [roomData?.statoPartita]);

    const pulsatingStyle = useAnimatedStyle(() => ({
        opacity: lobbyPulse.value,
        transform: [{ scale: interpolate(lobbyPulse.value, [0.4, 1], [0.98, 1]) }]
    }));

    const handleSettingsPress = () => {
        setShowSettingsModal(true);
    };

    const closeSettings = () => {
        setShowSettingsModal(false);
    };

    // Bribe Logic
    const handleBribePress = () => {
        setShowBribeConfirm(true);
    };

    const handleConfirmBribe = async () => {
        setShowBribeConfirm(false); // Close modal first
        const cost = 100;
        if (authUser?.balance < cost) {
            setToast({ visible: true, message: t('not_enough_money'), type: 'error' });
            SoundService.play('error');
            HapticsService.trigger('error');
            triggerShake();
            return;
        }

        const success = await payBribe(async () => {
            const ok = await bribeHand();
            if (ok) {
                SoundService.play('success');
                HapticsService.trigger('success');
            }
        });

        if (!success) {
            SoundService.play('error');
            HapticsService.trigger('error');
            triggerShake();
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
        AnalyticsService.logJokerUsed(user.name);
    };

    // Confetti Ref
    const confettiRef = React.useRef();

    // Reset selection on round change
    useEffect(() => {
        setSelectedCards([]);
        setOptimisticWinner(null); // [NEW] Clear optimistic state
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
                title: t('error_title'),
                message: e.message,
                singleButton: true,
                confirmText: t('default_confirm')
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

    const handlePickWinner = async (player) => {
        if (!isDominus) {
            setModalConfig({
                visible: true,
                title: t('wait_title'),
                message: t('only_dominus_msg'),
                singleButton: true,
                confirmText: t('default_confirm')
            });
            return;
        }

        // Optimistic UI: Update local state immediately
        setOptimisticWinner(player);
        SoundService.play('success'); // Play sound immediately

        try {
            await confirmDominusSelection(player);
            // Success: State will clear when roomData updates via useEffect or next round
        } catch (error) {
            // Revert on failure
            setOptimisticWinner(null);
            SoundService.play('error');
            HapticsService.trigger('error');
            setModalConfig({
                visible: true,
                title: t('error_title'),
                message: error.message || "Errore nella selezione",
                singleButton: true,
                confirmText: t('default_confirm')
            });
        }
    };

    // [NEW] Share Room Logic
    // [NEW] Share Room Logic
    const handleShareRoom = async () => {
        const message = t('share_room_msg', {
            code: roomCode,
            id: user?.username,
            url: BASE_URL
        });
        const shareUrl = `${BASE_URL}/?room=${roomCode}&invite=${encodeURIComponent(user?.username)}`;

        if (Platform.OS === 'web') {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Cards of Moral Decay',
                        text: message,
                        url: shareUrl,
                    });
                } catch (error) {
                    console.log('Error sharing:', error);
                }
            } else {
                await Clipboard.setStringAsync(shareUrl);
                setToast({ visible: true, message: t('toast_room_link_copied'), type: 'success' });
                SoundService.play('success');
            }
        } else {
            try {
                await Share.share({
                    message: message,
                    url: shareUrl, // iOS support
                });
            } catch (error) {
                console.error("Share error", error);
            }
        }
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
        <View style={[styles.header, {
            paddingTop: isSmallScreen ? (Platform.OS === 'ios' ? 35 : 10) : 50
        }]} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isSmallScreen ? 6 : 10 }}>
                <Text style={[styles.headerLogo, {
                    color: theme.colors?.accent || '#ffce6a',
                    fontSize: isSmallScreen ? 14 : 16
                }]}>MORAL DECAY</Text>
                <PremiumPressable
                    onPress={handleShareRoom}
                    style={[
                        styles.codePill,
                        isSmallScreen && { paddingVertical: 2, paddingHorizontal: 6, height: 'auto' } // Use padding for small screens/web
                    ]}
                    rippleColor="rgba(255,255,255,0.1)"
                >
                    <Text style={[styles.codeText, isSmallScreen && { fontSize: 10 }]}>#{roomCode}</Text>
                </PremiumPressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isSmallScreen ? 5 : 15 }}>

                <PremiumIconButton
                    icon={
                        <RankIcon size={isSmallScreen ? 20 : 24} color={theme.colors?.accent || '#ffce6a'} />
                    }
                    onPress={() => setShowLeaderboard(true)}
                    badge={playersList.length > 0 ? playersList.length : null}
                    size={isSmallScreen ? 40 : 48}
                    hitSlop={30}
                />

                <PremiumIconButton
                    icon={
                        <SettingsIcon size={isSmallScreen ? 22 : 26} color={theme.colors?.accent || '#ffce6a'} />
                    }
                    onPress={handleSettingsPress}
                    size={isSmallScreen ? 40 : 48}
                    hitSlop={30}
                />
            </View>
        </View>
    );

    const renderLobbyContent = () => (
        <View style={styles.lobbyCenter}>
            <Animated.Text style={[styles.lobbyTitle, { color: theme.colors?.textPrimary || '#fff', fontFamily: 'Cinzel-Bold' }, pulsatingStyle]}>
                {t('waiting_title')}
            </Animated.Text>

            {/* --- QUESTA PARTE DEGLI AVATAR È RIMASTA INTATTA --- */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 15,
                marginVertical: 20,
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
                                size={54}
                                isDominus={p.isDominus}
                            />
                        </View>
                        <Text style={{
                            color: '#e2e8f0',
                            fontFamily: 'Outfit',
                            fontSize: 11,
                            textAlign: 'center',
                            maxWidth: 60
                        }} numberOfLines={1}>
                            {p.name}
                        </Text>
                    </Animated.View>
                ))}
            </View>

            {/* --- INVITA AMICI (Nuova Sezione Richiesta) --- */}
            {/* --- INVITA AMICI (Condizionale < 3 giocatori) --- */}
            {playersList.length < 3 && (
                <View style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
                    <PremiumPressable
                        onPress={handleShareRoom}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 20,
                            backgroundColor: 'rgba(212, 175, 55, 0.05)',
                            borderWidth: 1,
                            borderColor: 'rgba(212, 175, 55, 0.2)'
                        }}
                        rippleColor="rgba(212, 175, 55, 0.1)"
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ShareIcon size={12} color="#d4af37" />
                            <Text style={{
                                fontFamily: 'Cinzel-Bold',
                                fontSize: 11,
                                color: '#d4af37',
                                letterSpacing: 1
                            }}>
                                {t('invite_friends_btn', { defaultValue: "INVITA" })}
                            </Text>
                        </View>
                    </PremiumPressable>
                    <Text style={{
                        fontFamily: 'Outfit',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: 6
                    }}>
                        {t('min_players_hint', { defaultValue: "Serve almeno 2 amici." })}
                    </Text>
                </View>
            )}

            {/* --- IMPOSTAZIONI DEL CREATORE --- */}
            {isCreator && (
                <View style={[styles.premiumBox, { marginTop: 0, paddingVertical: 10 }]}>

                    {/* 1. LINGUA (Stile Lingotto) */}
                    <SectionHeader title={t('room_language_label')} />
                    <View style={{
                        flexDirection: 'row', backgroundColor: '#000', borderRadius: 20, padding: 3,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                        width: 200, alignSelf: 'center',
                        marginBottom: 10
                    }}>
                        {['it', 'en'].map((lang) => {
                            const isActive = roomLanguage === lang;
                            return (
                                <PremiumPressable
                                    key={lang}
                                    onPress={() => {
                                        setRoomLanguage(lang);
                                        updateRoomSettings({ roomLanguage: lang });
                                    }}
                                    style={{
                                        flex: 1, paddingVertical: 8, borderRadius: 17,
                                        alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: isActive ? '#d4af37' : 'transparent'
                                    }}
                                >
                                    <Text style={{
                                        fontFamily: 'Cinzel-Bold', fontSize: 11,
                                        color: isActive ? '#000' : '#666',
                                        textAlign: 'center',
                                        includeFontPadding: false
                                    }}>
                                        {lang === 'it' ? 'ITA' : 'EN'}
                                    </Text>
                                </PremiumPressable>
                            );
                        })}
                    </View>

                    {/* 2. PACCHETTI (Stile Minimale) */}
                    <SectionHeader title={t('select_packages')} />
                    <View style={{ width: '100%' }}>
                        <MinimalPackCard
                            label={t('base_pack')}
                            type="base"
                            selected={true}
                            onPreview={() => handlePreviewPack('base')}
                        />
                        <MinimalPackCard
                            label={t('dark_pack')}
                            type="dark"
                            selected={allowedPackages.dark}
                            owned={authUser?.unlockedPacks?.dark}
                            onPress={() => {
                                const newVal = !allowedPackages.dark;
                                setAllowedPackages({ ...allowedPackages, dark: newVal });
                                updateRoomSettings({ allowedPackages: { ...allowedPackages, dark: newVal } });
                            }}
                            onPreview={() => handlePreviewPack('dark')}
                        />
                    </View>

                    {/* 3. PUNTI (Stile Monoliti Ancorati) */}
                    <SectionHeader title={t('select_points_title')} />
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
                        {[3, 5, 7, 10].map(points => {
                            const isActive = targetPoints === points;
                            return (
                                <PremiumPressable
                                    key={points}
                                    onPress={() => {
                                        setTargetPoints(points);
                                        updateRoomSettings({ puntiPerVincere: points });
                                    }}
                                    scaleDown={0.9}
                                    style={{
                                        width: 50, height: 62, borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: isActive ? '#d4af37' : 'rgba(255,255,255,0.1)',
                                        backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : '#0a0a0a',
                                        alignItems: 'center',
                                        // Ancoraggio senza glow
                                        borderBottomWidth: isActive ? 4 : 1,
                                        borderBottomColor: isActive ? '#d4af37' : 'rgba(255,255,255,0.02)',
                                        shadowColor: 'transparent', shadowOpacity: 0, elevation: 0
                                    }}
                                    pressableStyle={{ height: '100%' }}
                                    contentContainerStyle={{ height: '100%', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 2 }}
                                >
                                    <Text style={{
                                        fontFamily: 'Cinzel-Bold',
                                        color: isActive ? '#d4af37' : '#444',
                                        fontSize: 20,
                                        textAlign: 'center',
                                        marginBottom: -4,
                                        includeFontPadding: false
                                    }}>
                                        {points}
                                    </Text>
                                    <Text style={{
                                        fontFamily: 'Outfit', fontSize: 8,
                                        color: isActive ? '#d4af37' : '#333', opacity: 0.7,
                                        textAlign: 'center',
                                        includeFontPadding: false
                                    }}>
                                        {t('points_label').toUpperCase()}
                                    </Text>
                                </PremiumPressable>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={{ marginTop: 10 }}>
                {isCreator ? (
                    <PremiumButton
                        title={t('start_game_btn')}
                        haptic="heavy"
                        disabled={playersList.length < 3 && !__DEV__} // [FIX] Disabled state
                        onPress={() => {
                            // Double check just in case, though disabled prop prevents this
                            if (playersList.length < 3 && !__DEV__) return;
                            AnalyticsService.logGameStart(roomCode, playersList.length, targetPoints);
                            startGame(targetPoints);
                        }}
                        style={{
                            minWidth: 240,
                            height: 54,
                            borderRadius: 27,
                            opacity: (playersList.length < 3 && !__DEV__) ? 0.5 : 1 // [FIX] Visual feedback
                        }}
                    />
                ) : (
                    <View style={styles.guestSettingsView}>
                        <Text style={styles.waitingHostText}>{t('waiting_host_msg')}</Text>
                        {/* Pillole riassuntive per gli ospiti */}
                        <View style={styles.guestSettingsPills}>
                            <View style={styles.settingPill}><Text style={styles.pillText}>{roomLanguage.toUpperCase()}</Text></View>
                            <View style={styles.settingPill}><Text style={styles.pillText}>{targetPoints} PTS</Text></View>
                            <View style={styles.settingPill}><Text style={styles.pillText}>{allowedPackages.dark ? 'BASE+DARK' : 'BASE'}</Text></View>
                        </View>
                    </View>
                )}
            </View>
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
                optimisticWinner={optimisticWinner} // [NEW]
                isSmallScreen={isSmallScreen}
                style={[
                    !isDominus ? { flex: isSmallScreen ? 0.6 : 0.7, maxHeight: isSmallScreen ? '40%' : '45%' } : { flex: 1 },
                    Platform.OS === 'web' && !isDominus ? { maxHeight: '40%' } : {}
                ]}
            />

            {/* DominusOverlay moved to root render */}


            {(() => {
                if (isAnimatingPlay || roomData?.carteGiocate?.[user.name]) {
                    const playedRef = roomData?.carteGiocate?.[user.name];
                    const skin = CARD_SKINS[authUser?.activeCardSkin || 'classic'] || CARD_SKINS.classic; // [FIX] Use local auth user skin
                    let playedText = t('played_card_default');
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
                                            {t('you_played_label')}
                                        </Text>
                                    </View>

                                    <View style={{
                                        width: 140, height: 195, // [FIX] Slightly more height
                                        backgroundColor: skin ? skin.styles.bg : 'white',
                                        borderRadius: 16,
                                        padding: 12, // [FIX] Uniform padding
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.25, shadowRadius: 5, elevation: 6,
                                        transform: [{ rotate: '-2deg' }],
                                        overflow: 'hidden',
                                        borderWidth: 1.5,
                                        borderColor: skin ? skin.styles.border : 'rgba(0,0,0,0.1)'
                                    }}>
                                        {/* [NEW] TEXTURE LAYER */}
                                        {skin?.styles?.texture && TEXTURES[skin.styles.texture] && (() => {
                                            const hash = (playedText || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

                                        <View style={{
                                            height: 145, // [FIX] More room for the scale-to-fit box
                                            width: '100%',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingTop: 5, // [FIX] Balance centering
                                        }}>
                                            <Text
                                                style={{
                                                    color: skin ? skin.styles.text : '#222',
                                                    fontFamily: skin?.id === 'narco' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') :
                                                        skin?.id === 'omissis' ? (Platform.OS === 'ios' ? 'Courier-Bold' : 'serif') : 'Outfit',
                                                    fontWeight: 'bold',
                                                    fontSize: 16,
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    lineHeight: 18, // [FIX] Tighter line height to prevent vertical clipping
                                                }}
                                                numberOfLines={10}
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.4} // [FIX] More freedom to scale down
                                            >
                                                {playedText}
                                            </Text>
                                        </View>

                                        {/* Reserved space at the bottom for the absolutely positioned lock */}
                                        <View style={{ height: 20 }} />

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

                                        <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
                                            <LockIcon size={16} color={skin ? skin.styles.text : "#222"} />
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
                <View style={[styles.footer, { flex: isSmallScreen ? 1.4 : 1.3 }]}>
                    <PlayerHand
                        hand={myHand}
                        selectedCards={selectedCards}
                        onSelectCard={handleSelectCard}
                        maxSelection={roomData?.cartaNera?.blanks || 1}
                        disabled={!!roomData?.carteGiocate?.[roomPlayerName || user.name]}
                        isPlaying={isAnimatingPlay}
                        onPlay={handlePlay}
                        jokers={roomData?.giocatori?.[roomPlayerName || user.name]?.jokers || 0}
                        onAIJoker={handleJokerPress}
                        onDiscard={(card) => {
                            discardCard(card);
                            if (selectedCards.includes(card)) {
                                setSelectedCards(prev => prev.filter(c => c !== card));
                            }
                        }}
                        onBribe={!isDominus ? handleBribePress : null}
                        bribes={roomData?.giocatori?.[roomPlayerName || user.name]?.bribes !== undefined ? roomData.giocatori[roomPlayerName || user.name].bribes : Math.max(0, 5 - (roomData?.giocatori?.[roomPlayerName || user.name]?.bribeCount || 0))}
                        hasDiscarded={!!roomData?.giocatori?.[roomPlayerName || user.name]?.hasDiscarded}
                        skin={CARD_SKINS[authUser?.activeCardSkin || 'classic'] || CARD_SKINS.classic}
                        balance={authUser?.balance || 0}
                        isSmallScreen={isSmallScreen}
                        onBackgroundPress={() => setSelectedCards([])}
                    />
                </View>
            )}



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
                            <Text style={{ color: 'white', fontFamily: 'Outfit' }}>{t('loading')}</Text>
                        </View>
                    ) : (roomData.statoPartita === 'GAME_OVER' && !showWinnerModal) ? (
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
                </View>

                {/* --- FULL SCREEN OVERLAYS --- */}

                {/* [FIX] Dominus Overlay rendered BEFORE modals so they cover it */}
                {isDominus && roomData?.statoPartita !== 'GAME_OVER' && (roomData?.statoTurno === 'WAITING_CARDS' || roomData?.statoTurno === 'DOMINUS_CHOOSING') && (
                    <DominusOverlay
                        status={roomData?.statoTurno}
                        onSkip={nextRound}
                        onReveal={forceReveal}
                    />
                )}

                <RoundWinnerModal
                    visible={showWinnerModal}
                    winnerInfo={persistedWinnerInfo}
                    playersList={playersList}
                />

                <PremiumModal
                    visible={showJokerConfirm}
                    onClose={() => setShowJokerConfirm(false)}
                    title={t('joker_title')}
                >
                    <View style={{ alignItems: 'center', paddingVertical: 5, paddingHorizontal: 20, paddingBottom: 20 }}>
                        <View style={{ marginBottom: 15 }}>
                            <RobotIcon size={64} color={theme.colors.textPrimary} />
                        </View>
                        <View style={{ gap: 10, width: '100%' }}>
                            <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16 }}>
                                {t('joker_desc')}
                            </Text>
                            <Text style={{ color: '#ef4444', textAlign: 'center', fontFamily: 'Outfit-Bold', fontSize: 14, marginBottom: 15 }}>
                                {t('joker_warning')}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 10 }}>
                            <PremiumButton
                                title={t('cancel_btn')}
                                variant="ghost"
                                enableSound={false}
                                onPress={() => setShowJokerConfirm(false)}
                                style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                                textStyle={{ fontSize: 13 }}
                            />
                            <PremiumButton
                                title={t('joker_confirm_btn')}
                                enableSound={false}
                                onPress={handleConfirmJoker}
                                style={{ flex: 1 }}
                                textStyle={{ fontSize: 13, fontFamily: 'Cinzel-Bold' }}
                            />
                        </View>
                    </View>
                </PremiumModal>

                <PremiumModal
                    visible={showBribeConfirm}
                    onClose={() => setShowBribeConfirm(false)}
                    title={t('bribe_title')}
                >
                    <View style={{ alignItems: 'center', paddingVertical: 5, paddingHorizontal: 20, paddingBottom: 20 }}>
                        <View style={{ marginBottom: 15 }}>
                            <DirtyCashIcon size={64} color="#10b981" />
                        </View>
                        <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 15 }}>
                            {t('bribe_desc')}
                        </Text>

                        <View style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            paddingVertical: 12,
                            paddingHorizontal: 24,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(16, 185, 129, 0.15)',
                            marginBottom: 20,
                            alignSelf: 'center'
                        }}>
                            <Text style={{ color: '#10b981', textAlign: 'center', fontFamily: 'Cinzel-Bold', fontSize: 18, letterSpacing: 1 }}>{t('bribe_cost_label')}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                            <PremiumButton
                                title={t('bribe_cancel_btn')}
                                variant="ghost"
                                enableSound={false}
                                onPress={() => setShowBribeConfirm(false)}
                                style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                                textStyle={{ fontSize: 13 }}
                            />
                            <PremiumButton
                                title={t('bribe_pay_btn')}
                                enableSound={false}
                                onPress={handleConfirmBribe}
                                style={{ flex: 1 }}
                                textStyle={{ fontSize: 13, fontFamily: 'Cinzel-Bold' }}
                            />
                        </View>
                    </View>
                </PremiumModal>

                <LeaderboardDrawer
                    visible={showLeaderboard}
                    onClose={() => {
                        setShowLeaderboard(false);
                        setModalConfig(prev => ({ ...prev, visible: false })); // [FIX] Close kick modal if open
                    }}
                    players={playersList}
                    currentUserName={user?.name}
                    isCreator={isCreator}
                    onKick={handleKickRequest}
                    status={roomData?.statoTurno} // [NEW] Pass turn status
                    playedPlayers={roomData?.carteGiocate ? Object.keys(roomData.carteGiocate) : []} // [NEW] Pass who played
                />

                <SettingsModal
                    visible={showSettingsModal}
                    onClose={closeSettings}
                    onStartLoading={onStartLoading} // Pass the splash trigger
                    onLeaveRequest={showLeaveConfirmation} // [FIX] Trigger generic function
                    onLogoutRequest={handleLogoutRequest} // [NEW]
                    onOpenInfo={() => {
                        setShowInfo(true);
                        setShowSettingsModal(false);
                    }}
                />

                {/* [NEW] Info Overlay */}
                {showInfo && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
                        <InfoScreen onClose={() => setShowInfo(false)} />
                    </View>
                )}

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
                    onFinish={async () => {
                        setIsAnimatingJoker(false);
                        try {
                            const success = await useAIJoker(); // Trigger logic after animation

                            if (!success) {
                                SoundService.play('error');
                                HapticsService.trigger('error');
                                setModalConfig({
                                    visible: true,
                                    title: t('robot_icon_label') || "AI",
                                    message: t('joker_not_found'),
                                    singleButton: true,
                                    confirmText: t('default_confirm')
                                });
                            } else {
                                SoundService.play('success');
                                HapticsService.trigger('success');
                            }
                        } catch (e) {
                            setIsAnimatingJoker(false);
                            if (e.message !== "JOKER_LIMIT") {
                                SoundService.play('error');
                                HapticsService.trigger('error');
                                triggerShake();
                                setToast({ visible: true, message: e.message, type: 'error' });
                            }
                        }
                    }}
                />

                {/* [NEW] Dominus Alert Overlay */}
                {showDominusAlert && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }]} pointerEvents="none">
                        <Animated.View
                            entering={ZoomIn.duration(600).springify()}
                            exiting={ZoomOut.duration(400)}
                            style={{
                                alignItems: 'center',
                                paddingVertical: 20,
                                paddingHorizontal: 30,
                                borderRadius: 20,
                                borderWidth: 1.5,
                                borderColor: '#ffd700',
                                shadowColor: '#ffd700',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.6,
                                shadowRadius: 15,
                                elevation: 15,
                                overflow: 'hidden'
                            }}
                        >
                            {/* Gradient Background */}
                            <LinearGradient
                                colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />

                            {/* Gold Glow Overlay */}
                            <View style={{
                                ...StyleSheet.absoluteFillObject,
                                backgroundColor: '#ffd70015',
                                borderRadius: 24,
                            }} />

                            {/* Crown Icon */}
                            <View style={{
                                marginBottom: 12,
                                padding: 10,
                                borderRadius: 30,
                                backgroundColor: '#ffd70020',
                                borderWidth: 1,
                                borderColor: '#ffd700',
                                shadowColor: '#ffd700',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.4,
                                shadowRadius: 6,
                                elevation: 4
                            }}>
                                <CrownIcon size={24} color="#ffd700" />
                            </View>

                            {/* Title */}
                            <Text style={{
                                color: '#ffd700',
                                fontFamily: 'Cinzel-Bold',
                                fontSize: 22,
                                textAlign: 'center',
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                textShadowColor: '#ffd700',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 10,
                                marginBottom: 2
                            }}>
                                {t('you_are_dominus')}
                            </Text>

                            {/* Subtitle */}
                            <Text style={{
                                color: '#ccc',
                                fontFamily: 'Outfit',
                                fontSize: 13,
                                textAlign: 'center',
                                letterSpacing: 0.8
                            }}>
                                {t('dominus_subtitle', { defaultValue: 'Scegli il vincitore del round' })}
                            </Text>
                        </Animated.View>
                    </View>
                )}

                <ToastNotification
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(prev => ({ ...prev, visible: false }))}
                />


                {/* Package Preview Modal */}
                <Modal
                    transparent={true}
                    visible={!!previewPack}
                    animationType="fade"
                    onRequestClose={handleClosePreview}
                    statusBarTranslucent={true}
                    hardwareAccelerated={true}
                >
                    {previewPack && (
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableWithoutFeedback onPress={handleClosePreview}>
                                <View style={StyleSheet.absoluteFill} />
                            </TouchableWithoutFeedback>

                            <Animated.View
                                entering={ZoomIn.duration(300)}
                                exiting={ZoomOut.duration(200)}
                                style={{
                                    width: '90%',
                                    maxWidth: 400,
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: 24,
                                    borderWidth: 1,
                                    borderColor: theme.colors.accent,
                                    padding: 20,
                                    alignItems: 'center',
                                    shadowColor: theme.colors.accent,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 20,
                                    elevation: 10
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Cinzel-Bold',
                                    fontSize: 18,
                                    color: theme.colors.accent,
                                    marginBottom: 4,
                                    textAlign: 'center'
                                }}>
                                    {previewPack === 'dark' ? "DARK PACK" : "BASE PACK"}
                                </Text>
                                <Text style={{
                                    fontFamily: 'Outfit',
                                    fontSize: 12,
                                    color: '#888',
                                    marginBottom: 20,
                                    textAlign: 'center'
                                }}>
                                    {previewPack === 'dark' ? t('adult_content') : t('starter_set')}
                                </Text>

                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                    {(previewPack === 'dark' ? (DARK_PACK_PREVIEW[roomLanguage] || DARK_PACK_PREVIEW['en']) : (BASE_PACK_PREVIEW[roomLanguage] || BASE_PACK_PREVIEW['en'])).map((text, index) => {
                                        // Extract censored words for Dark pack
                                        const censoredMatches = previewPack === 'dark' ? (text.match(/\{[^}]+\}/g) || []) : [];

                                        return (
                                            <View key={index} style={{
                                                backgroundColor: '#f5f5f5',
                                                borderColor: '#ddd',
                                                borderWidth: 1,
                                                width: (Math.min(screenWidth * 0.9, 400) - 60) / 2,
                                                height: ((Math.min(screenWidth * 0.9, 400) - 60) / 2) * 1.4,
                                                padding: 8,
                                                borderRadius: 8
                                            }}>
                                                <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 4 }}>
                                                    {previewPack === 'dark' ? (
                                                        <CensoredText
                                                            text={text}
                                                            censoredWords={censoredMatches}
                                                            style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
                                                            textStyle={{
                                                                color: '#000',
                                                                fontFamily: 'Outfit',
                                                                fontSize: 13,
                                                                fontWeight: '600',
                                                                lineHeight: 18,
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Text style={{
                                                            color: '#000',
                                                            fontFamily: 'Outfit',
                                                            fontSize: 13,
                                                            fontWeight: '600',
                                                            lineHeight: 18,
                                                            textAlign: 'center'
                                                        }}>
                                                            {text}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={{ paddingBottom: 6, paddingLeft: 8, opacity: 0.8 }}>
                                                    <Text style={{ fontSize: 5, color: '#000', opacity: 0.8, fontFamily: 'Outfit-Bold' }}>
                                                        MORAL DECAY
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>

                                <TouchableOpacity
                                    onPress={handleClosePreview}
                                    style={{
                                        marginTop: 25,
                                        paddingVertical: 10,
                                        paddingHorizontal: 30,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 20
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 12 }}>
                                        {t('close_btn', { defaultValue: 'CHIUDI' })}
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}
                </Modal>

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
        fontFamily: 'Cinzel-Bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    codePill: {
        backgroundColor: '#1c1c1e',
        paddingVertical: Platform.OS === 'web' ? 4 : 0, // [FIX] Use padding for web, height for native
        height: Platform.OS === 'web' ? 'auto' : 22,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeText: {
        color: '#888',
        fontSize: 11,
        fontFamily: 'System',
        fontWeight: 'bold',
        letterSpacing: 0.5,
        lineHeight: 14, // [FIX] Help vertical centering
        includeFontPadding: false,
        textAlignVertical: 'center',
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
    },
    // [NEW] Premium Lobby Styles
    premiumBox: {
        width: '95%',
        maxWidth: 380,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
        marginBottom: 10,
        alignItems: 'center',
        alignSelf: 'center',
        overflow: 'hidden', // Required for BlurView
    },
    settingsSection: {
        width: '100%',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    sectionLabel: {
        color: 'rgba(212, 175, 55, 0.6)',
        fontFamily: 'Cinzel-Bold',
        marginBottom: 12,
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    segmentedToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20, // More rounded pill
        padding: 2,
        width: 140, // Fixed small width
        height: 32, // Smaller height
    },
    toggleOption: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
    },
    toggleOptionActive: {
        backgroundColor: '#d4af37',
    },
    toggleText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 11, // Slightly larger for readability
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
    },
    toggleTextActive: {
        color: '#000',
    },
    packCard: {
        width: 100, // Fixed width
        height: 120, // Taller portrait aspect ratio
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        borderWidth: 1.2,
        overflow: 'hidden',
    },
    packLabelContainer: {
        width: '100%',
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
    },
    packText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 10, // Slightly bigger
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    pointCard: {
        width: 48,
        height: 48,
        borderRadius: 24, // Circle
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.2,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pointCardActive: {
        borderColor: '#FDB931',
        shadowColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
    },
    pointCardInactive: {
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointValue: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 18,
        zIndex: 1,
        textAlign: 'center',
    },
    pointLabel: {
        fontFamily: 'Outfit-Bold',
        fontSize: 7,
        color: 'rgba(212, 175, 55, 0.4)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: -3,
        zIndex: 1,
        textAlign: 'center',
    },
    guestSettingsView: {
        alignItems: 'center',
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
        width: '100%',
        maxWidth: 350,
        alignSelf: 'center',
    },
    waitingHostText: {
        color: 'rgba(212, 175, 55, 0.5)',
        fontFamily: 'Outfit',
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 15,
        textAlign: 'center',
    },
    guestSettingsPills: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    settingPill: {
        backgroundColor: 'rgba(212,175,55,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.15)',
    },
    pillText: {
        color: '#d4af37',
        fontSize: 11,
        fontFamily: 'Cinzel-Bold',
        textAlign: 'center',
    }
});

export default GameScreen;
