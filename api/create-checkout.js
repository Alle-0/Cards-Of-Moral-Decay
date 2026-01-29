const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId, productId, amount, productName, username } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'Missing userId or productId' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName || 'Cards of Moral Decay Item',
                            description: `Purchasing for user: ${username || userId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Metadata is CRITICAL - this is what we use in webhooks to know what to unlock
            metadata: {
                userId,
                username,
                productId,
                type: productId.startsWith('dc_') ? 'DC' : 'PACK'
            },
            success_url: `https://cardsofmoraldecay.vercel.app/success`, // You can change this
            cancel_url: `https://cardsofmoraldecay.vercel.app/cancel`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ error: error.message });
    }
};
