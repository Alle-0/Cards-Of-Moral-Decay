import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, BackHandler, Platform, Share, useWindowDimensions, ActivityIndicator, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import PremiumIconButton from '../components/PremiumIconButton';
import PremiumBackground from '../components/PremiumBackground'; // [NEW] Wrapper
import { TrashIcon, LinkIcon, CheckIcon, CrossIcon, ShareIcon, ReportIcon } from '../components/Icons';
import HapticsService from '../services/HapticsService';
import Animated, { ZoomIn, ZoomOut, FadeIn, FadeOut, FadeInRight, FadeInLeft, useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import ToastNotification from '../components/ToastNotification';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BASE_URL } from '../constants/Config';
import NotificationService from '../services/NotificationService';
import { db } from '../services/firebase';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { RANK_COLORS, getRankKey } from '../constants/Ranks';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../hooks/useLiquidAnimation';
import PremiumSkeleton from '../components/PremiumSkeleton';

const TabItem = ({ title, index, tabBarWidth, tabIndicatorX, theme }) => {
    const textColorStyle = useAnimatedStyle(() => {
        if (tabBarWidth.value <= 0) return {};
        const tabWidth = (tabBarWidth.value - 10) / 2;
        const start = (index - 1) * tabWidth;
        const center = index * tabWidth;
        const end = (index + 1) * tabWidth;

        const color = interpolateColor(
            tabIndicatorX.value,
            [start, center, end],
            ['#666666', '#000000', '#666666']
        );
        return { color };
    });

    return (
        <View style={{ flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', zIndex: 10 }} pointerEvents="none">
            <Animated.Text style={[styles.tabText, textColorStyle]}>
                {title}
            </Animated.Text>
        </View>
    );
};

const SkeletonFriendRow = () => (
    <View style={[styles.friendRow, { opacity: 0.5, borderStyle: 'dotted' }]}>
        <PremiumSkeleton width={120} height={18} />
        <PremiumSkeleton width={36} height={36} borderRadius={18} />
    </View>
);

const SkeletonLeaderboardRow = () => (
    <View style={[styles.leaderboardItem, { opacity: 0.5 }]}>
        <View style={styles.leaderboardIndex}>
            <PremiumSkeleton width={20} height={20} />
        </View>
        <View style={styles.playerInfo}>
            <PremiumSkeleton width="60%" height={16} style={{ marginBottom: 6 }} />
            <PremiumSkeleton width="40%" height={12} />
        </View>
        <View style={styles.scoreInfo}>
            <PremiumSkeleton width={50} height={18} style={{ marginBottom: 4 }} />
            <PremiumSkeleton width={40} height={10} />
        </View>
    </View>
);

const FriendsScreen = () => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && windowWidth >= 1024;
    const {
        user: authUser,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        reportPlayer
    } = useAuth();

    const [friendInput, setFriendInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [friendToDelete, setFriendToDelete] = useState(null);
    const [showExitModal, setShowExitModal] = useState(false);

    const friends = authUser?.friends || {};
    const friendRequests = authUser?.friendRequests || {};
    const myUsername = authUser?.username;

    const [activeTab, setActiveTab] = useState(0); // 0 = friends, 1 = leaderboard
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [players, setPlayers] = useState([]);

    // Tab Animation Shared Values
    const tabBarWidth = useSharedValue(0);
    const tabIndicatorX = useSharedValue(0);
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDraggingSV = useSharedValue(false);

    const tabBarWidthRef = useRef(0);
    const activeTabRef = useRef(activeTab);
    const isInteracting = useRef(false);
    const isGrabbingIndicator = useRef(false);

    const indicatorScale = useLiquidScale(tabIndicatorX, startX, targetX, isDraggingSV, 1.15);

    useEffect(() => {
        activeTabRef.current = activeTab;
        if (!isInteracting.current && tabBarWidth.value > 0) {
            const tabWidth = (tabBarWidth.value - 10) / 2;
            const targetPos = activeTab * tabWidth;
            startX.value = tabIndicatorX.value;
            targetX.value = targetPos;
            tabIndicatorX.value = withSpring(targetPos, SNAP_SPRING_CONFIG);
        }
    }, [activeTab]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (tabBarWidthRef.current <= 0) return;
                if (tabBarWidthRef.current <= 0) return;
                const tabWidth = (tabBarWidthRef.current - 10) / 2;
                const touchedIndex = Math.floor((evt.nativeEvent.locationX - 5) / tabWidth);
                isGrabbingIndicator.current = (touchedIndex === activeTabRef.current);
                isInteracting.current = true;
                if (isGrabbingIndicator.current) {
                    HapticsService.trigger('selection');
                    isDraggingSV.value = true;
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (tabBarWidthRef.current <= 0) return;
                const tabWidth = (tabBarWidthRef.current - 10) / 2;
                const maxRange = (tabBarWidthRef.current - 10) - tabWidth;
                let newX = (activeTabRef.current * tabWidth) + gestureState.dx;
                tabIndicatorX.value = Math.max(0, Math.min(newX, maxRange));
            },
            onPanResponderRelease: (evt, gestureState) => {
                const tabWidth = (tabBarWidthRef.current - 10) / 2;
                let targetIndex = activeTabRef.current;
                if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    targetIndex = Math.floor((evt.nativeEvent.locationX - 5) / tabWidth);
                } else if (isGrabbingIndicator.current) {
                    targetIndex = Math.round(tabIndicatorX.value / tabWidth);
                }
                targetIndex = Math.max(0, Math.min(1, targetIndex));
                if (targetIndex !== activeTabRef.current) {
                    HapticsService.trigger('light');
                    setActiveTab(targetIndex);
                }
                const targetPos = targetIndex * tabWidth;
                updateLiquidAnchors(startX, targetX, isDraggingSV, tabIndicatorX.value, targetPos);
                tabIndicatorX.value = withSpring(targetPos, SNAP_SPRING_CONFIG);
                isInteracting.current = false;
                isGrabbingIndicator.current = false;
            }
        })
    ).current;

    const indicatorStyle = useAnimatedStyle(() => ({
        width: tabBarWidth.value > 0 ? (tabBarWidth.value - 10) / 2 : 0,
        transform: [{ translateX: tabIndicatorX.value }, { scale: indicatorScale.value }]
    }));

    // [NEW] Notification Listeners
    useEffect(() => {
        // Handle foreground notifications
        const notificationListener = NotificationService.Notifications.addNotificationReceivedListener(notification => {
            console.log("Notification Received!", notification);
            // Optionally refresh or show specific toast
            const title = notification.request.content.title;
            const body = notification.request.content.body;
            setToast({ visible: true, message: `${title}: ${body}`, type: 'info' });
        });

        // Handle interaction (tap)
        const responseListener = NotificationService.Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification Tapped!", response);
            // Verify if we are already here, maybe scroll to request section?
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    const handleSend = async () => {
        if (!friendInput.trim()) return;

        // [NEW] Self-friend check with translation
        if (friendInput.trim() === myUsername) {
            setToast({ visible: true, message: t('cannot_be_friend_self'), type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await sendFriendRequest(friendInput);
            setFriendInput('');
            setToast({ visible: true, message: t('toast_req_sent'), type: 'success' });
        } catch (e) {
            setToast({ visible: true, message: e.message || "Errore", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const copyMyId = async () => {
        await Clipboard.setStringAsync(myUsername);
        setToast({ visible: true, message: t('toast_id_copied'), type: 'success' });
    };

    const shareMyId = async () => {
        try {
            await Share.share({
                message: t('share_msg', { id: myUsername, url: BASE_URL }),
            });
        } catch (error) {
            console.log(error);
        }
    };

    const friendList = Object.keys(friends || {});
    const requestList = Object.keys(friendRequests || {});

    // Android Back Handler
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const backAction = () => {
                setShowExitModal(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }, [])
    );

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <View style={[
                { flex: 1 },
                isDesktop && {
                    alignSelf: 'center',
                    width: '100%',
                    maxWidth: 720,
                    paddingHorizontal: 40,
                    justifyContent: 'center'
                }
            ]}>
                {/* Header Title */}
                <Text style={{
                    color: theme.colors.accent,
                    fontFamily: 'CinzelBold',
                    fontSize: 24,
                    marginTop: isDesktop ? 35 : 50,
                    marginBottom: 20,
                    textAlign: 'center'
                }}>
                    {t('friends_title')}
                </Text>

                {/* [NEW] Premium Sliding Tab Switcher */}
                <View
                    style={styles.tabBarContainer}
                    onLayout={(e) => {
                        const w = e.nativeEvent.layout.width;
                        tabBarWidth.value = w;
                        tabBarWidthRef.current = w;
                    }}
                    {...panResponder.panHandlers}
                >
                    <Animated.View style={[
                        {
                            position: 'absolute',
                            top: 4, bottom: 4, left: 5,
                            backgroundColor: theme.colors.accent,
                            borderRadius: 8,
                        },
                        indicatorStyle
                    ]} pointerEvents="none" />

                    <TabItem
                        title={t('your_friends').toUpperCase()}
                        index={0}
                        activeTab={activeTab}
                        tabBarWidth={tabBarWidth}
                        tabIndicatorX={tabIndicatorX}
                        theme={theme}
                    />
                    <TabItem
                        title={t('section_leaderboard').toUpperCase()}
                        index={1}
                        activeTab={activeTab}
                        tabBarWidth={tabBarWidth}
                        tabIndicatorX={tabIndicatorX}
                        theme={theme}
                    />
                </View>

                <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
                    {activeTab === 0 && (
                        <Animated.View
                            key="friends-tab"
                            entering={FadeInLeft.duration(300)}
                            exiting={FadeOut.duration(200)}
                            style={{ flex: 1 }}
                        >
                            {/* My ID Section */}
                            <View style={styles.idContainer}>
                                <View>
                                    <Text style={[styles.label, { color: '#888' }]}>{t('your_id')}</Text>
                                    <Text style={[styles.myId, { color: theme.colors.accent, fontSize: 20, marginTop: 4 }]}>{myUsername}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <PremiumIconButton
                                        icon={<LinkIcon size={18} color="#000" />}
                                        onPress={copyMyId}
                                        size={40}
                                        style={{ backgroundColor: theme.colors.accent, borderRadius: 12 }}
                                    />
                                    <PremiumIconButton
                                        icon={<ShareIcon size={18} color="#fff" />}
                                        onPress={shareMyId}
                                        size={40}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                                    />
                                </View>
                            </View>

                            {/* Add Friend Request Section */}
                            <View style={styles.addSection}>
                                <PremiumInput
                                    value={friendInput}
                                    onChangeText={setFriendInput}
                                    label={t('friend_id_label')}
                                    style={{ flex: 1, marginVertical: 0, height: 60 }}
                                />
                                <PremiumButton
                                    title={t('send_btn')}
                                    onPress={handleSend}
                                    disabled={loading || !friendInput.trim()}
                                    style={{ width: 90, marginLeft: 12, height: 60, backgroundColor: theme.colors.accent, marginVertical: 0, borderRadius: 20 }}
                                    textStyle={{ color: '#000', fontSize: 13, fontFamily: 'CinzelBold' }}
                                />
                            </View>

                            <ScrollView style={styles.list} contentContainerStyle={{ gap: 15, paddingBottom: 80 + insets.bottom }} showsVerticalScrollIndicator={false}>

                                {/* INCOMING REQUESTS */}
                                {requestList.length > 0 && (
                                    <View>
                                        <Text style={[styles.sectionHeader, { color: theme.colors.accent }]}>
                                            {t('incoming_requests')} ({requestList.length})
                                        </Text>
                                        <View style={{ gap: 10 }}>
                                            {requestList.map(reqName => (
                                                <View key={reqName} style={[styles.friendRow, { borderColor: theme.colors.accent }]}>
                                                    <Text style={[styles.friendName, { color: '#fff' }]}>{reqName}</Text>
                                                    {(reqName || '').trim().toLowerCase() === (myUsername || '').trim().toLowerCase() && (
                                                        <View style={{
                                                            marginLeft: 6,
                                                            backgroundColor: theme.colors.accent,
                                                            paddingHorizontal: 5,
                                                            paddingVertical: 0.5,
                                                            borderRadius: 3,
                                                        }}>
                                                            <Text style={{
                                                                fontFamily: 'OutfitBold',
                                                                color: '#000',
                                                                fontSize: 8.5,
                                                            }}>
                                                                {t('you_label') || 'TU'}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    <View style={{ flexDirection: 'row', gap: 5 }}>
                                                        <PremiumIconButton
                                                            icon={<CheckIcon size={16} color="#4ade80" />}
                                                            onPress={() => acceptFriendRequest(reqName)}
                                                            size={32}
                                                            style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', borderRadius: 32 }}
                                                        />
                                                        <PremiumIconButton
                                                            icon={<CrossIcon size={16} color="#ef4444" />}
                                                            onPress={() => rejectFriendRequest(reqName)}
                                                            size={32}
                                                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 32 }}
                                                        />
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 15 }} />
                                    </View>
                                )}

                                {/* FRIENDS LIST */}
                                <View>
                                    <Text style={[styles.sectionHeader, { color: '#666' }]}>
                                        {t('your_friends')} ({friendList.length})
                                    </Text>

                                    {friendList.length === 0 ? (
                                        <Text style={styles.emptyText}>{t('no_friends_msg')}</Text>
                                    ) : (
                                        <View style={{ gap: 10 }}>
                                            {friendList.map(friendName => (
                                                <View key={friendName} style={styles.friendRow}>
                                                    <Text style={styles.friendName}>{friendName}</Text>
                                                    <PremiumIconButton
                                                        icon={<TrashIcon size={18} color="#ef4444" />}
                                                        onPress={() => setFriendToDelete(friendName)}
                                                        size={36}
                                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 32 }}
                                                        hoverColor="rgba(239, 68, 68, 0.25)"
                                                    />
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        </Animated.View>
                    )}

                    {activeTab === 1 && (
                        <Animated.View
                            key="leaderboard-tab"
                            entering={FadeInRight.duration(300)}
                            exiting={FadeOut.duration(200)}
                            style={{ flex: 1 }}
                        >
                            <LeaderboardSection t={t} theme={theme} insets={insets} players={players} setPlayers={setPlayers} loading={leaderboardLoading} setLoading={setLeaderboardLoading} isDesktop={isDesktop} setToast={setToast} />
                        </Animated.View>
                    )}
                </View>
            </View>

            <ConfirmationModal
                visible={!!friendToDelete}
                onClose={() => setFriendToDelete(null)}
                title={t('confirm_delete_title')}
                message={t('confirm_delete_msg')}
                confirmText={t('farewell_btn')}
                onConfirm={() => {
                    removeFriend(friendToDelete);
                    setFriendToDelete(null);
                }}
            />

            <ConfirmationModal
                visible={showExitModal}
                onClose={() => setShowExitModal(false)}
                title={t('exit_app_title')}
                message={t('exit_app_msg')}
                confirmText={t('exit_btn_small')}
                onConfirm={() => BackHandler.exitApp()}
            />

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
                duration={2000}
                style={{ bottom: 100 }} // Higher to not overlap navigation
            />
        </View>
    );
};

const styles = StyleSheet.create({
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20
    },
    label: {
        fontFamily: 'Outfit',
        fontSize: 14,
    },
    idBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    myId: {
        fontFamily: 'CinzelBold',
        fontSize: 16,
    },
    addSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        zIndex: 10
    },
    sectionHeader: {
        fontFamily: 'CinzelBold',
        fontSize: 14,
        marginBottom: 10,
        letterSpacing: 1
    },
    list: {
        flex: 1,
    },
    emptyText: {
        color: '#555',
        fontFamily: 'Outfit',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a80',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    friendName: {
        color: '#ddd',
        fontFamily: 'Outfit',
        fontSize: 16
    },
    confirmBox: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
        width: '90%',
        alignItems: 'center'
    },
    confirmTitle: {
        color: '#ef4444',
        fontFamily: 'CinzelBold',
        fontSize: 18,
        marginBottom: 10
    },
    confirmText: {
        color: '#fff',
        fontFamily: 'Outfit',
        textAlign: 'center',
        fontSize: 16
    },
    // Tab Styles
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
        minHeight: 30,
        width: '100%',
        maxWidth: 280,
        alignSelf: 'center'
    },
    tabIndicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 5,
        borderRadius: 8,
        zIndex: 1,
    },
    tabText: {
        fontFamily: 'OutfitBold',
        fontSize: 11,
        letterSpacing: 0.5
    },
    // Leaderboard Styles
    leaderboardContainer: {
        flex: 1,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    leaderboardItemMe: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 211, 106, 0.4)', // Safe fallback
        borderWidth: 1.2,
    },
    myRankSticky: {
        marginTop: 32,
        paddingHorizontal: 0,
    },
    myRankLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'OutfitBold',
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    meBadge: {
        marginLeft: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    meBadgeText: {
        fontFamily: 'OutfitBold',
        fontSize: 8,
        color: '#000',
    },
    leaderboardIndex: {
        width: 35,
        alignItems: 'center',
    },
    positionText: {
        fontFamily: 'CinzelBold',
        fontSize: 15,
    },
    playerInfo: {
        flex: 1,
        paddingHorizontal: 10,
    },
    nicknameText: {
        fontFamily: 'OutfitBold',
        fontSize: 14.5,
        marginBottom: 2,
    },
    rankText: {
        fontFamily: 'Outfit',
        fontSize: 11,
        textTransform: 'capitalize',
        letterSpacing: 0.5,
    },
    scoreInfo: {
        alignItems: 'flex-end',
        minWidth: 70,
    },
    scoreText: {
        fontFamily: 'CinzelBold',
        fontSize: 17,
    },
    scoreLabel: {
        fontFamily: 'Outfit',
        color: '#666',
        fontSize: 10,
        marginTop: -2,
    }
});

const LeaderboardSection = ({ t, theme, insets, players, setPlayers, loading, setLoading, isDesktop, setToast }) => {
    const { user, reportPlayer } = useAuth();
    const [playerToReport, setPlayerToReport] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const usersRef = ref(db, 'users');
                const topQuery = query(usersRef, orderByChild('totalScore'), limitToLast(100)); // Increased limit to find valid players
                const snapshot = await get(topQuery);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const EXCLUDED_USERS = ["Alle", "Prova", "Prova2", "Prova3", "Friend", "Antigravity_Bot"];

                    const playersList = Object.entries(data)
                        .map(([id, val]) => ({ id, ...val }))
                        .filter(player =>
                            !EXCLUDED_USERS.includes(player.id) &&
                            (player.totalScore || 0) > 0 // FILTER INACTIVE
                        )
                        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                        .slice(0, 50); // Show top 50 in the new social section

                    setPlayers(playersList);
                }
            } catch (error) {
                console.error("[LEADERBOARD] Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading && players.length === 0) {
        return (
            <ScrollView
                style={styles.leaderboardContainer}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
                showsVerticalScrollIndicator={false}
            >
                {[...Array(10)].map((_, i) => (
                    <SkeletonLeaderboardRow key={i} />
                ))}
            </ScrollView>
        );
    }

    if (players.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 16 }}>
                    {t('no_data') || "Nessun dato disponibile."}
                </Text>
            </View>
        );
    }

    const meInTop = players.find(p => (p.username || p.id) === user?.username);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.leaderboardContainer}
                contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}
                showsVerticalScrollIndicator={false}
            >
                {players.map((player, index) => {
                    const isMe = (player.username || player.id) === user?.username;
                    return (
                        <View key={player.id} style={[styles.leaderboardItem, isMe && styles.leaderboardItemMe]}>
                            <View style={styles.leaderboardIndex}>
                                <Text style={[styles.positionText, {
                                    color: index === 0 ? '#FFD700' :
                                        index === 1 ? '#C0C0C0' :
                                            index === 2 ? '#CD7F32' :
                                                '#666'
                                }]}>
                                    #{index + 1}
                                </Text>
                            </View>
                            <View style={styles.playerInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.nicknameText, { color: '#fff' }]} numberOfLines={1}>
                                        {player.nickname || player.username || player.id || 'Anonymous'}
                                    </Text>
                                    {isMe && (
                                        <View style={[styles.meBadge, { backgroundColor: theme.colors.accent }]}>
                                            <Text style={styles.meBadgeText}>{t('you_label') || 'TU'}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.rankText, { color: RANK_COLORS[getRankKey(player.rank)] || theme.colors.accent }]}>
                                    {t(`rank_${(player.rank || '').toLowerCase().replace(/ /g, '_')}`) || player.rank}
                                </Text>
                            </View>
                            <View style={styles.scoreInfo}>
                                <Text style={[styles.scoreText, { color: theme.colors.accent }]}>
                                    {(player.totalScore || 0).toLocaleString()}
                                </Text>
                                <Text style={styles.scoreLabel}>DC</Text>
                            </View>

                            {/* Reporting Action - Discrete IconButton with Hover for PC */}
                            {(player.username || player.id) !== user?.username && (
                                <PremiumIconButton
                                    icon={<ReportIcon size={14} color="rgba(239, 68, 68, 0.45)" />}
                                    onPress={() => {
                                        setPlayerToReport(player);
                                        setShowReportModal(true);
                                        HapticsService.trigger('impactLight');
                                    }}
                                    size={28}
                                    style={{
                                        marginLeft: 4,
                                        backgroundColor: 'transparent',
                                    }}
                                    hoverColor="rgba(239, 68, 68, 0.12)"
                                />
                            )}
                        </View>
                    );
                })}

                {/* My Rank Footer (In-list) if not in Top list */}
                {!meInTop && user && (
                    <View style={styles.myRankSticky}>
                        <Text style={styles.myRankLabel}>
                            {t('your_position_label') || "LA TUA POSIZIONE ATTUALE"}
                        </Text>
                        <View style={[styles.leaderboardItem, styles.leaderboardItemMe, { marginHorizontal: 0 }, { borderColor: theme.colors.accent }]}>
                            <View style={styles.leaderboardIndex}>
                                <Text style={[styles.positionText, { color: '#888' }]}>
                                    ??
                                </Text>
                            </View>
                            <View style={styles.playerInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.nicknameText, { color: '#fff' }]} numberOfLines={1}>
                                        {user.nickname || user.username || 'Anonymous'}
                                    </Text>
                                    <View style={[styles.meBadge, { backgroundColor: theme.colors.accent }]}>
                                        <Text style={styles.meBadgeText}>{t('you_label') || 'TU'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.rankText, { color: RANK_COLORS[getRankKey(user.rank)] || theme.colors.accent }]}>
                                    {t(`rank_${(user.rank || '').toLowerCase().replace(/ /g, '_')}`) || user.rank}
                                </Text>
                            </View>
                            <View style={styles.scoreInfo}>
                                <Text style={[styles.scoreText, { color: theme.colors.accent }]}>
                                    {(user.totalScore || 0).toLocaleString()}
                                </Text>
                                <Text style={styles.scoreLabel}>DC</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Existing Modal Reuse for Reporting */}
            <ConfirmationModal
                visible={showReportModal}
                title={t('report_player_title') || 'SEGNALA GIOCATORE'}
                message={t('report_player_msg', { name: playerToReport?.nickname || playerToReport?.username || playerToReport?.id })}
                confirmText={t('report_btn') || 'SEGNALA'}
                onConfirm={async () => {
                    if (playerToReport) {
                        try {
                            const result = await reportPlayer(playerToReport.username || playerToReport.id);
                            if (result.success) {
                                setToast({
                                    visible: true,
                                    message: t('toast_report_sent'),
                                    type: 'success'
                                });
                                HapticsService.trigger('success');
                            } else {
                                let msg = t('toast_report_error');
                                if (result.code === 'COOLDOWN') msg = t('toast_report_cooldown');
                                else if (result.code === 'ALREADY_REPORTED') msg = t('toast_already_reported');
                                else if (result.code === 'SELF_REPORT') msg = t('toast_report_self');

                                setToast({
                                    visible: true,
                                    message: msg,
                                    type: 'error'
                                });
                                HapticsService.trigger('error');
                            }
                        } catch (e) {
                            console.error("[REPORT] Failed:", e);
                            setToast({
                                visible: true,
                                message: t('toast_report_error'),
                                type: 'error'
                            });
                        }
                        setShowReportModal(false);
                    }
                }}
                onClose={() => {
                    setShowReportModal(false);
                }}
            />
        </View>
    );
};

export default FriendsScreen;

