import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, PanResponder, FlatList, Platform, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withSequence, withTiming, useDerivedValue, LinearTransition, Easing, FadeIn, ZoomIn, interpolate } from 'react-native-reanimated';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../../hooks/useLiquidAnimation';

// ...

import RoomItem from '../RoomItem';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext'; // [NEW]
import { useGame } from '../../context/GameContext'; // [NEW]
import HapticsService from '../../services/HapticsService';
import PremiumSkeleton from '../PremiumSkeleton';
import ConfirmationModal from '../ConfirmationModal';

const TabItem = ({ label, index, dragX }) => {
    const textStyle = useAnimatedStyle(() => {
        const itemCenter = index * 50;
        const color = interpolateColor(
            dragX.value,
            [itemCenter - 25, itemCenter, itemCenter + 25],
            ['rgba(255,255,255,0.3)', '#000000', 'rgba(255,255,255,0.3)']
        );
        return { color, fontWeight: 'bold' };
    });

    return (
        <View style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2 }} pointerEvents="none">
            <Animated.Text style={[{ fontSize: 11, letterSpacing: 0.5, fontFamily: 'Cinzel-Bold' }, textStyle]}>
                {label}
            </Animated.Text>
        </View>
    );
};

const SkeletonRoomItem = () => (
    <View style={{
        paddingVertical: 8, // Reduced from 10
        paddingHorizontal: 14,
        marginBottom: 6,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        alignSelf: 'center',
        height: 54 // Explicit height matching RoomItem (roughly)
    }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
            <View style={{ marginRight: 10 }}>
                <PremiumSkeleton width={16} height={16} borderRadius={4} />
            </View>
            <PremiumSkeleton width={50} height={10} borderRadius={6} />
            <View style={{ width: 8 }} />
            <View style={{ marginRight: 6 }}>
                <PremiumSkeleton width={12} height={12} borderRadius={6} />
            </View>
            <PremiumSkeleton width={80} height={8} borderRadius={4} />
        </View>
        <PremiumSkeleton width={50} height={20} borderRadius={10} />
    </View>
);

const RoomListStep = ({ friendsRooms, publicRooms, onJoinRoom, scrollEnabled = true, isLoading = false, currentTab, setCurrentTab }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { deleteRoom } = useGame();

    // activeList calculation
    const activeList = React.useMemo(() => {
        return currentTab === 'friends' ? (friendsRooms || []) : (publicRooms || []);
    }, [currentTab, friendsRooms, publicRooms]);

    const isFetching = isLoading || (currentTab === 'friends' ? friendsRooms === null : publicRooms === null);

    // Animation Values (0 to 100 percentage)
    const dragXPercent = useSharedValue(0);
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDraggingSV = useSharedValue(isFetching);

    const tabScale = useLiquidScale(dragXPercent, startX, targetX, isDraggingSV, 1.1);

    const gestureStartX = useRef(0);
    const touchStartX = useRef(0);
    const containerWidthRef = useRef(0);
    const isGrabbingIndicator = useRef(false);
    const activeTabRef = useRef(currentTab);

    // Sync activeTab ref
    useEffect(() => {
        activeTabRef.current = currentTab;
    }, [currentTab]);

    // Animate tab change
    useEffect(() => {
        const target = currentTab === 'friends' ? 0 : 50;
        startX.value = dragXPercent.value;
        targetX.value = target;
        dragXPercent.value = withSpring(target, SNAP_SPRING_CONFIG);
    }, [currentTab]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                gestureStartX.current = dragXPercent.value;
                touchStartX.current = evt.nativeEvent.locationX;
                const containerWidth = containerWidthRef.current || 300;
                const halfWidth = containerWidth / 2;
                const touchedSide = touchStartX.current < halfWidth ? 'friends' : 'public';
                isGrabbingIndicator.current = (touchedSide === activeTabRef.current);
                if (isGrabbingIndicator.current) {
                    HapticsService.trigger('selection');
                    isDraggingSV.value = true;
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isGrabbingIndicator.current) return;
                const containerWidth = containerWidthRef.current || 300;
                const deltaPercent = (gestureState.dx / containerWidth) * 100;
                let newPercent = gestureStartX.current + deltaPercent;
                // Rubber Banding
                if (newPercent < 0) {
                    newPercent = newPercent * 0.2;
                } else if (newPercent > 50) {
                    newPercent = 50 + (newPercent - 50) * 0.2;
                }
                dragXPercent.value = newPercent;
            },
            onPanResponderRelease: (evt, gestureState) => {
                const isClick = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
                let targetPercent;
                if (isClick) {
                    const containerWidth = containerWidthRef.current || 300;
                    const clickedSide = touchStartX.current < (containerWidth / 2) ? 'friends' : 'public';
                    targetPercent = clickedSide === 'friends' ? 0 : 50;
                } else {
                    targetPercent = dragXPercent.value > 25 ? 50 : 0;
                }
                const newTab = targetPercent === 0 ? 'friends' : 'public';
                setCurrentTab(newTab);
                if (newTab !== activeTabRef.current) {
                    HapticsService.trigger('selection');
                }
                updateLiquidAnchors(startX, targetX, isDraggingSV, dragXPercent.value, targetPercent);
                dragXPercent.value = withSpring(targetPercent, SNAP_SPRING_CONFIG);
            },
        })
    ).current;

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: interpolate(dragXPercent.value, [0, 50], [2, 0.5]) },
                { scale: tabScale.value }
            ],
            left: `${dragXPercent.value}%`
        };
    });

    const [roomToDelete, setRoomToDelete] = React.useState(null);

    const handleLongPress = (room) => {
        const isCreator = (room.creatorUsername && room.creatorUsername === user?.username) ||
            (room.creatore === user?.name) ||
            (room.creatore === user?.username);

        if (isCreator) {
            HapticsService.trigger('impactHeavy');
            setRoomToDelete(room);
        }
    };

    const handleConfirmDelete = async () => {
        if (!roomToDelete) return;
        try {
            await deleteRoom(roomToDelete.id);
        } catch (e) {
            Alert.alert("Errore", "Impossibile eliminare la stanza.");
        }
        setRoomToDelete(null);
    };

    return (
        <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
            {/* FIXED TABS HEADER */}
            <View style={{ width: '100%', marginTop: 10, paddingBottom: 5 }}>
                <View
                    style={[
                        styles.tabsContainer,
                        { borderColor: 'rgba(255,255,255,0.1)' }
                    ]}
                    onLayout={(e) => {
                        containerWidthRef.current = e.nativeEvent.layout.width;
                    }}
                >
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.animatedBackground,
                            indicatorStyle,
                            { backgroundColor: theme.colors.accent }
                        ]}
                    />
                    <TabItem label={t('tab_friends_rooms')} index={0} dragX={dragXPercent} />
                    <TabItem label={t('tab_public_rooms')} index={1} dragX={dragXPercent} />
                    <View
                        style={StyleSheet.absoluteFill}
                        {...panResponder.panHandlers}
                    />
                </View>
            </View>

            <View style={{ flex: 1, width: '100%' }}>
                <FlatList
                    data={activeList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <Animated.View
                            entering={FadeIn.delay(index * 100).springify()}
                            style={{ width: '100%' }}
                        >
                            <RoomItem
                                roomName={`${item.id}`}
                                playerCount={Object.keys(item.giocatori || {}).length}
                                state={item.statoPartita === 'LOBBY' ? t('lobby_state') : t('playing_state')}
                                onJoin={() => onJoinRoom(item.id)}
                                onLongPress={() => handleLongPress(item)}
                                joinText={t('join_btn')}
                                creatorName={item.creatore}
                                isOnline={item.giocatori?.[item.creatore]?.online}
                                creatorId={item.creatorUsername || item.creatore}
                                creatorRank={item.giocatori?.[item.creatore]?.rank}
                            />
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        isFetching ? (
                            <View style={{ padding: 10 }}>
                                {[1, 2, 3].map(i => <SkeletonRoomItem key={i} />)}
                            </View>
                        ) : (
                            <View
                                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 }}
                            >
                                <Text style={styles.emptyText}>
                                    {currentTab === 'friends' ? t('no_friends_rooms') : t('no_public_rooms')}
                                </Text>
                            </View>
                        )
                    }
                    scrollEnabled={scrollEnabled}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={false}
                />
            </View>

            <ConfirmationModal
                visible={!!roomToDelete}
                title={t('delete_room_title')}
                message={t('delete_room_confirm')}
                confirmText={t('delete_room_btn')}
                cancelText={t('cancel_btn')}
                onConfirm={handleConfirmDelete}
                onClose={() => setRoomToDelete(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 2,
        marginBottom: 15,
        borderWidth: 1,
        alignSelf: 'center',
        width: '80%',
    },
    animatedBackground: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        width: '50%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 1
    },
    roomList: {
        flex: 1,
        width: '100%',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        marginTop: 10,
        fontFamily: 'Outfit',
        fontStyle: 'italic',
        fontSize: 13
    }
});

export default RoomListStep;
