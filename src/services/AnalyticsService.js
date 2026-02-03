import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from './firebase';

/**
 * AnalyticsService
 * Standardized wrapper for Firebase Analytics events.
 */
const eventQueue = [];

const AnalyticsService = {
    /**
     * Set the global User ID for all subsequent events.
     * @param {string} userId - The unique identifier for the user (e.g. username).
     */
    identifyUser: (userId) => {
        if (!analytics) return;
        try {
            setUserId(analytics, userId);
            if (__DEV__) console.log(`[Analytics] User identified: ${userId}`);
        } catch (error) {
            console.warn('[Analytics] Error setting User ID:', error);
        }
    },

    /**
     * Set custom user properties (dimensions).
     * @param {Object} properties - Key-value pairs of properties.
     */
    setUserProperties: (properties) => {
        if (!analytics) return;
        try {
            setUserProperties(analytics, properties);
            if (__DEV__) console.log('[Analytics] User properties set:', properties);
        } catch (error) {
            console.warn('[Analytics] Error setting User properties:', error);
        }
    },

    log: (eventName, params = {}) => {
        if (!analytics) {
            if (__DEV__) {
                console.log(`[Analytics] Analytics not ready, queuing event: ${eventName}`, params);
            }
            eventQueue.push({ eventName, params });
            return;
        }

        try {
            // Process queue first if any
            while (eventQueue.length > 0) {
                const { eventName: qName, params: qParams } = eventQueue.shift();
                logEvent(analytics, qName, {
                    ...qParams,
                    queued: true,
                    timestamp: new Date().toISOString()
                });
            }

            // Flatten params and ensure they are compatible with Firebase
            const cleanParams = {
                ...params,
                timestamp: new Date().toISOString(),
                platform: typeof window !== 'undefined' ? 'web' : 'native'
            };

            logEvent(analytics, eventName, cleanParams);

            // Console log for debug (will be stripped in prod if needed, or left for easier debugging)
            if (__DEV__) {
                console.log(`[Analytics] ${eventName}:`, cleanParams);
            }
        } catch (error) {
            console.warn('[Analytics] Error logging event:', error);
        }
    },

    // --- Predefined Events ---

    logGameStart: (roomCode, playerCount, pointsToWin) => {
        AnalyticsService.log('game_start', {
            room_code: roomCode,
            player_count: playerCount,
            points_to_win: pointsToWin
        });
    },

    logGameWin: (playerName, points) => {
        AnalyticsService.log('game_win', {
            winner_name: playerName,
            winner_points: points
        });
    },

    logBribeUsed: (playerName, cost) => {
        AnalyticsService.log('bribe_used', {
            player_name: playerName,
            cost: cost
        });
    },

    logJokerUsed: (playerName) => {
        AnalyticsService.log('joker_used', {
            player_name: playerName
        });
    },

    logPurchase: (itemName, price, currency = 'COINS') => {
        AnalyticsService.log('item_purchase', {
            item_id: itemName,
            price: price,
            currency: currency
        });
    },

    logDonation: (fromPlayer, amount) => {
        AnalyticsService.log('coins_donated', {
            from: fromPlayer,
            amount: amount
        });
    },

    logDonationIntent: (playerName) => {
        AnalyticsService.log('donation_intent', {
            player_name: playerName
        });
    }
};

export default AnalyticsService;
