import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image, Platform, Modal } from 'react-native';
import EfficientBlurView from '../components/EfficientBlurView'; // [NEW]
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { THEMES, CARD_SKINS, AVATAR_FRAMES, TEXTURES } from '../context/ThemeContext'; // [FIX] Added TEXTURES
import LocalAvatar from '../components/LocalAvatar'; // [NEW] For frame preview
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, FadeInDown, Layout, Easing } from 'react-native-reanimated'; // [NEW] Added ZoomOut
import { Ionicons } from '@expo/vector-icons';
import { DirtyCashIcon, CardsIcon, PaletteIcon, EyeIcon, CrownIcon, HaloIcon, HornsIcon, HeartIcon, MoneyIcon, ThornsIcon } from '../components/Icons'; // [NEW] Icons
import ConfirmationModal from '../components/ConfirmationModal';
import { useGame } from '../context/GameContext'; // [NEW] Sync with room
import { ref, update as fbUpdate } from 'firebase/database'; // [NEW] Update room
import { db } from '../services/firebase'; // [NEW]
import ThemeBackground from '../components/ThemeBackground'; // [NEW]
import AvatarWithFrame from '../components/AvatarWithFrame'; // [NEW] Standardized Frame

const { width } = Dimensions.get('window');

export default function ShopScreen({ onClose }) {
    const { user, buyTheme, buySkin, buyFrame, spendMoney, equipSkin, equipFrame } = useAuth(); // [FIX] Added equipSkin back
    const { theme } = useTheme();
    const { roomCode, roomPlayerName } = useGame(); // [NEW] Sync with room

    const [activeTab, setActiveTab] = useState('themes'); // 'themes' | 'skins'

    const [buyingId, setBuyingId] = useState(null);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });
    const [isClosing, setIsClosing] = useState(false); // [NEW] For exit animation
    const handlePreview = (type, item) => {
        setIsClosing(false);
        setPreview({ type, item });
    };

    const handleClosePreview = () => {
        setIsClosing(true);
        setTimeout(() => {
            setPreview(null);
            setIsClosing(false);
        }, 300);
    };

    const handleBuy = async (themeId, price, themeName) => {
        if (user.balance < price) {
            setModal({ visible: true, title: "Poveraccio", message: "Non hai abbastanza Dirty Cash. Vattene." });
            return;
        }

        setBuyingId(themeId);
        const result = await buyTheme(themeId, price);
        setBuyingId(null);

        if (result.success) {
            setModal({ visible: true, title: "Affare Fatto", message: `Hai acquistato il tema ${themeName}.` });
        } else {
            setModal({ visible: true, title: "Errore", message: result.message });
        }

    };

    const handleBuySkin = async (skinId, price, skinName) => {
        if (user.balance < price) {
            setModal({ visible: true, title: "Poveraccio", message: "Non hai abbastanza Dirty Cash." });
            return;
        }
        setBuyingId(skinId);
        const result = await buySkin(skinId, price);
        setBuyingId(null);
        if (result.success) {
            setModal({ visible: true, title: "Nuova Skin", message: `Hai ottenuto la skin ${skinName}.` });
        } else {
            setModal({ visible: true, title: "Errore", message: result.message });
        }
    };

    const handleEquip = async (skinId) => {
        if (activeTab === 'skins') {
            await equipSkin(skinId);
            // [SYNC] If in a room, update the player's skin in the room data immediately
            if (roomCode && roomPlayerName) {
                try {
                    const playerRef = ref(db, `stanze/${roomCode}/giocatori/${roomPlayerName}`);
                    await fbUpdate(playerRef, { activeCardSkin: skinId });
                } catch (e) {
                    console.error("Failed to sync skin to room", e);
                }
            }
        } else if (activeTab === 'frames') {
            await equipFrame(skinId);
            // [SYNC]
            if (roomCode && roomPlayerName) {
                try {
                    const playerRef = ref(db, `stanze/${roomCode}/giocatori/${roomPlayerName}`);
                    await fbUpdate(playerRef, { activeFrame: skinId });
                } catch (e) {
                    console.error("Failed to sync frame to room", e);
                }
            }
        }
    };

    const handleBuyFrame = async (frameId, price, frameName) => {
        if (user.balance < price) {
            setModal({ visible: true, title: "Poveraccio", message: "Non hai abbastanza Dirty Cash." });
            return;
        }
        setBuyingId(frameId);
        const result = await buyFrame(frameId, price);
        setBuyingId(null);
        if (result.success) {
            setModal({ visible: true, title: "Nuova Cornice", message: `Hai ottenuto ${frameName}.` });
        } else {
            setModal({ visible: true, title: "Errore", message: result.message });
        }
    };



    const renderThemeItem = (itemTheme) => {
        const isUnlocked = user?.unlockedThemes?.[itemTheme.id];
        const isCurrent = theme.id === itemTheme.id;
        const price = itemTheme.price || 500; // [DYNAMIC] Fallback to 500

        return (
            <Animated.View
                key={itemTheme.id}
                entering={FadeInDown}
                style={[
                    styles.card,
                    { borderColor: isUnlocked ? '#22c55e' : '#333', borderWidth: isUnlocked ? 2 : 1 }
                ]}
            >
                <View style={[styles.previewCircle, { backgroundColor: itemTheme.colors.accent }]}>
                    <Text style={{ fontSize: 24 }}>{itemTheme.colors.particleEmoji}</Text>
                </View>

                <View style={[styles.infoContainer, { marginLeft: 10 }]}>
                    <Text
                        style={[styles.themeName, { color: theme.colors.textPrimary, fontSize: 13 }]}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                    >
                        {itemTheme.label}
                    </Text>
                    <Text style={styles.themeDesc}>{isUnlocked ? "COMPRATO" : "Bloccato"}</Text>
                </View>

                {!isUnlocked ? (
                    <TouchableOpacity
                        style={[styles.buyButton, { backgroundColor: user.balance >= price ? '#d4af37' : '#555' }]}
                        onPress={() => handleBuy(itemTheme.id, price, itemTheme.label)}
                        disabled={buyingId === itemTheme.id || user.balance < price}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.buyText}>{buyingId === itemTheme.id ? "..." : price}</Text>
                            {buyingId !== itemTheme.id && <DirtyCashIcon size={14} color="#000" />}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.ownedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                    </View>
                )}

                <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => handlePreview('theme', itemTheme)}
                >
                    <EyeIcon size={24} color={theme.colors.accent} />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // [NEW] Render Frame Item (Vertical Grid Style)
    const renderFrameItem = (itemFrame) => {
        const isUnlocked = user?.unlockedFrames?.[itemFrame.id] || parseFloat(itemFrame.price) === 0;
        const isCurrent = (user?.activeFrame || 'basic') === itemFrame.id;
        const price = itemFrame.price;

        return (
            <Animated.View
                key={itemFrame.id}
                entering={FadeInDown.springify()}
                style={[
                    styles.cardFrame, // [NEW] Vertical card style
                    { borderColor: isUnlocked ? '#22c55e' : '#333', borderWidth: isUnlocked ? 2 : 1 }
                ]}
            >
                {/* Preview */}
                <AvatarWithFrame
                    avatar={user?.username || 'user'}
                    frameId={itemFrame.id}
                    size={75}
                    style={{ marginBottom: 12 }}
                />

                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.themeName, { color: theme.colors.textPrimary, textAlign: 'center', fontSize: 14 }]}>{itemFrame.label}</Text>
                    <Text style={styles.themeDesc}>
                        {isUnlocked ? "COMPRATO" : (price === 0 ? "GRATIS" : `${price} DC`)}
                    </Text>
                </View>

                {/* Action Button */}
                {!isUnlocked ? (
                    <TouchableOpacity
                        style={[styles.buyButton, { width: '100%', backgroundColor: user.balance >= price ? '#d4af37' : '#444' }]}
                        onPress={() => handleBuyFrame(itemFrame.id, price, itemFrame.label)}
                        disabled={buyingId === itemFrame.id || user.balance < price}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Text style={styles.buyText}>
                                {buyingId === itemFrame.id ? "..." : price}
                            </Text>
                            {buyingId !== itemFrame.id && <DirtyCashIcon size={12} color="#000" />}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.ownedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                    </View>
                )}
            </Animated.View>
        );
    };
    const renderSkinItem = (skin) => {
        const isUnlocked = user?.unlockedSkins?.[skin.id];
        const isEquipped = user?.activeCardSkin === skin.id;

        return (
            <Animated.View
                key={skin.id}
                entering={FadeInDown}
                layout={Layout.springify()}
                style={[
                    styles.card,
                    { borderColor: isUnlocked ? '#22c55e' : '#333', borderWidth: isUnlocked ? 2 : 1 }
                ]}
            >
                {/* Skin Preview */}
                <View style={[styles.skinPreview, {
                    backgroundColor: skin.styles.bg,
                    borderColor: skin.styles.border,
                    overflow: 'hidden'
                }]}>
                    {/* [NEW] Mini Texture Layer */}
                    {skin.styles.texture && TEXTURES[skin.styles.texture] && (
                        <Image
                            source={TEXTURES[skin.styles.texture]}
                            style={[StyleSheet.absoluteFill, {
                                opacity: skin.id === 'mida' ? 0.4 : 0.15,
                            }]}
                            resizeMode="cover"
                        />
                    )}
                    {/* Simulated Text Lines */}
                    <View style={{ width: '70%', height: 2, borderRadius: 1, backgroundColor: skin.styles.text, opacity: 0.3, marginBottom: 2 }} />
                    <View style={{ width: '50%', height: 2, borderRadius: 1, backgroundColor: skin.styles.text, opacity: 0.3 }} />
                </View>

                <View style={[styles.infoContainer, { marginLeft: 10 }]}>
                    <Text
                        style={[styles.themeName, { color: theme.colors.textPrimary, fontSize: 13 }]}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                    >
                        {skin.label}
                    </Text>
                    <Text style={styles.themeDesc}>{isUnlocked ? "COMPRATO" : `${skin.price} DC`}</Text>
                </View>

                {!isUnlocked ? (
                    <TouchableOpacity
                        style={[styles.buyButton, { backgroundColor: user.balance >= skin.price ? '#d4af37' : '#555' }]}
                        onPress={() => handleBuySkin(skin.id, skin.price, skin.label)}
                        disabled={buyingId === skin.id || user.balance < skin.price}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.buyText}>{buyingId === skin.id ? "..." : skin.price}</Text>
                            {buyingId !== skin.id && <DirtyCashIcon size={14} color="#000" />}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.ownedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                    </View>
                )}

                <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => handlePreview('skin', skin)}
                >
                    <EyeIcon size={24} color={theme.colors.accent} />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>


            <View style={styles.balanceHeader}>
                <View style={styles.balancePill}>
                    <Text style={styles.balanceLabel}>SALDO:</Text>
                    <Text style={styles.balanceValue}>{user?.balance || 0}</Text>
                    <DirtyCashIcon size={20} color="#d4af37" />
                </View>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 15, gap: 8 }}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'themes' && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setActiveTab('themes')}
                >
                    <PaletteIcon size={20} color={activeTab === 'themes' ? '#000' : '#888'} />
                    <Text style={[styles.tabText, { color: activeTab === 'themes' ? '#000' : '#888' }]}>Temi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'skins' && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setActiveTab('skins')}
                >
                    <CardsIcon size={24} color={activeTab === 'skins' ? '#000' : '#888'} />
                    <Text style={[styles.tabText, { color: activeTab === 'skins' ? '#000' : '#888' }]}>SKIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'frames' && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                    onPress={() => setActiveTab('frames')}
                >
                    <EyeIcon size={26} color={activeTab === 'frames' ? '#000' : '#888'} />
                    <Text style={[styles.tabText, { color: activeTab === 'frames' ? '#000' : '#888' }]}>CORNICI</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {activeTab === 'themes' && Object.values(THEMES).map(t => {
                    if (['default', 'onice', 'ghiaccio'].includes(t.id)) return null;
                    return renderThemeItem(t);
                })}
                {activeTab === 'skins' && Object.values(CARD_SKINS).map(s => {
                    if (s.id === 'classic') return null;
                    return renderSkinItem(s);
                })}

                {/* Frame Grid Container */}
                {activeTab === 'frames' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {Object.values(AVATAR_FRAMES).map(f => {
                            if (['basic', 'capo'].includes(f.id)) return null;
                            return renderFrameItem(f);
                        })}
                    </View>
                )}
            </ScrollView>

            <ConfirmationModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                onClose={() => setModal({ ...modal, visible: false })}
                singleButton={true}
                confirmText="OK"
                onConfirm={() => setModal({ ...modal, visible: false })}
            />

            {/* [NEW] Preview Modal Overlay - Wrapped in Modal for full-screen dimming */}
            <Modal
                transparent={true}
                visible={!!preview}
                animationType="none"
                onRequestClose={handleClosePreview}
            >
                {preview && !isClosing && (
                    <Animated.View
                        entering={FadeIn.duration(250)}
                        exiting={FadeOut.duration(250)}
                        style={styles.previewOverlayContainer}
                    >
                        <EfficientBlurView intensity={Platform.OS === 'android' ? 20 : 40} tint="dark" style={styles.blurBackdrop}>
                            <TouchableOpacity
                                style={styles.backdropClick}
                                activeOpacity={1}
                                onPress={handleClosePreview}
                            />

                            <Animated.View
                                entering={ZoomIn.duration(300).easing(Easing.out(Easing.back(1.5)))}
                                exiting={ZoomOut.duration(200)}
                                style={[styles.previewModal, { borderColor: theme.colors.accent, shadowColor: theme.colors.accent }]}
                            >
                                {/* Header Section */}
                                <View style={styles.previewHeaderNew}>
                                    <Text style={[styles.previewSubtitle, { color: theme.colors.accent }]}>
                                        ANTEPRIMA {preview?.type === 'skin' ? 'SKIN' : 'TEMA'}
                                    </Text>
                                    {preview?.type === 'skin' && (
                                        <Text style={styles.previewTitleMain}>
                                            {preview?.item?.label}
                                        </Text>
                                    )}
                                </View>

                                {/* Content Section */}
                                <View style={styles.previewContent}>
                                    {preview?.type === 'skin' ? (
                                        <View style={[styles.largeCard, {
                                            backgroundColor: preview.item.styles.bg,
                                            borderColor: preview.item.styles.border,
                                            borderWidth: 1, // Thinner border for elegance
                                        }]}>
                                            {/* Texture Layer */}
                                            {preview.item.styles.texture && TEXTURES[preview.item.styles.texture] && (
                                                <Image
                                                    source={TEXTURES[preview.item.styles.texture]}
                                                    style={[StyleSheet.absoluteFill, {
                                                        opacity: preview.item.id === 'mida' ? 0.6 : 0.25,
                                                        transform: [{ scale: 1.1 }] // Slight zoom to avoid edge clipping
                                                    }]}
                                                    resizeMode="cover"
                                                />
                                            )}

                                            {/* Card Text */}
                                            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
                                                <Text style={{
                                                    color: preview.item.styles.text,
                                                    fontFamily: preview.item.id === 'narco' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') : 'Outfit',
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    textAlign: 'left', // More natural reading
                                                    lineHeight: 22
                                                }}>
                                                    La corruzione è l'unica via per la salvezza.
                                                </Text>
                                            </View>

                                            {/* Card Footer (Brand/Icon placeholder) */}
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
                                                    {preview.item.label}
                                                </Text>

                                                <Text style={[styles.themeCardSubtitle, { color: preview.item.colors.accent }]}>
                                                    {preview.item.particleConfig ? 'EFFETTI DINAMICI' : 'DECORAZIONE STATICA'}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Footer / Close Action */}
                                <TouchableOpacity
                                    style={[styles.closeButton, { borderColor: 'rgba(255,255,255,0.2)' }]}
                                    onPress={handleClosePreview}
                                >
                                    <Text style={styles.closeButtonText}>CHIUDI ANTEPRIMA</Text>
                                </TouchableOpacity>

                            </Animated.View>
                        </EfficientBlurView>
                    </Animated.View>
                )}
            </Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    balanceHeader: {
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 10
    },
    balancePill: {
        flexDirection: 'row',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        alignItems: 'center',
        gap: 8
    },
    balanceLabel: {
        fontFamily: 'Outfit',
        color: '#d4af37',
        fontSize: 14,
        letterSpacing: 1
    },
    balanceValue: {
        fontFamily: 'Outfit-Bold',
        color: '#d4af37',
        fontSize: 18,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 12
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1
    },
    // [NEW] Vertical Card Style for Frames
    cardFrame: {
        width: '48%', // Grid column width
        flexDirection: 'column',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 12
    },
    previewCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    infoContainer: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
        paddingRight: 10,
    },
    themeName: {
        fontSize: 15, // Slightly smaller base
        fontFamily: 'Cinzel-Bold',
        marginBottom: 2,
        flexShrink: 1, // Crucial for ellipsis logic in flex
    },
    themeDesc: {
        color: '#888',
        fontSize: 11,
        fontFamily: 'Outfit'
    },
    buyButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 70
    },
    buyText: {
        color: '#000',
        fontFamily: 'Outfit-Bold',
        fontWeight: 'bold',
        fontSize: 14
    },
    ownedBadge: {
        padding: 5,
        marginRight: 2
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    tabText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 10,
        textTransform: 'uppercase'
    },
    skinPreview: {
        width: 30,
        height: 42,
        borderRadius: 4,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    previewButton: {
        padding: 8,
        marginLeft: 5,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    previewOverlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    blurBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdropClick: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker dim for focus
    },
    previewModal: {
        width: '90%',
        maxWidth: 420,
        backgroundColor: '#1a1a1a', // Keep it specific, not just hex
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 30,
        borderWidth: 1,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 20,
    },
    previewHeaderNew: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 25,
    },
    previewSubtitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.9,
        marginBottom: 5
    },
    previewTitleMain: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 24, // Bigger
        color: '#fff',
        textAlign: 'center',
    },
    previewContent: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
    },
    largeCard: {
        width: 180, // Larger scale
        height: 252, // 1.4 Aspect Ratio
        borderRadius: 16, // Proportional
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 15,
        overflow: 'hidden'
    },
    themePreviewContainer: {
        width: 180,
        height: 252,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 15,
        overflow: 'hidden',
        position: 'relative'
    },
    previewCircleLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    themeCardTitle: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    themeCardSubtitle: {
        fontFamily: 'Outfit-Bold',
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2
    },
    closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    closeButtonText: {
        color: '#fff',
        fontFamily: 'Outfit-Bold',
        fontSize: 12,
        letterSpacing: 1
    }
});
