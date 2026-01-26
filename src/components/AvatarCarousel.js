import React, { useState, useEffect, memo, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Text, Platform } from 'react-native';
// import { SvgUri } from 'react-native-svg'; // [REMOVED]
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import HapticsService from '../services/HapticsService';
import PremiumPressable from './PremiumPressable';
import LocalAvatar from './LocalAvatar'; // [NEW]

import { useWebDragScroll } from '../hooks/useWebDragScroll';
import { MYSTERY_AVATAR } from '../utils/data';
import { Image } from 'react-native';
import { DiceIcon } from './Icons';

const AvatarCarousel = memo(forwardRef(({ seeds, onSelectAvatar, selectedAvatar }, ref) => {
    const { theme } = useTheme();
    const { scrollRef, panHandlers } = useWebDragScroll(true);

    // Merge refs: the one from parent and our local hook ref
    useImperativeHandle(ref, () => scrollRef.current);

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                {...panHandlers}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {seeds.map((seed, index) => (
                    <AvatarItem
                        key={seed}
                        seed={seed}
                        // [FIX] Compare seeds directly, handling legacy URL case if needed, but prefer strict seed match
                        isSelected={selectedAvatar === seed}
                        onSelect={onSelectAvatar}
                        index={index}
                    />
                ))}
            </ScrollView>
        </View>
    );
}));



const AvatarItem = memo(({ seed, isSelected, onSelect, index }) => {
    const { theme } = useTheme();

    const animatedStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(isSelected ? theme.colors.accent : 'rgba(255,255,255,0.1)', { duration: 250 }),
            borderWidth: isSelected ? 3 : 1,
            backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isSelected ? 0.8 : 0,
            shadowRadius: 10,
            elevation: isSelected ? 10 : 0,
        };
    });

    const isMystery = seed === MYSTERY_AVATAR;

    return (
        <Animated.View entering={ZoomIn.delay(index * 50).duration(300)}>
            <PremiumPressable
                onPress={() => {
                    HapticsService.trigger('selection');
                    onSelect(seed);
                }}
                scaleDown={0.9}
                style={[styles.avatarContainer, animatedStyle]}
                contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
            >
                {isMystery ? (
                    <DiceIcon size={48} color={theme.colors.accent} />
                ) : (
                    <LocalAvatar
                        seed={seed}
                        size={58}
                    />
                )}
            </PremiumPressable>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginVertical: 5,
        height: 110,
        ...Platform.select({
            web: {
                width: '100%',
                maxWidth: '100%',
            }
        })
    },
    scrollContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 15,
        paddingVertical: 10,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AvatarCarousel;
