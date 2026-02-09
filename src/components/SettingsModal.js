import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Share, Alert, Image, TouchableOpacity, Platform } from 'react-native';
import PremiumPressable from './PremiumPressable';
import PremiumToggle from './PremiumToggle'; // [NEW]
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import ThemeSelectionModal from './ThemeSelectionModal';
import SkinSelectionModal from './SkinSelectionModal'; // [NEW]
import ConfirmationModal from './ConfirmationModal';
import ClassyModal from './ClassyModal';
import { useGame } from '../context/GameContext';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext'; // [NEW]
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService';
import { APP_VERSION, BASE_URL } from '../constants/Config';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight, SlideInLeft, SlideOutLeft, Easing, useSharedValue, useAnimatedStyle, withSpring, withTiming, useAnimatedRef } from 'react-native-reanimated';

import { RulesIcon, PaletteIcon, SettingsIcon, LinkIcon, OpenDoorIcon, CardsIcon, EyeIcon, EyeOffIcon, HornsIcon, DirtyCashIcon, CrownIcon, RankIcon } from './Icons'; // [FIX] Added missing icons
import FrameSelectionModal from './FrameSelectionModal';
import { RANK_COLORS } from '../constants/Ranks'; // [FIX] Added missing import
import ToastNotification from './ToastNotification'; // [NEW]

const SettingsModal = ({ visible, onClose, onStartLoading, onLeaveRequest, onLogoutRequest, onOpenInfo = () => { }, initialView = null }) => {
    const { theme, themes, setTheme, animationsEnabled, toggleAnimations } = useTheme();
    const { isPlaying, toggleMusic } = useAudio();
    const { leaveRoom, roomCode } = useGame();
    const { logout, user: authUser } = useAuth();
    const { t, language, setLanguage } = useLanguage();

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false); // [NEW]

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: "",
        message: "",
        singleButton: true,
        onConfirm: null,
        confirmText: "OK",
        variant: "primary"
    });

    // [NEW] Scroll Ref for Rules
    const rulesScrollRef = useRef(null);
    const [chaosPosition, setChaosPosition] = useState(0);

    // [FIX] Split initialization effect to avoid reset on layout changes
    useEffect(() => {
        if (!visible) {
            setModalConfig(prev => ({ ...prev, visible: false }));
            setShowRules(false);
            setShowPersonalization(false);
            setShowPreferences(false);
            setShowAccount(false);
            setActiveTab(0);
            setShowRecoveryCode(false);
        } else {
            loadSettings();

            // Only handle initialView routing when the modal actually opens or initialView changes
            if (initialView === 'rules' || initialView === 'rules_chaos') {
                setShowRules(true);
            } else if (initialView === 'style') {
                setShowPersonalization(true);
            } else if (initialView === 'audio') {
                setShowPreferences(true);
            }
        }
    }, [visible, initialView]);

    // Separate effect for chaotic rules scroll to avoid dependency conflicts
    useEffect(() => {
        if (visible && initialView === 'rules_chaos' && chaosPosition > 0) {
            const timer = setTimeout(() => {
                rulesScrollRef.current?.scrollTo({ y: chaosPosition, animated: true });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [visible, initialView, chaosPosition]);

    const loadSettings = async () => {
        try {
            setSoundEnabled(!SoundService.isMuted());
            const vibes = await AsyncStorage.getItem('cah_haptics');
            const isVibesOn = vibes !== 'false';
            setHapticsEnabled(isVibesOn);
            HapticsService.setEnabled(isVibesOn);
        } catch (e) { console.warn(e); }
    };

    const toggleSound = async (val) => {
        try {
            setSoundEnabled(val);
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
        if (val) HapticsService.trigger('light');
    };

    const showModal = (title, message, singleButton = true, onConfirm = null, confirmText = "OK") => {
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
            showModal(t('no_code_title'), t('no_code_msg'));
            return;
        }

        const message = t('share_room_msg', {
            code: roomCode,
            id: authUser?.username,
            url: BASE_URL
        });
        const shareUrl = `${BASE_URL}/?room=${roomCode}&invite=${authUser?.username}`;

        if (Platform.OS === 'web') {
            await Clipboard.setStringAsync(shareUrl);
            showModal(t('copied_title'), t('toast_room_link_copied'));
            SoundService.play('success');
        } else {
            try {
                await Share.share({ message: message, url: shareUrl });
            } catch (error) { console.error("Share error", error); }
        }
    };

    const handleLeave = () => {
        if (onLeaveRequest) {
            onLeaveRequest();
        } else {
            showModal(
                t('leave_game_title'),
                t('leave_game_msg'),
                false,
                () => {
                    if (onStartLoading) onStartLoading(true);
                    leaveRoom();
                    onClose();
                },
                t('exit_btn')
            );
        }
    };

    const handleLogout = () => {
        if (onLogoutRequest) {
            onLogoutRequest();
        } else {
            showModal(
                t('logout_title'),
                t('logout_msg'),
                false,
                () => { onClose(); logout(); },
                t('exit_btn')
            );
        }
    };

    // Shared Value for Tab Indicator
    const tabBarWidth = useSharedValue(0);
    const tabIndicatorX = useSharedValue(0);

    const handleTabPress = (index) => {
        setActiveTab(index);
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3;
            tabIndicatorX.value = withTiming(index * tabWidth, { duration: 250, easing: Easing.out(Easing.quad) });
        }
    };

    useEffect(() => {
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3;
            tabIndicatorX.value = withTiming(activeTab * tabWidth, { duration: 250, easing: Easing.out(Easing.quad) });
        }
    }, [activeTab]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tabIndicatorX.value }],
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 8) / 3 : 0,
    }));

    return (
        <>
            <ClassyModal
                visible={visible}
                onClose={
                    showRules ? () => setShowRules(false) :
                        showPersonalization ? () => setShowPersonalization(false) :
                            showPreferences ? () => setShowPreferences(false) :
                                showAccount ? () => setShowAccount(false) :
                                    onClose
                }
                title={
                    showRules ? t('rules_cat') :
                        showPersonalization ? t('style_cat') :
                            showPreferences ? t('settings_title') :
                                showAccount ? t('account_cat') :
                                    t('settings_title')
                }
                icon={
                    showRules ? (
                        <RulesIcon size={48} color={theme.colors.accent} />
                    ) : showPersonalization ? (
                        <PaletteIcon size={48} color={theme.colors.accent} />
                    ) : showPreferences ? (
                        <SettingsIcon size={48} color={theme.colors.accent} />
                    ) : showAccount ? (
                        showRecoveryCode ? (
                            <EyeOffIcon size={48} color={theme.colors.accent} />
                        ) : (
                            <EyeIcon size={48} color={theme.colors.accent} />
                        )
                    ) : (
                        <SettingsIcon size={48} color={theme.colors.accent} />
                    )
                }
                iconColor={theme.colors.accent}
            >
                {showPersonalization ? (
                    <Animated.View
                        key="personalization"
                        entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                        exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                        style={{ width: '100%', height: 500 }}
                    >
                        <View
                            style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 15 }}
                            onLayout={(e) => { tabBarWidth.value = e.nativeEvent.layout.width; }}
                        >
                            <Animated.View style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, backgroundColor: theme.colors.accent, borderRadius: 8 }, indicatorStyle]} />
                            {[t('tab_themes'), t('tab_cards'), t('tab_frames')].map((tab, index) => {
                                const isActive = activeTab === index;
                                return (
                                    <Pressable
                                        key={tab}
                                        onPress={() => handleTabPress(index)}
                                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, zIndex: 1 }}
                                    >
                                        <Text style={{ color: isActive ? '#000' : theme.colors.textPrimary, fontFamily: 'Outfit-Bold', fontSize: 13, includeFontPadding: false }}>{tab}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <View style={{ flex: 1 }}>
                            {activeTab === 0 && <ThemeSelectionModal onBack={() => setShowPersonalization(false)} hideBackButton={true} />}
                            {activeTab === 1 && <SkinSelectionModal onBack={() => setShowPersonalization(false)} hideBackButton={true} />}
                            {activeTab === 2 && <FrameSelectionModal onBack={() => setShowPersonalization(false)} hideBackButton={true} />}
                        </View>

                        <PremiumPressable
                            onPress={() => setShowPersonalization(false)}
                            enableSound={false}
                            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0, marginTop: 10 }]}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                        >
                            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                        </PremiumPressable>
                    </Animated.View>
                ) : showRules ? (
                    <Animated.View
                        key="rules"
                        entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                        exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                        style={{ height: 500, width: '100%' }}
                    >
                        <ScrollView
                            ref={rulesScrollRef}
                            showsVerticalScrollIndicator={false}
                            style={{ flex: 1, marginBottom: 15 }}
                            contentContainerStyle={{ paddingBottom: 30 }}
                        >
                            <View style={{ gap: 20 }}>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                                        <DirtyCashIcon size={20} color="#10b981" />
                                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 0.5 }}>{t('rule_economy_title')}</Text>
                                    </View>
                                    <View style={{ gap: 2 }}>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>{t('rule_economy_1')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>{t('rule_economy_2')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>{t('rule_economy_3')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.6, fontFamily: 'Outfit', fontSize: 13, fontStyle: 'italic', marginTop: 4 }]}>{t('rule_economy_footer')}</Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                                        <CrownIcon size={20} color="#FDB931" />
                                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 0.5 }}>{t('rule_objective_title')}</Text>
                                    </View>
                                    <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>{t('rule_objective_content')}</Text>
                                </View>

                                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                                        <CardsIcon size={20} color="#3b82f6" />
                                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 0.5 }}>{t('rule_dynamics_title')}</Text>
                                    </View>
                                    <View style={{ gap: 2 }}>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>1. {t('rule_dynamics_1')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>2. {t('rule_dynamics_2')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>3. {t('rule_dynamics_3')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>4. {t('rule_dynamics_4')}</Text>
                                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }]}>5. {t('rule_dynamics_5')}</Text>
                                    </View>
                                </View>
                                {/* RANKS */}
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                                        <RankIcon size={20} color="#8b5cf6" />
                                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 0.5 }}>{t('rule_ranks_title')}</Text>
                                    </View>
                                    <View style={{ gap: 2 }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Anima Candida"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_anima_candida')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (0 DC)</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Innocente"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_innocente')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (1.000 DC)</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Corrotto"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_corrotto')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (2.500 DC)</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Socio del Vizio"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_socio_del_vizio')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (5.000 DC)</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Architetto del Caos"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_architetto_del_caos')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (10.000 DC)</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Eminenza Grigia"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_eminenza_grigia')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (25.000 DC)</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <Text style={{ color: RANK_COLORS["Entità Apocalittica"], fontFamily: 'Outfit', fontSize: 13 }}>• {t('rank_entita_apocalittica')}</Text>
                                            <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', fontSize: 13 }}> (50.000 DC)</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* CHAOS ENGINE */}
                                <View
                                    onLayout={(event) => {
                                        const layout = event.nativeEvent.layout;
                                        setChaosPosition(layout.y);
                                    }}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
                                        <HornsIcon size={20} color="#ef4444" />
                                        <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 0.5 }}>{t('rule_chaos_title')}</Text>
                                    </View>

                                    <Text style={{ color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit', marginBottom: 12, fontSize: 13, lineHeight: 20 }}>{t('chaos_intro_desc')}</Text>

                                    <View style={{ gap: 8 }}>
                                        <Text style={{ color: theme.colors.textPrimary, opacity: 0.9, fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>• {t('chaos_event_inflation_title')}: </Text>
                                            <Text>{t('chaos_event_inflation_desc')}</Text>
                                        </Text>
                                        <Text style={{ color: theme.colors.textPrimary, opacity: 0.9, fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>• {t('chaos_event_blackout_title')}: </Text>
                                            <Text>{t('chaos_event_blackout_desc')}</Text>
                                        </Text>
                                        <Text style={{ color: theme.colors.textPrimary, opacity: 0.9, fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>• {t('chaos_event_dictatorship_title')}: </Text>
                                            <Text>{t('chaos_event_dictatorship_desc')}</Text>
                                        </Text>
                                        <Text style={{ color: theme.colors.textPrimary, opacity: 0.9, fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>• {t('chaos_event_identity_swap_title')}: </Text>
                                            <Text>{t('chaos_event_identity_swap_desc')}</Text>
                                        </Text>
                                        <Text style={{ color: theme.colors.textPrimary, opacity: 0.9, fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>• {t('chaos_event_robin_hood_title')}: </Text>
                                            <Text>{t('chaos_event_robin_hood_desc')}</Text>
                                        </Text>
                                        <Text style={{ color: theme.colors.textPrimary, opacity: 0.9, fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>• {t('chaos_event_dirty_win_title')}: </Text>
                                            <Text>{t('chaos_event_dirty_win_desc')}</Text>
                                        </Text>
                                    </View>
                                </View>
                            </View >
                        </ScrollView >

                        <PremiumPressable
                            onPress={() => setShowRules(false)}
                            enableSound={false}
                            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                        >
                            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                        </PremiumPressable>
                    </Animated.View >
                ) : showPreferences ? (
                    <Animated.View
                        key="preferences"
                        entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                        exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                        style={{ gap: 15, width: '100%' }}
                    >
                        <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                            <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12 }]}>
                                <View>
                                    <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>LINGUA / LANGUAGE</Text>
                                    <Text style={styles.rowSub}>Italiano / English</Text>
                                </View>
                                <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 3 }}>
                                    <TouchableOpacity
                                        onPress={() => setLanguage('it')}
                                        style={{
                                            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                                            backgroundColor: language === 'it' ? '#d4af37' : 'transparent',
                                            shadowColor: 'transparent', shadowOpacity: 0, elevation: 0,
                                            shadowRadius: 0, shadowOffset: { width: 0, height: 0 }
                                        }}
                                    >
                                        <Text style={{ fontFamily: 'Cinzel-Bold', fontSize: 10, color: language === 'it' ? '#000' : '#666' }}>IT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setLanguage('en')}
                                        style={{
                                            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                                            backgroundColor: language === 'en' ? '#d4af37' : 'transparent',
                                            shadowColor: 'transparent', shadowOpacity: 0, elevation: 0,
                                            shadowRadius: 0, shadowOffset: { width: 0, height: 0 }
                                        }}
                                    >
                                        <Text style={{ fontFamily: 'Cinzel-Bold', fontSize: 10, color: language === 'en' ? '#000' : '#666' }}>EN</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.row, { paddingTop: 12 }]}>
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

                        </View>

                        <PremiumPressable
                            onPress={() => setShowPreferences(false)}
                            enableSound={false}
                            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 0 }]}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                        >
                            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                        </PremiumPressable>
                    </Animated.View>
                ) : showAccount ? (
                    <Animated.View
                        key="account"
                        entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                        exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                        style={{ gap: 15, width: '100%' }}
                    >
                        {authUser?.recoveryCode && (
                            <View style={{ padding: 16, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                                    {showRecoveryCode ? (
                                        <EyeOffIcon size={20} color="#ef4444" />
                                    ) : (
                                        <EyeIcon size={20} color="#ef4444" />
                                    )}
                                    <Text style={{ color: '#ef4444', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1 }}>{t('recovery_code')}</Text>
                                </View>
                                <Text style={{ color: '#aaa', fontFamily: 'Outfit', fontSize: 11, marginBottom: 15 }}>
                                    {t('recovery_sub')}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.2)', alignItems: 'center' }}>
                                        <Text style={{ color: '#fff', fontFamily: 'Courier New', fontSize: 15, letterSpacing: 2 }}>
                                            {showRecoveryCode ? authUser.recoveryCode : "•••-••••"}
                                        </Text>
                                    </View>
                                    <PremiumPressable
                                        style={{ width: 60, height: 45, borderRadius: 8, overflow: 'hidden' }}
                                        pressableStyle={{ backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                                        onPress={() => {
                                            if (showRecoveryCode) {
                                                Clipboard.setStringAsync(authUser.recoveryCode);
                                                showModal(t('copied_title'), t('recovery_saved_msg'));
                                            } else {
                                                setShowRecoveryCode(true);
                                            }
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontFamily: 'Outfit-Bold', fontSize: 11, textAlign: 'center', includeFontPadding: false }}>
                                            {showRecoveryCode ? t('recovery_copy_btn') : t('recovery_view_btn')}
                                        </Text>
                                    </PremiumPressable>
                                </View>
                            </View>
                        )}

                        <View style={{ gap: 8 }}>
                            <PremiumPressable
                                style={[styles.menuCard, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 16 }]}
                                onPress={handleLogout}
                                enableSound={false}
                                contentContainerStyle={[styles.menuCardContent, { borderRadius: 16 }]}
                            >
                                <View style={styles.menuCardIconWrap}>
                                    <OpenDoorIcon size={20} color="#ef4444" />
                                </View>
                                <Text style={[styles.menuCardText, { color: '#ef4444' }]}>{t('logout_btn')}</Text>
                            </PremiumPressable>
                        </View>

                        <PremiumPressable
                            onPress={() => setShowAccount(false)}
                            enableSound={false}
                            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 0, marginTop: 10 }]}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                        >
                            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                        </PremiumPressable>
                    </Animated.View>
                ) : (
                    <Animated.View
                        key="main"
                        entering={SlideInLeft.duration(500).easing(Easing.out(Easing.quad))}
                        exiting={SlideOutLeft.duration(500).easing(Easing.out(Easing.quad))}
                        style={{ gap: 8, width: '100%' }}
                    >
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                            <CategoryTile
                                title={t('style_cat')}
                                subtitle={t('style_sub')}
                                icon={<PaletteIcon size={28} color={theme.colors.accent} />}
                                onPress={() => setShowPersonalization(true)}
                            />
                            <CategoryTile
                                title={t('audio_cat')}
                                subtitle={t('audio_sub')}
                                icon={<SettingsIcon size={28} color="#94a3b8" />}
                                onPress={() => setShowPreferences(true)}
                            />
                            {!roomCode && (
                                <CategoryTile
                                    title={t('account_cat')}
                                    subtitle="Recupero"
                                    icon={<EyeIcon size={28} color="#ef4444" />}
                                    onPress={() => setShowAccount(true)}
                                />
                            )}
                            <CategoryTile
                                title={t('rules_cat')}
                                subtitle={t('manual_sub')}
                                icon={<RulesIcon size={28} color="#3b82f6" />}
                                onPress={() => setShowRules(true)}
                            />
                        </View>

                        {roomCode && (
                            <View style={{ marginTop: 20, gap: 10 }}>
                                <SecondaryAction
                                    icon={<LinkIcon size={18} color="#eab308" />}
                                    label={t('copy_code_action')}
                                    onPress={handleShare}
                                    bgColor="rgba(234, 179, 8, 0.1)"
                                    color="#eab308"
                                />
                                <SecondaryAction
                                    icon={<OpenDoorIcon size={18} color="#ef4444" />}
                                    label={t('leave_room_action')}
                                    onPress={handleLeave}
                                    bgColor="rgba(239, 68, 68, 0.1)"
                                    color="#ef4444"
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.6}
                            style={{ marginTop: 25, alignItems: 'center', paddingBottom: 10 }}
                            onPress={onOpenInfo}
                        >
                            <Text style={{ fontFamily: 'Outfit', fontSize: 11, color: '#666', textDecorationLine: 'underline', letterSpacing: 0.5 }}>
                                {t('info_privacy_link')}
                            </Text>
                            <Text style={{ textAlign: 'center', color: '#666', fontSize: 9, fontFamily: 'Outfit', marginTop: 4, opacity: 0.4 }}>
                                {t('version_label')} {APP_VERSION}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </ClassyModal >
            <ToastNotification
                visible={showSuccessToast}
                message={t('suggest_card_success')}
                type="success"
                onClose={() => setShowSuccessToast(false)}
            />
            <ConfirmationModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                singleButton={modalConfig.singleButton}
                onConfirm={modalConfig.onConfirm}
                confirmText={modalConfig.confirmText}
            />
        </>
    );
};

const CategoryTile = ({ title, subtitle, icon, onPress }) => {
    return (
        <PremiumPressable
            style={{ width: '47%', borderRadius: 18, overflow: 'hidden' }}
            pressableStyle={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.08)',
                borderRadius: 18,
                height: 120,
            }}
            contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                height: '100%',
            }}
            onPress={onPress}
            enableSound={false}
        >
            <View style={{
                width: 54, height: 54, borderRadius: 27,
                backgroundColor: 'rgba(255,255,255,0.05)',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)'
            }}>
                {icon}
            </View>
            <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 11, letterSpacing: 1.5, textAlign: 'center' }}>{title}</Text>
            <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 9, marginTop: 2, textAlign: 'center' }}>{subtitle}</Text>
        </PremiumPressable>
    );
};

const SecondaryAction = ({ icon, label, onPress, bgColor, color }) => {
    return (
        <PremiumPressable
            style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }}
            pressableStyle={{ backgroundColor: bgColor, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 14 }}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
            onPress={onPress}
        >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </View>
            <Text style={{ color: color, fontFamily: 'Cinzel-Bold', fontSize: 11, letterSpacing: 1.5 }}>{label}</Text>
        </PremiumPressable>
    );
};

const styles = StyleSheet.create({
    menuCard: {
        width: '100%',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    menuCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    menuCardIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuCardText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
    },
    sectionHeader: {
        color: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    themeCard: {
        width: 75,
        height: 90,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    themeCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    themeLabel: {
        fontSize: 11,
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        color: '#888',
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
    listButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        gap: 12,
    },
    listIcon: {
        fontSize: 18,
    },
    listText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Outfit',
        fontWeight: '600',
    },
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
    }
});

export default SettingsModal;
