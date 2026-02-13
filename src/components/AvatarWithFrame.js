import React from 'react';
import { StyleSheet, View, Platform, Image, Text } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, Ellipse } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext'; // [NEW]
import LocalAvatar from './LocalAvatar';
import { CrownIcon, HaloIcon, HornsIcon, HeartIcon, MoneyIcon, CatIcon, SnowflakeIcon } from './Icons';

// Reusable component for Avatar + Frame + Glows
const AvatarWithFrame = ({
    avatar,
    frameId = 'basic',
    size = 56,
    isDominus = false,
    style
}) => {
    const { theme } = useTheme(); // [NEW]
    // scale factor for internal elements relative to base 56px size
    // If size is different, we scale the internal icons accordingly or keep them proportional
    const scale = size / 56;
    const borderRadius = size / 2;

    return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>

            {/* GLOW LAYER (Background) */}
            {Platform.OS === 'android' && (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }]}>
                    {frameId === 'neon' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100">
                            <Defs>
                                <RadialGradient id="neon_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#06b6d4" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#06b6d4" stopOpacity="0.4" />
                                    <Stop offset="0.85" stopColor="#06b6d4" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#neon_grad)" />
                        </Svg>
                    )}
                    {frameId === 'angel' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100">
                            <Defs>
                                <RadialGradient id="angel_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#fbbf24" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#fbbf24" stopOpacity="0.4" />
                                    <Stop offset="0.85" stopColor="#fbbf24" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#angel_grad)" />
                        </Svg>
                    )}
                    {frameId === 'demon' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100">
                            <Defs>
                                <RadialGradient id="demon_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#ef4444" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#ef4444" stopOpacity="0.4" />
                                    <Stop offset="0.85" stopColor="#ef4444" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#demon_grad)" />
                        </Svg>
                    )}
                    {frameId === 'capo' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100">
                            <Defs>
                                <RadialGradient id="capo_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#ff00ff" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#ff00ff" stopOpacity="0.3" />
                                    <Stop offset="0.85" stopColor="#ff00ff" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#capo_grad)" />
                        </Svg>
                    )}
                </View>
            )}

            {/* AVATAR + BORDER FRAME */}
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>

                {/* 1. Base Avatar */}
                <View style={{ width: size, height: size, borderRadius: borderRadius, overflow: 'hidden', backgroundColor: theme.colors.cardBg || 'rgba(255,255,255,0.05)' }}>
                    <LocalAvatar
                        size={size}
                        seed={avatar?.startsWith('http') ? avatar : (avatar || 'User')}
                    />
                </View>

                {/* 2. Visual Frames (Overlays) */}

                {/* GLITCH */}
                {frameId === 'glitch' && (
                    <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#00ff00', borderStyle: 'dashed', pointerEvents: 'none' }]} />
                )}

                {/* NEON */}
                {frameId === 'neon' && (
                    <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#06b6d4', shadowColor: '#06b6d4', shadowOpacity: 1, shadowRadius: 10, elevation: Platform.OS === 'android' ? 0 : 6, pointerEvents: 'none' }]} />
                )}

                {/* ANGEL */}
                {frameId === 'angel' && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#fff', shadowColor: '#fbbf24', shadowOpacity: 1, shadowRadius: 12, elevation: Platform.OS === 'android' ? 0 : 6 }]} />
                        <View style={{ position: 'absolute', top: -20 * scale, width: '100%', alignItems: 'center' }}>
                            <HaloIcon size={30 * scale} color="#fbbf24" />
                        </View>
                    </View>
                )}

                {/* DEMON */}
                {frameId === 'demon' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 4 * scale, borderColor: '#7f1d1d', shadowColor: '#ef4444', shadowOpacity: 0.8, shadowRadius: 8, elevation: Platform.OS === 'android' ? 0 : 6 }]} />
                        <View style={{ position: 'absolute', top: -18 * scale, width: '100%', alignItems: 'center' }}>
                            <HornsIcon size={30 * scale} color="#ef4444" />
                        </View>
                    </View>
                )}

                {/* PIXEL */}
                {frameId === 'pixel' && (
                    <View style={[StyleSheet.absoluteFill, { borderRadius: 4 * scale, borderWidth: 4 * scale, borderColor: '#ec4899', borderStyle: 'dotted', pointerEvents: 'none' }]} />
                )}

                {/* LOVE */}
                {frameId === 'love' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#f472b6' }]} />
                        <View style={{ position: 'absolute', bottom: -12 * scale, width: '100%', alignItems: 'center' }}>
                            <HeartIcon size={24 * scale} color="#f472b6" />
                        </View>
                    </View>
                )}

                {/* RICH */}
                {frameId === 'rich' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 4 * scale, borderColor: '#10b981' }]} />
                        <View style={{ position: 'absolute', top: -15 * scale, width: '100%', alignItems: 'center' }}>
                            <MoneyIcon size={28 * scale} color="#10b981" />
                        </View>
                    </View>
                )}

                {/* CAPO */}
                {frameId === 'capo' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        {/* Glow Layer */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 6 * scale, borderColor: '#ff00ff', opacity: 0.5 }]} />
                        {/* Main Gold Frame */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#ffd700', shadowColor: '#ffd700', shadowOpacity: 0.8, shadowRadius: 10, elevation: Platform.OS === 'android' ? 0 : 6 }]} />
                        {/* Inner Detail */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#ff00ff', margin: 3 * scale }]} />
                        {/* Floating Crown */}
                        <View style={{ position: 'absolute', top: -16 * scale, width: '100%', alignItems: 'center' }}>
                            <CrownIcon size={20 * scale} color="#ffd700" />
                        </View>
                    </View>
                )}

                {/* WANTED */}
                {frameId === 'wanted' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 4 * scale, borderWidth: 8 * scale, borderColor: '#78350f', backgroundColor: 'transparent' }]} />
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 2 * scale, borderWidth: 2 * scale, borderColor: '#d97706', margin: 2 * scale }]} />
                        <View style={{ position: 'absolute', top: 2 * scale, width: '100%', alignItems: 'center' }}>
                            <Text style={{ fontSize: 7 * scale, color: '#fcd34d', fontWeight: 'bold', backgroundColor: '#451a03', paddingHorizontal: 4 }}>WANTED</Text>
                        </View>
                    </View>
                )}

                {/* TOILET */}
                {frameId === 'toilet' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 6 * scale, borderColor: '#f1f5f9' }]} />
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#cbd5e1', margin: 4 * scale }]} />
                        <View style={{ position: 'absolute', top: -4 * scale, width: '100%', alignItems: 'center' }}>
                            <View style={{ width: 30 * scale, height: 10 * scale, backgroundColor: '#f1f5f9', borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1' }} />
                        </View>
                    </View>
                )}

                {frameId === 'cat' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 2 * scale, borderColor: '#f472b6' }]} />
                        <View style={{ position: 'absolute', top: -18 * scale, width: '100%', alignItems: 'center' }}>
                            <CatIcon size={size * 0.7} color="#f472b6" />
                        </View>
                    </View>
                )}

                {/* ICE KING */}
                {frameId === 'ice_king' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#a5f3fc', shadowColor: '#0891b2', shadowOpacity: 0.8, shadowRadius: 10 }]} />

                        <View style={{ position: 'absolute', bottom: -10 * scale, width: '100%', alignItems: 'center' }}>
                            <SnowflakeIcon size={16 * scale} color="#cffafe" />
                        </View>
                    </View>
                )}

                {/* MIDAS TOUCH */}
                {frameId === 'midas_touch' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                        {/* Gold Glow */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 4 * scale, borderColor: '#fbbf24', shadowColor: '#f59e0b', shadowOpacity: 1, shadowRadius: 15 }]} />
                        {/* Inner Ring */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#fff', margin: 3 * scale, opacity: 0.5 }]} />

                        {/* Sparkles simulate touch */}
                        <View style={{ position: 'absolute', bottom: -5 * scale, right: -5 * scale }}>
                            <View style={{ width: 4 * scale, height: 4 * scale, backgroundColor: '#fff', borderRadius: 2 }} />
                        </View>
                        <View style={{ position: 'absolute', top: 5 * scale, left: -2 * scale }}>
                            <View style={{ width: 3 * scale, height: 3 * scale, backgroundColor: '#fbbf24', borderRadius: 1.5 }} />
                        </View>
                    </View>
                )}
            </View>

            {/* DOMINUS BADGE (Optional Over-Ride) */}
            {isDominus && (
                <View style={{
                    position: 'absolute',
                    top: -5, right: -5,
                    backgroundColor: '#ffd700', borderRadius: 10,
                    paddingHorizontal: 4, paddingVertical: 1,
                    zIndex: 20,
                    borderWidth: 1, borderColor: '#000'
                }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#000' }}>DOM</Text>
                </View>
            )}
        </View>
    );
};



export default AvatarWithFrame;
