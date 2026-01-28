import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { RobotIcon } from './Icons';
import SoundService from '../services/SoundService';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const JokerOverlay = ({ visible, onFinish }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            SoundService.play('tap');
            // Pulse Animation
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Subtle rotation
            rotate.value = withRepeat(
                withSequence(
                    withTiming(10, { duration: 1000 }),
                    withTiming(-10, { duration: 1000 })
                ),
                -1,
                true
            );

            // Finish after 2.5 seconds
            const timer = setTimeout(() => {
                if (onFinish) onFinish();
            }, 2500);

            return () => clearTimeout(timer);
        } else {
            scale.value = 1;
            rotate.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` }
        ]
    }));

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.overlay}
        >
            {/* Background Blur */}
            <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
                <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
            </View>

            <View style={styles.content}>
                <Animated.View style={[styles.glowContainer, animatedStyle]}>
                    <View style={[styles.glow, { backgroundColor: theme.colors.accent, opacity: 0.3 }]} />
                    <RobotIcon size={80} color={theme.colors.accent} />
                </Animated.View>

                <Text style={[styles.text, { color: theme.colors.accent }]}>
                    {t('ai_thinking')}
                </Text>
                <Text style={styles.subText}>
                    {t('calculating_response')}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2500,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    icon: {
        width: 80,
        height: 80,
        zIndex: 2,
    },
    text: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 24,
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
    },
    subText: {
        fontFamily: 'Outfit',
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        maxWidth: '80%',
    }
});

export default JokerOverlay;
