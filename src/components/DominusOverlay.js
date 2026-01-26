import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

import PremiumPressable from './PremiumPressable';
import { ErrorIcon, RankIcon, CrownIcon, SkipIcon, EyeIcon, CrossIcon } from './Icons';
import SoundService from '../services/SoundService';

const DominusOverlay = ({ status, onSkip, onReveal }) => {
    const { theme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const isJudging = status === 'DOMINUS_CHOOSING';
    const text = isJudging
        ? "Tocca a te scegliere il vincitore!"
        : "Sei il Dominus. Attendi le risposte...";

    // Animation Shared Value (0 = Collapsed, 1 = Expanded)
    const expansion = useSharedValue(0);

    useEffect(() => {
        if (isExpanded) SoundService.play('tap');
        expansion.value = withTiming(isExpanded ? 1 : 0, {
            duration: 400,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic Bezier for smooth "Apple-like" feel
        });
    }, [isExpanded]);

    // Trigger Style: Fades out and scales down when expanded
    const triggerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansion.value, [0, 0.5], [1, 0]),
        transform: [{ scale: interpolate(expansion.value, [0, 1], [1, 0.5]) }],
        pointerEvents: expansion.value > 0.1 ? 'none' : 'auto',
    }));

    // Card Style: Fades in and scales up when expanded
    const cardStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansion.value, [0.3, 1], [0, 1]),
        transform: [
            { scale: interpolate(expansion.value, [0, 1], [0.8, 1]) },
            { translateY: interpolate(expansion.value, [0, 1], [20, 0]) }
        ],
        pointerEvents: expansion.value > 0.9 ? 'auto' : 'none',
    }));

    // Backdrop: Only visible when expanded
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: expansion.value,
        pointerEvents: expansion.value > 0.1 ? 'auto' : 'none',
    }));


    return (
        <>
            {/* Backdrop for closing */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsExpanded(false)} />
            </Animated.View>

            {/* Container for both elements */}
            <View style={styles.rootContainer} pointerEvents="box-none">

                {/* 1. TRIGGER BUTTON */}
                <Animated.View style={[styles.triggerContainer, triggerStyle]}>
                    <PremiumPressable
                        onPress={() => setIsExpanded(true)}
                        style={[styles.triggerButton, { borderColor: theme.colors.accent, shadowColor: theme.colors.accent }]}
                        rippleColor={theme.colors.accent + '40'}
                        scaleDown={0.9}
                        pressableStyle={{ flex: 1 }} // Force Pressable to fill the container
                        contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 3 }} // Force content to fill Pressable and center
                    >
                        <ErrorIcon size={28} color={theme.colors.accent} />
                    </PremiumPressable>
                </Animated.View>

                {/* 2. EXPANDED CARD */}
                <Animated.View style={[styles.cardContainer, cardStyle]}>
                    <View style={[styles.card, { borderColor: theme.colors.accent }]}>
                        {/* Close Button */}
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setIsExpanded(false)}
                            hitSlop={20}
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
                                    {isJudging ? "GIUDIZIO IN CORSO" : "DOMINUS"}
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
                                <Text style={styles.actionBtnText}>SALTA</Text>
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
                                <Text style={[styles.actionBtnText, { color: theme.colors.accent }]}>SVELA</Text>
                            </PremiumPressable>
                        </View>
                    </View>
                </Animated.View>

            </View>
        </>
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
        alignItems: 'center'
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
