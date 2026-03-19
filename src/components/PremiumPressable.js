import React from 'react';
import { StyleSheet, Pressable, View, Platform, useWindowDimensions } from 'react-native';
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
    onLongPress,
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
    pressOutDuration = 150,
    borderRadius = 12, // [NEW] Customizable radius for hover overlay
    hoverColor = 'rgba(255, 255, 255, 0.08)', // [NEW] Custom hover overlay color
    activeScale = null, // [NEW] Override automatic scaleDown if provided
}) => {
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && windowWidth >= 1024 && typeof navigator !== 'undefined' && !(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    // [NEW] Attempt to extract borderRadius from style to ensure hover alignment
    const getStyleProp = (property) => {
        if (!style) return null;
        const styles = Array.isArray(style) ? style : [style];
        for (let i = styles.length - 1; i >= 0; i--) {
            const s = styles[i];
            if (s && typeof s === 'object' && s[property] !== undefined) return s[property];
        }
        return null;
    };

    const effectiveBorderRadius = borderRadius !== 12 ? borderRadius : (getStyleProp('borderRadius') ?? 12);

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
                onLongPress={onLongPress}
                disabled={disabled}
                hitSlop={hitSlop}
                android_disableSound={true} // [FIX] Silence native Android touch sound
                style={({ pressed, hovered }) => {
                    // [NEW] Robust Web Hover feedback - ONLY FOR DESKTOP PC (>= 1024px)
                    if (isDesktop && !disabled && !pressed) {
                        if (hovered) {
                            scale.value = withSpring(1.02, { mass: 0.5, stiffness: 200, damping: 15 });
                        } else {
                            scale.value = withSpring(1, { mass: 0.5, stiffness: 200, damping: 15 });
                        }
                    }
                    return [
                        { width: '100%', borderRadius: effectiveBorderRadius },
                        Platform.OS === 'web' && { flex: 1, outlineStyle: 'none', cursor: disabled ? 'default' : 'pointer', borderRadius: effectiveBorderRadius, justifyContent: 'center' },
                        pressableStyle
                    ];
                }}
            >
                {({ pressed, hovered }) => (
                    <>
                        <View style={[StyleSheet.absoluteFill, { zIndex: 0, borderRadius: effectiveBorderRadius, overflow: 'hidden' }]}>
                            {enableRipple && (
                                <Animated.View
                                    style={[
                                        rippleStyle,
                                        styles.rippleBase,
                                        { backgroundColor: rippleColor }
                                    ]}
                                />
                            )}
                            {/* [NEW] Subtle Hover Overlay for Web DESKTOP PC */}
                            {isDesktop && hovered && !disabled && (
                                <Animated.View
                                    style={[
                                        StyleSheet.absoluteFill,
                                        { backgroundColor: hoverColor, borderRadius: effectiveBorderRadius, zIndex: 1 }
                                    ]}
                                    pointerEvents="none"
                                />
                            )}
                        </View>

                        {/* Content Rendered ON TOP of Ripple */}
                        <View
                            style={[{ zIndex: 2, width: '100%', borderRadius: effectiveBorderRadius }, contentContainerStyle]}
                            pointerEvents="none"
                        >
                            {children}
                        </View>
                    </>
                )}
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

export default React.memo(PremiumPressable);
