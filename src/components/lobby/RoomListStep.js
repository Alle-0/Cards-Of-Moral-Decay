import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, PanResponder, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withSequence, withTiming, useDerivedValue } from 'react-native-reanimated';
import { useLiquidScale, updateLiquidAnchors, SNAP_SPRING_CONFIG } from '../../hooks/useLiquidAnimation';

// ...


import RoomItem from '../RoomItem';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import HapticsService from '../../services/HapticsService';

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

const RoomListStep = ({ friendsRooms = [], publicRooms = [], onJoinRoom, scrollEnabled = true, children }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = React.useState('friends'); // 'friends' | 'public'

    // activeList calculation
    const activeList = React.useMemo(() => {
        return activeTab === 'friends' ? (friendsRooms || []) : (publicRooms || []);
    }, [activeTab, friendsRooms, publicRooms]);

    // Animation Values (0 to 100 percentage)
    const dragXPercent = useSharedValue(0);
    const startX = useSharedValue(0);
    const targetX = useSharedValue(0);
    const isDraggingSV = useSharedValue(false);

    const tabScale = useLiquidScale(dragXPercent, startX, targetX, isDraggingSV, 1.1);
    // Refs
    // ... (Keep existing refs and effects logic) ...
    const gestureStartX = useRef(0);
    const touchStartX = useRef(0);
    const containerWidthRef = useRef(0);
    const isGrabbingIndicator = useRef(false);
    const activeTabRef = useRef(activeTab);

    // ... (Keep existing useEffects and PanResponder) ...
    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    useEffect(() => {
        const target = activeTab === 'friends' ? 0 : 50;
        startX.value = dragXPercent.value;
        targetX.value = target;
        dragXPercent.value = withSpring(target, { damping: 40, stiffness: 200, overshootClamping: true });
    }, [activeTab]);

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
                if (newPercent < 0) newPercent = 0;
                if (newPercent > 50) newPercent = 50;
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
                setActiveTab(newTab);
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
            transform: [{ scale: tabScale.value }],
            left: `${dragXPercent.value}%`
        };
    });

    const renderHeader = () => (
        <View>
            {children}
            <View style={{ width: '100%', marginTop: 20 }}>
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
        </View>
    );

    return (
        <View style={{ width: '100%', marginTop: 20, minHeight: 400 }}>
            <FlatList
                data={activeList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <RoomItem
                        roomName={`${item.id}`}
                        playerCount={Object.keys(item.giocatori || {}).length}
                        state={item.statoPartita === 'LOBBY' ? t('lobby_state') : t('playing_state')}
                        onJoin={() => onJoinRoom(item.id)}
                        joinText={t('join_btn')}
                        creatorName={item.creatore}
                        isOnline={item.giocatori?.[item.creatore]?.online}
                        creatorId={item.creatorUsername || item.creatore}
                    />
                )}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={{ minHeight: 100, justifyContent: 'center' }}>
                        <Text style={styles.emptyText}>
                            {t('no_public_rooms')}
                        </Text>
                    </View>
                }
                scrollEnabled={scrollEnabled}
                contentContainerStyle={{ flexGrow: 0, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    // DRAGGABLE TOGGLE (Matching LobbySettingsPanel)
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 2,
        marginBottom: 15,
        borderWidth: 1,
        alignSelf: 'center',
        width: '94%',
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
        width: '100%',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        marginTop: 40,
        fontFamily: 'Outfit',
        fontStyle: 'italic',
        fontSize: 13
    }
});

export default RoomListStep;
