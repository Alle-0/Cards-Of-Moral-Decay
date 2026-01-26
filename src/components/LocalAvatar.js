import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';

/**
 * LocalAvatar
 * Generates an SVG avatar locally using DiceBear Adventurer style.
 * No network request required.
 * 
 * @param {string} seed - The seed string for generation (e.g., username)
 * @param {number} size - Size of the avatar (width/height)
 * @param {object} style - Container style
 */
const LocalAvatar = ({ seed, size = 128, style }) => {

    const avatarSvg = useMemo(() => {
        return createAvatar(adventurer, {
            seed: seed || 'dummy',
            size: 128,
            // [FIX] Removed background generation to prevent theme clashing.
            // Result will be transparent, utilizing the parent container's background.
            radius: 0,
        }).toString();
    }, [seed]);

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <SvgXml xml={avatarSvg} width="100%" height="100%" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        // Note: Border radius should usually be handled by the parent container 
        // if a circle is desired, but we can default to none here.
    }
});

export default LocalAvatar;
