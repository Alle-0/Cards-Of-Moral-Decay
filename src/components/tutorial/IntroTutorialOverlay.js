import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle, RRect } from 'react-native-svg';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import SoundService from '../../services/SoundService';
import { TutorialRegistry } from '../../utils/TutorialRegistry';

const { width, height } = Dimensions.get('window');

// Define the tutorial steps with hardcoded or calculated positions
const getTutorialSteps = (insets, width, height) => {
    // Bottom Tab Bar item width approximation
    const tabWidth = width * 0.94;
    const itemWidth = tabWidth / 5;
    const barMarginBottom = insets.bottom > 0 ? insets.bottom : 10;
    const barCenterY = height - barMarginBottom - 30; // 30 is half of height 60
    const startX = (width - tabWidth) / 2;

    // Y-Offset calculations based on LobbyScreen layout:
    // Scroll Container paddingTop + Profile Button + Frame marging/padding -> Approx 170-190px from top
    const baseTop = Math.max(160, height * 0.22);

    return [
        {
            id: 'quickjoin',
            textKey: 'tut_quickjoin',
            shape: 'rect',
            x: width * 0.08,
            y: baseTop,
            w: width * 0.84,
            h: 75,
            tooltipPos: 'bottom',
        },
        {
            id: 'create_code',
            textKey: 'tut_create_code',
            shape: 'rect',
            x: width * 0.08,
            y: baseTop + 95,
            w: width * 0.84,
            h: 55,
            tooltipPos: 'bottom',
        },
        {
            id: 'rooms',
            textKey: 'tut_rooms',
            shape: 'rect',
            x: width * 0.05,
            y: baseTop + 180,
            w: width * 0.9,
            h: 160, // Highlight the room list area
            tooltipPos: 'bottom',
        },
        {
            id: 'shop',
            textKey: 'tut_shop',
            shape: 'circle',
            cx: startX + (itemWidth * 0.5),
            cy: barCenterY,
            r: 30,
            tooltipPos: 'top',
        },
        {
            id: 'style',
            textKey: 'tut_style',
            shape: 'circle',
            cx: startX + (itemWidth * 1.5),
            cy: barCenterY,
            r: 30,
            tooltipPos: 'top',
        },
        {
            id: 'friends',
            textKey: 'tut_friends',
            shape: 'circle',
            cx: startX + (itemWidth * 3.5),
            cy: barCenterY,
            r: 30,
            tooltipPos: 'top',
        },
        {
            id: 'settings',
            textKey: 'tut_settings',
            shape: 'circle',
            cx: startX + (itemWidth * 4.5),
            cy: barCenterY,
            r: 30,
            tooltipPos: 'top',
        }
    ];
};

const IntroTutorialOverlay = ({ visible, onFinish }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [measuredSteps, setMeasuredSteps] = useState([]);

    useEffect(() => {
        let isMounted = true;
        if (visible) {
            setCurrentStepIndex(0);
            setMeasuredSteps([]); // reset

            const measureAll = async () => {
                // Poll for elements to mount and get layout
                for (let i = 0; i < 15; i++) {
                    if (!isMounted) return;
                    try {
                        const qj = await TutorialRegistry.measure('quickjoin');
                        const cc = await TutorialRegistry.measure('create_code');
                        const rm = await TutorialRegistry.measure('rooms');

                        if (qj && cc && rm && qj.width > 0) {
                            const baseSteps = getTutorialSteps(insets, width, height);

                            // Override the first 3 layout-dependent steps dynamically
                            // Add slight padding to the measured bounds (+10px) 
                            baseSteps[0].x = qj.x - 5;
                            baseSteps[0].y = qj.y - 5;
                            baseSteps[0].w = qj.width + 10;
                            baseSteps[0].h = qj.height + 10;

                            baseSteps[1].x = cc.x - 5;
                            baseSteps[1].y = cc.y - 5;
                            baseSteps[1].w = cc.width + 10;
                            baseSteps[1].h = cc.height + 10;

                            baseSteps[2].x = rm.x - 5;
                            baseSteps[2].y = rm.y - 5;
                            baseSteps[2].w = rm.width + 10;
                            baseSteps[2].h = rm.height + 10;

                            setMeasuredSteps(baseSteps);
                            SoundService.play('pop');
                            return;
                        }
                    } catch (e) { console.warn(e); }

                    await new Promise(r => setTimeout(r, 100)); // wait 100ms
                }

                // Fallback to static calculations if registry fails after 1.5s
                if (isMounted) {
                    setMeasuredSteps(getTutorialSteps(insets, width, height));
                    SoundService.play('pop');
                }
            };

            measureAll();
        }
        return () => { isMounted = false; };
    }, [visible, insets]);

    if (!visible || measuredSteps.length === 0) return null;

    const currentStep = measuredSteps[currentStepIndex];

    const handleNext = () => {
        SoundService.play('click');
        if (currentStepIndex < measuredSteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            if (onFinish) onFinish();
        }
    };

    const handlePrev = () => {
        SoundService.play('click');
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    // Calculate Tooltip Position
    const getTooltipStyle = () => {
        if (!currentStep) return {};

        const style = {
            position: 'absolute',
            left: 20,
            right: 20,
            backgroundColor: 'rgba(15, 15, 15, 0.98)',
            padding: 20,
            borderRadius: 15,
            borderWidth: 1.5,
            borderColor: theme.colors.accent,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 10,
            alignItems: 'center'
        };

        if (currentStep.tooltipPos === 'bottom') {
            style.top = currentStep.shape === 'rect' ? currentStep.y + currentStep.h + 20 : currentStep.cy + currentStep.r + 20;
        } else {
            // 'top'
            style.bottom = height - (currentStep.shape === 'rect' ? currentStep.y : currentStep.cy - currentStep.r) + 20;
        }

        return style;
    };

    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}
        >
            <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={handleNext}
            >
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                    <Defs>
                        <Mask id="spotlightMask">
                            {/* Everything white is visible (the dark overlay) */}
                            <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {/* Everything black is transparent (the spotlight cutout) */}
                            {currentStep.shape === 'circle' ? (
                                <Circle
                                    cx={currentStep.cx}
                                    cy={currentStep.cy}
                                    r={currentStep.r}
                                    fill="black"
                                />
                            ) : (
                                <Rect
                                    x={currentStep.x}
                                    y={currentStep.y}
                                    width={currentStep.w}
                                    height={currentStep.h}
                                    rx={15}
                                    ry={15}
                                    fill="black"
                                />
                            )}
                        </Mask>
                    </Defs>

                    {/* The semi-transparent dark background */}
                    <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(0,0,0,0.85)"
                        mask="url(#spotlightMask)"
                    />
                </Svg>

                <Animated.View
                    key={`step-${currentStepIndex}`} // Force re-render/animation on step change
                    layout={Layout.springify().damping(15)}
                    entering={FadeIn.duration(300).delay(100)}
                    exiting={FadeOut.duration(200)}
                    style={getTooltipStyle()}
                >
                    <Text style={[styles.tooltipText, { color: '#ffffff' }]}>
                        {t(currentStep.textKey)}
                    </Text>

                    <View style={styles.navRow}>
                        {currentStepIndex > 0 && (
                            <TouchableOpacity onPress={handlePrev} style={styles.navButton} activeOpacity={0.7}>
                                <Text style={[styles.prevText, { color: 'rgba(255,255,255,0.6)' }]}>
                                    &larr; {t('tut_prev')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleNext} style={styles.navButton} activeOpacity={0.7}>
                            <Text style={[styles.nextText, { color: theme.colors.accent }]}>
                                {currentStepIndex < measuredSteps.length - 1 ? `${t('tut_next')} \u2192` : t('tut_finish')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    tooltipText: {
        fontFamily: 'Outfit',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        gap: 20,
    },
    navButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    prevText: {
        fontFamily: 'OutfitBold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    nextText: {
        fontFamily: 'OutfitBold',
        fontSize: 16,
        textTransform: 'uppercase',
    }
});

export default React.memo(IntroTutorialOverlay);

