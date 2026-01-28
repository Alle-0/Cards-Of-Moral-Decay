import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 15;

const Particle = ({ emoji, animationType, delay }) => {
    const x = useSharedValue(Math.random() * width);
    const y = useSharedValue(Math.random() * height);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Reset
        opacity.value = 0;
        scale.value = 0;

        const duration = 2000 + Math.random() * 3000;

        if (animationType === 'rise') { // Fire
            y.value = withDelay(delay, withRepeat(withTiming(y.value - 200, { duration, easing: Easing.linear }), -1));
            opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: duration - 500 })), -1));
            scale.value = withDelay(delay, withRepeat(withSequence(withTiming(1.2, { duration: 1000 }), withTiming(0.5, { duration: duration - 1000 })), -1));
        }
        else if (animationType === 'float') { // Water/Bubbles
            y.value = withDelay(delay, withRepeat(withTiming(y.value - 300, { duration: 4000, easing: Easing.linear }), -1));
            opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0.8, { duration: 1000 }), withTiming(0, { duration: 3000 })), -1));
            scale.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 2000 }), withTiming(1.5, { duration: 2000 })), -1));
        }
        else if (animationType === 'fall') { // Leaves
            y.value = withDelay(delay, withRepeat(withTiming(y.value + 300, { duration: 5000, easing: Easing.linear }), -1));
            rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 4000 }), -1));
            opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 4000 })), -1));
            scale.value = withDelay(delay, withTiming(1, { duration: 500 }));
        }
        else { // Default/Sparkle/Pulse
            scale.value = withDelay(delay, withRepeat(withSequence(withTiming(1.5, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1));
            opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1));
            rotate.value = withDelay(delay, withRepeat(withTiming(180, { duration: 3000 }), -1));
        }

        return () => {
            cancelAnimation(x);
            cancelAnimation(y);
            cancelAnimation(opacity);
            cancelAnimation(scale);
            cancelAnimation(rotate);
        };
    }, [animationType, delay]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x.value },
                { translateY: y.value },
                { scale: scale.value },
                { rotate: `${rotate.value}deg` }
            ],
            opacity: opacity.value,
        };
    });

    const particleColor = (emoji === '⚫' || theme.id === 'onice') ? '#fff' : (theme.colors.particle || theme.colors.accent);

    return (
        <Animated.View style={[
            styles.particle,
            animatedStyle,
            {
                backgroundColor: particleColor,
                shadowColor: particleColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 6,
            }
        ]} />
    );
};

const ParticleSystem = () => {
    const { theme } = useTheme();
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const arr = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
            id: i,
            delay: i * 200,
        }));
        setParticles(arr);
    }, []);

    const getAnimationType = () => {
        switch (theme.particleConfig) {
            case 'flameRise': return 'rise';
            case 'bubbleFloat': return 'float';
            case 'leafFall': return 'fall';
            case 'petalFloat': return 'float';
            default: return 'pulse';
        }
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <Particle
                    key={p.id}
                    emoji={theme.colors.particleEmoji}
                    animationType={getAnimationType()}
                    delay={p.delay}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default ParticleSystem;
