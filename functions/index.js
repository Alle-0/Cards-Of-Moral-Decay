const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

admin.initializeApp();

const expo = new Expo();

/**
 * Send Push Notification via Expo
 * Callable Function
 * @param {object} data - { pushToken, title, body, data }
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
    // Optional: Check authentication
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    const { pushToken, title, body, data: messageData } = data;

    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        throw new functions.https.HttpsError('invalid-argument', 'Invalid Expo push token');
    }

    const messages = [{
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: messageData || {},
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error(error);
                // Continue with other chunks
            }
        }

        return { success: true, tickets };
    } catch (error) {
        console.error(error);
        throw new functions.https.HttpsError('internal', 'Error sending notification', error);
    }
});
