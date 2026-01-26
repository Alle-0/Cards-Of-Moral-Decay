import * as Haptics from 'expo-haptics';

class HapticsService {
    constructor() {
        this.enabled = true;
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
