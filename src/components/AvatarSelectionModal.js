import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import PremiumModal from './PremiumModal';
import LocalAvatar from './LocalAvatar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { DiceIcon, SkipIcon } from './Icons';
import { MYSTERY_AVATAR } from '../utils/constants';

const AvatarSelectionModal = ({ visible, onClose, onSelect, currentAvatar, avatars }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [displayAvatars, setDisplayAvatars] = React.useState([]);

    const scrambleAvatars = () => {
        // [FIX] Keep current avatar fixed at the start
        const isMysteryCurrent = currentAvatar === MYSTERY_AVATAR;

        // Filter pool: exclude Mystery and current (if real)
        const pool = avatars.filter(a => a !== MYSTERY_AVATAR && a !== currentAvatar);

        // Fisher-Yates shuffle
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Determine how many randoms we need
        // Total 12 items. 
        // If current is Mystery: [Mystery, ...11 randoms]
        // If current is Real: [Current, Mystery, ...10 randoms]
        const count = isMysteryCurrent ? 11 : 10;
        const selected = shuffled.slice(0, count);

        if (isMysteryCurrent) {
            setDisplayAvatars([MYSTERY_AVATAR, ...selected]);
        } else {
            setDisplayAvatars([currentAvatar, MYSTERY_AVATAR, ...selected]);
        }
    };

    React.useEffect(() => {
        if (visible) {
            scrambleAvatars();
        }
    }, [visible]);

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title={t('avatar_selection_title')}
        >
            <View style={{ height: 330, paddingHorizontal: 10 }}>
                {/* Refresh Button Header */}
                <View style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity
                        onPress={scrambleAvatars}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 }}
                    >
                        <SkipIcon size={20} color={theme.colors.accent} />
                        <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 14 }}>{t('refresh_avatars_btn')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.grid}>
                    {displayAvatars.map((seed, index) => {
                        const isSelected = currentAvatar === seed;
                        const isMystery = seed === MYSTERY_AVATAR;

                        return (
                            <Animated.View
                                key={seed}
                                entering={ZoomIn.delay(index * 60).duration(300)}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect(seed);
                                        // onClose(); // [FIX] Don't close on select
                                    }}
                                    style={[
                                        styles.avatarItem,
                                        isSelected && { borderColor: theme.colors.accent, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.1)' }
                                    ]}
                                >
                                    {isMystery ? (
                                        <DiceIcon size={40} color={isSelected ? theme.colors.accent : '#888'} />
                                    ) : (
                                        <LocalAvatar seed={seed} size={50} />
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </ScrollView>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        paddingBottom: 30,
        paddingTop: 10
    },
    avatarItem: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden' // [FIX] Ensure avatars are clipped to circle
    }
});

export default AvatarSelectionModal;
