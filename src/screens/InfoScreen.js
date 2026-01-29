import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, LayoutAnimation, Platform, UIManager, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeftIcon,
    DirtyCashIcon,
    CrownIcon,
    PeopleIcon,
    EyeIcon,
    RulesIcon,
    LinkIcon,
    SettingsIcon,
    LockIcon,
    GithubIcon // [NEW]
} from '../components/Icons';
import PremiumBackground from '../components/PremiumBackground';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AnalyticsService from '../services/AnalyticsService';
import { APP_VERSION } from '../constants/Config';

const InfoScreen = ({ onClose }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [expandedId, setExpandedId] = useState(null);

    // [FIX] Handle Android Hardware Back Button
    useEffect(() => {
        const backAction = () => {
            onClose();
            return true; // Stop event bubbling/exit
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [onClose]);

    const SECTIONS = [
        {
            id: 'donate',
            title: t('section_donate'),
            icon: <CrownIcon size={20} color="#000" />,
            content: t('donate_content'),
            action: t('donate_action'),
            url: 'https://paypal.me/AlessandroBasile0/3eur', // <--- INSERISCI IL TUO USERNAME PAYPAL
            special: true // Stile Dorato
        },
        {
            id: 'credits',
            title: t('section_credits'),
            icon: <PeopleIcon size={20} color={theme.colors.accent} />,
            content: t('credits_content')
        },
        {
            id: 'contacts',
            title: t('section_contacts'),
            icon: <GithubIcon size={20} color={theme.colors.accent} />,
            content: t('contacts_content'),
            action: 'GITHUB',
            url: 'https://github.com/Alle-0/Cards-Of-Moral-Decay'
        },
        {
            id: 'privacy',
            title: t('section_privacy'),
            icon: <EyeIcon size={20} color={theme.colors.accent} />,
            content: t('privacy_content'),
        },
        {
            id: 'terms',
            title: t('section_terms'),
            icon: <RulesIcon size={20} color={theme.colors.accent} />,
            content: t('terms_content')
        },
        {
            id: 'copyright',
            title: t('section_copyright'),
            icon: <LockIcon size={20} color={theme.colors.accent} />,
            content: t('copyright_content'),
            readOnly: true
        },
        {
            id: 'version',
            title: t('section_info'),
            icon: <SettingsIcon size={20} color={theme.colors.accent} />,
            content: t('info_content_template', { version: APP_VERSION }),
            readOnly: true
        }
    ];

    const toggleSection = (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const handleLink = (url) => {
        if (url) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // [NEW] Track donation intent
            if (url.includes('paypal.me')) {
                AnalyticsService.logDonationIntent(user?.name || 'Anonymous');
            }

            Linking.openURL(url);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <PremiumBackground immediate={true}>
                <SafeAreaView style={styles.container}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <ArrowLeftIcon size={28} color={theme.colors.accent} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.colors.accent }]}>{t('archive_title')}</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.introText}>
                            {t('archive_intro')}
                        </Text>

                        {SECTIONS.map((section, index) => {
                            const isExpanded = expandedId === section.id;
                            const isSpecial = section.special;

                            return (
                                <Animated.View
                                    key={section.id}
                                    entering={FadeIn.delay(index * 60).duration(400)}
                                    style={[
                                        styles.card,
                                        isSpecial && { backgroundColor: theme.colors.accent, borderColor: '#fff' },
                                        isExpanded && !isSpecial && styles.cardExpanded
                                    ]}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => toggleSection(section.id)}
                                        style={styles.cardHeader}
                                    >
                                        <View style={styles.titleRow}>
                                            {section.icon}
                                            <Text style={[
                                                styles.cardTitle,
                                                isSpecial && { color: '#000' }
                                            ]}>
                                                {section.title}
                                            </Text>
                                        </View>
                                        <Text style={{ color: isSpecial ? '#000' : '#666', fontSize: 18 }}>
                                            {isExpanded ? "▲" : "▼"}
                                        </Text>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.cardContent}>
                                            <Text style={[
                                                styles.contentText,
                                                isSpecial && { color: '#1a1a1a' }
                                            ]}>
                                                {section.content}
                                            </Text>

                                            {section.action && (
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { borderColor: isSpecial ? '#000' : theme.colors.accent }]}
                                                    onPress={() => handleLink(section.url)}
                                                >
                                                    <Text style={[styles.actionButtonText, { color: isSpecial ? '#000' : theme.colors.accent }]}>
                                                        {section.action}
                                                    </Text>
                                                    <LinkIcon size={16} color={isSpecial ? '#000' : theme.colors.accent} />
                                                </TouchableOpacity>
                                            )}

                                            {section.link && (
                                                <TouchableOpacity onPress={() => handleLink(section.url)}>
                                                    <Text style={[styles.linkText, { color: theme.colors.accent }]}>{section.link}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </Animated.View>
                            );
                        })}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{t('made_in_italy')}</Text>
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </PremiumBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 22,
        letterSpacing: 2,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    introText: {
        fontFamily: 'Outfit',
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardExpanded: {
        borderColor: 'rgba(255, 206, 106, 0.2)',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardTitle: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 14,
        color: '#eee',
        letterSpacing: 1,
    },
    cardContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 0,
    },
    contentText: {
        fontFamily: 'Outfit',
        color: '#ccc',
        fontSize: 14,
        lineHeight: 22,
    },
    actionButton: {
        marginTop: 15,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
    },
    actionButtonText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 13,
        letterSpacing: 1,
    },
    linkText: {
        marginTop: 15,
        fontFamily: 'Outfit',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: 'Outfit',
        color: '#333',
        fontSize: 10,
        letterSpacing: 1,
    }
});

export default InfoScreen;
