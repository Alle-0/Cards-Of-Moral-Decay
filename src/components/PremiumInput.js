import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, View, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const PremiumInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    style,
    labelBackgroundColor = '#141210',
    ...props
}) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useSharedValue(0);
    const inputRef = useRef(null);

    const handleFocus = () => {
        setIsFocused(true);
        focusAnim.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (!value) {
            focusAnim.value = withTiming(0, { duration: 200 });
        }
    };

    // Sync focusAnim with value prop safely
    React.useEffect(() => {
        if (value && focusAnim.value === 0) {
            focusAnim.value = 1;
        }
    }, [value]);

    const labelStyle = useAnimatedStyle(() => {
        return {
            top: 0,
            transform: [
                { translateY: withTiming(focusAnim.value === 1 || value ? -6 : 18, { duration: 200 }) }, // [FIX] Lower position (-10 -> -4)
            ],
            fontSize: withTiming(focusAnim.value === 1 || value ? 12 : 16),
            color: withTiming(focusAnim.value === 1 ? theme.colors.accent : 'rgba(243, 243, 243, 0.5)'),
            backgroundColor: withTiming(focusAnim.value === 1 || value ? labelBackgroundColor : 'rgba(13, 13, 13, 0)'),
            paddingHorizontal: withTiming(focusAnim.value === 1 || value ? 8 : 0),
            borderRadius: 4,
            zIndex: 10,
        };
    }, [value, theme.colors.accent, labelBackgroundColor]);

    const borderStyle = useAnimatedStyle(() => {
        return {
            borderColor: withTiming(isFocused ? theme.colors.accent : 'rgba(255, 255, 255, 0.2)', { duration: 200 }),
            borderWidth: 1.5,
        };
    });


    return (
        <View style={[styles.wrapper, style]}>
            <Pressable
                onPress={() => inputRef.current?.focus()}
                android_disableSound={true}
                android_ripple={null}
                style={{ width: '100%' }}
            >
                <Animated.View style={[styles.inputContainer, borderStyle]}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { color: theme.colors.textPrimary, fontFamily: 'Cinzel-Bold', backgroundColor: 'transparent' }]}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        secureTextEntry={secureTextEntry}
                        placeholder=""
                        adjustsFontSizeToFit
                        pointerEvents={isFocused ? 'auto' : 'none'}
                        {...props}
                    />
                </Animated.View>
            </Pressable>

            {/* [FIX] Wrapper verifies perfect centering of the chip */}
            <View style={styles.labelContainer} pointerEvents="none">
                <Animated.Text style={[styles.label, labelStyle]}>
                    {label}
                </Animated.Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginVertical: 12,
        width: '100%',
        maxWidth: 320,
        alignSelf: 'center',
        position: 'relative',
        height: 60,
        justifyContent: 'center',
    },
    inputContainer: {
        borderRadius: 20,
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        height: 60,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    input: {
        fontSize: 16,
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 0, // Pushes text down
        height: '100%',
        textAlign: 'left', // [FIX] Align text to left
        textAlignVertical: 'center', // Ensures consistencys
        outlineStyle: 'none', // [FIX] Remove web border
        // textTransform: 'uppercase', // REMOVED to allow lowercase
    },
    labelContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'flex-start', // [FIX] Align label to left
        justifyContent: 'flex-start', // Let translateY handle vertical pos
        paddingLeft: 16, // [FIX] Align with input padding
        zIndex: 10,
    },
    label: {
        fontFamily: 'Cinzel',
        textTransform: 'uppercase',
    },
});

export default PremiumInput;
