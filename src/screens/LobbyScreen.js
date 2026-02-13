import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableWithoutFeedback, Keyboard, Dimensions, useWindowDimensions, StatusBar, Platform, Pressable, Image, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeIn,
    FadeOut,
    LinearTransition,
    withSequence,
    Easing
} from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { RANK_COLORS, RANK_THRESHOLDS } from '../constants/Ranks';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import SoundService from '../services/SoundService';
import AnalyticsService from '../services/AnalyticsService';
import PremiumButton from '../components/PremiumButton';
import PremiumModal from '../components/PremiumModal';
// [REMOVED] PremiumBackground - Handled globally in AppNavigator
import ToastNotification from '../components/ToastNotification';
import ConfirmationModal from '../components/ConfirmationModal';
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { LockIcon, ShieldIcon } from '../components/Icons';
import IdentityStep from '../components/lobby/IdentityStep';
import MainMenuStep from '../components/lobby/MainMenuStep';

const STEPS = {
    IDENTITY: 0,
    ACTION: 1,
    JOIN: 2,
};

const RANK_KEY_MAP = {
    "Anima Candida": "rank_anima_candida",
    "Innocente": "rank_innocente",
    "Corrotto": "rank_corrotto",
    "Socio del Vizio": "rank_socio_del_vizio",
    "Architetto del Caos": "rank_architetto_del_caos",
    "Eminenza Grigia": "rank_eminenza_grigia",
    "Entità Apocalittica": "rank_entita_apocalittica",
    "Capo supremo": "rank_capo_supremo",
    "Capo Supremo": "rank_capo_supremo", // [FIX] Case variation
    "BOT": "rank_bot"
};

const getRankKey = (rank) => {
    if (!rank) return 'rank_anima_candida';
    const cleanRank = rank.trim();
    return RANK_KEY_MAP[cleanRank] || `rank_${cleanRank.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')}`;
};

const LobbyScreen = ({ onStartLoading }) => {
    const {
        createRoom,
        joinRoom,
        quickJoin, // [NEW]
        availableRooms,
        refreshRooms,
    } = useGame();
    const { theme } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const {
        user: authUser,
        updateProfile,
        dismissNewUser,
        dismissRecovered,
        logout,
        pendingRoom, // [NEW]
        setPendingRoom // [NEW]
    } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    // [NEW] AUTO-JOIN ROOM EFFECT
    useEffect(() => {
        // [MODIFIED] Trigger immediately even if in IDENTITY step
        if (pendingRoom && !isLoading && authUser?.username) {
            console.log(`[AUTO-JOIN] Triggering join for room: ${pendingRoom}`);
            handleJoinSpecific(pendingRoom);
            setPendingRoom(null); // Clear after attempt

            // Clear persistence
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.removeItem('pending_room_deep_link');
        }
    }, [pendingRoom, authUser?.username, isLoading]);

    const { MYSTERY_AVATAR, PLAYER_AVATARS, shuffleArray } = require('../utils/constants');
    const Clipboard = require('expo-clipboard');

    const [currentStep, setCurrentStep] = useState(authUser?.username ? STEPS.ACTION : STEPS.IDENTITY);
    const [roomToJoin, setRoomToJoin] = useState('');


    // [NEW] AUTO-TRANSITION EFFECT
    useEffect(() => {
        if (authUser?.username && currentStep === STEPS.IDENTITY) {
            console.log("[LOBBY] User authenticated, jumping to actions.");
            setCurrentStep(STEPS.ACTION);
        }
    }, [authUser?.username]);

    const [localPlayerName, setLocalPlayerName] = useState(authUser?.nickname || authUser?.username || '');
    const [localAvatar, setLocalAvatar] = useState(authUser?.avatar || authUser?.avatar || MYSTERY_AVATAR);

    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

    // [NEW] Exit Modal State
    const [showExitModal, setShowExitModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false); // [NEW]

    // [NEW] Split Rooms Logic
    const { friendsRooms, publicRooms } = React.useMemo(() => {
        const friends = [];
        const publicR = [];
        const myUsername = (authUser?.username || '').toLowerCase().trim();
        const myNickname = (authUser?.nickname || '').toLowerCase().trim();
        const friendsList = authUser?.friends || {};
        const myFriendsKeys = Object.keys(friendsList).map(k => k.toLowerCase());

        (availableRooms || []).forEach(room => {
            if (!room) return;

            const roomCreatorId = (room.creatorUsername || '').toLowerCase().trim();
            const roomCreatore = (room.creatore || '').toLowerCase().trim();
            const creatorId = (roomCreatorId || roomCreatore).toLowerCase();

            // Checks
            const isMyRoom = (roomCreatorId !== '' && (roomCreatorId === myUsername || roomCreatorId === myNickname)) ||
                (roomCreatore !== '' && (roomCreatore === myUsername || roomCreatore === myNickname));

            const isFriendRoom = creatorId !== '' && (
                myFriendsKeys.includes(creatorId) ||
                myFriendsKeys.includes(creatorId.replace(/\./g, '_'))
            );

            const participants = room.giocatori ? Object.keys(room.giocatori).map(p => p.toLowerCase()) : [];
            const amIIn = participants.includes(myUsername) || participants.includes(myNickname);

            // Classification
            if (isMyRoom || isFriendRoom || amIIn) {
                friends.push(room);
            }

            // [MODIFIED] Allow overlap: If it's public, it goes to Public tab too
            if (room.visibility === 'public') {
                publicR.push(room);
            }
        });

        console.log('[LOBBY] Room filtering:', {
            total: (availableRooms || []).length,
            friends: friends.length,
            public: publicR.length,
            myUsername,
            myNickname,
            friendsCount: myFriendsKeys.length
        });

        return { friendsRooms: friends, publicRooms: publicR };
    }, [availableRooms, authUser]);

    // Custom Back Handler
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const backAction = () => {
                if (currentStep === STEPS.IDENTITY) {
                    setShowExitModal(true);
                    return true;
                } else if (currentStep === STEPS.ACTION) {
                    setCurrentStep(STEPS.IDENTITY);
                    return true;
                } else if (currentStep === STEPS.JOIN) {
                    setCurrentStep(STEPS.ACTION);
                    return true;
                }
                return false;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }, [currentStep])
    );

    // [NEW] Shared Value for Code Pulse (Static as per user request)
    const codeScale = useSharedValue(1);
    useEffect(() => {
        if (authUser?.isNew) {
            codeScale.value = withTiming(1);
        }
    }, [authUser?.isNew]);

    const animatedCodeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: codeScale.value }]
    }));

    const confirmLogout = async () => {
        try {
            await logout();
            setShowLogoutModal(false);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // [NEW] Reveal Mystery on Next
    const handleNextToActions = async (name, avatar) => {
        if (!name || !name.trim()) {
            SoundService.play('error');
            setToast({ visible: true, message: "Inserisci un nome!" });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Reveal Mystery if needed
            let finalAvatar = avatar;
            if (avatar === MYSTERY_AVATAR) {
                finalAvatar = PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
            } else {
                setLocalAvatar(avatar);
            }
            setLocalPlayerName(name);

            // 2. Sync with AuthContext (Firebase)
            if (authUser?.username) {
                await updateProfile({
                    nickname: name.trim(),
                    avatar: finalAvatar
                });
            }

            setCurrentStep(STEPS.ACTION);
        } catch (e) {
            console.error("Identity sync failed", e);
            SoundService.play('error');
            setToast({ visible: true, message: e.message || "Errore durante il salvataggio." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoomRequest = () => {
        // Show modal to choose visibility
        setShowCreateModal(true);
    };

    const handleConfirmCreateRoom = async (visibility) => {
        setShowCreateModal(false);
        if (onStartLoading) onStartLoading();

        setIsLoading(true);
        try {
            const code = await createRoom({
                avatar: localAvatar,
                activeCardSkin: authUser?.activeCardSkin || 'classic',
                activeFrame: authUser?.activeFrame || 'basic',
                rank: authUser?.rank || 'Anima Candida',
                visibility: visibility // 'public' or 'private'
            });
            // Auto nav handled by GameContext or similar if needed, but Lobby stays until roomData set
        } catch (e) {
            console.error(e);
            if (onStartLoading) onStartLoading(false);
            SoundService.play('error');
            setToast({ visible: true, message: "Impossibile creare la stanza." });
        } finally {
            setIsLoading(false);
        }
    };

    // [NEW] Quick Join Logic
    const handleQuickJoin = async () => {
        // [FIX] Immediate check to avoid splash screen if no rooms
        if (!publicRooms || publicRooms.length === 0) {
            SoundService.play('error');
            setToast({ visible: true, message: t('no_public_rooms') || "Nessuna stanza disponibile." });
            return;
        }

        if (onStartLoading) onStartLoading();
        setIsLoading(true);
        try {
            // Ensure avatar is set
            let finalAvatar = localAvatar;
            if (finalAvatar === MYSTERY_AVATAR) {
                finalAvatar = PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
                setLocalAvatar(finalAvatar);
                if (authUser?.username) {
                    await updateProfile({ avatar: finalAvatar });
                }
            }

            await quickJoin();
        } catch (e) {
            console.warn(e);
            if (onStartLoading) onStartLoading(false);
            SoundService.play('error');
            setToast({ visible: true, message: t('no_public_rooms') || "Nessuna stanza disponibile." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinClick = () => {
        refreshRooms();
        setCurrentStep(STEPS.JOIN);
    };

    const handleJoinSpecific = async (roomId) => {
        if (onStartLoading) onStartLoading();

        setIsLoading(true);
        try {
            // [NEW] If joining via deep link/auto, ensure we don't have a mystery avatar
            let finalAvatar = localAvatar;
            if (finalAvatar === MYSTERY_AVATAR) {
                finalAvatar = PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
                setLocalAvatar(finalAvatar); // Sync local state
            }

            const code = await joinRoom(roomId, {
                avatar: finalAvatar,
                activeCardSkin: authUser?.activeCardSkin || 'classic',
                activeFrame: authUser?.activeFrame || 'basic',
                rank: authUser?.rank || 'Anima Candida'
            });
            if (code) {
                AnalyticsService.log('lobby_join', { room_code: code });
            }
        } catch (e) {
            if (onStartLoading) onStartLoading(false);
            SoundService.play('error');
            setToast({ visible: true, message: "Stanza non trovata o piena." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); }}>
                <View style={{ flex: 1 }}>
                    <StatusBar hidden={true} />

                    {/* [NEW] Rank Badge Top-Left (Ultra Clean Version) */}
                    {authUser?.rank && (() => {
                        const score = authUser.totalScore || 0;
                        const currentRankIdx = RANK_THRESHOLDS.findIndex(r => r.name.toLowerCase() === (authUser.rank || '').toLowerCase().trim());
                        const nextRank = currentRankIdx !== -1 && currentRankIdx < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[currentRankIdx + 1] : null;
                        const currentRankMin = RANK_THRESHOLDS[currentRankIdx]?.min || 0;

                        // [FIX] Robust Color Lookup
                        const getRankColor = (r) => {
                            if (!r) return '#888';
                            const clean = r.trim();

                            // 1. Try exact/trimmed match
                            if (RANK_COLORS[r]) return RANK_COLORS[r];
                            if (RANK_COLORS[clean]) return RANK_COLORS[clean];

                            // 2. Try Case-Insensitive Match
                            const lower = clean.toLowerCase();
                            const match = Object.keys(RANK_COLORS).find(k => k.toLowerCase() === lower);
                            if (match) return RANK_COLORS[match];

                            return '#888';
                        };

                        const rankColor = getRankColor(authUser.rank);

                        let progress = 0;
                        let pointsLeft = 0;
                        if (nextRank) {
                            const range = nextRank.min - currentRankMin;
                            const relativeScore = score - currentRankMin;
                            progress = Math.min(Math.max(relativeScore / range, 0), 1);
                            pointsLeft = Math.max(nextRank.min - score, 0);
                        }

                        return (
                            <Animated.View
                                entering={FadeIn.delay(500)}
                                style={styles.rankBadgeContainer}
                            >
                                <View style={[styles.rankBadgeGradient, { borderColor: rankColor + '44', borderWidth: 1 }]}>
                                    <View style={[styles.rankVerticalBar, { backgroundColor: rankColor }]} />
                                    <View>
                                        <Text style={[styles.rankTextLabel, { color: rankColor }]}>
                                            {t(getRankKey(authUser.rank))}
                                        </Text>

                                        {nextRank && (
                                            <View style={{ marginTop: 4 }}>
                                                {/* Global Progress Bar Background */}
                                                <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', width: '80%' }}>
                                                    {/* Active Progress */}
                                                    <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: rankColor, borderRadius: 2 }} />
                                                </View>
                                                <Text style={{ fontSize: 8, color: '#666', marginTop: 2, fontFamily: 'Outfit', includeFontPadding: false }}>
                                                    {t('next_rank_points', { points: pointsLeft.toLocaleString(), rank: t(getRankKey(nextRank.name)) })}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })()}

                    {/* UNIFIED FRAME STRUCTURE */}
                    <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 80 + insets.bottom, paddingTop: insets.top + 20 }}>
                        <View style={styles.frameContainer}>
                            {currentStep === STEPS.IDENTITY && (
                                <Animated.View
                                    entering={FadeIn.duration(400)}
                                    exiting={FadeOut.duration(300)}
                                    style={{ alignItems: 'center', marginBottom: 20 }}
                                >
                                    <Text style={[styles.mainTitle, { color: theme.colors.accent }]}>CARDS OF</Text>
                                    <Text style={[styles.mainTitle, { color: theme.colors.accent }]}>MORAL DECAY</Text>
                                </Animated.View>
                            )}

                            <Animated.View
                                layout={LinearTransition.duration(300)}
                                style={[styles.innerFrame, { borderColor: theme.colors.cardBorder, marginTop: 5, width: '100%' }]}
                            >
                                {currentStep === STEPS.IDENTITY ? (
                                    <View>
                                        <IdentityStep
                                            theme={theme}
                                            name={localPlayerName}
                                            onNameChange={setLocalPlayerName}
                                            avatar={localAvatar}
                                            onEditAvatar={() => setShowAvatarModal(true)}
                                            onNext={() => handleNextToActions(localPlayerName, localAvatar)}
                                        />
                                    </View>
                                ) : (
                                    <View style={{ maxHeight: Dimensions.get('window').height * 0.8 }}>
                                        <MainMenuStep
                                            theme={theme}
                                            roomToJoin={roomToJoin}
                                            setRoomToJoin={setRoomToJoin}
                                            isLoading={isLoading}
                                            onBack={() => setCurrentStep(STEPS.IDENTITY)}
                                            onCreateRoom={handleCreateRoomRequest}
                                            onJoinRoom={handleJoinSpecific}
                                            onQuickJoin={handleQuickJoin}
                                            friendsRooms={friendsRooms}
                                            publicRooms={publicRooms}
                                        />
                                    </View>
                                )}
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>

            <AvatarSelectionModal
                visible={showAvatarModal}
                onClose={() => setShowAvatarModal(false)}
                onSelect={setLocalAvatar}
                currentAvatar={localAvatar}
                avatars={[MYSTERY_AVATAR, ...PLAYER_AVATARS]}
            />

            {/* [NEW] Logout Confirmation Modal (Might not be accessible from UI here anymore, but keeping logic just in case) */}
            <ConfirmationModal
                visible={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title={t('logout_title')}
                message={t('logout_msg')}
                confirmText={t('logout_title')} // or t('exit_btn') / specific logout action
                onConfirm={confirmLogout}
            />

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* [NEW] Exit Confirmation Modal */}
            <PremiumModal
                visible={showExitModal}
                onClose={() => setShowExitModal(false)}
                title={t('exit_app_title')}
            >
                <View style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, paddingBottom: 20 }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 30 }}>
                        {t('exit_app_msg')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 15, width: '100%' }}>
                        <PremiumButton
                            title={t('exit_app_no')}
                            variant="ghost"
                            enableSound={false}
                            onPress={() => setShowExitModal(false)}
                            style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                            textStyle={{ fontSize: 14 }}
                        />
                        <PremiumButton
                            title={t('exit_app_yes')}
                            variant="danger"
                            enableSound={true}
                            onPress={() => BackHandler.exitApp()}
                            style={{ flex: 1 }}
                            textStyle={{ fontSize: 14, fontFamily: 'Cinzel-Bold' }}
                        />
                    </View>
                </View>
            </PremiumModal>

            {/* [NEW] Mandatory Recovery Code Modal for New Users */}
            <PremiumModal
                visible={!!authUser?.isNew}
                onClose={() => { }}
                title={t('welcome_title')}
                showClose={false}
            >
                <View style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, paddingBottom: 20 }}>
                    <View style={{
                        width: 64, height: 64, borderRadius: 32,
                        backgroundColor: 'rgba(255, 206, 106, 0.1)',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255, 206, 106, 0.2)'
                    }}>
                        <LockIcon size={32} color={theme.colors.accent} />
                    </View>

                    <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 18, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>
                        {t('save_code_title')}
                    </Text>

                    <Text style={{ color: '#aaa', textAlign: 'center', fontFamily: 'Outfit', fontSize: 14, marginBottom: 20, lineHeight: 20, paddingHorizontal: 10 }}>
                        {t('save_code_msg')}
                    </Text>

                    <Animated.View style={[
                        {
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            paddingHorizontal: 30,
                            paddingVertical: 20,
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: theme.colors.accent,
                            marginBottom: 20,
                            width: '100%',
                            alignItems: 'center',
                            shadowColor: theme.colors.accent,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                        },
                        animatedCodeStyle
                    ]}>
                        <Text style={{ color: '#fff', fontFamily: 'Courier New', fontSize: 26, letterSpacing: 5, fontWeight: 'bold' }}>
                            {authUser?.recoveryCode}
                        </Text>
                    </Animated.View>

                    <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 12, marginBottom: 25, textAlign: 'center' }}>
                        {t('save_code_hint')} <Text style={{ color: '#888', fontWeight: 'bold' }}>{t('save_code_hint_bold')}</Text>
                    </Text>

                    <PremiumButton
                        title={t('code_saved_btn')}
                        onPress={() => {
                            Clipboard.setStringAsync(authUser.recoveryCode);
                            dismissNewUser();
                            setToast({ visible: true, message: t('code_saved_toast'), type: 'success' });
                        }}
                        style={{ backgroundColor: theme.colors.accent, width: '100%', height: 55 }}
                        textStyle={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 15 }}
                    />
                </View>
            </PremiumModal>

            {/* [NEW] Create Room Visibility Modal */}
            <PremiumModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={t('create_room_visibility_title')}
            >
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#aaa', fontFamily: 'Outfit', textAlign: 'center', marginBottom: 20 }}>
                        {t('create_room_visibility_msg')}
                    </Text>

                    <View style={{ width: '100%', gap: 15 }}>
                        <PremiumButton
                            title={t('visibility_private_btn')}
                            onPress={() => handleConfirmCreateRoom('private')}
                            style={{ backgroundColor: theme.colors.cardBackground, borderWidth: 1, borderColor: theme.colors.accent }}
                            textStyle={{
                                color: Platform.OS === 'web' ? '#171717ff' : 'rgba(231, 231, 231, 1)',
                                fontFamily: 'Cinzel-Bold',
                                fontWeight: '700'
                            }}
                        />
                        <PremiumButton
                            title={t('visibility_public_btn')}
                            onPress={() => handleConfirmCreateRoom('public')}
                            style={{ backgroundColor: theme.colors.accent }}
                            textStyle={{ color: '#18181b', fontFamily: 'Cinzel-Bold', fontWeight: '900' }}
                        />
                    </View>
                </View>
            </PremiumModal>

            {/* [NEW] Success Modal for Account Recovery */}
            <PremiumModal
                visible={!!authUser?.isRecovered}
                onClose={dismissRecovered}
                title={t('welcome_back_title')}
            >
                <View style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, paddingBottom: 20 }}>
                    <View style={{
                        width: 64, height: 64, borderRadius: 32,
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20,
                        borderWidth: 1.5,
                        borderColor: '#4ade80'
                    }}>
                        <ShieldIcon size={32} color="#4ade80" />
                    </View>

                    <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 18, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>
                        {t('account_recovered_title')}
                    </Text>

                    <Text style={{ color: '#aaa', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 25 }}>
                        {t('account_recovered_msg')}
                    </Text>

                    <PremiumButton
                        title={t('agree_btn')}
                        onPress={dismissRecovered}
                        style={{ backgroundColor: theme.colors.accent, width: '100%', height: 50 }}
                        textStyle={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 14 }}
                    />
                </View>
            </PremiumModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 100, // Reduced top padding
        paddingBottom: 40,
        minHeight: Dimensions.get('window').height + 1
    },
    frameContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    innerFrame: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 0,
        backgroundColor: '#0d0d0ddd',
        marginTop: 40,
        overflow: 'hidden',
    },
    mainTitle: {
        fontSize: 38,
        fontFamily: 'Cinzel-Bold',
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    rankBadgeContainer: {
        position: 'absolute',
        top: 25,
        left: 20,
        zIndex: 1000,
        borderRadius: 16,
    },
    rankBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.03)',
        gap: 10,
    },
    rankVerticalBar: {
        width: 3,
        height: 14,
        borderRadius: 1.5,
        opacity: 0.8,
    },
    rankTextLabel: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadowOffset: { width: 0, height: 0 },
        includeFontPadding: false,
        textAlignVertical: 'center',
    }
});

export default LobbyScreen;
