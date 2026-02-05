import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Image, Text, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
    interpolate,
    cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// ============================================
// 1. MATRIX RAIN (Optimized + Cleanup)
// ============================================
const MatrixRain = React.memo(() => {
    const { randomX, trailChars, headChar, duration } = useMemo(() => {
        const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789';
        const trailLen = 12 + Math.floor(Math.random() * 10);
        return {
            randomX: Math.random() * width,
            headChar: chars.charAt(Math.floor(Math.random() * chars.length)),
            trailChars: Array.from({ length: trailLen }, () => chars.charAt(Math.floor(Math.random() * chars.length))),
            duration: 3000 + Math.random() * 1000 // Restored original speed
        };
    }, []);

    const translateY = useSharedValue(-600);

    useEffect(() => {
        translateY.value = withTiming(height + 600, { duration, easing: Easing.linear });
        return () => cancelAnimation(translateY);
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateX: randomX }, { translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.matrixColumn, style]}>
            {trailChars.map((char, i) => (
                <Text key={i} style={[styles.matrixText, { opacity: Math.pow((i + 1) / trailChars.length, 3) * 0.8, fontSize: 18, marginBottom: -5 }]}>
                    {char}
                </Text>
            ))}
            <Text style={[styles.matrixText, { opacity: 1, color: '#00ff41', fontSize: 22, textShadowRadius: 15, fontWeight: 'bold', marginTop: -2, textShadowColor: '#00ff41' }]}>
                {headChar}
            </Text>
        </Animated.View>
    );
});

// ============================================
// 1B. POLICE LIGHTS (Red/Blue Strobe)
// ============================================
const PoliceLights = React.memo(() => {
    const opacityBlue = useSharedValue(0);
    const opacityRed = useSharedValue(0);

    useEffect(() => {
        // [REFINED] Much slower alternating effect ("Mooolto più lento")
        opacityBlue.value = withRepeat(withSequence(
            withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }), // Fade in
            withTiming(0.3, { duration: 1000 }), // Hold
            withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }), // Fade out
            withTiming(0, { duration: 4000 }) // Wait for red (overlap slightly less)
        ), -1, false);

        opacityRed.value = withDelay(4000, withRepeat(withSequence(
            withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 1000 }),
            withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 4000 })
        ), -1, false));

        return () => { cancelAnimation(opacityBlue); cancelAnimation(opacityRed); };
    }, []);

    const styleBlue = useAnimatedStyle(() => ({
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '65%', // Overlap past center
        opacity: opacityBlue.value
    }));

    const styleRed = useAnimatedStyle(() => ({
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '65%', // Overlap past center
        opacity: opacityRed.value
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            <Animated.View style={styleBlue}>
                <LinearGradient
                    colors={['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0)']} // Blue -> Transparent
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
            <Animated.View style={styleRed}>
                <LinearGradient
                    colors={['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.8)']} // Transparent -> Red
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
});

// ============================================
// 2. PULSAR RIPPLE (Optimized + Cleanup)
// ============================================
const PulsarRipple = React.memo(({ color }) => {
    const { x, y } = useMemo(() => ({ x: Math.random() * (width - 100), y: Math.random() * (height - 100) }), []);
    return (
        <View style={{ position: 'absolute', left: x, top: y }}>
            {[0, 600, 1200, 1800].map((delay, i) => <RippleRing key={i} delay={delay} color={color} />)}
        </View>
    );
});

const RippleRing = React.memo(({ delay, color }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0.8);

    useEffect(() => {
        scale.value = withDelay(delay, withTiming(4, { duration: 4000, easing: Easing.out(Easing.ease) }));
        opacity.value = withDelay(delay, withTiming(0, { duration: 4000 }));
        return () => { cancelAnimation(scale); cancelAnimation(opacity); };
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
        borderColor: color,
        borderWidth: interpolate(scale.value, [0, 4], [4, 0.5]),
    }));

    return <Animated.View style={[styles.ripple, style]} />;
});

// ============================================
// 3. DUST PARTICLES (Cleanup)
// ============================================
const DustParticle = React.memo(({ color }) => {
    const { x, y, size, duration, delay } = useMemo(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        duration: 3000 + Math.random() * 4000,
        delay: Math.random() * 8000 // Spreads spawns over 8 seconds
    }), []);

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0.8, { duration: duration / 2 }), withTiming(0, { duration: duration / 2 })), -1, true));
        translateY.value = withDelay(delay, withRepeat(withTiming(-50, { duration, easing: Easing.linear }), -1, true));
        return () => { cancelAnimation(opacity); cancelAnimation(translateY); };
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute', left: x, top: y, width: size + 4, height: size + 4, opacity: opacity.value * 0.9,
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <Animated.View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{
                width: '100%', height: '100%', borderRadius: (size + 4) / 2, backgroundColor: color,
                shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8,
                overflow: 'hidden'
            }}>
                <View style={{
                    position: 'absolute', top: '20%', left: '20%', width: '40%', height: '40%',
                    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10,
                }} />
            </View>
        </Animated.View>
    );
});

// ============================================
// 4. ASH PARTICLES (Warm Start + Cleanup)
// ============================================
const AshParticle = React.memo(({ color }) => {
    const { startX, size, duration, delay, initialY } = useMemo(() => ({
        startX: Math.random() * width,
        size: Math.random() * 4 + 2,
        duration: 4000 + Math.random() * 3000,
        delay: Math.random() * 5000, // Reduced delay for immediate fill
        initialY: Math.random() * height // Start anywhere
    }), []);

    const translateY = useSharedValue(initialY);
    const translateX = useSharedValue(startX);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Calculate partial duration for first run
        const fullDist = (height + 20) - (-50);
        const firstDist = initialY - (-50);
        const firstDuration = (firstDist / fullDist) * duration;

        translateY.value = withDelay(delay, withSequence(
            withTiming(-50, { duration: firstDuration, easing: Easing.linear }),
            withRepeat(withSequence(
                withTiming(height + 20, { duration: 0 }),
                withTiming(-50, { duration: duration, easing: Easing.linear })
            ), -1)
        ));

        translateX.value = withDelay(delay, withRepeat(withSequence(withTiming(startX + 30, { duration: 2000 }), withTiming(startX - 30, { duration: 2000 })), -1, true));
        opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0, { duration: duration - 1000 })), -1));

        return () => { cancelAnimation(translateY); cancelAnimation(translateX); cancelAnimation(opacity); };
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute', width: size, height: size, backgroundColor: color, borderRadius: size / 2, // Rounder for softness
        ...(Platform.OS !== 'android' ? {
            shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
        } : {}),
        opacity: opacity.value, transform: [{ translateX: translateX.value }, { translateY: translateY.value }]
    }));

    return <Animated.View style={style} />;
});

// ============================================
// 5. BUBBLE PARTICLES (Warm Start + Refined Sway)
// ============================================
const BubbleParticle = React.memo(({ color }) => {
    const { startX, size, duration, delay, swayAmount, initialY } = useMemo(() => ({
        startX: Math.random() * width,
        size: Math.random() * 20 + 10,
        duration: 5000 + Math.random() * 4000,
        delay: Math.random() * 5000,
        swayAmount: Math.random() * 40 + 20,
        initialY: Math.random() * height
    }), []);

    const translateY = useSharedValue(initialY);
    const translateX = useSharedValue(startX);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        const fullDist = (height + 50) - (-100);
        const firstDist = initialY - (-100);
        const firstDuration = (firstDist / fullDist) * duration;

        translateY.value = withDelay(delay, withSequence(
            withTiming(-100, { duration: firstDuration, easing: Easing.linear }),
            withRepeat(withSequence(
                withTiming(height + 50, { duration: 0 }),
                withTiming(-100, { duration: duration, easing: Easing.linear })
            ), -1)
        ));

        // Random Sway
        translateX.value = withDelay(delay, withRepeat(withSequence(
            withTiming(startX + swayAmount, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
            withTiming(startX - swayAmount, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ), -1, true));

        scale.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(1, { duration: duration - 1500 }), withTiming(0, { duration: 500 })), -1));
        opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0.2, { duration: 500 }), withTiming(0.2, { duration: duration - 1000 }), withTiming(0, { duration: 500 })), -1));

        return () => { cancelAnimation(translateY); cancelAnimation(translateX); cancelAnimation(scale); cancelAnimation(opacity); };
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: 0.5, // Slightly more visible border but very transparent
        borderColor: color, // We will use opacity to soften
        backgroundColor: 'rgba(255, 255, 255, 0.01)', // Almost invisible fill
        ...(Platform.OS !== 'android' ? {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2, // Subtle glow
            shadowRadius: 20, // Very diffuse
        } : {}),
        opacity: opacity.value, transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }]
    }));

    return (
        <Animated.View style={style}>
            <View style={{
                position: 'absolute', top: '15%', left: '20%', width: '25%', height: '15%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Extremely subtle glint
                borderRadius: 20, transform: [{ rotate: '-45deg' }]
            }} />
        </Animated.View>
    );
});

// ============================================
// 6. SNOW/PETAL PARTICLES (Warm Start)
// ============================================
const SnowParticle = React.memo(({ colorEmoji, theme }) => { // Added theme prop
    const { startX, size, duration, delay, rotationDir, initialY } = useMemo(() => ({
        startX: Math.random() * width,
        size: Math.random() * 10 + 10,
        duration: 6000 + Math.random() * 4000,
        delay: Math.random() * 5000,
        rotationDir: Math.random() > 0.5 ? 1 : -1,
        initialY: Math.random() * height
    }), []);

    const translateY = useSharedValue(initialY);
    const translateX = useSharedValue(startX);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        const fullDist = (height + 50) - (-50);
        const firstDist = (height + 50) - initialY;
        const firstDuration = (firstDist / fullDist) * duration;

        translateY.value = withDelay(delay, withSequence(
            withTiming(height + 50, { duration: firstDuration, easing: Easing.linear }),
            withRepeat(withSequence(
                withTiming(-50, { duration: 0 }),
                withTiming(height + 50, { duration: duration, easing: Easing.linear })
            ), -1)
        ));

        translateX.value = withDelay(delay, withRepeat(withSequence(withTiming(startX + 50, { duration: 3000 }), withTiming(startX - 50, { duration: 3000 })), -1, true));
        rotation.value = withDelay(delay, withRepeat(withTiming(360 * rotationDir, { duration: 5000, easing: Easing.linear }), -1));
        opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(1, { duration: duration - 2000 }), withTiming(0, { duration: 1000 })), -1));

        return () => { cancelAnimation(translateY); cancelAnimation(translateX); cancelAnimation(rotation); cancelAnimation(opacity); };
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotation.value}deg` }]
    }));

    return (
        <Animated.View style={[
            style,
            {
                width: 16,
                height: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.colors.particle || theme.colors.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
            }
        ]}>
            <View style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: theme.colors.particle || theme.colors.accent,
                overflow: 'hidden'
            }}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.5, y: 0.5 }}
                />
                {/* Glossy reflection */}
                <View style={{
                    position: 'absolute',
                    top: '15%',
                    left: '20%',
                    width: '35%',
                    height: '35%',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    borderRadius: 10,
                }} />
            </View>
        </Animated.View>
    );
});

// ============================================
// 7. LIGHT SWEEP (Cleanup)
// ============================================
const LightSweep = React.memo(() => {
    const translateX = useSharedValue(-width * 2);

    useEffect(() => {
        translateX.value = withRepeat(withDelay(10000, withTiming(width * 2, { duration: 3000, easing: Easing.inOut(Easing.ease) })), -1);
        return () => cancelAnimation(translateX);
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute', top: 0, bottom: 0, width: 150, // Più largo per sfumatura più morbida
        transform: [{ translateX: translateX.value }, { skewX: '-20deg' }]
    }));

    return (
        <Animated.View style={style}>
            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']} // Molto più sottile (0.05)
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />
        </Animated.View>
    );
});

// ============================================
// 8. SMOKE EFFECT (Slow Rotation & Subtle Movement)
// ============================================
const SmokePuff = React.memo(() => {
    const { x, y, size, duration, delay, rotation } = useMemo(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 300 + Math.random() * 200,
        duration: 8000 + Math.random() * 4000,
        delay: Math.random() * 5000,
        rotation: Math.random() * 360
    }), []);

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(withSequence(
            withTiming(0.25, { duration: duration / 2 }),
            withTiming(0, { duration: duration / 2 })
        ), -1));
        scale.value = withDelay(delay, withRepeat(withTiming(1.2, { duration, easing: Easing.out(Easing.sin) }), -1));
        return () => { cancelAnimation(opacity); cancelAnimation(scale); };
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
        opacity: opacity.value,
        transform: [{ scale: scale.value }, { rotate: `${rotation}deg` }]
    }));

    return (
        <Animated.Image
            source={require('../../assets/textures/smoke.png')}
            style={style}
            resizeMode="contain"
        />
    );
});

// ============================================
// 9. CURRENCY RAIN (Custom Matrix Rain)
// ============================================
const CurrencyRain = React.memo(() => {
    const { randomX, trailChars, headChar, duration, color } = useMemo(() => {
        const currencies = ['$', '€', '£', '¥', '₿', '📈', '📉', '💰'];
        const trailLen = 8 + Math.floor(Math.random() * 6);
        return {
            randomX: Math.random() * width,
            headChar: currencies[Math.floor(Math.random() * currencies.length)],
            trailChars: Array.from({ length: trailLen }, () => currencies[Math.floor(Math.random() * currencies.length)]),
            duration: 4000 + Math.random() * 2000, // Restored original speed
            color: '#10b981' // Wall Street Green
        };
    }, []);

    const translateY = useSharedValue(-400);

    useEffect(() => {
        translateY.value = withTiming(height + 400, { duration, easing: Easing.linear });
        return () => cancelAnimation(translateY);
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateX: randomX }, { translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.matrixColumn, style]}>
            {trailChars.map((char, i) => (
                <Text key={i} style={[styles.matrixText, { color, opacity: (i + 1) / trailChars.length * 0.5, fontSize: 16 }]}>
                    {char}
                </Text>
            ))}
            <Text style={[styles.matrixText, { color, opacity: 1, fontSize: 20, fontWeight: 'bold' }]}>
                {headChar}
            </Text>
        </Animated.View>
    );
});

// ============================================
// 10. VOID FLOAT (Slow, eerie eyes)
// ============================================
const VoidFloatParticle = React.memo(({ color }) => {
    const { x, y, size, duration, delay } = useMemo(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 40 + 20,
        duration: 8000 + Math.random() * 4000,
        delay: Math.random() * 5000
    }), []);

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(withSequence(
            withTiming(0.4, { duration: duration / 2 }),
            withTiming(0, { duration: duration / 2 })
        ), -1));
        scale.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
        return () => { cancelAnimation(opacity); cancelAnimation(scale); };
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute', left: x, top: y, width: size, height: size / 2,
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    return (
        <Animated.View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
            <Svg height="100%" width="100%" viewBox="0 0 100 50">
                <Ellipse cx="50" cy="25" rx="45" ry="20" stroke={color} strokeWidth="2" />
                <Circle cx="50" cy="25" r="10" fill={color} />
            </Svg>
        </Animated.View>
    );
});

// MAIN COMPONENT
// ============================================
const ThemeBackground = ({ visible = true, forceTheme = null }) => {
    const { theme: contextTheme, animationsEnabled } = useTheme(); // [FIX] Get toggle
    const theme = forceTheme || contextTheme;
    const [elements, setElements] = useState([]);

    const containerOpacity = useSharedValue(visible ? 1 : 0);

    useEffect(() => {
        containerOpacity.value = withTiming(visible ? 1 : 0, { duration: 500 });
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value
    }));

    // [FIX] Global Opacity for smooth toggle
    const particlesOpacity = useSharedValue(animationsEnabled ? 1 : 0);

    useEffect(() => {
        particlesOpacity.value = withTiming(animationsEnabled ? 1 : 0, { duration: 800 });

        if (!animationsEnabled) {
            // Wait for fade out before clearing logic (cleanup)
            const timer = setTimeout(() => setElements([]), 800);
            return () => clearTimeout(timer);
        }
    }, [animationsEnabled]);

    const particlesStyle = useAnimatedStyle(() => ({
        opacity: particlesOpacity.value
    }));

    useEffect(() => {
        if (!animationsEnabled) return; // Logic handled above for exit

        setElements([]); // Clear on theme change

        if (['matrix', 'pulsar', 'wallstreet'].includes(theme.id)) {
            const intervalTime = theme.id === 'matrix' ? 12000 : (theme.id === 'wallstreet' ? 10000 : 18000);
            const maxElements = theme.id === 'matrix' ? 3 : (theme.id === 'wallstreet' ? 4 : 2);

            const interval = setInterval(() => {
                const randomDelay = Math.random() * 2000;
                setTimeout(() => {
                    setElements(prev => [...prev.slice(-(maxElements - 1)), { id: Date.now(), type: theme.id }]);
                }, randomDelay);
            }, intervalTime);
            return () => clearInterval(interval);
        } else {
            const count = theme.particleConfig === 'dust' ? 4 :
                theme.particleConfig === 'ash' ? 3 :
                    theme.particleConfig === 'bubble' || theme.particleConfig === 'toxicBubble' ? 3 :
                        theme.particleConfig === 'snow' ? 3 :
                            theme.particleConfig === 'smoke' ? 5 :
                                theme.particleConfig === 'voidFloat' ? 6 : 0;

            if (count > 0) {
                setElements(Array.from({ length: count }).map((_, i) => ({ id: i })));
            }
        }
    }, [theme.id, theme.particleConfig, animationsEnabled]);

    const renderStaticTexture = () => {
        if (theme.id === 'carbonio') {
            return <Image source={require('../assets/textures/carbon_pattern.png')} style={[styles.texture, { opacity: 0.08 }]} resizeMode="repeat" />;
        }
        return null;
    };

    const renderEffects = () => {
        let content = null;

        if (theme.id === 'manicomio') {
            content = elements.map(el => (
                <Scratches key={el.id} />
            ));
        } else {
            switch (theme.particleConfig) {
                case 'dust': content = elements.map(e => <DustParticle key={e.id} color={theme.colors.particle} />); break;
                case 'ash': content = elements.map(e => <AshParticle key={e.id} color={theme.colors.particle} />); break;
                case 'bubble': content = elements.map(e => <BubbleParticle key={e.id} color={theme.colors.particle} />); break;
                case 'toxicBubble': content = elements.map(e => <BubbleParticle key={e.id} color={theme.colors.particle} />); break;
                case 'snow': content = elements.map(e => <SnowParticle key={e.id} colorEmoji={theme.colors.particleEmoji} theme={theme} />); break;
                case 'lightSweep': content = <LightSweep />; break;
                case 'smoke': content = elements.map(e => <SmokePuff key={e.id} />); break;
                case 'neonPulse': content = <PulsarRipple color={theme.colors.accent} />; break;
                case 'policeLights': content = <PoliceLights />; break;
                case 'voidFloat': content = elements.map(e => <VoidFloatParticle key={e.id} color={theme.colors.particle} />); break;
                default: content = null;
            }
        }

        return (
            <Animated.View style={[StyleSheet.absoluteFill, particlesStyle]} pointerEvents="none">
                {content}
            </Animated.View>
        );
    };

    const renderIntervalEffects = () => {
        if (theme.id === 'matrix') return elements.map(e => <MatrixRain key={e.id} />);
        if (theme.id === 'pulsar') return elements.map(e => <PulsarRipple key={e.id} color={theme.colors.accent} />);
        if (theme.id === 'wallstreet') return elements.map(e => <CurrencyRain key={e.id} />);
        return null;
    };

    const isParticleSystem = ['dust', 'ash', 'bubble', 'toxicBubble', 'snow', 'lightSweep', 'smoke', 'neonPulse', 'policeLights', 'voidFloat'].includes(theme.particleConfig);

    return (
        <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
            {renderStaticTexture()}
            <Animated.View style={[StyleSheet.absoluteFill, particlesStyle]} pointerEvents="none">
                {isParticleSystem ? null : renderIntervalEffects()}
            </Animated.View>
            {isParticleSystem ? renderEffects() : null}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: 'hidden' },
    texture: { width: '100%', height: '100%' },
    matrixColumn: { position: 'absolute', top: 0, alignItems: 'center', width: 30 },
    matrixText: { color: '#00ff41', fontWeight: 'bold', textShadowColor: '#00ff41', textShadowRadius: 10 },
    ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, left: -50, top: -50 }
});

export default ThemeBackground;
