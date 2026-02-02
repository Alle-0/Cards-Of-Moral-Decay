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
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { RANK_COLORS, RANK_THRESHOLDS } from '../constants/Ranks';
import LocalAvatar from '../components/LocalAvatar';

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
        transform: [{ translateX: tabIndicatorX.value }],
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 8) / 3 : 0,
    }));

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            {/* Header Title */}
            <Text style={{ color: '#d4af37', fontFamily: 'Cinzel-Bold', fontSize: 24, marginTop: 50, marginBottom: 20, textAlign: 'center' }}>
                {t('inventory_title')}
            </Text>


            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* Tab Bar */}
                <View
                    style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 15 }}
                    onLayout={(e) => {
                        tabBarWidth.value = e.nativeEvent.layout.width;
                    }}
                >
                    <Animated.View style={[
                        {
                            position: 'absolute',
                            top: 4, bottom: 4, left: 4,
                            backgroundColor: theme.colors.accent,
                            borderRadius: 8,
                        },
                        indicatorStyle
                    ]} />

                    {tabs.map((tab, index) => {
                        const isActive = activeTab === index;
                        return (
                            <Pressable
                                key={index} // Use index key as names change with language
                                onPress={() => handleTabPress(index)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    alignItems: 'center',
                                    borderRadius: 8,
                                    zIndex: 1
                                }}
                            >
                                <Text style={{
                                    color: isActive ? '#000' : theme.colors.textPrimary,
                                    fontFamily: 'Outfit-Bold',
                                    fontSize: 13,
                                    includeFontPadding: false
                                }}>
                                    {tab}
                                </Text>
                            </Pressable>
                        );
                    })}
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
