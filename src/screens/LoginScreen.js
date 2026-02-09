import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
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
    Easing
} from 'react-native-reanimated';
import ConfirmationModal from '../components/ConfirmationModal';
import PremiumBackground from '../components/PremiumBackground';

const { width } = Dimensions.get('window');

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

    // [NEW] Animated Tab Logic
    const tabProgress = useSharedValue(0); // 0 = new, 1 = recover

    useEffect(() => {
        tabProgress.value = withTiming(activeTab === 'new' ? 0 : 1, {
            duration: 300,
            easing: Easing.out(Easing.cubic)
        });
    }, [activeTab]);

    const animatedTabStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tabProgress.value * ((width * 0.9 - 48 - 8) / 2) }]
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        // We must subtract the padding (24 * 2 = 48) from the width to get the correct inner width
        transform: [{ translateX: -tabProgress.value * (width * 0.9 - 48) }]
    }));

    // Form States
    const [username, setUsername] = useState('');
    const [recoverUsername, setRecoverUsername] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    // --- Actions ---

    const handleSignUp = async () => {
        if (!username.trim()) {
            setModal({ visible: true, title: t('login_error_title'), message: t('login_error_missing_name') });
            return;
        }

        setLoading(true);
        try {
            await signUp(username.trim());
            setLoading(false);
        } catch (error) {
            setModal({ visible: true, title: t('login_error_title'), message: error.message });
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
                <View style={styles.tabContainer}>
                    <Animated.View style={[styles.tabIndicator, animatedTabStyle]} />

                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => setActiveTab('new')}
                    >
                        <Animated.Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>{t('login_new_player')}</Animated.Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => setActiveTab('recover')}
                    >
                        <Animated.Text style={[styles.tabText, activeTab === 'recover' && styles.activeTabText]}>{t('login_recover')}</Animated.Text>
                    </TouchableOpacity>
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
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('login_alias_placeholder')}
                                    placeholderTextColor="#666"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
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
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('login_old_alias_placeholder')}
                                    placeholderTextColor="#666"
                                    value={recoverUsername}
                                    onChangeText={setRecoverUsername}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('login_secret_code_label')}</Text>
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
                    Caricamento...
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
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontFamily: 'Outfit',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        outlineStyle: 'none',
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
    }
});
