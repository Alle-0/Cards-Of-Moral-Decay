import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ImageBackground, Alert, ScrollView } from 'react-native';
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
    const { signUp, recoverAccount, loading: authLoading, user: authUserSession } = useAuth();
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'recover'

    // [NEW] Monitor for Database Index Errors
    useEffect(() => {
        if (authUserSession?.error === "MISSING_INDEX") {
            setModal({
                visible: true,
                title: "DATABASE BLOCCATO",
                message: "Devi aggiungere l'indice nelle regole di Firebase per poter entrare. Controlla il piano di implementazione (implementation_plan.md) per il codice da incollare."
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

    // Form States
    const [username, setUsername] = useState('');
    const [recoverUsername, setRecoverUsername] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    // --- Actions ---

    const handleSignUp = async () => {
        if (!username.trim()) {
            setModal({ visible: true, title: "Errore", message: "Devi scegliere un nome." });
            return;
        }

        setLoading(true);
        try {
            await signUp(username.trim());
            // Reset loading even on success to avoid UI deadlock
            setLoading(false);
        } catch (error) {
            setModal({ visible: true, title: "Errore", message: error.message });
            setLoading(false);
        }
    };

    const handleRecovery = async () => {
        if (!recoverUsername.trim() || !recoveryCode.trim()) {
            setModal({ visible: true, title: "Errore", message: "Inserisci nome e codice segreto." });
            return;
        }

        setLoading(true);
        try {
            const formattedCode = recoveryCode.trim().toUpperCase();
            await recoverAccount(recoverUsername.trim(), formattedCode);
            // No need to set modal "Bentornato" as App.js will navigate away instantly
            // but we reset loading just in case of slight delay
            setLoading(false);
        } catch (error) {
            setModal({ visible: true, title: "Fallimento", message: error.message });
            setLoading(false);
        }
    };

    // --- UI Components ---

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
            <View style={styles.container}>
                <Animated.View
                    layout={LinearTransition.duration(300).easing(Easing.out(Easing.cubic))}
                    entering={FadeInDown.delay(200).springify()}
                    style={styles.content}
                >
                    <Text style={styles.title}>Cards of{"\n"}Moral Decay</Text>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {/* [NEW] Animated Indicator */}
                        <Animated.View style={[styles.tabIndicator, animatedTabStyle]} />

                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => setActiveTab('new')}
                        >
                            <Animated.Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>Nuovo Giocatore</Animated.Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => setActiveTab('recover')}
                        >
                            <Animated.Text style={[styles.tabText, activeTab === 'recover' && styles.activeTabText]}>Recupera</Animated.Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    <Animated.View
                        layout={LinearTransition.duration(300).easing(Easing.out(Easing.cubic))}
                        style={styles.formArea}
                    >
                        {activeTab === 'new' ? (
                            <Animated.View
                                key="new"
                                entering={SlideInLeft.duration(300)}
                                exiting={SlideOutLeft.duration(300)}
                                style={styles.formSlide}
                            >
                                <Text style={styles.subtitle}>Entra nel caos.</Text>
                                <Text style={styles.desc}>Nessuna email. Nessuna password. Solo il tuo nome.</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>ALIAS</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Come vuoi farti salvare?"
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
                                            {loading ? "CREAZIONE..." : "ENTRA NEL GIRO"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <Text style={styles.disclaimer}>
                                    Ti verrà assegnato un Codice di Recupero.{"\n"}Non perderlo, o perdi tutto.
                                </Text>
                            </Animated.View>
                        ) : (
                            <Animated.View
                                key="recover"
                                entering={SlideInRight.duration(300)}
                                exiting={SlideOutRight.duration(300)}
                                style={styles.formSlide}
                            >
                                <Text style={styles.subtitle}>Riprenditi ciò che è tuo.</Text>
                                <Text style={styles.desc}>Usa il codice segreto per trasferire il tuo profilo su questo dispositivo.</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>ALIAS</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Il tuo vecchio nome"
                                        placeholderTextColor="#666"
                                        value={recoverUsername}
                                        onChangeText={setRecoverUsername}
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>CODICE SEGRETO</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="XXX-XXXX"
                                        placeholderTextColor="#666"
                                        value={recoveryCode}
                                        onChangeText={(text) => {
                                            const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                            let formatted = cleaned;

                                            // If adding the 3rd char, append hyphen immediately
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
                                            {loading ? "VERIFICA..." : "RIPRISTINA"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </Animated.View>

                </Animated.View>

                <ConfirmationModal
                    visible={modal.visible}
                    title={modal.title}
                    message={modal.message}
                    onClose={() => setModal({ ...modal, visible: false })}
                    singleButton={true}
                    confirmText="OK"
                    onConfirm={() => setModal({ ...modal, visible: false })}
                />
                {/* Debug: Force reset session if stuck */}
                <TouchableOpacity
                    onPress={async () => {
                        await signOut(auth);
                        window.location.reload();
                    }}
                    style={{ marginTop: 20, opacity: 0.4 }}
                >
                    <Text style={{ color: '#aaa', fontSize: 10, textAlign: 'center', fontFamily: 'Outfit' }}>
                        Problemi con il database? Clicca qui per resettare la sessione
                    </Text>
                </TouchableOpacity>

            </View>
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
        overflow: 'hidden', // [FIX] Taglia le animazioni che escono dal bordo
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
    formArea: {
        width: '100%',
        minHeight: 250, // Avoid layout jumping
    },
    formSlide: {
        width: '100%'
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
    }
});
