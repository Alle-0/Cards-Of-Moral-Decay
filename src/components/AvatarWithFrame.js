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
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, style]}>

            {/* GLOW LAYER (Background) */}
            {(Platform.OS === 'android' || Platform.OS === 'web') && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', overflow: 'visible' }]}>
                    {frameId === 'neon' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
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
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
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
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
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
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="capo_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#d946ef" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#d946ef" stopOpacity="0.4" />
                                    <Stop offset="0.85" stopColor="#d946ef" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#capo_grad)" />
                        </Svg>
                    )}
                    {frameId === 'rich' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="rich_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#10b981" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#10b981" stopOpacity="0.4" />
                                    <Stop offset="0.85" stopColor="#10b981" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#rich_grad)" />
                        </Svg>
                    )}
                    {frameId === 'midas_touch' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="midas_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#f59e0b" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#f59e0b" stopOpacity="0.4" />
                                    <Stop offset="0.85" stopColor="#f59e0b" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#midas_grad)" />
                        </Svg>
                    )}
                    {frameId === 'ice_king' && (
                        <Svg height="150%" width="150%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="ice_grad" cx="50" cy="50" rx="50" ry="50" fx="50" fy="50" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0.55" stopColor="#06b6d4" stopOpacity="0" />
                                    <Stop offset="0.7" stopColor="#06b6d4" stopOpacity="0.5" />
                                    <Stop offset="0.85" stopColor="#06b6d4" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx="50" cy="50" r="50" fill="url(#ice_grad)" />
                        </Svg>
                    )}
                </View>
            )}

            {/* AVATAR + BORDER FRAME */}
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>

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
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#00ff00', borderStyle: 'dashed' }]} />
                )}

                {/* NEON */}
                {frameId === 'neon' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#06b6d4', shadowColor: '#06b6d4', shadowOpacity: 1, shadowRadius: 10, elevation: Platform.OS === 'android' ? 0 : 6 }]} />
                )}

                {/* ANGEL */}
                {frameId === 'angel' && (
                    <View style={[StyleSheet.absoluteFill, { overflow: 'visible' }]} pointerEvents="none">
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#fff', shadowColor: '#fbbf24', shadowOpacity: 1, shadowRadius: 12, elevation: Platform.OS === 'android' ? 0 : 6 }]} />
                        <View style={{ position: 'absolute', top: -20 * scale, width: '100%', alignItems: 'center' }}>
                            <HaloIcon size={30 * scale} color="#fbbf24" />
                        </View>
                    </View>
                )}

                {/* DEMON */}
                {frameId === 'demon' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'visible' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 4 * scale, borderColor: '#7f1d1d', shadowColor: '#ef4444', shadowOpacity: 0.8, shadowRadius: 8, elevation: Platform.OS === 'android' ? 0 : 6 }]} />
                        <View style={{ position: 'absolute', top: -18 * scale, width: '100%', alignItems: 'center' }}>
                            <HornsIcon size={30 * scale} color="#ef4444" />
                        </View>
                    </View>
                )}

                {/* PIXEL */}
                {frameId === 'pixel' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 4 * scale, borderWidth: 4 * scale, borderColor: '#ec4899', borderStyle: 'dotted' }]} />
                )}

                {/* LOVE */}
                {frameId === 'love' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'visible' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#f472b6' }]} />
                        <View style={{ position: 'absolute', bottom: -12 * scale, width: '100%', alignItems: 'center' }}>
                            <HeartIcon size={24 * scale} color="#f472b6" />
                        </View>
                    </View>
                )}

                {/* RICH */}
                {frameId === 'rich' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', overflow: 'visible' }]}>
                        {/* Emerald Glow */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: 'rgba(16, 185, 129, 0.4)', shadowColor: '#059669', shadowOpacity: 1, shadowRadius: 10, overflow: 'visible' }]} />

                        {/* Emerald/Gold SVG Gradient Frame */}
                        <Svg height="100%" width="100%" style={{ position: 'absolute', overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="rich_emerald_grad" cx="50%" cy="100%" r="100%">
                                    <Stop offset="0%" stopColor="#047857" />
                                    <Stop offset="60%" stopColor="#10b981" />
                                    <Stop offset="100%" stopColor="#a7f3d0" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx={size / 2} cy={size / 2} r={(size / 2) - (2 * scale)} stroke="url(#rich_emerald_grad)" strokeWidth={4 * scale} fill="none" />
                        </Svg>

                        {/* Inner Gold detail */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#fcd34d', margin: 4 * scale, borderStyle: 'dotted' }]} />

                        {/* Custom Floating Money Icon Box */}
                        <View style={{ position: 'absolute', top: -14 * scale, width: '100%', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#064e3b', borderRadius: 16 * scale, padding: 3 * scale, borderWidth: 2 * scale, borderColor: '#34d399', shadowColor: '#10b981', shadowOpacity: 1, shadowRadius: 8, elevation: 6 }}>
                                <MoneyIcon size={20 * scale} color="#a7f3d0" />
                            </View>
                        </View>
                    </View>
                )}

                {/* CAPO */}
                {frameId === 'capo' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', overflow: 'visible' }]}>
                        {/* Boss Imperial Glow */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 4 * scale, borderColor: 'rgba(217, 70, 239, 0.4)', shadowColor: '#d946ef', shadowOpacity: 1, shadowRadius: 15, overflow: 'visible' }]} />

                        {/* Purple/Gold Radiant Frame */}
                        <Svg height="100%" width="100%" style={{ position: 'absolute', overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="capo_magenta_grad" cx="50%" cy="0%" r="100%">
                                    <Stop offset="0%" stopColor="#fbcfe8" />
                                    <Stop offset="50%" stopColor="#d946ef" />
                                    <Stop offset="100%" stopColor="#4a044e" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx={size / 2} cy={size / 2} r={(size / 2) - (2.5 * scale)} stroke="url(#capo_magenta_grad)" strokeWidth={5 * scale} fill="none" />
                        </Svg>

                        {/* Intricate Inner Details */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#fef08a', margin: -1 * scale }]} />
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#fbcfe8', margin: 3 * scale }]} />

                        {/* Grand Crown */}
                        <View style={{ position: 'absolute', top: -16 * scale, width: '100%', alignItems: 'center' }}>
                            <View style={{ position: 'absolute', width: 20 * scale, height: 20 * scale, backgroundColor: '#fbbf24', borderRadius: 10 * scale, opacity: 0.5, filter: 'blur(5px)' }} />
                            <CrownIcon size={28 * scale} color="#fef08a" />
                        </View>
                    </View>
                )}

                {/* WANTED */}
                {frameId === 'wanted' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 4 * scale, borderWidth: 8 * scale, borderColor: '#78350f', backgroundColor: 'transparent' }]} />
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 2 * scale, borderWidth: 2 * scale, borderColor: '#d97706', margin: 2 * scale }]} />
                        <View style={{ position: 'absolute', top: 2 * scale, width: '100%', alignItems: 'center' }}>
                            <Text style={{ fontSize: 7 * scale, color: '#fcd34d', fontWeight: 'bold', backgroundColor: '#451a03', paddingHorizontal: 4 }}>WANTED</Text>
                        </View>
                    </View>
                )}

                {/* TOILET */}
                {frameId === 'toilet' && (
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 6 * scale, borderColor: '#f1f5f9' }]} />
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#cbd5e1', margin: 4 * scale }]} />
                        <View style={{ position: 'absolute', top: -4 * scale, width: '100%', alignItems: 'center' }}>
                            <View style={{ width: 30 * scale, height: 10 * scale, backgroundColor: '#f1f5f9', borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1' }} />
                        </View>
                    </View>
                )}

                {frameId === 'cat' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', overflow: 'visible' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 2 * scale, borderColor: '#f472b6' }]} />
                        <View style={{ position: 'absolute', top: -18 * scale, width: '100%', alignItems: 'center' }}>
                            <CatIcon size={size * 0.7} color="#f472b6" />
                        </View>
                    </View>
                )}

                {/* ICE KING */}
                {frameId === 'ice_king' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', overflow: 'visible' }]}>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 3 * scale, borderColor: '#a5f3fc', shadowColor: '#0891b2', shadowOpacity: 0.8, shadowRadius: 10 }]} />

                        <View style={{ position: 'absolute', bottom: -10 * scale, width: '100%', alignItems: 'center' }}>
                            <SnowflakeIcon size={16 * scale} color="#cffafe" />
                        </View>
                    </View>
                )}

                {/* MIDAS TOUCH */}
                {frameId === 'midas_touch' && (
                    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }]}>
                        {/* Soft Gold Outer Glow */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 4 * scale, borderColor: 'rgba(251, 191, 36, 0.4)', shadowColor: '#f59e0b', shadowOpacity: 1, shadowRadius: 15, overflow: 'visible' }]} />

                        {/* Rich SVG Gold Gradient Frame */}
                        <Svg height="100%" width="100%" style={{ position: 'absolute', overflow: 'visible' }}>
                            <Defs>
                                <RadialGradient id="gold_grad" cx="50%" cy="0%" r="100%">
                                    <Stop offset="0%" stopColor="#ffee58" />
                                    <Stop offset="50%" stopColor="#f59e0b" />
                                    <Stop offset="100%" stopColor="#b45309" />
                                </RadialGradient>
                            </Defs>
                            <Circle cx={size / 2} cy={size / 2} r={(size / 2) - (2 * scale)} stroke="url(#gold_grad)" strokeWidth={4 * scale} fill="none" />
                        </Svg>

                        {/* Thin sharp inner highlight */}
                        <View style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, borderWidth: 1 * scale, borderColor: '#fff', margin: 4 * scale, opacity: 0.6, overflow: 'visible' }]} />

                        {/* Sparkles / Gold Flakes */}
                        <View style={{ position: 'absolute', bottom: -4 * scale, right: -4 * scale }}>
                            <Svg width={12 * scale} height={12 * scale} viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
                                <Path d="M12 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#fef08a" />
                            </Svg>
                        </View>
                        <View style={{ position: 'absolute', top: Math.floor(size * 0.1), left: -8 * scale }}>
                            <Svg width={10 * scale} height={10 * scale} viewBox="0 0 24 24">
                                <Path d="M12 0l1.5 6 6 1.5-6 1.5-1.5 6-1.5-6-6-1.5 6-1.5z" fill="#fde047" />
                            </Svg>
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



export default React.memo(AvatarWithFrame);
