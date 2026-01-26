import { StyleSheet, Pressable, View, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, Easing } from 'react-native-reanimated';
import HapticsService from '../services/HapticsService';
import SoundService from '../services/SoundService';

/**
 * PremiumPressable
 * A stable, high-performance pressable with custom ripple effect.
 * structure: 
 *   Animated.View (Scaling + User styles + Borders/BG)
 *     Children (Content)
 *     Pressable (Overlay Fill + Ripple + Touch Handling) <-- ON TOP
 */
const PremiumPressable = ({
    children,
    onPress,
    style,
    disabled,
    rippleColor = 'rgba(255, 255, 255, 0.2)',
    haptic = 'light',
    scaleDown = 0.97,
    hitSlop,
    overflow = 'hidden',
    contentContainerStyle,
    pressableStyle,
    enableRipple = true,
    enableSound = false, // [MODIFIED] Default false as per user request (only modals pop)
    pressInDuration = 100,
    pressOutDuration = 150
}) => {
    const scale = useSharedValue(1);

    // Ripple shared values
    const rippleScale = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);
    const rippleX = useSharedValue(0);
    const rippleY = useSharedValue(0);

    const handlePressIn = (event) => {
        if (disabled) return;

        const { locationX, locationY } = event.nativeEvent;
        rippleX.value = locationX;
        rippleY.value = locationY;

        rippleScale.value = 0;
        rippleOpacity.value = 0.35;

        rippleScale.value = withTiming(1, { duration: 500 });
        rippleOpacity.value = withTiming(0, { duration: 500 });

        scale.value = withTiming(scaleDown, { duration: pressInDuration, easing: Easing.out(Easing.quad) });
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withTiming(1, { duration: pressOutDuration, easing: Easing.out(Easing.quad) });
    };

    const rippleStyle = useAnimatedStyle(() => ({
        opacity: rippleOpacity.value,
        transform: [
            { translateX: rippleX.value - 100 },
            { translateY: rippleY.value - 100 },
            { scale: rippleScale.value * 3 },
        ],
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: withTiming(disabled ? 0.6 : 1, { duration: 200 }),
    }));

    return (
        <Animated.View style={[style, animatedStyle, { overflow: overflow }]}>
            <Pressable
                onPress={(e) => {
                    if (haptic) HapticsService.trigger(haptic);
                    if (enableSound) SoundService.play('tap');
                    onPress && onPress(e);
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                hitSlop={hitSlop}
                android_disableSound={true} // [FIX] Silence native Android touch sound
                style={[{ width: '100%', justifyContent: 'center', alignItems: 'center' }, Platform.OS === 'web' && { flex: 1, outlineStyle: 'none' }, pressableStyle]}
            >
                <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
                    {enableRipple && (
                        <Animated.View
                            style={[
                                rippleStyle,
                                styles.rippleBase,
                                { backgroundColor: rippleColor }
                            ]}
                        />
                    )}
                </View>

                {/* Content Rendered ON TOP of Ripple */}
                <View
                    style={[{ zIndex: 1, width: '100%' }, contentContainerStyle]}
                    pointerEvents="none"
                >
                    {children}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    rippleBase: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        zIndex: 0,
    }
});

export default PremiumPressable;
