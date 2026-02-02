import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { DirtyCashIcon } from './Icons';

const RewardPopup = ({ amount, visible, onFinish }) => {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.3);

    useEffect(() => {
        if (visible) {
            // Reset values
            translateY.value = 0;
            opacity.value = 0;
            scale.value = 0.3;

            // Entrance: Pop up and fadeIn
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });

            // Movement: Float up slowly
            translateY.value = withTiming(-120, {
                duration: 2000,
                easing: Easing.out(Easing.quad)
            });

            // Exit: Fade out and shrink
            const timer = setTimeout(() => {
                opacity.value = withTiming(0, { duration: 500 }, (finished) => {
                    if (finished && onFinish) {
                        runOnJS(onFinish)();
                    }
                });
                scale.value = withTiming(0.8, { duration: 500 });
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
    }));

    if (!visible) return null;

    return (
        <View style={styles.outerContainer} pointerEvents="none">
            <Animated.View style={[styles.container, animatedStyle]}>
                <View style={styles.iconContainer}>
                    <DirtyCashIcon size={24} color="#10b981" />
                </View>
                <Text style={styles.text}>+{amount} DC</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        elevation: 100,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#10b981',
        gap: 10,
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    iconContainer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 5,
        borderRadius: 15,
    },
    text: {
        color: '#fff',
        fontFamily: 'Cinzel-Bold',
        fontSize: 22,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }
});

export default RewardPopup;
