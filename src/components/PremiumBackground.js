import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
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

const PremiumBackground = ({ children, showParticles = true }) => {
    const { theme, animationsEnabled } = useTheme();

    const opacity = useSharedValue(0);

    useEffect(() => {
        // Fade effect when theme changes
        opacity.value = 0;
        opacity.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) });
    }, [theme.id]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background[0] }]}>
            <StatusBar style="light" />

            {/* Active Theme Gradient */}
            {Platform.OS === 'web' ? (
                <LinearGradient
                    colors={theme.colors.background}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            ) : (
                <AnimatedLinearGradient
                    colors={theme.colors.background}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, animatedStyle]}
                />
            )}

            {/* [NEW] Dynamic Theme Background (Effects + Textures) */}
            <ThemeBackground visible={showParticles && animationsEnabled} />

            {/* SVG Noise Texture Overlay */}
            <View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}>
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
