import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Pressable, Share, Alert, Image } from 'react-native';
import PremiumPressable from './PremiumPressable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import ThemeSelectionModal from './ThemeSelectionModal';
import SkinSelectionModal from './SkinSelectionModal'; // [NEW]
import ConfirmationModal from './ConfirmationModal';
import ClassyModal from './ClassyModal';
import { useGame } from '../context/GameContext';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService';
import { APP_VERSION } from '../constants/Config';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight, SlideInLeft, SlideOutLeft, Easing, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { RulesIcon, PaletteIcon, SettingsIcon, LinkIcon, OpenDoorIcon, CardsIcon, EyeIcon, EyeOffIcon } from './Icons'; // [NEW] EyeOffIcon
import FrameSelectionModal from './FrameSelectionModal'; // [NEW]

const SettingsModal = ({ visible, onClose, onStartLoading, onLeaveRequest, onLogoutRequest }) => { // [NEW] onLogoutRequest
    const { theme, themes, setTheme, animationsEnabled, toggleAnimations } = useTheme(); // [NEW] anims
    const { leaveRoom, roomCode } = useGame(); // Get game info
    const { logout, user: authUser } = useAuth(); // [FIX] Use Auth user for recovery code

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false); // [NEW]
    const [showAccount, setShowAccount] = useState(false); // [NEW]
    const [activeTab, setActiveTab] = useState(0);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: "",
        message: "",
        singleButton: true,
        onConfirm: null,
        confirmText: "OK",
        variant: "primary" // 'primary' or 'danger' logic handled in component but passed for context
    });

    useEffect(() => {
        if (!visible) {
            // [FIX] Reset state when closed
            setModalConfig(prev => ({ ...prev, visible: false }));
            setShowRules(false);
            setShowPersonalization(false);
            setShowPreferences(false); // [NEW]
            setShowAccount(false); // [NEW]
            setActiveTab(0);
            setShowRecoveryCode(false);
        } else {
            loadSettings();
        }
    }, [visible]);

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
            showModal("Nessun Codice", "Non sei connesso a nessuna stanza al momento.");
            return;
        }
        await Clipboard.setStringAsync(roomCode);
        showModal("Copiato!", `Il codice ${roomCode} è stato copiato negli appunti.`);
    };

    const handleLeave = () => {
        if (onLeaveRequest) {
            onLeaveRequest();
        } else {
            // Fallback if prop is missing (shouldn't happen)
            showModal(
                "Abbandona Partita",
                "Sei sicuro di voler uscire dalla stanza corrente?",
                false,
                () => {
                    if (onStartLoading) onStartLoading(true);
                    leaveRoom();
                    onClose();
                },
                "Esci"
            );
        }
    };

    const handleLogout = () => {
        if (onLogoutRequest) {
            onLogoutRequest();
        } else {
            showModal(
                "Disconnetti",
                "Vuoi uscire dall'account?\nDovrai effettuare nuovamente il login.",
                false,
                () => {
                    onClose();
                    logout();
                },
                "Esci"
            );
        }
    };

    // [NEW] Shared Value for Tab Indicator
    const tabBarWidth = useSharedValue(0);
    const tabIndicatorX = useSharedValue(0);

    const handleTabPress = (index) => {
        setActiveTab(index);
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3; // -8 for padding (4*2)
            tabIndicatorX.value = withTiming(index * tabWidth, { duration: 250, easing: Easing.out(Easing.quad) });
        }
    };

    // Sync indicator if width changes (orientation or initial load)
    useEffect(() => {
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3;
            tabIndicatorX.value = withTiming(activeTab * tabWidth, { duration: 250, easing: Easing.out(Easing.quad) });
        }
    }, [activeTab]); // Removed tabBarWidth from deps as it's a SV

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tabIndicatorX.value }],
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 8) / 3 : 0,
    }));

    return (
        <ClassyModal
            // ... (props unchanged)
            visible={visible}
            onClose={
                showRules ? () => setShowRules(false) :
                    showPersonalization ? () => setShowPersonalization(false) :
                        showPreferences ? () => setShowPreferences(false) :
                            showAccount ? () => setShowAccount(false) :
                                onClose
            }
            title={
                showRules ? "Regole" :
                    showPersonalization ? "Personalizza" :
                        showPreferences ? "Preferenze" :
                            showAccount ? "Sicurezza" :
                                "Impostazioni"
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
                    {/* Tab Bar */}
                    <View
                        style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 15 }}
                        onLayout={(e) => {
                            tabBarWidth.value = e.nativeEvent.layout.width;
                        }}
                    >
                        {/* Animated Slider Background */}
                        <Animated.View style={[
                            {
                                position: 'absolute',
                                top: 4, bottom: 4, left: 4,
                                backgroundColor: theme.colors.accent,
                                borderRadius: 8,
                                // Width handled by style
                            },
                            indicatorStyle
                        ]} />

                        {['Temi', 'Carte', 'Cornici'].map((tab, index) => {
                            const isActive = activeTab === index;
                            return (
                                <Pressable
                                    key={tab}
                                    onPress={() => handleTabPress(index)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        // backgroundColor: 'transparent', // NO BG here
                                        borderRadius: 8,
                                        zIndex: 1 // Above indicator
                                    }}
                                >
                                    <Text style={{
                                        color: isActive ? '#000' : theme.colors.textPrimary,
                                        fontFamily: 'Outfit-Bold',
                                        fontSize: 13,
                                        includeFontPadding: false // Align better center
                                    }}>
                                        {tab}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                        {activeTab === 0 && <ThemeSelectionModal onBack={() => setShowPersonalization(false)} hideBackButton={true} />}
                        {activeTab === 1 && <SkinSelectionModal onBack={() => setShowPersonalization(false)} hideBackButton={true} />}
                        {activeTab === 2 && <FrameSelectionModal onBack={() => setShowPersonalization(false)} hideBackButton={true} />}
                    </View>

                    {/* Unified Back Button */}
                    <PremiumPressable
                        onPress={() => setShowPersonalization(false)}
                        enableSound={false}
                        style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0, marginTop: 10 }]}
                        rippleColor="rgba(255, 255, 255, 0.2)"
                        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                    >
                        <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Indietro</Text>
                    </PremiumPressable>
                </Animated.View>
            ) : showRules ? (
                <Animated.View
                    key="rules"
                    entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                    exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                    style={{ height: 350, width: '100%' }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 15 }}>
                        <Text style={[styles.ruleText, { color: theme.colors.textPrimary, opacity: 0.8, fontFamily: 'Outfit' }]}>
                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>Scopo del gioco:</Text>{'\n'}
                            Essere il più divertente, cinico o assurdo possibile.{'\n\n'}

                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>Come si gioca:</Text>{'\n'}
                            1. Il "Dominus" legge una Carta Nera.{'\n'}
                            2. Gli altri giocatori scelgono una Carta Bianca dalla loro mano che completa meglio la frase.{'\n'}
                            3. Il Dominus le legge ad alta voce.{'\n'}
                            4. Il Dominus sceglie la vincitrice.{'\n'}
                            5. Il vincitore ottiene un punto.{'\n\n'}

                            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>Punteggio:</Text>{'\n'}
                            Vince chi arriva prima al limite punti.
                        </Text>
                    </ScrollView>

                    <PremiumPressable
                        onPress={() => setShowRules(false)}
                        enableSound={false}
                        style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                        rippleColor="rgba(255, 255, 255, 0.2)"
                        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                    >
                        <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Torna al Menu</Text>
                    </PremiumPressable>
                </Animated.View>
            ) : showPreferences ? (
                <Animated.View
                    key="preferences"
                    entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                    exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                    style={{ gap: 15, width: '100%' }}
                >
                    <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                        <View style={styles.row}>
                            <View>
                                <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>VIBRAZIONE</Text>
                                <Text style={styles.rowSub}>Feedback tattile</Text>
                            </View>
                            <Switch
                                value={hapticsEnabled}
                                onValueChange={toggleHaptics}
                                trackColor={{ false: '#333', true: theme.colors.accent }}
                                thumbColor={'#fff'}
                            />
                        </View>
                        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                            <View>
                                <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>ANIMAZIONI SFONDO</Text>
                                <Text style={styles.rowSub}>Particelle ed effetti</Text>
                            </View>
                            <Switch
                                value={animationsEnabled}
                                onValueChange={toggleAnimations}
                                trackColor={{ false: '#333', true: theme.colors.accent }}
                                thumbColor={'#fff'}
                            />
                        </View>
                        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                            <View>
                                <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>EFFETTI SONORI</Text>
                                <Text style={styles.rowSub}>Suoni e notifiche</Text>
                            </View>
                            <Switch
                                value={soundEnabled}
                                onValueChange={toggleSound}
                                trackColor={{ false: '#333', true: theme.colors.accent }}
                                thumbColor={'#fff'}
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
                        <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Indietro</Text>
                    </PremiumPressable>
                </Animated.View>
            ) : showAccount ? (
                <Animated.View
                    key="account"
                    entering={SlideInRight.duration(500).easing(Easing.out(Easing.quad))}
                    exiting={SlideOutRight.duration(500).easing(Easing.out(Easing.quad))}
                    style={{ gap: 15, width: '100%' }}
                >
                    {/* Recovery Zone */}
                    {authUser?.recoveryCode && (
                        <View style={{ padding: 16, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                                {showRecoveryCode ? (
                                    <EyeOffIcon size={20} color="#ef4444" />
                                ) : (
                                    <EyeIcon size={20} color="#ef4444" />
                                )}
                                <Text style={{ color: '#ef4444', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1 }}>ZONA DI RECUPERO</Text>
                            </View>
                            <Text style={{ color: '#aaa', fontFamily: 'Outfit', fontSize: 11, marginBottom: 15 }}>
                                Se perdi questo codice, perdi l'account per sempre.
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
                                            showModal("Copiato", "Codice salvato. Custodiscilo con la vita.");
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

                    {/* Meta Actions */}
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
                            <Text style={[styles.menuCardText, { color: '#ef4444' }]}>Disconnetti Account</Text>
                        </PremiumPressable>
                    </View>

                    <PremiumPressable
                        onPress={() => setShowAccount(false)}
                        enableSound={false}
                        style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 0, marginTop: 10 }]}
                        rippleColor="rgba(255, 255, 255, 0.2)"
                        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                    >
                        <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>Indietro</Text>
                    </PremiumPressable>
                </Animated.View>
            ) : (
                <Animated.View
                    key="main"
                    entering={SlideInLeft.duration(500).easing(Easing.out(Easing.quad))}
                    exiting={SlideOutLeft.duration(500).easing(Easing.out(Easing.quad))}
                    style={{ gap: 8, width: '100%' }}
                >
                    {/* CATEGORIES */}
                    <CategoryCard
                        title="Personalizza"
                        subtitle="Temi, Carte e Skin"
                        icon={<PaletteIcon size={24} color={theme.colors.accent} />}
                        onPress={() => setShowPersonalization(true)}
                        color={theme.colors.accent}
                    />
                    <CategoryCard
                        title="Preferenze"
                        subtitle="Audio, Vibrazione e FX"
                        icon={<SettingsIcon size={24} color="#94a3b8" />}
                        onPress={() => setShowPreferences(true)}
                        color="#94a3b8"
                    />
                    {!roomCode && (
                        <CategoryCard
                            title="Sicurezza"
                            subtitle="Codice di Recupero e Account"
                            icon={<EyeIcon size={24} color="#ef4444" />}
                            onPress={() => setShowAccount(true)}
                            color="#ef4444"
                        />
                    )}
                    <CategoryCard
                        title="Regole"
                        subtitle="Manuale del gioco"
                        icon={<RulesIcon size={24} color="#3b82f6" />}
                        onPress={() => setShowRules(true)}
                        color="#3b82f6"
                    />

                    {/* ACTIONS (Contextual) */}
                    {roomCode && (
                        <>
                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 }} />

                            <PremiumPressable
                                style={{ width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}
                                pressableStyle={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.2)', borderRadius: 16 }}
                                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}
                                onPress={handleShare}
                            >
                                <LinkIcon size={20} color="#eab308" />
                                <Text style={{ color: '#eab308', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1 }}>Copia Codice Stanza</Text>
                            </PremiumPressable>

                            <PremiumPressable
                                style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}
                                pressableStyle={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 16 }}
                                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}
                                onPress={handleLeave}
                            >
                                <OpenDoorIcon size={20} color="#ef4444" />
                                <Text style={{ color: '#ef4444', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 1 }}>Abbandona Partita</Text>
                            </PremiumPressable>
                        </>
                    )}

                    <Text style={{ textAlign: 'center', color: '#666', fontSize: 10, fontFamily: 'Outfit', marginTop: 10, opacity: 0.5 }}>
                        Version {APP_VERSION}
                    </Text>
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
        </ClassyModal >
    );
};

const CategoryCard = ({ title, subtitle, icon, onPress, color }) => {
    return (
        <PremiumPressable
            style={{ width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 2 }}
            pressableStyle={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
                borderRadius: 16
            }}
            contentContainerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
            }}
            onPress={onPress}
            enableSound={false}
        >
            <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.05)',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 16
            }}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 13, letterSpacing: 0.5 }}>{title?.toUpperCase()}</Text>
                <Text style={{ color: '#888', fontFamily: 'Outfit', fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, fontFamily: 'Outfit-Bold' }}>→</Text>
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
