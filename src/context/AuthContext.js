import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Linking, Alert } from 'react-native'; // [FIX] Use standard react-native Linking
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ref, get, set, child, update, increment, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../services/firebase';

import { RANK_COLORS, RANK_THRESHOLDS } from '../constants/Ranks';
import NotificationService from '../services/NotificationService';
export { RANK_COLORS, RANK_THRESHOLDS };

import AnalyticsService from '../services/AnalyticsService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [pendingRoom, setPendingRoom] = useState(null); // [NEW] Store room from deep link
    const [pendingInvite, setPendingInvite] = useState(null); // [NEW] Store inviter from deep link
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(true); // Default to true to avoid flash

    const USER_CACHE_KEY = 'cached_user_profile';
    const PENDING_ROOM_KEY = 'pending_room_deep_link'; // [NEW]
    const PENDING_INVITE_KEY = 'pending_invite_deep_link'; // [NEW]

    // 1. Auto-Login (Init)
    useEffect(() => {
        // A. Load from Cache First (Offline Support)
        const loadCache = async () => {
            try {
                const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setUser(parsed);
                }

                // [NEW] Load pending deep link stuff
                const savedRoom = await AsyncStorage.getItem(PENDING_ROOM_KEY);
                if (savedRoom) setPendingRoom(savedRoom);

                const savedInvite = await AsyncStorage.getItem(PENDING_INVITE_KEY);
                if (savedInvite) setPendingInvite(savedInvite);

            } catch (e) {
                console.warn("[AUTH] Cache load failed", e);
            } finally {
                // [FIX] No hardcoded 5s delay. Let Firebase Auth take over or finish if offline.
                // If we have a cached user, we can show the UI. Firebase will sync later.
            }
        };
        loadCache();

        // B. Firebase Auth State
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is authenticated in Firebase Auth
                await loadUserByUid(currentUser.uid);
            } else {
                // [NEW] If no user, sign in anonymously for global rule access
                try {
                    // console.log("No session found, signing in anonymously...");
                    await signInAnonymously(auth);
                } catch (e) {
                    console.error("Early Anonymous Login failed", e);
                    // Don't reset user if we have a cache
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // 1.5. Connectivity Listener
    useEffect(() => {
        const connectedRef = ref(db, ".info/connected");
        const unsub = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                setIsConnected(true);
                // console.log("[FIREBASE] Connected ✅");
            } else {
                setIsConnected(false);
                // console.log("[FIREBASE] Disconnected ❌");
            }
        });
        return () => unsub();
    }, []);

    // 2. Realtime Database Sync (Once user is loaded and has a username)
    useEffect(() => {
        if (!user?.username) return;

        const userRef = ref(db, `users/${user.username}`);
        const unsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                // Consolidate special overrides
                const processedData = applySpecialOverrides(data, user?.username);

                // Merge to update local state with latest DB data
                setUser(prev => ({
                    ...prev,
                    ...processedData,
                    friends: processedData.friends || {},
                    friendRequests: processedData.friendRequests || {}
                }));
            }
        });

        return () => unsubscribe();
    }, [user?.username]);

    // [NEW] Sync Analytics with User Data
    // [NEW] Sync Analytics with User Data
    useEffect(() => {
        if (user?.username) {
            AnalyticsService.identifyUser(user.username);
            // Also set as property for easier filtering/reporting if UserID view is tricky
            AnalyticsService.setUserProperties({
                rank: user.rank,
                username: user.username
            });
        }
    }, [user?.username, user?.rank]);

    // [NEW] Push Notifications Token Sync
    useEffect(() => {
        const registerPushToken = async () => {
            if (!user?.username) return;

            try {
                const token = await NotificationService.registerForPushNotificationsAsync();
                if (token && user.pushToken !== token) {
                    await update(ref(db, `users/${user.username}`), {
                        pushToken: token
                    });
                }
            } catch (error) {
                console.error("[PUSH] Error registering token:", error);
            }
        };

        if (user?.username) {
            registerPushToken();
        }
    }, [user?.username]);

    // [NEW] DEEP LINK HANDLER (Auto-Add Friend & Room)
    useEffect(() => {
        const handleDeepLink = async (url) => {
            if (!url) return;
            try {
                let inviteName = null;

                // 1. Parse Room
                if (url.includes('room=')) {
                    const roomMatch = url.match(/[?&]room=([^&]+)/);
                    if (roomMatch && roomMatch[1]) {
                        const roomCode = roomMatch[1].trim();
                        console.log(`[DEEP LINK] Detected room: ${roomCode}`);
                        setPendingRoom(roomCode);
                        AsyncStorage.setItem(PENDING_ROOM_KEY, roomCode);
                    }
                }

                // 2. Parse Invite
                if (url.includes('invite=')) {
                    const match = url.match(/[?&]invite=([^&]+)/);
                    if (match && match[1]) {
                        inviteName = decodeURIComponent(match[1]).trim();
                        console.log(`[DEEP LINK] Detected invite: ${inviteName}`);
                        setPendingInvite(inviteName);
                        AsyncStorage.setItem(PENDING_INVITE_KEY, inviteName);
                    }
                }

                // 3. Immediate reciprocal add if logged in
                if (user?.username && inviteName && inviteName !== user.username) {
                    if (user.friends && user.friends[inviteName]) return;

                    const updates = {};
                    updates[`users/${user.username}/friends/${inviteName}`] = true;
                    updates[`users/${inviteName}/friendRequests/${user.username}`] = 'invite';
                    await update(ref(db), updates);
                    setPendingInvite(null);
                    AsyncStorage.removeItem(PENDING_INVITE_KEY);

                    Alert.alert(
                        "Nuovo Complice!",
                        `Hai aggiunto ${inviteName} agli amici tramite link.`,
                        [{ text: "OK" }]
                    );
                }
            } catch (e) {
                console.warn("[DEEP LINK] Error:", e);
            }
        };

        Linking.getInitialURL().then(url => handleDeepLink(url));
        const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
        return () => subscription.remove();
    }, [user?.username]);

    // [NEW] PROCESS PENDING INVITE (For new users after they login)
    useEffect(() => {
        if (user?.username && pendingInvite && pendingInvite !== user.username) {
            const processInvite = async () => {
                try {
                    console.log(`[INVITE] Processing pending invite from: ${pendingInvite}`);
                    // check if already friends
                    if (user.friends && user.friends[pendingInvite]) {
                        setPendingInvite(null);
                        AsyncStorage.removeItem(PENDING_INVITE_KEY);
                        return;
                    }

                    const updates = {};
                    updates[`users/${user.username}/friends/${pendingInvite}`] = true;
                    updates[`users/${pendingInvite}/friendRequests/${user.username}`] = 'invite';

                    await update(ref(db), updates);
                    setPendingInvite(null);
                    AsyncStorage.removeItem(PENDING_INVITE_KEY);

                    Alert.alert(
                        "Nuovo Complice!",
                        `Hai aggiunto ${pendingInvite} agli amici tramite link.`,
                        [{ text: "OK" }]
                    );
                } catch (e) {
                    console.warn("[INVITE] Error:", e);
                }
            };
            processInvite();
        }
    }, [user?.username, pendingInvite]);

    // [NEW] AUTO-ACCEPT INVITE REQUESTS
    useEffect(() => {
        if (!user?.friendRequests) return;

        const processAutoAccepts = async () => {
            const requests = user.friendRequests;
            const updates = {};
            let found = false;
            let lastInviter = "";

            for (const requester in requests) {
                if (requests[requester] === 'invite') {
                    // Mutual addition
                    updates[`users/${user.username}/friends/${requester}`] = true;
                    updates[`users/${user.username}/friendRequests/${requester}`] = null;
                    updates[`users/${requester}/friends/${user.username}`] = true;
                    found = true;
                    lastInviter = requester;
                }
            }

            if (found) {
                try {
                    console.log(`[AUTO-ACCEPT] Accepting invites from: ${lastInviter}`);
                    await update(ref(db), updates);
                    // Feedback for the original inviter
                    Alert.alert(
                        "Nuovo Complice!",
                        `${lastInviter} si è unito alla tua banda tramite il tuo link!`,
                        [{ text: "GRANDE" }]
                    );
                } catch (e) {
                    console.warn("[AUTO-ACCEPT] Error:", e);
                }
            }
        };

        processAutoAccepts();
    }, [user?.friendRequests]);

    // 3. RevenueCat Customer Info Listener

    // --- Helper: Apply Special Overrides (e.g. Capo Supremo) ---
    const applySpecialOverrides = (data, username) => {
        if (!data || !username) return data;
        const normalized = username.toLowerCase();

        if (normalized === 'alle') {
            return {
                ...data,
                rank: "Capo supremo",
                unlockedFrames: { ...(data.unlockedFrames || {}), capo: true },
                activeFrame: (!data.activeFrame || data.activeFrame === 'basic') ? 'capo' : data.activeFrame
            };
        }
        return data;
    };

    // --- Helper: Persistence Sync ---
    useEffect(() => {
        if (user) {
            AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
                .catch(err => console.error("[AUTH] Persistence error:", err));
        }
    }, [user]);

    // --- Helper: Generate Recovery Code ---
    const generateRecoveryCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 to avoid confusion
        let code = '';
        for (let i = 0; i < 8; i++) {
            if (i === 3) code += '-';
            else code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // --- Helper: Load User by UID ---
    const loadUserByUid = async (uid) => {
        try {
            // 1. Try Direct Lookup by UID Map (Secure & Scalable)
            const uidRef = ref(db, `uids/${uid}`);
            const uidSnapshot = await get(uidRef);

            if (uidSnapshot.exists()) {
                const username = uidSnapshot.val();
                const userSnapshot = await get(ref(db, `users/${username}`));

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();

                    // [SECURITY] Check if this UID is still the valid owner
                    if (userData.uid && userData.uid !== uid) {
                        console.warn(`[SECURITY] UID mismatch! ${uid} maps to ${username}, but owner is ${userData.uid}.`);
                        await set(uidRef, null);
                        setUser(null);
                        return;
                    }

                    // Apply special overrides
                    const processedData = applySpecialOverrides(userData, username);
                    const finalUser = { username, ...processedData };
                    setUser(finalUser);
                    return;
                }
            }

            setUser(null);
            console.warn("UID not mapped. User must login or recover.");
        } catch (error) {
            console.error("Error loading user by UID:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // --- MEMOIZED ACTIONS ---

    const signUp = useCallback(async (username) => {
        // [MODIFIED] Re-use current anonymous session if available to avoid races
        let currentUser = auth.currentUser;
        if (!currentUser) {
            // console.log("[DEBUG] No current user, signing in anonymously...");
            const authResult = await signInAnonymously(auth);
            currentUser = authResult.user;
        }

        const uid = currentUser.uid;
        // console.log(`[DEBUG] Authenticated as UID: ${uid}`);

        // 2. Check Uniqueness (Optimized for Rules)
        // console.log(`[DEBUG] Checking uniqueness for: ${username}`);
        const userRef = ref(db, `users/${username}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            throw new Error("Questo nome è già preso nel giro.");
        }

        const recoveryCode = generateRecoveryCode();

        // 3. Create DB Record
        const newUser = {
            uid: uid,
            recoveryCode: recoveryCode,
            balance: 500,
            totalScore: 0,
            rank: "Anima Candida",
            createdAt: new Date().toISOString(),
            friends: {}, // Initialize friends
            friendRequests: {}, // [NEW] Initialize friend requests
            unlockedThemes: {
                default: true,
                onice: true,
                ghiaccio: true
            },
            activeCardSkin: 'classic',
            unlockedSkins: {
                classic: true
            },
            activeFrame: 'basic',
            unlockedFrames: {
                basic: true
            },
            unlockedPacks: {
                dark: false
            }
        };

        // Create UID mapping first, then the user profile (Sequential to satisfy Rules)
        // console.log(`[DEBUG] Step 1: Writing to uids/${uid}...`);
        await set(ref(db, `uids/${uid}`), username);

        // console.log(`[DEBUG] Step 2: Writing to users/${username}...`);
        await set(ref(db, `users/${username}`), newUser);

        // console.log(`[DEBUG] Success! Account created for ${username}`);

        // [NEW] Manually update state to jumpstart the UI with isNew flag
        setUser({ username, ...newUser, isNew: true });

        return true;
    }, []);

    const dismissNewUser = useCallback(() => {
        setUser(prev => prev ? { ...prev, isNew: false } : null);
    }, []);

    const dismissRecovered = useCallback(() => {
        setUser(prev => prev ? { ...prev, isRecovered: false } : null);
    }, []);

    // --- Action: Recover Account ---
    const recoverAccount = useCallback(async (username, code) => {
        // [MODIFIED] Re-use current anonymous session if available
        let currentUser = auth.currentUser;
        if (!currentUser) {
            // console.log("[DEBUG] No current user for recovery, signing in anonymously...");
            const authResult = await signInAnonymously(auth);
            currentUser = authResult.user;
        }
        const newUid = currentUser.uid;
        // console.log(`[DEBUG] Attempting recovery for ${username} with UID: ${newUid}`);

        // 2. Direct Path Lookup
        const userRef = ref(db, `users/${username}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            throw new Error("Nessun utente con questo nome.");
        }

        const userData = snapshot.val();

        // 3. Check Code
        if (userData.recoveryCode !== code) {
            throw new Error("Codice di recupero errato.");
        }

        // 4. Update UID Mapping (Sequential to satisfy Firebase Rules)
        // Step A: Map NEW UID to Username
        await set(ref(db, `uids/${newUid}`), username);

        // Step B: Update Username's UID record
        await update(ref(db, `users/${username}`), {
            uid: newUid,
            recoveryProof: code
        });

        // 5. [FIX] Manually update state to jumpstart UI
        setUser({ username, ...userData, uid: newUid, isRecovered: true });

        return true;
    }, []);

    // --- Action: Quick Login [DEV ONLY] ---
    const devLogin = useCallback(async (username) => {
        if (!__DEV__) return;
        setLoading(true);
        try {
            console.log(`[DEV] Quick Login: ${username}`);

            // 1. Ensure anonymous session
            let currentUser = auth.currentUser;
            if (!currentUser) {
                const authResult = await signInAnonymously(auth);
                currentUser = authResult.user;
            }
            const uid = currentUser.uid;

            // 2. Check if user exists
            const userRef = ref(db, `users/${username}`);
            const snapshot = await get(userRef);

            let userData;
            if (!snapshot.exists()) {
                // Create minimal test user
                userData = {
                    uid: uid,
                    recoveryCode: "DEV-MODE",
                    balance: 1000,
                    totalScore: 0,
                    rank: "Anima Candida",
                    createdAt: new Date().toISOString(),
                    friends: {},
                    friendRequests: {},
                    unlockedThemes: { default: true },
                    activeCardSkin: 'classic',
                    unlockedSkins: { classic: true },
                    activeFrame: 'basic',
                    unlockedFrames: { basic: true },
                    unlockedPacks: { dark: false }
                };
                await set(userRef, userData);
            } else {
                userData = snapshot.val();
            }

            // 3. Map UID & Update ownership
            await set(ref(db, `uids/${uid}`), username);
            await update(userRef, { uid: uid });

            // 4. Force state
            const processedData = applySpecialOverrides(userData, username);
            setUser({ username, ...processedData, uid: uid, isRecovered: true });

            return true;
        } catch (e) {
            console.error("[DEV] Login failed:", e);
            Alert.alert("Dev Error", e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Action: Logout ---
    const logout = useCallback(async () => {
        await signOut(auth);
        // User state cleared by onAuthStateChanged
    }, []);

    // --- Economy & Assets (Keep existing logic, just adapt refs) ---

    // Note: 'user' object now contains everything we need.

    const refreshUserData = useCallback(async () => {
        // Handled by realtime listener mostly, but keep for manual sync if needed
        if (!user) return;
        const snapshot = await get(ref(db, `users/${user.username}`));
        if (snapshot.exists()) {
            setUser({ username: user.username, ...snapshot.val() });
        }
    }, [user?.username]);

    const updateRank = async (username) => {
        const userRef = ref(db, `users/${username}`);
        const snapshot = await get(userRef);
        if (!snapshot.exists()) return;

        const data = snapshot.val();
        let newRank = data.rank;
        const score = data.totalScore || 0;

        if (username.toLowerCase() === 'alle') {
            newRank = "Capo supremo";
            // Also ensure the exclusive frame is unlocked
            if (!data.unlockedFrames || !data.unlockedFrames.capo) {
                await update(userRef, { "unlockedFrames/capo": true });
            }
        } else {
            if (score >= 50000) newRank = "Entità Apocalittica";
            else if (score >= 25000) newRank = "Eminenza Grigia";
            else if (score >= 10000) newRank = "Architetto del Caos";
            else if (score >= 5000) newRank = "Socio del Vizio";
            else if (score >= 2500) newRank = "Corrotto";
            else if (score >= 1000) newRank = "Innocente";
            else newRank = "Anima Candida";
        }

        if (newRank !== data.rank) {
            await update(userRef, { rank: newRank });
            // [NEW] Track rank update in Analytics
            AnalyticsService.setUserProperties({ rank: newRank });
        }
    };

    const awardMoney = useCallback(async (amount) => {
        if (!user) return;
        const userRef = ref(db, `users/${user.username}`);
        await update(userRef, {
            balance: increment(amount),
            totalScore: increment(amount)
        });
        await updateRank(user.username);
        // Listener updates state
    }, [user?.username]);

    const spendMoney = useCallback(async (amount) => {
        if (!user) return false;
        if (user.balance < amount) return false;

        const userRef = ref(db, `users/${user.username}`);
        await update(userRef, {
            balance: increment(-amount)
        });
        // Listener updates state
        return true;
    }, [user]);

    const buyTheme = useCallback(async (themeId, cost) => {
        if (!user) return { success: false, message: "Non autenticato" };
        if (user.unlockedThemes && user.unlockedThemes[themeId]) return { success: true, message: "Già posseduto" };

        if (user.balance >= cost) {
            const updates = {};
            updates[`users/${user.username}/balance`] = increment(-cost);
            updates[`users/${user.username}/unlockedThemes/${themeId}`] = true;

            await update(ref(db), updates);
            return { success: true, message: "Acquisto effettuato" };
        } else {
            return { success: false, message: "Fondi insufficienti" };
        }
    }, [user]);

    const buySkin = useCallback(async (skinId, cost) => {
        if (!user) return { success: false, message: "Non autenticato" };
        if (user.unlockedSkins && user.unlockedSkins[skinId]) return { success: true, message: "Già posseduto" };

        if (user.balance >= cost) {
            const updates = {};
            updates[`users/${user.username}/balance`] = increment(-cost);
            updates[`users/${user.username}/unlockedSkins/${skinId}`] = true;

            await update(ref(db), updates);
            return { success: true, message: "Skin acquistata!" };
        } else {
            return { success: false, message: "Non hai abbastanza Dirty Cash." };
        }
    }, [user]);

    const equipSkin = useCallback(async (skinId) => {
        if (!user) return;
        if (user.unlockedSkins && user.unlockedSkins[skinId]) {
            const userRef = ref(db, `users/${user.username}`);
            await update(userRef, { activeCardSkin: skinId });
        }
    }, [user]);

    const buyFrame = useCallback(async (frameId, cost) => {
        if (!user) return { success: false, message: "Non autenticato" };
        if (user.unlockedFrames && user.unlockedFrames[frameId]) return { success: true, message: "Già posseduto" };

        if (user.balance >= cost) {
            const updates = {};
            updates[`users/${user.username}/balance`] = increment(-cost);
            updates[`users/${user.username}/unlockedFrames/${frameId}`] = true;

            await update(ref(db), updates);
            return { success: true, message: "Cornice acquistata!" };
        } else {
            return { success: false, message: "Non hai abbastanza Dirty Cash." };
        }
    }, [user]);

    const equipFrame = useCallback(async (frameId) => {
        if (!user) return;
        if (frameId === 'basic' || (user.unlockedFrames && user.unlockedFrames[frameId])) {
            const userRef = ref(db, `users/${user.username}`);
            await update(userRef, { activeFrame: frameId });
        }
    }, [user]);

    const buyPack = useCallback(async (packId, cost) => {
        if (!user) return { success: false, message: "Non autenticato" };
        if (user.unlockedPacks && user.unlockedPacks[packId]) return { success: true, message: "Già posseduto" };

        if (user.balance >= cost) {
            const updates = {};
            updates[`users/${user.username}/balance`] = increment(-cost);
            updates[`users/${user.username}/unlockedPacks/${packId}`] = true;

            await update(ref(db), updates);
            return { success: true, message: "Pacchetto acquistato!" };
        } else {
            return { success: false, message: "Non hai abbastanza Dirty Cash." };
        }
    }, [user]);

    const bribe = useCallback(async (onSuccess) => {
        const cost = 100;
        const success = await spendMoney(cost);
        if (success) {
            if (onSuccess) onSuccess();
            return true;
        }
        return false;
    }, [spendMoney]);

    const updateProfile = useCallback(async (updates) => {
        if (!user?.username) return;
        const userRef = ref(db, `users/${user.username}`);
        await update(userRef, updates);
    }, [user?.username]);

    // --- Action: Friends System (Mutual) ---
    const sendFriendRequest = useCallback(async (friendUsername) => {
        if (!user || !user.username) throw new Error("Devi essere loggato.");
        const target = friendUsername.trim();

        if (target === user.username) throw new Error("Non puoi essere amico di te stesso (triste).");

        // Check if user exists
        const friendRef = ref(db, `users/${target}`);
        const snapshot = await get(friendRef);
        if (!snapshot.exists()) {
            throw new Error("Utente non trovato.");
        }

        // Check if already friends
        if (user.friends && user.friends[target]) {
            throw new Error("Siete già amici!");
        }

        // Send request to target
        await update(ref(db, `users/${target}/friendRequests`), {
            [user.username]: true
        });

        AnalyticsService.logSocialInteraction('send_request', target); // [NEW]

        return true;
    }, [user]);

    const acceptFriendRequest = useCallback(async (requesterUsername) => {
        if (!user || !user.username) return;

        // Atomic update: Add to my friends, add to their friends, remove request
        const updates = {};
        updates[`users/${user.username}/friends/${requesterUsername}`] = true;
        updates[`users/${user.username}/friendRequests/${requesterUsername}`] = null;
        updates[`users/${requesterUsername}/friends/${user.username}`] = true;

        await update(ref(db), updates);
        AnalyticsService.logSocialInteraction('accept_request', requesterUsername); // [NEW]
    }, [user]);

    const rejectFriendRequest = useCallback(async (requesterUsername) => {
        if (!user || !user.username) return;
        await set(ref(db, `users/${user.username}/friendRequests/${requesterUsername}`), null);
        AnalyticsService.logSocialInteraction('reject_request', requesterUsername); // [NEW]
    }, [user]);

    const removeFriend = useCallback(async (friendUsername) => {
        if (!user || !user.username) return;

        // Remove from BOTH sides
        const updates = {};
        updates[`users/${user.username}/friends/${friendUsername}`] = null;
        updates[`users/${friendUsername}/friends/${user.username}`] = null;

        await update(ref(db), updates);
        AnalyticsService.logSocialInteraction('remove_friend', friendUsername); // [NEW]
    }, [user]);

    const addFriendDirectly = useCallback(async (friendUsername) => {
        if (!user || !user.username) throw new Error("Devi essere loggato.");
        const target = friendUsername.trim();
        if (target === user.username) throw new Error("Non puoi aggiungerti da solo.");

        // Check if target exists
        const targetRef = ref(db, `users/${target}`);
        const snapshot = await get(targetRef);
        if (!snapshot.exists()) {
            throw new Error(`Utente '${target}' non trovato.`);
        }

        // Check if already friends
        if (user.friends && user.friends[target]) return true;

        // Atomic update: Mutual friendship
        const updates = {};
        updates[`users/${user.username}/friends/${target}`] = true;
        updates[`users/${target}/friends/${user.username}`] = true;
        // Also clear any pending request if it existed
        updates[`users/${user.username}/friendRequests/${target}`] = null;

        await update(ref(db), updates);
        AnalyticsService.logSocialInteraction('add_friend_direct', target); // [NEW]
        return true;
    }, [user]);

    // Memoize the context value to avoid re-rendering consumers unless necessary
    const value = React.useMemo(() => ({
        user,
        pendingRoom,
        setPendingRoom,
        pendingInvite,
        setPendingInvite,
        loading,
        isConnected, // [NEW] Exposed for UI usage
        signUp,
        recoverAccount,
        devLogin, // [NEW]
        logout,
        awardMoney,
        spendMoney,
        buyTheme,
        buySkin,
        equipSkin,
        buyFrame,
        equipFrame,
        buyPack,
        bribe,
        updateProfile,
        refreshUserData,
        dismissNewUser,
        dismissRecovered,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        addFriendDirectly
    }), [
        user,
        pendingRoom,
        setPendingRoom,
        pendingInvite,
        setPendingInvite,
        loading,
        signUp,
        recoverAccount,
        devLogin, // [NEW]
        logout,
        awardMoney,
        spendMoney,
        buyTheme,
        buySkin,
        equipSkin,
        buyFrame,
        equipFrame,
        buyPack,
        bribe,
        updateProfile,
        refreshUserData,
        dismissNewUser,
        dismissRecovered,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        addFriendDirectly,
        isConnected
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
