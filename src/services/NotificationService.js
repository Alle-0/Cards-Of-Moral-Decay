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
async function sendPushNotification(expoPushToken, title, body, data = {}) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

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
        // console.log("[PUSH] Sent successfully to", expoPushToken);
    } catch (error) {
        console.error("[PUSH] Error sending notification:", error);
    }
}

async function registerForPushNotificationsAsync(vapidKey = 'BHtpaAjLI_hZZ5_rBCGfNYNptI--WlJuxoHvn3KqKovN_E7ivp2jT7_vfE4RsIgHl940yiUgYSXNeXCmjN2i08A') {
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
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            alert("Permesso Notifiche NON concesso! Controlla l'icona del lucchetto nel browser.");
            return;
        }

        try {
            // [WEB] VAPID Key required for Web Push
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.slug || "8c868844-d7e8-47a3-9017-197534e8f07e";
            // console.log("Project ID:", projectId);

            const options = {
                projectId,
                applicationId: projectId, // [WEB-FIX] Required if Application.applicationId is null
            };
            if (Platform.OS === 'web' && vapidKey) {
                options.vapidPublicKey = vapidKey;
            }

            token = (await Notifications.getExpoPushTokenAsync(options)).data;
            console.log("Expo Push Token:", token);
        } catch (e) {
            console.error("Error getting Expo push token:", e);
            alert("Errore Token: " + e.message); // [DEBUG] Show user
        }
    } else {
        console.log('Must use physical device for Push Notifications');
        alert("Must use physical device for Push Notifications"); // [DEBUG]
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
