import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

const EfficientBlurView = ({ style, intensity = 20, tint = 'dark', children }) => {
    const { animationsEnabled } = useTheme();

    // On Android (especially emulators), BlurView is very expensive.
    // If animations are disabled, we assume the user wants performance.
    // We also force fallback on low-end androids if needed, but for now we link it to the toggle.
    if (!animationsEnabled) {
        return (
            <View style={[
                style,
                {
                    backgroundColor: tint === 'dark' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden'
                }
            ]}>
                {children}
            </View>
        );
    }

    // [DEBUG] Disabling BlurView temporarily to fix crash
    return (
        <View style={[
            style,
            {
                backgroundColor: tint === 'dark' ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            }
        ]}>
            {children}
        </View>
    );
};

export default EfficientBlurView;
