import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    Easing,
    runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CONFETTI_COUNT = 80;
const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fdcb6e', '#d4af37', '#ffffff'];

const ConfettiPiece = ({ delay, index, onComplete }) => {
    // Determine cannon side (even index = left, odd = right)
    const isLeft = index % 2 === 0;

    // Starting coordinates (bottom corners)
    const startX = isLeft ? -20 : width + 20;
    const startY = height - 150; // slightly above bottom

    const x = useSharedValue(startX);
    const y = useSharedValue(startY);
    const rotate = useSharedValue(0);
    const scale = useSharedValue(0);

    // Randomize trajectory (cannon angle pointing inwards and up)
    const distanceX = Math.random() * (width * 0.7) + (width * 0.1);
    const endX = isLeft ? startX + distanceX : startX - distanceX;

    const peakHeight = Math.random() * (height * 0.5) + (height * 0.2); // How high it goes up
    const peakY = startY - peakHeight;
    const endY = height + 100;

    const rotation = Math.random() * 1080 - 540;
    const finalScale = Math.random() * 0.7 + 0.6; // random size
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const timeUp = 800 + Math.random() * 600;
    const timeDown = 1800 + Math.random() * 1200;

    useEffect(() => {
        // Pop in scale
        scale.value = withDelay(delay, withTiming(finalScale, { duration: 100 }));

        // Arc X axis (decelerates over the entire lifetime)
        x.value = withDelay(
            delay,
            withTiming(endX, { duration: timeUp + timeDown, easing: Easing.out(Easing.cubic) })
        );

        // Arc Y axis (accelerates up, then accelerates down)
        y.value = withDelay(
            delay,
            withSequence(
                withTiming(peakY, { duration: timeUp, easing: Easing.out(Easing.cubic) }),
                withTiming(endY, { duration: timeDown, easing: Easing.in(Easing.quad) }, (finished) => {
                    if (finished && onComplete) {
                        // runOnJS(onComplete)();
                    }
                })
            )
        );

        // Spin while flying
        rotate.value = withDelay(delay, withTiming(rotation, { duration: timeUp + timeDown, easing: Easing.out(Easing.quad) }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x.value },
                { translateY: y.value },
                { rotate: `${rotate.value}deg` },
                { scale: scale.value }
            ],
            backgroundColor: color,
            opacity: y.value >= startY && y.value < endY ? 1 : (y.value > endY - 200 ? 0 : 1) // simple fade out logic fallback
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
            setTimeout(() => setActive(false), 4500);
        }
    }));

    if (!active) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="none">
            {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
                <ConfettiPiece
                    key={`${key}-${i}`}
                    index={i}
                    delay={Math.random() * 250}
                />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    confetti: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 2,
    },
});

export default ConfettiSystem;
