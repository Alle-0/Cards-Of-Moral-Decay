import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

// ⚠️ METTI IL TUO LINK VERCEL QUI (senza slash finale)
const API_URL = "https://cards-of-moral-decay-backend.vercel.app";

export const useStripePayment = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { user, buyPack, awardMoney } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const buyItem = async (itemType) => {
        if (!user || isProcessing) return;

        try {
            setIsProcessing(true);

            // 1. Chiedi al server il permesso di pagare
            const response = await fetch(`${API_URL}/api/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemType,
                    userId: user.uid,
                    username: user.username
                }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonError) {
                console.error("[Stripe] Failed to parse JSON:", text);
                throw new Error("Risposta Server Non Valida: " + text.substring(0, 50));
            }

            if (!response.ok) throw new Error(data.error || "Errore Server");

            // 2. Inizializza il foglio di pagamento
            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: data.paymentIntent,
                customerId: data.customer,
                customerEphemeralKeySecret: data.ephemeralKey,
                merchantDisplayName: 'Cards of Moral Decay',
                returnURL: 'cardsofmoraldecay://stripe-redirect', // Richiesto per PayPal
                appearance: {
                    colors: {
                        primary: '#d4af37',
                    }
                }
            });

            if (initError) throw new Error(initError.message);

            // 3. Apri Stripe
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code !== 'Canceled') {
                    Alert.alert("Errore", paymentError.message);
                }
            } else {
                // 4. PAGAMENTO RIUSCITO! Sblocca il contenuto
                if (itemType === 'dark_pack') {
                    await buyPack('dark', 0);
                    return { success: true, type: 'dark_pack' };
                } else if (itemType.startsWith('dc_')) {
                    const amount = parseInt(itemType.split('_')[1]);
                    await awardMoney(amount);
                    return { success: true, type: 'dc', amount };
                }
            }
        } catch (e) {
            console.error('[Stripe] Error:', e);
            return { success: false, error: e.message };
        } finally {
            setIsProcessing(false);
        }
    };

    return { buyItem, isProcessing };
};
