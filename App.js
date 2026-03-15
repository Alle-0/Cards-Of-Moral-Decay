import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import * as Notifications from 'expo-notifications'; // [NEW] Notification listener
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
import { AudioProvider, useAudio } from './src/context/AudioContext'; // [NEW] Global Music

import AppNavigator from './src/navigation/AppNavigator'; // [NEW] Bottom Tabs
import GameScreen from './src/screens/GameScreen';
import LoginScreen from './src/screens/LoginScreen';

import ElegantSplashScreen from './src/components/ElegantSplashScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import SoundService from './src/services/SoundService';
import GameDataService from './src/services/GameDataService';
import UpdateOverlay from './src/components/UpdateOverlay';
import { APP_VERSION, MAINTENANCE_MODE } from './src/constants/Config';
import PaymentResultModal from './src/components/PaymentResultModal'; // [NEW] Global Feedback
import PwaInstallPrompt from './src/components/PwaInstallPrompt'; // [NEW] PWA Install Prompt
import { useLanguage } from './src/context/LanguageContext';
import ConnectivityOverlay from './src/components/ConnectivityOverlay';
import IntroTutorialOverlay from './src/components/tutorial/IntroTutorialOverlay'; // [NEW] Spotlight Tutorial
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

const navigationRef = React.createRef(); // [NEW] Global ref for deep link navigation

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
                console.warn("[App] Error during prepare:", e);
            } finally {
                if (fontsLoaded) setAppIsReady(true);
            }
        }
        if (fontsLoaded) prepare();
    }, [fontsLoaded]);


    useEffect(() => {
        if (appIsReady && MAINTENANCE_MODE) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [appIsReady]);

    if (!appIsReady) return null;

    if (MAINTENANCE_MODE) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0d0d0d', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <StatusBar hidden />
                <Text style={{ color: '#FFD700', fontFamily: 'Cinzel-Bold', fontSize: 24, textAlign: 'center', marginBottom: 20 }}>
                    MANUTENZIONE
                </Text>
                <Text style={{ color: '#aaa', fontFamily: 'Outfit', fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
                    IL SERVER È TEMPORANEAMENTE IN MANUTENZIONE PER AGGIORNAMENTI.
                </Text>
                <View style={{ marginTop: 40, width: 60, height: 2, backgroundColor: '#FFD700' }} />
            </View>
        );
    }

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
                                                <ElegantSplashScreen 
                                                    onFinish={() => setSplashAnimationFinished(true)} 
                                                    isInitialLaunch={true} 
                                                    isMaintenance={MAINTENANCE_MODE} 
                                                />
                                            </Animated.View>
                                        ) : (
                                            <NavigationContainer
                                                ref={navigationRef}
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
    const { roomCode, joinRoom } = useGame();
    const { user, loading: authLoading, isConnected, pendingTab, setPendingTab } = useAuth();
    const { playMusic } = useAudio(); // [NEW]
    const { t } = useLanguage();
    const [showGameSplash, setShowGameSplash] = useState(false);
    const [isFastSplash, setIsFastSplash] = useState(false);
    const [needsUpdate, setNeedsUpdate] = useState(false);

    // [NEW] Local state to ensure tutorial only mounts once user is fully in the lobby
    const [showTutorial, setShowTutorial] = useState(false);
    const { markTutorialSeen } = useAuth();

    // [NEW] Start Music on Mount (Entry to App)
    useEffect(() => {
        playMusic({ fade: true }).catch(err => {
            // Silently handle expected autoplay block on web
            if (err?.name !== 'NotAllowedError') console.warn("[App] Initial playMusic failed:", err);
        });
    }, []);

    const [paymentResult, setPaymentResult] = useState({ visible: false, result: null });

    // [MODIFIED] Keep only payment-related URL logic here
    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = "Cards of Moral Decay";
            const params = new URLSearchParams(window.location.search);
            const paymentStatus = params.get('payment');

            if (paymentStatus === 'success') {
                const type = params.get('type');
                const amount = params.get('amount');
                setPaymentResult({
                    visible: true,
                    result: { success: true, type: type, amount: amount }
                });
                SoundService.play('purchase');
                window.history.replaceState({}, '', window.location.origin + window.location.pathname);
            } else if (paymentStatus === 'cancel') {
                setPaymentResult({
                    visible: true,
                    result: { success: false, error: t('payment_cancelled') }
                });
                SoundService.play('error');
                window.history.replaceState({}, '', window.location.origin + window.location.pathname);
            }
        }
    }, [t]);

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

    // [NEW] Notification click listener (Background / Foreground)
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (__DEV__) console.log("[PUSH] Click detected (Listener). Data:", data);

            if (data?.roomCode || data?.room || data?.roomId) {
                const code = data.roomCode || data.room || data.roomId;
                // GameContext's joinRoom will handle setting roomCode which navigates to GameScreen
                joinRoom(code).catch(e => console.warn("Auto-join failed:", e));
            } else if (data?.screen) {
                // Navigate to specific tab
                if (navigationRef.current) {
                    navigationRef.current.navigate(data.screen, data.params || {});
                }
            }
        });
        return () => subscription.remove();
    }, [joinRoom]);

    // [NEW] Notification click listener (Cold Start)
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const checkColdStart = async () => {
            try {
                const response = await Notifications.getLastNotificationResponseAsync();
                if (
                    response &&
                    response.notification.request.content.data &&
                    response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
                ) {
                    const data = response.notification.request.content.data;
                    if (__DEV__) console.log("[PUSH] Cold Start Click detected. Data:", data);

                    if (data?.roomCode || data?.room || data?.roomId) {
                        const code = data.roomCode || data.room || data.roomId;
                        joinRoom(code).catch(e => console.warn("Cold start auto-join failed:", e));
                    } else if (data?.screen) {
                        if (navigationRef.current) {
                            navigationRef.current.navigate(data.screen, data.params || {});
                        }
                    }
                }
            } catch (e) {
                console.warn("[PUSH] Could not fetch cold start notification", e);
            }
        };

        checkColdStart();
    }, [joinRoom]);

    // [NEW] Handle pending tab from Deep Link
    useEffect(() => {
        if (pendingTab && navigationRef.current) {
            if (__DEV__) console.log(`[DEEP LINK] Navigating to pending tab: ${pendingTab}`);
            navigationRef.current.navigate(pendingTab);
            setPendingTab(null);

            // Clean persistence
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.removeItem('pending_tab_deep_link');
        }
    }, [pendingTab, setPendingTab]);

    // [NEW] Check for Tutorial Visibility
    useEffect(() => {
        // Only show if user is fully loaded, NOT in a game, NOT a brand new user still picking a name, and hasn't seen it yet.
        if (
            user &&
            !user.isNew &&
            user.hasSeenLobbyTutorial === false &&
            !roomCode &&
            !showGameSplash
        ) {
            // Add a small delay so the Lobby renders before the tutorial starts
            const timer = setTimeout(() => {
                setShowTutorial(true);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setShowTutorial(false);
        }
    }, [user, roomCode, showGameSplash]);

    const handleTutorialFinish = useCallback(async () => {
        setShowTutorial(false);
        await markTutorialSeen();
    }, [markTutorialSeen]);

    const handleStartLoading = (action = undefined) => {
        if (action === false) {
            setShowGameSplash(false);
        } else {
            setIsFastSplash(action === true);
            setShowGameSplash(true);
        }
    };

    const handleGameSplashFinish = () => {
        setShowGameSplash(false);
    };

    if (authLoading) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    if (!user) return <LoginScreen />;

    return (
        <View style={{ flex: 1 }}>
            {roomCode ? (
                <GameScreen onStartLoading={handleStartLoading} />
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

            {/* [NEW] Intro Tutorial Overlay */}
            <IntroTutorialOverlay
                visible={showTutorial}
                onFinish={handleTutorialFinish}
            />

            <ConnectivityOverlay isConnected={isConnected} />
        </View>
    );
};
