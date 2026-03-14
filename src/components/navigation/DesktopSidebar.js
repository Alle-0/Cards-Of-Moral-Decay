import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const DESKTOP_ROUTES = [
    { name: 'Shop', key: 'shop' },
    { name: 'Stile', key: 'style_cat' },
    { name: 'Lobby', key: 'play' },
    { name: 'Friends', key: 'friends' },
    { name: 'Settings', key: 'settings' },
];

function NavItem({ route, isFocused, onNavigate, accentColor, t }) {
    const [hovered, setHovered] = useState(false);
    const scale = useSharedValue(1);
    const bgOpacity = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleHoverIn = () => {
        setHovered(true);
        scale.value = withTiming(1.02, { duration: 150 });
    };

    const handleHoverOut = () => {
        setHovered(false);
        scale.value = withTiming(1, { duration: 150 });
    };

    const handlePressIn = () => {
        scale.value = withTiming(0.96, { duration: 80 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(hovered ? 1.02 : 1, { duration: 120 });
    };

    return (
        <Pressable
            key={route.name}
            onPress={() => onNavigate?.(route.name)}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.navItemButton}
        >
            <Animated.View style={[
                styles.navItemContent,
                animStyle,
                {
                    backgroundColor: isFocused
                        ? accentColor + '22'
                        : hovered
                            ? 'rgba(255,255,255,0.05)'
                            : 'transparent',
                    borderLeftWidth: 4,
                    borderLeftColor: isFocused
                        ? accentColor
                        : hovered
                            ? accentColor + '55'
                            : 'transparent',
                }
            ]}>
                <Text style={[
                    styles.navLabel,
                    {
                        color: isFocused
                            ? accentColor
                            : hovered
                                ? 'rgba(255,255,255,0.85)'
                                : 'rgba(255,255,255,0.45)'
                    }
                ]}>
                    {t(route.key)}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

// Standalone sidebar that receives activeTab and onNavigate via props from AppNavigator
export default function DesktopSidebar({ activeTab, onNavigate }) {
    const { theme } = useTheme();
    const { t } = useLanguage();

    return (
        <View style={[styles.sidebarContainer, { borderRightColor: theme.colors.cardBorder }]}>
            {/* Fully opaque backgrounds to block content bleed-through */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0c0c0c' }]} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface, opacity: 0.96 }]} />

            {/* Logo */}
            <View style={styles.header}>
                <Text style={[styles.headerLogo, { color: theme.colors.accent }]}>CARDS OF</Text>
                <Text style={[styles.headerLogoLarge, { color: theme.colors.accent }]}>MORAL DECAY</Text>
            </View>

            {/* Nav items */}
            <View style={styles.navItems}>
                {DESKTOP_ROUTES.map(route => (
                    <NavItem
                        key={route.name}
                        route={route}
                        isFocused={activeTab === route.name}
                        onNavigate={onNavigate}
                        accentColor={theme.colors.accent}
                        t={t}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sidebarContainer: {
        width: 250,
        height: Platform.OS === 'web' ? '100vh' : '100%',
        borderRightWidth: 1,
        paddingTop: 40,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
        paddingHorizontal: 20,
    },
    headerLogo: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        letterSpacing: 4,
        opacity: 0.8,
        marginBottom: -5,
    },
    headerLogoLarge: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 18,
        letterSpacing: 1,
    },
    navItems: {
        flex: 1,
        gap: 4,
        paddingHorizontal: 10,
    },
    navItemButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    navItemContent: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'flex-start',
        borderRadius: 12,
    },
    navLabel: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 16,
        letterSpacing: 1,
    }
});
