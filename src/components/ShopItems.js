import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { DirtyCashIcon, EyeIcon, CheckIcon } from './Icons';
import AvatarWithFrame from './AvatarWithFrame';
import { TEXTURES } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ShopThemeItem = React.memo(({ item, index, isUnlocked, userBalance, buyingId, onBuy, onPreview, t, theme }) => {
    const price = item.price || 500;
    const isBuying = buyingId === item.id;

    return (
        <Animated.View
            entering={FadeIn.delay((index % 6) * 50).duration(400)}
            style={[
                styles.card,
                {
                    borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255,255,255,0.1)',
                    borderWidth: isUnlocked ? 2 : 1,
                    backgroundColor: 'rgba(255,255,255,0.03)'
                }
            ]}
        >
            <View style={[styles.previewCircle, { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#000' }]}>
                <LinearGradient
                    colors={item.colors.background}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <View style={{
                    position: 'absolute', bottom: 6, right: 6,
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: item.colors.accent,
                    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)',
                }} />
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {t('theme_' + item.id, item.label)}
                </Text>
                <Text style={styles.itemDesc}>{isUnlocked ? t('owned') : t('exclusive_theme')}</Text>
            </View>

            <View style={styles.actionRow}>
                {!isUnlocked ? (
                    <TouchableOpacity
                        style={[
                            styles.buyButton,
                            {
                                backgroundColor: userBalance >= price ? theme.colors.accent : 'rgba(255,255,255,0.05)',
                                borderColor: userBalance >= price ? theme.colors.accent : theme.colors.cardBorder
                            }
                        ]}
                        onPress={() => onBuy(item.id, price, t('theme_' + item.id, item.label))}
                        disabled={isBuying || userBalance < price}
                    >
                        <Text style={[styles.buyText, { color: userBalance >= price ? '#000' : '#888' }]}>
                            {isBuying ? "..." : price}
                        </Text>
                        {!isBuying && <DirtyCashIcon size={12} color={userBalance >= price ? "#000" : "#888"} />}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.ownedBadge}>
                        <CheckIcon size={24} color={theme.colors.accent} />
                    </View>
                )}

                <TouchableOpacity style={styles.previewButtonIcon} onPress={() => onPreview('theme', item)}>
                    <EyeIcon size={20} color="#888" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
});

const ShopSkinItem = React.memo(({ item, index, isUnlocked, userBalance, buyingId, onBuy, onPreview, t, theme }) => {
    const isBuying = buyingId === item.id;

    return (
        <Animated.View
            entering={FadeIn.delay((index % 6) * 50).duration(400)}
            style={[
                styles.card,
                {
                    borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255,255,255,0.1)',
                    borderWidth: isUnlocked ? 2 : 1,
                    backgroundColor: 'rgba(255,255,255,0.03)'
                }
            ]}
        >
            <View style={[styles.skinPreview, {
                backgroundColor: item.styles.bg,
                borderColor: item.styles.border,
            }]}>
                {item.styles.texture && TEXTURES[item.styles.texture] && (
                    <Image source={TEXTURES[item.styles.texture]} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" />
                )}
                <View style={{ width: '60%', height: 2, backgroundColor: item.styles.text, opacity: 0.3, borderRadius: 10 }} />
                <View style={{ width: '40%', height: 2, backgroundColor: item.styles.text, opacity: 0.3, marginTop: 3, borderRadius: 10 }} />
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {t('skin_' + item.id, item.label)}
                </Text>
                <Text style={styles.itemDesc}>{isUnlocked ? t('owned') : t('skin_card')}</Text>
            </View>

            <View style={styles.actionRow}>
                {!isUnlocked ? (
                    <TouchableOpacity
                        style={[
                            styles.buyButton,
                            {
                                backgroundColor: userBalance >= item.price ? theme.colors.accent : theme.colors.cardBg,
                                borderColor: userBalance >= item.price ? theme.colors.accent : theme.colors.cardBorder
                            }
                        ]}
                        onPress={() => onBuy(item.id, item.price, t('skin_' + item.id, item.label))}
                        disabled={isBuying || userBalance < item.price}
                    >
                        <Text style={[styles.buyText, { color: userBalance >= item.price ? '#000' : '#888' }]}>
                            {isBuying ? "..." : item.price}
                        </Text>
                        {!isBuying && <DirtyCashIcon size={12} color={userBalance >= item.price ? "#000" : "#888"} />}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.ownedBadge}>
                        <CheckIcon size={24} color={theme.colors.accent} />
                    </View>
                )}

                <TouchableOpacity style={styles.previewButtonIcon} onPress={() => onPreview('skin', item)}>
                    <EyeIcon size={20} color="#888" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
});

const ShopFrameItem = React.memo(({ item, index, isUnlocked, userBalance, buyingId, onBuy, onPreview, t, theme, userAvatar }) => {
    const isBuying = buyingId === item.id;
    const price = item.price;

    return (
        <Animated.View
            entering={FadeIn.delay((index % 6) * 50).duration(400)}
            style={[
                styles.cardFrame,
                {
                    borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255,255,255,0.1)',
                    borderWidth: isUnlocked ? 2 : 1,
                    backgroundColor: 'rgba(255,255,255,0.03)'
                }
            ]}
        >
            <AvatarWithFrame avatar={userAvatar || 'user'} frameId={item.id} size={65} style={{ marginBottom: 12 }} />
            <Text style={[styles.itemName, { color: theme.colors.textPrimary, textAlign: 'center', fontSize: 13, marginBottom: 4 }]} numberOfLines={1}>
                {t('frame_' + item.id, item.label)}
            </Text>
            <Text style={[styles.itemDesc, { marginBottom: 10 }]}>{isUnlocked ? t('owned') : t('frame_label')}</Text>

            {!isUnlocked ? (
                <View style={{ flexDirection: 'row', gap: 5, width: '100%' }}>
                    <TouchableOpacity
                        style={[
                            styles.buyButton,
                            {
                                flex: 1,
                                paddingHorizontal: 0,
                                backgroundColor: userBalance >= price ? theme.colors.accent : theme.colors.cardBg,
                                borderColor: userBalance >= price ? theme.colors.accent : theme.colors.cardBorder
                            }
                        ]}
                        onPress={() => onBuy(item.id, price, t('frame_' + item.id, item.label))}
                        disabled={isBuying || userBalance < price}
                    >
                        <Text style={[styles.buyText, { color: userBalance >= price ? '#000' : '#888' }]}>{isBuying ? "..." : price}</Text>
                        {!isBuying && <DirtyCashIcon size={12} color={userBalance >= price ? "#000" : "#888"} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.previewButtonIcon, { borderRadius: 8, padding: 8 }]} onPress={() => onPreview('frame', item)}>
                        <EyeIcon size={18} color="#888" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
                    <View style={{ flex: 1, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}>
                        <CheckIcon size={20} color={theme.colors.accent} />
                    </View>
                    <TouchableOpacity style={[styles.previewButtonIcon, { borderRadius: 8, padding: 8 }]} onPress={() => onPreview('frame', item)}>
                        <EyeIcon size={18} color="#888" />
                    </TouchableOpacity>
                </View>
            )
            }
        </Animated.View >
    );
});

const ShopPackItem = React.memo(({ item, index, isUnlocked, userBalance, isProcessing, onBuy, onPreview, t, theme }) => {
    const price = item.price;
    const isBuying = isProcessing && (item.id === 'dark' || item.id === 'spicy'); // Simplified logic

    return (
        <Animated.View
            entering={FadeIn.delay(index * 50).duration(400)}
            style={[
                styles.card,
                {
                    borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255,255,255,0.1)',
                    borderWidth: isUnlocked ? 2 : 1,
                    backgroundColor: 'rgba(255,255,255,0.03)'
                }
            ]}
        >
            <View style={[styles.skinPreview, { backgroundColor: item.color || '#333', justifyContent: 'center', alignItems: 'center' }]}>
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {t('pack_' + item.id)}
                </Text>
                <Text style={styles.itemDesc}>
                    {isUnlocked ? t('owned') : t('pack_label')} • <Text style={{ color: theme.colors.accent }}>{t('cards_count', { count: item.count })}</Text>
                </Text>
            </View>

            <View style={styles.actionRow}>
                {!isUnlocked ? (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.buyButton,
                                {
                                    backgroundColor: theme.colors.accent,
                                    borderColor: theme.colors.accent
                                }
                            ]}
                            onPress={() => onBuy(item.id, price, t('pack_' + item.id))}
                            disabled={isProcessing || ((item.id !== 'dark' && item.id !== 'spicy') && userBalance < price)}
                        >
                            <Text style={[styles.buyText, { color: '#000' }]}>
                                {isBuying ? "..." :
                                    (item.id === 'dark' ? "4.99€" : (item.id === 'spicy' ? "2.99€" : price))
                                }
                            </Text>
                            {(!isProcessing || (item.id !== 'dark' && item.id !== 'spicy')) && (item.id !== 'dark' && item.id !== 'spicy') && <DirtyCashIcon size={12} color="#000" />}
                        </TouchableOpacity>
                        {(item.id === 'dark' || item.id === 'chill' || item.id === 'spicy') && (
                            <TouchableOpacity
                                style={[styles.previewButtonIcon, { marginLeft: 0 }]}
                                onPress={() => onPreview('pack', item)}
                            >
                                <EyeIcon size={20} color="#888" />
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <View style={styles.ownedBadge}>
                        <CheckIcon size={24} color={theme.colors.accent} />
                    </View>
                )}
            </View>
        </Animated.View >
    );
});

const ShopDCBundleItem = React.memo(({ item, index, buyingId, onBuy, t, theme }) => {
    const isBuying = buyingId === item.id;

    return (
        <Animated.View
            entering={FadeIn.delay((index % 6) * 50).duration(400)}
            style={[
                styles.card,
                {
                    marginBottom: 10,
                    padding: 0,
                    overflow: 'hidden',
                    borderColor: item.bestValue ? theme.colors.accent : 'rgba(255,255,255,0.1)',
                    borderWidth: item.bestValue ? 2 : 1,
                    backgroundColor: 'rgba(255,255,255,0.03)'
                }
            ]}
        >
            {/* Best Value Badge */}
            {item.bestValue && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: theme.colors.accent,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderBottomLeftRadius: 8,
                    zIndex: 10
                }}>
                    <Text style={{ fontFamily: 'Cinzel-Bold', fontSize: 10, color: '#000' }}>BEST VALUE</Text>
                </View>
            )}
            <LinearGradient
                colors={['#2c2c2c', '#1a1a1a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: 80,
                    height: 80,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRightWidth: 1,
                    borderRightColor: 'rgba(255,255,255,0.05)'
                }}
            >
                <DirtyCashIcon size={42} color={theme.colors.accent} />
            </LinearGradient>

            <View style={[styles.infoContainer, { paddingLeft: 15, paddingVertical: 10 }]}>
                <Text style={[styles.itemName, { color: theme.colors.accent, fontSize: 16 }]} numberOfLines={1}>
                    {t('dc_bundle_title', { amount: item.amount })}
                </Text>
                <Text style={[styles.itemDesc, { marginTop: 4 }]}>{t('dc_bundle_desc')}</Text>
            </View>

            <View style={[styles.actionRow, { paddingRight: 15 }]}>
                <TouchableOpacity
                    style={[
                        styles.buyButton,
                        {
                            backgroundColor: isBuying ? theme.colors.accentWeak : theme.colors.accent,
                            borderColor: theme.colors.accent,
                            height: 36,
                            paddingHorizontal: 15
                        }
                    ]}
                    onPress={() => onBuy(item.id)}
                    disabled={isBuying}
                >
                    <Text style={[styles.buyText, { color: '#000' }]}>
                        {isBuying ? "..." : item.priceLabel}
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    cardFrame: {
        width: '48.5%',
        padding: 15,
        marginBottom: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center'
    },
    previewCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 15
    },
    skinPreview: {
        width: 34,
        height: 48,
        borderRadius: 4,
        marginRight: 15,
        borderWidth: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4
    },
    infoContainer: {
        flex: 1,
        marginRight: 10
    },
    itemName: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 14,
        marginBottom: 2
    },
    itemDesc: {
        fontFamily: 'Outfit',
        fontSize: 10,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 60,
        justifyContent: 'center',
        borderWidth: 1
    },
    buyText: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 12
    },
    ownedBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    previewButtonIcon: {
        padding: 6
    },
});

export { ShopThemeItem, ShopSkinItem, ShopFrameItem, ShopPackItem, ShopDCBundleItem };
