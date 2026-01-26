import React, { createContext, useState, useContext, useEffect } from 'react';
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

                // Merge to update local state with latest DB data
                setUser(prev => ({ ...prev, ...data }));
            }
        });

        return () => unsubscribe();
    }, [user?.username]);

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

    // --- Action: Sign Up (New Burner Account) ---
    const signUp = async (username) => {
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
    };

    const dismissNewUser = () => {
        setUser(prev => prev ? { ...prev, isNew: false } : null);
    };

    const dismissRecovered = () => {
        setUser(prev => prev ? { ...prev, isRecovered: false } : null);
    };

    // --- Action: Recover Account ---
    const recoverAccount = async (username, code) => {
        // [MODIFIED] Re-use current anonymous session if available
        let currentUser = auth.currentUser;
        if (!currentUser) {
            console.log("[DEBUG] No current user for recovery, signing in anonymously...");
            const authResult = await signInAnonymously(auth);
            currentUser = authResult.user;
        }
        const newUid = currentUser.uid;
        console.log(`[DEBUG] Attempting recovery for ${username} with UID: ${newUid}`);

        // 2. Direct Path Lookup (fixes Permission Denied for reading target user)
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
        // Step A: Map UID to Username (Authorized by current session)
        await set(ref(db, `uids/${newUid}`), username);

        // Step B: Update Username's UID (Authorized by the mapping created in Step A)
        await update(ref(db, `users/${username}`), { uid: newUid });

        // 5. [FIX] Manually update state to jumpstart UI
        setUser({ username, ...userData, uid: newUid, isRecovered: true });

        return true;
    };

    // --- Action: Logout ---
    const logout = async () => {
        await signOut(auth);
        // User state cleared by onAuthStateChanged
    };

    // --- Economy & Assets (Keep existing logic, just adapt refs) ---

    // Note: 'user' object now contains everything we need.

    const refreshUserData = async () => {
        // Handled by realtime listener mostly, but keep for manual sync if needed
        if (!user) return;
        const snapshot = await get(ref(db, `users/${user.username}`));
        if (snapshot.exists()) {
            setUser({ username: user.username, ...snapshot.val() });
        }
    };

    const awardMoney = async (amount) => {
        if (!user) return;
        const userRef = ref(db, `users/${user.username}`);
        await update(userRef, {
            balance: increment(amount),
            totalScore: increment(amount)
        });
        await updateRank(user.username);
        // Listener updates state
    };

    const spendMoney = async (amount) => {
        if (!user) return false;
        if (user.balance < amount) return false;

        const userRef = ref(db, `users/${user.username}`);
        await update(userRef, {
            balance: increment(-amount)
        });
        // Listener updates state
        return true;
    };

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
            if (score >= 5000) newRank = "Entità Apocalittica";
            else if (score >= 2500) newRank = "Eminenza Grigia";
            else if (score >= 1000) newRank = "Architetto del Caos";
            else if (score >= 750) newRank = "Socio del Vizio";
            else if (score >= 500) newRank = "Corrotto";
            else if (score >= 250) newRank = "Innocente";
            else newRank = "Anima Candida";
        }

        if (newRank !== data.rank) {
            await update(userRef, { rank: newRank });
        }
    };

    const buyTheme = async (themeId, cost) => {
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
    };

    const buySkin = async (skinId, cost) => {
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
    };

    const equipSkin = async (skinId) => {
        if (!user) return;
        if (user.unlockedSkins && user.unlockedSkins[skinId]) {
            const userRef = ref(db, `users/${user.username}`);
            await update(userRef, { activeCardSkin: skinId });
        }
    };

    const buyFrame = async (frameId, cost) => {
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
    };

    const equipFrame = async (frameId) => {
        if (!user) return;
        if (frameId === 'basic' || (user.unlockedFrames && user.unlockedFrames[frameId])) {
            const userRef = ref(db, `users/${user.username}`);
            await update(userRef, { activeFrame: frameId });
        }
    };

    const bribe = async (onSuccess) => {
        const cost = 100;
        const success = await spendMoney(cost);
        if (success) {
            if (onSuccess) onSuccess();
            return true;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signUp,        // [NEW] 
            recoverAccount,// [NEW]
            logout,
            awardMoney,
            spendMoney,
            buyTheme,
            buySkin,
            equipSkin,
            buyFrame,
            equipFrame,
            bribe,
            refreshUserData,
            dismissNewUser,
            dismissRecovered
        }}>
            {children}
        </AuthContext.Provider>
    );
};
