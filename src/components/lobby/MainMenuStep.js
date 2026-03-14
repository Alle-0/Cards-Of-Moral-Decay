import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import PremiumPressable from '../PremiumPressable';
import Animated, {
    SlideInRight,
    SlideOutRight,
    LinearTransition,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
    interpolate
} from 'react-native-reanimated';
import RoomListStep from './RoomListStep';
import PremiumInput from '../PremiumInput';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { EditIcon } from '../Icons';
import { TutorialRegistry } from '../../utils/TutorialRegistry';

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
    currentTab,
    setCurrentTab,
    scrollEnabled = true,
    showJoinInput, // [NEW] Lifted Prop
    setShowJoinInput // [NEW] Lifted Prop
}) => {
    const { t } = useLanguage();
    // const [showJoinInput, setShowJoinInput] = useState(false); // [REMOVED]

    useEffect(() => {
        // [EMPTY] Logic cleared
    }, []);

    const toggleJoinInput = () => {
        setShowJoinInput(prev => !prev);
    };

    // [NEW] Shared Value for Code Pulse (Static as per user request)
    const heightSV = useSharedValue(0);
    const opacitySV = useSharedValue(0);
    const translateSV = useSharedValue(50); // [FIX] Reduced from 500 to 50 for snappier entrance

    useEffect(() => {
        const curve = Easing.bezier(0.33, 1, 0.68, 1);
        if (showJoinInput) {
            heightSV.value = withTiming(75, { duration: 300, easing: curve });
            opacitySV.value = withTiming(1, { duration: 250, easing: curve });
        } else {
            heightSV.value = withTiming(0, { duration: 300, easing: curve });
            opacitySV.value = withTiming(0, { duration: 200, easing: curve });
        }
    }, [showJoinInput]);

    const animatedWrapperStyle = useAnimatedStyle(() => ({
        height: heightSV.value,
        opacity: opacitySV.value,
        overflow: 'hidden',
    }));

    const animatedInnerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(opacitySV.value, [0, 1], [-10, 0]) }]
    }));

    return (
        <View style={styles.stepContainer}>
            <View style={{ width: '100%', flex: 1 }}>
                <View style={styles.contentWrapper}>
                    {/* PROFILE EDIT BUTTON */}
                    <PremiumPressable 
                        onPress={onBack} 
                        style={styles.backButton}
                        overflow="visible"
                    >
                        <View style={styles.backButtonInner}>
                            <EditIcon size={18} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.backButtonText}>{t('edit_profile')}</Text>
                        </View>
                    </PremiumPressable>

                    {/* MAIN CARD CONTAINER */}
                    <Animated.View
                        style={[styles.cardContainer, { borderColor: theme.colors.cardBorder }]}
                    >

                        {/* QUICK JOIN SECTION */}
                        <View
                            style={styles.section}
                            ref={ref => TutorialRegistry.register('quickjoin', ref)}
                            collapsable={false}
                        >
                            <PremiumPressable
                                style={[styles.quickJoinButton, { backgroundColor: theme.colors.accent }]}
                                contentContainerStyle={{ alignItems: 'center', paddingVertical: 18 }}
                                onPress={onQuickJoin}
                                disabled={isLoading}
                                overflow="visible"
                            >
                                <Text style={styles.quickJoinText}>{t('quick_join_btn')}</Text>
                                <Text style={styles.quickJoinSubtext}>{t('quick_join_subtitle')}</Text>
                            </PremiumPressable>
                        </View>

                        {/* CREATE / JOIN BUTTONS */}
                        <View
                            style={styles.section}
                            ref={ref => TutorialRegistry.register('create_code', ref)}
                            collapsable={false}
                        >
                            <View style={styles.actionRow}>
                                {/* CREATE BUTTON */}
                                <PremiumPressable
                                    style={[
                                        styles.actionCard,
                                        {
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            backgroundColor: 'rgba(0,0,0,0.3)'
                                        }
                                    ]}
                                    contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center' }}
                                    onPress={() => onCreateRoom({})}
                                    disabled={isLoading}
                                    overflow="visible"
                                >
                                    <Text style={styles.actionCardText}>{t('create_room')}</Text>
                                </PremiumPressable>

                                {/* JOIN BUTTON */}
                                <PremiumPressable
                                    style={[
                                        styles.actionCard,
                                        {
                                            borderColor: showJoinInput ? theme.colors.accent : 'rgba(255,255,255,0.1)',
                                            backgroundColor: showJoinInput ? theme.colors.accent : 'rgba(0,0,0,0.3)'
                                        }
                                    ]}
                                    contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center' }}
                                    onPress={toggleJoinInput}
                                    overflow="visible"
                                >
                                    <Text style={[
                                        styles.actionCardText,
                                        showJoinInput && { color: '#000' }
                                    ]}>
                                        {t('insert_code')}
                                    </Text>
                                </PremiumPressable>
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
                                    <PremiumPressable
                                        style={[styles.goButton, { backgroundColor: theme.colors.accent }]}
                                        contentContainerStyle={{ height: 50, width: 70, alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => onJoinRoom(roomToJoin)}
                                        disabled={!roomToJoin || isLoading}
                                        overflow="visible"
                                    >
                                        <Text style={styles.goButtonText}>GO</Text>
                                    </PremiumPressable>
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </Animated.View>
                </View>

                {/* ROOM LISTS - NOW WRAPS EVERYTHING */}
                <View
                    style={{ flex: 1, width: '100%', minHeight: 0 }}
                    ref={ref => TutorialRegistry.register('rooms', ref)}
                    collapsable={false}
                >
                    <RoomListStep
                        friendsRooms={friendsRooms}
                        publicRooms={publicRooms}
                        onJoinRoom={onJoinRoom}
                        scrollEnabled={true}
                        isLoading={isLoading}
                        currentTab={currentTab}
                        setCurrentTab={setCurrentTab}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        flex: 1,
        width: '100%',
        paddingBottom: 0,
        alignSelf: 'stretch',
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        marginTop: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    backButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    backButtonText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Cinzel-Bold',
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase'
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
        borderRadius: 16,
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
        borderRadius: 14,
        borderWidth: 1.5,
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
        borderRadius: 18,
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
        paddingHorizontal: 20, // [FIX] Restore padding removed from parent
    }
});

export default MainMenuStep;
