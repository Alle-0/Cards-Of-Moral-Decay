import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

import PremiumPressable from './PremiumPressable';
import { ErrorIcon, RankIcon, CrownIcon, SkipIcon, EyeIcon, CrossIcon } from './Icons';
import SoundService from '../services/SoundService';

const DominusOverlay = ({ status, onSkip, onReveal }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const expansion = useSharedValue(0);

    const isJudging = status === 'DOMINUS_CHOOSING';
    const text = isJudging
        ? t('dominus_choosing_msg')
        : t('dominus_waiting_msg');

    useEffect(() => {
        expansion.value = withTiming(isExpanded ? 1 : 0, {
            duration: 400,
            easing: Easing.out(Easing.back(1))
        });
    }, [isExpanded]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isExpanded ? 1 : 0, { duration: 300 }),
        pointerEvents: isExpanded ? 'auto' : 'none'
    }));

    const cardStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: interpolate(expansion.value, [0, 1], [400, 0]) },
                { scale: interpolate(expansion.value, [0, 1], [0.8, 1]) }
            ],
            opacity: expansion.value
        };
    });

    const triggerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withTiming(isExpanded ? 0 : 1, { duration: 250 }) }],
        opacity: withTiming(isExpanded ? 0 : 1, { duration: 200 })
    }));

    const toggleExpanded = () => {
        if (!isExpanded) SoundService.play('woosh_soft');
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.rootContainer} pointerEvents="box-none">
            {/* 0. BACKDROP */}
            <Animated.View
                pointerEvents={isExpanded ? 'auto' : 'none'}
                style={[styles.backdrop, backdropStyle]}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsExpanded(false)} />
            </Animated.View>

            {/* 1. TRIGGER BUTTON */}
            <Animated.View style={[styles.triggerContainer, triggerStyle]}>
                <PremiumPressable
                    onPress={toggleExpanded}
                    style={[styles.triggerButton, {
                        borderColor: isJudging ? theme.colors.accent : '#ffd700',
                        shadowColor: isJudging ? theme.colors.accent : '#ffd700'
                    }]}
                    rippleColor={isJudging ? theme.colors.accent + '30' : '#ffd70030'}
                    scaleDown={0.9}
                    contentContainerStyle={{ height: '100%', justifyContent: 'center' }}
                >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <ErrorIcon size={24} color={isJudging ? theme.colors.accent : '#ffd700'} />
                    </View>
                </PremiumPressable>
            </Animated.View>

            {/* 2. EXPANDED CARD */}
            <Animated.View style={[styles.cardContainer, cardStyle]}>
                <View style={[styles.card, { borderColor: theme.colors.accent }]}>
                    <Pressable
                        onPress={() => setIsExpanded(false)}
                        style={styles.closeButton}
                        hitSlop={15}
                    >
                        <CrossIcon size={20} color="#666" />
                    </Pressable>

                    {/* Header Section */}
                    <View style={styles.headerRow}>
                        {isJudging ? (
                            <View style={{ marginRight: 12 }}>
                                <RankIcon size={28} color={theme.colors.accent} />
                            </View>
                        ) : (
                            <View style={{ marginRight: 12 }}>
                                <CrownIcon size={28} color="#ffd700" />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: theme.colors.accent }]}>
                                {isJudging ? t('judging_title') : t('dominus_title')}
                            </Text>
                            <Text style={[styles.subtitle, { color: '#bbb' }]} numberOfLines={1}>
                                {text}
                            </Text>
                        </View>
                    </View>

                    {/* Actions Section */}
                    <View style={styles.actionsRow}>
                        <PremiumPressable
                            onPress={onSkip}
                            style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                            rippleColor="rgba(255, 255, 255, 0.1)"
                            scaleDown={0.96}
                            contentContainerStyle={styles.actionBtnContent}
                            pressableStyle={{ height: '100%' }}
                        >
                            <SkipIcon size={24} color="#ddd" />
                            <Text style={styles.actionBtnText}>{t('skip_btn')}</Text>
                        </PremiumPressable>

                        <PremiumPressable
                            onPress={onReveal}
                            style={[styles.actionBtn, { backgroundColor: theme.colors.accent + '20' }]} // Slight accent tint
                            rippleColor={theme.colors.accent + '40'}
                            scaleDown={0.96}
                            contentContainerStyle={styles.actionBtnContent}
                            pressableStyle={{ height: '100%' }}
                        >
                            <EyeIcon size={24} color={theme.colors.accent} />
                            <Text style={[styles.actionBtnText, { color: theme.colors.accent }]}>{t('reveal_btn')}</Text>
                        </PremiumPressable>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0, top: 0,
        zIndex: 100,
        pointerEvents: 'box-none'
    },
    // Trigger Styles
    triggerContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        alignItems: 'center',
        zIndex: 100, // [FIX] Ensure it sits above backdrop (zIndex 99)
    },
    triggerButton: {
        width: 56,
        height: 56,
        borderRadius: 28, // Fully circular
        backgroundColor: '#1a1a1a', // Dark theme background
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    // Expanded Styles
    cardContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        width: '94%',
        maxWidth: 500,
        alignItems: 'center',
        zIndex: 100, // [FIX] Ensure it sits above backdrop (zIndex 99)
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Subtle darkening
        zIndex: 99,
    },
    card: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 12,
        gap: 16
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 10
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 11,
        fontFamily: 'Cinzel-Bold',
        letterSpacing: 2,
        marginBottom: 2
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Outfit',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12
    },
    actionBtn: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        height: 50,
    },
    actionBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8
    },
    actionBtnText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 13,
        color: '#ddd',
        letterSpacing: 0.5
    }
});

export default DominusOverlay;
