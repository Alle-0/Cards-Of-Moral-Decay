import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PremiumPressable from '../PremiumPressable';
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
    onNext
}) => {
    // Props are now fully controlled by LobbyScreen
    const { t } = useLanguage();

    const handleNext = () => {
        onNext();
    };

    return (
        <ScrollView
            style={{ width: '100%', maxHeight: '100%' }}
            contentContainerStyle={styles.stepContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Title Section */}
            <View style={{ width: '100%', marginBottom: 20, marginTop: 10, paddingHorizontal: 20 }}>
                <Text style={styles.sectionTitle}>{t('who_are_you')}</Text>
                <Text style={[styles.subTitle, { color: '#888', fontFamily: 'Outfit' }]}>
                    {t('choose_identity_sub')}
                </Text>
            </View>

            {/* Input Row with Avatar Bubble */}
            <View style={styles.inputRow}>
                {/* Avatar Bubble */}
                <PremiumPressable
                    onPress={onEditAvatar}
                    style={styles.avatarBubble}
                    overflow="visible"
                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}
                >
                    {avatar === '###RANDOM###' ? (
                        <DiceIcon size={30} color={theme.colors.accent} />
                    ) : (
                        <LocalAvatar seed={avatar} size={45} />
                    )}
                    <View style={styles.editBadge}>
                        <EditIcon size={14} color="#000" />
                    </View>
                </PremiumPressable>

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

            <View style={{ width: '100%', paddingHorizontal: 20 }}>
                <PremiumButton
                    title={t('next_btn')}
                    onPress={handleNext}
                    enableSound={false}
                    disabled={!name || !name.trim()}
                    style={{
                        marginTop: 20, // [FIX] Compact spacing
                        backgroundColor: theme.colors.accent,
                        borderColor: theme.colors.accent,
                        width: '100%'
                    }}
                    textStyle={{
                        color: '#000',
                        fontFamily: 'CinzelBold',
                        fontSize: 20
                    }}
                />
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20, // [FIX] Balanced spacing
        alignSelf: 'flex-start', // [FIX] Prevent vertical stretching
    },
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'CinzelBold',
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
        marginBottom: 15, // [FIX] More balanced spacing
        paddingHorizontal: 20, // [FIX] Restore padding removed from parent
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
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    }
});

export default IdentityStep;

