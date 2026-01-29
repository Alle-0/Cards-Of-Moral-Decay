import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const API_URL = "https://cards-of-moral-decay-backend.vercel.app";

export const useStripePayment = () => {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const buyItem = async (itemType) => {
        if (!user || isProcessing) return;

        try {
            setIsProcessing(true);
            const returnUrl = window.location.origin;

            const response = await fetch(`${API_URL}/api/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemType,
                    userId: user.uid,
                    username: user.username,
                    platform: 'web',
                    returnUrl
                }),
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
                return null; // The app will reload, so no need to return success/fail here immediately
            } else {
                throw new Error("No payment URL returned");
            }
        } catch (e) {
            console.error('[Stripe Web] Error:', e);
            return { success: false, error: e.message };
        } finally {
            setIsProcessing(false);
        }
    };

    return { buyItem, isProcessing };
};
