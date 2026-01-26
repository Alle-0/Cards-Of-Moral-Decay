// Verified
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableWithoutFeedback, Keyboard, Dimensions, useWindowDimensions, StatusBar, Platform, Pressable, Image, BackHandler } from 'react-native';
import { SvgUri, Svg, Path, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    SlideInRight,
    SlideOutLeft,
    SlideInLeft,
    SlideOutRight,
    FadeIn,
    FadeOut,
    measure,
    Easing,
    withSequence,
    LinearTransition,
    withRepeat,
    interpolate
} from 'react-native-reanimated'; // Updated imports
import { useGame } from '../context/GameContext';
import { useAuth, RANK_COLORS } from '../context/AuthContext'; // [NEW]
import { useTheme } from '../context/ThemeContext';
import SoundService from '../services/SoundService';
import PremiumInput from '../components/PremiumInput';
import PremiumButton from '../components/PremiumButton';
import AvatarCarousel from '../components/AvatarCarousel';
import GradientText from '../components/GradientText';
import RoomItem from '../components/RoomItem';
import PremiumModal from '../components/PremiumModal';
import SettingsModal from '../components/SettingsModal';
import PremiumBackground from '../components/PremiumBackground';
import PremiumIconButton from '../components/PremiumIconButton';
import ToastNotification from '../components/ToastNotification';
import { SettingsIcon, InfoIcon, ScaleIcon, LockIcon, ShieldIcon } from '../components/Icons'; // [NEW] LockIcon, ShieldIcon
import ShopScreen from './ShopScreen'; // [NEW]

const STEPS = {
    IDENTITY: 0,
    ACTION: 1,
    JOIN: 2,
};

const LobbyScreen = ({ onStartLoading }) => {
    const {
        playerName,
        setPlayerName,
        avatar,
        setAvatar,
        createRoom,
        joinRoom,
        availableRooms,
        refreshRooms,
        login // [FIX] Import login
    } = useGame();
    const { theme, setTheme } = useTheme();
    const { user: authUser, dismissNewUser, dismissRecovered } = useAuth(); // [NEW] Added dismissRecovered
    const { MYSTERY_AVATAR, PLAYER_AVATARS, shuffleArray } = require('../utils/data');
    const Clipboard = require('expo-clipboard'); // [NEW] For copying code

    const [currentStep, setCurrentStep] = useState(STEPS.IDENTITY);
    const [roomToJoin, setRoomToJoin] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showShop, setShowShop] = useState(false); // [NEW]
    const [showAvatarInfo, setShowAvatarInfo] = useState(false); // [NEW] Info Modal State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

    // [NEW] Exit Modal State
    const [showExitModal, setShowExitModal] = useState(false);



    const handleHideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    const handleSettingsPress = () => {
        setShowSettingsModal(true);
    };

    const closeSettings = () => {
        setShowSettingsModal(false);
    };

    // Filter available rooms (mock logic if not provided by GameContext yet)
    const validRooms = availableRooms || [];

    // [NEW] Custom Back Handler
    useEffect(() => {
        if (Platform.OS === 'web') return; // [FIX] Guard for web

        const backAction = () => {
            if (currentStep === STEPS.IDENTITY) {
                // [FIX] Use Custom Modal instead of Alert
                setShowExitModal(true);
                return true;
            } else if (currentStep === STEPS.ACTION) {
                setCurrentStep(STEPS.IDENTITY);
                return true;
            } else if (currentStep === STEPS.JOIN) {
                setCurrentStep(STEPS.ACTION);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [currentStep]);

    // [NEW] Avatar Logic:
    // 1. Current Selection (avatar)
    // 2. Mystery Option (MYSTERY_AVATAR) - "Dado"
    // 3. Presets

    // [NEW] Shared Value for Code Pulse (Static as per user request)
    const codeScale = useSharedValue(1);
    useEffect(() => {
        if (authUser?.isNew) {
            codeScale.value = withTiming(1); // Set to static
        }
    }, [authUser?.isNew]);

    const animatedCodeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: codeScale.value }]
    }));

    // [RESTORED] State for seeds
    const [avatarSeeds, setAvatarSeeds] = useState([]);

    // [NEW] Anchor Avatar: The avatar fixed at position 0 until refresh
    // Initialize with the current avatar (loaded from storage/random-init)
    const [anchorAvatar, setAnchorAvatar] = useState(avatar);

    // [NEW] Store dynamic presets
    const [presetAvatars, setPresetAvatars] = useState(() => {
        // Initial random selection of 10 seeds
        const all = [...PLAYER_AVATARS];
        const shuffled = shuffleArray(all);
        return shuffled.slice(0, 10);
    });
    const carouselRef = React.useRef(null);
    const refreshRotation = useSharedValue(0);

    // Rebuild seeds whenever avatar OR presets changes
    useEffect(() => {
        let newSeeds = [];

        // 1. Anchor (The previously selected/saved one) stays at Pos 0
        if (anchorAvatar) {
            newSeeds.push(anchorAvatar);
        }

        // 2. Mystery Option
        if (anchorAvatar !== MYSTERY_AVATAR) {
            newSeeds.push(MYSTERY_AVATAR);
        }

        // 3. Add dynamic presets (filtering out duplicates of anchor)
        presetAvatars.forEach(p => {
            if (p !== anchorAvatar && p !== MYSTERY_AVATAR) newSeeds.push(p);
        });

        setAvatarSeeds(newSeeds);

    }, [anchorAvatar, presetAvatars]);

    const handleRefreshAvatars = () => {
        refreshRotation.value = withSequence(
            withTiming(refreshRotation.value + 360, { duration: 400, easing: Easing.out(Easing.quad) })
        );

        // [FIX] Stable Refresh Logic: Promote current to Anchor
        if (avatar) setAnchorAvatar(avatar);

        // Shuffle presets
        const all = [...PLAYER_AVATARS];
        const shuffled = shuffleArray(all);
        setPresetAvatars(shuffled.slice(0, 10));

        if (carouselRef.current) {
            carouselRef.current.scrollTo({ x: 0, animated: true });
        }
    };

    const refreshAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${refreshRotation.value}deg` }]
    }));

    // [NEW] Reveal Mystery on Next
    const handleNextToActions = async () => {
        if (!playerName || !playerName.trim()) {
            SoundService.play('error');
            setToast({ visible: true, message: "Inserisci un nome!" });
            return;
        }

        // [FIX] Commit name/avatar to GameContext before proceeding
        // This prevents the "name inconsistency" bug where create/join uses old user state
        try {
            await login(playerName, avatar);
        } catch (e) {
            console.error("Login sync failed", e);
        }

        // REVEAL LOGIC
        let finalAvatar = avatar;
        if (avatar === MYSTERY_AVATAR) {
            // Pick rand from ALL avatars
            finalAvatar = PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
            setAvatar(finalAvatar); // Reveal it in UI
            // Optional: Show a toast "Hai sbloccato: [Name]"?
        }


        setCurrentStep(STEPS.ACTION);
    };

    const handleCreateRoom = async () => {
        // Trigger Splash immediately
        if (onStartLoading) onStartLoading();

        setIsLoading(true);
        try {
            await createRoom({
                avatar: avatar, // [FIX] Pass explicit avatar
                activeCardSkin: authUser?.activeCardSkin || 'classic',
                activeFrame: authUser?.activeFrame || 'basic', // [NEW]
                rank: authUser?.rank || 'Anima Candida' // [NEW]
            });
        } catch (e) {
            // [FIX] Hide Splash on Error + Sound + Toast
            if (onStartLoading) onStartLoading(false); // Force hide splash
            SoundService.play('error');
            setToast({ visible: true, message: "Impossibile creare la stanza." });
            // Alert.alert("Errore", "Impossibile creare la stanza.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinClick = () => {
        refreshRooms();
        setCurrentStep(STEPS.JOIN);
    };

    const handleJoinSpecific = async (roomId) => {
        // Trigger Splash immediately (normal speed)
        if (onStartLoading) onStartLoading(); // Default speed

        setIsLoading(true);
        try {
            await joinRoom(roomId, {
                avatar: avatar, // [FIX] Pass explicit avatar
                activeCardSkin: authUser?.activeCardSkin || 'classic',
                activeFrame: authUser?.activeFrame || 'basic', // [NEW]
                rank: authUser?.rank || 'Anima Candida' // [NEW]
            });
        } catch (e) {
            // [FIX] Hide Splash on Error + Sound + Toast
            if (onStartLoading) onStartLoading(false); // Force hide splash
            SoundService.play('error');
            setToast({ visible: true, message: "Stanza non trovata o piena." });
            // Alert.alert("Errore", "Impossibile unirsi alla stanza.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderIdentityStep = () => (
        <Animated.View
            entering={SlideInLeft.springify().damping(35).stiffness(150)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.stepContainer}
        >

            <View style={{ width: '100%', marginBottom: 0, marginTop: 15 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>CHI SEI?</Text>
                <Text style={[styles.subTitle, { color: '#888', fontFamily: 'Outfit' }]}>
                    Scegli il tuo nome e il tuo volto.
                </Text>
            </View>


            <PremiumInput
                label="IL TUO NOME"
                value={playerName}
                onChangeText={setPlayerName}
                placeholder=""
                style={{ marginBottom: 60 }}
                labelBackgroundColor="#0d0d0d"
            />

            {/* Avatar Section Header with Info Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 0, zIndex: 20 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.accent, fontSize: 16, marginBottom: 0, marginRight: 10 }]}>
                    SCEGLI IL TUO AVATAR
                </Text>
                <View>
                    <PremiumIconButton
                        icon={
                            <InfoIcon size={18} color={theme.colors.accent} />
                        }
                        onPress={() => setShowAvatarInfo(!showAvatarInfo)}
                        style={{
                            backgroundColor: 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 0
                        }}
                        size={32}
                        hitSlop={15}
                    />
                    {showAvatarInfo && (
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(200)}
                            style={{
                                position: 'absolute',
                                bottom: 40,
                                right: -10,
                                width: 220,
                                backgroundColor: '#1e1e1e',
                                borderRadius: 12,
                                padding: 15,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 10,
                                zIndex: 100
                            }}
                        >
                            <Text style={{ color: '#ccc', fontFamily: 'Outfit', fontSize: 13, lineHeight: 18, marginBottom: 8 }}>
                                L'avatar selezionato non sparirà: resterà il primo della lista anche se aggiorni.
                            </Text>
                            <Text style={{ color: '#ccc', fontFamily: 'Outfit', fontSize: 13, lineHeight: 18 }}>
                                L'avatar <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>Dado</Text> ti assegna un'identità segreta.
                            </Text>
                            <View style={{
                                position: 'absolute',
                                bottom: -8,
                                right: 18,
                                width: 0,
                                height: 0,
                                borderLeftWidth: 8,
                                borderRightWidth: 8,
                                borderTopWidth: 8,
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderTopColor: 'rgba(255,255,255,0.1)',
                            }} />
                            <View style={{
                                position: 'absolute',
                                bottom: -7,
                                right: 18,
                                width: 0,
                                height: 0,
                                borderLeftWidth: 8,
                                borderRightWidth: 8,
                                borderTopWidth: 8,
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                                borderTopColor: '#1e1e1e',
                            }} />
                        </Animated.View>
                    )}
                </View>
            </View>

            <AvatarCarousel
                ref={carouselRef}
                seeds={avatarSeeds}
                selectedAvatar={avatar}
                onSelectAvatar={setAvatar}
            />

            {/* [NEW] Bottom Refresh Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 13, fontStyle: 'italic' }}>
                    Tocca qui per cambiare nuovi avatar
                </Text>
                <PremiumIconButton
                    icon={
                        <View>
                            <Animated.View style={refreshAnimatedStyle}>
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                                    <Path
                                        d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                                        fill={theme.colors.accent}
                                    />
                                </Svg>
                            </Animated.View>
                        </View>
                    }
                    onPress={handleRefreshAvatars}
                    style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.accent,
                        backgroundColor: 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 0
                    }}
                    size={32}
                    hitSlop={15}
                />
            </View>

            <PremiumButton
                title="AVANTI ➜"
                onPress={handleNextToActions}
                enableSound={false}
                disabled={!playerName}
                style={{
                    marginTop: 30,
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.accent,
                }}
                textStyle={{
                    color: '#000',
                    fontFamily: 'Cinzel-Bold',
                    fontSize: 20
                }}
            />

            <View style={{ marginBottom: 0 }} />
        </Animated.View>
    );

    const renderActionStep = () => (
        <Animated.View
            entering={SlideInRight.springify().damping(35).stiffness(150)}
            exiting={SlideOutRight.duration(300)}
            style={styles.stepContainer}
        >
            {/* Back Button */}
            <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 0, marginTop: 10 }}>
                <PremiumButton
                    title="← INDIETRO"
                    variant="ghost"
                    enableRipple={false}
                    enableSound={false}
                    onPress={() => setCurrentStep(STEPS.IDENTITY)}
                    style={{ paddingVertical: 5, justifyContent: 'flex-start', width: 'auto', alignSelf: 'flex-start' }}
                    contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 5 }}
                    textStyle={{ fontSize: 14, color: '#7b7b7bff', fontFamily: 'Cinzel-Bold', textAlign: 'left' }}
                />
            </View>

            {/* Title Section */}
            <View style={{ width: '100%', marginBottom: 30, marginTop: 10 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.accent, fontSize: 26 }]}>SCEGLI LA TUA STRADA</Text>
                <Text style={[styles.subTitle, { color: '#888', fontFamily: 'Outfit' }]}>
                    Crea una nuova stanza o unisciti.
                </Text>
            </View>

            {/* Code Input */}
            <View style={{ width: '100%', marginBottom: 20 }}>
                <PremiumInput
                    label="CODICE STANZA"
                    value={roomToJoin}
                    onChangeText={setRoomToJoin}
                    placeholder=""
                    labelBackgroundColor="#0d0d0d"
                />
            </View>



            {/* Action Buttons Row */}
            <View style={{ flexDirection: 'row', width: '100%', marginBottom: 30, gap: 15 }}>
                <PremiumButton
                    title="CREA"
                    variant="outline"
                    onPress={handleCreateRoom}
                    disabled={isLoading}
                    enableSound={false} // [FIX] Avoid pop before potential error/action
                    style={{
                        flex: 1, // Increased width share
                        borderColor: '#333',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        minHeight: 55
                    }}
                    contentContainerStyle={{
                        paddingVertical: 12,
                        paddingHorizontal: 10 // Reduced padding to fit text
                    }}
                    textStyle={{ color: '#aaa', fontSize: 12, fontFamily: 'Cinzel-Bold' }}
                />
                <PremiumButton
                    title="UNISCITI"
                    onPress={() => handleJoinSpecific(roomToJoin)}
                    disabled={!roomToJoin || isLoading}
                    enableSound={false} // [FIX] Avoid pop before potential error
                    style={{
                        flex: 2, // Increased dominance
                        backgroundColor: theme.colors.accent,
                        minHeight: 55
                    }}
                    contentContainerStyle={{
                        paddingVertical: 12,
                    }}
                    textStyle={{ color: '#000', fontSize: 20, fontFamily: 'Cinzel-Bold' }}
                />
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, marginTop: 40 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
                <Text style={{ marginHorizontal: 10, color: '#666', fontSize: 12, fontFamily: 'Cinzel-Bold' }}>OPPURE</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#333' }} />
            </View>

            {/* Open Rooms List */}
            <View style={{ width: '100%', flex: 1, marginTop: 20 }}>

                <View style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    padding: 8,
                    backgroundColor: 'rgba(83, 83, 83, 0.2)',
                    minHeight: 80
                }}>

                    <Text style={{ color: '#888', fontFamily: 'Cinzel-Bold', marginBottom: 10, textAlign: 'center' }}>Stanze Aperte</Text>

                    <ScrollView
                        style={styles.roomList}
                        contentContainerStyle={{ gap: 8 }}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                    >
                        {validRooms.length === 0 ? (
                            <Text style={{ color: '#555', textAlign: 'center', marginTop: 20, fontFamily: 'Outfit', fontStyle: 'italic' }}>
                                Nessuna stanza pubblica al momento.
                            </Text>
                        ) : (
                            validRooms.map((room) => (
                                <RoomItem
                                    key={room.id}
                                    roomName={`Stanza ${room.id}`}
                                    playerCount={Object.keys(room.giocatori || {}).length}
                                    state={room.statoPartita === 'LOBBY' ? 'LOBBY' : 'PLAYING'}
                                    onJoin={() => handleJoinSpecific(room.id)}
                                    creatorName={room.creatore}
                                />
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <PremiumBackground showParticles={true}>
            <TouchableWithoutFeedback onPress={() => { if (showAvatarInfo) setShowAvatarInfo(false); Keyboard.dismiss(); }}>
                <View style={{ flex: 1 }}>
                    <StatusBar hidden={true} />
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <PremiumIconButton
                                icon={
                                    <ScaleIcon size={32} color={theme.colors.accent} />
                                }
                                onPress={() => setShowShop(true)}
                                style={styles.settingsButton}
                                size={48}
                                hitSlop={30}
                            />
                            <PremiumIconButton
                                icon={
                                    <SettingsIcon size={32} color={theme.colors.accent} />
                                }
                                onPress={handleSettingsPress}
                                style={styles.settingsButton}
                                size={48}
                                hitSlop={30}
                            />
                        </View>
                    </View>

                    {/* [NEW] Rank Badge Top-Left (Ultra Clean Version) */}
                    {authUser?.rank && (
                        <Animated.View
                            entering={FadeIn.delay(500)}
                            style={styles.rankBadgeContainer}
                        >
                            <View style={[styles.rankBadgeGradient, { borderColor: (RANK_COLORS[authUser.rank] || '#888') + '66', borderWidth: 1 }]}>
                                <View style={[styles.rankVerticalBar, { backgroundColor: RANK_COLORS[authUser.rank] || '#888' }]} />
                                <Text style={[styles.rankTextLabel, { color: (RANK_COLORS[authUser.rank] || '#888') }]}>
                                    {authUser.rank}
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {currentStep === STEPS.IDENTITY && (
                            <View style={{ alignItems: 'center', marginTop: 0, marginBottom: 30 }}>
                                <Text style={[styles.mainTitle, { color: theme.colors.accent }]}>CARDS OF</Text>
                                <Text style={[styles.mainTitle, { color: theme.colors.accent }]}>MORAL DECAY</Text>
                            </View>
                        )}
                        <View style={styles.frameContainer}>
                            <Animated.View
                                layout={LinearTransition.duration(300)}
                                style={[styles.innerFrame, { borderColor: theme.colors.cardBorder, marginTop: 5 }]}
                            >
                                {currentStep === STEPS.IDENTITY && renderIdentityStep()}
                                {currentStep === STEPS.ACTION && renderActionStep()}
                            </Animated.View>
                        </View>
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>

            <SettingsModal
                visible={showSettingsModal}
                onClose={closeSettings}
            />

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* [NEW] Exit Confirmation Modal */}
            <PremiumModal
                visible={showExitModal}
                onClose={() => setShowExitModal(false)}
                title="USCIRE?"
            >
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 30 }}>
                        Vuoi chiudere l'applicazione?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 15, width: '100%' }}>
                        <PremiumButton
                            title="NO"
                            variant="ghost"
                            enableSound={false}
                            onPress={() => setShowExitModal(false)}
                            style={{ flex: 1 }}
                        />
                        <PremiumButton
                            title="SI, ESCI"
                            enableSound={false}
                            onPress={() => BackHandler.exitApp()}
                            style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#b91c1c' }}
                            textStyle={{ color: 'white' }}
                        />
                    </View>
                </View>
            </PremiumModal>


            <PremiumModal
                visible={showShop}
                onClose={() => setShowShop(false)}
                title="MERCATO NERO"
                modalHeight="85%" // [FIX] Maximize vertical space
            >
                <ShopScreen onClose={() => setShowShop(false)} />
            </PremiumModal>

            {/* [NEW] Mandatory Recovery Code Modal for New Users */}
            <PremiumModal
                visible={!!authUser?.isNew}
                onClose={() => { }} // Non-dismissible without pressing the button
                title="BENVENUTO"
                showClose={false}
            >
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <View style={{
                        width: 64, height: 64, borderRadius: 32,
                        backgroundColor: 'rgba(255, 206, 106, 0.1)',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20,
                        borderWidth: 1.5,
                        borderColor: 'rgba(255, 206, 106, 0.2)'
                    }}>
                        <LockIcon size={32} color={theme.colors.accent} />
                    </View>

                    <Text style={{ color: theme.colors.accent, fontFamily: 'Cinzel-Bold', fontSize: 18, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>
                        SALVA IL TUO CODICE
                    </Text>

                    <Text style={{ color: '#aaa', textAlign: 'center', fontFamily: 'Outfit', fontSize: 14, marginBottom: 20, lineHeight: 20, paddingHorizontal: 10 }}>
                        Questo è l'unico modo per recuperare il tuo account se cambi telefono o disinstalli l'app.
                    </Text>

                    <Animated.View style={[
                        {
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            paddingHorizontal: 30,
                            paddingVertical: 20,
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: theme.colors.accent,
                            marginBottom: 20,
                            width: '100%',
                            alignItems: 'center',
                            shadowColor: theme.colors.accent,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                        },
                        animatedCodeStyle
                    ]}>
                        <Text style={{ color: '#fff', fontFamily: 'Courier New', fontSize: 26, letterSpacing: 5, fontWeight: 'bold' }}>
                            {authUser?.recoveryCode}
                        </Text>
                    </Animated.View>

                    <Text style={{ color: '#666', fontFamily: 'Outfit', fontSize: 12, marginBottom: 25, textAlign: 'center' }}>
                        💡 Lo trovi sempre in <Text style={{ color: '#888', fontWeight: 'bold' }}>Impostazioni &gt; Sicurezza</Text>
                    </Text>

                    <PremiumButton
                        title="HO SALVATO IL CODICE"
                        onPress={() => {
                            Clipboard.setStringAsync(authUser.recoveryCode);
                            dismissNewUser();
                            setToast({ visible: true, message: "Codice copiato! Tienilo al sicuro.", type: 'success' });
                        }}
                        style={{ backgroundColor: theme.colors.accent, width: '100%', height: 55 }}
                        textStyle={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 15 }}
                    />
                </View>
            </PremiumModal>
            {/* [NEW] Success Modal for Account Recovery */}
            <PremiumModal
                visible={!!authUser?.isRecovered}
                onClose={dismissRecovered}
                title="BENTORNATO"
            >
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <View style={{
                        width: 64, height: 64, borderRadius: 32,
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20,
                        borderWidth: 1.5,
                        borderColor: '#4ade80'
                    }}>
                        <ShieldIcon size={32} color="#4ade80" />
                    </View>

                    <Text style={{ color: '#fff', fontFamily: 'Cinzel-Bold', fontSize: 18, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>
                        ACCOUNT RECUPERATO
                    </Text>

                    <Text style={{ color: '#aaa', textAlign: 'center', fontFamily: 'Outfit', fontSize: 16, marginBottom: 25 }}>
                        Tutti i tuoi dati sono stati ripristinati con successo su questo dispositivo.
                    </Text>

                    <PremiumButton
                        title="D'ACCORDO"
                        onPress={dismissRecovered}
                        style={{ backgroundColor: theme.colors.accent, width: '100%', height: 50 }}
                        textStyle={{ color: '#000', fontFamily: 'Cinzel-Bold', fontSize: 14 }}
                    />
                </View>
            </PremiumModal>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 120,
        paddingBottom: 40,
        minHeight: Dimensions.get('window').height + 1 // Force scrollable content
    },
    frameContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    innerFrame: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 0, // Reduced to be just above the top element (Back button)
        backgroundColor: '#0d0d0ddd',
        marginTop: 40,
        overflow: 'hidden', // Clip content during animations to stay inside the frame
    },
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: 'Cinzel Decorative-Bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 18,
        marginVertical: 15,
    },
    roomList: {
        width: '100%',
        maxHeight: 300, // Keeps it bounded but not forced large
        marginVertical: 10,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 38,
        fontFamily: 'Cinzel Decorative-Bold',
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    sectionTitle: {
        fontSize: 24,
        fontFamily: 'Cinzel Decorative-Bold',
        marginBottom: 5,
    },
    header: {
        position: 'absolute',
        top: 20, // [FIX] Reduced from 50
        right: 20,
        zIndex: 1000,
    },
    settingsButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadgeContainer: {
        position: 'absolute',
        top: 25,
        left: 20,
        zIndex: 1000,
        borderRadius: 16,
    },
    rankBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.03)', // Ultra subtle
        gap: 10,
    },
    rankVerticalBar: {
        width: 3,
        height: 14,
        borderRadius: 1.5,
        opacity: 0.8,
    },
    rankTextLabel: {
        fontFamily: 'Cinzel-Bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadowOffset: { width: 0, height: 0 },
    }
});

export default LobbyScreen;
