import { useDerivedValue, withSpring, useSharedValue } from 'react-native-reanimated';
export const SNAP_SPRING_CONFIG = {
    damping: 40,
    stiffness: 200,
    overshootClamping: false
};

/**
 * Calculates a "liquid" scale effect that peaks at the midpoint of travel.
 * 
 * @param {SharedValue<number>} currentPos - Current position of the indicator
 * @param {SharedValue<number>} startPos - Where the current movement started
 * @param {SharedValue<number>} targetPos - Where the movement is heading
 * @param {SharedValue<boolean>} isDragging - Whether the user is currently holding the indicator
 * @param {number} [maxScale=1.15] - Maximum scale during drag/peak
 * @returns {DerivedValue<number>} - The calculated scale value
 */
export const useLiquidScale = (currentPos, startPos, targetPos, isDragging, maxScale = 1.15) => {
    return useDerivedValue(() => {
        // 1. If actively dragging, scale up fully
        if (isDragging.value) return withSpring(maxScale);

        const dist = Math.abs(targetPos.value - startPos.value);
        // Avoid division by zero or tiny movements
        if (dist < 1) return withSpring(1);

        // 2. Calculate progress (0 to 1)
        const progress = (currentPos.value - startPos.value) / (targetPos.value - startPos.value);
        const clampedProgress = Math.min(Math.max(progress, 0), 1);

        // 3. Sine wave peak at 0.5 (center)
        // Scale moves from 1 -> 1 + (maxScale-1) -> 1
        const peak = maxScale - 1; // e.g., 0.15
        return 1 + peak * Math.sin(Math.PI * clampedProgress);
    });
};

/**
 * Helper to update animation anchors when a gesture ends or a click occurs.
 * This ensures the mid-path peak logic has the correct reference points.
 * 
 * @param {SharedValue<number>} startPos 
 * @param {SharedValue<number>} targetPos 
 * @param {SharedValue<boolean>} isDragging 
 * @param {number} currentVal 
 * @param {number} nextTarget 
 */
export const updateLiquidAnchors = (startPos, targetPos, isDragging, currentVal, nextTarget) => {
    'worklet'; // Mark as worklet if calling from UI thread, though usually called from JS
    isDragging.value = false;
    startPos.value = currentVal;
    targetPos.value = nextTarget;
};

/**
 * Encapsulates the complete Liquid Toggle logic (PanResponder, SharedValues, Spring).
 * 
 * @param {Object} params
 * @param {number} params.numOptions - Number of available options (e.g., 2)
 * @param {number} params.tabWidth - Width of a single tab option
 * @param {number} params.initialIndex - Initially selected index
 * @param {function} params.onChange - Callback when selection changes (index) => void
 * @param {SharedValue<number>} [params.containerWidthSV] - Optional: if tabWidth depends on container
 */
import { useRef, useEffect } from 'react';
import { PanResponder } from 'react-native';
import HapticsService from '../services/HapticsService';

export const useLiquidToggle = ({ numOptions, tabWidth, initialIndex = 0, onChange, containerWidthSV }) => {
    const indicatorX = useDerivedValue(() => {
        // Init logic if needed, but usually we manage state below
        return 0; // Placeholder, we typically manage own shared value or pass it in
    });

    // We actually need to manage the state internally or receive existing SharedValues
    // To be truly reusable as a hook "gia fatto", it should create and return the values.

    const x = useSharedValue(initialIndex * tabWidth);
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const scale = useLiquidScale(x, startX, targetX, isDragging);

    // Refs for gesture handling
    const currentIndex = useRef(initialIndex);
    const isGrabbing = useRef(false);
    const gestureStartX = useRef(0);

    // Sync if initialIndex changes externally?
    useEffect(() => {
        if (currentIndex.current !== initialIndex) {
            currentIndex.current = initialIndex;
            const target = initialIndex * tabWidth;
            x.value = withSpring(target, SNAP_SPRING_CONFIG);
        }
    }, [initialIndex, tabWidth]);


    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, state) => {
                const dx = Math.abs(state.dx);
                const dy = Math.abs(state.dy);
                return dx > 10 && dx > dy;
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: () => {
                isGrabbing.current = true;
                isDragging.value = true;
                gestureStartX.current = x.value;
                startX.value = x.value;
                HapticsService.trigger('selection');
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isGrabbing.current) return;
                const maxPos = (numOptions - 1) * tabWidth;

                let newPos = gestureStartX.current + gestureState.dx;
                // Clamp
                newPos = Math.max(0, Math.min(newPos, maxPos));
                x.value = newPos;
            },
            onPanResponderRelease: (_, gestureState) => {
                isGrabbing.current = false;

                // Determine snap target
                // Logic: 50% threshold of tabWidth
                const currentPos = x.value;
                const exactIndex = currentPos / tabWidth;
                let targetIndex = Math.round(exactIndex);

                // Velocity check could be added here

                targetIndex = Math.max(0, Math.min(numOptions - 1, targetIndex));

                const targetPos = targetIndex * tabWidth;

                // Update Anchors
                updateLiquidAnchors(startX, targetX, isDragging, currentPos, targetPos);

                x.value = withSpring(targetPos, SNAP_SPRING_CONFIG);

                if (targetIndex !== currentIndex.current) {
                    currentIndex.current = targetIndex;
                    if (onChange) onChange(targetIndex);
                    HapticsService.trigger('selection');
                }
            }
        })
    ).current;

    return {
        indicatorX: x,
        scale,
        panHandlers: panResponder.panHandlers
    };
};
