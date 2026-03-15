import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, ScrollView, BackHandler, Platform, TouchableOpacity, Pressable, PanResponder, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import PremiumPressable from '../components/PremiumPressable';
import PremiumToggle from '../components/PremiumToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import ConfirmationModal from '../components/ConfirmationModal';
import PremiumBackground from '../components/PremiumBackground';
import { useGame } from '../context/GameContext';
import ToastNotification from '../components/ToastNotification';
import AvatarWithFrame from '../components/AvatarWithFrame'; // [NEW]
import AvatarSelectionModal from '../components/AvatarSelectionModal'; // [NEW]

import { useTheme } from '../context/ThemeContext';
import { useAuth, RANK_COLORS, RANK_THRESHOLDS } from '../context/AuthContext';
import { PLAYER_AVATARS } from '../utils/constants'; // [NEW]
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext'; // [NEW]
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService';
import { APP_VERSION } from '../constants/Config';
import NotificationService from '../services/NotificationService'; // [NEW]
import Animated, { SlideInRight, SlideOutRight, SlideInLeft, SlideOutLeft, Easing, useSharedValue, withSpring, useAnimatedStyle, withTiming, withSequence, runOnJS, interpolateColor, useDerivedValue } from 'react-native-reanimated';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';

import { useRef } from 'react';

import { RulesIcon, SettingsIcon, LinkIcon, OpenDoorIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, ShieldIcon, CheckIcon, HornsIcon, CardsIcon, CopyIcon, BellIcon, DirtyCashIcon, EditIcon } from '../components/Icons';
import CardSuggestionModal from '../components/CardSuggestionModal';
import ClassyModal from '../components/ClassyModal';
import PremiumInput from '../components/PremiumInput';
import InfoScreen from './InfoScreen';
import { validateUsername } from '../utils/ValidationUtils';

const RANK_KEY_MAP = {
    "Anima Candida": "rank_anima_candida",
    "Innocente": "rank_innocente",
    "Corrotto": "rank_corrotto",
    "Socio del Vizio": "rank_socio_del_vizio",
    "Architetto del Caos": "rank_architetto_del_caos",
    "Eminenza Grigia": "rank_eminenza_grigia",
    "Entità Apocalittica": "rank_entita_apocalittica",
    "Capo supremo": "rank_capo_supremo",
    "Capo Supremo": "rank_capo_supremo",
    "BOT": "rank_bot"
};

const getRankKey = (rank) => {
    if (!rank) return 'rank_anima_candida';
    const cleanRank = rank.trim();
    return RANK_KEY_MAP[cleanRank] || `rank_${cleanRank.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')}`;
};

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

// Helper component for dynamic text color
const SettingsLanguageItem = ({ lang, translateX, theme }) => {
    const textStyle = useAnimatedStyle(() => {
        const isIt = lang === 'it';
        const color = interpolateColor(
            translateX.value,
            [2, 50],
            isIt
                ? ['#000000', theme.colors.textPrimary + '88']
                : [theme.colors.textPrimary + '88', '#000000']
        );
        return { color };
    });

    return (
        <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <Animated.Text style={[{ fontFamily: 'Cinzel-Bold', fontSize: 10 }, textStyle]}>
                {lang === 'it' ? 'IT' : 'EN'}
            </Animated.Text>
        </View>
    );
};

// Helper to safely add alpha to a hex string
const addAlpha = (hex, alpha) => {
    if (!hex) return '#ffffff00';
    if (hex.startsWith('#') && hex.length === 9) {
        return hex.substring(0, 7) + alpha;
    }
    if (hex.startsWith('#')) {
        return hex + alpha;
    }
    return hex;
};

const SettingsScreen = ({ navigation }) => {
    const { theme, animationsEnabled, toggleAnimations } = useTheme();
    const { isPlaying, toggleMusic } = useAudio(); // [NEW] Music Control
    const { leaveRoom, roomCode } = useGame();
    const { t, language, setLanguage } = useLanguage();
    const { logout, user, toggleNotificationSetting, updateProfile } = useAuth();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && windowWidth >= 1024;

    const languageRef = useRef(language);
    const touchedLang = useRef(null);
    const gestureStartLang = useRef(null);
    const isDraggingLang = useRef(false);

    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' }); // [MODIFIED] Consolidated Toast State
    const isGrabbingIndicatorLang = useRef(false);
    const isGrabbingSV = useSharedValue(false); // [FIX] Reactivity
    const langTranslateX = useSharedValue(language === 'en' ? 50 : 2);

    // [NEW] Anchors for hook
    const startX = useSharedValue(language === 'en' ? 50 : 2);
    const targetX = useSharedValue(language === 'en' ? 50 : 2);

    const langScale = useLiquidScale(langTranslateX, startX, targetX, isGrabbingSV, 1.15);
    const lastValidLang = useRef(language);

    // Sync Ref
    useEffect(() => {
        languageRef.current = language;
        lastValidLang.current = language;
        langTranslateX.value = withSpring(language === 'en' ? 50 : 2, { damping: 200, stiffness: 250 });
    }, [language]);

    const langPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
                return isHorizontal && Math.abs(gestureState.dx) > 5;
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                const { locationX } = evt.nativeEvent;
                if (locationX < 0 || locationX > 103) return;

                const hitLang = locationX > 50 ? 'en' : 'it';
                touchedLang.current = hitLang;
                const currentLang = languageRef.current;
                gestureStartLang.current = currentLang;

                const isGrabbing = (hitLang === currentLang);
                isGrabbingIndicatorLang.current = isGrabbing;
                isDraggingLang.current = true;

                if (isGrabbing) {
                    isGrabbingSV.value = true;
                    HapticsService.trigger('selection');
                    // Scale handled by derived value
                }
            },
            onPanResponderMove: (_, gestureState) => {
                const currentLang = languageRef.current;
                const isGrabbing = isGrabbingIndicatorLang.current;

                if (isGrabbing) {
                    const startX = currentLang === 'en' ? 50 : 2;
                    let newX = startX + gestureState.dx;
                    newX = Math.max(2, Math.min(newX, 50));
                    langTranslateX.value = newX;
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const isClick = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
                let targetLang;
                const currentLang = languageRef.current;

                if (isClick && touchedLang.current) {
                    targetLang = touchedLang.current;
                    if (targetLang !== currentLang) {
                        HapticsService.trigger('light');
                    }
                } else if (isGrabbingIndicatorLang.current) {
                    const center = 103 / 2; // 51.5
                    const currentPos = langTranslateX.value; // ~3 or ~50
                    // Add offset to position to determine center of knob (knob width ~47) -> center ~23.5
                    const knobCenter = currentPos + 23.5;
                    targetLang = knobCenter > center ? 'en' : 'it';
                } else {
                    targetLang = currentLang;
                }

                if (targetLang && targetLang !== currentLang) {
                    setLanguage(targetLang);
                    HapticsService.trigger('selection');
                }

                // [FIX] Anchors and Snap
                const targetPos = (targetLang || currentLang) === 'en' ? 50 : 2;
                updateLiquidAnchors(startX, targetX, isGrabbingSV, langTranslateX.value, targetPos);

                langTranslateX.value = withSpring(targetPos, SNAP_SPRING_CONFIG);

                isDraggingLang.current = false;
                isGrabbingIndicatorLang.current = false;
                touchedLang.current = null;
            }
        })
    ).current;

    const langIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: langTranslateX.value }, { scale: langScale.value }]
    }));

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false); // [NEW]
    const [nicknameModalVisible, setNicknameModalVisible] = useState(false); // [NEW]
    const [tempNickname, setTempNickname] = useState(user?.nickname || user?.username || ''); // [NEW]

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: "",
        message: "",
        singleButton: true,
        onConfirm: null,
        confirmText: t('ok_btn')
    });
    const [showExitAppModal, setShowExitAppModal] = useState(false);
    const [navDir, setNavDir] = useState('forward');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (user) {
            setTempNickname(user.nickname || user.username || '');
        }
    }, [user?.nickname, user?.username]);

    const loadSettings = async () => {
        try {
            // [FIX] Sound Source of Truth: SoundService (initialized in App.js)
            setSoundEnabled(!SoundService.isMuted());

            // Haptics handled locally/HapticsService
            const vibes = await AsyncStorage.getItem('cah_haptics');
            const isVibesOn = vibes !== 'false';
            setHapticsEnabled(isVibesOn);
            HapticsService.setEnabled(isVibesOn);
        } catch (e) { console.warn(e); }
    };

    const toggleSound = async (val) => {
        try {
            setSoundEnabled(val);
            // [FIX] Delegate persistence to Service
            await SoundService.setMuted(!val);
        } catch (error) {
            console.warn("Error toggling sound", error);
            setSoundEnabled(!val);
        }
    };

    const toggleHaptics = async (val) => {
        setHapticsEnabled(val);
        HapticsService.setEnabled(val);
        await AsyncStorage.setItem('cah_haptics', val.toString());
    };

    const showModal = (title, message, singleButton = true, onConfirm = null, confirmText = t('ok_btn')) => {
        setModalConfig({
            visible: true,
            title,
            message,
            singleButton,
            onConfirm,
            confirmText
        });
    };

    const handleShare = async () => {
        if (!roomCode) {
            setToast({ visible: true, message: t('no_code_msg'), type: 'error' });
            return;
        }
        await Clipboard.setStringAsync(roomCode);
        setToast({ visible: true, message: t('code_copied_msg', { code: roomCode }), type: 'success' });
    };

    const handleLeave = () => {
        showModal(
            t('leave_confirm_title'),
            t('leave_confirm_msg'),
            false,
            () => {
                leaveRoom();
                navigation.navigate('Lobby');
            },
            t('exit_btn_small')
        );
    };

    const handleLogout = () => {
        showModal(
            t('logout_confirm_title'),
            t('logout_confirm_msg'),
            false,
            () => {
                logout();
            },
            t('logout_account')
        );
    };

    const handleDeleteAccount = () => {
        // Step 1: Broad Confirmation
        showModal(
            t('delete_confirm_title'),
            t('delete_confirm_msg'),
            false,
            () => {
                // Step 2: Final Ireversible Confirmation
                setTimeout(() => {
                    showModal(
                        t('delete_final_confirm_title'),
                        t('delete_final_confirm_msg'),
                        false,
                        async () => {
                            try {
                                await deleteAccount();
                                // AuthContext should take care of state and navigation (via Auth state change)
                            } catch (e) {
                                console.error("Account deletion failed", e);
                                showModal(t('login_error_title'), e.message);
                            }
                        },
                        t('delete_account')
                    );
                }, 500); // Small delay for UX between modals
            },
            t('delete_account')
        );
    };

    // Android Back Handler
    useFocusEffect(
        useCallback(() => {
            // [RE-APPLYING FIX] Reset sub-sections when coming back or leaving, ensuring fresh state
            return () => {
                setShowRules(false);
                setShowPreferences(false);
                setShowNotifications(false);
                setShowAccount(false);
                setShowInfo(false);
                setShowRecoveryCode(false); // [FIX] Re-hide recovery code when leaving screen
            };
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const backAction = () => {
                // If sub-preferences are open, go back to main settings
                if (showNotifications) {
                    setShowNotifications(false);
                    return true;
                }
                if (showRules || showPreferences || showAccount || showInfo) {
                    handleBack();
                    return true;
                }
                setShowExitAppModal(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }, [showRules, showPreferences, showNotifications, showAccount, showInfo])
    );

    // [FIX] Reset sub-sections when leaving the screen
    useFocusEffect(
        useCallback(() => {
            return () => {
                setShowRules(false);
                setShowPreferences(false);
                setShowAccount(false);
                setShowInfo(false);
            };
        }, [])
    );

    const handleBack = () => {
        setNavDir('back');
        setTimeout(() => {
            setShowRules(false);
            setShowPreferences(false);
            setShowNotifications(false);
            setShowAccount(false);
            setShowInfo(false);
            setShowRecoveryCode(false); // [FIX] Re-hide recovery code when going back
        }, 0);
    };

    // [NEW] Handle avatar selection from modal
    const handleAvatarSelect = async (seed) => {
        try {
            await updateProfile({ avatar: seed });
            setAvatarModalVisible(false);
            setToast({ visible: true, message: t('avatar_changed', { defaultValue: 'Avatar aggiornato!' }), type: 'success' });
        } catch (e) {
            console.warn('Avatar update failed', e);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            {/* Desktop: center content, mobile: stretch */}
            <View style={isDesktop ? { flex: 1, alignItems: 'center', justifyContent: 'center' } : { flex: 1 }}>
                <View style={[
                    styles.container,
                    isDesktop && {
                        width: '100%',
                        maxWidth: 720,
                        paddingHorizontal: 40,
                    }
                ]}>
                    <ToastNotification
                        visible={toast.visible}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ ...toast, visible: false })}
                    />

                    {/* [NEW] Avatar Selection Modal */}
                    <AvatarSelectionModal
                        visible={avatarModalVisible}
                        onClose={() => setAvatarModalVisible(false)}
                        onSelect={handleAvatarSelect}
                        currentAvatar={user?.avatar || 'user'}
                        avatars={PLAYER_AVATARS}
                    />

                    {showRules ? (
                        <Animated.View
                            key="rules"
                            entering={(navDir === 'forward' ? SlideInRight : SlideInLeft).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            exiting={(navDir === 'forward' ? SlideOutLeft : SlideOutRight).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            style={[StyleSheet.absoluteFill, { padding: 20, paddingTop: 50, paddingBottom: 80 + insets.bottom }]}
                        >
                            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 15 }} contentContainerStyle={{ paddingBottom: 30 }}>
                                <View style={{ gap: 20 }}>
                                    {/* Introduction */}
                                    <View style={{ alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{ width: 40, height: 1.5, backgroundColor: theme.colors.accent, opacity: 0.5, marginBottom: 15 }} />
                                        <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 18, letterSpacing: 2 }}>{t('criminal_manual').toUpperCase()}</Text>
                                        <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 12, marginTop: 4 }}>{t('rule_intro_subtitle')}</Text>
                                    </View>

                                    {/* Section 1: Objective */}
                                    <RuleCard
                                        title={t('rule_objective_title')}
                                        icon={<ShieldIcon size={16} color={theme.colors.accent} />}
                                        content={t('rule_objective_content')}
                                    />

                                    {/* Section 2: Flow */}
                                    <RuleCard
                                        title={t('rule_dynamics_title')}
                                        icon={<SettingsIcon size={16} color={theme.colors.accent} />}
                                        content={[
                                            t('rule_dynamics_1'),
                                            t('rule_dynamics_2'),
                                            t('rule_dynamics_3'),
                                            t('rule_dynamics_4'),
                                            t('rule_dynamics_5')
                                        ]}
                                    />

                                    {/* Section 3: Gradi */}
                                    <RuleCard
                                        title={t('rule_ranks_title')}
                                        icon={<RulesIcon size={16} color={theme.colors.accent} />}
                                        content={[
                                            <Text key="ac"><Text style={{ color: RANK_COLORS["Anima Candida"], fontWeight: 'bold' }}>{t('rank_anima_candida')}</Text> (0 DC)</Text>,
                                            <Text key="in"><Text style={{ color: RANK_COLORS["Innocente"], fontWeight: 'bold' }}>{t('rank_innocente')}</Text> (1.000 DC)</Text>,
                                            <Text key="co"><Text style={{ color: RANK_COLORS["Corrotto"], fontWeight: 'bold' }}>{t('rank_corrotto')}</Text> (2.500 DC)</Text>,
                                            <Text key="sv"><Text style={{ color: RANK_COLORS["Socio del Vizio"] || '#eab308', fontWeight: 'bold' }}>{t('rank_socio_del_vizio')}</Text> (5.000 DC)</Text>,
                                            <Text key="chk"><Text style={{ color: RANK_COLORS["Architetto del Caos"] || '#f97316', fontWeight: 'bold' }}>{t('rank_architetto_del_caos')}</Text> (10.000 DC)</Text>,
                                            <Text key="eg"><Text style={{ color: RANK_COLORS["Eminenza Grigia"], fontWeight: 'bold' }}>{t('rank_eminenza_grigia')}</Text> (25.000 DC)</Text>,
                                            <Text key="ea"><Text style={{ color: RANK_COLORS["Entità Apocalittica"], fontWeight: 'bold' }}>{t('rank_entita_apocalittica')}</Text> (50.000 DC)</Text>
                                        ]}
                                    />

                                    {/* Section 4: Economy */}
                                    <RuleCard
                                        title={t('rule_economy_title')}
                                        icon={<CheckIcon size={16} color={theme.colors.accent} />}
                                        content={[
                                            t('rule_economy_1'),
                                            t('rule_economy_2'),
                                            t('rule_economy_3'),
                                            t('rule_economy_footer')
                                        ]}
                                    />

                                    {/* Section 5: Chaos */}
                                    <RuleCard
                                        title={t('rule_chaos_title')}
                                        icon={<HornsIcon size={16} color={theme.colors.accent} />}
                                        content={[
                                            <Text key="desc" style={{ marginBottom: 10 }}>{t('chaos_intro_desc')}</Text>,
                                            <Text key="inf" style={{ marginBottom: 4 }}>• {t('chaos_event_inflation_title')}: {t('chaos_event_inflation_desc')}</Text>,
                                            <Text key="blk" style={{ marginBottom: 4 }}>• {t('chaos_event_blackout_title')}: {t('chaos_event_blackout_desc')}</Text>,
                                            <Text key="dic" style={{ marginBottom: 4 }}>• {t('chaos_event_dictatorship_title')}: {t('chaos_event_dictatorship_desc')}</Text>,
                                            <Text key="swp" style={{ marginBottom: 4 }}>• {t('chaos_event_identity_swap_title')}: {t('chaos_event_identity_swap_desc')}</Text>,
                                            <Text key="rob" style={{ marginBottom: 4 }}>• {t('chaos_event_robin_hood_title')}: {t('chaos_event_robin_hood_desc')}</Text>,
                                            <Text key="drt">• {t('chaos_event_dirty_win_title')}: {t('chaos_event_dirty_win_desc')}</Text>
                                        ]}
                                    />
                                </View>
                            </ScrollView>

                            <PremiumPressable
                                onPress={handleBack}
                                enableSound={false}
                                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                            >
                                <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                            </PremiumPressable>
                        </Animated.View>
                    ) : showNotifications ? (
                        <Animated.View
                            key="notifications"
                            entering={(navDir === 'forward' ? SlideInRight : SlideInLeft).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            exiting={(navDir === 'forward' ? SlideOutLeft : SlideOutRight).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            style={[StyleSheet.absoluteFill, { padding: 20, paddingTop: 50, gap: 15, paddingBottom: 80 + insets.bottom }]}
                        >
                            <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                                <View style={[styles.row, { borderTopWidth: 0, paddingTop: 6 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_friend_room')}</Text>
                                        <Text style={styles.rowSub}>{t('notify_friend_room_desc', { defaultValue: 'Ricevi una notifica quando un amico crea una stanza.' })}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={user?.notificationSettings?.notifyFriendRoom !== false}
                                        onValueChange={() => toggleNotificationSetting('notifyFriendRoom', user?.notificationSettings?.notifyFriendRoom !== false)}
                                    />
                                </View>

                                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_room_join')}</Text>
                                        <Text style={styles.rowSub}>{t('notify_room_join_desc', { defaultValue: 'Ricevi una notifica quando qualcuno entra nella tua stanza.' })}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={user?.notificationSettings?.notifyRoomJoin !== false}
                                        onValueChange={() => toggleNotificationSetting('notifyRoomJoin', user?.notificationSettings?.notifyRoomJoin !== false)}
                                    />
                                </View>

                                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_daily_dc')}</Text>
                                        <Text style={styles.rowSub}>{t('notify_daily_dc_desc', { defaultValue: 'Ricevi un promemoria per il tuo bonus quotidiano 24h dopo averlo riscosso.' })}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={user?.notificationSettings?.notifyDailyDc !== false}
                                        onValueChange={() => toggleNotificationSetting('notifyDailyDc', user?.notificationSettings?.notifyDailyDc !== false)}
                                    />
                                </View>

                                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_friend_request')}</Text>
                                        <Text style={styles.rowSub}>{t('notify_friend_request_desc', { defaultValue: 'Ricevi una notifica quando qualcuno ti invia una richiesta di amicizia.' })}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={user?.notificationSettings?.notifyFriendRequest !== false}
                                        onValueChange={() => toggleNotificationSetting('notifyFriendRequest', user?.notificationSettings?.notifyFriendRequest !== false)}
                                    />
                                </View>

                                {/* [DEV] Test Notification Button */}
                                {__DEV__ && (
                                    <PremiumPressable
                                        onPress={() => NotificationService.testNotification()}
                                        style={{ marginTop: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, paddingVertical: 12 }}
                                        contentContainerStyle={{ alignItems: 'center' }}
                                    >
                                        <Text style={{ color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 14 }}>
                                            Test Notifica (DEV)
                                        </Text>
                                    </PremiumPressable>
                                )}
                            </View>

                            <PremiumPressable
                                onPress={() => { setNavDir('back'); setTimeout(() => setShowNotifications(false), 0); }}
                                enableSound={false}
                                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                            >
                                <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                            </PremiumPressable>
                        </Animated.View>
                    ) : showPreferences ? (
                        <Animated.View
                            key="preferences"
                            entering={(navDir === 'forward' ? SlideInRight : SlideInLeft).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            exiting={(navDir === 'forward' ? SlideOutLeft : SlideOutRight).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            style={[StyleSheet.absoluteFill, { padding: 20, paddingTop: 50, gap: 15, paddingBottom: 80 + insets.bottom }]}
                        >
                            <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>

                                {/* LANGUAGE TOGGLE */}
                                <View style={styles.row}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('select_language')}</Text>
                                        <Text style={styles.rowSub}>{language === 'it' ? 'Italiano' : 'English'}</Text>
                                    </View>
                                    <View
                                        style={{
                                            position: 'relative',
                                            flexDirection: 'row',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: 10,
                                            padding: 3,
                                            width: 103,
                                            height: 32
                                        }}
                                        {...langPanResponder.panHandlers}
                                    >
                                        {/* Animated Indicator */}
                                        <Animated.View
                                            style={[
                                                {
                                                    position: 'absolute',
                                                    left: 2,
                                                    top: 3,
                                                    width: 47,
                                                    height: 26,
                                                    borderRadius: 8,
                                                    backgroundColor: theme.colors.accent || '#d4af37'
                                                },
                                                langIndicatorStyle
                                            ]}
                                            pointerEvents="none"
                                        />
                                        {/* Static Labels */}
                                        {/* Dynamic Labels */}
                                        <SettingsLanguageItem lang="it" translateX={langTranslateX} theme={theme} />
                                        <SettingsLanguageItem lang="en" translateX={langTranslateX} theme={theme} />
                                    </View>
                                </View>

                                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 }} />

                                <View style={styles.row}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('vibration')}</Text>
                                        <Text style={styles.rowSub}>{t('tactile_feedback')}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={hapticsEnabled}
                                        onValueChange={toggleHaptics}
                                    />
                                </View>
                                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('bg_animations')}</Text>
                                        <Text style={styles.rowSub}>{t('particles_effects')}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={animationsEnabled}
                                        onValueChange={toggleAnimations}
                                    />
                                </View>
                                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('sound_effects')}</Text>
                                        <Text style={styles.rowSub}>{t('sounds_notifs')}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={soundEnabled}
                                        onValueChange={toggleSound}
                                    />
                                </View>

                                <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('music_label')}</Text>
                                        <Text style={styles.rowSub}>{t('music_sub')}</Text>
                                    </View>
                                    <PremiumToggle
                                        value={isPlaying}
                                        onValueChange={toggleMusic}
                                    />
                                </View>

                                {/* Notifications Sub-row → lateral slide */}
                                {/* Notifications Sub-row → lateral slide */}
                                <TouchableOpacity
                                    onPress={() => { setNavDir('forward'); setTimeout(() => setShowNotifications(true), 0); }}
                                    activeOpacity={0.7}
                                    style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}
                                >
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                                            {t('notifications_label', { defaultValue: 'NOTIFICHE' })}
                                        </Text>
                                        <Text style={styles.rowSub}>{t('notifications_sub', { defaultValue: 'Inviti amici e stanze' })}</Text>
                                    </View>
                                    <Text style={{ color: theme.colors.textPrimary, fontSize: 24, opacity: 0.2, marginRight: 4 }}>›</Text>
                                </TouchableOpacity>
                            </View>
                            <PremiumPressable
                                onPress={handleBack}
                                enableSound={false}
                                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 0 }]}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                            >
                                <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                            </PremiumPressable>
                        </Animated.View>

                    ) : showAccount ? (
                        <Animated.View
                            key="account"
                            entering={(navDir === 'forward' ? SlideInRight : SlideInLeft).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            exiting={(navDir === 'forward' ? SlideOutLeft : SlideOutRight).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            style={[StyleSheet.absoluteFill, { padding: 20, paddingTop: 50, gap: 15, paddingBottom: 80 + insets.bottom }]}
                        >
                            {/* Profile Header */}
                            <View style={{ alignItems: 'center', marginBottom: 10 }}>
                                {/* Avatar with Glow Effect */}
                                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                                    <TouchableOpacity
                                        onPress={() => setAvatarModalVisible(true)}
                                        activeOpacity={0.8}
                                    >
                                        <AvatarWithFrame
                                            avatar={user?.avatar || 'user'}
                                            frameId={user?.activeFrame || 'basic'}
                                            size={80}
                                        />
                                        {/* Edit badge */}
                                        <View style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: theme.colors.accent,
                                            borderRadius: 12,
                                            width: 24,
                                            height: 24,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 10
                                        }}>
                                            <EditIcon size={16} color="#000" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Main Name (Nickname) */}
                                <TouchableOpacity
                                    onPress={() => setNicknameModalVisible(true)}
                                    activeOpacity={0.6}
                                    style={{ alignItems: 'center', paddingHorizontal: 30, paddingVertical: 10 }}
                                    hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Text style={{
                                            color: '#fff',
                                            fontFamily: 'Cinzel-Bold',
                                            fontSize: 24,
                                            letterSpacing: 1,
                                            textAlign: 'center'
                                        }}>
                                            {user?.nickname || user?.username || "Incognito"}
                                        </Text>
                                        <View>
                                            <EditIcon size={20} color={theme.colors.accent} />
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* Secondary Handle (Username) - Always visible if a separate nickname exists */}
                                {user?.nickname && (
                                    <Text style={{
                                        color: theme.colors.accent,
                                        opacity: 0.6,
                                        fontFamily: 'Outfit-Bold',
                                        fontSize: 12,
                                        marginTop: 2,
                                        letterSpacing: 0.5,
                                        textTransform: 'none'
                                    }}>
                                        @{user?.username}
                                    </Text>
                                )}

                                {/* Rank Display Integration */}
                                {(() => {
                                    const score = user?.totalScore || 0;
                                    const currentRankIdx = RANK_THRESHOLDS.findIndex(r => r.name.toLowerCase() === (user?.rank || '').toLowerCase().trim());
                                    const nextRank = currentRankIdx !== -1 && currentRankIdx < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[currentRankIdx + 1] : null;
                                    const currentRankMin = RANK_THRESHOLDS[currentRankIdx]?.min || 0;
                                    const rankColor = getRankColor(user?.rank);

                                    let progress = 0;
                                    let pointsLeft = 0;
                                    if (nextRank) {
                                        const range = nextRank.min - currentRankMin;
                                        const relativeScore = score - currentRankMin;
                                        progress = Math.min(Math.max(relativeScore / range, 0), 1);
                                        pointsLeft = Math.max(nextRank.min - score, 0);
                                    }

                                    return (
                                        <View style={{
                                            width: '85%',
                                            marginTop: 15,
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            borderRadius: 24,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.04)',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Top Section: Rank */}
                                            <View style={{ padding: 16, alignItems: 'center' }}>
                                                <Text style={{ color: rankColor, fontFamily: 'Cinzel-Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                                                    {t(getRankKey(user?.rank))}
                                                </Text>

                                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit-Bold', fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>
                                                    {score.toLocaleString()} SCORE
                                                </Text>

                                                {nextRank ? (() => {
                                                    const nextRankName = t(getRankKey(nextRank.name));
                                                    const nextRankColor = getRankColor(nextRank.name);
                                                    const nextRankPointsFull = t('next_rank_points', {
                                                        points: pointsLeft.toLocaleString(),
                                                        rank: 'RANK_HOLDER'
                                                    });
                                                    const [prefix, suffix] = nextRankPointsFull.split('RANK_HOLDER');

                                                    return (
                                                        <View style={{ width: '100%', paddingHorizontal: 4 }}>
                                                            <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1.5, overflow: 'hidden', width: '100%' }}>
                                                                <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: rankColor, borderRadius: 1.5 }} />
                                                            </View>
                                                            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6, fontFamily: 'Outfit', textAlign: 'center' }}>
                                                                {prefix}
                                                                <Text style={{ color: nextRankColor, fontFamily: 'Outfit-Bold' }}>{nextRankName}</Text>
                                                                {suffix}
                                                            </Text>
                                                        </View>
                                                    );
                                                })() : (
                                                    <Text style={{ fontSize: 10, color: '#ffd700', marginTop: 4, fontFamily: 'Outfit', textAlign: 'center', fontWeight: 'bold' }}>
                                                        {t('max_rank_reached') || "RANK MASSIMO RAGGIUNTO"}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Divider */}
                                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', width: '100%', marginTop: 4 }} />

                                            {/* Bottom Section: Quick Stats Row */}
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                backgroundColor: 'rgba(255,255,255,0.01)',
                                                paddingVertical: 18,
                                                paddingHorizontal: 10
                                            }}>
                                                <View style={{ flex: 1, alignItems: 'center' }}>
                                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Cinzel-Bold', fontSize: 15 }}>
                                                        {Object.keys(user?.friends || {}).length}
                                                    </Text>
                                                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                                                        {t('friends') || "Complici"}
                                                    </Text>
                                                </View>
                                                <View style={{ width: 1, height: '50%', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'center' }} />
                                                <View style={{ flex: 1, alignItems: 'center' }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 15 }}>
                                                            {user?.balance?.toLocaleString() || 0}
                                                        </Text>
                                                        <DirtyCashIcon size={12} color={theme.colors.accent} />
                                                    </View>
                                                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                                                        Dirty Cash
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>


                            {/* [FIX] Recovery Code Logic - Premium Style v3 (User Request - High Class) */}
                            {user?.recoveryCode && (
                                <View style={{ marginTop: 15, marginBottom: 10 }}>
                                    {/* L'etichetta sopra è più elegante e visibile di una nota a pié di pagina microscopica */}
                                    <Text style={{
                                        color: 'rgba(255,255,255,0.4)',
                                        fontSize: 12,
                                        marginBottom: 6,
                                        marginLeft: 4,
                                        fontFamily: 'Outfit',
                                        fontWeight: '500'
                                    }}>
                                        {t('recovery_zone') || "Codice di Recupero 🔐"}
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row',
                                        backgroundColor: theme.colors.surface || 'rgba(0,0,0,0.35)',
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: showRecoveryCode
                                            ? addAlpha(theme.colors.accent, '66')
                                            : addAlpha(theme.colors.textPrimary || '#fff', '22'),
                                        height: 56,
                                        alignItems: 'center',
                                        paddingLeft: 20,
                                        paddingRight: 8,
                                        shadowColor: 'transparent',
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0,
                                        shadowRadius: 0,
                                        elevation: 0,
                                    }}>
                                        {/* Display del codice */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                color: showRecoveryCode ? '#FFF' : '#666',
                                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Niente Courier New, per pietà
                                                fontSize: 18,
                                                letterSpacing: showRecoveryCode ? 3 : 5,
                                                fontWeight: '700',
                                                // Un leggero glow sul testo per simulare uno schermo hacker
                                                textShadowColor: showRecoveryCode ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                                textShadowOffset: { width: 0, height: 0 },
                                                textShadowRadius: 8
                                            }}>
                                                {showRecoveryCode ? user.recoveryCode : "•••-••••"}
                                            </Text>
                                        </View>

                                        {/* Gruppo Bottoni */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {/* Reveal Toggle */}
                                            <PremiumPressable
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 12,
                                                    backgroundColor: showRecoveryCode ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                    borderWidth: 1,
                                                    borderColor: showRecoveryCode ? 'rgba(255,255,255,0.1)' : 'transparent'
                                                }}
                                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                                                onPress={() => setShowRecoveryCode(!showRecoveryCode)}
                                            >
                                                {showRecoveryCode ? (
                                                    // Quando è visibile, l'icona prende il colore di accento
                                                    <EyeOffIcon size={20} color={theme.colors.accent} />
                                                ) : (
                                                    <EyeIcon size={20} color="#666" />
                                                )}
                                            </PremiumPressable>

                                            {/* Copy Button - Balanced */}
                                            <PremiumPressable
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    marginLeft: 4,
                                                    borderRadius: 12,
                                                    backgroundColor: 'transparent', // No more "Lego brick" block
                                                    borderWidth: 1,
                                                    borderColor: addAlpha(theme.colors.accent, '33') // Subtle accent ring instead
                                                }}
                                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                                                onPress={() => {
                                                    Clipboard.setStringAsync(user.recoveryCode);
                                                    // [FIX] Use state instead of non-existent .show() method
                                                    setToastMessage(t('copied_toast_title') || "Codice copiato negli appunti!");
                                                    setToastVisible(true);
                                                }}
                                            >
                                                <CopyIcon size={18} color={theme.colors.accent} />
                                            </PremiumPressable>
                                        </View>
                                    </View>

                                    {/* Minimal Label below - resa leggibile agli esseri umani */}
                                    <Text style={{
                                        color: '#555',
                                        fontSize: 10,
                                        marginTop: 6,
                                        textAlign: 'center',
                                        fontFamily: 'Outfit'
                                    }}>
                                        {t('recovery_tap_reveal')}
                                    </Text>
                                </View>
                            )}

                            {/* Account Actions Group - Consistent and balanced */}
                            <View style={{
                                flexDirection: 'row',
                                gap: 12,
                                marginTop: 20,
                                width: '100%',
                                paddingHorizontal: 0
                            }}>
                                <PremiumPressable
                                    style={{
                                        flex: 1,
                                        height: 52,
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.02)'
                                    }}
                                    onPress={handleLogout}
                                    enableSound={false}
                                    contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}
                                >
                                    <OpenDoorIcon size={18} color="rgba(255, 255, 255, 0.6)" />
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Outfit-Bold', fontSize: 13 }}>
                                        {t('logout_account')}
                                    </Text>
                                </PremiumPressable>

                                <PremiumPressable
                                    style={{
                                        flex: 1,
                                        height: 52,
                                        backgroundColor: 'rgba(239, 68, 68, 0.06)',
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: 'rgba(239, 68, 68, 0.1)'
                                    }}
                                    onPress={handleDeleteAccount}
                                    enableSound={false}
                                    contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: '100%' }}
                                >
                                    <ShieldIcon size={18} color="rgba(239, 68, 68, 0.6)" />
                                    <Text style={{ color: 'rgba(239, 68, 68, 0.6)', fontFamily: 'Outfit-Bold', fontSize: 13 }}>
                                        {t('delete_account')}
                                    </Text>
                                </PremiumPressable>
                            </View>

                            <PremiumPressable
                                onPress={handleBack}
                                enableSound={false}
                                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 0, marginTop: 10 }]}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                            >
                                <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back')}</Text>
                            </PremiumPressable>
                        </Animated.View>
                    ) : (
                        <Animated.View
                            key="main"
                            entering={(navDir === 'forward' ? SlideInRight : SlideInLeft).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            exiting={(navDir === 'forward' ? SlideOutLeft : SlideOutRight).duration(250).easing(Easing.bezier(0.25, 0.46, 0.45, 0.94))}
                            style={[StyleSheet.absoluteFill, { padding: 20 }]}
                        >
                            <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 24, marginTop: isDesktop ? 35 : 50, marginBottom: 20, textAlign: 'center' }}>
                                {t('settings')}
                            </Text>

                            <View>
                                <CategoryTile
                                    title={t('audio_anim_lang')}
                                    subtitle={t('subj_audio_anim_lang')}
                                    icon={<SettingsIcon size={24} color={theme.colors.accent} />}
                                    color={theme.colors.accent}
                                    onPress={() => { setNavDir('forward'); setTimeout(() => setShowPreferences(true), 0); }}
                                />
                                {!roomCode && (
                                    <CategoryTile
                                        title={t('account')}
                                        subtitle={t('recovery_security')}
                                        icon={<EyeIcon size={24} color="#ef4444" />}
                                        color="#ef4444"
                                        onPress={() => { setNavDir('forward'); setTimeout(() => setShowAccount(true), 0); }}
                                    />
                                )}
                                <CategoryTile
                                    title={t('rules')}
                                    subtitle={t('criminal_manual')}
                                    icon={<RulesIcon size={24} color="#3b82f6" />}
                                    color="#3b82f6"
                                    onPress={() => { setNavDir('forward'); setTimeout(() => setShowRules(true), 0); }}
                                />
                                <CategoryTile
                                    title={t('suggest_card_title') || "Consiglio Carte"}
                                    subtitle={t('suggest_card_desc_cost') || "Invia una tua idea (Costo: 25 DC)"}
                                    icon={<CardsIcon size={24} color={theme.colors.accent} />}
                                    color={theme.colors.accent}
                                    onPress={() => setSuggestionModalVisible(true)}
                                />
                            </View>

                            {roomCode && (
                                <View style={{ marginTop: 20 }}>
                                    <View style={{ marginBottom: 10 }}>
                                        <SecondaryAction
                                            icon={<LinkIcon size={18} color="#eab308" />}
                                            label={t('copy_code')}
                                            onPress={handleShare}
                                            bgColor="rgba(234, 179, 8, 0.1)"
                                            color="#eab308"
                                        />
                                    </View>
                                    <SecondaryAction
                                        icon={<OpenDoorIcon size={18} color="#ef4444" />}
                                        label={t('leave_room')}
                                        onPress={handleLeave}
                                        bgColor="rgba(239, 68, 68, 0.1)"
                                        color="#ef4444"
                                    />
                                </View>
                            )}

                            <View style={{ marginTop: 25, alignItems: 'center', paddingBottom: 10 }}>
                                <PremiumPressable
                                    onPress={() => setShowInfo(true)}
                                    style={{ borderRadius: 10 }}
                                    contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 5 }}
                                >
                                    <Text style={{ fontFamily: 'Outfit', fontSize: 11, color: '#666', textDecorationLine: 'underline', letterSpacing: 0.5 }}>
                                        {t('info_privacy')}
                                    </Text>
                                </PremiumPressable>
                                <Text style={{ textAlign: 'center', color: '#666', fontSize: 9, fontFamily: 'Outfit', marginTop: 4, opacity: 0.4 }}>
                                    {t('version')} {APP_VERSION}
                                </Text>
                            </View>
                        </Animated.View>
                    )
                    }

                    <ConfirmationModal
                        visible={modalConfig.visible}
                        onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                        title={modalConfig.title}
                        message={modalConfig.message}
                        singleButton={modalConfig.singleButton}
                        onConfirm={modalConfig.onConfirm}
                        confirmText={modalConfig.confirmText}
                    />

                </View>
            </View>

            <ConfirmationModal
                visible={showExitAppModal}
                onClose={() => setShowExitAppModal(false)}
                title={t('exit_app_title')}
                message={t('exit_app_msg')}
                confirmText={t('exit_btn_small')}
                onConfirm={() => BackHandler.exitApp()}
            />

            {
                showInfo && (
                    <View style={StyleSheet.absoluteFill}>
                        <InfoScreen onClose={() => setShowInfo(false)} />
                    </View>
                )
            }

            <CardSuggestionModal
                visible={suggestionModalVisible}
                onClose={() => setSuggestionModalVisible(false)}
                onSuccess={() => setShowSuccessToast(true)}
            />

            <ToastNotification
                visible={showSuccessToast}
                message={t('suggest_card_success') || "Grazie per il tuo contributo!"}
                type="success"
                onClose={() => setShowSuccessToast(false)}
            />

            {/* Nickname Editing Modal */}
            <ClassyModal
                visible={nicknameModalVisible}
                onClose={() => setNicknameModalVisible(false)}
                title={t('edit_profile') || "Edit Profile"}
                icon={<EditIcon size={40} color={theme.colors.accent} />}
            >
                <View style={{ width: '100%', paddingVertical: 10 }}>
                    <PremiumInput
                        label={t('nickname_label') || "Nickname"}
                        value={tempNickname}
                        onChangeText={setTempNickname}
                        placeholder={t('nickname_placeholder') || "Enter nickname"}
                        style={{ marginBottom: 20 }}
                        labelBackgroundColor="#121214"
                    />

                    <PremiumPressable
                        onPress={async () => {
                            const trimmed = tempNickname.trim();
                            if (!trimmed) {
                                setToast({ visible: true, message: t('login_error_missing_name'), type: 'error' });
                                SoundService.play('error');
                                return;
                            }

                            const validation = validateUsername(trimmed);
                            if (!validation.valid) {
                                let errorMsg = t('login_error_missing_name');
                                if (validation.error === 'username_too_short') errorMsg = t('error_username_too_short');
                                else if (validation.error === 'username_too_long') errorMsg = t('error_username_too_long');
                                else if (validation.error === 'username_invalid_chars') errorMsg = t('error_username_invalid_chars');
                                else if (validation.error === 'username_offensive') errorMsg = t('error_offensive_name');

                                setToast({ visible: true, message: errorMsg, type: 'error' });
                                SoundService.play('error');
                                return;
                            }

                            try {
                                await updateProfile({ nickname: trimmed });
                                setNicknameModalVisible(false);
                                setToast({ visible: true, message: t('profile_updated_success') || "Profilo aggiornato!", type: 'success' });
                                SoundService.play('success');
                            } catch (e) {
                                setToast({ visible: true, message: e.message || "Update failed", type: 'error' });
                                SoundService.play('error');
                            }
                        }}
                        style={{
                            backgroundColor: theme.colors.accent,
                            borderRadius: 15,
                        }}
                        contentContainerStyle={{
                            paddingVertical: 12,
                            alignItems: 'center'
                        }}
                        borderRadius={15}
                    >
                        <Text style={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 16 }}>
                            {t('save_btn') || "SAVE"}
                        </Text>
                    </PremiumPressable>
                </View>
            </ClassyModal>

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type || 'success'}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const CategoryTile = ({ title, subtitle, icon, color, onPress }) => {
    const { theme } = useTheme();
    const effectiveColor = color || theme.colors.accent;

    return (
        <PremiumPressable
            style={{ width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 12 }}
            pressableStyle={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 25,
                minHeight: 80,
                paddingVertical: 12,
                justifyContent: 'center', // [FIX] Vertically center the content
            }}
            contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 32,
                paddingRight: 22,
                // height: '100%' removed to avoid layout collapse
            }}
            onPress={onPress}
            enableSound={false}
        >
            <View style={{
                width: 42,
                height: 42,
                borderRadius: 50, // [FIX] Ensure perfect circle
                backgroundColor: addAlpha(effectiveColor, '22'),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
                borderWidth: 1,
                borderColor: addAlpha(effectiveColor, '44')
            }}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1.2 }}>{title}</Text>
                <Text style={{ color: theme.colors.textPrimary + '44', fontFamily: 'Outfit', fontSize: 10, marginTop: 5 }}>{subtitle}</Text>
            </View>
            <View style={{ opacity: 0.4, marginRight: 5 }}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <ArrowLeftIcon size={18} color={theme.colors.textPrimary + '44'} />
                </View>
            </View>
        </PremiumPressable>
    );
};

const SecondaryAction = ({ icon, label, onPress, bgColor, color }) => {
    return (
        <PremiumPressable
            style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }}
            pressableStyle={{ backgroundColor: bgColor, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 14 }}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
            onPress={onPress}
        >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </View>
            <Text style={{ color: color, fontFamily: 'Cinzel-Bold', fontSize: 11, letterSpacing: 1.5 }}>{label}</Text>
        </PremiumPressable>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    ruleText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#bbb',
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    backButtonText: {
        color: '#fff',
        fontFamily: 'Cinzel-Bold',
        letterSpacing: 1,
        fontSize: 14,
    },
    settingsGroup: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLabel: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Cinzel-Bold',
    },
    rowSub: {
        color: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Outfit',
        marginTop: 1,
    },
    menuCard: {
        width: '100%',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    menuCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        gap: 8,
    },
    menuCardIconWrap: {
        width: 30, // Reduced from 32
        height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuCardText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 13,
    },
});

const RuleCard = ({ title, icon, content }) => {
    const { theme } = useTheme();
    return (
        <View style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.05)',
            padding: 20,
            overflow: 'hidden'
        }}>
            {/* Background Accent Gradient */}
            <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
                <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </View>
                <Text style={{
                    color: theme.colors.textPrimary,
                    fontFamily: 'Cinzel-Bold',
                    fontSize: 13,
                    letterSpacing: 1.5
                }}>{title}</Text>
            </View>

            {Array.isArray(content) ? (
                <View style={{ gap: 8 }}>
                    {content.map((item, i) => (
                        <Text key={i} style={{
                            color: '#94a3b8',
                            fontFamily: 'Outfit',
                            fontSize: 13,
                            lineHeight: 18
                        }}>
                            {item}
                        </Text>
                    ))}
                </View>
            ) : (
                <Text style={{
                    color: '#94a3b8',
                    fontFamily: 'Outfit',
                    fontSize: 13,
                    lineHeight: 18
                }}>
                    {content}
                </Text>
            )}
        </View>
    );
};

export default SettingsScreen;
