import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification handler only if NOT in Expo Go (or wrap in try-catch if module allows)
if (!isExpoGo) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (e) {
        console.warn("Error setting notification handler:", e);
    }
}

// [NEW] Send Push Notification (Client-Side Trigger)
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
    // [WEB] Use Vercel Backend Proxy to avoid CORS errors and hide keys
    if (Platform.OS === 'web') {
        try {
            // [WEB] Use External Vercel Backend for Push Notifications
            const apiUrl = 'https://cards-of-moral-decay-backend.vercel.app/api/send-push';

            if (__DEV__) {
                const tokenSnippet = typeof expoPushToken === 'string'
                    ? expoPushToken.substring(0, 15)
                    : "NativeObject";
                console.log("[PUSH] Target Token Snippet:", tokenSnippet);
                console.log("[PUSH] apiUrl:", apiUrl);
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pushToken: expoPushToken,
                    title,
                    body,
                    data: data || {}
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("[PUSH] Backend Error (Status):", response.status);
                console.error("[PUSH] Backend Error Body:", text);
                throw new Error(`HTTP error! status: ${response.status}, body: ${text.substring(0, 100)}...`);
            }

            const result = await response.json();
            console.log("[PUSH] Sent via Vercel Backend Success:", result);
            return;
        } catch (error) {
            console.error("[PUSH] Backend Error:", error);
            // Fallback to client-side if backend fails (optional, but good for robustness)
            console.log("[PUSH] Falling back to client-side send...");
        }
    }


    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        try {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
        } catch (e) {
            console.warn("[PUSH] Error sending notification:", e);
        }
        // console.log("[PUSH] Sent successfully to", expoPushToken);
    } catch (error) {
        console.error("[PUSH] Error sending notification:", error);
    }
};

async function registerForPushNotificationsAsync(vapidKey = 'BMcF2h_kIAUPpErVAh-PWLUjSCupQB31njN8pWlrs__jER2Z1womE3DQjkScH5UuuDAWAmRjm2jzoVB2_Lo6-5eo') {
    if (isExpoGo && Platform.OS !== 'web') {
        console.log("Push Notifications are not fully supported in Expo Go (simulators).");
        // return null; // [DEV] Commented out to allow testing logic flow if needed, but usually returns null
    }

    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice || Platform.OS === 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        console.log(`[PUSH] Current permission status: ${existingStatus}`);

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log(`[PUSH] Requested permission status: ${status}`);
        }

        if (finalStatus !== 'granted') {
            console.warn('[PUSH] Permission NOT granted for push notifications.');
            return;
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
                Constants.easConfig?.projectId ||
                "8c868844-d7e8-47a3-9017-197534e8f07e";

            const slug = Constants.expoConfig?.slug || "cards-of-moral-decay";
            const owner = Constants.expoConfig?.owner || "alle-0";
            const experienceId = `@${owner}/${slug}`;

            console.log(`[PUSH] Using ProjectID: ${projectId}`);

            // Strategy 1: ProjectID + ExperienceID (Recommended for Web)
            let options = {
                projectId,
            };

            if (Platform.OS === 'web') {
                options.vapidPublicKey = vapidKey;
                options.applicationId = experienceId;
            }

            console.log("[PUSH] Attempting Registration (Strategy 1)...");
            try {
                const tokenResponse = await Notifications.getExpoPushTokenAsync(options);
                token = tokenResponse.data;
                console.log("[PUSH] Success! Expo Push Token (S1):", token);
            } catch (s1Error) {
                console.warn("[PUSH] Strategy 1 failed (likely CORS):", s1Error.message);

                // Strategy 2: ProjectID as ApplicationID (Fallback)
                console.log("[PUSH] Attempting Registration (Strategy 2)...");
                try {
                    options.applicationId = projectId;
                    const tokenResponse = await Notifications.getExpoPushTokenAsync(options);
                    token = tokenResponse.data;
                    console.log("[PUSH] Success! Expo Push Token (S2):", token);
                } catch (s2Error) {
                    console.warn("[PUSH] Strategy 2 failed. Falling back to Native Browser Token.");

                    // Strategy 3: NATIVE FALLBACK (Crucial for bypass CORS)
                    try {
                        const deviceToken = await Notifications.getDevicePushTokenAsync();
                        token = deviceToken; // This is an object: { type, data }
                        console.log("[PUSH] Using Native Browser Token (Success):", JSON.stringify(token));
                    } catch (deviceError) {
                        console.error("[PUSH] All registration strategies failed.", deviceError);
                    }
                }
            }
        } catch (e) {
            console.error("[PUSH] Unexpected error in registration logic:", e);
        }
    } else {
        console.log('[PUSH] Must use physical device or Web for Push Notifications');
    }

    return token;
}

const NotificationService = {
    registerForPushNotificationsAsync,
    sendPushNotification, // [NEW] Exported
    Notifications: isExpoGo ? {
        addNotificationReceivedListener: () => ({ remove: () => { } }),
        addNotificationResponseReceivedListener: () => ({ remove: () => { } }),
        removeNotificationSubscription: () => { },
        setNotificationHandler: () => { },
    } : Notifications,
    // [NEW] Quick Test Function (Fixed for Web)
    testNotification: async () => {
        try {
            // 1. Get Token (Should be cached/fast)
            const token = await registerForPushNotificationsAsync();

            if (token) {
                // 2. Send Real Push to Self
                await sendPushNotification(
                    token,
                    "Test Notifica Push",
                    "Se leggi questo, il sistema Push funziona correttamante!",
                    { type: 'TEST' }
                );
                alert("Notifica inviata! Controlla la barra delle notifiche.");
            } else {
                alert("Impossibile ottenere il token per il test.");
            }
        } catch (e) {
            console.error("Test Notification Error:", e);
            alert("Errore nel test: " + e.message);
        }
    }
};

export default NotificationService;
