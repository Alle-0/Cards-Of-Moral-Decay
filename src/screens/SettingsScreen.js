import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, ScrollView, BackHandler, Platform } from 'react-native';
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

import { useTheme } from '../context/ThemeContext';
import { useAuth, RANK_COLORS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService';
import { APP_VERSION } from '../constants/Config';
import Animated, { SlideInRight, SlideOutRight, SlideInLeft, SlideOutLeft, Easing } from 'react-native-reanimated';

import { RulesIcon, SettingsIcon, LinkIcon, OpenDoorIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, ShieldIcon, CheckIcon } from '../components/Icons';
import InfoScreen from './InfoScreen';

const SettingsScreen = ({ navigation }) => {
    const { theme, animationsEnabled, toggleAnimations } = useTheme();
    const { leaveRoom, roomCode } = useGame();
    const { t, language, setLanguage } = useLanguage();
    const { logout, user: authUser } = useAuth();
    const insets = useSafeAreaInsets();

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: "",
        message: "",
        singleButton: true,
        onConfirm: null,
        confirmText: t('ok_btn')
    });
    const [showExitAppModal, setShowExitAppModal] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const sound = await AsyncStorage.getItem('cah_sound');
            const vibes = await AsyncStorage.getItem('cah_haptics');

            const isSoundOn = sound !== 'false';
            const isVibesOn = vibes !== 'false';

            setSoundEnabled(isSoundOn);
            setHapticsEnabled(isVibesOn);

            SoundService.setMuted(!isSoundOn);
            HapticsService.setEnabled(isVibesOn);
        } catch (e) { console.warn(e); }
    };

    const toggleSound = async (val) => {
        setSoundEnabled(val);
        SoundService.setMuted(!val);
        await AsyncStorage.setItem('cah_sound', val.toString());
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
            showModal(t('no_code_toast_title'), t('no_code_msg'));
            return;
        }
        await Clipboard.setStringAsync(roomCode);
        showModal(t('copied_toast_title'), t('code_copied_msg', { code: roomCode }));
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

    // Android Back Handler
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const backAction = () => {
                // If sub-preferences are open, go back to main settings
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
        }, [showRules, showPreferences, showAccount, showInfo])
    );

    const handleBack = () => {
        setShowRules(false);
        setShowPreferences(false);
        setShowAccount(false);
        setShowInfo(false);
    };

    return (
        <View style={{ flex: 1 }}>
            <PremiumBackground>
                <View style={styles.container}>



                    {showRules ? (
                        <Animated.View
                            key="rules"
                            entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                            exiting={SlideOutRight.duration(300).easing(Easing.out(Easing.quad))}
                            style={{ flex: 1, width: '100%', paddingTop: 50, paddingBottom: 80 + insets.bottom }}
                        >
                            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 15 }} contentContainerStyle={{ paddingBottom: 20 }}>
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
                                            <Text key="sv"><Text style={{ color: RANK_COLORS["Socio del Vizio"], fontWeight: 'bold' }}>{t('rank_socio_vizio')}</Text> (5.000 DC)</Text>,
                                            <Text key="chk"><Text style={{ color: RANK_COLORS["Architetto del Caos"], fontWeight: 'bold' }}>{t('rank_architetto_caos')}</Text> (10.000 DC)</Text>,
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
                    ) : showPreferences ? (
                        <Animated.View
                            key="preferences"
                            entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                            exiting={SlideOutRight.duration(300).easing(Easing.out(Easing.quad))}
                            style={{ flex: 1, width: '100%', paddingTop: 50, gap: 15, paddingBottom: 80 + insets.bottom }}
                        >
                            <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                                {/* LANGUAGE TOGGLE */}
                                <View style={styles.row}>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('select_language')}</Text>
                                        <Text style={styles.rowSub}>{language === 'it' ? 'Italiano' : 'English'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <PremiumPressable
                                            onPress={() => setLanguage('it')}
                                            enableSound={true}
                                            hitSlop={10}
                                            style={{ padding: 4 }}
                                        >
                                            <Text style={{
                                                color: language === 'it' ? theme.colors.accent : '#666',
                                                fontFamily: 'Cinzel-Bold',
                                                fontSize: 14,
                                                lineHeight: 18,
                                                includeFontPadding: false,
                                                textAlignVertical: 'center',
                                                textShadowColor: 'transparent',
                                                textShadowRadius: 0
                                            }}>IT</Text>
                                        </PremiumPressable>

                                        <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 }} />

                                        <PremiumPressable
                                            onPress={() => setLanguage('en')}
                                            enableSound={true}
                                            hitSlop={10}
                                            style={{ padding: 4 }}
                                        >
                                            <Text style={{
                                                color: language === 'en' ? theme.colors.accent : '#666',
                                                fontFamily: 'Cinzel-Bold',
                                                fontSize: 14,
                                                lineHeight: 18,
                                                includeFontPadding: false,
                                                textAlignVertical: 'center',
                                                textShadowColor: 'transparent',
                                                textShadowRadius: 0
                                            }}>EN</Text>
                                        </PremiumPressable>
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
                            entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                            exiting={SlideOutRight.duration(300).easing(Easing.out(Easing.quad))}
                            style={{ flex: 1, width: '100%', paddingTop: 50, gap: 15, paddingBottom: 80 + insets.bottom }}
                        >
                            {authUser?.recoveryCode && (
                                <View style={{ padding: 16, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                                        {showRecoveryCode ? (
                                            <EyeOffIcon size={20} color="#ef4444" />
                                        ) : (
                                            <EyeIcon size={20} color="#ef4444" />
                                        )}
                                        <Text style={{ color: '#ef4444', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1 }}>{t('recovery_zone')}</Text>
                                    </View>
                                    <Text style={{ color: '#aaa', fontFamily: 'Outfit', fontSize: 11, marginBottom: 15 }}>
                                        {t('recovery_warning')}
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
                                                {showRecoveryCode ? "COPY" : "VEDI"}
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
                                    <Text style={[styles.menuCardText, { color: '#ef4444' }]}>{t('logout_account')}</Text>
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
                            exiting={SlideOutLeft.duration(300).easing(Easing.out(Easing.linear))}
                            entering={SlideInLeft.duration(300).easing(Easing.out(Easing.quad))}
                            style={{ flex: 1, width: '100%' }}
                        >
                            <Text style={{ color: '#d4af37', fontFamily: 'Cinzel-Bold', fontSize: 24, marginTop: 50, marginBottom: 20, textAlign: 'center' }}>
                                {t('settings')}
                            </Text>

                            <View>
                                <CategoryTile
                                    title={t('audio_anim_lang')}
                                    subtitle={t('subj_audio_anim_lang')}
                                    icon={<SettingsIcon size={24} color={theme.colors.accent} />}
                                    color={theme.colors.accent}
                                    onPress={() => setShowPreferences(true)}
                                />
                                {!roomCode && (
                                    <CategoryTile
                                        title={t('account')}
                                        subtitle={t('recovery_security')}
                                        icon={<EyeIcon size={24} color="#ef4444" />}
                                        color="#ef4444"
                                        onPress={() => setShowAccount(true)}
                                    />
                                )}
                                <CategoryTile
                                    title={t('rules')}
                                    subtitle={t('criminal_manual')}
                                    icon={<RulesIcon size={24} color="#3b82f6" />}
                                    color="#3b82f6"
                                    onPress={() => setShowRules(true)}
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
                    )}

                    <ConfirmationModal
                        visible={modalConfig.visible}
                        onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                        title={modalConfig.title}
                        message={modalConfig.message}
                        singleButton={modalConfig.singleButton}
                        onConfirm={modalConfig.onConfirm}
                        confirmText={modalConfig.confirmText}
                    />

                    <ConfirmationModal
                        visible={showExitAppModal}
                        onClose={() => setShowExitAppModal(false)}
                        title={t('exit_app_title')}
                        message={t('exit_app_msg')}
                        confirmText={t('exit_btn_small')}
                        onConfirm={() => BackHandler.exitApp()}
                    />

                    {showInfo && (
                        <View style={StyleSheet.absoluteFill}>
                            <InfoScreen onClose={() => setShowInfo(false)} />
                        </View>
                    )}
                </View>
            </PremiumBackground >
        </View >
    );
};

const CategoryTile = ({ title, subtitle, icon, color, onPress }) => {
    const { theme } = useTheme();
    const effectiveColor = color || theme.colors.accent;
    // Helper to safely add alpha to a hex string
    const addAlpha = (hex, alpha) => {
        if (!hex) return '#ffffff00';
        if (hex.startsWith('#') && hex.length === 9) {
            // Trim existing alpha if present (format #RRGGBBAA)
            return hex.substring(0, 7) + alpha;
        }
        if (hex.startsWith('#')) {
            return hex + alpha;
        }
        return hex; // Trigger fallback for rgba/others if needed, or handle differently.
    };

    return (
        <PremiumPressable
            style={{ width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 12 }}
            pressableStyle={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                borderRadius: 25,
                minHeight: 80,
                paddingVertical: 12,
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
                borderRadius: 21,
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
                <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1.2 }}>{title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', fontSize: 10, marginTop: 5 }}>{subtitle}</Text>
            </View>
            <View style={{ opacity: 0.4, marginRight: 5 }}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <ArrowLeftIcon size={18} color="#fff" />
                </View>
            </View>
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
