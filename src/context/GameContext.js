import React, { createContext, useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Alert, Platform } from 'react-native'; // Alert kept for fatal errors if absolutely needed, but avoiding user facing ones
import { db } from '../services/firebase';
import { ref, set, get, update, onValue, runTransaction, onDisconnect, child } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLAYER_AVATARS, PLAYER_COLORS, shuffleArray, pickColor } from '../utils/constants';
import SoundService from '../services/SoundService';
import GameDataService from '../services/GameDataService';
import { useAuth } from './AuthContext';
import AnalyticsService from '../services/AnalyticsService';
import NotificationService from '../services/NotificationService'; // [NEW]
import { CHAOS_EVENTS } from '../constants/ChaosEvents';

const KICK_COOLOFF_MS = 8000;

// Context
const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const { user: authUser, loading: authLoading } = useAuth();

    // --- STATE ---
    const [roomCode, setRoomCode] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [availableRooms, setAvailableRooms] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [roomPlayerName, setRoomPlayerName] = useState(null); // [NEW] Track the specific name used in current room
    const [gameDataLoaded, setGameDataLoaded] = useState(GameDataService.isLoaded); // [NEW]
    const [joinNotification, setJoinNotification] = useState(null); // [NEW] Track arrival of new players
    const prevPlayersRef = useRef({}); // [NEW] Track previous player list for arrival logic

    // [NEW] Computed user state from AuthContext
    const user = useMemo(() => {
        if (!authUser) return null;
        return {
            uid: authUser.uid, // [FIX] Include UID for session tracking
            username: authUser.username, // [FIX] Expose canonical username for logic
            nickname: authUser.nickname, // [FIX] Keep raw nickname if needed
            name: (authUser.nickname || authUser.username || '').trim(), // [FIX] Prioritize secondary nickname
            avatar: authUser.avatar || authUser.activeAvatar || 'User', // Fallback
            friends: authUser.friends || {}, // [NEW] Required for room notifications
            friendRequests: authUser.friendRequests || {} // [NEW]
        };
    }, [authUser]);

    const roomUnsubscribe = useRef(null);
    const allRoomsUnsubscribe = useRef(null);

    // [NEW] Initialize Game Data (Waiting for Auth)
    useEffect(() => {
        if (!authLoading) {
            GameDataService.initialize().then(() => {
                setGameDataLoaded(true);
            });
        }
    }, [authLoading]);

    // [NEW] Trigger re-hydration when GameDataService finally loads
    useEffect(() => {
        if (gameDataLoaded && roomCode && roomData) {
            // Check if roomData contains nulls in cards that should be there
            // Actually, simpler: just re-subscribe or re-hydrate current state
            const roomRef = ref(db, `stanze/${roomCode}`);
            get(roomRef).then(snap => {
                if (snap.exists()) {
                    setRoomData(hydrateRoom(snap.val()));
                }
            });
        }
    }, [gameDataLoaded]);

    // Load User (Refactored to only handle legacy or non-auth essentials if needed)
    // Actually, AuthContext handles everything now. 
    // We only keep this for potential cleanup or specific storage. 
    useEffect(() => {
        // We can remove AsyncStorage syncing for name/avatar here 
        // as it's handled by AuthContext (Firebase + Anonymous session)
    }, []);

    // [NEW] Persistent Room Recovery
    useEffect(() => {
        const recoverRoom = async () => {
            try {
                const storedCode = await AsyncStorage.getItem('lastRoomCode');
                const storedName = await AsyncStorage.getItem('lastRoomPlayerName');
                if (storedCode && storedName) {
                    setRoomCode(storedCode);
                    setRoomPlayerName(storedName);
                    subscribeToRoom(storedCode);
                    // [FIX] Re-assert presence immediately
                    setPresence(storedCode, storedName);
                }
            } catch (e) { console.warn("Room recovery failed", e); }
        };
        recoverRoom();
    }, []);

    // [FIX] Re-assert presence on connection restore
    useEffect(() => {
        const connectedRef = ref(db, ".info/connected");
        const unsub = onValue(connectedRef, (snap) => {
            const isOnline = snap.val() === true;
            if (isOnline && roomCode) {
                const name = roomPlayerName || user?.name;
                if (name) {
                    // console.log("[GAME] Connection restored. Refreshing presence.");
                    setPresence(roomCode, name);
                }
            }
        });
        return () => unsub();
    }, [roomCode, roomPlayerName, user?.nickname, user?.username]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (roomUnsubscribe.current) roomUnsubscribe.current();
            if (allRoomsUnsubscribe.current) allRoomsUnsubscribe.current();
        };
    }, []);

    // Listen for Rooms
    useEffect(() => {
        const roomsRef = ref(db, 'stanze');
        const unsub = onValue(roomsRef, (snapshot) => {
            if (snapshot.exists()) {
                try {
                    const data = snapshot.val();
                    const now = Date.now();
                    const STALE_MS = 24 * 60 * 60 * 1000; // 24 Hours

                    const roomList = Object.keys(data).map(key => {
                        const room = data[key];
                        const players = Object.values(room.giocatori || {});

                        if (players.length > 0) {
                            const isAnyoneOnline = players.some(p => p.online === true);
                            if (!isAnyoneOnline) {
                                // Find the most recent activity among all players
                                const lastSeenTimes = players.map(p => p.lastSeen || 0);
                                const mostRecentActivity = Math.max(...lastSeenTimes, room.timestamp || 0);

                                if (now - mostRecentActivity > STALE_MS) {
                                    console.log(`[CLEANUP] Deleting offline room ${key}`);
                                    set(ref(db, `stanze/${key}`), null);
                                    return null;
                                }
                            }
                        } else {
                            // Empty rooms are deleted based on creation timestamp
                            const roomTs = room.timestamp || 0;
                            if (now - roomTs > STALE_MS) {
                                set(ref(db, `stanze/${key}`), null);
                                return null;
                            }
                        }

                        const hydrated = hydrateRoom(room);
                        return {
                            id: key,
                            ...hydrated
                        };
                    }).filter(r => r !== null);
                    roomList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setAvailableRooms(roomList);
                } catch (err) {
                    setAvailableRooms([]);
                }
            } else {
                setAvailableRooms([]);
            }
        }, (error) => {
            setAvailableRooms([]);
        });
        allRoomsUnsubscribe.current = unsub;
        return () => unsub();
    }, [authUser?.uid]);

    // --- HELPERS ---

    const hydrateRoom = (room) => {
        if (!room) return room;
        const newRoom = { ...room };
        const forcedLang = newRoom.language || newRoom.roomLanguage || null;

        // [FIX] Global Key Normalization (Trim names)
        const normalizeKeys = (obj) => {
            if (!obj) return obj;
            const normalized = {};
            Object.keys(obj).forEach(key => {
                normalized[key.trim()] = obj[key];
            });
            return normalized;
        };

        if (newRoom.giocatori) newRoom.giocatori = normalizeKeys(newRoom.giocatori);
        if (newRoom.punti) newRoom.punti = normalizeKeys(newRoom.punti);
        if (newRoom.carteGiocate) newRoom.carteGiocate = normalizeKeys(newRoom.carteGiocate);
        if (newRoom.connessi) newRoom.connessi = normalizeKeys(newRoom.connessi);
        if (newRoom.dominus) newRoom.dominus = newRoom.dominus.trim();
        if (newRoom.creatore) newRoom.creatore = newRoom.creatore.trim();

        // [IRON FIST] Ghost Slayer: Permanently filter out any KICKED player
        if (newRoom.kickedPlayers && newRoom.giocatori) {
            Object.keys(newRoom.kickedPlayers).forEach(kName => {
                if (newRoom.kickedPlayers[kName]) { // Any truthy value = kicked
                    // Scrub from everywhere in the local object
                    Object.keys(newRoom.giocatori).forEach(p => {
                        if (p.trim().toLowerCase() === kName) delete newRoom.giocatori[p];
                    });
                    if (newRoom.punti) {
                        Object.keys(newRoom.punti).forEach(p => {
                            if (p.trim().toLowerCase() === kName) delete newRoom.punti[p];
                        });
                    }
                    if (newRoom.connessi) {
                        Object.keys(newRoom.connessi).forEach(p => {
                            if (p.trim().toLowerCase() === kName) delete newRoom.connessi[p];
                        });
                    }
                }
            });
        }

        // 1. Black Card
        if (typeof newRoom.cartaNera === 'number') {
            newRoom.cartaNera = GameDataService.getBlackCardByIndex(newRoom.cartaNera, forcedLang);
        }

        // 3. Players Hands
        if (newRoom.giocatori) {
            Object.keys(newRoom.giocatori).forEach(pName => {
                if (newRoom.giocatori[pName].carte && Array.isArray(newRoom.giocatori[pName].carte)) {
                    newRoom.giocatori[pName].carte = newRoom.giocatori[pName].carte.map(item =>
                        typeof item === 'number' ? GameDataService.getWhiteCardByIndex(item, forcedLang) : item
                    );
                }
            });
        }

        // 4. Played Cards
        if (newRoom.carteGiocate) {
            Object.keys(newRoom.carteGiocate).forEach(pName => {
                const val = newRoom.carteGiocate[pName];
                if (Array.isArray(val)) {
                    newRoom.carteGiocate[pName] = val.map(item =>
                        typeof item === 'number' ? GameDataService.getWhiteCardByIndex(item, forcedLang) : item
                    );
                } else if (typeof val === 'number') {
                    newRoom.carteGiocate[pName] = GameDataService.getWhiteCardByIndex(val, forcedLang);
                }
            });
        }

        return newRoom;
    };

    const dehydrateRoom = (room) => {
        if (!room) return room;
        const newRoom = { ...room };
        const forcedLang = newRoom.roomLanguage || null;

        // [FIX] Global Key Normalization (Ensure keys remain trimmed in DB)
        const normalizeKeys = (obj) => {
            if (!obj) return obj;
            const normalized = {};
            Object.keys(obj).forEach(key => {
                normalized[key.trim()] = obj[key];
            });
            return normalized;
        };

        if (newRoom.giocatori) newRoom.giocatori = normalizeKeys(newRoom.giocatori);
        if (newRoom.punti) newRoom.punti = normalizeKeys(newRoom.punti);
        if (newRoom.carteGiocate) newRoom.carteGiocate = normalizeKeys(newRoom.carteGiocate);
        if (newRoom.connessi) newRoom.connessi = normalizeKeys(newRoom.connessi);
        if (newRoom.dominus) newRoom.dominus = newRoom.dominus.trim();
        if (newRoom.creatore) newRoom.creatore = newRoom.creatore.trim();

        // 1. Black Card
        if (newRoom.cartaNera && typeof newRoom.cartaNera === 'object') {
            newRoom.cartaNera = GameDataService.getBlackCardIndex(newRoom.cartaNera, forcedLang);
        }

        // 2. Decks (truncated deck logic skipped as it was before)
        if (newRoom.blackDeck && Array.isArray(newRoom.blackDeck)) {
            newRoom.blackDeck = newRoom.blackDeck.map(item =>
                typeof item === 'object' ? GameDataService.getBlackCardIndex(item, forcedLang) : item
            );
        }
        if (newRoom.whiteDeck && Array.isArray(newRoom.whiteDeck)) {
            newRoom.whiteDeck = newRoom.whiteDeck.map(item =>
                typeof item === 'string' ? GameDataService.getWhiteCardIndex(item, forcedLang) : item
            );
        }

        // 3. Players Hands
        if (newRoom.giocatori) {
            Object.keys(newRoom.giocatori).forEach(pName => {
                if (newRoom.giocatori[pName].carte && Array.isArray(newRoom.giocatori[pName].carte)) {
                    newRoom.giocatori[pName].carte = newRoom.giocatori[pName].carte.map(item =>
                        typeof item === 'string' ? GameDataService.getWhiteCardIndex(item, forcedLang) : item
                    );
                }
            });
        }

        // 4. Played Cards
        if (newRoom.carteGiocate) {
            Object.keys(newRoom.carteGiocate).forEach(pName => {
                const val = newRoom.carteGiocate[pName];
                if (Array.isArray(val)) {
                    newRoom.carteGiocate[pName] = val.map(item =>
                        typeof item === 'string' ? GameDataService.getWhiteCardIndex(item, forcedLang) : item
                    );
                } else if (typeof val === 'string') {
                    newRoom.carteGiocate[pName] = GameDataService.getWhiteCardIndex(val, forcedLang);
                }
            });
        }

        return newRoom;
    };

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const setPresence = async (code, name) => {
        if (!code || !name) return;
        try {
            const trimmedName = name.trim();
            const normalizedName = trimmedName.toLowerCase();
            const rRef = ref(db, `stanze/${code}`);

            // 1. Pre-check: Don't even start if we were recently kicked
            const rSnap = await get(rRef);
            if (!rSnap.exists()) return;
            const room = rSnap.val();

            const kickTime = room.kickedPlayers?.[normalizedName];
            if (kickTime) {
                return; // Permanently blocked until re-join clears the ban
            }

            // 2. Existence Check: hydrateRoom trims keys. 
            // We check against the RAW giocatori object to be 100% sure.
            const rawGiocatori = room.giocatori || {};
            const exists = Object.keys(rawGiocatori).some(k => k.trim() === trimmedName);

            if (!exists) {
                // [DEBUG] console.log(`[setPresence] Aborting: player ${trimmedName} not found in room.`);
                return;
            }

            const playerRef = ref(db, `stanze/${code}/giocatori/${name}`);
            const result = await runTransaction(playerRef, (current) => {
                if (current) {
                    // [GHOST-BUSTER] If it exists but lacks critical data, delete it.
                    if (!current.avatar && !current.uid) {
                        return null;
                    }
                    return {
                        ...current,
                        online: true,
                        lastSeen: Date.now()
                    };
                }
                return current; // Stay deleted if null
            });

            // 3. Conditional onDisconnect: ONLY if the node is healthy
            if (result.committed && result.snapshot.exists() && result.snapshot.val()?.avatar) {
                const od = onDisconnect(playerRef);
                await od.update({ online: false, lastSeen: Date.now() });
            }

        } catch (e) {
            // Silently fail
        }
    };

    const subscribeToRoom = (code) => {
        if (roomUnsubscribe.current) roomUnsubscribe.current();
        const roomRef = ref(db, `stanze/${code}`);
        roomUnsubscribe.current = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const rawRoom = snapshot.val();
                setRoomData(hydrateRoom(rawRoom));
            } else {
                setRoomData(null);
                setRoomCode(null);
            }
        });
    };

    // [NEW] Arrival Notification Tracking
    useEffect(() => {
        if (!roomCode) {
            prevPlayersRef.current = {};
            return;
        }

        if (roomData?.giocatori) {
            const currentPlayers = roomData.giocatori;
            const prevPlayers = prevPlayersRef.current || {};

            // Find players in current that weren't in prev
            Object.keys(currentPlayers).forEach(pName => {
                const isNew = !prevPlayers[pName];
                // Only notify for OTHER players, and ignore if it's the first load (prevPlayers empty)
                const me = (roomPlayerName || user?.name || user?.username || '').trim().toLowerCase();
                const pNameLower = pName.trim().toLowerCase();
                const isNotMe = pNameLower !== me && pNameLower !== (user?.name || '').trim().toLowerCase();
                if (isNew && isNotMe && Object.keys(prevPlayers).length > 0) {
                    console.log(`[GAME] Player joined: ${pName}`);
                    setJoinNotification({ name: pName, timestamp: Date.now() });
                }
            });

            // Update ref
            prevPlayersRef.current = currentPlayers;
        } else {
            prevPlayersRef.current = {};
        }
    }, [roomData?.giocatori, roomPlayerName, user?.name, user?.username, roomCode]);

    const clearJoinNotification = () => setJoinNotification(null);
    // [NEW] Quick Join Logic
    const quickJoin = async () => {
        // Find a suitable public room
        const candidates = availableRooms.filter(r =>
            r.visibility === 'public' &&
            r.statoPartita === 'LOBBY' &&
            Object.keys(r.giocatori || {}).length < 10
        );

        if (candidates.length > 0) {
            // [FIX] Sort by FEWEST players first
            candidates.sort((a, b) => {
                const countA = Object.keys(a.giocatori || {}).length;
                const countB = Object.keys(b.giocatori || {}).length;
                return countA - countB;
            });

            // Join the smallest room
            const bestRoom = candidates[0];
            return await joinRoom(bestRoom.id);
        } else {
            // No room found, maybe create one? Or just return null for UI to handle
            throw new Error("Nessuna stanza pubblica disponibile al momento.");
        }
    };

    // --- ACTIONS ---

    const refreshRooms = () => { };

    const login = async (name, avatar) => {
        // Redundant with AuthContext, but keeping as a bridge
        console.log(`[DEBUG] GameContext.login called for ${name}. AuthContext handles identity.`);
    };

    const kickPlayer = async (targetNameInput) => {
        const isCreatorCheck = user && roomData && (
            (roomData.creatore === user.name) ||
            (roomData.creatorUsername && roomData.creatorUsername === user.username)
        );
        if (!roomCode || !isCreatorCheck || !targetNameInput) return;

        const targetNormalized = targetNameInput.trim().toLowerCase();

        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);

                // [FIX] Robust normalized cleanup for ALL keys
                const findAndRemove = (obj) => {
                    if (!obj) return;
                    Object.keys(obj).forEach(key => {
                        if (key.trim().toLowerCase() === targetNormalized) {
                            delete obj[key];
                        }
                    });
                };

                findAndRemove(room.giocatori);
                findAndRemove(room.punti);
                findAndRemove(room.carteGiocate);
                findAndRemove(room.connessi);

                // [NEW] Robust Winner Cleanup
                if ((room.vincitoreTurno || '').trim().toLowerCase() === targetNormalized) {
                    room.vincitoreTurno = null;
                }

                // 2. Handle Case: Kicked Player was Dominus
                const dominusNormalized = (room.dominus || '').trim().toLowerCase();
                const players = Object.keys(room.giocatori || {});

                if (dominusNormalized === targetNormalized) {
                    if (players.length > 0) {
                        // Reassign Dominus
                        const nextIdx = (room.dominusIndex || 0) % players.length;
                        room.dominus = players[nextIdx];
                        room.dominusIndex = nextIdx;

                        if (room.statoPartita === "IN_GIOCO") {
                            // Force Next Round (to avoid stuck turns)
                            room.carteGiocate = {};
                            room.vincitoreTurno = null;

                            // Get new Black Card
                            if (!room.blackDeck || room.blackDeck.length === 0) {
                                const forcedLang = room.roomLanguage || null;
                                const { carteNere } = GameDataService.getPackages(room.allowedPackages || { base: true });
                                room.blackDeck = shuffleArray([...carteNere]);
                            }
                            room.cartaNera = room.blackDeck.pop();
                            room.statoTurno = "WAITING_CARDS";
                        }
                    } else if (room.statoPartita === "LOBBY") {
                        // No players left or no dominus in lobby? This shouldn't happen but for safety:
                        room.dominus = null;
                    }
                } else if (room.statoPartita === "IN_GIOCO" && room.statoTurno === "WAITING_CARDS") {
                    // Check if current turn can proceed after player removal
                    const activePlayers = players.filter(name => {
                        return name.trim().toLowerCase() !== (room.dominus || '').trim().toLowerCase();
                    }).length;
                    const playedCount = Object.keys(room.carteGiocate || {}).length;
                    if (activePlayers > 0 && playedCount >= activePlayers) {
                        room.statoTurno = "DOMINUS_CHOOSING";
                    }
                }

                // Final safety: if no players left, room is effectively dead
                if (players.length === 0 && room.statoPartita === "LOBBY") {
                    return null; // Delete room
                }

                // [NEW] Permanent ban in kickedPlayers - cleared only on explicit rejoin
                room.kickedPlayers = room.kickedPlayers || {};
                room.kickedPlayers[targetNormalized] = true;

                return dehydrateRoom(room);
            });
        } catch (e) { console.error("Kick Player Error:", e); }
    };

    const createRoom = async (extraData = {}) => {
        const currentName = (user?.nickname || user?.username || '').trim();
        const currentUsername = (user?.username || '').trim();
        if (!currentName || !currentUsername) throw new Error("User not logged in or name missing");
        setLoading(true);
        try {
            const code = generateRoomCode();
            const initialAvatar = extraData.avatar || user?.avatar ||
                PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];

            await set(ref(db, `stanze/${code}`), dehydrateRoom({
                creatore: currentName,
                creatorUsername: currentUsername, // [FIX] Storing canonical ID for friend matching
                dominus: currentName,
                dominusIndex: 0,
                // [NEW] Store Package Settings & Language
                allowedPackages: extraData.allowedPackages || { base: true, dark: false, chill: false, spicy: false },
                roomLanguage: extraData.roomLanguage || GameDataService.language || 'it',
                visibility: extraData.visibility || 'private', // [NEW] public vs private
                chaosMode: extraData.chaosMode || false, // [NEW] Chaos Engine Toggle
                activeChaosEvent: null, // [NEW] Current active event
                lastChaosEvent: null, // [NEW] Track history for variety
                cartaNera: null,
                carteGiocate: {},
                punti: { [currentName]: 0 },
                turnoCorrente: 0,
                statoTurno: "LOBBY",
                vincitoreTurno: null,
                puntiPerVincere: 7,
                giocatori: {
                    [currentName]: {
                        uid: user?.uid, // [NEW] Track unique ID for session recovery
                        carte: [],
                        jokers: 3,
                        bribes: 5,
                        avatar: initialAvatar,
                        color: pickColor(new Set()),
                        online: true,
                        lastSeen: Date.now(),
                        activeFrame: extraData.activeFrame || 'basic',
                        rank: extraData.rank || 'Anima Candida'
                    }
                },
                statoPartita: "LOBBY",
                kickedPlayers: {}, // [NEW] Track recently kicked
                timestamp: Date.now()
            }));

            await setPresence(code, currentName);
            setRoomCode(code);
            setRoomPlayerName(currentName);
            AsyncStorage.setItem('lastRoomCode', code);
            AsyncStorage.setItem('lastRoomPlayerName', currentName || '');
            subscribeToRoom(code);

            // [NEW] Notify Friends (Background)
            if (user?.friends) {
                // Don't await this to keep UI snappy
                notifyFriendsOfRoomArgs(user, code).catch(err => console.warn("[PUSH] Friend notify failed", err));
            }

            return code;
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // [NEW] Helper to notify friends
    const notifyFriendsOfRoomArgs = async (currentUser, roomCode) => {
        if (!currentUser || !currentUser.friends) return;
        const friendUsernames = Object.keys(currentUser.friends);
        console.log(`[PUSH] Notifying ${friendUsernames.length} friends about room ${roomCode}`);

        for (const friendName of friendUsernames) {
            try {
                const friendRef = ref(db, `users/${friendName}`);
                const snap = await get(friendRef);
                if (snap.exists()) {
                    const friendData = snap.val();
                    if (friendData.pushToken && friendData.notificationsEnabled !== false) {
                        const targetLang = friendData.language || 'en';
                        // Manually picking strings since we are outside React component for t()
                        const title = targetLang === 'en' ? 'New Room Created!' : 'Nuova Stanza Creata!';
                        const body = targetLang === 'en'
                            ? `${currentUser.username} created a room! Join code: ${roomCode}`
                            : `${currentUser.username} ha creato una stanza! Codice: ${roomCode}`;

                        await NotificationService.sendPushNotification(
                            friendData.pushToken,
                            title,
                            body,
                            { type: 'ROOM_CREATE', roomCode: roomCode, screen: 'Lobby', host: currentUser.username }
                        );
                    }
                }
            } catch (e) {
                console.error(`[PUSH] Failed to notify friend ${friendName}`, e);
            }
        }
    };

    const joinRoom = async (codeInput, extraData = {}) => {
        const currentName = (user?.nickname || user?.username || '').trim();
        if (!currentName) throw new Error("Login necessario");
        const code = codeInput.trim().toUpperCase();
        setLoading(true);

        try {
            const roomRef = ref(db, `stanze/${code}`);
            const snapshot = await get(roomRef);
            if (!snapshot.exists()) throw new Error("Stanza non trovata");

            const data = snapshot.val();

            // [NEW] Kick Check: Kicked players cannot rejoin (ban cleared below if host allows)
            const isKicked = data.kickedPlayers?.[currentName.trim().toLowerCase()];
            if (isKicked) {
                throw new Error('kicked_error');
            }
            const myUid = user?.uid;
            const existingPlayer = data.giocatori?.[currentName];
            const avatarToUse = extraData.avatar || user?.avatar || 'RANDOM';
            const usedColors = new Set(Object.values(data.giocatori || {}).map(p => p.color));

            // [NEW] Check for UID Collision (Duplicate Session with different name)
            const duplicateName = Object.keys(data.giocatori || {}).find(name =>
                name !== currentName && data.giocatori[name].uid === myUid
            );

            if (duplicateName) {
                console.log(`[JOIN] Found duplicate session for UID ${myUid} as "${duplicateName}". Cleaning up...`);
                await runTransaction(roomRef, (rawRoom) => {
                    if (!rawRoom) return rawRoom;
                    const r = hydrateRoom(rawRoom);
                    if (r.giocatori) delete r.giocatori[duplicateName];
                    if (r.punti) delete r.punti[duplicateName];
                    if (r.connessi) delete r.connessi[duplicateName];
                    if (r.carteGiocate) delete r.carteGiocate[duplicateName];
                    // Add new player below
                    return dehydrateRoom(r);
                });
            }

            if (existingPlayer) {
                await update(ref(db, `stanze/${code}/giocatori/${currentName}`), {
                    uid: user?.uid, // [NEW] Ensure UID is stored
                    online: true,
                    lastSeen: Date.now(),
                    avatar: avatarToUse,
                    activeFrame: extraData.activeFrame || existingPlayer.activeFrame || 'basic',
                    rank: extraData.rank || existingPlayer.rank || 'Anima Candida'
                });
            } else if (data.statoPartita === 'IN_GIOCO') {
                await runTransaction(roomRef, (rawRoom) => {
                    if (!rawRoom) return rawRoom;
                    const room = hydrateRoom(rawRoom);
                    if (!room.whiteDeck) room.whiteDeck = shuffleArray([...GameDataService.getCarteBianche()]);
                    const hand = [];
                    for (let i = 0; i < 10; i++) { if (room.whiteDeck.length > 0) hand.push(room.whiteDeck.pop()); }
                    room.giocatori = room.giocatori || {};
                    room.giocatori[currentName] = {
                        uid: user?.uid, // [NEW] Track UID
                        carte: hand, jokers: 3, bribes: 5, avatar: avatarToUse, color: pickColor(usedColors),
                        online: true, lastSeen: Date.now(), joinedAt: Date.now(), hasDiscarded: false,
                        activeFrame: extraData.activeFrame || 'basic', rank: extraData.rank || 'Anima Candida'
                    };
                    room.punti = room.punti || {};
                    if (room.punti[currentName] === undefined) room.punti[currentName] = 0;
                    return dehydrateRoom(room);
                });
            } else {
                const playerObj = {
                    uid: user?.uid, // [NEW] Track UID
                    carte: [],
                    jokers: 3,
                    bribes: 5,
                    avatar: avatarToUse,
                    color: pickColor(usedColors),
                    online: true,
                    lastSeen: Date.now(),
                    joinedAt: Date.now(),
                    hasDiscarded: false,
                    activeFrame: extraData.activeFrame || 'basic',
                    rank: extraData.rank || 'Anima Candida'
                };
                await set(ref(db, `stanze/${code}/giocatori/${currentName}`), playerObj);
                await set(ref(db, `stanze/${code}/punti/${currentName}`), 0);
            }

            setPresence(code, currentName).catch(e => console.warn("Presence failed async:", e));
            setRoomCode(code);
            setRoomPlayerName(currentName);
            AsyncStorage.setItem('lastRoomCode', code);
            AsyncStorage.setItem('lastRoomPlayerName', currentName || '');
            subscribeToRoom(code);

            // [NEW] Push Notification to Room Creator
            try {
                const creatorUsername = data.creatorUsername || data.creatore;
                // Only notify if we are not the creator
                if (user.username !== creatorUsername) {
                    const creatorRef = ref(db, `users/${creatorUsername}`);
                    const creatorSnap = await get(creatorRef);
                    if (creatorSnap.exists()) {
                        const creatorData = creatorSnap.val();
                        if (creatorData.pushToken) {
                            const targetLang = creatorData.language || 'en';
                            const title = targetLang === 'en' ? 'New Player Joined!' : 'Nuovo Giocatore!';
                            const body = targetLang === 'en'
                                ? `${currentName} has entered your room.`
                                : `${currentName} è entrato nella tua stanza.`;

                            await NotificationService.sendPushNotification(
                                creatorData.pushToken,
                                title,
                                body,
                                { type: 'ROOM_JOIN', roomCode: code, screen: 'Lobby' }
                            );
                        }
                    }
                }
            } catch (e) {
                console.warn("[PUSH] Failed to send room join notification", e);
            }

            return code;
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const leaveRoom = async () => {
        if (roomCode && user) {
            const currentCode = roomCode;
            const currentName = roomPlayerName || (user?.nickname || user?.username);

            try {
                // [FIX] Cancel onDisconnect BEFORE clearing local state
                const playerRef = ref(db, `stanze/${currentCode}/giocatori/${currentName}`);
                await onDisconnect(playerRef).cancel();

                // [FIX] IMMEDIATE State Clearing to prevent presence/listener race conditions
                if (roomUnsubscribe.current) roomUnsubscribe.current();
                setRoomCode(null);
                setRoomData(null);
                setRoomPlayerName(null);
                AsyncStorage.removeItem('lastRoomCode');
                AsyncStorage.removeItem('lastRoomPlayerName');

                const rRef = ref(db, `stanze/${currentCode}`);
                const snap = await get(rRef);
                if (snap.exists()) {
                    const room = snap.val();
                    if (room.statoPartita === 'LOBBY' || room.statoPartita === undefined) {
                        await runTransaction(rRef, (rawRoom) => {
                            if (!rawRoom) return rawRoom;
                            const r = hydrateRoom(rawRoom);
                            if (r.giocatori) delete r.giocatori[currentName];
                            if (r.punti) delete r.punti[currentName];
                            if (r.connessi) delete r.connessi[currentName];

                            const remaining = Object.keys(r.giocatori || {});
                            if (remaining.length === 0) return null;

                            if (r.creatore === currentName) {
                                const nextHost = remaining[0];
                                r.creatore = nextHost;
                                r.creatorUsername = r.giocatori[nextHost]?.username || nextHost;
                            }
                            if (r.dominus === currentName) {
                                r.dominus = remaining[0];
                            }

                            return dehydrateRoom(r);
                        });
                    } else {
                        // In Game: Just set offline
                        await update(playerRef, { online: false, lastSeen: Date.now() });
                    }
                }
            } catch (e) {
                // Secondary fallback: ensure local state is cleared even on network error
                setRoomCode(null);
                setRoomData(null);
                AsyncStorage.removeItem('lastRoomCode');
            }
        }
    };

    const deleteRoom = async (roomId) => {
        if (!user) return;
        try {
            // [FIX] Robust check: Ensure user is creator
            const roomRef = ref(db, `stanze/${roomId}`);
            const snapshot = await get(roomRef);
            if (snapshot.exists()) {
                const room = snapshot.val();
                const isCreator = (room.creatore === user.name) ||
                    (room.creatorUsername && room.creatorUsername === user?.username);

                if (isCreator) {
                    await set(roomRef, null); // Delete the room
                    // If we were in it, local state cleanup happens via onValue or explicit leave
                    if (roomCode === roomId) {
                        leaveRoom();
                    }
                } else {
                    throw new Error("Non autorizzato");
                }
            }
        } catch (e) {
            console.error("Delete Room Error:", e);
            throw e;
        }
    };

    useEffect(() => {
        if (roomCode && roomData && user && !loading) {
            const myNameTrimmed = (roomPlayerName || user.name || '').trim();
            const myNameNormalized = myNameTrimmed.toLowerCase();
            const players = Object.keys(roomData.giocatori || {});

            // 1. Check if still in giocatori (case-sensitive check on hydrated/trimmed keys)
            const stillInRoom = roomData.giocatori && !!roomData.giocatori[myNameTrimmed];

            // 2. [NEW] Permanently kicked? Leave immediately.
            const isKicked = roomData.kickedPlayers?.[myNameNormalized];

            if ((roomData.giocatori && !stillInRoom) || isKicked) {
                // console.log(`[GAME] Ejected: ${isKickedActive ? 'kicked active' : 'missing'}`);
                leaveRoom();
            }
        }
    }, [roomData?.giocatori, roomData?.kickedPlayers, user?.name, roomCode, loading, roomPlayerName]);

    const startGame = async (targetPoints = 7) => {
        if (!roomCode || !roomData) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                room.statoPartita = "IN_GIOCO";
                room.statoTurno = "WAITING_CARDS";
                room.puntiPerVincere = targetPoints;
                room.vincitorePartita = null;
                room.vincitoreTurno = null;
                room.randoPoints = 0; // [FIX] Reset Bot Points for new game
                if (room.punti) { Object.keys(room.punti).forEach(k => { room.punti[k] = 0; }); }
                return dehydrateRoom(room);
            });
            await dealInitialCards();
        } catch (e) { console.error("GameContext Error:", e); }
    };

    const dealInitialCards = async () => {
        const rRef = ref(db, `stanze/${roomCode}`);
        await runTransaction(rRef, (rawRoom) => {
            if (!rawRoom) return rawRoom;
            const room = hydrateRoom(rawRoom);

            // [NEW] Use room settings for packages and language
            const packages = room.allowedPackages || { base: true, dark: false };
            const forcedLang = room.roomLanguage || null;

            // Update GameDataService to the forced language temporarily to get the right packages
            const oldLang = GameDataService.language;
            if (forcedLang) GameDataService.setLanguage(forcedLang);

            const { carteNere, carteBianche } = GameDataService.getPackages(packages);

            // Restore language
            if (forcedLang) GameDataService.setLanguage(oldLang);

            room.blackDeck = shuffleArray([...carteNere]);
            room.whiteDeck = shuffleArray([...carteBianche]);
            Object.keys(room.giocatori || {}).forEach(pName => {
                const hand = [];
                for (let i = 0; i < 10; i++) { if (room.whiteDeck.length) hand.push(room.whiteDeck.pop()); }
                room.giocatori[pName].carte = hand;
                // [NEW] Reset resources for new game
                room.giocatori[pName].jokers = 3;
                room.giocatori[pName].bribes = 5;
                room.giocatori[pName].bribeCount = 0;
            });
            room.cartaNera = room.blackDeck.pop();
            room.statoTurno = "WAITING_CARDS";
            room.statoPartita = "IN_GIOCO";
            return dehydrateRoom(room);
        });
    };

    const playCards = async (selectedCards) => {
        if (!roomCode || !user) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                if (!room.giocatori || !room.giocatori[roomPlayerName || user.name]) return dehydrateRoom(room);
                const pName = roomPlayerName || user.name;
                room.carteGiocate = room.carteGiocate || {};
                room.carteGiocate[pName] = selectedCards;
                const currentHand = room.giocatori[pName].carte || [];
                room.giocatori[pName].carte = currentHand.filter(c => {
                    const cardText = typeof c === 'string' ? c : c?.testo;
                    return !selectedCards.some(sc => (typeof sc === 'string' ? sc : sc?.testo) === cardText);
                });
                const activePlayers = Object.entries(room.giocatori).filter(([name]) => name !== room.dominus).length;
                const playedCount = Object.keys(room.carteGiocate || {}).length;

                // [FIX] ATOMIC TRANSACTION: Check if we are the last one playing in a 2-player game
                // activePlayers includes us (because we are inside the transaction, but our card is already added to 'carteGiocate' above)
                // Actually, 'room.carteGiocate' is updated in-memory above. So 'playedCount' includes us.

                // Condition: 2 Players total (1 Dominus + 1 Player)
                // We are that 1 Player. We just played.
                if (activePlayers === 1) {
                    const blanks = room.cartaNera?.blanks || 1;
                    const randoCards = [];
                    // Pop needed amount of cards
                    for (let i = 0; i < blanks; i++) {
                        // [FIX] EMPTY DECK SAFETY: Reshuffle if needed
                        if (!room.whiteDeck || room.whiteDeck.length === 0) {
                            // Harvest used cards to refill deck
                            const excludedCards = new Set();
                            // - Hands
                            Object.values(room.giocatori || {}).forEach(p => {
                                (p.carte || []).forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                            });
                            // - Currently Played
                            Object.values(room.carteGiocate || {}).forEach(cards => {
                                const arr = Array.isArray(cards) ? cards : [cards];
                                arr.forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                            });

                            // Get all cards from packages
                            const allWhite = GameDataService.getPackages(room.allowedPackages || { base: true, dark: false }).carteBianche;
                            const availableCards = allWhite.filter(c => !excludedCards.has(c.trim()));
                            room.whiteDeck = shuffleArray(availableCards);
                        }

                        if (room.whiteDeck && room.whiteDeck.length > 0) {
                            randoCards.push(room.whiteDeck.pop());
                        }
                    }

                    if (randoCards.length > 0) {
                        room.carteGiocate = room.carteGiocate || {};
                        room.carteGiocate["Rando"] = randoCards;
                    }
                    room.statoTurno = "DOMINUS_CHOOSING";
                } else if (playedCount >= activePlayers && activePlayers > 0) {
                    room.statoTurno = "DOMINUS_CHOOSING";
                }
                return dehydrateRoom(room);
            });
        } catch (e) { console.error(e); }
    };

    const confirmDominusSelection = async (winnerName) => {
        if (!roomCode) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);

                // [NEW] Unified Chaos Logic (Before determining final winner)
                let actualWinner = winnerName;
                let pointsToAdd = 1;

                // [NEW] CHAOS ENGINE LOGIC
                if (room.chaosMode && room.activeChaosEvent) {
                    // 1. INFLATION (Double Points)
                    if (room.activeChaosEvent === CHAOS_EVENTS.INFLATION) {
                        pointsToAdd = 2;
                    }

                    // 2. IDENTITY SWAP
                    if (room.activeChaosEvent === CHAOS_EVENTS.IDENTITY_SWAP) {
                        // Pool includes real players AND Rando if active
                        let candidatePool = Object.keys(room.giocatori || {}).filter(n => n !== room.dominus);

                        // [FIX] Robust Rando detection: check if Rando actually played cards this turn
                        if (room.carteGiocate && room.carteGiocate['Rando']) {
                            candidatePool.push('Rando');
                        }

                        // Safety dedupe
                        candidatePool = [...new Set(candidatePool)];

                        if (candidatePool.length > 1) {
                            const randomIdx = Math.floor(Math.random() * candidatePool.length);
                            const newWinner = candidatePool[randomIdx];

                            actualWinner = newWinner;
                        }
                    }

                    // 3. ROBIN HOOD (Lowest Score Wins)
                    if (room.activeChaosEvent === CHAOS_EVENTS.ROBIN_HOOD) {
                        let minScore = Infinity;
                        let poorestPlayers = [];

                        const checkScore = (name, score) => {
                            if (score < minScore) {
                                minScore = score;
                                poorestPlayers = [name];
                            } else if (score === minScore) {
                                poorestPlayers.push(name);
                            }
                        };

                        // Check Humans
                        Object.keys(room.giocatori || {}).forEach(p => {
                            if (p !== room.dominus) {
                                checkScore(p, room.punti?.[p] || 0);
                            }
                        });

                        // Check Rando (only if playing)
                        if (room.carteGiocate && room.carteGiocate['Rando']) {
                            checkScore('Rando', room.randoPoints || 0);
                        }

                        if (poorestPlayers.length > 0) {
                            const randomPoor = poorestPlayers[Math.floor(Math.random() * poorestPlayers.length)];
                            room.chaosSwapDetails = {
                                original: winnerName,
                                actual: randomPoor,
                                type: 'ROBIN_HOOD'
                            };
                            actualWinner = randomPoor;
                        }
                    }

                    // 4. DIRTY WIN (Cash, no points)
                    if (room.activeChaosEvent === CHAOS_EVENTS.DIRTY_WIN) {
                        pointsToAdd = 0; // No points
                        // Grant Dirty Cash (100 DC)
                        if (actualWinner !== 'Rando') {
                            room.chaosReward = {
                                player: actualWinner,
                                amount: 50, // [FIX] Changed from 100 to 50 to sum with standard 50 bonus
                                type: 'DIRTY_CASH'
                            };
                        }
                    }
                }

                // [APPLY POINTS / WIN CONDITION]
                if (actualWinner === 'Rando') {
                    // Rando Logic
                    room.randoPoints = (room.randoPoints || 0) + pointsToAdd;
                    room.vincitoreTurno = 'Rando';

                    if (room.randoPoints >= (room.puntiPerVincere || 7)) {
                        room.statoPartita = "GAME_OVER";
                        room.vincitorePartita = 'Rando';
                    }
                } else {
                    // Human Logic
                    const newScore = (room.punti[actualWinner] || 0) + pointsToAdd;
                    room.punti[actualWinner] = newScore;
                    room.vincitoreTurno = actualWinner;

                    if (AnalyticsService) {
                        AnalyticsService.logRoundComplete(roomCode, actualWinner, (room.turnoCorrente || 0) + 1);
                    }

                    if (newScore >= (room.puntiPerVincere || 7)) {
                        room.statoPartita = "GAME_OVER";
                        room.vincitorePartita = actualWinner;
                        if (AnalyticsService) {
                            AnalyticsService.logGameWin(actualWinner, newScore);
                        }
                    }
                }

                room.statoTurno = "SHOWING_WINNER";
                return dehydrateRoom(room);
            });
        } catch (e) { console.error(e); }
    };

    const nextRound = async () => {
        if (!roomCode) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);

                // [FIX] Increment Turn Counter
                room.turnoCorrente = (room.turnoCorrente || 0) + 1;

                // [NEW] CHAOS ENGINE TRIGGER
                // Reset previous event
                room.activeChaosEvent = null;
                room.chaosSwapDetails = null; // [NEW] Reset swap info

                const humanPlayers = Object.keys(room.giocatori || {});
                const interval = humanPlayers.length === 2 ? 3 : 2;

                if (room.chaosMode && room.turnoCorrente > 0 && room.turnoCorrente % interval === 0) {
                    const events = Object.values(CHAOS_EVENTS);
                    const lastEvent = room.lastChaosEvent;

                    // Filter out the last event to guarantee variety
                    const availableEvents = events.filter(e => e !== lastEvent);
                    const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];

                    room.activeChaosEvent = randomEvent;
                    room.lastChaosEvent = randomEvent; // Update history
                }

                if (!room.blackDeck || room.blackDeck.length === 0) {
                    const forcedLang = room.roomLanguage || null;
                    const oldLang = GameDataService.language;
                    if (forcedLang) GameDataService.setLanguage(forcedLang);
                    const { carteNere } = GameDataService.getPackages(room.allowedPackages || { base: true, dark: false });
                    room.blackDeck = shuffleArray([...carteNere]);
                    if (forcedLang) GameDataService.setLanguage(oldLang);
                }
                if (!room.whiteDeck || room.whiteDeck.length < 10) {
                    const forcedLang = room.roomLanguage || null;
                    const oldLang = GameDataService.language;
                    if (forcedLang) GameDataService.setLanguage(forcedLang);

                    const excludedCards = new Set();
                    // 1. Hands
                    Object.values(room.giocatori || {}).forEach(p => {
                        (p.carte || []).forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                    });
                    // 2. Currently in deck
                    (room.whiteDeck || []).forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                    // 3. Played cards
                    Object.values(room.carteGiocate || {}).forEach(cards => {
                        const arr = Array.isArray(cards) ? cards : [cards];
                        arr.forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                    });

                    const allWhite = GameDataService.getPackages(room.allowedPackages || { base: true, dark: false }).carteBianche;
                    const availableCards = allWhite.filter(c => !excludedCards.has(c.trim()));
                    room.whiteDeck = [...(room.whiteDeck || []), ...shuffleArray(availableCards)];

                    if (forcedLang) GameDataService.setLanguage(oldLang);
                }
                const players = Object.keys(room.giocatori);
                const nextIdx = (players.indexOf(room.dominus) + 1) % players.length;
                room.dominus = players[nextIdx];
                Object.keys(room.giocatori).forEach(pName => {
                    const hand = room.giocatori[pName].carte || [];
                    while (hand.length < 10 && room.whiteDeck.length > 0) hand.push(room.whiteDeck.pop());
                    room.giocatori[pName].carte = hand;
                    room.giocatori[pName].hasDiscarded = false;
                });
                room.cartaNera = room.blackDeck.pop();
                room.carteGiocate = {};
                room.vincitoreTurno = null;
                room.statoTurno = "WAITING_CARDS";
                return dehydrateRoom(room);
            });
        } catch (e) { console.error(e); }
    };

    const discardCard = async (cardText) => {
        if (!roomCode || !user) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                const pName = roomPlayerName || user.name;
                const player = room.giocatori[pName];
                if (!player || player.hasDiscarded) return dehydrateRoom(room);
                const index = (player.carte || []).findIndex(c => (typeof c === 'string' ? c : c?.testo || '').trim() === (cardText || '').trim());
                if (index > -1) { player.carte.splice(index, 1); player.hasDiscarded = true; }
                if (!room.whiteDeck || room.whiteDeck.length === 0) {
                    const excludedCards = new Set();
                    Object.values(room.giocatori || {}).forEach(p => { (p.carte || []).forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); }); });
                    Object.values(room.carteGiocate || {}).forEach(cards => {
                        const arr = Array.isArray(cards) ? cards : [cards];
                        arr.forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                    });

                    const allWhite = GameDataService.getPackages(room.allowedPackages || { base: true, dark: false }).carteBianche;
                    const availableCards = allWhite.filter(c => !excludedCards.has(c.trim()));
                    room.whiteDeck = shuffleArray(availableCards);
                }
                while ((player.carte || []).length < 10 && room.whiteDeck && room.whiteDeck.length > 0) { player.carte.push(room.whiteDeck.pop()); }
                return dehydrateRoom(room);
            });
        } catch (e) { console.error(e); subscribeToRoom(roomCode); }
    };

    const useAIJoker = async () => {
        if (!roomCode || !user || !roomData) return false;
        try {
            let success = false;
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                const pName = roomPlayerName || user.name;
                const player = room.giocatori[pName];
                if (!player || (player.jokers || 0) <= 0) {
                    throw new Error("JOKER_LIMIT");
                }

                // [NEW] Self-Healing: remove null/undefined cards from hand first
                if (player.carte) {
                    player.carte = player.carte.filter(c => c !== null && c !== undefined);
                }

                const excludedCards = new Set();
                // - Hands
                Object.values(room.giocatori || {}).forEach(p => {
                    (p.carte || []).forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                });
                // - Played cards
                Object.values(room.carteGiocate || {}).forEach(cards => {
                    const arr = Array.isArray(cards) ? cards : [cards];
                    arr.forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                });

                const blackCard = room.cartaNera;
                let newCard = null;

                // 2. Try best answers VALIDATED [USER REQUEST: NO FALLBACK]
                if (blackCard && blackCard.bestAnswers && blackCard.bestAnswers.length > 0) {
                    const availableBestAnswers = blackCard.bestAnswers.filter(ans => {
                        if (!ans || ans.trim().length === 0) return false;
                        if (excludedCards.has(ans.trim())) return false;
                        // Verify it actually exists in the pool to get a valid index
                        return GameDataService.getWhiteCardIndex(ans, room.roomLanguage) !== -1;
                    });

                    if (availableBestAnswers.length > 0) {
                        const pickedRaw = availableBestAnswers[Math.floor(Math.random() * availableBestAnswers.length)];
                        // Use canonical version from pool to ensure perfect matching
                        const poolIdx = GameDataService.getWhiteCardIndex(pickedRaw, room.roomLanguage);
                        newCard = GameDataService.getWhiteCardByIndex(poolIdx, room.roomLanguage);

                        // Remove from deck if it was there (to avoid duplicates)
                        if (room.whiteDeck && newCard) {
                            room.whiteDeck = room.whiteDeck.filter(c => {
                                const text = typeof c === 'string' ? c : (c?.testo || c?.text);
                                return text?.trim() !== newCard?.trim();
                            });
                        }
                    }
                }

                // 3. Apply changes ONLY if a valid card was found
                if (newCard && newCard.trim().length > 0) {
                    // Remove the current card that's being replaced to keep hand size
                    if (player.carte && player.carte.length >= 10) {
                        player.carte.shift();
                    }

                    player.carte.push(newCard);
                    player.jokers = (player.jokers || 0) - 1;

                    // Keep hand full
                    while ((player.carte || []).length < 10 && room.whiteDeck && room.whiteDeck.length > 0) {
                        player.carte.push(room.whiteDeck.pop());
                    }
                    success = true;
                }

                return dehydrateRoom(room);
            });
            return success;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const forceReveal = async () => {
        if (!roomCode) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                room.statoTurno = "DOMINUS_CHOOSING";
                return dehydrateRoom(room);
            });
        } catch (e) { console.error(e); }
    };

    const bribeHand = async () => {
        if (!roomCode || !user) return;
        try {
            let success = false;
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                const pName = roomPlayerName || user.name;
                const player = room.giocatori[pName];
                if (!player) return dehydrateRoom(room);

                // [NEW] Use 'bribes' as stock (remaining)
                const currentBribes = player.bribes !== undefined ? player.bribes : Math.max(0, 5 - (player.bribeCount || 0));
                if (currentBribes <= 0) {
                    throw new Error("BRIBE_LIMIT");
                }

                if (!room.whiteDeck) room.whiteDeck = [];
                if (player.carte && player.carte.length > 0) room.whiteDeck.push(...player.carte);
                room.whiteDeck = shuffleArray(room.whiteDeck);
                player.carte = [];
                while (player.carte.length < 10 && room.whiteDeck.length > 0) player.carte.push(room.whiteDeck.pop());

                // Decrement stock
                player.bribes = currentBribes - 1;
                player.bribeCount = (player.bribeCount || 0) + 1; // Keep for legacy/analytics if needed
                success = true;
                return dehydrateRoom(room);
            });
            return success;
        } catch (e) {
            console.error("Bribe error", e);
            if (e.message === "BRIBE_LIMIT") {
                throw new Error(translations[GameDataService.language]?.bribe_limit_reached || "Limite mazzette raggiunto");
            }
            return false;
        }
    };

    // [NEW] Chaos Engine: Dictatorship Event
    const dominusDiscardPlayerHand = async (targetPlayerName) => {
        if (!roomCode || !user || !roomData) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);

                // Verify we are Dominus and Event is active
                if ((roomPlayerName || user.name) !== room.dominus) return rawRoom;
                if (room.activeChaosEvent !== CHAOS_EVENTS.DICTATORSHIP) return rawRoom;

                const player = room.giocatori[targetPlayerName];
                if (!player) return rawRoom;

                // Discard all cards
                player.carte = [];

                // Refill Hand
                if (!room.whiteDeck || room.whiteDeck.length < 10) {
                    const excludedCards = new Set();
                    Object.values(room.giocatori || {}).forEach(p => { (p.carte || []).forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); }); });
                    Object.values(room.carteGiocate || {}).forEach(cards => {
                        const arr = Array.isArray(cards) ? cards : [cards];
                        arr.forEach(c => { const text = typeof c === 'string' ? c : c?.testo; if (text) excludedCards.add(text.trim()); });
                    });
                    const allWhite = GameDataService.getPackages(room.allowedPackages || { base: true, dark: false }).carteBianche;
                    const availableCards = allWhite.filter(c => !excludedCards.has(c.trim()));
                    room.whiteDeck = shuffleArray(availableCards);
                }

                while ((player.carte || []).length < 10 && room.whiteDeck && room.whiteDeck.length > 0) {
                    player.carte.push(room.whiteDeck.pop());
                }

                return dehydrateRoom(room);
            });
        } catch (e) { console.error("Dictatorship Error:", e); }
    };

    const isCreator = useMemo(() => !!(roomPlayerName && roomData && roomData.creatore === roomPlayerName), [roomPlayerName, roomData?.creatore]);
    const isDominus = useMemo(() => !!(roomPlayerName && roomData && roomData.dominus === roomPlayerName), [roomPlayerName, roomData?.dominus]);
    const myHand = useMemo(() => (roomPlayerName && roomData && roomData.giocatori?.[roomPlayerName]?.carte) ? roomData.giocatori[roomPlayerName].carte : [], [roomPlayerName, roomData?.giocatori]);

    const updateRoomSettings = async (settings) => {
        if (!roomCode || !isCreator) return;
        try {
            await update(ref(db, `stanze/${roomCode}`), settings);
        } catch (e) {
            console.error("Failed to update room settings", e);
        }
    };

    const contextValue = useMemo(() => ({
        user, roomCode, roomData, loading, error, availableRooms,
        refreshRooms,
        login, createRoom, joinRoom, leaveRoom, quickJoin, deleteRoom, // [NEW]
        kickPlayer,
        updateRoomSettings,
        startGame, playCards, confirmDominusSelection, nextRound, discardCard, useAIJoker, forceReveal, bribeHand, dominusDiscardPlayerHand, // [NEW]
        isCreator, isDominus, myHand, roomPlayerName, gameDataLoaded,
        joinNotification, clearJoinNotification // [NEW]
    }), [
        user, roomCode, roomData, loading, error, availableRooms,
        isCreator, isDominus, myHand, roomPlayerName, gameDataLoaded
    ]);

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};