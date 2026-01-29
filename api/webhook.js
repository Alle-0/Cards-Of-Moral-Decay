const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://carte-vs-umani-default-rtdb.firebaseio.com"
    });
}

const db = admin.database();

// Vercel needs raw body for Stripe signature verification
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // We get the raw body as a string
        const buf = await getRawBody(req);
        event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, productId, type, username } = session.metadata;

        console.log(`Processing successful payment for user ${username || userId}: ${productId}`);

        try {
            if (type === 'PACK') {
                // Unlock Pack
                await db.ref(`users/${username}/unlockedPacks/${productId}`).set(true);
            } else if (type === 'DC') {
                // Add Dirty Cash (id format: dc_500)
                const amount = parseInt(productId.split('_')[1]);
                await db.ref(`users/${username}/balance`).transaction((currentValue) => {
                    return (currentValue || 0) + amount;
                });
            }
            console.log('Database updated successfully');
        } catch (error) {
            console.error('Error updating database:', error);
            return res.status(500).send('Database update failed');
        }
    }

    res.status(200).json({ received: true });
};

// Helper function to get raw body
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}
