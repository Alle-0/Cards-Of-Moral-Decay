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
import { AudioProvider } from './src/context/AudioContext'; // [NEW] Global Music

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
import PwaInstallPrompt from './src/components/PwaInstallPrompt'; // [NEW] PWA Install Prompt
import { useLanguage } from './src/context/LanguageContext';
import ConnectivityOverlay from './src/components/ConnectivityOverlay';
import { Platform, Linking } from 'react-native';
import { db } from './src/services/firebase';
import { ref, onValue } from 'firebase/database';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// [NEW] Transparent Theme to allow global gradient to show through
const TransparentTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: 'transparent',
    },
};

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
                                    <AudioProvider>
                                        {!splashAnimationFinished ? (
                                            <Animated.View style={{ flex: 1 }} exiting={FadeOut.duration(500)}>
                                                <ElegantSplashScreen onFinish={() => setSplashAnimationFinished(true)} />
                                            </Animated.View>
                                        ) : (
                                            <NavigationContainer
                                                theme={TransparentTheme}
                                                documentTitle={{
                                                    formatter: (options, route) => "Cards of Moral Decay"
                                                }}
                                                onReady={() => {
                                                    // Log initial screen
                                                    const currentRouteName = "Home"; // Default or logic to get it
                                                    // We'll rely on onStateChange mostly, or setup a ref if we want perfect initial load tracking.
                                                    // For simplicity, we just enable the listener.
                                                }}
                                                onStateChange={(state) => {
                                                    const getActiveRouteName = (navigationState) => {
                                                        if (!navigationState) return null;
                                                        const route = navigationState.routes[navigationState.index];
                                                        if (route.state) {
                                                            return getActiveRouteName(route.state);
                                                        }
                                                        return route.name;
                                                    };

                                                    const currentRouteName = getActiveRouteName(state);

                                                    if (currentRouteName) {
                                                        // console.log("[Analytics] Screen View:", currentRouteName);
                                                        import('./src/services/AnalyticsService').then(({ default: Analytics }) => {
                                                            Analytics.log('screen_view', {
                                                                screen_name: currentRouteName,
                                                                screen_class: currentRouteName
                                                            });
                                                        });
                                                    }
                                                }}
                                            >
                                                <AppContent />
                                            </NavigationContainer>
                                        )}
                                    </AudioProvider>
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
    const { user, loading: authLoading, isConnected } = useAuth();
    const { t } = useLanguage(); // [NEW]
    const [showGameSplash, setShowGameSplash] = useState(false);
    const [isFastSplash, setIsFastSplash] = useState(false);
    const [needsUpdate, setNeedsUpdate] = useState(false);

    // [NEW] Referral / Invite / Room Join logic
    const { addFriendDirectly } = useAuth();
    const { joinRoom } = useGame();
    const [pendingInvite, setPendingInvite] = useState(null);
    const [pendingRoom, setPendingRoom] = useState(null);
    const [linkProcessed, setLinkProcessed] = useState(false);
    const [paymentResult, setPaymentResult] = useState({ visible: false, result: null });

    useEffect(() => {
        const handleUrl = (url) => {
            if (!url) return;
            try {
                // 1. Friend Invite Param
                const inviteParam = url.split('invite=')[1]?.split('&')[0];
                if (inviteParam) {
                    const decoded = decodeURIComponent(inviteParam);
                    console.log(`[DEEP LINK] Found invite from: ${decoded}`);
                    setPendingInvite(decoded);
                }

                // 2. Room Join Param
                const roomParam = url.split('room=')[1]?.split('&')[0];
                if (roomParam) {
                    const decodedRoom = decodeURIComponent(roomParam);
                    console.log(`[DEEP LINK] Found room code: ${decodedRoom}`);
                    setPendingRoom(decodedRoom);
                }
            } catch (e) {
                console.error("Link parsing error", e);
            }
        };

        if (Platform.OS === 'web') {
            document.title = "Cards of Moral Decay";

            // Web: Check initial URL
            handleUrl(window.location.href);

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
                window.history.replaceState({}, '', window.location.origin + window.location.pathname);
            }
        } else {
            // Native: Check initial URL and listen for changes
            Linking.getInitialURL().then(handleUrl);
            const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
            return () => subscription.remove();
        }
    }, [t]);

    // Process deep links (Invite/Room) once user is ready
    useEffect(() => {
        if (user && (pendingInvite || pendingRoom) && !linkProcessed) {
            const processDeepLink = async () => {
                setLinkProcessed(true); // Prevent multi-trigger
                let message = "";

                try {
                    // 1. Join Room if present
                    if (pendingRoom) {
                        console.log(`[DEEP LINK] Auto-joining room: ${pendingRoom}`);
                        await joinRoom(pendingRoom);
                    }

                    // 2. Add Friend if present
                    if (pendingInvite) {
                        console.log(`[DEEP LINK] Adding friend: ${pendingInvite}`);
                        const success = await addFriendDirectly(pendingInvite);
                        if (success) {
                            message = t('toast_auto_friend', { name: pendingInvite });
                        }
                    }

                    if (message || pendingRoom) {
                        setPaymentResult({
                            visible: true,
                            result: {
                                success: true,
                                title: t('welcome_title'),
                                message: message || (pendingRoom ? t('room_joined_success', { defaultValue: "Sei entrato nella stanza!" }) : "")
                            }
                        });
                        SoundService.play('success');
                    }
                } catch (e) {
                    console.error("Deep link processing failed", e);
                }
            };
            processDeepLink();
        }
    }, [user, pendingInvite, pendingRoom, linkProcessed]);

    useEffect(() => {
        // [FIX] Real-time Version Check (Robust & Semantic)
        const versionRef = ref(db, 'game_data/min_version');
        const unsub = onValue(versionRef, (snapshot) => {
            if (snapshot.exists()) {
                const minVer = snapshot.val();
                if (minVer && APP_VERSION) {
                    // Robust Semantic Version Comparison
                    const v1Parts = minVer.split('.').map(Number);
                    const v2Parts = APP_VERSION.split('.').map(Number);

                    let needsUpdateCheck = false;
                    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
                        const v1 = v1Parts[i] || 0;
                        const v2 = v2Parts[i] || 0;
                        if (v1 > v2) {
                            needsUpdateCheck = true;
                            break;
                        } else if (v1 < v2) {
                            break;
                        }
                    }

                    if (needsUpdateCheck) {
                        console.log(`[UPDATE] New version required: ${minVer} (Current: ${APP_VERSION})`);
                        setNeedsUpdate(true);
                    } else {
                        setNeedsUpdate(false);
                    }
                }
            }
        });

        return () => unsub();
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

            {/* [NEW] PWA Install Prompt (Web Only) */}
            <PwaInstallPrompt />

            {/* [NEW] Global Payment Feedback Modal */}
            <PaymentResultModal
                visible={paymentResult.visible}
                result={paymentResult.result}
                onClose={() => setPaymentResult({ visible: false, result: null })}
            />

            <ConnectivityOverlay isConnected={isConnected} />
        </View>
    );
};
