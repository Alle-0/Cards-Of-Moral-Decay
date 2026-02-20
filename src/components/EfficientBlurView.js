import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

const EfficientBlurView = ({ style, intensity = 30, tint = 'dark', children }) => {
    // Android fa fatica con intensity > 100 o con valori strani. 
    // Normalizziamo per evitare crash grafici.
    const safeIntensity = Platform.OS === 'android' ? Math.min(intensity, 30) : intensity;

    if (Platform.OS === 'android') {
        return (
            <View style={[styles.container, style]}>
                {/* 1. IL PARACADUTE (Fallback Layer) 
                    Ottimizzato: Usiamo un'opacità base che garantisce leggibilità 
                    senza pesare sulla GPU.
                */}
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: tint === 'light'
                                ? 'rgba(255, 255, 255, 0.9)'
                                : 'rgba(12, 12, 15, 0.75)' // Più opaco così il blur può essere più leggero
                        }
                    ]}
                />

                {/* 2. IL BLUR SPERIMENTALE
                    Limitato a 15 su Android per massima fluidità.
                */}
                <BlurView
                    intensity={Math.min(safeIntensity, 15)}
                    tint={tint}
                    style={StyleSheet.absoluteFill}
                    experimentalBlurMethod="dimezisBlurView"
                />

                {/* 3. IL CONTENUTO */}
                {children}
            </View>
        );
    }

    // SU IOS: Lusso sfrenato, blur nativo perfetto.
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
