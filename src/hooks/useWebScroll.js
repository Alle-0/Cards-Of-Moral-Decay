import { useRef, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Hook to enable mouse-drag scrolling on Web for a ScrollView.
 * More robust version that retries finding the node and correctly handles cleaning up.
 * Attaches move/up listeners to document to handle drag-out.
 * @param {boolean} horizontal - Whether the scroll is horizontal.
 * @returns {object} - ref to be attached to ScrollView.
 */
export const useWebScroll = (horizontal = false) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        let scrollEl = null;
        let isDown = false;
        let startX;
        let startY;
        let scrollLeft;
        let scrollTop;

        const handleMouseDown = (e) => {
            if (!scrollEl) return;
            isDown = true;
            scrollEl.classList.add('active');
            startX = e.pageX - scrollEl.offsetLeft;
            startY = e.pageY - scrollEl.offsetTop;
            scrollLeft = scrollEl.scrollLeft;
            scrollTop = scrollEl.scrollTop;
            scrollEl.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none'; // Lock globally
        };

        const handleMouseUp = () => {
            isDown = false;
            if (scrollEl) scrollEl.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        const handleMouseMove = (e) => {
            if (!isDown || !scrollEl) return;
            e.preventDefault();

            if (horizontal) {
                const x = e.pageX - scrollEl.offsetLeft;
                const walk = (x - startX) * 2;
                scrollEl.scrollLeft = scrollLeft - walk;
            } else {
                const y = e.pageY - scrollEl.offsetTop;
                const walk = (y - startY) * 2;
                scrollEl.scrollTop = scrollTop - walk;
            }
        };

        const cleanup = () => {
            if (scrollEl) {
                scrollEl.removeEventListener('mousedown', handleMouseDown);
                scrollEl.style.cursor = '';
                scrollEl.style.overflow = '';
            }
            // Cleanup global listeners
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
        };

        const attachListeners = () => {
            const node = scrollRef.current;
            if (!node) return false;

            let el = node;
            if (node.getScrollableNode) {
                el = node.getScrollableNode();
            } else if (node instanceof HTMLElement) {
                el = node;
            }

            if (!el || !el.addEventListener) return false;

            scrollEl = el;

            // Critical
            scrollEl.style.overflow = horizontal ? 'auto hidden' : 'hidden auto';
            scrollEl.style.cursor = 'grab';

            scrollEl.addEventListener('mousedown', handleMouseDown);

            // Attach global listeners for robust drag
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mousemove', handleMouseMove);

            return true;
        };

        // Retry logic
        let retries = 0;
        const attempt = () => {
            if (attachListeners()) return;
            if (retries < 5) {
                retries++;
                setTimeout(attempt, 200);
            }
        };

        attempt();

        return cleanup;
    }, [horizontal]);

    return scrollRef;
};
