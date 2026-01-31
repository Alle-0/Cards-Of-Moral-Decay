import React from 'react';
import { StyleSheet, View, Text, Platform, Linking } from 'react-native';
import PremiumBackground from './PremiumBackground';
import PremiumButton from './PremiumButton';
import { ShieldIcon } from './Icons';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const UpdateOverlay = ({ downloadUrl }) => {
    const { theme } = useTheme();

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
                            AGGIORNAMENTO NECESSARIO
                        </Text>

                        <Text style={styles.message}>
                            Una nuova versione di {`\n`}
                            <Text style={{ fontFamily: 'Cinzel-Bold', color: '#fff' }}>Cards of Moral Decay</Text>
                            {`\n`}è disponibile.
                        </Text>

                        <PremiumButton
                            title="SCARICA ORA"
                            onPress={handleUpdate}
                            style={{ backgroundColor: theme.colors.accent, width: '100%', height: 60 }}
                            textStyle={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 16 }}
                        />

                        {Platform.OS !== 'web' && (
                            <Text style={styles.hint}>
                                Sarai reindirizzato al browser per scaricare l'aggiornamento.
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
        fontFamily: 'Cinzel-Bold',
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
