import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LinearGradient } from 'expo-linear-gradient'; // [NEW] Shared Gradient
import LobbyScreen from '../screens/LobbyScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ShopScreen from '../screens/ShopScreen';
import PersonalizationScreen from '../screens/PersonalizationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PremiumTabBar from '../components/navigation/PremiumTabBar';
import ThemeBackground from '../components/ThemeBackground'; // [NEW] Shared Background
import { useTheme } from '../context/ThemeContext';

const Tab = createMaterialTopTabNavigator();

export default function AppNavigator({ onStartLoading }) {
    const { theme } = useTheme();

    return (
        <View style={{ flex: 1 }}>
            {/* [NEW] GLOBAL SHARED BACKGROUND - Fuses adjacent pages */}
            <LinearGradient
                colors={theme.colors.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <ThemeBackground />

            <Tab.Navigator
                initialRouteName="Lobby"
                backBehavior="none"
                tabBar={props => <PremiumTabBar {...props} />}
                tabBarPosition="bottom"
                screenOptions={{
                    swipeEnabled: true,
                    animationEnabled: true,
                    lazy: true,
                    lazyPreloadDistance: 1,
                    tabBarIndicatorStyle: { opacity: 0 },
                    gestureHandlerProps: {
                        activeOffsetX: [-30, 30],
                        failOffsetY: [-5, 5]
                    }
                }}
                style={{ backgroundColor: 'transparent' }} // Ensure the navigator container is also transparent
            >
                {/* 1. SHOP (Banca/Acquisti) */}
                <Tab.Screen
                    name="Shop"
                    component={ShopScreen}
                    options={{ tabBarLabel: 'Shop' }}
                />

                {/* 2. STILE (Inventario/Personalizzazione) */}
                <Tab.Screen
                    name="Stile"
                    component={PersonalizationScreen}
                    options={{ tabBarLabel: 'Stile' }}
                />

                {/* 3. LOBBY (Centrale) */}
                <Tab.Screen
                    name="Lobby"
                    options={{ tabBarLabel: 'Gioca' }}
                >
                    {props => <LobbyScreen {...props} onStartLoading={onStartLoading} />}
                </Tab.Screen>

                {/* 4. AMICI */}
                <Tab.Screen
                    name="Friends"
                    component={FriendsScreen}
                    options={{ tabBarLabel: 'Complici' }}
                />

                {/* 5. IMPOSTAZIONI */}
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ tabBarLabel: 'Opzioni' }}
                />
            </Tab.Navigator>
        </View>
    );
}
