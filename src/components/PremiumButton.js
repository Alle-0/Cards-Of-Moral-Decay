import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import PremiumPressable from './PremiumPressable';

const PremiumButton = ({
    title,
    onPress,
    variant = 'primary', // primary, outline, danger, ghost
    disabled = false,
    style,
    textStyle,
    contentContainerStyle, // New prop
    enableRipple = true, // New prop
    enableSound = true, // [NEW] Prop to control sound
}) => {
    const { theme } = useTheme();

    // Dynamic Styles based on Theme and Variant
    const getContainerStyle = () => {
        const base = {
            backgroundColor: 'rgba(30, 27, 26, 0.95)',
            borderColor: theme.colors.cardBorder,
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
        };

        if (variant === 'outline') {
            return {
                ...base,
                backgroundColor: 'transparent',
                borderColor: theme.colors.accent,
            };
        }

        if (variant === 'danger') {
            return {
                ...base,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(50, 20, 20, 0.8)',
            };
        }

        if (variant === 'ghost') {
            return {
                ...base,
                backgroundColor: 'transparent',
                borderWidth: 0,
                shadowOpacity: 0,
                elevation: 0,
            };
        }

        // Default Primary
        return base;
    };

    const getTextStyle = () => {
        if (variant === 'outline') return { color: theme.colors.accent };
        if (variant === 'danger') return { color: '#ff6b6b' };
        if (variant === 'ghost') return { color: theme.colors.textPrimary, opacity: 0.8 };
        return { color: theme.colors.accent };
    };

    return (
        <PremiumPressable
            onPress={onPress}
            disabled={disabled}
            enableRipple={enableRipple}
            enableSound={enableSound}
            rippleColor={variant === 'danger' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 255, 255, 0.15)'}
            style={[
                styles.container,
                getContainerStyle(),
                style,
            ]}
            contentContainerStyle={[{
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 24,
            }, contentContainerStyle]} // Merge prop
        >
            <Text style={[styles.text, { fontFamily: 'Cinzel Decorative-Bold' }, getTextStyle(), textStyle]}>
                {title}
            </Text>
        </PremiumPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        width: '100%',
        maxWidth: 320,
        alignSelf: 'center',
    },
    text: {
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center',
    },
});

export default PremiumButton;
