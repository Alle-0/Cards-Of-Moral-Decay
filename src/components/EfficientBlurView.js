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
                    Questo è fondamentale. Se il Blur fallisce nell'APK, 
                    questo sfondo assicura che il testo sia leggibile. 
                */}
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: tint === 'light'
                                ? 'rgba(255, 255, 255, 0.85)'
                                : 'rgba(15, 15, 15, 0.3)' // Molto scuro per coprire la mancanza di blur
                        }
                    ]}
                />

                {/* 2. IL BLUR SPERIMENTALE
                    Su Android recenti funziona, su quelli vecchi viene ignorato 
                    ma c'è il paracadute sotto.
                */}
                <BlurView
                    intensity={safeIntensity}
                    tint={tint}
                    style={StyleSheet.absoluteFill}
                    experimentalBlurMethod="dimezisBlurView" // Forza il metodo migliore su Android
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
