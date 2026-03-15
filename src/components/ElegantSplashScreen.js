import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    runOnJS,
    Easing,
    withRepeat,
    FadeInUp,
    interpolate,
    interpolateColor,
    ZoomIn
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '../context/ThemeContext';

const NATIVE_SPLASH_BG = '#0d0d0d'; // Must match app.json

const { width, height } = Dimensions.get('window');
const MAX_SCALE = (Math.sqrt(width ** 2 + height ** 2) / 50) + 1;

// --- Helper Component ---
const StaggeredWord = ({ text, style, color, baseDelay = 0 }) => {
    const letters = text.split('');
    return (
        <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
            {letters.map((letter, index) => {
                const delay = baseDelay + (index * 50); // Ritardo tra lettere leggermente ridotto
                return (
                    <Animated.Text
                        key={index}
                        // FIX: Via .springify(). Usiamo una curva cubica fluida.
                        entering={FadeInUp.delay(delay).duration(1000).easing(Easing.out(Easing.cubic))}
                        style={[style, { color }]}
                    >
                        {letter}
                    </Animated.Text>
                );
            })}
        </View>
    );
};
// ------------------------

const ElegantSplashScreen = ({ onFinish, fastMode = false, isInitialLaunch = false, isMaintenance = false }) => {
    const { theme, isThemeReady } = useTheme(); // [NEW] isThemeReady
    const [animationFinished, setAnimationFinished] = useState(false);

    // Shared Values
    const mainCircleScale = useSharedValue(0);
    const rippleScale = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    // Valori Respiro
    const contentScale = useSharedValue(1);
    const contentTranslateY = useSharedValue(0);

    // [NEW] Background transition
    // If it's the initial launch (and not fast mode), start at 0 (native color). 
    // Otherwise, start at 1 (accent color) to avoid dark flash.
    const bgProgress = useSharedValue(isInitialLaunch && !fastMode ? 0 : 1);

    useEffect(() => {
        const totalEntranceTime = fastMode ? 1000 : 2000;
        const breathingDuration = fastMode ? 300 : 2000; // Respiro più lento e solenne
        const exitDelay = fastMode ? 500 : totalEntranceTime + 500;
        const explosionDuration = fastMode ? 400 : 700;

        if (isThemeReady && !fastMode && isInitialLaunch) {
            // Hide native splash once JS one is ready to animate
            SplashScreen.hideAsync().catch(() => {});

            // Transizione colore ultra-lenta (4s) con curva in-out per evitare scatti iniziali/finali
            bgProgress.value = withTiming(1, {
                duration: 4000,
                easing: Easing.inOut(Easing.quad)
            });
        }

        // 1. Respiro solenne (lento e impercettibile)
        setTimeout(() => {
            contentScale.value = withRepeat(
                withTiming(1.02, { duration: breathingDuration, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }), // Sine equivalent for web
                -1, true
            );
        }, totalEntranceTime);

        const timer = setTimeout(() => {
            if (isMaintenance) return; // [NEW] Never finish if in maintenance, stay on splash

            // Anticipazione Morbida (niente scatti)
            contentScale.value = withTiming(0.95, { duration: 500, easing: Easing.out(Easing.cubic) });
            contentTranslateY.value = withTiming(10, { duration: 500, easing: Easing.out(Easing.cubic) });
            mainCircleScale.value = withTiming(0.5, { duration: 500 });

            // Shockwave
            rippleScale.value = withDelay(100, withTiming(MAX_SCALE * 1.2, { duration: 900, easing: Easing.out(Easing.quad) }));

            // Esplosione Finale
            containerOpacity.value = withDelay(200, withTiming(0, { duration: 400 }));

            mainCircleScale.value = withDelay(250, withTiming(MAX_SCALE, {
                duration: explosionDuration,
                easing: Easing.inOut(Easing.exp)
            }, (finished) => {
                if (finished) {
                    if (onFinish) {
                        runOnJS(onFinish)();
                    }
                    runOnJS(setAnimationFinished)(true);
                }
            }));

        }, exitDelay);

        // [NEW] Emergency Exit: If the JS animation sequence hangs for > 5s, force finish
        const emergencyTimer = setTimeout(() => {
            if (isMaintenance) return; // [NEW] Stay on splash during maintenance
            if (!animationFinished) {
                if (__DEV__) console.warn("[Splash] EMERGENCY EXIT triggered (5s timeout).");
                if (onFinish) onFinish();
                setAnimationFinished(true);
            }
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(emergencyTimer);
        };
    }, [fastMode, isThemeReady]); // [FIX] Added isThemeReady


    const rippleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: interpolate(rippleScale.value, [0, 1, MAX_SCALE], [0.4, 0.2, 0]),
    }));

    const mainCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: mainCircleScale.value }],
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        transform: [
            { scale: contentScale.value },
            { translateY: contentTranslateY.value }
        ]
    }));

    const containerStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            bgProgress.value,
            [0, 1],
            [NATIVE_SPLASH_BG, theme.colors.accent]
        )
    }));

    if (animationFinished) return null;

    const darkColor = theme.colors.background && theme.colors.background.length > 0 ? theme.colors.background[0] : '#000';

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <StatusBar style="light" />

            <Animated.View style={[styles.circle, { backgroundColor: darkColor }, rippleStyle]} />
            <Animated.View style={[styles.circle, { backgroundColor: darkColor, zIndex: 5 }, mainCircleStyle]} />

            <View style={{ position: 'absolute', zIndex: 10, alignItems: 'center' }}>
                <Animated.View style={[styles.contentWrapper, contentAnimatedStyle]}>

                    {/* 1. CARDS - Entrata Fluida */}
                    <StaggeredWord
                        text={isMaintenance ? "MANUTENZIONE" : "CARDS"}
                        color={darkColor}
                        style={[styles.logoText, isMaintenance && { fontSize: 42, lineHeight: 52 }]}
                        baseDelay={200}
                    />

                    {/* 2. Linea - Zoom senza rimbalzo (back rimosso) */}
                    {!isMaintenance && (
                        <Animated.View
                            entering={ZoomIn.delay(800).duration(800).easing(Easing.out(Easing.cubic))}
                            style={{
                                height: 2,
                                width: 80,
                                backgroundColor: darkColor,
                                marginVertical: 10,
                                borderRadius: 1
                            }}
                        />
                    )}

                    {/* 3. SUBTITLE - Fade Up senza rimbalzo */}
                    {!isMaintenance && (
                        <View style={{ overflow: 'hidden' }}>
                            <Animated.Text
                                entering={FadeInUp.delay(1000).duration(1000).easing(Easing.out(Easing.cubic))}
                                style={[styles.subText, { color: darkColor }]}
                            >
                                OF MORAL DECAY
                            </Animated.Text>
                        </View>
                    )}

                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: 'absolute',
    },
    contentWrapper: {
        alignItems: 'center',
    },
    logoText: {
        fontFamily: 'CinzelDecorative_700Bold',
        fontSize: 62,
        letterSpacing: 2,
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false,
        lineHeight: 75,
        marginHorizontal: -2,
    },
    subText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
        letterSpacing: 7,
        textAlign: 'center',
        textTransform: 'uppercase',
    }
});

export default ElegantSplashScreen;
