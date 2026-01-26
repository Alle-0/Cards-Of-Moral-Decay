import { useEffect } from 'react';
import { Gyroscope } from 'expo-sensors';
import { useSharedValue, withSpring, useAnimatedStyle, interpolate, SensorType } from 'react-native-reanimated';

export const useParallax = (sensitivity = 1) => {
    const x = useSharedValue(0);
    const y = useSharedValue(0);

    useEffect(() => {
        // [FIX] Guard for web or non-gyro devices
        if (require('react-native').Platform.OS === 'web') return;

        // Check if gyroscope is available
        Gyroscope.isAvailableAsync().then(available => {
            if (available) {
                Gyroscope.setUpdateInterval(50);
                const subscription = Gyroscope.addListener(data => {
                    // Smooth values to avoid jitter
                    // Inverting axes for natural "looking window" feel
                    x.value = withSpring(data.y * sensitivity);
                    y.value = withSpring(data.x * sensitivity);
                });
                return () => subscription.remove();
            }
        });
    }, []);

    // We return the shared values directly so consumers can compose their own transforms
    return {
        sensorX: x,
        sensorY: y
    };
};
