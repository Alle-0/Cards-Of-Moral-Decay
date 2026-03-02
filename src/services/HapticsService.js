import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

class HapticsService {
    constructor() {
        // Default to false until we know — prevents spurious vibrations on cold start
        this.enabled = false;
        this._initialized = false;

        // Self-initialize from persisted user preference immediately
        AsyncStorage.getItem('cah_haptics').then(val => {
            // If never set, default to true; if explicitly 'false', disable
            this.enabled = val !== 'false';
            this._initialized = true;
        }).catch(() => {
            this.enabled = true;
            this._initialized = true;
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    trigger(type = 'light') {
        if (!this.enabled) return;

        switch (type) {
            case 'selection':
                Haptics.selectionAsync();
                break;
            case 'light':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'medium':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
            case 'heavy':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
            case 'success':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'warning':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                break;
            case 'error':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
            default:
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }
}

export default new HapticsService();
