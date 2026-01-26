import React, { useState } from 'react';
import { StyleSheet, View, Text, Platform, Linking, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import PremiumBackground from './PremiumBackground';
import PremiumButton from './PremiumButton';
import { ShieldIcon } from './Icons';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const UpdateOverlay = ({ downloadUrl }) => {
    const { theme } = useTheme();
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleUpdate = async () => {
        if (Platform.OS === 'web') {
            window.location.reload(true);
            return;
        }

        if (!downloadUrl) {
            setError("Link di download non trovato.");
            return;
        }

        // On Android, we try the internal download + install
        if (Platform.OS === 'android') {
            try {
                setDownloading(true);
                setError(null);
                setProgress(0);

                // Check if URL looks like a direct APK link
                const isDirectApk = downloadUrl.toLowerCase().endsWith('.apk') || downloadUrl.includes('.apk?');
                if (!isDirectApk) {
                    console.warn("The download URL might not be a direct link to an APK file.");
                }

                const fileUri = FileSystem.cacheDirectory + 'CardsOfMoralDecay_Update.apk';

                // Ensure any old file is removed first
                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                if (fileInfo.exists) {
                    await FileSystem.deleteAsync(fileUri);
                }

                const downloadResumable = FileSystem.createDownloadResumable(
                    downloadUrl,
                    fileUri,
                    {},
                    (downloadProgress) => {
                        if (downloadProgress.totalBytesExpectedToWrite > 0) {
                            const prog = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                            setProgress(prog);
                        } else {
                            // If we don't know the total size (e.g. chunked transfer)
                            // We just show some movement
                            setProgress((prev) => (prev + 0.05) % 1);
                        }
                    }
                );

                const result = await downloadResumable.downloadAsync();

                if (!result || result.status !== 200) {
                    throw new Error(`Download fallito con stato: ${result?.status || 'unknown'}`);
                }

                const { uri } = result;

                // Get Content URI for Intent
                const contentUri = await FileSystem.getContentUriAsync(uri);

                // Trigger Installation
                // We try ACTION_VIEW which is more universal for APK installation
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/vnd.android.package-archive'
                });

                setDownloading(false);
            } catch (e) {
                console.error("Internal update failed", e);
                setDownloading(false);
                setError("Aggiornamento automatico fallito. Reindirizzamento al browser...");

                // Wait a bit so user can read the error
                setTimeout(() => {
                    Linking.openURL(downloadUrl);
                }, 2000);
            }
        } else {
            // iOS or others, just open URL
            Linking.openURL(downloadUrl);
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
                            {`\n`}è disponibile. Aggiorna l'app.
                        </Text>

                        {downloading ? (
                            <View style={styles.progressContainer}>
                                <Text style={styles.progressLabel}>Scaricamento in corso... {Math.round(progress * 100)}%</Text>
                                <View style={[styles.progressBarBase, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: theme.colors.accent }]} />
                                </View>
                                <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginTop: 10 }} />
                            </View>
                        ) : (
                            <>
                                <PremiumButton
                                    title={Platform.OS === 'web' ? "AGGIORNA ORA" : "INSTALLA"}
                                    onPress={handleUpdate}
                                    style={{ backgroundColor: theme.colors.accent, width: '100%', height: 60 }}
                                    textStyle={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 16 }}
                                />
                                {error && <Text style={{ color: '#ef4444', marginTop: 10, fontSize: 12, textAlign: 'center' }}>{error}</Text>}
                                {!downloadUrl?.toLowerCase().endsWith('.apk') && !downloadUrl?.includes('.apk?') && (
                                    <Text style={{ color: '#f59e0b', marginTop: 10, fontSize: 11, textAlign: 'center', fontStyle: 'italic' }}>
                                        Nota: Il link non sembra un file APK diretto. L'installazione automatica potrebbe non funzionare.
                                    </Text>
                                )}
                            </>
                        )}

                        {Platform.OS !== 'web' && !downloading && (
                            <Text style={styles.hint}>
                                L'aggiornamento verrà scaricato ed eseguito direttamente dall'app.
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
    progressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    progressLabel: {
        color: '#fff',
        fontFamily: 'Outfit-Bold',
        fontSize: 14,
        marginBottom: 10,
    },
    progressBarBase: {
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
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
