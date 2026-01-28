import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, ZoomIn, SlideInUp, FadeInDown } from 'react-native-reanimated';
import PremiumModal from './PremiumModal';
import AvatarWithFrame from './AvatarWithFrame';
import EfficientBlurView from './EfficientBlurView';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const RoundWinnerModal = ({ visible, onClose, winnerInfo, playersList = [] }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    useEffect(() => {
        if (visible) {
            // Initial haptic feedback
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
                console.log('Haptics failed', error);
            }
        }
    }, [visible]);

    if (!winnerInfo) return null;

    // Logic to extract winning cards text
    const getWinningCardsText = () => {
        const winningCards = winnerInfo.winningCards;
        if (!winningCards) return "Carta non trovata";

        if (Array.isArray(winningCards)) {
            return winningCards.join(' / ');
        }

        if (typeof winningCards === 'object') {
            return winningCards.text || Object.values(winningCards).join(' / ');
        }

        if (typeof winningCards === 'string') {
            return winningCards;
        }

        return "Carta non trovata";
    };

    const winnerPlayer = playersList.find(p => p.name === winnerInfo.name);

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title=""
            showClose={false}
            borderColor="#d4af37"
            backgroundColor="transparent"
        >
            <View style={{ alignItems: 'center', width: '100%', paddingTop: 30, paddingBottom: 10 }}>

                {/* 1. GLASS BACKGROUND */}
                <View style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden', zIndex: -1 }]}>
                    <EfficientBlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 10, 0.8)' }]} />
                </View>

                {/* TITOLO - Snappier entrance after modal zoom */}
                <Animated.View
                    entering={FadeInDown.delay(500).duration(500)}
                    style={{ width: '100%', alignItems: 'center', marginBottom: 25 }}
                >
                    <Text style={{
                        fontFamily: 'Cinzel-Bold',
                        color: theme.colors.accent,
                        fontSize: 26,
                        textAlign: 'center'
                    }}>
                        {t('winner_label')}
                    </Text>
                    <Text style={{
                        fontFamily: 'Cinzel-Bold',
                        color: theme.colors.accent,
                        fontSize: 16,
                        textAlign: 'center',
                        opacity: 0.7,
                        letterSpacing: 4,
                        marginTop: -2
                    }}>
                        {t('winner_sublabel')}
                    </Text>
                </Animated.View>

                {/* AVATAR (BOOM!) */}
                <Animated.View
                    entering={ZoomIn.delay(850).springify().damping(20).stiffness(180)}
                    style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 110,
                    }}
                >
                    <View style={{
                        zIndex: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.8,
                        shadowRadius: 15,
                        elevation: 20
                    }}>
                        <AvatarWithFrame
                            avatar={winnerInfo?.avatar?.startsWith('http') ? winnerInfo.avatar : (winnerInfo?.avatar || 'User')}
                            frameId={winnerPlayer?.activeFrame || 'basic'}
                            size={100}
                        />
                    </View>
                </Animated.View>

                {/* NOME (Gold Text) */}
                <Animated.View
                    entering={FadeIn.delay(1150).duration(500)}
                    style={{
                        marginTop: 15,
                        marginBottom: 20,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{
                        fontFamily: 'Cinzel-Bold',
                        color: theme.colors.accent,
                        fontSize: 24,
                        textAlign: 'center',
                        letterSpacing: 1,
                        textShadowColor: 'rgba(212, 175, 55, 0.4)',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 12
                    }}>
                        {winnerInfo?.name}
                    </Text>
                </Animated.View>

                {/* CARTA (SLAM! From top) */}
                <Animated.View
                    entering={SlideInUp.delay(1500).springify().mass(1.2).damping(25).stiffness(150)}
                    style={{
                        width: '88%',
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        padding: 24,
                        minHeight: 140,
                        justifyContent: 'center',
                        alignItems: 'center',
                        // DEEPER 3D SHADOW
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 25 },
                        shadowOpacity: 0.8,
                        shadowRadius: 30,
                        elevation: 35,
                        transform: [
                            { rotate: '-3deg' },
                            { perspective: 1000 },
                            { translateY: 10 }
                        ],
                        marginBottom: 35,
                    }}
                >
                    <View style={{ position: 'absolute', top: 12, left: 12, opacity: 0.2 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Cinzel-Bold', color: '#000' }}>{t('dominus_choice_label')}</Text>
                    </View>

                    <Text style={{
                        color: '#111',
                        fontFamily: 'Outfit-Bold',
                        fontSize: 24,
                        textAlign: 'center',
                        lineHeight: 34
                    }}>
                        {getWinningCardsText()}
                    </Text>

                    <View style={{ position: 'absolute', bottom: 12, right: 12 }}>
                        <Text style={{ fontSize: 8, color: '#999', fontFamily: 'Cinzel-Bold' }}>CARDS OF MORAL DECAY</Text>
                    </View>
                </Animated.View>

                {/* FOOTER */}
                <Animated.Text
                    entering={FadeIn.delay(2200)}
                    style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', fontSize: 11, fontStyle: 'italic', marginBottom: 10 }}
                >
                    {t('thinking_round_msg')}
                </Animated.Text>
            </View>
        </PremiumModal>
    );
};

export default RoundWinnerModal;
