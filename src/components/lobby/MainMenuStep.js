import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import PremiumInput from '../PremiumInput';
import PremiumButton from '../PremiumButton';
import RoomListStep from './RoomListStep';
import { useLanguage } from '../../context/LanguageContext';

const MainMenuStep = ({
    theme,
    roomToJoin,
    setRoomToJoin,
    isLoading,
    onBack,
    onCreateRoom,
    onJoinRoom,
    validRooms
}) => {
    const { t } = useLanguage();
    const handleCreate = () => {
        // Now just calls with default/empty, settings are handled in Lobby
        onCreateRoom({});
    };

    return (
        <Animated.View
            entering={SlideInRight.springify().damping(35).stiffness(150)}
            exiting={SlideOutRight.duration(300)}
            style={styles.stepContainer}
        >
            {/* Back Button */}
            <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 0, marginTop: 10 }}>
                <PremiumButton
                    title={t('back_button')}
                    variant="ghost"
                    enableRipple={false}
                    enableSound={false}
                    onPress={onBack}
                    style={{ paddingVertical: 5, justifyContent: 'flex-start', width: 'auto', alignSelf: 'flex-start' }}
                    contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 5 }}
                    textStyle={{ fontSize: 14, color: '#7b7b7bff', fontFamily: 'Cinzel-Bold', textAlign: 'left' }}
                />
            </View>

            {/* Title Section */}
            <View style={{ width: '100%', marginBottom: 30, marginTop: 10 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.accent, fontSize: 26 }]}>{t('room_access_title')}</Text>
                <Text style={[styles.subTitle, { color: '#888', fontFamily: 'Outfit' }]}>
                    {t('room_access_subtitle')}
                </Text>
            </View>


            {/* Code Input */}
            <View style={{ width: '100%', marginBottom: 20 }}>
                <PremiumInput
                    label={t('room_code')}
                    value={roomToJoin}
                    onChangeText={setRoomToJoin}
                    placeholder=""
                    labelBackgroundColor="#0d0d0d"
                />
            </View>

            {/* Action Buttons Row */}
            <View style={{ flexDirection: 'row', width: '100%', marginBottom: 30, gap: 15 }}>
                <PremiumButton
                    title={t('create_room')}
                    variant="outline"
                    onPress={handleCreate}
                    disabled={isLoading}
                    enableSound={false}
                    style={{
                        flex: 1,
                        borderColor: '#333',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        minHeight: 55
                    }}
                    contentContainerStyle={{
                        paddingVertical: 12,
                        paddingHorizontal: 10
                    }}
                    textStyle={{ color: '#aaa', fontSize: 12, fontFamily: 'Cinzel-Bold' }}
                />
                <PremiumButton
                    title={t('join_room')}
                    onPress={() => onJoinRoom(roomToJoin)}
                    disabled={!roomToJoin || isLoading}
                    enableSound={false}
                    style={{
                        flex: 2,
                        backgroundColor: theme.colors.accent,
                        minHeight: 55
                    }}
                    contentContainerStyle={{
                        paddingVertical: 12,
                    }}
                    textStyle={{ color: '#000', fontSize: 20, fontFamily: 'Cinzel-Bold' }}
                />
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, marginTop: 40 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
                <Text style={{ marginHorizontal: 10, color: '#666', fontSize: 12, fontFamily: 'Cinzel-Bold' }}>{t('or_divider')}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
            </View>

            <RoomListStep
                validRooms={validRooms}
                onJoinRoom={onJoinRoom}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 32,
        fontFamily: 'Cinzel-Bold',
        marginBottom: 10,
        textAlign: 'left',
    },
    subTitle: {
        fontSize: 16,
        marginVertical: 5,
        textAlign: 'left'
    }
});

export default MainMenuStep;
