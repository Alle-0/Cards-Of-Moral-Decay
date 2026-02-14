import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import PremiumInput from '../PremiumInput';
import PremiumButton from '../PremiumButton';
import LocalAvatar from '../LocalAvatar';
import { EditIcon, DiceIcon } from '../Icons';
import { useLanguage } from '../../context/LanguageContext';

const IdentityStep = ({
    theme,
    name,
    onNameChange,
    avatar,
    onEditAvatar,
    onNext,
}) => {
    // Props are now fully controlled by LobbyScreen
    const { t } = useLanguage();

    const handleNext = () => {
        onNext();
    };

    return (
        <Animated.View
            entering={SlideInLeft.springify().damping(35).stiffness(150)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.stepContainer}
        >
            {/* Title Section */}
            <View style={{ width: '100%', marginBottom: 30, marginTop: 10 }}>
                <Text style={styles.sectionTitle}>{t('who_are_you')}</Text>
                <Text style={[styles.subTitle, { color: '#888', fontFamily: 'Outfit' }]}>
                    {t('choose_identity_sub')}
                </Text>
            </View>

            {/* Input Row with Avatar Bubble */}
            <View style={styles.inputRow}>
                {/* Avatar Bubble */}
                <TouchableOpacity
                    onPress={onEditAvatar}
                    style={styles.avatarBubble}
                >
                    {avatar === '###RANDOM###' ? (
                        <DiceIcon size={30} color={theme.colors.accent} />
                    ) : (
                        <LocalAvatar seed={avatar} size={45} />
                    )}
                    <View style={styles.editBadge}>
                        <Text style={{ fontSize: 10 }}>✎</Text>
                    </View>
                </TouchableOpacity>

                {/* Name Input */}
                <View style={{ flex: 1 }}>
                    <PremiumInput
                        label={t('nickname_label')}
                        value={name}
                        onChangeText={onNameChange}
                        placeholder={t('nickname_placeholder')}
                        style={{ marginBottom: 0 }}
                        labelBackgroundColor="#0d0d0d"
                        containerStyle={{ marginBottom: 0 }}
                    />
                </View>
            </View>

            <PremiumButton
                title={t('next_btn')}
                onPress={handleNext}
                enableSound={false}
                disabled={!name || !name.trim()}
                style={{
                    marginTop: 40,
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.accent,
                    width: '100%'
                }}
                textStyle={{
                    color: '#000',
                    fontFamily: 'Cinzel-Bold',
                    fontSize: 20
                }}
            />

        </Animated.View>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'Cinzel-Bold',
        marginBottom: 5,
        textAlign: 'left',
        color: '#FFFFFF'
    },
    subTitle: {
        fontSize: 16,
        marginVertical: 5,
        textAlign: 'left'
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        width: '100%',
        marginBottom: 20
    },
    avatarBubble: {
        width: 60,
        height: 60,
        borderRadius: 30,
        // borderWidth: 2, // REMOVED
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
        top: 2 // visual alignment with input
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000'
    }
});

export default IdentityStep;
