import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import PremiumPressable from './PremiumPressable';

const PremiumIconButton = ({
    icon,
    onPress,
    style,
    badge,
    badgeStyle,
    hitSlop = 20,
    size = 44,
    disabled = false,
    enableSound = false,
}) => {
    // Unfreeze styles once for Reanimated stability & Performance
    const mutableOuter = useMemo(() => ({ ...styles.outerContainer }), []);
    const mutableContainer = useMemo(() => ({ ...styles.container }), []);

    // Helper to render icon content safely
    const renderIcon = () => {
        if (typeof icon === 'string' || typeof icon === 'number') {
            return <Text style={[styles.iconText, { fontSize: size * 0.55 }]}>{icon}</Text>;
        }
        // Defensive check: if icon is explicitly null/undefined/boolean, don't render it as a bare node
        if (!icon || typeof icon === 'boolean') return null;

        return icon;
    };

    return (
        <Animated.View style={[mutableOuter, { width: size, height: size }, style]}>
            <PremiumPressable
                onPress={onPress}
                hitSlop={hitSlop}
                disabled={disabled}
                enableSound={enableSound}
                scaleDown={0.9}
                style={[
                    mutableContainer,
                    { width: size, height: size, borderRadius: size / 2 },
                ]}
                contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                pressableStyle={{ flex: 1 }}
            >
                {renderIcon()}
            </PremiumPressable>

            {badge !== undefined && badge !== null && (
                <View style={[styles.badge, badgeStyle]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        zIndex: 1,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ffd700',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 10,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    badgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

export default PremiumIconButton;
