import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolateColor } from 'react-native-reanimated';
import HapticsService from '../services/HapticsService';
import { useTheme } from '../context/ThemeContext';

const PremiumToggle = ({ value, onValueChange, size = 28 }) => {
    const { theme } = useTheme();
    const offset = useSharedValue(value ? 1 : 0);

    // Track dimensions
    const trackWidth = size * 1.8;
    const trackHeight = size;
    const thumbSize = size - 4;
    const padding = 2;

    useEffect(() => {
        offset.value = withTiming(value ? 1 : 0, { duration: 250 });
    }, [value]);

    const handlePress = () => {
        HapticsService.trigger('light');
        onValueChange(!value);
    };

    const trackAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            offset.value,
            [0, 1],
            ['#333333', theme.colors.accent]
        );
        return { backgroundColor };
    });

    const thumbAnimatedStyle = useAnimatedStyle(() => {
        const translateX = (trackWidth - thumbSize - (padding * 2)) * offset.value;
        return {
            transform: [{ translateX }]
        };
    });

    return (
        <Pressable onPress={handlePress} activeOpacity={0.8} hitSlop={10} android_disableSound={true}>
            <Animated.View style={[
                styles.track,
                { width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2, padding },
                trackAnimatedStyle
            ]}>
                <Animated.View style={[
                    styles.thumb,
                    { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 },
                    thumbAnimatedStyle
                ]} />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    track: {
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'visible' // Allow glow?
    },
    thumb: {
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    }
});

export default PremiumToggle;
