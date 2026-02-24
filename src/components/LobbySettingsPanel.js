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

const PointItem = ({ pts, index, dragX, theme, onPress }) => {
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
        <Pressable
            onPress={() => onPress && onPress(pts)}
            style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 15, zIndex: 2 }}
        >
            <Animated.Text style={[{ fontSize: 20, lineHeight: 22, marginTop: 2 }, textStyle]}>
                {pts}
            </Animated.Text>
            <Animated.Text style={[{ fontSize: 8, fontWeight: 'bold', lineHeight: 10 }, textStyle]}>PTS</Animated.Text>
        </Pressable>
    );
};

const LanguageItem = ({ lang, index, dragX, theme, displayLang, onPress }) => {
    const textStyle = useAnimatedStyle(() => {
        const itemCenter = index * 52; // [FIX] Stride 52
        const color = interpolateColor(
            dragX.value,
            [itemCenter - 52, itemCenter, itemCenter + 52], // [FIX] Stride 52
            ['rgba(255,255,255,0.3)', '#FFFFFF', 'rgba(255,255,255,0.3)']
        );
        return { color, fontWeight: 'bold' };
    });

    return (
        <Pressable
            onPress={() => onPress && onPress(lang)}
            style={{ width: 52, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2 }} // [FIX] Width 52
        >
            <Animated.Text style={[{ fontSize: 12 }, textStyle]}>
                {displayLang}
            </Animated.Text>
        </Pressable>
    );
};

// [NEW] Memoized Animated Pack Card to prevent glitches
const PackCard = React.memo(({ pack, isSelected, isOwned, onToggle, onPreview, theme, t }) => {
    // Shared Values for animation
    const opacitySV = useSharedValue(isSelected ? 1 : (isOwned ? 0.8 : 0.5)); // [FIX] Higher base opacity to avoid "muddy" look
    const selectionProgress = useSharedValue(isSelected ? 1 : 0);
    const borderColorSV = useSharedValue(isSelected ? theme.colors.accent : (isOwned ? 'rgba(255,255,255,0.05)' : '#111'));

    useEffect(() => {
        opacitySV.value = withSpring(
            isSelected ? 1 : (isOwned ? 0.8 : 0.5),
            SNAP_SPRING_CONFIG
        );
        selectionProgress.value = withSpring(
            isSelected ? 1 : 0,
            SNAP_SPRING_CONFIG
        );
        borderColorSV.value = withSpring(
            isSelected ? 'rgba(255,255,255,0.3)' : (isOwned ? 'rgba(255,255,255,0.05)' : '#111'),
            SNAP_SPRING_CONFIG
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
    const dragXLang = useSharedValue(settings.language === 'en' ? 0 : 52); // [FIX] En=0(Left), Ita=52(Right)

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

        dragXPoints.value = withSpring(targetX, SNAP_SPRING_CONFIG);
    }, [settings.points, isHost]);

    useEffect(() => {
        // [CRITICAL] Host NEVER animates via useEffect - only Guest syncs
        if (isHost) return;

        const targetX = settings.language === 'en' ? 0 : 52; // [FIX] En=0, Ita=52

        // [FIX] Anchors
        startXLang.value = dragXLang.value;
        targetXLang.value = targetX;

        dragXLang.value = withSpring(targetX, SNAP_SPRING_CONFIG);
    }, [settings.language, isHost]);

    const togglePack = (packId) => {
        if (!isHost) return;

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

        // [FIX] Host needs to animate local UI manually (useEffect is skipped)
        const targetPos = lang === 'en' ? 0 : 52;
        dragXLang.value = withSpring(targetPos, SNAP_SPRING_CONFIG);
    };

    const handlePointsChange = (pts) => {
        if (!isHost) return;
        SoundService.play('tap');
        updateSettings('points', pts);

        // [FIX] Host needs to animate local UI manually (useEffect is skipped)
        const targetIndex = [3, 5, 7, 10].indexOf(pts);
        if (targetIndex !== -1) {
            dragXPoints.value = withSpring(targetIndex * 70, SNAP_SPRING_CONFIG);
        }
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
            // [FIX] ANDROID SCROLL: Do NOT claim immediately. Let Pressable receive touch.
            onStartShouldSetPanResponder: () => false,
            // [FIX] Capture ONLY if horizontal drag is significant > 10 AND > vertical drag
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const { dx, dy } = gestureState;
                return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                if (!isHostRef.current) return;

                // [FIX] If we capture late (after move), we need to set initial state correctly
                const currentPtsIndex = [3, 5, 7, 10].indexOf(settingsRef.current.points);
                gestureStartIndexPoints.current = currentPtsIndex;
                isGrabbingIndicatorPoints.current = true;

                HapticsService.trigger('selection');
                isDraggingPointsSV.value = true;
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isHostRef.current) return;
                const startX = (gestureStartIndexPoints.current ?? 0) * 70;
                let newX = startX + gestureState.dx;

                // Clamp
                if (newX < 0) newX = 0;
                if (newX > 210) newX = 210;
                dragXPoints.value = newX; // [OPTIMIZATION]
            },
            onPanResponderRelease: (_, gestureState) => {
                if (!isHostRef.current) return;

                // [FIX] Only handle DRAG snap here. Clicks are handled by Pressable.
                const startX = (gestureStartIndexPoints.current ?? 0) * 70;
                const finalX = startX + gestureState.dx;
                const targetIndex = Math.max(0, Math.min(3, Math.round(finalX / 70)));

                const newPts = [3, 5, 7, 10][targetIndex];
                const hasChanged = newPts !== settingsRef.current.points;

                if (hasChanged) {
                    skipSyncPoints.current = true;
                    handlePointsChange(newPts);
                } else {
                    // Snap back
                    dragXPoints.value = withSpring(targetIndex * 70, SNAP_SPRING_CONFIG);
                }

                // [FIX] Anchors on release
                updateLiquidAnchors(startXPoints, targetXPoints, isDraggingPointsSV, dragXPoints.value, targetIndex * 70);

                gestureStartIndexPoints.current = undefined;
            }
        })
    ).current;

    // [NEW] Language Drag Logic
    const langPanResponder = useRef(
        PanResponder.create({
            // [FIX] ANDROID SCROLL: Do NOT claim immediately. Let ScrollView decide.
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // [FIX] Capture ONLY if horizontal drag is significant > 10 AND > vertical drag
                if (!isHostRef.current) return false;
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (!isHostRef.current) return;
                // [OPTIMIZATION] Avoid unnecessary state updates / refs if possible
                const currentLang = settingsRef.current.language;
                gestureStartLang.current = currentLang;

                const isGrabbing = true;
                isGrabbingIndicatorLang.current = isGrabbing;

                if (isGrabbing) {
                    HapticsService.trigger('selection');
                    isDraggingLangSV.value = true;
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isHostRef.current) return;
                const startX = gestureStartLang.current === 'en' ? 0 : 52;
                let newX = startX + gestureState.dx;
                if (newX < 0) newX = 0;
                if (newX > 52) newX = 52;
                dragXLang.value = newX; // [OPTIMIZATION] Directly setting SharedValue (UI Thread)
            },
            onPanResponderRelease: (_, gestureState) => {
                if (!isHostRef.current) return;

                const startX = gestureStartLang.current === 'en' ? 0 : 52;
                const finalX = startX + gestureState.dx;
                const targetLang = finalX > 26 ? 'ita' : 'en';

                const hasChanged = targetLang !== settingsRef.current.language;

                if (hasChanged) {
                    skipSyncLang.current = true;
                    handleLanguageChange(targetLang); // Triggers JS state update
                } else {
                    // [FIX] If no change, snap back logic
                    const targetPos = targetLang === 'en' ? 0 : 52;
                    dragXLang.value = withSpring(targetPos, SNAP_SPRING_CONFIG);
                }

                updateLiquidAnchors(startXLang, targetXLang, isDraggingLangSV, dragXLang.value, targetLang === 'en' ? 0 : 52);
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
                translateX: dragXLang.value // [FIX] Removed clamp to allow spring bounce
            },
            { scale: langScale.value }
        ]
    }));


    const pointsIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: dragXPoints.value // [FIX] Removed clamp to allow spring bounce
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
                            onPress={handleLanguageChange}
                        />
                    ))}
                </View>
            </View>

            {/* 2. PACKS GRID */}
            <View style={styles.sectionBlock}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t.select_packages || "CONTENT PACKS"}</Text>
                    {(!settings.packs || settings.packs.length === 0) && (
                        <Text style={{ color: '#EF4444', fontSize: 10, fontFamily: 'Outfit-Bold' }}>
                            {t.select_at_least_one_pack || "Seleziona almeno un pack"}
                        </Text>
                    )}
                </View>
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
                            onPress={handlePointsChange}
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
        padding: 16, // [COMPACT] Reduced from 20
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
        marginBottom: 10, // [COMPACT] Reduced from 20
    },
    sectionBlock: {
        marginBottom: 12, // [COMPACT] Reduced from 20
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
        width: 52, // [FIX] Width 52 to match stride
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
        width: 52, // [FIX] Width 52 to match stride
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
        gap: 8, // [COMPACT] Reduced from 10
    },
    packCard: {
        width: '48%', // 2 per riga
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderRadius: 14, // [POLISH] More rounded
        padding: 8, // [COMPACT] Reduced from 10
        gap: 8, // [COMPACT] Reduced from 10
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
        marginTop: 5, // [COMPACT] Reduced from 10
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
