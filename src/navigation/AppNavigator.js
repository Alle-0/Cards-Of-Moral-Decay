import React, { useState, useRef, useCallback } from 'react';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useIsFocused } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LobbyScreen from '../screens/LobbyScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ShopScreen from '../screens/ShopScreen';
import PersonalizationScreen from '../screens/PersonalizationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PremiumTabBar from '../components/navigation/PremiumTabBar';
import DesktopSidebar from '../components/navigation/DesktopSidebar';
import ThemeBackground from '../components/ThemeBackground';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Tab = createMaterialTopTabNavigator();

const FadeTransitionWrapper = ({ children, isDesktop }) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(isDesktop ? 0 : 1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            flex: 1
        };
    });

    React.useEffect(() => {
        if (isDesktop) {
            opacity.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
        } else {
            opacity.value = 1;
        }
    }, [isFocused, isDesktop]);

    return (
        <Animated.View style={animatedStyle}>
            {children}
        </Animated.View>
    );
};

export default function AppNavigator({ onStartLoading, initialTab = 'Lobby' }) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width >= 1024;

    // Track active tab and expose the Tab navigator's navigation to the standalone sidebar
    const [activeTab, setActiveTab] = useState(initialTab);
    const tabNavRef = useRef(null);

    // Ghost tab bar: renders nothing on desktop but captures state + navigation ref
    const DesktopGhostTabBar = useCallback(({ state, navigation }) => {
        const currentName = state?.routes?.[state?.index]?.name;
        
        React.useEffect(() => {
            tabNavRef.current = navigation;
            if (currentName && currentName !== activeTab) {
                setActiveTab(currentName);
            }
        }, [currentName, navigation]);

        return null;
    }, [activeTab]);

    return (
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <LinearGradient
                colors={theme.colors.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <ThemeBackground />

            {/* Row layout on desktop: sidebar (fixed 250px) | content (flex 1) */}
            <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>

                {/* Standalone sidebar - no longer inside Tab.Navigator */}
                {isDesktop && (
                    <DesktopSidebar
                        activeTab={activeTab}
                        onNavigate={(name) => tabNavRef.current?.navigate(name)}
                    />
                )}

                {/* Tab content area */}
                <View style={[
                    { flex: 1 },
                    isDesktop && { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }
                ]}>
                    <View style={isDesktop ? { width: '100%', maxWidth: 1000, flex: 1 } : { flex: 1 }}>
                    <Tab.Navigator
                        initialRouteName={initialTab}
                        backBehavior="none"
                        tabBar={isDesktop
                            ? props => <DesktopGhostTabBar {...props} />
                            : props => <PremiumTabBar {...props} />
                        }
                        tabBarPosition="bottom"
                        sceneContainerStyle={{ backgroundColor: 'transparent' }}
                        screenOptions={{
                            swipeEnabled: !isDesktop,
                            animationEnabled: !isDesktop,
                            lazy: true,
                            lazyPreloadDistance: 1,
                            tabBarIndicatorStyle: { opacity: 0 },
                            gestureHandlerProps: {
                                activeOffsetX: [-30, 30],
                                failOffsetY: [-5, 5]
                            }
                        }}
                        style={{ backgroundColor: 'transparent' }}
                    >
                        <Tab.Screen name="Shop" options={{ tabBarLabel: t('shop') }}>
                            {props => <FadeTransitionWrapper isDesktop={isDesktop}><ShopScreen {...props} /></FadeTransitionWrapper>}
                        </Tab.Screen>
                        <Tab.Screen name="Stile" options={{ tabBarLabel: t('style_cat') }}>
                            {props => <FadeTransitionWrapper isDesktop={isDesktop}><PersonalizationScreen {...props} /></FadeTransitionWrapper>}
                        </Tab.Screen>
                        <Tab.Screen name="Lobby" options={{ tabBarLabel: t('play') }}>
                            {props => <FadeTransitionWrapper isDesktop={isDesktop}><LobbyScreen {...props} onStartLoading={onStartLoading} /></FadeTransitionWrapper>}
                        </Tab.Screen>
                        <Tab.Screen name="Friends" options={{ tabBarLabel: t('friends') }}>
                            {props => <FadeTransitionWrapper isDesktop={isDesktop}><FriendsScreen {...props} /></FadeTransitionWrapper>}
                        </Tab.Screen>
                        <Tab.Screen name="Settings" options={{ tabBarLabel: t('settings') }}>
                            {props => <FadeTransitionWrapper isDesktop={isDesktop}><SettingsScreen {...props} /></FadeTransitionWrapper>}
                        </Tab.Screen>
                    </Tab.Navigator>
                    </View>
                </View>
            </View>
        </View>
    );
}
