import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
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
    scrollEnabled = true,
    onHeightChange // [NEW]
}) => {
    const { t } = useLanguage();
    const [showJoinInput, setShowJoinInput] = useState(false);
    const contentRef = useRef(null);
    const lastBaseHeight = useRef(200); // Baseline placeholder
    const isToggling = useRef(false);

    // [FIX] Stable height reporting without loops
    const reportHeight = (predictedDelta = 0) => {
        if (contentRef.current && !isToggling.current) {
            contentRef.current.measure((x, y, width, height) => {
                if (height > 0) {
                    lastBaseHeight.current = height;
                    onHeightChange?.(height + predictedDelta + 40);
                }
            });
        }
    };

    const toggleJoinInput = () => {
        isToggling.current = true;
        const nextState = !showJoinInput;
        setShowJoinInput(nextState);

        const curve = Easing.bezier(0.33, 1, 0.68, 1);

        // Immediate report with prediction to sync with parent
        onHeightChange?.(lastBaseHeight.current + (nextState ? 75 : -75) + 40);

        // After animation finishes, allow measurements again and sync final
        setTimeout(() => {
            isToggling.current = false;
            reportHeight();
        }, 350);
    };

    useEffect(() => {
        // Only report height when rooms change, but not during a toggle
        if (!isToggling.current) {
            reportHeight();
        }
    }, [publicRooms, friendsRooms, onHeightChange]);

    // [NEW] Shared Value for Code Pulse (Static as per user request)
    const heightSV = useSharedValue(0);
    const opacitySV = useSharedValue(0);
    const translateSV = useSharedValue(50); // [FIX] Reduced from 500 to 50 for snappier entrance

    useEffect(() => {
        const curve = Easing.bezier(0.33, 1, 0.68, 1);
        if (showJoinInput) {
            heightSV.value = withTiming(75, { duration: 300, easing: curve });
            opacitySV.value = withTiming(1, { duration: 250, easing: curve });
            // translateSV.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }); // Removed as per instruction
        } else {
            heightSV.value = withTiming(0, { duration: 300, easing: curve });
            opacitySV.value = withTiming(0, { duration: 200, easing: curve });
            // translateSV.value = withTiming(50, { duration: 200, easing: Easing.in(Easing.cubic) }); // Removed as per instruction
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
        <View
            style={styles.stepContainer}
        >
            <View
                ref={contentRef}
                style={{ width: '100%' }}
            >
                <View
                    style={styles.contentWrapper}
                >
                    {/* BACK BUTTON */}
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>{t('back_button')}</Text>
                    </TouchableOpacity>

                    {/* MAIN CARD CONTAINER */}
                    <Animated.View
                        style={[styles.cardContainer, { borderColor: theme.colors.cardBorder }]}
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
                                    onPress={toggleJoinInput}
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
                    isLoading={isLoading}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        width: '100%',
        paddingBottom: 24, // [FIX] Consistent spacing
        alignSelf: 'flex-start', // [FIX] Prevent vertical stretching
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
        paddingHorizontal: 20, // [FIX] Restore padding removed from parent
    }
});

export default MainMenuStep;
