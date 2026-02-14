import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, Platform, PanResponder, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, interpolate } from 'react-native-reanimated';
import PremiumModal from './PremiumModal';
import PremiumPressable from './PremiumPressable';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService';

// [NEW] Internal refined component for robust liquid toggle
const LiquidToggle = ({ type, setType, t, theme }) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const tabWidth = (containerWidth - 10) / 2;

    const dragX = useSharedValue(type === 'white' ? 0 : 0); // Will update on layout
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const scale = useLiquidScale(dragX, startX, targetX, isDragging, 1.15);

    // Gestures refs
    const isGrabbing = useRef(false);
    const gestureStartX = useRef(0);
    const gestureStartLocationX = useRef(0);
    const currentType = useRef(type);
    const tabWidthRef = useRef(tabWidth);
    const isInitialized = useRef(false);

    useEffect(() => {
        currentType.current = type;
        tabWidthRef.current = tabWidth;
        if (tabWidth > 0) {
            const target = type === 'white' ? 0 : tabWidth;
            if (!isInitialized.current) {
                dragX.value = target;
                isInitialized.current = true;
            } else {
                dragX.value = withSpring(target, SNAP_SPRING_CONFIG);
            }
        }
    }, [type, tabWidth]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, state) => {
                const dx = Math.abs(state.dx);
                const dy = Math.abs(state.dy);
                return dx > 2 || dy > 2; // Capture almost any movement to be safe
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX } = evt.nativeEvent;
                const currentTabWidth = tabWidthRef.current;

                gestureStartLocationX.current = locationX;

                // If containerWidth is 0, we can't do anything
                if (currentTabWidth <= 0) return;

                const isSecondTab = locationX > currentTabWidth;
                const touchedType = isSecondTab ? 'black' : 'white';

                // Only allow grab if touching the active indicator?
                // Actually, for better UX let's allow grabbing the indicator, 
                // OR just clicking the other side.
                // If touching active -> Grab
                if (touchedType === currentType.current) {
                    isGrabbing.current = true;
                    isDragging.value = true;
                    gestureStartX.current = dragX.value;
                    HapticsService.trigger('selection');
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isGrabbing.current) return;
                const currentTabWidth = tabWidthRef.current;
                let newPos = gestureStartX.current + gestureState.dx;
                // Clamp
                newPos = Math.max(0, Math.min(newPos, currentTabWidth));
                dragX.value = newPos;
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentTabWidth = tabWidthRef.current;
                // If tabWidth is invalid, abort
                if (currentTabWidth <= 0) return;

                const isClick = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
                let targetType = currentType.current;

                if (isClick && !isGrabbing.current) {
                    // Tap on non-active area
                    const touchedX = gestureStartLocationX.current;
                    targetType = touchedX > currentTabWidth ? 'black' : 'white';
                } else if (isGrabbing.current) {
                    // Drag release
                    const progress = dragX.value / currentTabWidth;
                    const snapIndex = progress > 0.5 ? 1 : 0;
                    targetType = snapIndex === 1 ? 'black' : 'white';
                }

                isGrabbing.current = false;

                if (targetType !== currentType.current) {
                    setType(targetType);
                    HapticsService.trigger('selection');
                }

                const finalTarget = targetType === 'black' ? currentTabWidth : 0;
                // Anchors
                updateLiquidAnchors(startX, targetX, isDragging, dragX.value, finalTarget);
                dragX.value = withSpring(finalTarget, SNAP_SPRING_CONFIG);
            }
        })
    ).current;

    return (
        <View
            style={[styles.toggleContainer, { opacity: tabWidth > 0 ? 1 : 0 }]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(containerWidth - w) > 1) {
                    setContainerWidth(w);
                }
            }}
            {...panResponder.panHandlers}
        >
            {/* Indicator */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.toggleIndicator,
                    useAnimatedStyle(() => ({
                        width: tabWidth > 0 ? tabWidth : 0,
                        backgroundColor: interpolateColor(dragX.value, [0, tabWidth], ['rgba(255, 255, 255, 1)', '#151515']),
                        borderColor: interpolateColor(dragX.value, [0, tabWidth], ['rgba(255,255,255,0)', 'rgba(255,255,255,1)']),
                        borderWidth: 1.5,
                        transform: [
                            { translateX: dragX.value },
                            { scale: scale.value }
                        ]
                    }))
                ]} />

            {/* Labels overlay */}
            <View style={styles.toggleClickArea} pointerEvents="none">
                <View style={styles.toggleBtn}>
                    <Animated.Text style={[styles.toggleText, useAnimatedStyle(() => ({
                        color: interpolateColor(dragX.value, [0, tabWidth / 2], ['#000', '#666'])
                    }))]}>{t('card_type_white')}</Animated.Text>
                </View>
                <View style={styles.toggleBtn}>
                    <Animated.Text style={[styles.toggleText, useAnimatedStyle(() => ({
                        color: interpolateColor(dragX.value, [tabWidth / 2, tabWidth], ['#666', '#FFF'])
                    }))]}>{t('card_type_black')}</Animated.Text>
                </View>
            </View>

            {/* Invisible Touch Areas for reliable Clicking if Drag doesn't activate? */}
            {/* Actually PanResponder captures taps too. We need to handle tap logic in Release. */}
            {/* Let's refine Release to check start location from Grant to determine tap target. */}
        </View>
    );
};

/**
 * CardSuggestionModal
 * Allows players to suggest new white or black cards.
 * Data is saved to Firebase Realtime Database: suggestions/cards
 */
const CardSuggestionModal = ({ visible, onClose, onSuccess }) => {
    const { t, language } = useLanguage();
    const { user, spendMoney } = useAuth();
    const { theme } = useTheme();
    const [type, setType] = useState('white'); // 'white' | 'black'
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim() || loading) return;

        const cost = 25;
        if (user?.balance < cost) {
            alert(t('insufficient_funds_msg') || "Fondi insufficienti!");
            return;
        }

        setLoading(true);
        try {
            const suggestionsRef = ref(db, 'suggestions/cards');
            await push(suggestionsRef, {
                text: text.trim(),
                type,
                username: user?.username || 'Anonymous',
                language,
                timestamp: serverTimestamp(),
                cost_paid: cost
            });

            // Deduct money
            await spendMoney(cost);

            SoundService.play('tap'); // Using tap for feedback
            setText('');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("[SUGGESTION] Failed to submit:", error);
        } finally {
            setLoading(false);
        }
    };




    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title={t('suggest_card_title')}
        >
            <View style={styles.container}>
                <Text style={styles.desc}>{t('suggest_card_desc_cost') || "Invia la tua idea folle per una nuova carta nera o bianca (Costo: 25 DC)."}</Text>

                {/* LIQUID TOGGLE CONTAINER */}
                <LiquidToggle
                    type={type}
                    setType={setType}
                    t={t}
                    theme={theme}
                />

                <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder={t('suggest_card_placeholder')}
                    placeholderTextColor="#666"
                    multiline
                    value={text}
                    onChangeText={setText}
                    maxLength={300}
                />

                <PremiumPressable
                    style={[styles.submitButton, (!text.trim() || loading || (user?.balance < 25)) && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!text.trim() || loading || (user?.balance < 25)}
                    haptic="success"
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text
                            style={styles.submitText}
                        >
                            {t('suggest_card_submit')} (25 DC)
                        </Text>
                    )}
                </PremiumPressable>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        gap: 20,
    },
    desc: {
        fontFamily: 'Outfit',
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    toggleContainer: {
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 25,
        padding: 5,
        position: 'relative',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleIndicator: {
        position: 'absolute',
        top: 4, // [FIX] Adjusted for 50px container (1px border + 4px top + 40px height + 4px bottom + 1px border = 50px)
        bottom: 4,
        left: 5,
        borderRadius: 20,
        backgroundColor: '#FFF',
        height: 40,
    },
    toggleClickArea: {
        flexDirection: 'row',
        height: '100%',
    },
    toggleBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    toggleText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 11,
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 15,
        fontFamily: 'Outfit',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            }
        })
    },
    submitButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitText: {
        fontFamily: 'Cinzel-Bold',
        color: '#000',
        fontSize: 17,
        textAlign: 'center',
        letterSpacing: 0.5,
        includeFontPadding: false,
    }
});

export default CardSuggestionModal;
