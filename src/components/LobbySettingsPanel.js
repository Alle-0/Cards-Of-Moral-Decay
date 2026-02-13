import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert, PanResponder, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withSpring, interpolate, interpolateColor, useDerivedValue } from 'react-native-reanimated';
import PremiumToggle from './PremiumToggle';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';
import SoundService from '../services/SoundService';
import HapticsService from '../services/HapticsService';
import { EyeIcon, LockIcon } from './Icons';

import { useLanguage } from '../context/LanguageContext';
import { translations } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext'; // [NEW]

const PointItem = ({ pts, index, dragX, theme }) => {
    const textStyle = useAnimatedStyle(() => {
        const itemCenter = index * 70;
        const color = interpolateColor(
            dragX.value,
            [itemCenter - 70, itemCenter, itemCenter + 70],
            [theme.colors.textPrimary + '44', '#000000', theme.colors.textPrimary + '44']
        );
        return { color, fontWeight: '900' };
    });

    return (
        <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 15, zIndex: 2 }} pointerEvents="none">
            <Animated.Text style={[{ fontSize: 20, lineHeight: 22, marginTop: 2 }, textStyle]}>
                {pts}
            </Animated.Text>
            <Animated.Text style={[{ fontSize: 8, fontWeight: 'bold', lineHeight: 10 }, textStyle]}>PTS</Animated.Text>
        </View>
    );
};

const LanguageItem = ({ lang, index, dragX, theme, displayLang }) => {
    const textStyle = useAnimatedStyle(() => {
        const itemCenter = index * 50;
        const color = interpolateColor(
            dragX.value,
            [itemCenter - 50, itemCenter, itemCenter + 50],
            ['rgba(255,255,255,0.3)', '#FFFFFF', 'rgba(255,255,255,0.3)']
        );
        return { color, fontWeight: 'bold' };
    });

    return (
        <View style={{ width: 50, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2 }} pointerEvents="none">
            <Animated.Text style={[{ fontSize: 12 }, textStyle]}>
                {displayLang}
            </Animated.Text>
        </View>
    );
};

// [NEW] Memoized Animated Pack Card to prevent glitches
const PackCard = React.memo(({ pack, isSelected, isOwned, onToggle, onPreview, theme, t }) => {
    // Shared Values for animation
    const opacitySV = useSharedValue(isSelected ? 1 : (isOwned ? 0.8 : 0.5)); // [FIX] Higher base opacity to avoid "muddy" look
    const selectionProgress = useSharedValue(isSelected ? 1 : 0);
    const borderColorSV = useSharedValue(isSelected ? theme.colors.accent : (isOwned ? 'rgba(255,255,255,0.05)' : '#111'));

    useEffect(() => {
        opacitySV.value = withTiming(isSelected ? 1 : (isOwned ? 0.8 : 0.5), { duration: 250 });
        selectionProgress.value = withTiming(isSelected ? 1 : 0, { duration: 250 });
        borderColorSV.value = withTiming(
            isSelected ? 'rgba(255,255,255,0.3)' : (isOwned ? 'rgba(255,255,255,0.05)' : '#111'), // [FIX] Brighter border on select
            { duration: 250 }
        );
    }, [isSelected, isOwned]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacitySV.value,
        borderColor: borderColorSV.value,
        // Static dark background to prevent "transparent black" interpolation issues
        backgroundColor: 'rgba(20, 20, 30, 0.4)',
    }));

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: selectionProgress.value,
        backgroundColor: pack.color, // Full color
    }));

    // We use a separate style to tint the background opacity instead of the whole background color
    const tintStyle = useAnimatedStyle(() => ({
        opacity: selectionProgress.value * 0.15, // Max 15% opacity of the color
        backgroundColor: pack.color,
    }));

    return (
        <Pressable
            onPress={() => onToggle(pack.id)}
            style={{ width: '48%' }}
        >
            <Animated.View style={[styles.packCard, { width: '100%' }, containerStyle, { overflow: 'hidden' }]}>
                {/* 1. Tint Layer (Background Color) */}
                <Animated.View style={[StyleSheet.absoluteFill, tintStyle]} />

                {/* 2. Selection Glow/Border Highlight could go here */}

                <View style={[styles.iconCircle, isSelected ? { backgroundColor: pack.color } : { backgroundColor: theme.colors.cardBg }]}>
                    {!isOwned ? (
                        <LockIcon size={14} color={theme.colors.textPrimary + '44'} />
                    ) : (
                        <Ionicons name={pack.icon} size={14} color={isSelected ? '#000' : theme.colors.textPrimary + '66'} />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.packName, isSelected && { color: pack.color }]} numberOfLines={1}>
                        {pack.name}
                    </Text>
                    <Text style={styles.packSub}>
                        {!isOwned ? (t.owned ? "LOCKED" : "LOCKED") : pack.sub}
                    </Text>
                </View>
                {isSelected && <View style={[styles.checkBadge, { backgroundColor: pack.color }]} />}

                <TouchableOpacity
                    style={styles.previewEye}
                    onPress={(e) => {
                        e.stopPropagation();
                        SoundService.play('tap');
                        onPreview && onPreview(pack.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <EyeIcon size={16} color="#666" />
                </TouchableOpacity>
            </Animated.View>
        </Pressable>
    );
});

const LobbySettingsPanel = ({ settings, updateSettings, isHost, onPreviewPack, unlockedPacks = {}, onOpenChaosRules }) => {
    const { language } = useLanguage();
    const { theme } = useTheme(); // [NEW]
    const t = translations[language];

    // [FIX] Initialize with correct positions based on current settings
    const dragXPoints = useSharedValue([3, 5, 7, 10].indexOf(settings.points) * 70);
    const dragXLang = useSharedValue(settings.language === 'en' ? 50 : 0);

    // [NEW] Anchors for Mid-Path Popping
    const startXPoints = useSharedValue(0);
    const targetXPoints = useSharedValue(0);
    const isDraggingPointsSV = useSharedValue(false);

    const startXLang = useSharedValue(0);
    const targetXLang = useSharedValue(0);
    const isDraggingLangSV = useSharedValue(false);

    const ptsScale = useLiquidScale(dragXPoints, startXPoints, targetXPoints, isDraggingPointsSV, 1.15);
    const langScale = useLiquidScale(dragXLang, startXLang, targetXLang, isDraggingLangSV, 1.15);

    // [FIX] Use Refs for PanResponder to avoid stale closures
    const settingsRef = useRef(settings);
    const isHostRef = useRef(isHost);
    const gestureStartIndexPoints = useRef(undefined);
    const touchedIndexPoints = useRef(undefined);
    const isGrabbingIndicatorPoints = useRef(false);
    const gestureStartLang = useRef(undefined);
    const touchedLang = useRef(undefined);
    const isGrabbingIndicatorLang = useRef(false);

    // [FIX] Flags to prevent state-change animations from fighting gesture animations
    const skipSyncPoints = useRef(false);
    const skipSyncLang = useRef(false);

    useEffect(() => {
        settingsRef.current = settings;
        isHostRef.current = isHost;
    }, [settings, isHost]);

    useEffect(() => {
        // [CRITICAL] Host NEVER animates via useEffect - only Guest syncs
        if (isHost) return;

        const targetX = [3, 5, 7, 10].indexOf(settings.points) * 70;

        // [FIX] Anchors
        startXPoints.value = dragXPoints.value;
        targetXPoints.value = targetX;

        dragXPoints.value = withSpring(targetX, { damping: 40, stiffness: 200, overshootClamping: true });
    }, [settings.points, isHost]);

    useEffect(() => {
        // [CRITICAL] Host NEVER animates via useEffect - only Guest syncs
        if (isHost) return;

        const targetX = settings.language === 'en' ? 50 : 0;

        // [FIX] Anchors
        startXLang.value = dragXLang.value;
        targetXLang.value = targetX;

        dragXLang.value = withSpring(targetX, { damping: 40, stiffness: 200, overshootClamping: true });
    }, [settings.language, isHost]);

    const togglePack = (packId) => {
        if (!isHost) return;

        // [RULE] Base Set cannot be deselected
        if (packId === 'base') {
            SoundService.play('error');
            return;
        }

        // [CHECK] Check ownership
        const isOwned = packId === 'base' || unlockedPacks[packId];

        if (!isOwned) {
            SoundService.play('error'); // Or 'lock'
            HapticsService.trigger('notificationError');
            return;
        }

        SoundService.play('tap');
        const newPacks = settings.packs.includes(packId)
            ? settings.packs.filter(p => p !== packId)
            : [...settings.packs, packId];
        updateSettings('packs', newPacks);
    };

    const handleLanguageChange = (lang) => {
        if (!isHost) return;
        SoundService.play('pop');
        updateSettings('language', lang);
    };

    const handlePointsChange = (pts) => {
        if (!isHost) return;
        SoundService.play('tap');
        updateSettings('points', pts);
    }

    const handleChaosChange = (val) => {
        if (!isHost) return;
        if (val) {
            SoundService.play('lock');
            HapticsService.trigger('heavy');
        } else {
            SoundService.play('tap');
        }
        updateSettings('chaosMode', val);
    }

    // [NEW] Points Drag Logic
    const pointsPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isHostRef.current,
            onMoveShouldSetPanResponder: () => isHostRef.current,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (!isHostRef.current) return;
                const { locationX } = evt.nativeEvent;
                const touchedIdx = Math.max(0, Math.min(3, Math.floor(locationX / 70)));
                touchedIndexPoints.current = touchedIdx;

                const currentPtsIndex = [3, 5, 7, 10].indexOf(settingsRef.current.points);
                gestureStartIndexPoints.current = currentPtsIndex;

                // [NEW] Restrict drag start & scale to indicator
                const isGrabbing = (touchedIdx === currentPtsIndex);
                isGrabbingIndicatorPoints.current = isGrabbing;

                if (isGrabbing) {
                    // Scale up only on grabbing
                    HapticsService.trigger('selection');
                    isDraggingPointsSV.value = true;
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isHostRef.current || !isGrabbingIndicatorPoints.current) return; // [FIX] No drag from empty
                const startX = (gestureStartIndexPoints.current ?? 0) * 70;
                let newX = startX + gestureState.dx; // RELATIVE movement
                if (newX < 0) newX = 0;
                if (newX > 210) newX = 210;
                dragXPoints.value = newX;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (!isHostRef.current) return;

                let targetIndex;
                const isClick = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;

                if (isClick) {
                    // [CLICK] Slide to the touched number (always allowed)
                    targetIndex = touchedIndexPoints.current;
                } else if (isGrabbingIndicatorPoints.current) {
                    // [DRAG] Snap to nearest from final position (only if grabbed indicator)
                    const startX = (gestureStartIndexPoints.current ?? 0) * 70;
                    const finalX = startX + gestureState.dx;
                    targetIndex = Math.max(0, Math.min(3, Math.round(finalX / 70)));
                } else {
                    // Ignore drag from empty zone
                    targetIndex = [3, 5, 7, 10].indexOf(settingsRef.current.points);
                }

                const newPts = [3, 5, 7, 10][targetIndex];
                const hasChanged = newPts !== settingsRef.current.points;

                if (hasChanged) {
                    skipSyncPoints.current = true;
                    handlePointsChange(newPts);
                    if (isClick) HapticsService.trigger('selection'); // Feedback on valid click
                }

                // [FIX] Anchors on release
                updateLiquidAnchors(startXPoints, targetXPoints, isDraggingPointsSV, dragXPoints.value, targetIndex * 70);

                // [SUBTLE BOUNCE] Use subtle spring for clicks
                dragXPoints.value = withSpring(targetIndex * 70, SNAP_SPRING_CONFIG);

                gestureStartIndexPoints.current = undefined;
            }
        })
    ).current;

    // [NEW] Language Drag Logic
    const langPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isHostRef.current,
            onMoveShouldSetPanResponder: () => isHostRef.current,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (!isHostRef.current) return;
                const { locationX } = evt.nativeEvent;
                const hitLang = locationX > 50 ? 'en' : 'ita';
                touchedLang.current = hitLang;

                const currentLang = settingsRef.current.language;
                gestureStartLang.current = currentLang;

                // [NEW] Restrict drag start & scale to indicator
                const isGrabbing = (hitLang === currentLang);
                isGrabbingIndicatorLang.current = isGrabbing;

                if (isGrabbing) {
                    // Scale up only on grabbing
                    HapticsService.trigger('selection');
                    isDraggingLangSV.value = true;
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isHostRef.current || !isGrabbingIndicatorLang.current) return; // [FIX] No drag from empty
                const startX = gestureStartLang.current === 'en' ? 50 : 0;
                let newX = startX + gestureState.dx;
                if (newX < 0) newX = 0;
                if (newX > 50) newX = 50;
                dragXLang.value = newX;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (!isHostRef.current) return;

                let targetLang;
                const isClick = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;

                if (isClick) {
                    // [CLICK] Move to hit lang
                    targetLang = touchedLang.current;
                } else if (isGrabbingIndicatorLang.current) {
                    // [DRAG] Snap to nearest (only if grabbed indicator)
                    const startX = gestureStartLang.current === 'en' ? 50 : 0;
                    const finalX = startX + gestureState.dx;
                    targetLang = finalX > 25 ? 'en' : 'ita';
                } else {
                    // Ignore drag from empty zone
                    targetLang = settingsRef.current.language;
                }

                const hasChanged = targetLang !== settingsRef.current.language;

                if (hasChanged) {
                    skipSyncLang.current = true;
                    handleLanguageChange(targetLang);
                    if (isClick) HapticsService.trigger('selection'); // Feedback on valid click
                }

                // [FIX] Anchors on release
                const targetPos = targetLang === 'en' ? 50 : 0;
                updateLiquidAnchors(startXLang, targetXLang, isDraggingLangSV, dragXLang.value, targetPos);

                // [SUBTLE BOUNCE] Use subtle spring for clicks
                dragXLang.value = withSpring(targetPos, SNAP_SPRING_CONFIG);

                gestureStartLang.current = undefined;
            }
        })
    ).current;


    // CHAOS PULSE ANIMATION REMOVED

    const animatedChaosStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(settings.chaosMode ? '#EF4444' : theme.colors.cardBorder, { duration: 300 }),
        backgroundColor: withTiming(settings.chaosMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)', { duration: 300 }),
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        color: withTiming(settings.chaosMode ? '#f87171' : theme.colors.textPrimary + '88', { duration: 300 }) // [REFINED] Softer red text
    }));

    // [NEW] Language Indicator Animation
    const langIndicatorStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(dragXLang.value, [0, 50], [0, 50], 'clamp')
            },
            { scale: langScale.value }
        ]
    }));


    const pointsIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: interpolate(dragXPoints.value, [0, 210], [0, 210], 'clamp')
                },
                { scale: ptsScale.value } // [FIX] Now independent
            ]
        };
    });

    const packData = [
        { id: 'base', name: t.base_pack, sub: t.starter_set, icon: 'layers', color: '#E6C25D' },
        { id: 'dark', name: t.dark_pack, sub: t.adult_content, icon: 'skull', color: '#A855F7' },
        { id: 'chill', name: t.pack_chill, sub: t.chill_content, icon: 'ice-cream', color: '#3B82F6' },
        { id: 'spicy', name: t.pack_spicy, sub: t.spicy_content, icon: 'flame', color: '#EF4444' },
    ];

    return (
        <View style={[styles.panelContainer, { borderColor: theme.colors.cardBorder }]}>

            {/* 1. LANGUAGE TOGGLE (Pill Style) */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>{t.room_language_label || "LANGUAGE"}</Text>
                <View
                    style={styles.langToggle}
                    {...langPanResponder.panHandlers}
                >
                    <Animated.View
                        style={[
                            styles.langIndicator,
                            langIndicatorStyle,
                            { backgroundColor: theme.colors.accentWeak }
                        ]}
                        pointerEvents="none"
                    />
                    {['en', 'ita'].map((lang, index) => (
                        <LanguageItem
                            key={lang}
                            lang={lang}
                            index={index}
                            dragX={dragXLang}
                            theme={theme}
                            displayLang={lang === 'en' ? 'ENG' : 'ITA'}
                        />
                    ))}
                </View>
            </View>

            {/* 2. PACKS GRID */}
            <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>{t.select_packages || "CONTENT PACKS"}</Text>
                <View style={styles.packGrid}>
                    {packData.map((pack) => (
                        <PackCard
                            key={pack.id}
                            pack={pack}
                            isSelected={settings.packs.includes(pack.id)}
                            isOwned={pack.id === 'base' || unlockedPacks[pack.id]}
                            onToggle={togglePack}
                            onPreview={onPreviewPack}
                            theme={theme}
                            t={t}
                        />
                    ))}
                </View>
            </View>

            {/* 3. POINTS SELECTOR (Animated) */}
            <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel]}>{t.points_to_win || "VICTORY POINTS"}</Text>
                <View
                    style={styles.pointsRow}
                    {...pointsPanResponder.panHandlers}
                >
                    <Animated.View
                        style={[
                            styles.pointIndicator,
                            pointsIndicatorStyle,
                            { backgroundColor: theme.colors.accent }
                        ]}
                        pointerEvents="none"
                    />
                    {[3, 5, 7, 10].map((pts, index) => (
                        <PointItem
                            key={pts}
                            pts={pts}
                            index={index}
                            dragX={dragXPoints}
                            theme={theme}
                        />
                    ))}
                </View>
            </View>

            {/* 4. CHAOS ENGINE (The Red Zone) */}
            <Animated.View style={[styles.chaosRow, animatedChaosStyle]}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Animated.Text style={[styles.chaosTitle, animatedTextStyle]}>
                            {t.chaos_mode_label}
                        </Animated.Text>
                        <TouchableOpacity
                            onPress={() => onOpenChaosRules && onOpenChaosRules()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textPrimary + '66'} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.chaosDesc}>{t.chaos_mode_desc || "Random events enabled."}</Text>
                </View>
                <PremiumToggle
                    value={settings.chaosMode}
                    onValueChange={(val) => handleChaosChange(val)}
                    activeColor="#EF4444"
                    size={22}
                />
            </Animated.View>

        </View>
    );
};

const styles = StyleSheet.create({
    panelContainer: {
        backgroundColor: 'rgba(20, 20, 20, 0.39)',
        borderRadius: 24,
        borderWidth: 1.5,
        padding: 20,
        width: '94%',
        alignSelf: 'center',
    },
    previewEye: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        padding: 2,
    },

    // LABELS
    sectionLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionBlock: {
        marginBottom: 20,
    },

    // LANGUAGE
    langToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    langOption: {
        width: 50, // Fixed width for easier animation
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 18,
        zIndex: 2,
    },
    langIndicator: {
        position: 'absolute',
        top: 2,
        left: 2,
        bottom: 2,
        width: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 1,
    },
    langActive: {
        // Handled by indicator
    },
    langText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    langTextActive: {
        color: '#FFF', // Always white/bright for active lang
    },

    // PACKS
    packGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    packCard: {
        width: '48%', // 2 per riga
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderRadius: 14, // [POLISH] More rounded
        padding: 10,
        gap: 10,
    },
    iconCircle: {
        width: 32, // [POLISH] Slightly bigger
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    packName: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    packSub: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 9,
    },
    checkBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 6,
        height: 6,
        borderRadius: 3,
    },

    // POINTS
    pointsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 5,
        alignSelf: 'center',
        gap: 10,
    },
    pointBox: {
        width: 60, // [FIX] Fixed width for animation alignment
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        zIndex: 2,
    },
    pointIndicator: {
        position: 'absolute',
        top: 5,
        left: 5,
        width: 60,
        height: 60,
        borderRadius: 15,
        zIndex: 1,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeGlow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    pointNum: {
        fontSize: 20,
        fontWeight: '900',
    },
    pointLabel: {
        fontSize: 10, // [FIX] Larger PTS label
        fontWeight: 'bold',
    },

    // CHAOS
    chaosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12, // [POLISH] More padding
        borderRadius: 16, // [POLISH] Matches containers
        borderWidth: 1.5,
        marginTop: 10,
    },
    chaosRowActive: {
        borderColor: '#EF4444', // RED BORDER
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // RED TINT
    },
    chaosTitle: {
        color: '#313131ff', // [FIX] Even less white (dark gray)
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    chaosDesc: {
        color: '#444', // [FIX] Dimmer description
        fontSize: 10,
    },
});

export default LobbySettingsPanel;
