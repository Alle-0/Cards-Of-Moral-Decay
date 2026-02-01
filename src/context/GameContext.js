import React, { createContext, useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Alert, Platform } from 'react-native'; // Alert kept for fatal errors if absolutely needed, but avoiding user facing ones
import { db } from '../services/firebase';
import { ref, set, get, update, onValue, runTransaction, onDisconnect, child } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLAYER_AVATARS, PLAYER_COLORS, shuffleArray, pickColor } from '../utils/constants';
import SoundService from '../services/SoundService';
import GameDataService from '../services/GameDataService';
import { useAuth } from './AuthContext';

// Context
const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const { user: authUser, loading: authLoading } = useAuth();

    // --- STATE ---
    console.log("GameProvider initializing...");
    const [roomCode, setRoomCode] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [roomPlayerName, setRoomPlayerName] = useState(null); // [NEW] Track the specific name used in current room

    // [NEW] Computed user state from AuthContext
    const user = useMemo(() => {
        if (!authUser) return null;
        return {
            username: authUser.username, // [FIX] Expose canonical username for logic
            name: authUser.nickname || authUser.username, // [FIX] Prioritize secondary nickname
            avatar: authUser.avatar || authUser.activeAvatar || 'User' // Fallback
        };
    }, [authUser]);

    const roomUnsubscribe = useRef(null);
    const allRoomsUnsubscribe = useRef(null);

    // [NEW] Initialize Game Data (Waiting for Auth)
    useEffect(() => {
        if (!authLoading) {
            GameDataService.initialize();
        }
    }, [authLoading]);

    // Load User (Refactored to only handle legacy or non-auth essentials if needed)
    // Actually, AuthContext handles everything now. 
    // We only keep this for potential cleanup or specific storage. 
    useEffect(() => {
        // We can remove AsyncStorage syncing for name/avatar here 
        // as it's handled by AuthContext (Firebase + Anonymous session)
    }, []);

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
                const data = snapshot.val();
                const roomList = Object.keys(data).map(key => {
                    const hydrated = hydrateRoom(data[key]);
                    return {
                        id: key,
                        ...hydrated
                    };
                });
                roomList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setAvailableRooms(roomList);
            } else {
                setAvailableRooms([]);
            }
        });
        allRoomsUnsubscribe.current = unsub;
        return () => unsub();
    }, []);

    // --- HELPERS ---

    const hydrateRoom = (room) => {
        if (!room) return room;
        const newRoom = { ...room };
        const forcedLang = newRoom.roomLanguage || null;

        // 1. Black Card
        if (typeof newRoom.cartaNera === 'number') {
            newRoom.cartaNera = GameDataService.getBlackCardByIndex(newRoom.cartaNera, forcedLang);
        }

        // 2. Decks (Optional, mostly for internal state if needed)
        if (newRoom.blackDeck && Array.isArray(newRoom.blackDeck)) {
            newRoom.blackDeck = newRoom.blackDeck.map(item =>
                typeof item === 'number' ? GameDataService.getBlackCardByIndex(item, forcedLang) : item
            );
        }
        if (newRoom.whiteDeck && Array.isArray(newRoom.whiteDeck)) {
            newRoom.whiteDeck = newRoom.whiteDeck.map(item =>
                typeof item === 'number' ? GameDataService.getWhiteCardByIndex(item, forcedLang) : item
            );
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

        // 1. Black Card
        if (newRoom.cartaNera && typeof newRoom.cartaNera === 'object') {
            newRoom.cartaNera = GameDataService.getBlackCardIndex(newRoom.cartaNera, forcedLang);
        }

        // 2. Decks
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

    const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const setPresence = async (code, name) => {
        try {
            const playerRef = ref(db, `stanze/${code}/giocatori/${name}`);
            await update(playerRef, { online: true, lastSeen: Date.now() });
            const od = onDisconnect(playerRef);
            await od.update({ online: false, lastSeen: Date.now() });
        } catch (e) { console.warn("Presence failed", e); }
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

    // --- ACTIONS ---

    const refreshRooms = () => { };

    const login = async (name, avatar) => {
        // Redundant with AuthContext, but keeping as a bridge
        console.log(`[DEBUG] GameContext.login called for ${name}. AuthContext handles identity.`);
    };

    const kickPlayer = async (targetName) => {
        const isCreatorCheck = user && roomData && roomData.creatore === user.name;
        if (!roomCode || !isCreatorCheck || !targetName) return;

        try {
            const updates = {};
            updates[`stanze/${roomCode}/giocatori/${targetName}`] = null;
            updates[`stanze/${roomCode}/punti/${targetName}`] = null;
            updates[`stanze/${roomCode}/carteGiocate/${targetName}`] = null;
            updates[`stanze/${roomCode}/connessi/${targetName}`] = null;

            await update(ref(db), updates);

            const roomRef = ref(db, `stanze/${roomCode}`);
            const snapshot = await get(roomRef);

            if (snapshot.exists()) {
                const room = hydrateRoom(snapshot.val());
                if (room.statoPartita === "IN_GIOCO" && room.statoTurno === "WAITING_CARDS") {
                    const activePlayers = Object.keys(room.giocatori || {}).filter(name => name !== room.dominus).length;
                    const playedCount = Object.keys(room.carteGiocate || {}).length;
                    if (activePlayers > 0 && playedCount >= activePlayers) {
                        await update(roomRef, { statoTurno: "DOMINUS_CHOOSING" });
                    }
                }
            }
        } catch (e) { console.error("Kick Player Error:", e); }
    };

    const createRoom = async (extraData = {}) => {
        const currentName = user?.name;
        const currentUsername = user?.username;
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
                allowedPackages: extraData.allowedPackages || { base: true, dark: false },
                roomLanguage: extraData.roomLanguage || GameDataService.language || 'it',
                cartaNera: null,
                carteGiocate: {},
                punti: { [currentName]: 0 },
                turnoCorrente: 0,
                statoTurno: "LOBBY",
                vincitoreTurno: null,
                puntiPerVincere: 7,
                giocatori: {
                    [currentName]: {
                        carte: [],
                        jokers: 3,
                        avatar: initialAvatar,
                        color: pickColor(new Set()),
                        online: true,
                        lastSeen: Date.now(),
                        activeFrame: extraData.activeFrame || 'basic',
                        rank: extraData.rank || 'Anima Candida'
                    }
                },
                statoPartita: "LOBBY",
                timestamp: Date.now()
            }));

            await setPresence(code, currentName);
            setRoomCode(code);
            setRoomPlayerName(currentName);
            subscribeToRoom(code);
            return code;
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = async (codeInput, extraData = {}) => {
        const currentName = user?.name;
        if (!currentName) throw new Error("Login necessario");
        const code = codeInput.trim().toUpperCase();
        setLoading(true);

        try {
            const roomRef = ref(db, `stanze/${code}`);
            const snapshot = await get(roomRef);
            if (!snapshot.exists()) throw new Error("Stanza non trovata");

            const data = snapshot.val();
            const existingPlayer = data.giocatori?.[currentName];
            const avatarToUse = extraData.avatar || user?.avatar || 'RANDOM';
            const usedColors = new Set(Object.values(data.giocatori || {}).map(p => p.color));

            if (existingPlayer) {
                await update(ref(db, `stanze/${code}/giocatori/${currentName}`), {
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
                        carte: hand, jokers: 3, avatar: avatarToUse, color: pickColor(usedColors),
                        online: true, lastSeen: Date.now(), joinedAt: Date.now(), hasDiscarded: false,
                        activeFrame: extraData.activeFrame || 'basic', rank: extraData.rank || 'Anima Candida'
                    };
                    room.punti = room.punti || {};
                    if (room.punti[currentName] === undefined) room.punti[currentName] = 0;
                    return dehydrateRoom(room);
                });
            } else {
                await set(ref(db, `stanze/${code}/giocatori/${currentName}`), {
                    carte: [], jokers: 3, avatar: avatarToUse, color: pickColor(usedColors),
                    online: true, lastSeen: Date.now(), joinedAt: Date.now(), hasDiscarded: false,
                    activeFrame: extraData.activeFrame || 'basic', rank: extraData.rank || 'Anima Candida'
                });
                await set(ref(db, `stanze/${code}/punti/${currentName}`), 0);
            }

            await setPresence(code, currentName);
            setRoomCode(code);
            setRoomPlayerName(currentName);
            subscribeToRoom(code);
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
            try {
                const playerRef = ref(db, `stanze/${roomCode}/giocatori/${user.name}`);
                await onDisconnect(playerRef).cancel();
                await update(playerRef, { online: false, lastSeen: Date.now() });
            } catch (e) { console.warn(e); }
            if (roomUnsubscribe.current) roomUnsubscribe.current();
            setRoomCode(null);
            setRoomData(null);
        }
    };

    // Auto-Eject if kicked
    useEffect(() => {
        if (roomCode && roomData && user && !loading) {
            if (roomData.giocatori && !roomData.giocatori[user.name]) { leaveRoom(); }
        }
    }, [roomData, user, roomCode, loading]);

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
                if (!room.giocatori || !room.giocatori[user.name]) return dehydrateRoom(room);
                room.carteGiocate = room.carteGiocate || {};
                room.carteGiocate[user.name] = selectedCards;
                const currentHand = room.giocatori[user.name].carte || [];
                room.giocatori[user.name].carte = currentHand.filter(c => {
                    const cardText = typeof c === 'string' ? c : c?.testo;
                    return !selectedCards.some(sc => (typeof sc === 'string' ? sc : sc?.testo) === cardText);
                });
                const activePlayers = Object.entries(room.giocatori).filter(([name]) => name !== room.dominus).length;
                const playedCount = Object.keys(room.carteGiocate || {}).length;
                if (playedCount >= activePlayers && activePlayers > 0) { room.statoTurno = "DOMINUS_CHOOSING"; }
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
                const newScore = (room.punti[winnerName] || 0) + 1;
                room.punti[winnerName] = newScore;
                room.vincitoreTurno = winnerName;
                if (newScore >= (room.puntiPerVincere || 7)) {
                    room.statoPartita = "GAME_OVER";
                    room.vincitorePartita = winnerName;
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
                const player = room.giocatori[user.name];
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
                const player = room.giocatori[user.name];
                if (!player || (player.jokers || 0) <= 0) return dehydrateRoom(room);

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

                // 2. Try best answers ONLY [STRICT MODE]
                if (blackCard && blackCard.bestAnswers && blackCard.bestAnswers.length > 0) {
                    const availableBestAnswers = blackCard.bestAnswers.filter(ans => !excludedCards.has(ans.trim()));
                    if (availableBestAnswers.length > 0) {
                        newCard = availableBestAnswers[Math.floor(Math.random() * availableBestAnswers.length)];
                        // Remove from deck if it was there
                        if (room.whiteDeck) {
                            room.whiteDeck = room.whiteDeck.filter(c => {
                                const text = typeof c === 'string' ? c : c?.testo;
                                return text?.trim() !== newCard?.trim();
                            });
                        }
                    }
                }

                // 3. Apply changes ONLY if a best answer was found
                if (newCard) {
                    // Remove the first card (shifting) only on success
                    if (player.carte && player.carte.length > 0) player.carte.shift();

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
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom);
                const player = room.giocatori[user.name];
                if (!player) return dehydrateRoom(room);
                if (!room.whiteDeck) room.whiteDeck = [];
                if (player.carte && player.carte.length > 0) room.whiteDeck.push(...player.carte);
                room.whiteDeck = shuffleArray(room.whiteDeck);
                player.carte = [];
                while (player.carte.length < 10 && room.whiteDeck.length > 0) player.carte.push(room.whiteDeck.pop());
                return dehydrateRoom(room);
            });
        } catch (e) { console.error("Bribe error", e); }
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
        login, createRoom, joinRoom, leaveRoom,
        kickPlayer,
        updateRoomSettings,
        startGame, playCards, confirmDominusSelection, nextRound, discardCard, useAIJoker, forceReveal, bribeHand,
        isCreator, isDominus, myHand, roomPlayerName
    }), [
        user, roomCode, roomData, loading, error, availableRooms,
        isCreator, isDominus, myHand, roomPlayerName
    ]);

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};