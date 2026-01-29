import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import StripeAppWrapper from './src/components/StripeAppWrapper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native'; // [NEW] Navigation Helper
import {
    useFonts,
    Cinzel_400Regular,
    Cinzel_700Bold
} from '@expo-google-fonts/cinzel';
import {
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold
} from '@expo-google-fonts/cinzel-decorative';
import {
    Outfit_400Regular,
    Outfit_700Bold
} from '@expo-google-fonts/outfit';

import { GameProvider, useGame } from './src/context/GameContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext'; // [NEW]

import AppNavigator from './src/navigation/AppNavigator'; // [NEW] Bottom Tabs
import GameScreen from './src/screens/GameScreen';
import LoginScreen from './src/screens/LoginScreen';

import ElegantSplashScreen from './src/components/ElegantSplashScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import SoundService from './src/services/SoundService';
import GameDataService from './src/services/GameDataService';
import UpdateOverlay from './src/components/UpdateOverlay';
import { APP_VERSION } from './src/constants/Config';
import PaymentResultModal from './src/components/PaymentResultModal'; // [NEW] Global Feedback
import { useLanguage } from './src/context/LanguageContext';
import { Platform } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

    const [fontsLoaded] = useFonts({
        'Cinzel': Cinzel_400Regular,
        'Cinzel-Bold': Cinzel_700Bold,
        'Cinzel Decorative': CinzelDecorative_400Regular,
        'Cinzel Decorative-Bold': CinzelDecorative_700Bold,
        'Outfit': Outfit_400Regular,
        'Outfit-Bold': Outfit_700Bold,
    });

    useEffect(() => {
        async function prepare() {
            try {
                await SoundService.loadSounds();
            } catch (e) {
                console.warn(e);
            } finally {
                if (fontsLoaded) setAppIsReady(true);
            }
        }
        if (fontsLoaded) prepare();
    }, [fontsLoaded]);

    useEffect(() => {
        if (appIsReady) SplashScreen.hideAsync();
    }, [appIsReady]);

    if (!appIsReady) return null;

    return (
        <StripeAppWrapper>
            <SafeAreaProvider>
                <ErrorBoundary>
                    <AuthProvider>
                        <ThemeProvider>
                            <LanguageProvider>
                                <GameProvider>
                                    {!splashAnimationFinished ? (
                                        <Animated.View style={{ flex: 1 }} exiting={FadeOut.duration(500)}>
                                            <ElegantSplashScreen onFinish={() => setSplashAnimationFinished(true)} />
                                        </Animated.View>
                                    ) : (
                                        <NavigationContainer theme={DarkTheme}>
                                            <AppContent />
                                        </NavigationContainer>
                                    )}
                                </GameProvider>
                            </LanguageProvider>
                        </ThemeProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </SafeAreaProvider>
        </StripeAppWrapper>
    );
}

const AppContent = () => {
    const { roomCode } = useGame();
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage(); // [NEW]
    const [showGameSplash, setShowGameSplash] = useState(false);
    const [isFastSplash, setIsFastSplash] = useState(false);
    const [needsUpdate, setNeedsUpdate] = useState(false);

    // [NEW] Global Stripe Feedback
    const [paymentResult, setPaymentResult] = useState({ visible: false, result: null });

    useEffect(() => {
        if (Platform.OS === 'web' && user) {
            const params = new URLSearchParams(window.location.search);
            const paymentStatus = params.get('payment');

            if (paymentStatus === 'success') {
                const type = params.get('type');
                const amount = params.get('amount');

                setPaymentResult({
                    visible: true,
                    result: {
                        success: true,
                        type: type,
                        amount: amount
                    }
                });
                SoundService.play('purchase');
                // Clean URL
                window.history.replaceState({}, '', window.location.origin + window.location.pathname);
            } else if (paymentStatus === 'cancel') {
                setPaymentResult({
                    visible: true,
                    result: { success: false, error: t('payment_cancelled') }
                });
                SoundService.play('error');
                // Clean URL
                window.history.replaceState({}, '', window.location.origin + window.location.pathname);
            }
        }
    }, [user]);

    useEffect(() => {
        // Check versioning
        const checkVersion = () => {
            const minVer = GameDataService.getMinVersion();
            if (minVer && APP_VERSION) {
                // Simple semantic version check (could be more robust, but for 2.0.0 vs 2.0.1 it works)
                if (minVer > APP_VERSION) {
                    setNeedsUpdate(true);
                }
            }
        };

        // Initial check
        checkVersion();

        // Check again after a few seconds when Firebase data might have settled
        const timer = setTimeout(checkVersion, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleStartLoading = (fast = false) => {
        setIsFastSplash(fast);
        setShowGameSplash(true);
    };

    const handleGameSplashFinish = () => {
        setShowGameSplash(false);
    };

    if (authLoading) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    if (!user) return <LoginScreen />;

    return (
        <View style={{ flex: 1 }}>
            {roomCode ? (
                <GameScreen onStartLoading={() => handleStartLoading(true)} />
            ) : (
                <AppNavigator onStartLoading={handleStartLoading} />
            )}

            {showGameSplash && (
                <Animated.View
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(500)}
                >
                    <ElegantSplashScreen onFinish={handleGameSplashFinish} fastMode={isFastSplash} />
                </Animated.View>
            )}

            {needsUpdate && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}>
                    <UpdateOverlay downloadUrl={GameDataService.getDownloadUrl()} />
                </View>
            )}

            {/* [NEW] Global Payment Feedback Modal */}
            <PaymentResultModal
                visible={paymentResult.visible}
                result={paymentResult.result}
                onClose={() => setPaymentResult({ visible: false, result: null })}
            />
        </View>
    );
};
