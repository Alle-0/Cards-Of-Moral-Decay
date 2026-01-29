import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import LobbyScreen from '../screens/LobbyScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ShopScreen from '../screens/ShopScreen';
import PersonalizationScreen from '../screens/PersonalizationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PremiumTabBar from '../components/navigation/PremiumTabBar';

const Tab = createMaterialTopTabNavigator();

export default function AppNavigator({ onStartLoading }) {
    return (
        <Tab.Navigator
            initialRouteName="Lobby"
            backBehavior="none"
            tabBar={props => <PremiumTabBar {...props} />}
            tabBarPosition="bottom"
            screenOptions={{
                swipeEnabled: true,
                lazy: true,
                lazyPreloadDistance: 1,
                tabBarIndicatorStyle: { opacity: 0 }
            }}
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
    );
}
