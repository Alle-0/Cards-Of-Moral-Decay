import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PremiumPressable from './PremiumPressable';
import { DoorClosedIcon, PeopleIcon } from './Icons';

const RoomItem = ({ roomName, playerCount, state, onJoin, creatorName }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const isWaiting = state === 'LOBBY';
    const baseColor = isWaiting ? '#51cf66' : '#ffd36a'; // Green : Gold
    const badgeBg = isWaiting ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 211, 106, 0.2)';
    const badgeTextStr = isWaiting ? t('room_state_waiting') : t('room_state_playing');

    const displayCode = roomName.replace('Stanza ', '').toUpperCase();

    return (
        <PremiumPressable
            onPress={onJoin}
            scaleDown={0.98}
            style={[
                styles.container,
                { borderColor: baseColor }
            ]}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
            <View style={styles.leftContent}>
                <View style={{ marginRight: 8 }}>
                    <DoorClosedIcon size={28} color="#e69d65" />
                </View>
                <Text style={styles.code}>{displayCode}</Text>
                <View style={{ width: 15 }} />

                <View style={{ marginRight: 5 }}>
                    <PeopleIcon size={20} color="#7a76e3" />
                </View>
                <Text style={styles.playerCount}>{playerCount} • {creatorName}</Text>
            </View>

            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: baseColor }]}>{badgeTextStr}</Text>
            </View>
        </PremiumPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 27, 26, 0.6)',
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 8,
        width: '100%',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    code: {
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        fontSize: 12,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    playerCount: {
        fontFamily: 'Outfit',
        fontSize: 14,
        color: '#ccc',
    },
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontFamily: 'Outfit',
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'none',
    }
});

export default RoomItem;
