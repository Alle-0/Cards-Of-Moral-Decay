import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PremiumPressable from './PremiumPressable';
import { DoorClosedIcon, PeopleIcon } from './Icons';

const RoomItem = memo(({ roomName, playerCount, state, onJoin, creatorName, isOnline }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const isWaiting = state === 'LOBBY';
    const baseColor = isWaiting ? '#51cf66' : '#ffd36a'; // Green : Gold
    const badgeBg = isWaiting ? 'rgba(81, 207, 102, 0.15)' : 'rgba(255, 211, 106, 0.15)';
    const badgeTextStr = isWaiting ? t('room_state_waiting') : t('room_state_playing');

    const displayCode = roomName.replace('Stanza ', '').toUpperCase();

    return (
        <Animated.View entering={ZoomIn.duration(300)}>
            <PremiumPressable
                onPress={onJoin}
                scaleDown={0.97}
                style={[
                    styles.container,
                    {
                        borderColor: 'rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(0,0,0,0.3)'
                    }
                ]}
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <View style={styles.leftContent}>
                    <View style={{ marginRight: 10 }}>
                        <DoorClosedIcon size={18} color="rgba(255,255,255,0.4)" />
                    </View>
                    <Text style={[styles.code, { color: theme.colors.textPrimary }]}>{displayCode}</Text>
                    <View style={{ width: 12 }} />

                    <View style={{ marginRight: 6 }}>
                        <PeopleIcon size={14} color="rgba(255,255,255,0.3)" />
                    </View>
                    <Text style={[styles.playerCount]} numberOfLines={1} ellipsizeMode="tail">
                        {playerCount} • {creatorName}
                    </Text>

                    {/* Online Dot */}
                    {isOnline !== undefined && (
                        <View style={{
                            width: 6, height: 6, borderRadius: 3,
                            backgroundColor: isOnline ? '#4ade80' : '#666',
                            marginLeft: 6
                        }} />
                    )}
                </View>

                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: baseColor }]}>{badgeTextStr}</Text>
                </View>
            </PremiumPressable>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        borderWidth: 1.5,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 6,
        width: '80%',
        alignSelf: 'center',

        // Premium Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    code: {
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    playerCount: {
        fontFamily: 'Outfit',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 4,
    },
    badgeText: {
        fontFamily: 'Outfit',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'none',
    }
});

export default RoomItem;
