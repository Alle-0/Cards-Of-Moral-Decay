import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CONFETTI_COUNT = 50;
const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fdcb6e'];

const ConfettiPiece = ({ delay, onComplete }) => {
    const x = useSharedValue(width / 2);
    const y = useSharedValue(-50);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(1);

    const endX = Math.random() * width;
    const endY = height + 100;
    const rotation = Math.random() * 720;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    useEffect(() => {
        x.value = withDelay(delay, withTiming(endX, { duration: 3000, easing: Easing.out(Easing.quad) }));
        y.value = withDelay(delay, withTiming(endY, { duration: 3000, easing: Easing.in(Easing.quad) }, (finished) => {
            if (finished && onComplete) {
                // runOnJS(onComplete)();
            }
        }));
        rotate.value = withDelay(delay, withTiming(rotation, { duration: 3000 }));
        opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 1000 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x.value },
                { translateY: y.value },
                { rotate: `${rotate.value}deg` }
            ],
            opacity: opacity.value,
            backgroundColor: color,
        };
    });

    return <Animated.View style={[styles.confetti, animatedStyle]} />;
};

const ConfettiSystem = forwardRef((props, ref) => {
    const [active, setActive] = useState(false);
    const [key, setKey] = useState(0);

    useImperativeHandle(ref, () => ({
        explode: () => {
            setKey(k => k + 1);
            setActive(true);
            setTimeout(() => setActive(false), 4000);
        }
    }));

    if (!active) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
                <ConfettiPiece key={`${key}-${i}`} delay={Math.random() * 500} />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    confetti: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
    },
});

export default ConfettiSystem;
