// src/services/RevenueCatService.js

// Try to import Purchases, fallback if not available
let Purchases;
try {
    Purchases = require('react-native-purchases').default;
} catch (error) {
    console.warn('[RevenueCatService] RevenueCat SDK not installed');
}

import { Platform } from 'react-native';

class RevenueCatService {
    constructor() {
        this.isInitialized = false;
        this.customerInfo = null;
        this.offerings = null;
    }

    /**
     * Initialize RevenueCat SDK
     * @param {string} userId - Firebase user ID for identification
     */
    async initialize(userId = null) {
        if (!Purchases) {
            console.error('[RevenueCat] SDK not available - packages not installed');
            return;
        }

        if (this.isInitialized) {
            console.log('[RevenueCat] Already initialized');
            return;
        }

        try {
            const apiKey = 'test_jdhXEkWPIDRGGJRwuRPybUEZInw';

            // Configure SDK
            Purchases.configure({ apiKey });

            // Set user ID if provided
            if (userId) {
                await Purchases.logIn(userId);
            }

            // Enable debug logs in development
            if (__DEV__) {
                Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            }

            this.isInitialized = true;
            console.log('[RevenueCat] Initialized successfully');

            // Fetch initial customer info
            await this.refreshCustomerInfo();
        } catch (error) {
            console.error('[RevenueCat] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Refresh customer info from RevenueCat
     */
    async refreshCustomerInfo() {
        try {
            this.customerInfo = await Purchases.getCustomerInfo();
            console.log('[RevenueCat] Customer info refreshed');
            return this.customerInfo;
        } catch (error) {
            console.error('[RevenueCat] Failed to refresh customer info:', error);
            throw error;
        }
    }

    /**
     * Check if user has Pro entitlement
     * @returns {boolean}
     */
    hasProAccess() {
        if (!Purchases || !this.customerInfo) {
            return false;
        }

        const entitlementId = 'Cards Of Moral Decay Pro';
        const entitlement = this.customerInfo.entitlements.active[entitlementId];

        return entitlement !== undefined && entitlement.isActive;
    }

    /**
     * Get current offerings
     */
    async getOfferings() {
        try {
            this.offerings = await Purchases.getOfferings();
            console.log('[RevenueCat] Offerings fetched:', this.offerings);
            return this.offerings;
        } catch (error) {
            console.error('[RevenueCat] Failed to fetch offerings:', error);
            throw error;
        }
    }

    /**
     * Purchase a product
     * @param {Object} packageToPurchase - RevenueCat package object
     */
    async purchasePackage(packageToPurchase) {
        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            this.customerInfo = customerInfo;

            console.log('[RevenueCat] Purchase successful');
            return {
                success: true,
                customerInfo,
                hasProAccess: this.hasProAccess()
            };
        } catch (error) {
            if (error.userCancelled) {
                console.log('[RevenueCat] Purchase cancelled by user');
                return { success: false, cancelled: true };
            }

            console.error('[RevenueCat] Purchase failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Restore purchases
     */
    async restorePurchases() {
        try {
            this.customerInfo = await Purchases.restorePurchases();
            console.log('[RevenueCat] Purchases restored');

            return {
                success: true,
                hasProAccess: this.hasProAccess()
            };
        } catch (error) {
            console.error('[RevenueCat] Restore failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Set user ID (for login)
     * @param {string} userId - Firebase user ID
     */
    async setUserId(userId) {
        try {
            const { customerInfo } = await Purchases.logIn(userId);
            this.customerInfo = customerInfo;
            console.log('[RevenueCat] User logged in:', userId);
            return customerInfo;
        } catch (error) {
            console.error('[RevenueCat] Login failed:', error);
            throw error;
        }
    }

    /**
     * Clear user ID (for logout)
     */
    async clearUserId() {
        try {
            const { customerInfo } = await Purchases.logOut();
            this.customerInfo = customerInfo;
            console.log('[RevenueCat] User logged out');
            return customerInfo;
        } catch (error) {
            console.error('[RevenueCat] Logout failed:', error);
            throw error;
        }
    }

    /**
     * Add listener for customer info updates
     * @param {Function} callback - Callback function
     */
    addCustomerInfoUpdateListener(callback) {
        return Purchases.addCustomerInfoUpdateListener((info) => {
            this.customerInfo = info;
            callback(info);
        });
    }
}

// Export singleton instance
export default new RevenueCatService();
