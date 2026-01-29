import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image, Platform, Modal, InteractionManager, BackHandler, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EfficientBlurView from '../components/EfficientBlurView';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { THEMES, CARD_SKINS, AVATAR_FRAMES, TEXTURES } from '../context/ThemeContext';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, Easing, useSharedValue, withTiming, useAnimatedStyle, withRepeat, withSequence } from 'react-native-reanimated';
import { DirtyCashIcon, EyeIcon, CheckIcon } from '../components/Icons';
import ToastNotification from '../components/ToastNotification';
import ThemeBackground from '../components/ThemeBackground';
import AvatarWithFrame from '../components/AvatarWithFrame';
import SoundService from '../services/SoundService';
import AnalyticsService from '../services/AnalyticsService';
import { useStripePayment } from '../services/StripeService';
import * as Haptics from 'expo-haptics';
import PaymentResultModal from '../components/PaymentResultModal';
import ConfirmationModal from '../components/ConfirmationModal';

const { width } = Dimensions.get('window');

export default function ShopScreen() {
    const { user, buyTheme, buySkin, buyFrame, buyPack } = useAuth();
    const { theme } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState(0);
    const tabs = [t('tab_themes'), t('tab_skins'), t('tab_frames'), t('tab_packs'), t('tab_dc')];

    const [buyingId, setBuyingId] = useState(null);
    const [ready, setReady] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [preview, setPreview] = useState(null);
    const [showExitModal, setShowExitModal] = useState(false);

    // Stripe Logic
    const { buyItem: stripeBuyItem, isProcessing } = useStripePayment();
    const [paymentResult, setPaymentResult] = useState({ visible: false, result: null });

    // [REMOVED URL POLLING] Moved to App.js to ensure visibility on redirects to home screen.

    const buyItem = async (type) => {
        console.log('[ShopScreen] buyItem initiated for:', type);
        SoundService.play('tap');
        const result = await stripeBuyItem(type);
        console.log('[ShopScreen] buyItem result:', result);

        if (result) {
            console.log('[ShopScreen] Setting paymentResult:', { visible: true, result });
            setPaymentResult({ visible: true, result });
            if (result.success) {
                console.log('[ShopScreen] Playing success sound');
                SoundService.play('purchase');
            } else {
                console.log('[ShopScreen] Playing error sound');
                SoundService.play('error');
            }
        } else {
            console.log('[ShopScreen] No result returned from stripeBuyItem');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setReady(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    // Skeleton Helpers
    const SkeletonCard = ({ isGrid = false }) => {
        const opacity = useSharedValue(0.3);
        useEffect(() => {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.1, { duration: 800 }),
                    withTiming(0.3, { duration: 800 })
                ),
                -1,
                true
            );
        }, []);

        const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

        return (
            <Animated.View style={[
                isGrid ? styles.cardFrame : styles.card,
                { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 },
                animStyle
            ]}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <View style={{ flex: 1, marginLeft: 15, gap: 8 }}>
                    <View style={{ width: '60%', height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <View style={{ width: '40%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </View>
            </Animated.View>
        );
    };

    const renderSkeleton = () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 80 + insets.bottom }} showsVerticalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
    );

    // Android Back Handler
    useEffect(() => {
        const backAction = () => {
            if (preview) {
                handleClosePreview();
                return true;
            }
            setShowExitModal(true);
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [preview]);

    // Tab Animation
    const tabBarWidth = useSharedValue(0);
    const tabIndicatorX = useSharedValue(0);

    useEffect(() => {
        if (tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 8) / 5;
            tabIndicatorX.value = withTiming(activeTab * tabWidth, { duration: 250, easing: Easing.out(Easing.quad) });
        }
    }, [activeTab]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tabIndicatorX.value }],
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 8) / 5 : 0,
    }));

    const handleTabPress = (index) => {
        if (activeTab !== index) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(index);
        }
    };

    // Purchasing Logic
    const handleBuy = async (themeId, price, themeName) => {
        if (user.balance < price) {
            setToast({ visible: true, message: t('toast_no_money'), type: 'error' });
            return;
        }
        setBuyingId(themeId);
        const result = await buyTheme(themeId, price);
        setBuyingId(null);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setToast({ visible: true, message: `${t('toast_theme_bought')} ${themeName}.`, type: 'success' });
            AnalyticsService.logPurchase(themeId, price, 'COINS');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setToast({ visible: true, message: result.message, type: 'error' });
        }
    };

    const handleBuySkin = async (skinId, price, skinName) => {
        if (user.balance < price) {
            setToast({ visible: true, message: t('toast_no_money'), type: 'error' });
            return;
        }
        setBuyingId(skinId);
        const result = await buySkin(skinId, price);
        setBuyingId(null);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setToast({ visible: true, message: `${t('toast_skin_bought')} ${skinName}.`, type: 'success' });
            AnalyticsService.logPurchase(skinId, price, 'COINS');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setToast({ visible: true, message: result.message, type: 'error' });
        }
    };

    const handleBuyFrame = async (frameId, price, frameName) => {
        if (user.balance < price) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setToast({ visible: true, message: t('toast_no_money'), type: 'error' });
            return;
        }
        setBuyingId(frameId);
        const result = await buyFrame(frameId, price);
        setBuyingId(null);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setToast({ visible: true, message: `${t('toast_frame_bought')} ${frameName}.`, type: 'success' });
            AnalyticsService.logPurchase(frameId, price, 'COINS');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setToast({ visible: true, message: result.message, type: 'error' });
        }
    };

    const handleBuyPack = async (packId, price, packName) => {
        if (user.balance < price) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setToast({ visible: true, message: t('toast_no_money'), type: 'error' });
            return;
        }
        setBuyingId(packId);
        const result = await buyPack(packId, price);
        setBuyingId(null);
        if (result.success) {
            Haptics.notificationAsync(Haptics.notificationFeedbackType.Success);
            setToast({ visible: true, message: `${t('toast_pack_bought')} ${packName}.`, type: 'success' });
            AnalyticsService.logPurchase(packId, price, 'COINS');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setToast({ visible: true, message: result.message, type: 'error' });
        }
    };




    const renderDCBundle = (bundle, index) => {
        return (
            <Animated.View
                key={bundle.id}
                entering={FadeIn.delay(index * 50).duration(400)}
                style={[
                    styles.card,
                    {
                        borderColor: '#d4af37',
                        borderWidth: 1
                    }
                ]}
            >
                <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: '#00000050',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 15,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }}>
                    <DirtyCashIcon size={24} color="#d4af37" />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {bundle.amount} DC
                    </Text>
                    <Text style={styles.itemDesc}>Dirty Cash Bundle</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[
                            styles.buyButton,
                            {
                                backgroundColor: '#d4af37',
                                borderColor: '#d4af37'
                            }
                        ]}
                        onPress={() => buyItem(bundle.id)}
                        disabled={isProcessing}
                    >
                        <Text style={[styles.buyText, { color: '#000' }]}>
                            {isProcessing ? "..." : bundle.priceLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };


    const handlePreview = (type, item) => {
        SoundService.play('tap');
        setPreview({ type, item });
    };

    const handleClosePreview = () => {
        SoundService.play('tap');
        setPreview(null);
    };

    // Render Helpers
    const renderThemeItem = (itemTheme, index) => {
        const isUnlocked = user?.unlockedThemes?.[itemTheme.id];
        const price = itemTheme.price || 500;

        return (
            <Animated.View
                key={itemTheme.id}
                entering={FadeIn.delay(index * 50).duration(400)}
                style={[
                    styles.card,
                    {
                        borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: isUnlocked ? 2 : 1
                    }
                ]}
            >
                <View style={[styles.previewCircle, { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#000' }]}>
                    <LinearGradient
                        colors={itemTheme.colors.background}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={{
                        position: 'absolute', bottom: 6, right: 6,
                        width: 14, height: 14, borderRadius: 7,
                        backgroundColor: itemTheme.colors.accent,
                        borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)',
                    }} />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {t('theme_' + itemTheme.id, itemTheme.label)}
                    </Text>
                    <Text style={styles.itemDesc}>{isUnlocked ? t('owned') : t('exclusive_theme')}</Text>
                </View>

                <View style={styles.actionRow}>
                    {!isUnlocked ? (
                        <TouchableOpacity
                            style={[
                                styles.buyButton,
                                {
                                    backgroundColor: user.balance >= price ? '#d4af37' : 'rgba(255,255,255,0.05)',
                                    borderColor: user.balance >= price ? '#d4af37' : 'rgba(255,255,255,0.2)'
                                }
                            ]}
                            onPress={() => handleBuy(itemTheme.id, price, t('theme_' + itemTheme.id, itemTheme.label))}
                            disabled={buyingId === itemTheme.id || user.balance < price}
                        >
                            <Text style={[styles.buyText, { color: user.balance >= price ? '#000' : '#888' }]}>
                                {buyingId === itemTheme.id ? "..." : price}
                            </Text>
                            {buyingId !== itemTheme.id && <DirtyCashIcon size={12} color={user.balance >= price ? "#000" : "#888"} />}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.ownedBadge}>
                            <CheckIcon size={24} color={theme.colors.accent} />
                        </View>
                    )}

                    <TouchableOpacity style={styles.previewButtonIcon} onPress={() => handlePreview('theme', itemTheme)}>
                        <EyeIcon size={20} color="#888" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const renderSkinItem = (skin, index) => {
        const isUnlocked = user?.unlockedSkins?.[skin.id];
        return (
            <Animated.View
                key={skin.id}
                entering={FadeIn.delay(index * 50).duration(400)}
                style={[
                    styles.card,
                    {
                        borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: isUnlocked ? 2 : 1
                    }
                ]}
            >
                <View style={[styles.skinPreview, {
                    backgroundColor: skin.styles.bg,
                    borderColor: skin.styles.border,
                }]}>
                    {skin.styles.texture && TEXTURES[skin.styles.texture] && (
                        <Image source={TEXTURES[skin.styles.texture]} style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} resizeMode="cover" />
                    )}
                    <View style={{ width: '60%', height: 2, backgroundColor: skin.styles.text, opacity: 0.3, borderRadius: 10 }} />
                    <View style={{ width: '40%', height: 2, backgroundColor: skin.styles.text, opacity: 0.3, marginTop: 3, borderRadius: 10 }} />
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {t('skin_' + skin.id, skin.label)}
                    </Text>
                    <Text style={styles.itemDesc}>{isUnlocked ? t('owned') : t('skin_card')}</Text>
                </View>

                <View style={styles.actionRow}>
                    {!isUnlocked ? (
                        <TouchableOpacity
                            style={[
                                styles.buyButton,
                                {
                                    backgroundColor: user.balance >= skin.price ? '#d4af37' : 'rgba(255,255,255,0.05)',
                                    borderColor: user.balance >= skin.price ? '#d4af37' : 'rgba(255,255,255,0.2)'
                                }
                            ]}
                            onPress={() => handleBuySkin(skin.id, skin.price, t('skin_' + skin.id, skin.label))}
                            disabled={buyingId === skin.id || user.balance < skin.price}
                        >
                            <Text style={[styles.buyText, { color: user.balance >= skin.price ? '#000' : '#888' }]}>
                                {buyingId === skin.id ? "..." : skin.price}
                            </Text>
                            {buyingId !== skin.id && <DirtyCashIcon size={12} color={user.balance >= skin.price ? "#000" : "#888"} />}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.ownedBadge}>
                            <CheckIcon size={24} color={theme.colors.accent} />
                        </View>
                    )}

                    <TouchableOpacity style={styles.previewButtonIcon} onPress={() => handlePreview('skin', skin)}>
                        <EyeIcon size={20} color="#888" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const renderFrameItem = (itemFrame, index) => {
        const isUnlocked = user?.unlockedFrames?.[itemFrame.id] || parseFloat(itemFrame.price) === 0;
        const price = itemFrame.price;

        return (
            <Animated.View
                key={itemFrame.id}
                entering={FadeIn.delay(index * 50).duration(400)}
                style={[
                    styles.cardFrame,
                    {
                        borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: isUnlocked ? 2 : 1
                    }
                ]}
            >
                <AvatarWithFrame avatar={user?.avatar || 'user'} frameId={itemFrame.id} size={65} style={{ marginBottom: 12 }} />
                <Text style={[styles.itemName, { color: theme.colors.textPrimary, textAlign: 'center', fontSize: 13, marginBottom: 4 }]} numberOfLines={1}>
                    {t('frame_' + itemFrame.id, itemFrame.label)}
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
                                    backgroundColor: user.balance >= price ? '#d4af37' : 'rgba(255,255,255,0.05)',
                                    borderColor: user.balance >= price ? '#d4af37' : 'rgba(255,255,255,0.2)'
                                }
                            ]}
                            onPress={() => handleBuyFrame(itemFrame.id, price, t('frame_' + itemFrame.id, itemFrame.label))}
                            disabled={buyingId === itemFrame.id || user.balance < price}
                        >
                            <Text style={[styles.buyText, { color: user.balance >= price ? '#000' : '#888' }]}>{buyingId === itemFrame.id ? "..." : price}</Text>
                            {buyingId !== itemFrame.id && <DirtyCashIcon size={12} color={user.balance >= price ? "#000" : "#888"} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.previewButtonIcon, { borderRadius: 8, padding: 8 }]} onPress={() => handlePreview('frame', itemFrame)}>
                            <EyeIcon size={18} color="#888" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', width: '100%', gap: 5 }}>
                        <View style={{ flex: 1, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(44, 125, 74, 0.1)', borderRadius: 8 }}>
                            <CheckIcon size={20} color={theme.colors.accent} />
                        </View>
                        <TouchableOpacity style={[styles.previewButtonIcon, { borderRadius: 8, padding: 8 }]} onPress={() => handlePreview('frame', itemFrame)}>
                            <EyeIcon size={18} color="#888" />
                        </TouchableOpacity>
                    </View>
                )
                }
            </Animated.View >
        );
    };

    const renderPackItem = (pack, index) => {
        const isUnlocked = user?.unlockedPacks?.[pack.id];
        const price = pack.price;

        return (
            <Animated.View
                key={pack.id}
                entering={FadeIn.delay(index * 50).duration(400)}
                style={[
                    styles.card,
                    {
                        borderColor: isUnlocked ? '#2c7d4aff' : 'rgba(255, 255, 255, 0.05)',
                        borderWidth: isUnlocked ? 2 : 1
                    }
                ]}
            >
                <View style={[styles.skinPreview, { backgroundColor: pack.color || '#333', justifyContent: 'center', alignItems: 'center' }]}>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.itemName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {t('pack_' + pack.id)}
                    </Text>
                    <Text style={styles.itemDesc}>{isUnlocked ? t('owned') : t('pack_label')}</Text>
                </View>

                <View style={styles.actionRow}>
                    {!isUnlocked ? (
                        <TouchableOpacity
                            style={[
                                styles.buyButton,
                                {
                                    backgroundColor: '#d4af37',
                                    borderColor: '#d4af37'
                                }
                            ]}
                            onPress={() => {
                                if (pack.id === 'dark') {
                                    buyItem('dark_pack');
                                } else {
                                    handleBuyPack(pack.id, price, t('pack_' + pack.id));
                                }
                            }}
                            disabled={isProcessing || (pack.id !== 'dark' && user.balance < price)}
                        >
                            <Text style={[styles.buyText, { color: '#000' }]}>
                                {isProcessing && pack.id === 'dark' ? "..." : (pack.id === 'dark' ? "4.99€" : price)}
                            </Text>
                            {(!isProcessing || pack.id !== 'dark') && pack.id !== 'dark' && <DirtyCashIcon size={12} color="#000" />}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.ownedBadge}>
                            <CheckIcon size={24} color={theme.colors.accent} />
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <LinearGradient
            colors={theme.colors.background}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <ThemeBackground />
            {/* Header */}
            <Text style={{ color: '#d4af37', fontFamily: 'Cinzel-Bold', fontSize: 24, marginTop: 50, marginBottom: 20, textAlign: 'center' }}>
                {t('shop_title')}
            </Text>

            {/* Balance */}
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>{t('balance_label')}</Text>
                <Text style={styles.balanceValue}>{user?.balance || 0}</Text>
                <DirtyCashIcon size={16} color="#d4af37" />
            </View>

            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* Tab Bar */}
                <View
                    style={styles.tabBarContainer}
                    onLayout={(e) => {
                        tabBarWidth.value = e.nativeEvent.layout.width;
                    }}
                >
                    <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
                    {tabs.map((tab, index) => (
                        <Pressable
                            key={tab}
                            onPress={() => handleTabPress(index)}
                            style={styles.tabItem}
                        >
                            <Text style={{
                                color: activeTab === index ? '#000' : '#888',
                                fontFamily: 'Outfit-Bold',
                                fontSize: 10,
                                letterSpacing: 0.5
                            }}>
                                {tab}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Content List */}
                {!ready ? (
                    renderSkeleton()
                ) : (
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        overScrollMode="never"
                    >
                        {activeTab === 0 && Object.values(THEMES).map((t, index) => {
                            if (['default', 'onice', 'ghiaccio'].includes(t.id)) return null;
                            return renderThemeItem(t, index);
                        })}
                        {activeTab === 1 && Object.values(CARD_SKINS).map((s, index) => {
                            if (s.id === 'classic') return null;
                            return renderSkinItem(s, index);
                        })}
                        {activeTab === 2 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {Object.values(AVATAR_FRAMES).map((f, index) => {
                                    if (['basic', 'capo'].includes(f.id)) return null;
                                    return renderFrameItem(f, index);
                                })}
                            </View>
                        )}
                        {activeTab === 3 && [
                            { id: 'dark', price: 1000, color: '#ef4444' }
                        ].map((p, index) => renderPackItem(p, index))}
                        {activeTab === 4 && (
                            <View style={{ paddingBottom: 20 }}>
                                <Text style={{
                                    fontFamily: 'Cinzel-Bold',
                                    fontSize: 20,
                                    color: theme.colors.accent,
                                    textAlign: 'center',
                                    marginBottom: 20
                                }}>
                                    {t('tab_dc')}
                                </Text>
                                {[
                                    { id: 'dc_500', amount: 500, price: 1.99, priceLabel: '1.99€' },
                                    { id: 'dc_1500', amount: 1500, price: 4.99, priceLabel: '4.99€' },
                                    { id: 'dc_5000', amount: 5000, price: 14.99, priceLabel: '14.99€' }
                                ].map((bundle, index) => renderDCBundle(bundle, index))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />


            {/* Preview Modal */}
            <Modal
                transparent={true}
                visible={!!preview}
                animationType="fade"
                onRequestClose={handleClosePreview}
                statusBarTranslucent={true}
                hardwareAccelerated={true}
            >
                {preview && (
                    <View style={styles.previewOverlayContainer}>
                        <Animated.View
                            entering={FadeIn.duration(300)}
                            exiting={FadeOut.duration(300)}
                            style={StyleSheet.absoluteFill}
                        >
                            <EfficientBlurView intensity={Platform.OS === 'android' ? 20 : 40} tint="dark" style={StyleSheet.absoluteFill}>
                                <TouchableOpacity
                                    style={styles.backdropClick}
                                    activeOpacity={1}
                                    onPress={handleClosePreview}
                                />
                            </EfficientBlurView>
                        </Animated.View>

                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="box-none">
                            <Animated.View
                                entering={ZoomIn.delay(50).duration(300)}
                                exiting={ZoomOut.duration(200)}
                                style={[styles.previewModal, { borderColor: theme.colors.accent, shadowOpacity: 0, elevation: 0 }]}
                            >
                                <View style={styles.previewHeaderNew}>
                                    <Text style={[styles.previewSubtitle, { color: theme.colors.accent }]}>
                                        {preview?.type === 'skin' ? t('preview_subtitle_skin') : (preview?.type === 'frame' ? t('preview_subtitle_frame') : t('preview_subtitle_theme'))}
                                    </Text>
                                    {(preview?.type === 'skin' || preview?.type === 'frame') && (
                                        <Text style={styles.previewTitleMain}>
                                            {preview?.type === 'skin' ? t('skin_' + preview?.item?.id, preview?.item?.label) : t('frame_' + preview?.item?.id, preview?.item?.label)}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.previewContent}>
                                    {preview?.type === 'skin' ? (
                                        <View style={[styles.largeCard, {
                                            backgroundColor: preview.item.styles.bg,
                                            borderColor: preview.item.styles.border,
                                            borderWidth: 1,
                                        }]}>
                                            {preview.item.styles.texture && TEXTURES[preview.item.styles.texture] && (
                                                <Image
                                                    source={TEXTURES[preview.item.styles.texture]}
                                                    style={[StyleSheet.absoluteFill, {
                                                        opacity: preview.item.id === 'mida' ? 0.6 : 0.25,
                                                        transform: [{ scale: 1.1 }]
                                                    }]}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
                                                <Text style={{
                                                    color: preview.item.styles.text,
                                                    fontFamily: preview.item.id === 'narco' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') : 'Outfit',
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    textAlign: 'left',
                                                    lineHeight: 22
                                                }}>
                                                    {t('flavor_corruption')}
                                                </Text>
                                            </View>
                                            <View style={{ paddingBottom: 12, paddingLeft: 16, opacity: 0.8 }}>
                                                <Text style={{ fontSize: 8, color: preview.item.styles.text, opacity: 0.6, fontFamily: 'Outfit-Bold' }}>
                                                    CARDS OF MORAL DECAY
                                                </Text>
                                            </View>
                                        </View>
                                    ) : preview?.type === 'theme' ? (
                                        <View style={[styles.themePreviewContainer, { borderColor: preview.item.colors.cardBorder, borderWidth: 1 }]}>
                                            <LinearGradient
                                                colors={preview.item.colors.background}
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <ThemeBackground forceTheme={preview.item} visible={true} />
                                            <View style={[StyleSheet.absoluteFill, {
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                padding: 20
                                            }]}>
                                                <Text style={[styles.themeCardTitle, { color: preview.item.colors.textPrimary }]}>
                                                    {t('theme_' + preview.item.id, preview.item.label)}
                                                </Text>
                                                <Text style={[styles.themeCardSubtitle, { color: preview.item.colors.accent }]}>
                                                    {preview.item.particleConfig ? t('theme_dynamic_effect') : t('theme_static_decor')}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : preview?.type === 'frame' ? (
                                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
                                            <AvatarWithFrame
                                                avatar={user?.avatar || 'user'}
                                                frameId={preview.item.id}
                                                size={120}
                                            />
                                            <Text style={{ color: '#888', fontFamily: 'Outfit', fontSize: 13, marginTop: 20, textAlign: 'center', paddingHorizontal: 30 }}>
                                                {t('preview_frame_desc')}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                <TouchableOpacity
                                    style={[styles.closeButton, { borderColor: 'rgba(255,255,255,0.2)' }]}
                                    onPress={handleClosePreview}
                                >
                                    <Text style={styles.closeButtonText}>{t('close_preview')}</Text>
                                </TouchableOpacity>

                            </Animated.View>
                        </View>
                    </View>
                )}
            </Modal>

            <ConfirmationModal
                visible={showExitModal}
                onClose={() => setShowExitModal(false)}
                title={t('exit_app_title')}
                message={t('exit_app_msg')}
                confirmText={t('exit_btn_small')}
                onConfirm={() => BackHandler.exitApp()}
            />

            <PaymentResultModal
                visible={paymentResult.visible}
                result={paymentResult.result}
                onClose={() => setPaymentResult({ ...paymentResult, visible: false })}
            />

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />


        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        gap: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)'
    },
    balanceLabel: {
        fontFamily: 'Outfit-Bold',
        color: '#888',
        fontSize: 10,
        letterSpacing: 2
    },
    balanceValue: {
        fontFamily: 'Cinzel-Bold',
        color: '#d4af37',
        fontSize: 18
    },
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 15,
        borderRadius: 12,
        padding: 4,
        height: 44
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        zIndex: 1
    },
    tabIndicator: {
        position: 'absolute',
        top: 4, bottom: 4, left: 4,
        backgroundColor: '#d4af37',
        borderRadius: 8,
    },
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
        width: width * 0.43,
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
    /* PREVIEW OVERLAY */
    previewOverlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    backdropClick: {
        width: '100%',
        height: '100%'
    },
    previewModal: {
        width: '85%',
        backgroundColor: '#111',
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        alignItems: 'center',
        elevation: 0
    },
    previewHeaderNew: {
        marginBottom: 20,
        alignItems: 'center'
    },
    previewSubtitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 5
    },
    previewTitleMain: {
        color: '#fff',
        fontFamily: 'Cinzel-Bold',
        fontSize: 22,
        letterSpacing: 1
    },
    previewContent: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20
    },
    largeCard: {
        width: width * 0.55,
        height: width * 0.55 * 1.4,
        borderRadius: 12,
        overflow: 'hidden'
    },
    themePreviewContainer: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative'
    },
    themeCardTitle: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 24,
        marginBottom: 5,
        textAlign: 'center'
    },
    themeCardSubtitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 10,
        letterSpacing: 2
    },
    closeButton: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 25,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    closeButtonText: {
        color: '#fff',
        fontFamily: 'Outfit-Bold',
        fontSize: 12,
        letterSpacing: 1
    }
});
