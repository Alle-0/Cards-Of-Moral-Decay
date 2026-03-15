// Verified Reanimated usage
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, ScrollView, Modal } from 'react-native';
import EfficientBlurView from './EfficientBlurView';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, interpolate, useDerivedValue } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import PremiumIconButton from './PremiumIconButton';
import { CrossIcon } from './Icons';
import { useParallax } from '../hooks/useParallax';
import SoundService from '../services/SoundService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PremiumModal = ({ visible, onClose, title, children, showClose = true, modalHeight, borderColor, glowColor, titleColor, closeIconColor, backgroundColor, disableBottomSpacer = false }) => {
    const { theme } = useTheme();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    const [internalVisible, setInternalVisible] = useState(visible);
    const [isAnimating, setIsAnimating] = useState(false); // [NEW] Track animation state

    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            setIsAnimating(true); // [NEW]
            SoundService.play('tap');
            opacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }, (finished) => {
                if (finished) runOnJS(setIsAnimating)(false); // [NEW] Blur can start now
            });
            scale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) });
        } else {
            setIsAnimating(true); // [NEW] Hide blur during exit
            opacity.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }, (finished) => {
                if (finished) {
                    runOnJS(setInternalVisible)(false);
                    runOnJS(setIsAnimating)(false);
                }
            });
            scale.value = withTiming(0.9, { duration: 350, easing: Easing.in(Easing.quad) });
        }
    }, [visible]);

    const parallaxResult = useParallax(0.2);
    const fallbackSV = useSharedValue(0);
    const sensorX = (parallaxResult && parallaxResult.sensorX) ? parallaxResult.sensorX : fallbackSV;
    const sensorY = (parallaxResult && parallaxResult.sensorY) ? parallaxResult.sensorY : fallbackSV;

    // Transform only for the wrapper — parallax disabled on Android for performance
    const containerTransformStyle = useAnimatedStyle(() => {
        if (Platform.OS === 'android') {
            return { transform: [{ scale: scale.value }] };
        }
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

    // [FIX] Derive visibility to avoid evaluating .value during Component Render
    const isVisibleDerived = useDerivedValue(() => {
        return (visible || opacity.value > 0);
    });

    const rootStyle = useAnimatedStyle(() => {
        const isV = isVisibleDerived.value;
        return {
            opacity: isV ? 1 : 0,
            zIndex: isV ? 9999 : -1,
        };
    });

    // Separated pointerEvents since it's used in the View prop directly
    const pointerEventsDerived = useDerivedValue(() => {
        return (visible || opacity.value > 0) ? 'auto' : 'none';
    });

    if (!visible && !internalVisible) return null;

    // [FIX] Use Native Modal to break out of parent overflow
    return (
        <Modal
            transparent
            visible={internalVisible}
            onRequestClose={onClose}
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { zIndex: 10000, elevation: 10000 },
                    rootStyle
                ]}
                pointerEvents={internalVisible ? 'auto' : 'none'}
            >
                <View style={styles.overlay}>
                    {/* 1. Backdrop Blur (Non-interactive visual) */}
                    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: -1, backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]} pointerEvents="none">
                        {(!isAnimating || Platform.OS === 'ios') && (
                            <EfficientBlurView
                                intensity={10}
                                tint="dark"
                                style={StyleSheet.absoluteFill}
                            />
                        )}
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
                            alignItems: 'center', justifyContent: 'center',
                            overflow: Platform.OS === 'web' ? 'visible' : 'hidden'
                        }, containerTransformStyle]}
                    >
                        {/* CONTAINER: constrained to parent size */}
                        <View style={[{ width: '100%', alignItems: 'center', overflow: Platform.OS === 'web' ? 'visible' : 'hidden' }, (modalHeight && modalHeight !== true) ? { height: modalHeight } : (modalHeight === true ? { height: '100%' } : { maxHeight: '100%' })]}>

                            {/* ACTUAL CONTENT BOX */}
                            <AnimatedPressable
                                activeOpacity={1}
                                style={[
                                    styles.modalBox,
                                    {
                                        overflow: Platform.OS === 'web' ? 'hidden' : 'hidden',
                                        backgroundColor: backgroundColor || 'rgba(30, 30, 30, 0.95)',
                                        borderColor: borderColor || theme.colors.cardBorder,
                                        ...(Platform.OS === 'web' 
                                            ? { boxShadow: `0 0 ${glowColor ? 35 : 30}px ${glowColor || 'rgba(0,0,0,0.5)'}` }
                                            : {
                                                shadowColor: glowColor || '#000',
                                                shadowOpacity: glowColor ? 0.6 : 0.5,
                                                shadowRadius: glowColor ? 35 : 30,
                                            }
                                        ),
                                        // [PERF] Reduce elevation cost on Android
                                        elevation: Platform.OS === 'android' ? 3 : 10,
                                        width: '100%',
                                        height: modalHeight ? '100%' : undefined,
                                        paddingBottom: 0
                                    },
                                    contentOpacityStyle
                                ]}
                                renderToHardwareTextureAndroid={true}
                            >

                                {/* CONTENT: Rendered on top */}
                                <View style={[{ width: '100%', zIndex: 1, overflow: Platform.OS === 'web' ? 'hidden' : 'hidden' }, modalHeight && { flex: 1 }]}>
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
                                                <View style={Platform.OS === 'web'
                                                    ? { position: 'absolute', right: 5, top: 15, zIndex: 10 }
                                                    : { position: 'absolute', right: 5, top: 20, bottom: 0, justifyContent: 'center' }
                                                }>
                                                    <PremiumIconButton
                                                        icon={<CrossIcon size={Platform.OS === 'web' ? 20 : 24} color={closeIconColor || "#888"} />}
                                                        onPress={onClose}
                                                        enableSound={false}
                                                        size={Platform.OS === 'web' ? 36 : 32}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* List Content */}
                                    <View style={[styles.content, modalHeight && { flex: 1 }]}>
                                        {children}
                                    </View>

                                    {!disableBottomSpacer && <View style={{ height: 20, width: '100%' }} />}
                                </View>
                            </AnimatedPressable>
                        </View>
                    </Animated.View>
                </View>
            </Animated.View>
        </Modal>
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
        ...Platform.select({
            web: {
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 30,
            }
        }),
        elevation: 3, // [PERF] Lower elevation = cheaper shadow on Android
    },
    header: {
        width: '100%',
        minHeight: 50,
        marginBottom: 15,
        position: 'relative',
        justifyContent: 'center',
        overflow: Platform.OS === 'web' ? 'visible' : 'hidden'
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
