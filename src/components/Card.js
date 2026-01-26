import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, LAYOUT } from '../styles/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const Card = ({ text, isBlack, onPress, selected, disabled, skin }) => {
    // Determine card style based on skin OR default
    const cardStyle = !isBlack && skin ? skin.styles : {
        bg: isBlack ? '#1a1a1a' : '#ffffff',
        text: isBlack ? '#fff' : '#1a1a1a',
        border: isBlack ? 'rgba(255, 211, 106, 0.2)' : 'rgba(0,0,0,0.1)',
        texture: null
    };
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled}
            style={[
                styles.card,
                {
                    backgroundColor: cardStyle.bg,
                    borderColor: selected ? COLORS.accent : cardStyle.border
                },
                selected && styles.selected,
                disabled && styles.disabled
            ]}
        >
            {/* Texture Overlay (Example Placeholder) */}
            {cardStyle.texture && (
                <View style={[StyleSheet.absoluteFill, { opacity: 0.05, overflow: 'hidden', borderRadius: 14 }]}>
                    {/* In a real app, map texture name to Image require() */}
                    <Image
                        source={{ uri: 'https://www.transparenttextures.com/patterns/ag-square.png' }} // Generic noise for now
                        style={{ width: '100%', height: '100%', resizeMode: 'repeat' }}
                    />
                </View>
            )}

            <Text style={[
                styles.text,
                { color: cardStyle.text }
            ]}>
                {text}
            </Text>

            <View style={styles.brandContainer}>
                <Text style={[styles.brand, { color: cardStyle.text, opacity: 0.6 }]}>
                    Moral Decay
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 14, // Slightly clearer radius
        padding: 16,
        margin: 6,
        justifyContent: 'space-between',

        // Premium Shadow / Elevation
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,

        borderWidth: 1, // Subtle border
        borderColor: 'rgba(255,255,255,0.1)',

    },
    blackCard: {
        backgroundColor: '#1a1a1a', // Darker elegant black
        borderColor: 'rgba(255, 211, 106, 0.2)', // Subtle gold hint
    },
    whiteCard: {
        backgroundColor: '#ffffff',
    },
    selected: {
        borderWidth: 3,
        borderColor: COLORS.accent,
        transform: [{ scale: 1.05 }],
        shadowColor: COLORS.accent,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 12,
    },
    disabled: {
        opacity: 0.8 // Less fade to keep readability
    },
    text: {
        fontFamily: 'Outfit', // Ensure using the custom font
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 26,
    },
    blackText: {
        color: '#fff',
    },
    whiteText: {
        color: '#1a1a1a',
    },
    brandContainer: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    brand: {
        fontSize: 9,
        fontFamily: 'Cinzel-Bold', // Premium font for brand
        opacity: 0.6,
        letterSpacing: 1
    },
    brandBlack: { color: '#fff' },
    brandWhite: { color: '#000' }
});

export default memo(Card);
