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
            borderWidth: 1.5,
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
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(127, 29, 29, 0.8)', // Deep Dark Red
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

        // Default Primary (Gold/Accent)
        return {
            ...base,
            backgroundColor: theme.colors.accent,
            borderColor: theme.colors.accent,
        };
    };

    const getTextStyle = () => {
        if (variant === 'outline') return { color: theme.colors.accent };
        if (variant === 'danger') return { color: '#fca5a5' };
        if (variant === 'ghost') return { color: theme.colors.textPrimary, opacity: 0.8 };
        return { color: '#000' }; // Black on Gold (Primary)
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
                paddingVertical: 10,
                paddingHorizontal: 12,
            }, contentContainerStyle]} // Merge prop
        >
            <Text
                style={[styles.text, { fontFamily: 'Cinzel-Bold' }, getTextStyle(), textStyle]}
                numberOfLines={1}
                adjustsFontSizeToFit={false}
            >
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
        marginVertical: 8,
        width: '100%',
        maxWidth: 320,
        alignSelf: 'center',
        minHeight: 48, // Ensure touch target
    },
    text: {
        fontSize: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
});

export default PremiumButton;
