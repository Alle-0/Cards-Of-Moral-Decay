import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, useWindowDimensions, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
    Easing,
    LinearTransition,
    ZoomIn,
    ZoomOut,
    interpolate
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import PremiumIconButton from './PremiumIconButton';
import { useParallax } from '../hooks/useParallax';
import SoundService from '../services/SoundService';
import { CrossIcon } from './Icons';



const ClassyModal = ({ visible, onClose, title, children, icon = "⚙️", iconColor, texture = null }) => {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    // Use hook directly with paranoid checks
    const parallaxResult = useParallax(0.2); // [TUNED] Reduced to 0.2
    const fallbackSV = useSharedValue(0);
    const sensorX = (parallaxResult && parallaxResult.sensorX) ? parallaxResult.sensorX : fallbackSV;
    const sensorY = (parallaxResult && parallaxResult.sensorY) ? parallaxResult.sensorY : fallbackSV;

    // Default icon color to theme accent if not provided
    const finalIconColor = iconColor || theme.colors.accent;

    useEffect(() => {
        if (visible) {
            SoundService.play('tap'); // [NEW] Pop sound on open
            opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
            scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
        } else {
            opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) });
            scale.value = withTiming(0.8, { duration: 200, easing: Easing.in(Easing.quad) });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { scale: scale.value },
                { translateX: interpolate(sensorX.value, [-1, 1], [-10, 10], 'clamp') },
                { translateY: interpolate(sensorY.value, [-1, 1], [-10, 10], 'clamp') }
            ],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    // Reactive root style to handle visibility and touch blocking
    const rootStyle = useAnimatedStyle(() => {
        // We remain "active" (visible + interactable) if visible prop is true 
        // OR if the fade-out animation is still playing (opacity > 0)
        const isActive = visible || opacity.value > 0;

        return {
            opacity: isActive ? 1 : 0,
            pointerEvents: isActive ? 'auto' : 'none',
        };
    });

    const iconParallaxStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: interpolate(sensorX.value, [-1, 1], [-20, 20], 'clamp') }, // Move MORE than the card (20) to float "above"
                { translateY: interpolate(sensorY.value, [-1, 1], [-20, 20], 'clamp') }
            ],
        };
    });

    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, { zIndex: 9000, elevation: 9000 }, rootStyle]}
        >
            <View style={styles.overlay}>

                {visible && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: -1, backgroundColor: 'rgba(0,0,0,0.85)' }]} pointerEvents="none">
                        <BlurView
                            intensity={Platform.OS === 'android' ? 40 : 10}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                )}

                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <Animated.View
                    layout={LinearTransition.duration(300).easing(Easing.out(Easing.quad))} // Smooth resize, no bounce
                    style={[
                        styles.modalBox,
                        {
                            width: Math.min(windowWidth * 0.85, 340),
                            backgroundColor: '#121214',
                            borderColor: theme.colors.cardBorder,
                            borderWidth: 1.5,
                        },
                        animatedStyle
                    ]}
                >
                    {/* Texture Layer - Clipped but separate from floating elements */}
                    <View style={[StyleSheet.absoluteFill, { borderRadius: 22, overflow: 'hidden' }]}>
                        {texture && (
                            <Image
                                source={texture}
                                style={[StyleSheet.absoluteFill, { opacity: 0.05, tintColor: '#fff' }]}
                                resizeMode="repeat"
                            />
                        )}
                    </View>

                    <Pressable style={styles.innerContainer}>


                        <PremiumIconButton
                            onPress={onClose}
                            enableSound={false}
                            style={styles.closeButton}
                            icon={<CrossIcon size={20} color="#888" />}
                            size={32}
                        />


                        <Animated.View style={[styles.iconWrapper, iconParallaxStyle]}>
                            <View
                                style={[
                                    styles.iconCircle,
                                    {
                                        backgroundColor: '#18181b',
                                        borderColor: theme.colors.cardBorder,
                                        borderWidth: 1.5,
                                    }
                                ]}
                            >
                                <Animated.View
                                    key={title} // Trigger animation when title/section changes
                                    entering={ZoomIn.duration(500).easing(Easing.out(Easing.quad))}
                                    exiting={ZoomOut.duration(400)}
                                    style={{ alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {typeof icon === 'string' ? (
                                        <Text style={{ fontSize: 32, color: finalIconColor }}>{icon}</Text>
                                    ) : (
                                        icon
                                    )}
                                </Animated.View>
                            </View>
                        </Animated.View>

                        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>

                        {/* Clip content relative to inner container, but allow full width */}
                        <View style={[styles.content, { overflow: 'hidden' }]}>
                            {children}
                        </View>
                    </Pressable>
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
    },
    modalBox: {
        borderRadius: 24,
        padding: 24,
        paddingTop: 45, // Space for the floating icon
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 20,
        position: 'relative',
    },
    innerContainer: {
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: -35,
        right: -10,
        zIndex: 100,
        padding: 5,
    },
    closeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    iconWrapper: {
        position: 'absolute',
        top: -85, // Half-out of the padded box (approx)
        alignSelf: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        fontFamily: 'Outfit',
        textAlign: 'center',
    },
    content: {
        width: '100%',
    },
});

export default ClassyModal;
