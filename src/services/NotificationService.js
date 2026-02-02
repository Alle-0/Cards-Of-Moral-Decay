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

async function registerForPushNotificationsAsync() {
    if (isExpoGo) {
        console.log("Push Notifications are not supported in Expo Go SDK 53+.");
        return null;
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

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            // alert('Failed to get push token for push notification!');
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token within the context of the project ID
        try {
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig.extra?.eas?.projectId,
            })).data;
            console.log("Expo Push Token:", token);
        } catch (e) {
            console.error("Error getting Expo push token:", e);
        }
    } else {
        // alert('Must use physical device for Push Notifications');
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

const NotificationService = {
    registerForPushNotificationsAsync,
    Notifications: isExpoGo ? {
        addNotificationReceivedListener: () => ({ remove: () => { } }),
        addNotificationResponseReceivedListener: () => ({ remove: () => { } }),
        removeNotificationSubscription: () => { }, // Keep for safety
        setNotificationHandler: () => { },
    } : Notifications,
};

export default NotificationService;
