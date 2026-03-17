import React from 'react';
import { StyleSheet, View, Text, Platform, Linking } from 'react-native';
import PremiumBackground from './PremiumBackground';
import PremiumButton from './PremiumButton';
import { ShieldIcon } from './Icons';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';

const UpdateOverlay = ({ downloadUrl }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const handleUpdate = async () => {
        if (Platform.OS === 'web') {
            window.location.reload(true);
            return;
        }

        if (downloadUrl) {
            Linking.openURL(downloadUrl).catch(err =>
                console.error("Couldn't load page", err)
            );
        }
    };

    return (
        <View style={StyleSheet.absoluteFill}>
            <PremiumBackground showParticles={true}>
                <Animated.View
                    entering={FadeIn.duration(1000)}
                    style={styles.container}
                >
                    <Animated.View
                        entering={SlideInDown.delay(300).springify()}
                        style={[styles.card, { borderColor: theme.colors.accent }]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                            <ShieldIcon size={40} color={theme.colors.accent} />
                        </View>

                        <Text style={[styles.title, { color: theme.colors.accent }]}>
                            {t('update_required')}
                        </Text>

                        <Text style={styles.message}>
                            {t('update_available', { appName: 'Cards of Moral Decay' })}
                        </Text>

                        <PremiumButton
                            title={t(Platform.OS === 'web' ? 'refresh_now' : 'download_now')}
                            onPress={handleUpdate}
                            style={{ backgroundColor: theme.colors.accent, width: '100%', height: 60 }}
                            textStyle={{ color: '#000', fontFamily: 'CinzelBold', fontSize: 16 }}
                        />

                        {Platform.OS !== 'web' && (
                            <Text style={styles.hint}>
                                {t('update_hint')}
                            </Text>
                        )}
                    </Animated.View>
                </Animated.View>
            </PremiumBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#121214',
        borderRadius: 30,
        borderWidth: 2,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: 'CinzelBold',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 15,
    },
    message: {
        fontSize: 14,
        color: '#aaa',
        fontFamily: 'Outfit',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    hint: {
        marginTop: 20,
        fontSize: 12,
        color: '#666',
        fontFamily: 'Outfit',
        textAlign: 'center',
        fontStyle: 'italic',
    }
});

export default UpdateOverlay;

