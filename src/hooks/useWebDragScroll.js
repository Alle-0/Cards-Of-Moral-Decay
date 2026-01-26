import { useRef } from 'react';
import { PanResponder, Platform } from 'react-native';

export const useWebDragScroll = (horizontal = false) => {
    const scrollRef = useRef(null);
    const lastPos = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => Platform.OS === 'web',
            onStartShouldSetPanResponderCapture: () => Platform.OS === 'web',
            onMoveShouldSetPanResponder: () => Platform.OS === 'web',
            onMoveShouldSetPanResponderCapture: () => Platform.OS === 'web',

            onPanResponderGrant: (evt, gestureState) => {
                if (Platform.OS !== 'web') return;
                lastPos.current = horizontal ? gestureState.x0 : gestureState.y0;
                if (document.body) {
                    document.body.style.cursor = 'grabbing';
                    document.body.style.userSelect = 'none';
                }
            },

            onPanResponderMove: (evt, gestureState) => {
                if (Platform.OS !== 'web' || !scrollRef.current) return;

                const node = scrollRef.current.getScrollableNode?.() || scrollRef.current;

                // If it's not a DOM node with scrollLeft/Top, we can't scroll it directly like this on Web
                if (!node || typeof node.scrollLeft === 'undefined') return;

                const currentPos = horizontal ? gestureState.moveX : gestureState.moveY;
                const delta = lastPos.current - currentPos;

                if (horizontal) {
                    node.scrollLeft += delta;
                } else {
                    node.scrollTop += delta;
                }

                lastPos.current = currentPos;
            },

            onPanResponderRelease: () => {
                if (Platform.OS !== 'web') return;
                if (document.body) {
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            },
            onPanResponderTerminate: () => {
                if (Platform.OS !== 'web') return;
                if (document.body) {
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            },
        })
    ).current;

    return {
        scrollRef, // Stick this to the ScrollView
        panHandlers: panResponder.panHandlers // Stick this to the ScrollView (or wrapper)
    };
};
