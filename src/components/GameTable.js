import React, { useState, useEffect, useMemo, memo } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Pressable, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, Easing, withSequence, runOnJS, interpolate } from 'react-native-reanimated';
import { useTheme, CARD_SKINS, TEXTURES } from '../context/ThemeContext'; // [NEW] CARD_SKINS, TEXTURES
import PremiumIconButton from './PremiumIconButton';
import PremiumPressable from './PremiumPressable';
import { useAuth } from '../context/AuthContext'; // [NEW] useAuth
import { useLanguage } from '../context/LanguageContext';
import { CrownIcon } from './Icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BlackCard = memo(({ text, dominusName, answerCount, totalAnswers, t, isSmallScreen }) => (
    <View style={[styles.blackCard, isSmallScreen && { paddingHorizontal: 5 }]}>
        {/* Texture removed per user request "solo sulle bianche" */}
        <Text style={styles.headerTitle}>{t('black_card_label')}</Text>
        <View style={styles.cardInternal}>
            <Text
                style={[
                    styles.blackCardText,
                    {
                        fontSize: isSmallScreen
                            ? ((text?.length || 0) > 80 ? 12 : ((text?.length || 0) > 40 ? 14 : 16))
                            : ((text?.length || 0) > 80 ? 13 : ((text?.length || 0) > 40 ? 15 : 18))
                    }
                ]}
                numberOfLines={isSmallScreen ? 6 : 10}
            >
                {text || ''}
            </Text>

            <View style={[styles.cardFooter, isSmallScreen && { marginTop: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CrownIcon size={isSmallScreen ? 18 : 24} color="#ffd36a" />
                    <View style={{ width: 6 }} />
                    <Text style={[styles.footerText, isSmallScreen && { fontSize: 10 }]}>{t('dominus_label')} <Text style={{ color: '#ffd36a' }}>{dominusName || '?'}</Text></Text>
                </View>
                {answerCount < totalAnswers && (
                    <Text style={styles.footerText}>{t('answers_label')} <Text style={{ color: '#ffd36a' }}>{answerCount}/{totalAnswers}</Text></Text>
                )}
            </View>
        </View>
    </View>
));

const FaceDownCard = memo(() => (
    <View style={styles.faceDownCard}>
        {/* Texture removed per user request */}
        <View style={{ transform: [{ rotate: '-45deg' }], alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Cinzel-Bold', color: '#ffffff', fontSize: 22, textAlign: 'center', lineHeight: 28 }}>MORAL{'\n'}DECAY</Text>
        </View>
    </View>
));

const PlayedCard = memo(({ cards, playerName, isDominus, onPickWinner, revealed, isSelected, isWinning, onSelect, skin, t, showIdentity }) => { // [NEW] showIdentity
    const aniValue = useSharedValue(0);

    const handlePress = () => {
        if (!isDominus) return;
        if (onSelect) onSelect();
    };

    useEffect(() => {
        aniValue.value = withTiming(isSelected ? 1 : 0, {
            duration: 150,
            easing: Easing.out(Easing.exp)
        });
    }, [isSelected]);

    const cardAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: interpolate(aniValue.value, [0, 1], [1, 1.03]) }],
        };
    });

    const overlayStyle = useAnimatedStyle(() => {
        return {
            opacity: aniValue.value,
        };
    });

    const btnAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: isWinning ? 0 : aniValue.value,
            transform: [{ translateY: interpolate(aniValue.value, [0, 1], [30, 0]) }]
        };
    });

    const winningStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(isWinning ? '#10b981' : '#ffd700', { duration: 300 }),
            backgroundColor: withTiming(isWinning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 215, 0, 0.05)', { duration: 300 }),
            transform: [{ scale: withSpring(isWinning ? 1.1 : (1 + aniValue.value * 0.03)) }]
        };
    });

    // Safety check for cards array
    let validCards = [];
    if (Array.isArray(cards)) {
        validCards = cards;
    } else if (typeof cards === 'string') {
        validCards = [cards];
    } else if (cards && typeof cards === 'object') {
        validCards = Object.values(cards);
    }

    if (validCards.length === 1 && Array.isArray(validCards[0])) {
        validCards = validCards[0];
    }

    if (validCards.length === 0) {
        return (
            <View style={styles.playedCardGroup}>
                <View style={[styles.faceDownWrapper, { opacity: 0.5 }]}>
                    <FaceDownCard />
                </View>
            </View>
        );
    }

    const combinedText = validCards.length > 1
        ? validCards.map((t, i) => `${i + 1}) ${t}`).join(' ')
        : validCards[0];

    return (
        <View style={[styles.playedCardGroup, { zIndex: isSelected ? 999 : 1 }]}>
            <PremiumPressable
                onPress={handlePress}
                hitSlop={0} // [FIX] Ensure no extra touch area
                scaleDown={1} // [FIX] Disable press scaling (handled by selection state)
                enableRipple={false} // [FIX] Completely disable ripple
                style={[
                    revealed ? styles.whiteCard : styles.faceDownWrapper,
                    cardAnimatedStyle,
                    // { overflow: 'visible' } // No longer needed here, prop handles it
                ]}
                pressableStyle={{ flex: 1 }}
                contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >


                {/* Selection Highlight */}
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { borderColor: '#ffd700', borderWidth: 2, borderRadius: 15, backgroundColor: 'rgba(255, 215, 0, 0.05)' },
                    overlayStyle,
                    isWinning && winningStyle // [NEW]
                ]} pointerEvents="none" />


                {/* RANDO VISUAL DISTINCTION - ONLY WHEN IDENTITY IS REVEALED */}
                {playerName === 'Rando' && revealed && showIdentity && (
                    <View style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        backgroundColor: '#ff6b6b',
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        borderWidth: 1,
                        borderColor: '#fff',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5
                    }}>
                        <Text style={{ fontSize: 14 }}>🤖</Text>
                    </View>
                )}

                {revealed ? (
                    <View style={{
                        flex: 1,
                        width: '100%',
                        padding: 15,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: (playerName === 'Rando' && showIdentity) ? '#e2e8f0' : (skin?.styles?.bg ? skin.styles.bg : '#d1d1d1'),
                        borderRadius: 15,
                        overflow: 'hidden',
                        borderWidth: (playerName === 'Rando' && showIdentity) ? 2 : 0,
                        borderColor: '#94a3b8'
                    }}>
                        {/* [NEW] TEXTURE LAYER */}
                        {skin?.styles?.texture && TEXTURES[skin.styles.texture] && (() => {
                            const hash = (combinedText || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
                                            borderRadius: 15,
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

                        <Text
                            style={[
                                styles.whiteCardText,
                                skin?.styles?.text ? { color: skin.styles.text, fontWeight: skin.id === 'mida' ? '700' : '600' } : {}
                            ]}
                            numberOfLines={12}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.5}
                        >
                            {combinedText}
                        </Text>
                    </View>
                ) : (
                    <FaceDownCard />
                )}
            </PremiumPressable>

            {/* Winner Button - Moved outside to prevent overflow clipping */}
            {revealed && isDominus && (
                <Animated.View
                    pointerEvents={isSelected ? 'auto' : 'none'}
                    style={[
                        styles.winnerBtnContainer,
                        btnAnimatedStyle,
                        { position: 'absolute', bottom: -18, alignSelf: 'center', zIndex: 100 }
                    ]}
                >
                    <PremiumPressable
                        style={styles.winnerBtn}
                        onPress={onPickWinner}
                        rippleColor="rgba(255, 255, 255, 0.4)"
                        scaleDown={0.9}
                        haptic="heavy"
                        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={styles.winnerBtnText}>{t('choose_btn')}</Text>
                    </PremiumPressable>
                </Animated.View>
            )}
        </View>
    );
});

const AnimatedBlackCard = memo(({ blackCard, dominusName, answerCount, totalAnswers, t, isSmallScreen }) => {
    // Local state for the card content being currently displayed
    const [displayedCard, setDisplayedCard] = useState(blackCard);
    const rotateX = useSharedValue(0);

    // When the prop 'blackCard' changes, trigger the flip
    useEffect(() => {
        // If it's the very first render or same card, just sync
        if (!displayedCard || displayedCard === blackCard || displayedCard?.testo === blackCard?.testo) {
            setDisplayedCard(blackCard);
            return;
        }

        // 1. Flip to 90 degrees (hide)
        rotateX.value = withSequence(
            withTiming(90, { duration: 300, easing: Easing.in(Easing.ease) }, () => {
                // 2. Swap content while invisible
                runOnJS(setDisplayedCard)(blackCard);
            }),
            // 3. Snap to -90 degrees instantly
            withTiming(-90, { duration: 0 }),
            // 4. Flip from -90 to 0 degrees (show new)
            withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
        );
    }, [blackCard]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 },
            { rotateX: `${rotateX.value}deg` } // Determine rotation
        ],
        backfaceVisibility: 'hidden'
    }));

    return (
        <Animated.View style={[{ width: '100%', alignItems: 'center', marginBottom: isSmallScreen ? 10 : 20, zIndex: 10 }, animatedStyle]}>
            <BlackCard
                text={displayedCard?.testo || displayedCard || t?.('select_card_placeholder') || 'Seleziona una carta'}
                dominusName={dominusName}
                answerCount={answerCount}
                totalAnswers={totalAnswers}
                t={t}
                isSmallScreen={isSmallScreen}
            />
        </Animated.View>
    );
});

const GameTable = ({ blackCard, playedCards = {}, isDominus, onSelectWinner, status, dominusName, playerCount, onSkip, onReveal, showPlayedArea = true, style, players, optimisticWinner, isSmallScreen }) => { // [NEW] optimisticWinner, isSmallScreen
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { user } = useAuth(); // [NEW] Get user for skins
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // [FIX] Reset selection when a new round starts or status changes
    useEffect(() => {
        const blackCardText = (blackCard?.testo || blackCard || '').toString();
        setSelectedCandidate(null);
    }, [blackCard?.testo || blackCard, status]);

    // Filter out empty entries
    const validPlayedCards = useMemo(() => Object.entries(playedCards).filter(([_, cards]) => {
        if (!cards) return false;
        if (Array.isArray(cards) && cards.length === 0) return false;
        return true;
    }), [playedCards]);

    const answerCount = validPlayedCards.length;
    // Total answers expected (players - 1 czar)
    const totalAnswers = useMemo(() => Math.max(0, playerCount - 1), [playerCount]);

    // Only reveal cards if:
    // 2. OR It's the choosing phase AND I am the Dominus - Only Dominus sees to choose
    const cardsRevealed = status === 'SHOWING_WINNER' || (isDominus && status === 'DOMINUS_CHOOSING');

    return (
        <View style={[styles.container, { flex: showPlayedArea ? 1 : 0 }, style]}>
            {/* Animated Black Card - FIXED AT TOP */}
            <AnimatedBlackCard
                blackCard={blackCard}
                dominusName={dominusName}
                answerCount={answerCount}
                totalAnswers={totalAnswers}
                t={t}
                isSmallScreen={isSmallScreen}
            />

            <ScrollView
                style={{ width: '100%', flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 50, alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Played Area */}
                {showPlayedArea && (
                    <View style={styles.playedContent}>
                        {/* Show table if revealed, regardless of role */}
                        {(isDominus || cardsRevealed) && (
                            <>
                                {!cardsRevealed && (
                                    <View style={{ width: '100%', alignItems: 'center', marginVertical: 10 }}>
                                        <Text style={{ color: '#888', fontFamily: 'Cinzel', fontSize: 14 }}>
                                            {t('waiting_cards')} ({validPlayedCards.length}/{playerCount - 1})
                                        </Text>
                                    </View>
                                )}

                                {validPlayedCards.map(([player, cards]) => {
                                    const isSelected = (selectedCandidate || '').toString().trim().toLowerCase() === (player || '').toString().trim().toLowerCase();
                                    const isWinning = (optimisticWinner || '').toString().trim().toLowerCase() === (player || '').toString().trim().toLowerCase();
                                    const sanitizedPlayerName = (player || '').toString().trim().toLowerCase();

                                    return (
                                        <PlayedCard
                                            key={`${sanitizedPlayerName}-${cardsRevealed ? 'rev' : 'hid'}`}
                                            cards={cards}
                                            playerName={player}
                                            isDominus={isDominus}
                                            revealed={cardsRevealed}
                                            isSelected={isSelected}
                                            isWinning={isWinning}
                                            onSelect={() => setSelectedCandidate(prev => {
                                                const p = (player || '').toString().trim().toLowerCase();
                                                const current = (prev || '').toString().trim().toLowerCase();
                                                return current === p ? null : player;
                                            })}
                                            onPickWinner={() => onSelectWinner(player)}
                                            skin={user?.activeCardSkin ? (CARD_SKINS[user.activeCardSkin] || CARD_SKINS.classic) : CARD_SKINS.classic}
                                            t={t}
                                            showIdentity={status === 'SHOWING_WINNER'} // [FIX] Only show bot identity after selection
                                        />
                                    );
                                })}

                                { /* Placeholder slots for remaining players (Visible only if Dominus) */}
                                {isDominus && Array.from({ length: Math.max(0, (playerCount - 1) - validPlayedCards.length) }).map((_, i) => (
                                    <View key={`empty-${i}`} style={styles.playedCardGroup}>
                                        <View style={[styles.faceDownWrapper, { opacity: 0.3 }]}>
                                            <FaceDownCard />
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        // flex: 1, // REMOVED: Applied conditionally in render
        padding: 20,
        alignItems: 'center',
    },
    blackCard: {
        width: '100%',
        alignItems: 'center',
        // marginBottom: 20, // Moved to wrapper
    },
    sectionTitle: {
        color: '#cfcfcfff',
        fontFamily: 'Cinzel-Bold',
        fontSize: 18,
        marginTop: 20,
        marginBottom: 15,
        textAlign: 'center'
    },
    headerTitle: {
        color: '#ccc',
        fontFamily: 'Cinzel-Bold', // or Outfit
        marginTop: 10, // Adjusted globally, was 30
        marginBottom: 8,
        fontSize: 12,
        letterSpacing: 1
    },
    cardInternal: {
        width: '100%', // Fits within parent padding (20px each side)
        minHeight: 180, // Reduced from 220
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: '#e0e0e0', // Restored bright border
    },
    blackCardText: {
        color: '#dcdcdcff',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Helvetica Neue', // Keep generic or switch to user font
        textAlign: 'left'
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20
    },
    footerText: {
        color: '#888',
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        fontWeight: 'bold'
    },
    playedArea: {
        width: '100%',
        flex: 1,
    },
    playedContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15, // Increased gap
        paddingBottom: 50,
        paddingTop: 10
    },
    playedCardGroup: {
        alignItems: 'center',
        margin: 5,
        width: 140,  // [FIX] Larger width
        height: 190, // [FIX] Larger height
    },
    faceDownWrapper: {
        width: 140,
        height: 190,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        backgroundColor: '#000', // Ensure background is black
        overflow: 'hidden' // Clip inner content
    },
    faceDownCard: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        borderRadius: 15, // Match wrapper
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#cececeff', // Bright White Border
    },
    faceDownText: {
        color: '#dfdfdfff', // Bright White Text
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Helvetica Neue',
        textAlign: 'center',
        transform: [{ rotate: '-45deg' }]
    },
    whiteCard: {
        width: 140,
        height: 190,
        backgroundColor: '#d1d1d1ff',
        borderRadius: 15, // Rounder
        // padding: 10, removed to let absoluteFill highlight touch edges
        justifyContent: 'center', // Center vertical
        alignItems: 'center',     // Center horizontal
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden', // [FIX] Clip texture to card borders
    },
    whiteCardText: {
        color: '#222',
        fontSize: 18, // Increased
        fontWeight: '600',
        textAlign: 'center', // Center text
        fontFamily: 'Outfit', // Use theme font
        // lineHeight: 26 // Removed to allow auto-scaling without cutoff
    },
    dominusBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        minWidth: 110,
        minHeight: 50,
        justifyContent: 'center',
        backgroundColor: '#2a2a2a', // Darker solid background for better contrast
        borderColor: '#444',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    czarBtnText: {
        fontFamily: 'Cinzel-Bold',
        letterSpacing: 1,
        marginLeft: 8
    },

    winnerBtnContainer: {
        zIndex: 100,
    },
    winnerBtn: {
        backgroundColor: '#10b981',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(255,255,255,0.4)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    winnerBtnText: {
        color: '#fff',
        fontFamily: 'Cinzel-Bold',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    }
});

export default memo(GameTable);
