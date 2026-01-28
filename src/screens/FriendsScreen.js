import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, BackHandler, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import PremiumIconButton from '../components/PremiumIconButton';
import PremiumBackground from '../components/PremiumBackground'; // [NEW] Wrapper
import { TrashIcon, LinkIcon, CheckIcon, CrossIcon } from '../components/Icons';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import ToastNotification from '../components/ToastNotification';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const FriendsScreen = () => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const {
        user: authUser,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend
    } = useAuth();

    const [friendInput, setFriendInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [friendToDelete, setFriendToDelete] = useState(null);
    const [showExitModal, setShowExitModal] = useState(false);

    const friends = authUser?.friends || {};
    const friendRequests = authUser?.friendRequests || {};
    const myUsername = authUser?.username;

    const handleSend = async () => {
        if (!friendInput.trim()) return;
        setLoading(true);
        try {
            await sendFriendRequest(friendInput);
            setFriendInput('');
            setToast({ visible: true, message: t('toast_req_sent'), type: 'success' });
        } catch (e) {
            setToast({ visible: true, message: e.message || "Errore", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const copyMyId = async () => {
        await Clipboard.setStringAsync(myUsername);
        setToast({ visible: true, message: t('toast_id_copied'), type: 'success' });
    };

    const friendList = Object.keys(friends || {});
    const requestList = Object.keys(friendRequests || {});

    // Android Back Handler
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'web') return;

            const backAction = () => {
                setShowExitModal(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }, [])
    );

    return (
        <View style={{ flex: 1 }}>
            <PremiumBackground>
                {/* Main Content Container with conditional opacity */}
                <View style={{ flex: 1, opacity: friendToDelete ? 0.1 : 1 }} pointerEvents={friendToDelete ? 'none' : 'auto'}>
                    {/* Header Title */}
                    <Text style={{ color: '#d4af37', fontFamily: 'Cinzel-Bold', fontSize: 24, marginTop: 50, marginBottom: 20, textAlign: 'center' }}>
                        {t('friends_title')}
                    </Text>

                    <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
                        {/* My ID Section */}
                        <View style={styles.idContainer}>
                            <Text style={[styles.label, { color: '#888' }]}>{t('your_id')}</Text>
                            <TouchableOpacity onPress={copyMyId} style={styles.idBox}>
                                <Text style={[styles.myId, { color: theme.colors.accent }]}>{myUsername}</Text>
                                <LinkIcon size={16} color={theme.colors.accent} />
                            </TouchableOpacity>
                        </View>

                        {/* Add Friend Request Section */}
                        <View style={styles.addSection}>
                            <PremiumInput
                                value={friendInput}
                                onChangeText={setFriendInput}
                                label={t('friend_id_label')}
                                style={{ flex: 1, marginBottom: 0 }}
                                containerStyle={{ marginBottom: 0 }}
                            />
                            <PremiumButton
                                title={t('send_btn')}
                                onPress={handleSend}
                                disabled={loading || !friendInput.trim()}
                                style={{ width: 80, marginLeft: 10, height: 50, backgroundColor: theme.colors.accent, marginVertical: 0, marginTop: 10 }}
                                textStyle={{ color: '#000', fontSize: 12, fontFamily: 'Cinzel-Bold' }}
                            />
                        </View>

                        <ScrollView style={styles.list} contentContainerStyle={{ gap: 15, paddingBottom: 80 + insets.bottom }} showsVerticalScrollIndicator={false}>

                            {/* INCOMING REQUESTS */}
                            {requestList.length > 0 && (
                                <View>
                                    <Text style={[styles.sectionHeader, { color: theme.colors.accent }]}>
                                        {t('incoming_requests')} ({requestList.length})
                                    </Text>
                                    <View style={{ gap: 10 }}>
                                        {requestList.map(reqName => (
                                            <View key={reqName} style={[styles.friendRow, { borderColor: theme.colors.accent }]}>
                                                <Text style={[styles.friendName, { color: '#fff' }]}>{reqName}</Text>
                                                <View style={{ flexDirection: 'row', gap: 5 }}>
                                                    <PremiumIconButton
                                                        icon={<CheckIcon size={16} color="#4ade80" />}
                                                        onPress={() => acceptFriendRequest(reqName)}
                                                        size={32}
                                                        style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', borderRadius: 32 }}
                                                    />
                                                    <PremiumIconButton
                                                        icon={<CrossIcon size={16} color="#ef4444" />}
                                                        onPress={() => rejectFriendRequest(reqName)}
                                                        size={32}
                                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 32 }}
                                                    />
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={{ height: 1, backgroundColor: '#333', marginVertical: 15 }} />
                                </View>
                            )}

                            {/* FRIENDS LIST */}
                            <View>
                                <Text style={[styles.sectionHeader, { color: '#666' }]}>
                                    {t('your_friends')} ({friendList.length})
                                </Text>

                                {friendList.length === 0 ? (
                                    <Text style={styles.emptyText}>{t('no_friends_msg')}</Text>
                                ) : (
                                    <View style={{ gap: 10 }}>
                                        {friendList.map(friendName => (
                                            <View key={friendName} style={styles.friendRow}>
                                                <Text style={styles.friendName}>{friendName}</Text>
                                                <PremiumIconButton
                                                    icon={<TrashIcon size={18} color="#ef4444" />}
                                                    onPress={() => setFriendToDelete(friendName)}
                                                    size={36}
                                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 32 }}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* DELETE CONFIRMATION OVERLAY (Absolute - covers the whole PremiumBackground area) */}
                {friendToDelete && (
                    <View style={StyleSheet.absoluteFill}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                            <Animated.View
                                style={styles.confirmBox}
                                entering={ZoomIn.duration(300)}
                                exiting={ZoomOut.duration(200)}
                            >
                                <Text style={styles.confirmTitle}>{t('confirm_delete_title')}</Text>
                                <Text style={styles.confirmText}>{t('confirm_delete_msg')}</Text>
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' }}>
                                    <PremiumButton
                                        title={t('cancel_btn')}
                                        variant="ghost"
                                        onPress={() => setFriendToDelete(null)}
                                        style={{ flex: 1, height: 45 }}
                                    />
                                    <PremiumButton
                                        title={t('farewell_btn')}
                                        variant="danger"
                                        onPress={() => {
                                            removeFriend(friendToDelete);
                                            setFriendToDelete(null);
                                        }}
                                        style={{ flex: 1, height: 45 }}
                                    />
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                )}

                <ConfirmationModal
                    visible={showExitModal}
                    onClose={() => setShowExitModal(false)}
                    title={t('exit_app_title')}
                    message={t('exit_app_msg')}
                    confirmText={t('exit_btn_small')}
                    onConfirm={() => BackHandler.exitApp()}
                />

                <ToastNotification
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast(prev => ({ ...prev, visible: false }))}
                    duration={2000}
                    style={{ bottom: 100 }} // Higher to not overlap navigation
                />
            </PremiumBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20
    },
    label: {
        fontFamily: 'Outfit',
        fontSize: 14,
    },
    idBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    myId: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 16,
    },
    addSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        zIndex: 10
    },
    sectionHeader: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 14,
        marginBottom: 10,
        letterSpacing: 1
    },
    list: {
        flex: 1,
    },
    emptyText: {
        color: '#555',
        fontFamily: 'Outfit',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a80',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    friendName: {
        color: '#ddd',
        fontFamily: 'Outfit',
        fontSize: 16
    },
    confirmBox: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
        width: '90%',
        alignItems: 'center'
    },
    confirmTitle: {
        color: '#ef4444',
        fontFamily: 'Cinzel-Bold',
        fontSize: 18,
        marginBottom: 10
    },
    confirmText: {
        color: '#fff',
        fontFamily: 'Outfit',
        textAlign: 'center',
        fontSize: 16
    }
});

export default FriendsScreen;
