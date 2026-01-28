// Verified Reanimated usage
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from 'react-native';
import EfficientBlurView from './EfficientBlurView';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, interpolate } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import PremiumIconButton from './PremiumIconButton';
import { CrossIcon } from './Icons';
import { useParallax } from '../hooks/useParallax';
import SoundService from '../services/SoundService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PremiumModal = ({ visible, onClose, title, children, showClose = true, modalHeight, borderColor, glowColor, titleColor, closeIconColor, backgroundColor }) => {
    const { theme } = useTheme();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    const [internalVisible, setInternalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            SoundService.play('tap');
            opacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) });
            scale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) });
        } else {
            opacity.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }, (finished) => {
                if (finished) {
                    runOnJS(setInternalVisible)(false);
                }
            });
            scale.value = withTiming(0.9, { duration: 350, easing: Easing.in(Easing.quad) });
        }
    }, [visible]);

    const parallaxResult = useParallax(0.2);
    const fallbackSV = useSharedValue(0);
    const sensorX = (parallaxResult && parallaxResult.sensorX) ? parallaxResult.sensorX : fallbackSV;
    const sensorY = (parallaxResult && parallaxResult.sensorY) ? parallaxResult.sensorY : fallbackSV;

    // Transform only for the wrapper
    const containerTransformStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateX: interpolate(sensorX.value, [-1, 1], [-10, 10], 'clamp') },
                { translateY: interpolate(sensorY.value, [-1, 1], [-10, 10], 'clamp') }
            ],
        };
    });

    const contentOpacityStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const rootStyle = useAnimatedStyle(() => {
        // [FIX] Avoid local const outside if possible, though this is usually fine in worklets
        // The warning might be because 'visible' is used?
        return {
            opacity: (visible || opacity.value > 0) ? 1 : 0,
            pointerEvents: (visible || opacity.value > 0) ? 'auto' : 'none',
            zIndex: (visible || opacity.value > 0) ? 9999 : -1,
        };
    });

    if (!visible && !internalVisible) return null;

    return (
        <Animated.View style={[
            StyleSheet.absoluteFill,
            { zIndex: 10000, elevation: 10000 },
            rootStyle
        ]}>
            <View style={styles.overlay}>
                {/* 1. Backdrop Blur (Non-interactive visual) */}
                <Animated.View style={[StyleSheet.absoluteFill, { zIndex: -1, backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]} pointerEvents="none">
                    <EfficientBlurView
                        intensity={20}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                {/* 2. Dismiss Overlay (Interactive) */}
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                {/* 3. Modal Content Wrapper */}
                <Animated.View
                    pointerEvents="box-none"
                    style={[{
                        width: '85%', maxWidth: 500, maxHeight: '90%',
                        alignItems: 'center', justifyContent: 'center'
                    }, containerTransformStyle]}
                >
                    {/* CONTAINER: constrained to parent size */}
                    <View style={[{ width: '100%' }, (modalHeight && modalHeight !== true) ? { height: modalHeight } : (modalHeight === true ? { height: '100%' } : { maxHeight: '100%' })]}>

                        {/* ACTUAL CONTENT BOX */}
                        <AnimatedPressable
                            activeOpacity={1}
                            style={[
                                styles.modalBox,
                                {
                                    backgroundColor: backgroundColor || 'rgba(30, 30, 30, 0.95)',
                                    borderColor: borderColor || theme.colors.cardBorder,
                                    shadowColor: glowColor || '#000',
                                    shadowOpacity: glowColor ? 0.6 : 0.5,
                                    shadowRadius: glowColor ? 35 : 30,
                                    width: '100%',
                                    height: modalHeight ? '100%' : undefined,
                                    paddingBottom: 0
                                },
                                contentOpacityStyle // Appply opacity directly here
                            ]}
                        >

                            {/* CONTENT: Rendered on top */}
                            <View style={[{ width: '100%', zIndex: 1 }, modalHeight && { flex: 1 }]}>
                                {/* Header */}
                                {(title || showClose) && (
                                    <View style={[styles.header, { paddingTop: 20, paddingHorizontal: 20 }]}>
                                        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 10 }}>
                                            <Text
                                                style={[styles.title, {
                                                    color: titleColor || theme.colors.accent,
                                                    fontFamily: 'Cinzel-Bold',
                                                    fontSize: 24,
                                                    lineHeight: 32,
                                                    textAlign: 'center',
                                                    includeFontPadding: false
                                                }]}
                                                numberOfLines={2}
                                            >
                                                {title}
                                            </Text>
                                        </View>
                                        {showClose && (
                                            <View style={{ position: 'absolute', right: 5, top: 20, bottom: 0, justifyContent: 'center' }}>
                                                <PremiumIconButton
                                                    icon={<CrossIcon size={24} color={closeIconColor || "#888"} />}
                                                    onPress={onClose}
                                                    enableSound={false}
                                                    size={32}
                                                />
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* List Content */}
                                <View style={[styles.content, modalHeight && { flex: 1 }]}>
                                    {children}
                                </View>

                                <View style={{ height: 20, width: '100%' }} />
                            </View>
                        </AnimatedPressable>
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    modalBox: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10,
    },
    header: {
        width: '100%',
        minHeight: 50,
        marginBottom: 15,
        position: 'relative',
        justifyContent: 'center'
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        flex: 1,
    },
    content: {
        width: '100%',
    },
});

export default PremiumModal;
