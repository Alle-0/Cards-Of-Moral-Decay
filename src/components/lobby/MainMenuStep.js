import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Animated, {
    SlideInRight,
    SlideOutRight,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import RoomListStep from './RoomListStep';
import PremiumInput from '../PremiumInput';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const MainMenuStep = ({
    theme,
    roomToJoin,
    setRoomToJoin,
    isLoading,
    onBack,
    onCreateRoom,
    onJoinRoom,
    onQuickJoin,
    friendsRooms,
    publicRooms,
    scrollEnabled = true
}) => {
    const { t } = useLanguage();
    const [showJoinInput, setShowJoinInput] = useState(false);

    // [NEW] Manual Height Animation for reliability on Web
    const heightSV = useSharedValue(0);
    const opacitySV = useSharedValue(0);
    const translateSV = useSharedValue(500); // Start off-screen to the right

    useEffect(() => {
        if (showJoinInput) {
            heightSV.value = withSpring(75, { damping: 40, stiffness: 300 });
            opacitySV.value = withSpring(1, { damping: 40, stiffness: 300 });
            translateSV.value = withSpring(0, { damping: 40, stiffness: 300 });
        } else {
            heightSV.value = withSpring(0, { damping: 40, stiffness: 300 });
            opacitySV.value = withSpring(0, { damping: 40, stiffness: 300 });
            translateSV.value = withSpring(500, { damping: 40, stiffness: 300 }); // Slide out to right
        }
    }, [showJoinInput]);

    const animatedWrapperStyle = useAnimatedStyle(() => ({
        height: heightSV.value,
        opacity: opacitySV.value,
        overflow: 'hidden'
    }));

    const animatedInnerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateSV.value }]
    }));

    return (
        <Animated.View
            entering={SlideInRight.springify().damping(35).stiffness(150)}
            exiting={SlideOutRight.duration(300)}
            style={styles.stepContainer}
        >
            <View style={styles.contentWrapper}>
                {/* BACK BUTTON */}
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{t('back_button')}</Text>
                </TouchableOpacity>

                {/* MAIN CARD CONTAINER */}
                <Animated.View
                    style={[styles.cardContainer, { borderColor: theme.colors.cardBorder, overflow: 'visible' }]}
                >

                    {/* QUICK JOIN SECTION */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.quickJoinButton, { backgroundColor: theme.colors.accent }]}
                            onPress={onQuickJoin}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            <Text style={styles.quickJoinText}>{t('quick_join_btn')}</Text>
                            <Text style={styles.quickJoinSubtext}>{t('quick_join_subtitle')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CREATE / JOIN BUTTONS */}
                    <View style={styles.section}>
                        <View style={styles.actionRow}>
                            {/* CREATE BUTTON */}
                            <TouchableOpacity
                                style={[
                                    styles.actionCard,
                                    {
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        backgroundColor: 'rgba(0,0,0,0.3)'
                                    }
                                ]}
                                onPress={() => onCreateRoom({})}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.actionCardText}>{t('create_room')}</Text>
                            </TouchableOpacity>

                            {/* JOIN BUTTON */}
                            <TouchableOpacity
                                style={[
                                    styles.actionCard,
                                    {
                                        borderColor: showJoinInput ? theme.colors.accent : 'rgba(255,255,255,0.1)',
                                        backgroundColor: showJoinInput ? theme.colors.accent : 'rgba(0,0,0,0.3)'
                                    }
                                ]}
                                onPress={() => setShowJoinInput(!showJoinInput)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.actionCardText,
                                    showJoinInput && { color: '#000' }
                                ]}>
                                    {t('insert_code')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* JOIN CODE INPUT - ANIMATED HEIGHT CONTAINER */}
                    {/* Always Render but Animate Visibility */}
                    <Animated.View style={animatedWrapperStyle}>
                        <Animated.View style={[styles.codeSection, animatedInnerStyle]}>
                            <View style={styles.codeInputRow}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <PremiumInput
                                        label={t('room_code')}
                                        value={roomToJoin}
                                        onChangeText={(text) => setRoomToJoin(text.toUpperCase())}
                                        maxLength={6}
                                        autoCapitalize="characters"
                                        labelBackgroundColor="#0d0d0d"
                                        style={{ marginVertical: 0, height: 50 }}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.goButton, { backgroundColor: theme.colors.accent }]}
                                    onPress={() => onJoinRoom(roomToJoin)}
                                    disabled={!roomToJoin || isLoading}
                                >
                                    <Text style={styles.goButtonText}>GO</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
            </View>

            {/* ROOM LISTS - NOW WRAPS EVERYTHING */}
            <RoomListStep
                friendsRooms={friendsRooms}
                publicRooms={publicRooms}
                onJoinRoom={onJoinRoom}
                scrollEnabled={scrollEnabled}
            />

        </Animated.View >
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        width: '100%',
        // flex: 1 removed to allow adaptive height
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 10,
        marginBottom: 15,
        paddingHorizontal: 5
    },
    backButtonText: {
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        letterSpacing: 0.5
    },

    // CARD CONTAINER (Matching LobbySettingsPanel)
    cardContainer: {
        borderRadius: 24,
        padding: 20,
        width: '94%',
        alignSelf: 'center',
        marginBottom: 10,
        overflow: 'hidden'
    },

    // SECTIONS
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },

    // QUICK JOIN
    quickJoinButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    quickJoinText: {
        color: '#000',
        fontSize: 18,
        fontFamily: 'Cinzel-Bold',
        letterSpacing: 1.5,
    },
    quickJoinSubtext: {
        color: 'rgba(0,0,0,0.6)',
        fontSize: 9,
        fontFamily: 'Outfit-Bold',
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    // ACTION ROW
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionCardText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Cinzel-Bold',
        fontSize: 13,
        letterSpacing: 0.5,
        textAlign: 'center' // [FIX] Ensure text centers when wrapping
    },

    // CODE INPUT
    codeSection: {
        marginTop: 15,
        marginBottom: 10,
    },
    codeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 50,
    },
    codeInput: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 10,
        textAlign: 'center',
        fontFamily: 'Cinzel-Bold',
        fontSize: 10,
        letterSpacing: 1
    },
    goButton: {
        height: 50,
        width: 70,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    goButtonText: {
        color: '#000',
        fontFamily: 'Cinzel-Bold',
        fontSize: 16,
        letterSpacing: 2,
    },

    // LIST CONTAINER
    contentWrapper: {
        width: '100%',
    }
});

export default MainMenuStep;
