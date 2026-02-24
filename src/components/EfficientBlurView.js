import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

const EfficientBlurView = ({ style, intensity = 30, tint = 'dark', force = false, children }) => {
    if (Platform.OS === 'android') {
        // If force is true, we allow the full blur intensity on Android.
        // This is used for critical UI elements like the navbar where quality > perf.
        if (force) {
            return (
                <View style={[styles.container, style]}>
                    <BlurView
                        intensity={intensity}
                        tint={tint}
                        style={StyleSheet.absoluteFill}
                    />
                    {children}
                </View>
            );
        }

        // Default Android behavior: solid backing + very light blur for performance.
        return (
            <View style={[styles.container, style]}>
                {/* Solid base for readability */}
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: tint === 'light'
                                ? 'rgba(255, 255, 255, 0.85)'
                                : 'rgba(10, 10, 14, 0.78)'
                        }
                    ]}
                />
                {/* Light blur on top — intensity capped at 8 to stay fast */}
                <BlurView
                    intensity={Math.min(intensity, 8)}
                    tint={tint}
                    style={StyleSheet.absoluteFill}
                />
                {children}
            </View>
        );
    }

    // iOS: native blur, runs on GPU compositor thread
    return (
        <BlurView intensity={intensity} tint={tint} style={style}>
            {children}
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden', // Importante per Android per non far sbavare il blur
    }
});

export default EfficientBlurView;
