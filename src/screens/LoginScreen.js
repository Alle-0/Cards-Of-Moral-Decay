import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { isProfane, validateUsername } from '../utils/ValidationUtils';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    SlideInRight,
    SlideOutLeft,
    SlideInLeft,
    SlideOutRight,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
    interpolateColor,
    withSpring,
    interpolate
} from 'react-native-reanimated';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';
import HapticsService from '../services/HapticsService';
import { PanResponder } from 'react-native';
import ConfirmationModal from '../components/ConfirmationModal';
import PremiumBackground from '../components/PremiumBackground';
import EulaModal from '../components/EulaModal';

const { width } = Dimensions.get('window');

const TabItem = ({ label, index, dragX }) => {
    const textStyle = useAnimatedStyle(() => {
        const itemCenter = index * 50;
        const color = interpolateColor(
            dragX.value,
            [itemCenter - 25, itemCenter, itemCenter + 25],
            ['rgba(255,255,255,0.3)', '#FFFFFF', 'rgba(255,255,255,0.3)']
        );
        return { color, fontWeight: 'bold' };
    });

    return (
        <View style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 2 }} pointerEvents="none">
            <Animated.Text style={[{ fontSize: 13, letterSpacing: 0.5, fontFamily: 'Cinzel-Bold' }, textStyle]}>
                {label}
            </Animated.Text>
        </View>
    );
};

export default function LoginScreen() {
    const { signUp, recoverAccount, devLogin, loading: authLoading, user: authUserSession } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'recover'

    // [NEW] Monitor for Database Index Errors
    useEffect(() => {
        if (authUserSession?.error === "MISSING_INDEX") {
            setModal({
                visible: true,
                title: t('login_db_blocked_title'),
                message: t('login_db_blocked_msg')
            });
        }
    }, [authUserSession]);

    // [NEW] Liquid Animation Logic
    const dragXPercent = useSharedValue(0);
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDraggingSV = useSharedValue(false);

    const tabScale = useLiquidScale(dragXPercent, startX, targetX, isDraggingSV, 1.05);

    const gestureStartX = React.useRef(0);
    const touchStartX = React.useRef(0);
    const containerWidthRef = React.useRef(0);
    const isGrabbingIndicator = React.useRef(false);
    const activeTabRef = React.useRef(activeTab);

    // Sync activeTab ref
    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    // Animate tab change
    useEffect(() => {
        const target = activeTab === 'new' ? 0 : 50;
        startX.value = dragXPercent.value;
        targetX.value = target;
        dragXPercent.value = withSpring(target, SNAP_SPRING_CONFIG);
    }, [activeTab]);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                gestureStartX.current = dragXPercent.value;
                touchStartX.current = evt.nativeEvent.locationX;
                const containerWidth = containerWidthRef.current || 300;
                const halfWidth = containerWidth / 2;
                const touchedSide = touchStartX.current < halfWidth ? 'new' : 'recover';
                isGrabbingIndicator.current = (touchedSide === activeTabRef.current);
                if (isGrabbingIndicator.current) {
                    HapticsService.trigger('selection');
                    isDraggingSV.value = true;
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isGrabbingIndicator.current) return;
                const containerWidth = containerWidthRef.current || 300;
                const deltaPercent = (gestureState.dx / containerWidth) * 100;
                let newPercent = gestureStartX.current + deltaPercent;
                // Rubber Banding
                if (newPercent < 0) {
                    newPercent = newPercent * 0.2;
                } else if (newPercent > 50) {
                    newPercent = 50 + (newPercent - 50) * 0.2;
                }
                dragXPercent.value = newPercent;
            },
            onPanResponderRelease: (evt, gestureState) => {
                const isClick = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
                let targetPercent;
                if (isClick) {
                    const containerWidth = containerWidthRef.current || 300;
                    const clickedSide = touchStartX.current < (containerWidth / 2) ? 'new' : 'recover';
                    targetPercent = clickedSide === 'new' ? 0 : 50;
                } else {
                    targetPercent = dragXPercent.value > 25 ? 50 : 0;
                }
                const newTab = targetPercent === 0 ? 'new' : 'recover';
                setActiveTab(newTab);
                if (newTab !== activeTabRef.current) {
                    HapticsService.trigger('selection');
                }
                updateLiquidAnchors(startX, targetX, isDraggingSV, dragXPercent.value, targetPercent);
                dragXPercent.value = withSpring(targetPercent, SNAP_SPRING_CONFIG);
            },
        })
    ).current;

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: interpolate(dragXPercent.value, [0, 50], [2, -2]) },
                { scale: tabScale.value }
            ],
            left: `${dragXPercent.value}%`
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => ({
        // We must subtract the padding (24 * 2 = 48) from the width to get the correct inner width
        transform: [{ translateX: -(dragXPercent.value / 50) * (width * 0.9 - 48) }]
    }));

    // Form States
    const [username, setUsername] = useState('');
    const [recoverUsername, setRecoverUsername] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });
    const [showEula, setShowEula] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null); // { type: 'error'|'success'|'checking', message: string }
    const borderAnimation = useSharedValue(0); // 0: neutral, 1: success, 2: error

    const animatedInputStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            borderAnimation.value,
            [0, 1, 2],
            ['rgba(255,255,255,0.1)', '#4ade80', '#ff4444']
        );

        return {
            borderColor,
            borderWidth: borderAnimation.value > 0 ? 1.5 : 1,
        };
    });

    // [NEW] Real-time Validation Effect
    useEffect(() => {
        if (!username.trim()) {
            setValidationStatus(null);
            return;
        }

        const handler = setTimeout(async () => {
            // 1. Local Validation
            const validation = validateUsername(username.trim());
            if (!validation.valid) {
                let errorMsg = t('login_error_missing_name');
                if (validation.error === 'username_too_short') errorMsg = t('error_username_too_short');
                else if (validation.error === 'username_too_long') errorMsg = t('error_username_too_long');
                else if (validation.error === 'username_invalid_chars') errorMsg = t('error_username_invalid_chars');
                else if (validation.error === 'username_offensive') errorMsg = t('error_offensive_name');

                setValidationStatus({ type: 'error', message: errorMsg });
                borderAnimation.value = withTiming(2, { duration: 300 });
                return;
            }

            // 2. Firebase Availability Check
            setValidationStatus({ type: 'checking', message: '...' });
            borderAnimation.value = withTiming(0, { duration: 300 });
            try {
                const snapshot = await get(ref(db, `users/${username.trim()}`));
                if (snapshot.exists()) {
                    setValidationStatus({ type: 'error', message: t('error_username_taken') });
                    borderAnimation.value = withTiming(2, { duration: 300 });
                } else {
                    setValidationStatus({ type: 'success', message: t('valid_username') });
                    borderAnimation.value = withTiming(1, { duration: 300 });
                }
            } catch (e) {
                console.warn("[Validation] Check failed:", e);
                setValidationStatus(null);
                borderAnimation.value = withTiming(0, { duration: 300 });
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [username, t]);

    // Reset border when input cleared
    useEffect(() => {
        if (!username.trim()) {
            borderAnimation.value = withTiming(0, { duration: 200 });
        }
    }, [username]);

    // --- Actions ---

    const handleSignUp = () => {
        const validation = validateUsername(username.trim());
        if (!validation.valid) {
            let errorMsg = t('login_error_missing_name');
            if (validation.error === 'username_too_short') errorMsg = t('error_username_too_short');
            else if (validation.error === 'username_too_long') errorMsg = t('error_username_too_long');
            else if (validation.error === 'username_invalid_chars') errorMsg = t('error_username_invalid_chars');
            else if (validation.error === 'username_offensive') errorMsg = t('error_offensive_name');

            setModal({ visible: true, title: t('login_error_title'), message: errorMsg });
            return;
        }
        setShowEula(true);
    };

    const confirmSignUp = async () => {
        setShowEula(false);
        setLoading(true);
        try {
            await signUp(username.trim());
            setLoading(false);
        } catch (error) {
            // Handle specific profanity error or others
            const errorMsg = error.message === "error_offensive_name" ? t('error_offensive_name') : error.message;
            setModal({ visible: true, title: t('login_error_title'), message: errorMsg });
            setLoading(false);
        }
    };

    const handleRecovery = async () => {
        if (!recoverUsername.trim() || !recoveryCode.trim()) {
            setModal({ visible: true, title: t('login_error_title'), message: t('login_error_missing_recover_data') });
            return;
        }

        setLoading(true);
        try {
            const formattedCode = recoveryCode.trim().toUpperCase();
            await recoverAccount(recoverUsername.trim(), formattedCode);
            setLoading(false);
        } catch (error) {
            setModal({ visible: true, title: t('login_error_title'), message: error.message });
            setLoading(false);
        }
    };

    // Refactored Form Content to avoid duplication
    const renderFormContent = () => (
        <View style={styles.container}>
            <Animated.View
                layout={LinearTransition.duration(300).easing(Easing.out(Easing.cubic))}
                entering={FadeInDown.delay(200).springify()}
                style={styles.content}
            >
                {/* [NEW] Language Selector (Top Right) */}
                <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, flexDirection: 'row', gap: 8 }}>
                    {['it', 'en'].map((lang) => {
                        const { language, setLanguage } = useLanguage();
                        const isActive = language === lang;
                        return (
                            <TouchableOpacity
                                key={lang}
                                onPress={() => setLanguage(lang)}
                                style={{
                                    paddingVertical: 4,
                                    paddingHorizontal: 8,
                                    borderRadius: 6,
                                    backgroundColor: isActive ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                                    borderWidth: 1,
                                    borderColor: isActive ? '#FFD700' : 'rgba(255,255,255,0.1)'
                                }}
                            >
                                <Text style={{
                                    color: isActive ? '#FFD700' : '#666',
                                    fontFamily: 'Cinzel-Bold',
                                    fontSize: 10
                                }}>
                                    {lang.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.title}>{t('login_title')}</Text>

                {/* Tabs */}
                <View style={{ width: '100%', marginBottom: 24 }}>
                    <View
                        style={[
                            styles.tabContainer,
                            {
                                marginBottom: 0,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                padding: 2
                            }
                        ]}
                        onLayout={(e) => {
                            containerWidthRef.current = e.nativeEvent.layout.width;
                        }}
                    >
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.tabIndicator,
                                indicatorStyle,
                                { width: '50%', top: 2, bottom: 2, borderRadius: 10 }
                            ]}
                        />
                        <TabItem label={t('login_new_player')} index={0} dragX={dragXPercent} />
                        <TabItem label={t('login_recover')} index={1} dragX={dragXPercent} />

                        <View
                            style={StyleSheet.absoluteFill}
                            {...panResponder.panHandlers}
                        />
                    </View>
                </View>

                {/* Content Area - Carousel Wrapper */}
                <View style={styles.carouselContainer}>
                    <Animated.View style={[styles.carouselTrack, animatedContentStyle]}>

                        {/* SLIDE 1: NEW PLAYER */}
                        <View style={styles.formSlide}>
                            <Text style={styles.subtitle}>{t('login_enter_chaos')}</Text>
                            <Text style={styles.desc}>{t('login_no_password')}</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('login_alias_label')}</Text>
                                <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('login_alias_placeholder')}
                                        placeholderTextColor="#666"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </Animated.View>
                                {validationStatus && (
                                    <Animated.Text
                                        entering={FadeInDown.duration(200)}
                                        style={[
                                            styles.validationText,
                                            validationStatus.type === 'error' ? styles.errorText :
                                                validationStatus.type === 'success' ? styles.successText : styles.checkingText
                                        ]}
                                    >
                                        {validationStatus.message}
                                    </Animated.Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSignUp}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    style={styles.gradientButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? t('login_btn_creating') : t('login_btn_create')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.disclaimer}>
                                {t('login_disclaimer')}
                            </Text>
                        </View>

                        {/* SLIDE 2: RECOVER */}
                        <View style={styles.formSlide}>
                            <Text style={styles.subtitle}>{t('login_recover_subtitle')}</Text>
                            <Text style={styles.desc}>{t('login_recover_desc')}</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('login_alias_label')}</Text>
                                <Animated.View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('login_old_alias_placeholder')}
                                        placeholderTextColor="#666"
                                        value={recoverUsername}
                                        onChangeText={setRecoverUsername}
                                        autoCapitalize="none"
                                    />
                                </Animated.View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('login_secret_code_label')}</Text>
                                <Animated.View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('login_secret_code_placeholder')}
                                        placeholderTextColor="#666"
                                        value={recoveryCode}
                                        onChangeText={(text) => {
                                            const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                            let formatted = cleaned;
                                            if (cleaned.length === 3 && text.length > recoveryCode.length) {
                                                formatted = cleaned + '-';
                                            } else if (cleaned.length > 3) {
                                                formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7);
                                            }
                                            setRecoveryCode(formatted);
                                        }}
                                        autoCapitalize="characters"
                                        maxLength={8}
                                    />
                                </Animated.View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleRecovery}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#ef4444', '#b91c1c']}
                                    style={styles.gradientButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={[styles.buttonText, { color: '#fff' }]}>
                                        {loading ? t('login_btn_verifying') : t('login_btn_recover')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>

            </Animated.View>

            <ConfirmationModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal({ ...modal, visible: false })}
                singleButton={true}
                confirmText={t('ok_btn')}
                onConfirm={() => setModal({ ...modal, visible: false })}
            />

            <EulaModal
                visible={showEula}
                onAccept={confirmSignUp}
            />


            {__DEV__ && (
                <Animated.View
                    entering={FadeInDown.delay(800)}
                    style={styles.devContainer}
                >
                    <Text style={styles.devLabel}>DEV QUICK LOGIN:</Text>
                    <View style={styles.devButtons}>
                        {['Prova', 'Prova2', 'Prova3'].map((name) => (
                            <TouchableOpacity
                                key={name}
                                style={styles.devButton}
                                onPress={() => devLogin(name)}
                            >
                                <Text style={styles.devButtonText}>{name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            )}
        </View>
    );

    if (authLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0c29' }]}>
                <Text style={{ color: '#FFD700', fontFamily: 'Cinzel-Bold', fontSize: 16 }}>
                    {t('loading')}
                </Text>
            </View>
        );
    }

    return (
        <PremiumBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                enabled={Platform.OS !== 'web'}
            >
                {Platform.OS === 'web' ? (
                    renderFormContent()
                ) : (
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        {renderFormContent()}
                    </TouchableWithoutFeedback>
                )}
            </KeyboardAvoidingView>
        </PremiumBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: width * 0.9,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.15)',
        alignItems: 'center',
        overflow: 'hidden',
    },
    title: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 28,
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 30,
        letterSpacing: 1.5,
        paddingLeft: 1.5, // [FIX] Compensate for letterSpacing to ensure perfect centering
        textShadowColor: 'rgba(255, 215, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        outlineStyle: 'none',
    },
    tabIndicator: {
        position: 'absolute',
        top: 4,
        left: 4,
        bottom: 4,
        width: '50%',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderRadius: 10,
    },
    tabText: {
        fontFamily: 'Outfit-Bold',
        color: '#666',
        fontSize: 14,
    },
    activeTabText: {
        color: '#FFD700',
    },
    carouselContainer: {
        width: '100%',
        minHeight: 250,
        overflow: 'hidden', // Essential for masking the off-screen slide
    },
    carouselTrack: {
        width: '200%', // 2 slides side-by-side
        flexDirection: 'row',
    },
    formSlide: {
        width: '50%', // Each slide takes half of the 200% width (so 100% of container)
        paddingHorizontal: 12, // Small padding to prevent text hitting edges
    },
    subtitle: {
        fontFamily: 'Cinzel-Bold',
        color: '#fff',
        fontSize: 18,
        marginBottom: 8,
    },
    desc: {
        fontFamily: 'Outfit',
        color: '#aaa',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Cardo-Bold',
        color: '#FFD700',
        marginBottom: 6,
        fontSize: 12,
        letterSpacing: 1
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        color: '#fff',
        fontFamily: 'Outfit',
        fontSize: 16,
        outlineStyle: 'none',
        flex: 1,
    },
    inputWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
    },
    button: {
        width: '100%',
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        outlineStyle: 'none',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    buttonDisabled: {
        opacity: 0.7
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: 'Cinzel-Bold',
        color: '#000',
        fontSize: 16,
        letterSpacing: 1
    },
    disclaimer: {
        marginTop: 20,
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'Outfit',
        fontStyle: 'italic'
    },
    devContainer: {
        marginTop: 30,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        width: '100%',
        alignItems: 'center'
    },
    devLabel: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 10,
        color: '#FFD700',
        marginBottom: 10,
        letterSpacing: 1
    },
    devButtons: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center'
    },
    devButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    devButtonText: {
        color: '#fff',
        fontFamily: 'Cinzel-Bold',
        fontSize: 12
    },
    validationText: {
        fontFamily: 'Outfit',
        fontSize: 11,
        marginTop: 6,
        marginLeft: 4,
    },
    errorText: {
        color: '#ff4444',
    },
    successText: {
        color: '#4ade80',
    },
    checkingText: {
        color: '#aaa',
    }
});
