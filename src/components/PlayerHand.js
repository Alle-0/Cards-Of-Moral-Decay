import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, Pressable, Dimensions, Image, TouchableWithoutFeedback } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay, withSequence, ZoomIn, FadeOut, Easing, runOnJS, LinearTransition, interpolate, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, TEXTURES } from '../context/ThemeContext';
import HapticsService from '../services/HapticsService';
import PremiumIconButton from './PremiumIconButton';
import PremiumPressable from './PremiumPressable';
import { CardsIcon, RobotIcon, TrashIcon, DirtyCashIcon, EyeOffIcon } from './Icons'; // [NEW] DirtyCashIcon, EyeOffIcon
import { useWebScroll } from '../hooks/useWebScroll';
import { useLanguage } from '../context/LanguageContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CardItem = React.memo(({ text, isSelected, onSelect, disabled, index, showPlayButton, onPlay, onDiscard, isPlaying, selectionOrder, hasDiscarded, isSelectionFull, isSinglePick, skin, t, isBlackout }) => { // [NEW] isBlackout
    const { theme } = useTheme();
    const [isEliminating, setIsEliminating] = useState(false);

    // Unified selection state for animation sync
    const selectionProgress = useSharedValue(0);
    const buttonProgress = useSharedValue(0);
    const trashRotation = useSharedValue(0);
    const slideElimina = useSharedValue(0); // 0 = inside trash, 1 = at destination
    const isHandlingPress = useRef(false); // [NEW] Track press handling

    // [NEW] Discard Animation Values
    const discardTranslateY = useSharedValue(0);
    const discardRotate = useSharedValue(0);
    const discardScale = useSharedValue(1);
    const scale = useSharedValue(1); // Unified scale source

    const performDiscard = () => {
        // 1. Anticipation (Jump up)
        discardTranslateY.value = withSequence(
            withTiming(-40, { duration: 120, easing: Easing.out(Easing.quad) }), // Higher jump, faster
            // 2. Fall down + Fade out
            withTiming(400, { duration: 200, easing: Easing.in(Easing.quad) }, (finished) => {
                if (finished) {
                    runOnJS(onDiscard)(text);
                }
            })
        );
        // Rotate and shrink during fall
        discardRotate.value = withDelay(80, withTiming(20, { duration: 240 }));
        discardScale.value = withDelay(80, withTiming(0, { duration: 240 })); // Shrink to 0
    };

    useEffect(() => {
        // Sync scale with props (in case of external updates or mounting)
        scale.value = withTiming(isSelected ? 1.05 : 1, { duration: 150, easing: Easing.out(Easing.quad) });

        selectionProgress.value = withTiming(isSelected ? 1 : 0, { duration: 150, easing: Easing.out(Easing.quad) });
        buttonProgress.value = withTiming(showPlayButton ? 1 : 0, { duration: 200, easing: Easing.out(Easing.quad) });

        if (!isSelected) {
            setIsEliminating(false);
            trashRotation.value = withTiming(0, { duration: 200 });
            slideElimina.value = withTiming(0, { duration: 200 });
        } else {
            // If selected for play, close any open trash interaction
            setIsEliminating(false);
            trashRotation.value = withTiming(0);
            slideElimina.value = withTiming(0);
        }
    }, [isSelected, showPlayButton]);

    // GIOCA Trapdoor Animation (Driven by buttonProgress)
    const giocaAnimatedStyle = useAnimatedStyle(() => {
        // Trapdoor: 0 -> -90deg, 1 -> 0deg 
        const rotate = -90 + (buttonProgress.value * 90);

        return {
            transform: [
                { perspective: 1000 },
                { translateY: -16 },
                { rotateX: `${rotate}deg` },
                { translateY: 16 },
            ],
            opacity: buttonProgress.value,
        };
    });

    // Elimina Animation Logic
    useEffect(() => {
        if (isEliminating) {
            slideElimina.value = withDelay(80, withTiming(1, { duration: 350 }));
        } else {
            slideElimina.value = withTiming(0, { duration: 200 });
        }
    }, [isEliminating]);


    const layoutStyle = useAnimatedStyle(() => {
        // Base state
        let tx = 0, ty = 0, sc = 1, op = 1;

        if (isPlaying) {
            if (isSelected) {
                ty = withTiming(-900, { duration: 600 });
                sc = withTiming(1.2, { duration: 600 });
                op = withTiming(0, { duration: 550 });
            } else {
                op = withTiming(0, { duration: 300 });
                sc = withTiming(0.9, { duration: 300 });
            }
        } else {
            ty = discardTranslateY.value;
            sc = scale.value;
            if (discardScale.value !== 1) sc = discardScale.value;
        }

        return {
            transform: [
                { scale: sc },
                { translateY: ty },
                { translateX: tx },
                { rotate: `${discardRotate.value}deg` }
            ],
            opacity: op,
        };
    });

    const visualStyle = useAnimatedStyle(() => {
        return {
            borderColor: interpolateColor(
                selectionProgress.value,
                [0, 1],
                [skin?.styles?.border || 'rgba(0,0,0,0.1)', theme.colors.accent]
            ),
            borderWidth: isSelected ? 3 : 1,
            backgroundColor: skin ? skin.styles.bg : '#fff',
        };
    });
    const trashAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${trashRotation.value}deg` }]
        };
    });

    const eliminaPillAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: slideElimina.value > 0.01 ? 1 : 0,
            pointerEvents: slideElimina.value > 0.9 ? 'auto' : 'none',
            transform: [
                // Origin displacement X (~78 to right). Center is 0.
                { translateX: (1 - slideElimina.value) * 78 },
                // Origin displacement Y (higher up -28). Bottom edge is 0.
                { translateY: (1 - slideElimina.value) * -28 },
                // SCALE: follows slideElimina directly to ensure it shrinks on re-entry
                { scale: slideElimina.value },
                // ROTATION: Rolling! (0 to 360 degrees)
                { rotate: `${slideElimina.value * 360}deg` }
            ],
            zIndex: 1000,
        };
    });

    // Unfreeze styles with useMemo (Performance + Stability)
    const mutableCardWrapper = useMemo(() => ({ ...styles.cardWrapper }), []);
    const mutableFloatingTop = useMemo(() => ({ ...styles.floatingActionTop }), []);
    const mutablePlayBtn = useMemo(() => ({ ...styles.playBtnPill }), []);
    const mutableCard = useMemo(() => ({ ...styles.card }), []);
    const mutableTrashBtn = useMemo(() => ({ ...styles.trashBtn }), []);
    const mutableSelectionBadge = useMemo(() => ({ ...styles.selectionBadge }), []);
    const mutableFloatingBottom = useMemo(() => ({ ...styles.floatingActionBottom }), []);
    const mutableDiscardBtn = useMemo(() => ({ ...styles.discardBtnPill }), []);

    return (
        <Pressable
            // ... (Keep interaction logic) ...
            onPress={() => {
                // Block interaction if discarding
                // [FIX] Block optimistic animation if not selected AND selection is full
                if (!disabled && discardScale.value === 1) {
                    if (!isSelected && isSelectionFull && !isSinglePick) return; // Stop here only if NOT single pick!

                    isHandlingPress.current = true; // Mark as handling

                    // OPTIMISTIC ANIMATION:
                    selectionProgress.value = withTiming(isSelected ? 0 : 1, { duration: 150, easing: Easing.out(Easing.quad) });
                    scale.value = withTiming(isSelected ? 1 : 1.05, { duration: 150, easing: Easing.out(Easing.quad) });

                    onSelect(text);
                }
            }}
            haptic="selection"
            onPressIn={() => {
                if (!disabled) {
                    isHandlingPress.current = false; // Reset flag
                    scale.value = withTiming(0.95, { duration: 60, easing: Easing.out(Easing.quad) });
                }
            }}
            onPressOut={() => {
                setTimeout(() => {
                    if (!disabled && !isHandlingPress.current) {
                        scale.value = withTiming(isSelected ? 1.05 : 1, { duration: 150, easing: Easing.out(Easing.quad) });
                    }
                }, 10);
            }}
            style={({ pressed }) => [mutableCardWrapper, { opacity: disabled ? 0.6 : 1 }]}
        >
            {/* GIOCA Button - Trapdoor 3D Swing */}
            <Animated.View
                style={[mutableFloatingTop, giocaAnimatedStyle]}
            >
                <PremiumPressable
                    onPress={onPlay}
                    style={mutablePlayBtn}
                    rippleColor="rgba(255, 255, 255, 0.3)"
                    scaleDown={0.9}
                    haptic="heavy" // Confirmation weight
                    enableSound={false} // [FIX] Avoid double sound (pop + swoosh)
                >
                    <Text style={styles.actionBtnText}>{t('play')}</Text>
                </PremiumPressable>
            </Animated.View>

            {/* WRAPPER: Handles Layout (Transform/Opacity) but NO clipping/border */}
            <Animated.View style={[mutableCardWrapper, layoutStyle]}>

                {/* INNER CARD: Handles Visuals (Border/Bg) and Clipping */}
                <Animated.View style={[
                    mutableCard,
                    visualStyle,
                    { width: '100%', height: '100%' } // Ensure full fill
                ]}>

                    {/* [NEW] TEXTURE LAYER */}
                    {skin?.styles?.texture && TEXTURES[skin.styles.texture] && (() => {
                        // Simple deterministic pseudo-random based on text hash
                        const hash = (text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const rotations = [0, 90, 180, 270];
                        const rotation = rotations[hash % 4];
                        const baseScale = 1.3;
                        const scaleFactor = baseScale + (hash % 5) * 0.1;

                        return (
                            <Image
                                source={TEXTURES[skin.styles.texture]}
                                style={[
                                    StyleSheet.absoluteFill,
                                    {
                                        opacity: skin.styles.textureOpacity || 0.15,
                                        borderRadius: 12,
                                        transform: [
                                            { rotate: `${rotation}deg` },
                                            { scale: scaleFactor }
                                        ]
                                    }
                                ]}
                                resizeMode="cover"
                            />
                        );
                    })()}

                    {/* [NEW] BLACKOUT LOGIC - Partial Censorship */}
                    {(() => {
                        // Deterministic Censorship
                        const displayText = useMemo(() => {
                            if (!isBlackout || !text) return text;
                            return text.split(' ').map((word, i) => {
                                // Keep short words or random chance based on index/length
                                if (word.length <= 2) return word;
                                // Simple deterministic hash for stability
                                const hash = (text.length + i * 7 + word.charCodeAt(0));
                                // Censor ~70% of words
                                return (hash % 10 > 2) ? '█'.repeat(word.length) : word;
                            }).join(' ');
                        }, [text, isBlackout]);

                        return (
                            <Text
                                style={[
                                    styles.cardText,
                                    skin ? { color: skin.styles.text, fontWeight: skin.id === 'mida' ? '700' : '600' } : {},
                                    { fontSize: (text?.length || 0) > 50 ? 14 : ((text?.length || 0) > 30 ? 16 : 18) }
                                ]}
                                numberOfLines={10}
                            >
                                {displayText || ''}
                            </Text>
                        );
                    })()}
                </Animated.View>

                {/* BADGE: Sibling to Inner Card, so it's NOT clipped */}
                {/* Selection Order Badge - Driven by selectionProgress to avoid unmount layout glitches */}
                {!isSinglePick && (
                    <Animated.View
                        style={[
                            mutableSelectionBadge,
                            {
                                opacity: selectionProgress, // 0 -> 1
                                transform: [
                                    { scale: selectionProgress } // 0 -> 1
                                ]
                            }
                        ]}
                    >
                        <Text style={styles.selectionBadgeText}>{selectionOrder > 0 ? selectionOrder : ''}</Text>
                    </Animated.View>
                )}




                {/* Trash Icon */}
                {!disabled && !hasDiscarded && (
                    <PremiumIconButton
                        onPress={(e) => {
                            e.stopPropagation();
                            const nextState = !isEliminating;
                            setIsEliminating(nextState);
                            trashRotation.value = withTiming(nextState ? -100 : 0, { duration: 200 });
                            HapticsService.trigger('medium');
                        }}
                        style={[mutableTrashBtn, trashAnimatedStyle]}
                        icon={<TrashIcon size={28} color="#ef4444" />}
                        size={42}
                    />
                )}

                {disabled && (
                    <View style={{ position: 'absolute', bottom: 5, right: 5 }}>
                        <Text style={{ fontSize: 16, opacity: 0.5 }}>🔒</Text>
                    </View>
                )}
            </Animated.View>

            {/* ELIMINA Button - Slides out from trash icon */}
            {/* We render it if slideElimina > 0 so we can see the reverse animation */}
            <Animated.View
                style={[mutableFloatingBottom, eliminaPillAnimatedStyle]}
            >
                <PremiumPressable
                    onPress={(e) => {
                        e.stopPropagation();
                        // Trigger internal animation instead of direct discard
                        setIsEliminating(false);
                        trashRotation.value = withTiming(0);
                        performDiscard();
                    }}
                    style={mutableDiscardBtn}
                    rippleColor="rgba(255, 107, 107, 0.4)"
                    scaleDown={0.9}
                    haptic="warning" // Warning/Heavy for delete
                    enableSound={false} // [FIX] Avoid double sound
                >
                    <Text style={styles.actionBtnText}>{t('discard_btn')}</Text>
                </PremiumPressable>
            </Animated.View>



        </Pressable>
    );
});



const PlayerHand = ({
    hand,
    selectedCards = [],
    onSelectCard,
    maxSelection,
    disabled,
    isPlaying,
    onPlay,
    jokers = 0,
    onAIJoker,
    onDiscard,
    onBribe,
    bribes = 0,
    hasDiscarded,
    skin,
    balance,
    isSmallScreen,

    onBackgroundPress,
    isBlackout = false,
}) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    // const scrollRef = useWebScroll(false); // Removed web scroll hook for FlatList compatibility if needed, or keep if generic
    // Using simple ref for FlatList
    const flatListRef = useRef(null);

    const handOffset = useSharedValue(disabled || isPlaying ? 400 : 0);
    const [containerHeight, setContainerHeight] = useState(0);

    const onLayout = (event) => {
        const { height } = event.nativeEvent.layout;
        setContainerHeight(height);
    };

    useEffect(() => {
        if (isPlaying || disabled) {
            const targetOffset = containerHeight > 0 ? containerHeight - 55 : 300;
            if (Math.abs(handOffset.value - targetOffset) > 1) {
                handOffset.value = withTiming(targetOffset, { duration: 500, easing: Easing.out(Easing.quad) });
            }
        } else {
            if (handOffset.value !== 40) {
                handOffset.value = withTiming(40, { duration: 300 });
            }
        }
    }, [isPlaying, disabled, containerHeight]);

    const handAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: handOffset.value }],
    }));

    // [OPTIMIZATION] Stable renderItem
    const renderCard = ({ item, index }) => {
        const sIdx = selectedCards.indexOf(item);
        return (
            <Animated.View
                layout={LinearTransition.duration(200)}
                style={{ width: '48%', height: isSmallScreen ? 120 : 140, marginBottom: 30 }} // Moved margin to item for consistent layout
            >
                <CardItem
                    text={item}
                    index={index}
                    isSelected={sIdx !== -1}
                    selectionOrder={maxSelection > 1 ? sIdx + 1 : 0}
                    onSelect={onSelectCard}
                    disabled={disabled || isPlaying}
                    isPlaying={isPlaying}
                    onPlay={onPlay}
                    onDiscard={() => onDiscard && onDiscard(item)}
                    showPlayButton={sIdx !== -1 && selectedCards.length === maxSelection}
                    hasDiscarded={hasDiscarded}
                    skin={skin}
                    isSinglePick={maxSelection === 1}
                    isSelectionFull={selectedCards.length >= maxSelection}
                    t={t}
                    isBlackout={isBlackout}
                />
            </Animated.View>
        );
    };

    // [OPTIMIZATION] Stable keyExtractor
    const keyExtractor = (item, index) => `${item}-${index}`;

    // [OPTIMIZATION] Layout calculation
    const getItemLayout = (data, index) => {
        const itemHeight = isSmallScreen ? 120 : 140;
        const gap = 30;
        const totalHeight = itemHeight + gap;
        return { length: totalHeight, offset: totalHeight * index, index };
    };

    return (
        <Animated.View
            style={[styles.container, handAnimatedStyle]}
            onLayout={onLayout}
        >
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CardsIcon size={isSmallScreen ? 28 : 34} color={theme.colors.textPrimary || '#fff'} />
                    <View style={{ width: 10 }} />
                    <View>
                        <Text style={[styles.label, {
                            color: theme.colors.textPrimary,
                            fontFamily: 'Cinzel-Bold',
                            marginBottom: 0,
                            fontSize: isSmallScreen ? 12 : 14
                        }]}>
                            {t('hand_label', { defaultValue: 'La Tua Mano' })}
                        </Text>
                        {maxSelection > 1 && (
                            <Text style={{
                                color: theme.colors.accent,
                                fontFamily: 'Outfit-Bold',
                                fontSize: isSmallScreen ? 8 : 10,
                                marginTop: 2,
                                letterSpacing: 0.5
                            }}>
                                {t('select_x_cards', { count: maxSelection, defaultValue: `SELEZIONA ${maxSelection} CARTE` })}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Action Buttons Container */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, position: 'absolute', right: 20 }}>
                    {onBribe && (
                        <PremiumIconButton
                            icon={<DirtyCashIcon size={isSmallScreen ? 24 : 30} color="#FFD700" />}
                            onPress={onBribe}
                            badge={bribes > 0 ? bribes : null}
                            badgeStyle={bribes <= 0 ? { backgroundColor: '#ef4444', borderColor: '#000', borderWidth: 1.5 } : { backgroundColor: '#FFD700', borderColor: '#000', borderWidth: 1.5 }}
                            style={{ opacity: (disabled || bribes <= 0) ? 0.4 : 1 }}
                            disabled={disabled || bribes <= 0}
                            size={isSmallScreen ? 34 : 40}
                        />
                    )}

                    <PremiumIconButton
                        icon={<RobotIcon size={isSmallScreen ? 24 : 30} color="#FFD700" />}
                        onPress={onAIJoker}
                        badge={jokers > 0 ? jokers : null}
                        badgeStyle={{ backgroundColor: '#FFD700', borderColor: '#000', borderWidth: 1.5 }}
                        disabled={disabled || jokers === 0}
                        style={{ opacity: (disabled || jokers === 0) ? 0.4 : 1 }}
                        size={isSmallScreen ? 34 : 40}
                    />
                </View>
            </View>

            {/* Container for FlatList + Gradients */}
            <View style={{ flex: 1, position: 'relative' }}>
                <TouchableWithoutFeedback onPress={() => onBackgroundPress && onBackgroundPress()}>
                    <View style={{ flex: 1 }}>
                        {/* [OPTIMIZATION] FlatList Implementation */}
                        <FlatList
                            ref={flatListRef}
                            data={hand}
                            renderItem={renderCard}
                            keyExtractor={keyExtractor}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 15 }} // Apply gap and padding here
                            contentContainerStyle={{ paddingTop: 25, paddingBottom: 60 }} // Vertical padding
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={true}
                            initialNumToRender={6}
                            maxToRenderPerBatch={6} // optimized batch
                            windowSize={5} // reduced window size
                            getItemLayout={getItemLayout}
                        />
                    </View>
                </TouchableWithoutFeedback>

                {/* Top Shadow Gradient */}
                <LinearGradient
                    colors={['rgba(17,17,17,0.4)', 'transparent']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, zIndex: 10 }}
                    pointerEvents="none"
                />

                {/* Bottom Shadow Gradient */}
                <LinearGradient
                    colors={['transparent', 'rgba(17,17,17,0.9)']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, zIndex: 10 }}
                    pointerEvents="none"
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111bb',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 12,
        overflow: 'hidden' // Base state hidden, overridden by style prop if needed, but here we can just rely on the dynamic prop passed to View if we were passing it. 
        // Wait, the container style is static. We need to apply dynamic style to the Animated.View.
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 8, // was 15
    },
    label: {
        fontSize: 14,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    jokerBtn: {
        padding: 5,
    },
    jokerIconContainer: {
        position: 'relative',
    },
    jokerBadge: {
        position: 'absolute',
        top: -5,
        right: -8,
        backgroundColor: '#FFD700',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    jokerBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    selectionBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fbbf24', // Gold Amber
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        elevation: 10,
        borderWidth: 2,
        borderColor: '#000',
    },
    selectionBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Outfit',
    },
    scrollContent: {
        // Padding moved to inner Grip/Pressable
        flexGrow: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 30, // was 35
        columnGap: 10,
    },
    cardWrapper: {
        width: '100%',
        height: '100%',
    },
    card: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden', // [FIX] Clip texture to card borders
    },
    cardText: {
        color: '#000',
        fontSize: 18, // Reduced from 20 to fit better
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 8,
        zIndex: 10, // Ensure text is above texture
        // lineHeight: 26, // Removed to allow auto-scaling without cutoff
    },
    trashBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        zIndex: 50,
    },
    floatingActionTop: {
        position: 'absolute',
        top: -16, // Half-out (pill height is ~32)
        alignSelf: 'center',
        zIndex: 1000,
        elevation: 20,
    },
    floatingActionBottom: {
        position: 'absolute',
        bottom: -16, // Half-out
        alignSelf: 'center',
        zIndex: 1000,
        elevation: 20,
    },
    playBtnPill: {
        backgroundColor: '#10b981', // Emerald
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    discardBtnPill: {
        backgroundColor: '#ef4444', // Red
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    actionBtnText: {
        color: 'white',
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        letterSpacing: 1,
    },
});

export default React.memo(PlayerHand);
