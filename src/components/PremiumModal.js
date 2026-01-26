// Verified Reanimated usage
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Platform, ScrollView } from 'react-native';
import EfficientBlurView from './EfficientBlurView'; // [NEW]
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS, interpolate } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import PremiumIconButton from './PremiumIconButton';
import { CrossIcon } from './Icons';
import { useParallax } from '../hooks/useParallax';
import SoundService from '../services/SoundService';

const PremiumModal = ({ visible, onClose, title, children, showClose = true, modalHeight }) => {
    const { theme } = useTheme();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    const [internalVisible, setInternalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            SoundService.play('tap'); // [NEW] Pop sound on open
            setInternalVisible(true);
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

    const parallaxResult = useParallax(0.2); // [TUNED] Subtle 0.2
    const fallbackSV = useSharedValue(0);
    const sensorX = (parallaxResult && parallaxResult.sensorX) ? parallaxResult.sensorX : fallbackSV;
    const sensorY = (parallaxResult && parallaxResult.sensorY) ? parallaxResult.sensorY : fallbackSV;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { scale: scale.value },
                { translateX: interpolate(sensorX.value, [-1, 1], [-10, 10], 'clamp') }, // [TUNED] +/- 10px
                { translateY: interpolate(sensorY.value, [-1, 1], [-10, 10], 'clamp') }  // [TUNED] +/- 10px
            ],
        };
    });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Removed unsafe opacity.value check. internalVisible handles standard visibility.

    const rootStyle = useAnimatedStyle(() => {
        const isActive = visible || opacity.value > 0;
        return {
            opacity: isActive ? 1 : 0,
            pointerEvents: isActive ? 'auto' : 'none',
            zIndex: isActive ? 9999 : -1,
        };
    });

    return (
        <Modal
            transparent={true}
            visible={internalVisible}
            onRequestClose={onClose}
            animationType="none" // We handle animations with Reanimated
            statusBarTranslucent={true}
        >
            <Animated.View style={[
                StyleSheet.absoluteFill,
                { zIndex: 10000, elevation: 10000 },
                rootStyle
            ]}>
                <View style={styles.overlay}>
                    {/* 1. Backdrop Blur (Non-interactive) */}
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
                        style={[{
                            width: '85%', maxWidth: 500, maxHeight: '90%',
                            alignItems: 'center', justifyContent: 'center'
                        }, animatedStyle]}
                    >
                        {/* THE ACTUAL BOX - Wrapped in a Pressable to block click propagation to backdrop */}
                        <Pressable
                            activeOpacity={1}
                            style={[{ width: '100%' }, modalHeight ? { height: modalHeight, maxHeight: '100%' } : {}]}
                        >
                            <View style={[styles.modalBox, {
                                borderColor: theme.colors.cardBorder,
                                width: '100%',
                                height: modalHeight ? '100%' : 'auto',
                                overflow: 'hidden',
                                paddingVertical: 20,
                                paddingHorizontal: 20,
                                paddingBottom: 0
                            }]}>
                                <View style={styles.header}>
                                    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 10 }}>
                                        <Text
                                            style={[styles.title, {
                                                color: theme.colors.accent,
                                                fontFamily: 'Cinzel Decorative-Bold',
                                                fontSize: 22,
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
                                        <View style={{ position: 'absolute', right: -10, top: 0, bottom: 0, justifyContent: 'center' }}>
                                            <PremiumIconButton
                                                icon={<CrossIcon size={24} color="#888" />}
                                                onPress={onClose}
                                                enableSound={false}
                                                size={32}
                                            />
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.content, modalHeight ? { flex: 1 } : { flex: 0 }]}>
                                    {children}
                                </View>

                                <View style={{ height: 20, width: '100%' }} />
                            </View>
                        </Pressable>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10,
        // Remove zIndex or handle it carefully if needed
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
    closeBtn: {
        padding: 5,
    },
    closeText: {
        color: '#ccc',
        fontSize: 24,
    },
    content: {
        width: '100%',
    },
});

export default PremiumModal;
