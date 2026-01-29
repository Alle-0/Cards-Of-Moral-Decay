import React from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import EfficientBlurView from './EfficientBlurView';

const CensoredText = ({ text, censoredWords = [], style, textStyle }) => {
    // Escape regex characters
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex from censored words
    const regex = new RegExp(`(${censoredWords.map(escapeRegExp).join('|')})`, 'gi');

    const parts = text.split(regex);

    return (
        <Text style={[styles.container, style]}>
            {parts.map((part, index) => {
                const isCensored = censoredWords.some(word =>
                    part.toLowerCase() === word.toLowerCase()
                );

                if (isCensored) {
                    return (
                        <View key={index} style={styles.censoredWrapper}>
                            <Text style={[textStyle, styles.hiddenText]}>{part}</Text>
                            <View style={StyleSheet.absoluteFill}>
                                <EfficientBlurView
                                    intensity={Platform.OS === 'android' ? 20 : 15}
                                    tint="dark"
                                    style={StyleSheet.absoluteFill}
                                />
                                {/* Optional: Add a subtle strike-through line effect under the blur if needed */}
                                <View style={styles.strikeLine} />
                            </View>
                        </View>
                    );
                }
                return <Text key={index} style={textStyle}>{part}</Text>;
            })}
        </Text>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    censoredWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenText: {
        opacity: 0.1, // Visible enough to give width/height but mostly hidden
    },
    strikeLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ translateY: -1 }]
    }
});

export default CensoredText;
