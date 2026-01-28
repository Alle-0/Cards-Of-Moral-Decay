import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import RoomItem from '../RoomItem';
import { useLanguage } from '../../context/LanguageContext';

const RoomListStep = ({ validRooms, onJoinRoom }) => {
    const { t } = useLanguage();

    return (
        <View style={{ width: '100%', flex: 1, marginTop: 20 }}>
            <View style={styles.listContainer}>
                <Text style={styles.listHeader}>{t('open_rooms_title')}</Text>

                <ScrollView
                    style={styles.roomList}
                    contentContainerStyle={{ gap: 8 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                >
                    {validRooms.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {t('no_public_rooms')}
                        </Text>
                    ) : (
                        validRooms.map((room) => (
                            <RoomItem
                                key={room.id}
                                roomName={`${room.id}`}
                                playerCount={Object.keys(room.giocatori || {}).length}
                                state={room.statoPartita === 'LOBBY' ? t('lobby_state') : t('playing_state')}
                                onJoin={() => onJoinRoom(room.id)}
                                joinText={t('join_btn')}
                                creatorName={room.creatore}
                            />
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 8,
        backgroundColor: 'rgba(83, 83, 83, 0.2)',
        minHeight: 80,
        maxHeight: 300 // Limit height
    },
    listHeader: {
        color: '#888',
        fontFamily: 'Cinzel-Bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    roomList: {
        width: '100%',
    },
    emptyText: {
        color: '#555',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'Outfit',
        fontStyle: 'italic'
    }
});

export default RoomListStep;
