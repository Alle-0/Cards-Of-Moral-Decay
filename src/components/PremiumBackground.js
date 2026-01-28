import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import ThemeBackground from './ThemeBackground';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const NoisePattern = () => (
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            opacity="0.05"
        />
    </Svg>
);

const PremiumBackground = ({ children, showParticles = true, immediate = false }) => {
    const { theme, animationsEnabled } = useTheme();

    // Cross-fade state
    const [baseTheme, setBaseTheme] = useState(theme);
    const [overlayTheme, setOverlayTheme] = useState(null);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (immediate) {
            setBaseTheme(theme);
            setOverlayTheme(null);
            opacity.value = 0;
            return;
        }

        if (theme.id !== (overlayTheme?.id || baseTheme.id)) {
            // Step 1: Place NEW theme in overlay and start fade instantly
            setOverlayTheme(theme);
            opacity.value = 0;
            opacity.value = withTiming(1, {
                duration: 1000,
                easing: Easing.bezier(0.33, 1, 0.68, 1) // Snappy start
            }, (finished) => {
                if (finished) {
                    runOnJS(finalizeTransition)(theme);
                }
            });
        }
    }, [theme.id, immediate]);

    const finalizeTransition = (newTheme) => {
        // Step 2: Swap base layer to new theme (while still hidden under overlay)
        setBaseTheme(newTheme);

        // Step 3: Wait long enough for base layer particles to initialize (300ms)
        setTimeout(() => {
            setOverlayTheme(null);
            opacity.value = 0;
        }, 300);
    };

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar style="light" />

            {/* Layer 1: Base Theme (Stable Anchor) */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={baseTheme.colors.background}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <ThemeBackground visible={showParticles && animationsEnabled} forceTheme={baseTheme} />
            </View>

            {/* Layer 2: Overlay Theme (Fades In) */}
            {overlayTheme && (
                <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
                    <LinearGradient
                        colors={overlayTheme.colors.background}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <ThemeBackground visible={showParticles && animationsEnabled} forceTheme={overlayTheme} />
                </Animated.View>
            )}

            {/* SVG Noise Texture Overlay (Global) */}
            <View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} pointerEvents="none">
                <NoisePattern />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
});

export default PremiumBackground;
