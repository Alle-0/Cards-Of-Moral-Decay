import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Share, Alert, Image, TouchableOpacity, Platform, InteractionManager, ActivityIndicator, Dimensions } from 'react-native';
import PremiumPressable from './PremiumPressable';
import PremiumToggle from './PremiumToggle'; // [NEW]
import PremiumSkeleton from './PremiumSkeleton';
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
import Animated, { FadeIn, FadeOut, FadeInRight, FadeOutRight, FadeInLeft, FadeOutLeft, Easing, useSharedValue, useAnimatedStyle, withSpring, withTiming, useAnimatedRef, withSequence, interpolateColor } from 'react-native-reanimated';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';
import { PanResponder } from 'react-native';

import { RulesIcon, PaletteIcon, SettingsIcon, LinkIcon, OpenDoorIcon, CardsIcon, EyeIcon, EyeOffIcon, HornsIcon, DirtyCashIcon, CrownIcon, RankIcon, BellIcon } from './Icons'; // [FIX] Added missing icons
import FrameSelectionModal from './FrameSelectionModal';
import { RANK_COLORS } from '../constants/Ranks'; // [FIX] Added missing import
import ToastNotification from './ToastNotification'; // [NEW]

const ModalLanguageItem = ({ lang, translateX, theme, onPress }) => {
    const textStyle = useAnimatedStyle(() => {
        const isIt = lang === 'it';
        const color = interpolateColor(
            translateX.value,
            [0, 47],
            isIt
                ? ['#000000', theme.colors.textPrimary + '88']
                : [theme.colors.textPrimary + '88', '#000000']
        );
        return { color };
    });

    return (
        <Pressable
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
            <Animated.Text style={[{ fontFamily: 'Cinzel-Bold', fontSize: 10 }, textStyle]}>
                {lang === 'it' ? 'IT' : 'EN'}
            </Animated.Text>
        </Pressable>
    );
};

const SettingsTabItem = ({ title, index, onPress, tabIndicatorX, tabBarWidth, theme }) => {
    const textStyle = useAnimatedStyle(() => {
        if (tabBarWidth.value <= 0) return {};
        const tabWidth = (tabBarWidth.value - 8) / 3;

        // Interpolate color based on indicator position
        // When indicator is over this tab (index * tabWidth), color should be #000
        const inputRange = [(index - 1) * tabWidth, index * tabWidth, (index + 1) * tabWidth];
        const color = interpolateColor(
            tabIndicatorX.value,
            inputRange,
            [theme.colors.textPrimary, '#000000', theme.colors.textPrimary]
        );

        return { color };
    });

    return (
        <Pressable
            onPress={onPress}
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, zIndex: 1 }}
        >
            <Animated.Text style={[{ fontFamily: 'Outfit-Bold', fontSize: 13, includeFontPadding: false }, textStyle]}>
                {title}
            </Animated.Text>
        </Pressable>
    );
};

const SettingsModal = ({ visible, onClose, onStartLoading, onLeaveRequest, onLogoutRequest, onOpenInfo = () => { }, initialView = null }) => {
    const { theme, themes, setTheme, animationsEnabled, toggleAnimations } = useTheme();
    const { isPlaying, toggleMusic } = useAudio();
    const { leaveRoom, roomCode } = useGame();
    const { logout, user: authUser, toggleNotificationSetting } = useAuth();
    const { t, language, setLanguage } = useLanguage();

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [navDir, setNavDir] = useState('forward');
    const modalHeight = useSharedValue(400); // Initial fallback

    // Debounce state
    const isAnimatingRef = useRef(false);
    const targetHeightRef = useRef(0);

    const handleContentLayout = (event, isActive) => {
        if (!isActive) return;
        const h = event.nativeEvent.layout.height;
        targetHeightRef.current = h;
        if (h > 0 && Math.abs(modalHeight.value - h) > 2 && !isAnimatingRef.current) {
            modalHeight.value = withTiming(h, { duration: 150, easing: Easing.out(Easing.quad) });
        }
    };

    const containerStyle = useAnimatedStyle(() => ({
        height: modalHeight.value,
        width: '100%',
        maxHeight: Platform.OS === 'web' ? 700 : 800,
        overflow: 'hidden'
    }));
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

    // [NEW] Anti-Lag Interaction State with Memory
    const [readyViews, setReadyViews] = useState([]);

    // [NEW] Language Selector Animation
    const dragXLang = useSharedValue(language === 'en' ? 47 : 0);
    const isGrabbingSV = useSharedValue(false); // [FIX] SharedValue for reactivity

    // [NEW] Anchors for hook
    const startX = useSharedValue(language === 'en' ? 47 : 0);
    const targetX = useSharedValue(language === 'en' ? 47 : 0);

    // [FIX] Liquid Scale logic for Language Toggle
    const langScale = useLiquidScale(dragXLang, startX, targetX, isGrabbingSV, 1.15);
    const gestureStartLang = useRef(undefined);
    const touchedLang = useRef(undefined);
    const isGrabbingIndicatorLang = useRef(false);

    const isDraggingLang = useRef(false); // [NEW] Track if actively dragging
    const skipSyncLang = useRef(false); // [NEW] Prevent useEffect animation during gesture
    const languageRef = useRef(language); // [FIX] Ref to avoid stale closure

    // Update ref when language changes
    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    // Sync animation when language changes externally
    useEffect(() => {
        // [FIX] Skip animation if change was initiated by local gesture OR currently dragging
        if (skipSyncLang.current || isDraggingLang.current) {
            skipSyncLang.current = false;
            return;
        }

        const targetX = language === 'en' ? 47 : 0;
        dragXLang.value = withSpring(targetX, SNAP_SPRING_CONFIG);
    }, [language]);

    // [NEW] Language Drag Logic
    const langPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // [FIX] Capture ONLY horizontal drags
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                const { locationX } = evt.nativeEvent;
                const currentLang = languageRef.current;
                gestureStartLang.current = currentLang;

                // [FIX] Assume drag starts if captured (looser check for better UX)
                isGrabbingIndicatorLang.current = true;
                isDraggingLang.current = true;
                isGrabbingSV.value = true;
                HapticsService.trigger('selection');
            },
            onPanResponderMove: (_, gestureState) => {
                const startLangX = gestureStartLang.current === 'en' ? 47 : 0;
                let newX = startLangX + gestureState.dx;
                if (newX < 0) newX = 0;
                if (newX > 47) newX = 47;
                dragXLang.value = newX;
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentLang = languageRef.current;
                // [DRAG SNAP ONLY] Clicks handled by Pressable
                const targetLang = (dragXLang.value > 23.5) ? 'en' : 'it'; // > half of 47

                if (targetLang !== currentLang) {
                    skipSyncLang.current = true;
                    setLanguage(targetLang);
                    HapticsService.trigger('selection');
                }

                // [FIX] Anchors on release
                const targetPos = targetLang === 'en' ? 47 : 0;
                updateLiquidAnchors(startX, targetX, isGrabbingSV, dragXLang.value, targetPos);

                dragXLang.value = withSpring(targetPos, SNAP_SPRING_CONFIG);

                gestureStartLang.current = undefined;
                isDraggingLang.current = false;
                isGrabbingIndicatorLang.current = false;
            }
        })
    ).current;

    const langIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: dragXLang.value },
                { scale: langScale.value }
            ]
        };
    });


    // [NEW] Scroll Ref for Rules
    const rulesScrollRef = useRef(null);
    const [chaosPosition, setChaosPosition] = useState(0);

    // [FIX] Split initialization effect to avoid reset on layout changes
    useEffect(() => {
        let timer;
        if (!visible) {
            setReadyViews([]);
            setModalConfig(prev => ({ ...prev, visible: false }));
            setShowRules(false);
            setShowPersonalization(false);
            setShowPreferences(false);
            setShowAccount(false);
            setActiveTab(0);
            setShowRecoveryCode(false);
        } else {
            // Remove the auto setIsContentReady here
            // It will be handled when setting the specific view
            loadSettings();

            if (initialView === 'rules' || initialView === 'rules_chaos') {
                handleShowRules(true);
            } else if (initialView === 'style') {
                handleShowPersonalization(true);
            } else if (initialView === 'audio') {
                handleShowPreferences(true);
            }
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [visible, initialView]);

    // [NEW] Wrapper functions to trigger skeleton only once per view
    const triggerSkeleton = (viewName) => {
        if (!readyViews.includes(viewName)) {
            setTimeout(() => {
                setReadyViews(prev => [...prev, viewName]);
            }, 300); // 300ms so it updates state AFTER the 250ms slide animation finishes
        }
    };

    // Block height calcs during transition
    const blockLayoutDuringTransition = () => {
        isAnimatingRef.current = true;
        setTimeout(() => {
            isAnimatingRef.current = false;
            // Flush any missed layout changes
            if (targetHeightRef.current > 0 && Math.abs(modalHeight.value - targetHeightRef.current) > 2) {
                modalHeight.value = withTiming(targetHeightRef.current, { duration: 150, easing: Easing.out(Easing.quad) });
            }
        }, 200);
    };

    const handleShowRules = (val) => {
        if (val) { triggerSkeleton('rules'); blockLayoutDuringTransition(); }
        setShowRules(val);
    };

    const handleShowPersonalization = (val) => {
        if (val) {
            triggerSkeleton(`style_${activeTab}`); // Trigger for default tab
            blockLayoutDuringTransition();
        }
        setShowPersonalization(val);
    };

    const handleShowPreferences = (val) => {
        if (val) { triggerSkeleton('audio'); blockLayoutDuringTransition(); }
        setShowPreferences(val);
    };

    const handleShowNotifications = (val) => {
        if (val) { triggerSkeleton('notifications'); blockLayoutDuringTransition(); }
        setShowNotifications(val);
    };

    const handleShowAccount = (val) => {
        if (val) { triggerSkeleton('account'); blockLayoutDuringTransition(); }
        setShowAccount(val);
    };

    // Separate effect for chaotic rules scroll to avoid dependency conflicts
    useEffect(() => {
        if (visible && initialView === 'rules_chaos' && chaosPosition > 0) {
            const timer = setTimeout(() => {
                rulesScrollRef.current?.scrollTo?.({ y: chaosPosition, animated: true });
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
                async () => {
                    if (onStartLoading) onStartLoading(true);
                    // Add small delay to let splash cover the UI
                    await new Promise(resolve => setTimeout(resolve, 500));
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

    // [NEW] Liquid Scale Logic
    const startXTabs = useSharedValue(0);
    const targetXTabs = useSharedValue(0);
    const isDraggingTabsSV = useSharedValue(false);
    const tabScale = useLiquidScale(tabIndicatorX, startXTabs, targetXTabs, isDraggingTabsSV, 1.15);

    const handleTabPress = (index) => {
        if (index !== activeTab) {
            triggerSkeleton(`style_${index}`); // Show skeletons when switching tabs if not in memory
        }
        const prevIndex = activeTab;
        setActiveTab(index);
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3;
            const currentPos = tabIndicatorX.value;
            const targetPos = index * tabWidth;

            // [FIX] Update anchors for liquid animation
            startXTabs.value = currentPos;
            targetXTabs.value = targetPos;

            tabIndicatorX.value = withSpring(targetPos, SNAP_SPRING_CONFIG);
        }
    };

    useEffect(() => {
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3;
            // Only animate if not already there (avoid conflicts)
            if (Math.abs(tabIndicatorX.value - activeTab * tabWidth) > 1) {
                tabIndicatorX.value = withSpring(activeTab * tabWidth, SNAP_SPRING_CONFIG);
            }
        }
    }, [activeTab]);

    const isGrabbingTabIndicator = useRef(false);
    const activeTabRef = useRef(activeTab);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    const touchedTabIndex = useRef(null); // [NEW] Track which tab was touched

    const tabsPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // [FIX] Capture ONLY horizontal drags
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: (evt) => {
                if (tabBarWidth.value <= 0) return;
                isGrabbingTabIndicator.current = true;
                isDraggingTabsSV.value = true;
                HapticsService.trigger('selection');
            },
            onPanResponderMove: (_, gestureState) => {
                if (tabBarWidth.value <= 0) return;
                const tabWidth = (tabBarWidth.value - 8) / 3;
                const startX = activeTabRef.current * tabWidth;
                let newX = startX + gestureState.dx;

                // Clamp
                const maxPos = tabWidth * 2;
                if (newX < 0) newX = 0;
                if (newX > maxPos) newX = maxPos;

                tabIndicatorX.value = newX;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (tabBarWidth.value <= 0) return;
                const tabWidth = (tabBarWidth.value - 8) / 3;

                // [DRAG SNAP]
                const currentPos = tabIndicatorX.value;
                let targetIndex = Math.round(currentPos / tabWidth);
                targetIndex = Math.max(0, Math.min(2, targetIndex));

                if (targetIndex !== activeTabRef.current) {
                    setActiveTab(targetIndex);
                    HapticsService.trigger('selection');
                }

                const targetPos = targetIndex * tabWidth;
                updateLiquidAnchors(startXTabs, targetXTabs, isDraggingTabsSV, tabIndicatorX.value, targetPos);
                tabIndicatorX.value = withSpring(targetPos, SNAP_SPRING_CONFIG);
                isGrabbingTabIndicator.current = false;
            }
        })
    ).current;

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tabIndicatorX.value },
            { scale: tabScale.value }
        ],
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 8) / 3 : 0,
    }));

    const SkeletonThemeItem = () => (
        <View style={{
            width: '31%', aspectRatio: 0.83, marginBottom: 8, borderRadius: 12, marginTop: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
            <PremiumSkeleton width={48} height={48} borderRadius={24} />
            <PremiumSkeleton width="60%" height={10} borderRadius={5} />
        </View>
    );

    const SkeletonSkinItem = () => (
        <View style={{
            width: '31%', height: (Dimensions.get('window').width - 32) / 3 * 1.25, marginBottom: 8, borderRadius: 12, marginTop: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', gap: 12
        }}>
            <PremiumSkeleton width={40} height={56} borderRadius={4} />
            <PremiumSkeleton width="70%" height={10} borderRadius={5} />
        </View>
    );

    const SkeletonFrameItem = () => (
        <View style={{
            width: '31%', borderRadius: 12, marginTop: 15, paddingVertical: 15, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
            <PremiumSkeleton width={60} height={60} borderRadius={30} />
            <PremiumSkeleton width="60%" height={10} borderRadius={5} />
        </View>
    );

    const renderPersonalizationSkeleton = () => {
        let content = null;
        if (activeTab === 0) content = (<View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <SkeletonThemeItem key={i} />)}</View>);
        else if (activeTab === 1) content = (<View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <SkeletonSkinItem key={i} />)}</View>);
        else if (activeTab === 2) content = (<View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <SkeletonFrameItem key={i} />)}</View>);

        return <View style={{ flex: 1, overflow: 'hidden' }}>{content}</View>;
    };

    return (
        <>
            <ClassyModal
                visible={visible}
                onClose={
                    showRules ? () => handleShowRules(false) :
                        showPersonalization ? () => handleShowPersonalization(false) :
                            showPreferences ? () => handleShowPreferences(false) :
                                showAccount ? () => handleShowAccount(false) :
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
                <Animated.View style={containerStyle}>
                    {showPersonalization ? (
                        <Animated.View
                            key="personalization"
                            entering={(navDir === 'forward' ? FadeInRight : FadeInLeft).duration(250).easing(Easing.out(Easing.quad))}
                            exiting={(navDir === 'forward' ? FadeOutLeft : FadeOutRight).duration(250).easing(Easing.out(Easing.quad))}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                            <View onLayout={(e) => handleContentLayout(e, showPersonalization)} style={{ gap: 15 }}>
                                <View
                                    style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 15 }}
                                    onLayout={(e) => { tabBarWidth.value = e.nativeEvent.layout.width; }}
                                    {...tabsPanResponder.panHandlers}
                                >
                                    <Animated.View style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, backgroundColor: theme.colors.accent, borderRadius: 8 }, indicatorStyle]} />
                                    {[t('tab_themes'), t('tab_cards'), t('tab_frames')].map((tab, index) => (
                                        <SettingsTabItem
                                            key={tab}
                                            title={tab}
                                            index={index}
                                            onPress={() => handleTabPress(index)}
                                            tabIndicatorX={tabIndicatorX}
                                            tabBarWidth={tabBarWidth}
                                            theme={theme}
                                        />
                                    ))}
                                </View>

                                <View style={{ height: Dimensions.get('window').height * 0.40 }}>
                                    {!readyViews.includes(`style_${activeTab}`) ? (
                                        renderPersonalizationSkeleton()
                                    ) : (
                                        <>
                                            {activeTab === 0 && <ThemeSelectionModal onBack={() => { setNavDir('back'); setTimeout(() => handleShowPersonalization(false), 0); }} hideBackButton={true} />}
                                            {activeTab === 1 && <SkinSelectionModal onBack={() => { setNavDir('back'); setTimeout(() => handleShowPersonalization(false), 0); }} hideBackButton={true} />}
                                            {activeTab === 2 && <FrameSelectionModal onBack={() => { setNavDir('back'); setTimeout(() => handleShowPersonalization(false), 0); }} hideBackButton={true} />}
                                        </>
                                    )}
                                </View>

                                <PremiumPressable
                                    onPress={() => { setNavDir('back'); setTimeout(() => handleShowPersonalization(false), 0); }}
                                    enableSound={false}
                                    style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0, marginTop: 10 }]}
                                    rippleColor="rgba(255, 255, 255, 0.2)"
                                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                                >
                                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                                </PremiumPressable>
                            </View>
                        </Animated.View>
                    ) : showRules ? (
                        <Animated.View
                            key="rules"
                            entering={(navDir === 'forward' ? FadeInRight : FadeInLeft).duration(250).easing(Easing.out(Easing.quad))}
                            exiting={(navDir === 'forward' ? FadeOutLeft : FadeOutRight).duration(250).easing(Easing.out(Easing.quad))}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                            <View onLayout={(e) => handleContentLayout(e, showRules)} style={{ gap: 15 }}>
                                {!readyViews.includes('rules') ? (
                                    <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 20, minHeight: 200 }}>
                                        {[1, 2, 3].map(i => (
                                            <View key={i} style={{ gap: 10 }}>
                                                <PremiumSkeleton width="40%" height={24} borderRadius={6} />
                                                <PremiumSkeleton width="100%" height={12} borderRadius={4} />
                                                <PremiumSkeleton width="90%" height={12} borderRadius={4} />
                                                <PremiumSkeleton width="95%" height={12} borderRadius={4} />
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <>
                                        <ScrollView
                                            ref={rulesScrollRef}
                                            showsVerticalScrollIndicator={false}
                                            style={{ flexGrow: 1, maxHeight: Dimensions.get('window').height * 0.45, marginBottom: 15 }}
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
                                            </View>
                                        </ScrollView>
                                        <PremiumPressable
                                            onPress={() => { setNavDir('back'); setTimeout(() => setShowRules(false), 0); }}
                                            enableSound={false}
                                            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0 }]}
                                            rippleColor="rgba(255, 255, 255, 0.2)"
                                            contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                                        >
                                            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                                        </PremiumPressable>
                                    </>
                                )}
                            </View>
                        </Animated.View>
                    ) : showNotifications ? (
                        <Animated.View
                            key="notifications"
                            entering={(navDir === 'forward' ? FadeInRight : FadeInLeft).duration(250).easing(Easing.out(Easing.quad))}
                            exiting={(navDir === 'forward' ? FadeOutLeft : FadeOutRight).duration(250).easing(Easing.out(Easing.quad))}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                            <View onLayout={(e) => handleContentLayout(e, showNotifications)} style={{ gap: 15 }}>
                                <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                                    <View style={[styles.row, { borderTopWidth: 0, paddingTop: 6 }]}>
                                        <View>
                                            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_friend_room')}</Text>
                                            <Text style={styles.rowSub}>{t('notify_friend_room_desc', { defaultValue: 'Ricevi una notifica quando un amico crea una stanza.' })}</Text>
                                        </View>
                                        <PremiumToggle
                                            value={authUser?.notificationSettings?.notifyFriendRoom !== false}
                                            onValueChange={() => toggleNotificationSetting('notifyFriendRoom', authUser?.notificationSettings?.notifyFriendRoom !== false)}
                                        />
                                    </View>
                                    <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                        <View>
                                            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_room_join')}</Text>
                                            <Text style={styles.rowSub}>{t('notify_room_join_desc', { defaultValue: 'Ricevi una notifica quando qualcuno entra nella tua stanza.' })}</Text>
                                        </View>
                                        <PremiumToggle
                                            value={authUser?.notificationSettings?.notifyRoomJoin !== false}
                                            onValueChange={() => toggleNotificationSetting('notifyRoomJoin', authUser?.notificationSettings?.notifyRoomJoin !== false)}
                                        />
                                    </View>
                                    <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                        <View>
                                            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_daily_dc')}</Text>
                                            <Text style={styles.rowSub}>{t('notify_daily_dc_desc', { defaultValue: 'Ricevi un promemoria per il tuo bonus quotidiano 24h dopo averlo riscosso.' })}</Text>
                                        </View>
                                        <PremiumToggle
                                            value={authUser?.notificationSettings?.notifyDailyDc !== false}
                                            onValueChange={() => toggleNotificationSetting('notifyDailyDc', authUser?.notificationSettings?.notifyDailyDc !== false)}
                                        />
                                    </View>
                                    <View style={[styles.row, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 }]}>
                                        <View>
                                            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{t('notify_friend_request')}</Text>
                                            <Text style={styles.rowSub}>{t('notify_friend_request_desc', { defaultValue: 'Ricevi una notifica quando qualcuno ti invia una richiesta di amicizia.' })}</Text>
                                        </View>
                                        <PremiumToggle
                                            value={authUser?.notificationSettings?.notifyFriendRequest !== false}
                                            onValueChange={() => toggleNotificationSetting('notifyFriendRequest', authUser?.notificationSettings?.notifyFriendRequest !== false)}
                                        />
                                    </View>
                                </View>
                                <PremiumPressable
                                    onPress={() => { setNavDir('back'); setTimeout(() => setShowNotifications(false), 0); }}
                                    enableSound={false}
                                    style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0, marginTop: 10 }]}
                                    rippleColor="rgba(255, 255, 255, 0.2)"
                                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                                >
                                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                                </PremiumPressable>
                            </View>
                        </Animated.View>
                    ) : showPreferences ? (
                        <Animated.View
                            key="preferences"
                            entering={(navDir === 'forward' ? FadeInRight : FadeInLeft).duration(250).easing(Easing.out(Easing.quad))}
                            exiting={(navDir === 'forward' ? FadeOutLeft : FadeOutRight).duration(250).easing(Easing.out(Easing.quad))}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                            <View onLayout={(e) => handleContentLayout(e, showPreferences)} style={{ gap: 15 }}>
                                {!readyViews.includes('audio') ? (
                                    <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)', gap: 20 }]}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <View key={i} style={[styles.row, { paddingVertical: 4 }]}>
                                                <View style={{ gap: 6 }}>
                                                    <PremiumSkeleton width={120} height={14} borderRadius={4} />
                                                    <PremiumSkeleton width={180} height={10} borderRadius={4} />
                                                </View>
                                                <PremiumSkeleton width={50} height={28} borderRadius={14} />
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={[styles.settingsGroup, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                                        <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12 }]}>
                                            <View>
                                                <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>LINGUA / LANGUAGE</Text>
                                                <Text style={styles.rowSub}>Italiano / English</Text>
                                            </View>
                                            <View
                                                style={{
                                                    position: 'relative',
                                                    flexDirection: 'row',
                                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                                    borderRadius: 10,
                                                    padding: 3,
                                                    width: 100,
                                                    height: 32
                                                }}
                                                {...langPanResponder.panHandlers}
                                            >
                                                {/* Animated Indicator */}
                                                <Animated.View
                                                    style={[
                                                        {
                                                            position: 'absolute',
                                                            left: 3,
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
                                                <ModalLanguageItem lang="it" translateX={dragXLang} theme={theme} onPress={() => setLanguage('it')} />
                                                <ModalLanguageItem lang="en" translateX={dragXLang} theme={theme} onPress={() => setLanguage('en')} />
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
                                )}

                                <PremiumPressable
                                    onPress={() => { setNavDir('back'); setTimeout(() => handleShowPreferences(false), 0); }}
                                    enableSound={false}
                                    style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0, marginTop: 10 }]}
                                    rippleColor="rgba(255, 255, 255, 0.2)"
                                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                                >
                                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                                </PremiumPressable>
                            </View>
                        </Animated.View>

                    ) : showAccount ? (
                        <Animated.View
                            key="account"
                            entering={(navDir === 'forward' ? FadeInRight : FadeInLeft).duration(250).easing(Easing.out(Easing.quad))}
                            exiting={(navDir === 'forward' ? FadeOutLeft : FadeOutRight).duration(250).easing(Easing.out(Easing.quad))}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                            <View onLayout={(e) => handleContentLayout(e, showAccount)} style={{ gap: 15 }}>
                                {!readyViews.includes('account') ? (
                                    <View style={{ padding: 16, backgroundColor: 'rgba(220, 38, 38, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.2)', gap: 15 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <PremiumSkeleton width={20} height={20} borderRadius={10} />
                                            <PremiumSkeleton width={130} height={14} borderRadius={4} />
                                        </View>
                                        <PremiumSkeleton width="100%" height={10} borderRadius={4} />
                                        <PremiumSkeleton width="80%" height={10} borderRadius={4} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
                                            <PremiumSkeleton width="70%" height={45} borderRadius={8} />
                                            <PremiumSkeleton width="25%" height={45} borderRadius={8} />
                                        </View>
                                    </View>
                                ) : (
                                    <>
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
                                    </>
                                )}
                                <PremiumPressable
                                    onPress={() => { setNavDir('back'); setTimeout(() => setShowAccount(false), 0); }}
                                    enableSound={false}
                                    style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 20, elevation: 20, paddingVertical: 0, marginTop: 10 }]}
                                    rippleColor="rgba(255, 255, 255, 0.2)"
                                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
                                >
                                    <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>{t('back_button')}</Text>
                                </PremiumPressable>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View
                            key="main"
                            entering={(navDir === 'forward' ? FadeInRight : FadeInLeft).duration(250).easing(Easing.out(Easing.quad))}
                            exiting={(navDir === 'forward' ? FadeOutLeft : FadeOutRight).duration(250).easing(Easing.out(Easing.quad))}
                            style={{ width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        >
                            <View onLayout={(e) => handleContentLayout(e, !showRules && !showPersonalization && !showPreferences && !showNotifications && !showAccount)} style={{ gap: 8 }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                    <CategoryTile
                                        title={t('style_cat')}
                                        subtitle={t('style_sub')}
                                        icon={<PaletteIcon size={28} color={theme.colors.accent} />}
                                        onPress={() => { setNavDir('forward'); setTimeout(() => handleShowPersonalization(true), 0); }}
                                    />
                                    <CategoryTile
                                        title={t('audio_cat')}
                                        subtitle={t('sound_music_vib')}
                                        icon={<SettingsIcon size={28} color="#94a3b8" />}
                                        onPress={() => { setNavDir('forward'); setTimeout(() => handleShowPreferences(true), 0); }}
                                    />
                                    {!roomCode && (
                                        <CategoryTile
                                            title={t('account_profile')}
                                            subtitle="Recupero"
                                            icon={<EyeIcon size={28} color="#ef4444" />}
                                            onPress={() => { setNavDir('forward'); setTimeout(() => handleShowAccount(true), 0); }}
                                        />
                                    )}
                                    <CategoryTile
                                        title={t('rules_cat')}
                                        subtitle={t('manual_sub')}
                                        icon={<RulesIcon size={28} color="#3b82f6" />}
                                        onPress={() => { setNavDir('forward'); setTimeout(() => handleShowRules(true), 0); }}
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
                            </View>
                        </Animated.View>
                    )}
                </Animated.View>
            </ClassyModal>
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
