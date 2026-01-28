import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PremiumBackground from '../components/PremiumBackground';
import { useTheme } from '../context/ThemeContext';

const BankScreen = () => {
    const { theme } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: '#18181b' }}>
            <PremiumBackground>
                <View style={styles.container}>
                    <Text style={[styles.title, { color: theme.colors.accent }]}>BANCA</Text>
                    <Text style={styles.subtitle}>Acquista Dirty Cash e supporta lo sviluppo.</Text>
                    <View style={styles.placeholder}>
                        <Text style={{ color: '#666', fontFamily: 'Outfit' }}>Coming Soon...</Text>
                    </View>
                </View>
            </PremiumBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Cinzel-Bold',
        marginBottom: 10,
    },
    subtitle: {
        color: '#aaa',
        fontFamily: 'Outfit',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5,
    }
});

export default BankScreen;
