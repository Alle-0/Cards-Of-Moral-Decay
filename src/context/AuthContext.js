import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ref, get, set, child, update, increment, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../services/firebase';

// [NEW] Rank Style Config
export const RANK_COLORS = {
    "Capo supremo": "#ff00ff", // Magenta for the boss
    "Entità Apocalittica": "#ef4444", // Red
    "Eminenza Grigia": "#8b5cf6", // Purple
    "Architetto del Caos": "#f97316", // Orange
    "Socio del Vizio": "#eab308", // Yellow
    "Corrotto": "#22c55e", // Green
    "Innocente": "#3b82f6", // Blue
    "Anima Candida": "#94a3b8"  // Gray
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Auto-Login (Init)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is authenticated in Firebase Auth
                await loadUserByUid(currentUser.uid);

                await loadUserByUid(currentUser.uid);
            } else {
                // [NEW] If no user, sign in anonymously for global rule access
                try {
                    console.log("No session found, signing in anonymously...");
                    await signInAnonymously(auth);
                } catch (e) {
                    console.error("Early Anonymous Login failed", e);
                    setUser(null);
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Realtime Database Sync (Once user is loaded and has a username)
    useEffect(() => {
        if (!user?.username) return;

        const userRef = ref(db, `users/${user.username}`);
        const unsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                // [NEW] Special override for Alle
                if (user?.username?.toLowerCase() === 'alle') {
                    data.rank = "Capo supremo";
                    data.unlockedFrames = { ...data.unlockedFrames, capo: true };
                    // Force equip the exclusive frame if no frame is active or it's the basic one
                    if (!data.activeFrame || data.activeFrame === 'basic') {
                        data.activeFrame = 'capo';
                    }
                }

                // Merge to update local state with latest DB data, handling deleted nodes
                setUser(prev => ({
                    ...prev,
                    ...data,
                    friends: data.friends || {},
                    friendRequests: data.friendRequests || {}
                }));
            }
        });

        return () => unsubscribe();
    }, [user?.username]);

    // 3. RevenueCat Customer Info Listener

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
                    // If the account was recovered by another UID, userData.uid will be different.
                    if (userData.uid && userData.uid !== uid) {
                        console.warn(`[SECURITY] UID mismatch! ${uid} maps to ${username}, but owner is ${userData.uid}. Cleaning up stale mapping.`);
                        // We are authenticated as 'uid', so we HAVE permission to delete 'uids/${uid}'
                        await set(uidRef, null);
                        setUser(null);
                        return;
                    }

                    // [NEW] Special override for Alle
                    if (username.toLowerCase() === 'alle') {
                        userData.rank = "Capo supremo";
                        userData.unlockedFrames = { ...(userData.unlockedFrames || {}), capo: true };
                        if (!userData.activeFrame || userData.activeFrame === 'basic') {
                            userData.activeFrame = 'capo';
                        }
                    }

                    setUser({ username, ...userData });
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
            console.log("[DEBUG] No current user, signing in anonymously...");
            const authResult = await signInAnonymously(auth);
            currentUser = authResult.user;
        }

        const uid = currentUser.uid;
        console.log(`[DEBUG] Authenticated as UID: ${uid}`);

        // 2. Check Uniqueness (Optimized for Rules)
        console.log(`[DEBUG] Checking uniqueness for: ${username}`);
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
                ghiaccio: true,
                onice: true
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
        console.log(`[DEBUG] Step 1: Writing to uids/${uid}...`);
        await set(ref(db, `uids/${uid}`), username);

        console.log(`[DEBUG] Step 2: Writing to users/${username}...`);
        await set(ref(db, `users/${username}`), newUser);

        console.log(`[DEBUG] Success! Account created for ${username}`);

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
            console.log("[DEBUG] No current user for recovery, signing in anonymously...");
            const authResult = await signInAnonymously(auth);
            currentUser = authResult.user;
        }
        const newUid = currentUser.uid;
        console.log(`[DEBUG] Attempting recovery for ${username} with UID: ${newUid}`);

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
    }, [user]);

    const rejectFriendRequest = useCallback(async (requesterUsername) => {
        if (!user || !user.username) return;
        await set(ref(db, `users/${user.username}/friendRequests/${requesterUsername}`), null);
    }, [user]);

    const removeFriend = useCallback(async (friendUsername) => {
        if (!user || !user.username) return;

        // Remove from BOTH sides
        const updates = {};
        updates[`users/${user.username}/friends/${friendUsername}`] = null;
        updates[`users/${friendUsername}/friends/${user.username}`] = null;

        await update(ref(db), updates);
    }, [user]);

    // Memoize the context value to avoid re-rendering consumers unless necessary
    const value = React.useMemo(() => ({
        user,
        loading,
        signUp,
        recoverAccount,
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
        removeFriend
    }), [
        user,
        loading,
        signUp,
        recoverAccount,
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
        removeFriend
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
