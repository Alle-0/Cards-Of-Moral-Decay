import React, { useEffect } from 'react';
import { View, StyleSheet, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing
} from 'react-native-reanimated';

const PremiumSkeleton = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
    circle = false
}) => {
    const shimmerProgress = useSharedValue(0);
    const [measuredWidth, setMeasuredWidth] = React.useState(0);

    useEffect(() => {
        shimmerProgress.value = withRepeat(
            withTiming(1, {
                duration: 1000,
                easing: Easing.bezier(0.4, 0, 0.6, 1)
            }),
            -1,
            false
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => {
        // Use measured width or a sensible fallback
        const w = measuredWidth || (typeof width === 'number' ? width : 300);

        const translateX = interpolate(
            shimmerProgress.value,
            [0, 1],
            [-w * 1.5, w * 1.5]
        );

        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View
            style={[
                styles.container,
                {
                    width,
                    height,
                    borderRadius: circle ? height / 2 : borderRadius,
                    backgroundColor: 'rgba(255,255,255,0.09)' // [FIX] Increased visibility
                },
                style
            ]}
            onLayout={(e) => {
                const { width: w } = e.nativeEvent.layout;
                if (w > 0) setMeasuredWidth(w);
            }}
        >
            <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmer}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
    },
    shimmer: {
        flex: 1,
        width: '100%',
    }
});

export default PremiumSkeleton;
