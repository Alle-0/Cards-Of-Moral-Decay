import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

const EfficientBlurView = ({ style, intensity = 30, tint = 'dark', children }) => {
    if (Platform.OS === 'android') {
        // On Android we use a solid backing layer + a very low intensity BlurView.
        // This keeps a frosted-glass feel while avoiding the GPU cost of high intensity.
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
