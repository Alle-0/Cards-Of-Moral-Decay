import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import PremiumPressable from '../components/PremiumPressable';
import PremiumBackground from '../components/PremiumBackground';
import ThemeSelectionModal from '../components/ThemeSelectionModal';
import SkinSelectionModal from '../components/SkinSelectionModal';
import FrameSelectionModal from '../components/FrameSelectionModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { RANK_COLORS, RANK_THRESHOLDS } from '../constants/Ranks';
import LocalAvatar from '../components/LocalAvatar';
import { useRef } from 'react';
import { PanResponder, RunOnJS } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, interpolateColor, useDerivedValue, withSequence } from 'react-native-reanimated';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';

import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import HapticsService from '../services/HapticsService';

const TabItem = ({ title, index, tabBarWidth, tabIndicatorX, theme }) => {
    const textColorStyle = useAnimatedStyle(() => {
        if (tabBarWidth.value <= 0) return {};

        const tabWidth = (tabBarWidth.value - 8) / 3;
        const start = (index - 1) * tabWidth;
        const center = index * tabWidth;
        const end = (index + 1) * tabWidth;

        const color = interpolateColor(
            tabIndicatorX.value,
            [start, center, end],
            [theme.colors.textPrimary + '88', '#000000', theme.colors.textPrimary + '88']
        );

        return { color };
    });

    return (
        <View
            style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 8,
                zIndex: 10, // Ensure text is above indicator
            }}
            pointerEvents="none"
        >
            <Animated.Text style={[
                {
                    fontFamily: 'Outfit-Bold',
                    fontSize: 13,
                    includeFontPadding: false
                },
                textColorStyle
            ]}>
                {title}
            </Animated.Text>
        </View>
    );
};

const PersonalizationScreen = () => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(0);
    const insets = useSafeAreaInsets();
    const [showExitModal, setShowExitModal] = useState(false);

    const { user } = useAuth();

    const tabBarWidth = useSharedValue(0);
    const tabIndicatorX = useSharedValue(0);

    // Localized Tabs
    const tabs = [t('tab_themes'), t('tab_cards'), t('tab_frames')];

    // [NEW] Track layout width on JS side for PanResponder
    const tabBarWidthRef = useRef(0);
    const isInteracting = useRef(false);

    // [NEW] Track activeTab in ref to avoid stale closure
    const activeTabRef = useRef(activeTab);

    // Sync animation when activeTab changes (only if NOT interacting)
    // Sync animation when activeTab changes (only if NOT interacting)
    useEffect(() => {
        activeTabRef.current = activeTab; // [FIX] Sync ref
        if (!isInteracting.current && tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 3;
            const targetPos = activeTab * tabWidth;

            // [FIX] Anchors for midpoint peak
            startX.value = tabIndicatorX.value;
            targetX.value = targetPos;

            tabIndicatorX.value = withSpring(targetPos, {
                damping: 40,
                stiffness: 200,
                overshootClamping: true
            });
        }
    }, [activeTab]);

    // [NEW] Scale Animation anchors
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDraggingSV = useSharedValue(false);

    // [NEW] Use shared hook for liquid scaling
    const indicatorScale = useLiquidScale(tabIndicatorX, startX, targetX, isDraggingSV, 1.12); // Slightly more subtle for inventory (1.12)

    // [NEW] Track if we are dragging the indicator
    const isGrabbingIndicator = useRef(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            // [FIX] Aggressively capture touch to prevent parent ScrollView/Pager from stealing it
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX } = evt.nativeEvent;
                if (tabBarWidthRef.current <= 0) return;
                const tabWidth = (tabBarWidthRef.current - 8) / 3;

                // Determine which tab was touched relative to the bar
                const touchedIndex = Math.floor((locationX - 4) / tabWidth);

                // [FIX] Only allow drag if touching the ACTIVE tab (the indicator)
                const isGrabbing = (touchedIndex === activeTabRef.current);
                isGrabbingIndicator.current = isGrabbing; // We need a new ref for this if not exists, or verify implementation

                // [FIX] Scale up ONLY if touching the ACTIVE tab
                isInteracting.current = true;

                if (isGrabbing) {
                    HapticsService.trigger('selection');
                    isDraggingSV.value = true;
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                // [FIX] Only move if we explicitly grabbed the indicator
                if (!isGrabbingIndicator.current) return;

                if (tabBarWidthRef.current <= 0) return;
                const tabWidth = (tabBarWidthRef.current - 8) / 3;
                const startX = activeTabRef.current * tabWidth;
                let newX = startX + gestureState.dx;
                const maxRange = (tabBarWidthRef.current - 8) - tabWidth;

                // Clamp
                newX = Math.max(0, Math.min(newX, maxRange));
                tabIndicatorX.value = newX;
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (tabBarWidthRef.current <= 0) return;
                const tabWidth = (tabBarWidthRef.current - 8) / 3;

                // Calculate target index
                let targetIndex = activeTabRef.current;

                // Check if it was a click (small movement) or a drag release
                const isClick = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;

                if (isClick) {
                    // It's a click: navigate to the touched tab
                    const touchX = evt.nativeEvent.locationX;
                    targetIndex = Math.floor((touchX - 4) / tabWidth);
                } else if (isGrabbingIndicator.current) {
                    // It was a drag: snap to nearest slot based on drop position
                    const currentX = tabIndicatorX.value;
                    targetIndex = Math.round(currentX / tabWidth);
                } else {
                    // dragged from non-active tab? ignore drag, stay on current
                    targetIndex = activeTabRef.current;
                }

                // Clamp index
                targetIndex = Math.max(0, Math.min(2, targetIndex));

                // Feedback if changing
                if (targetIndex !== activeTabRef.current) {
                    HapticsService.trigger('light');
                }

                setActiveTab(targetIndex);

                const targetPos = targetIndex * tabWidth;

                // [FIX] Anchors for snap
                updateLiquidAnchors(startX, targetX, isDraggingSV, tabIndicatorX.value, targetPos);

                // Snap animation
                tabIndicatorX.value = withSpring(targetPos, SNAP_SPRING_CONFIG);

                isInteracting.current = false;
                isGrabbingIndicator.current = false;
            }
        })
    ).current;

    // Android Back Handler
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const backAction = () => {
                setShowExitModal(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }, [])
    );

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tabIndicatorX.value },
            { scale: indicatorScale.value } // [NEW] Apply scale
        ],
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 8) / 3 : 0,
    }));

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            {/* Header Title */}
            <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 24, marginTop: 50, marginBottom: 20, textAlign: 'center' }}>
                {t('inventory_title')}
            </Text>


            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* Tab Bar */}
                <View
                    style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    onLayout={(e) => {
                        const w = e.nativeEvent.layout.width;
                        tabBarWidth.value = w;
                        tabBarWidthRef.current = w;
                    }}
                    {...panResponder.panHandlers}
                >
                    <Animated.View style={[
                        {
                            position: 'absolute',
                            top: 4, bottom: 4, left: 4,
                            backgroundColor: theme.colors.accent,
                            borderRadius: 8,
                        },
                        indicatorStyle
                    ]} pointerEvents="none" />

                    {tabs.map((tab, index) => (
                        <TabItem
                            key={index}
                            title={tab}
                            index={index}
                            tabBarWidth={tabBarWidth}
                            tabIndicatorX={tabIndicatorX}
                            theme={theme}
                        />
                    ))}
                </View>

                <View style={{ flex: 1 }}>
                    {activeTab === 0 && <ThemeSelectionModal onBack={() => { }} hideBackButton={true} />}
                    {activeTab === 1 && <SkinSelectionModal onBack={() => { }} hideBackButton={true} />}
                    {activeTab === 2 && <FrameSelectionModal onBack={() => { }} hideBackButton={true} />}
                </View>
            </View>

            <ConfirmationModal
                visible={showExitModal}
                onClose={() => setShowExitModal(false)}
                title={t('exit_app_title')}
                message={t('exit_app_msg')}
                confirmText={t('exit_btn_small')}
                onConfirm={() => BackHandler.exitApp()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
});

export default PersonalizationScreen;
