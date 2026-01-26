import React, { createContext, useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Alert, Platform } from 'react-native'; // Alert kept for fatal errors if absolutely needed, but avoiding user facing ones
import { db } from '../services/firebase';
import { ref, set, get, update, onValue, runTransaction, onDisconnect, child } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLAYER_AVATARS, PLAYER_COLORS, shuffleArray, pickColor } from '../utils/data';
import SoundService from '../services/SoundService';
import GameDataService from '../services/GameDataService';
import { useAuth } from './AuthContext';

// Context
const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const { loading: authLoading } = useAuth();

    // --- STATE ---
    console.log("GameProvider initializing...");
    const [user, setUser] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [avatar, setAvatar] = useState('RANDOM');
    const [roomCode, setRoomCode] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const roomUnsubscribe = useRef(null);
    const allRoomsUnsubscribe = useRef(null);

    // [NEW] Initialize Game Data (Waiting for Auth)
    useEffect(() => {
        if (!authLoading) {
            GameDataService.initialize();
        }
    }, [authLoading]);

    // Load User
    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedName = await AsyncStorage.getItem('cah_playerName');
                const savedAvatar = await AsyncStorage.getItem('cah_avatar');

                // If saved avatar exists, use it. Otherwise, generate a random one for this session.
                const initialAvatar = savedAvatar || PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];

                // If savedName exists, we restore it. Avatar is either restored or random default.
                if (savedName) {
                    setUser({ name: savedName, avatar: initialAvatar }); // Ensure local user state has it
                    setPlayerName(savedName);
                }

                // Always set the avatar state so the UI (carousel) knows what to select/show
                setAvatar(initialAvatar);

            } catch (e) { console.log('Error loading user', e); }
        };
        loadUser();
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

        // 1. Black Card
        if (typeof newRoom.cartaNera === 'number') {
            newRoom.cartaNera = GameDataService.getBlackCardByIndex(newRoom.cartaNera);
        }

        // 2. Decks (Optional, mostly for internal state if needed)
        if (newRoom.blackDeck && Array.isArray(newRoom.blackDeck)) {
            newRoom.blackDeck = newRoom.blackDeck.map(item =>
                typeof item === 'number' ? GameDataService.getBlackCardByIndex(item) : item
            );
        }
        if (newRoom.whiteDeck && Array.isArray(newRoom.whiteDeck)) {
            newRoom.whiteDeck = newRoom.whiteDeck.map(item =>
                typeof item === 'number' ? GameDataService.getWhiteCardByIndex(item) : item
            );
        }

        // 3. Players Hands
        if (newRoom.giocatori) {
            Object.keys(newRoom.giocatori).forEach(pName => {
                if (newRoom.giocatori[pName].carte && Array.isArray(newRoom.giocatori[pName].carte)) {
                    newRoom.giocatori[pName].carte = newRoom.giocatori[pName].carte.map(item =>
                        typeof item === 'number' ? GameDataService.getWhiteCardByIndex(item) : item
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
                        typeof item === 'number' ? GameDataService.getWhiteCardByIndex(item) : item
                    );
                } else if (typeof val === 'number') {
                    newRoom.carteGiocate[pName] = GameDataService.getWhiteCardByIndex(val);
                }
            });
        }

        return newRoom;
    };

    const dehydrateRoom = (room) => {
        if (!room) return room;
        const newRoom = { ...room };

        // 1. Black Card
        if (newRoom.cartaNera && typeof newRoom.cartaNera === 'object') {
            newRoom.cartaNera = GameDataService.getBlackCardIndex(newRoom.cartaNera);
        }

        // 2. Decks
        if (newRoom.blackDeck && Array.isArray(newRoom.blackDeck)) {
            newRoom.blackDeck = newRoom.blackDeck.map(item =>
                typeof item === 'object' ? GameDataService.getBlackCardIndex(item) : item
            );
        }
        if (newRoom.whiteDeck && Array.isArray(newRoom.whiteDeck)) {
            newRoom.whiteDeck = newRoom.whiteDeck.map(item =>
                typeof item === 'string' ? GameDataService.getWhiteCardIndex(item) : item
            );
        }

        // 3. Players Hands
        if (newRoom.giocatori) {
            Object.keys(newRoom.giocatori).forEach(pName => {
                if (newRoom.giocatori[pName].carte && Array.isArray(newRoom.giocatori[pName].carte)) {
                    newRoom.giocatori[pName].carte = newRoom.giocatori[pName].carte.map(item =>
                        typeof item === 'string' ? GameDataService.getWhiteCardIndex(item) : item
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
                        typeof item === 'string' ? GameDataService.getWhiteCardIndex(item) : item
                    );
                } else if (typeof val === 'string') {
                    newRoom.carteGiocate[pName] = GameDataService.getWhiteCardIndex(val);
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
        if (!name) throw new Error("Name required");
        await AsyncStorage.setItem('cah_playerName', name);
        if (avatar) await AsyncStorage.setItem('cah_avatar', avatar);
        setUser({ name, avatar: avatar || 'RANDOM' });
    };

    // DEFINED EARLY TO AVOID REFERENCE ERRORS
    const kickPlayer = async (targetName) => {
        // Safe check for creator status using current state logic
        const isCreatorCheck = user && roomData && roomData.creatore === user.name;
        if (!roomCode || !isCreatorCheck || !targetName) return;

        try {
            // Use atomic updates for guaranteed deletion
            const updates = {};
            updates[`stanze/${roomCode}/giocatori/${targetName}`] = null;
            updates[`stanze/${roomCode}/punti/${targetName}`] = null;
            updates[`stanze/${roomCode}/carteGiocate/${targetName}`] = null;
            updates[`stanze/${roomCode}/connessi/${targetName}`] = null; // Also clear presence if any

            await update(ref(db), updates);

            // Fetch fresh state to check if we need to advance the game
            const roomRef = ref(db, `stanze/${roomCode}`);
            const snapshot = await get(roomRef);

            if (snapshot.exists()) {
                const room = hydrateRoom(snapshot.val()); // [HYDRATE]

                // Check flow: if IN_GIOCO and waiting cards, check if all remaining players played
                if (room.statoPartita === "IN_GIOCO" && room.statoTurno === "WAITING_CARDS") {
                    const activePlayers = Object.keys(room.giocatori || {}).filter(name =>
                        name !== room.dominus
                    ).length;
                    const playedCount = Object.keys(room.carteGiocate || {}).length;

                    // If everyone remaining has played (and there are players left), advance
                    if (activePlayers > 0 && playedCount >= activePlayers) {
                        await update(roomRef, { statoTurno: "DOMINUS_CHOOSING" });
                    }
                }
            }
        } catch (e) {
            console.error("Kick Player Error:", e);
            // Alert.alert("Errore", "Impossibile rimuovere il giocatore. Riprova.");
        }
    };

    const createRoom = async (extraData = {}) => {
        // [FIX] Use local state names/avatars to avoid "user" state lag
        const currentName = playerName || user?.name;
        const currentAvatar = avatar !== 'RANDOM' ? avatar : user?.avatar;

        if (!currentName) throw new Error("User not logged in or name missing");
        setLoading(true);
        try {
            const code = generateRoomCode();
            const initialAvatar = extraData.avatar || (currentAvatar === 'RANDOM' || !currentAvatar
                ? PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)]
                : currentAvatar);

            await set(ref(db, `stanze/${code}`), dehydrateRoom({ // [DEHYDRATE]
                creatore: currentName,
                dominus: currentName,
                dominusIndex: 0,
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
        // [FIX] Use local state names/avatars to avoid "user" state lag
        const currentName = playerName || user?.name;
        const currentAvatar = avatar !== 'RANDOM' ? avatar : user?.avatar;

        if (!currentName) throw new Error("User not logged in or name missing");
        if (!codeInput) throw new Error("Room code required");
        const code = codeInput.trim().toUpperCase();
        if (!code) throw new Error("Room code required");
        setLoading(true);

        try {
            const roomRef = ref(db, `stanze/${code}`);
            const snapshot = await get(roomRef);

            if (!snapshot.exists()) throw new Error("Room not found");

            const rData = snapshot.val();
            const existingPlayer = rData.giocatori?.[currentName];

            if (existingPlayer) {
                const avatarToUse = (currentAvatar && currentAvatar !== 'RANDOM') ? currentAvatar : existingPlayer.avatar;
                await update(ref(db, `stanze/${code}/giocatori/${currentName}`), {
                    online: true,
                    lastSeen: Date.now(),
                    avatar: avatarToUse,
                    // activeCardSkin removed
                    activeFrame: extraData.activeFrame || existingPlayer.activeFrame || 'basic', // [NEW] Sync Frame
                    rank: extraData.rank || existingPlayer.rank || 'Anima Candida'
                });
            } else {
                // Determine Avatar & Color
                const usedColors = new Set(Object.values(rData.giocatori || {}).map(g => g.color));
                const initialAvatar = extraData.avatar || (currentAvatar === 'RANDOM' || !currentAvatar
                    ? PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)]
                    : currentAvatar);

                if (rData.statoPartita === "IN_GIOCO") {
                    await runTransaction(ref(db, `stanze/${code}`), (rawRoom) => {
                        if (!rawRoom) return rawRoom;
                        const room = hydrateRoom(rawRoom); // [HYDRATE]

                        if (!room.whiteDeck) room.whiteDeck = shuffleArray([...GameDataService.getCarteBianche()]);

                        const hand = [];
                        for (let i = 0; i < 10; i++) {
                            if (room.whiteDeck.length > 0) hand.push(room.whiteDeck.pop());
                        }

                        room.giocatori = room.giocatori || {};
                        room.giocatori[currentName] = {
                            carte: hand,
                            jokers: 3,
                            avatar: initialAvatar,
                            color: pickColor(usedColors),
                            online: true,
                            lastSeen: Date.now(),
                            joinedAt: Date.now(),
                            hasDiscarded: false,
                            // activeCardSkin removed
                            activeFrame: extraData.activeFrame || 'basic', // [NEW] Sync Frame
                            rank: extraData.rank || 'Anima Candida'
                        };
                        room.punti = room.punti || {};
                        room.punti[currentName] = 0;
                        return dehydrateRoom(room); // [DEHYDRATE]
                    });
                } else {
                    await set(ref(db, `stanze/${code}/giocatori/${currentName}`), {
                        carte: [],
                        jokers: 3,
                        avatar: initialAvatar,
                        color: pickColor(usedColors),
                        online: true,
                        lastSeen: Date.now(),
                        joinedAt: Date.now(),
                        hasDiscarded: false,
                        // activeCardSkin removed
                        activeFrame: extraData.activeFrame || 'basic', // [NEW] Sync Frame
                        rank: extraData.rank || 'Anima Candida'
                    });
                    await set(ref(db, `stanze/${code}/punti/${currentName}`), 0);
                }
            }

            await setPresence(code, currentName);
            setRoomCode(code);
            subscribeToRoom(code);
            return code;
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // [NEW] Auto-Eject if kicked
    useEffect(() => {
        if (roomCode && roomData && user && !loading) {
            // If room exists but I am not in it -> Kicked
            if (roomData.giocatori && !roomData.giocatori[user.name]) {
                // Removed ugly alert. Just leave.
                // alert("Sei stato rimosso dalla stanza.");
                leaveRoom();
            }
        }
    }, [roomData, user, roomCode, loading]);

    const leaveRoom = async () => {
        if (roomCode && user) {
            try {
                const playerRef = ref(db, `stanze/${roomCode}/giocatori/${user.name}`);

                // [FIX] Cancel onDisconnect to prevent zombie resurrection
                await onDisconnect(playerRef).cancel();

                // Mark as offline (optional, since we are likely being kicked or leaving)
                // But if we are just leaving voluntarily:
                await update(playerRef, {
                    online: false, lastSeen: Date.now()
                });
            } catch (e) { console.warn(e); }

            if (roomUnsubscribe.current) roomUnsubscribe.current();
            setRoomCode(null);
            setRoomData(null);
        }
    };

    const startGame = async (targetPoints = 7) => {
        console.log("GameContext: startGame called", { roomCode, hasRoomData: !!roomData });
        if (!roomCode || !roomData) {
            console.warn("GameContext: Missing roomCode or roomData");
            return;
        }
        try {
            console.log("GameContext: Running Transaction 1 (Setup)...");
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                room.statoPartita = "IN_GIOCO";
                room.statoTurno = "WAITING_CARDS";
                room.puntiPerVincere = targetPoints;
                room.vincitorePartita = null;
                room.vincitoreTurno = null;

                // Reset points
                if (room.punti) {
                    Object.keys(room.punti).forEach(k => {
                        room.punti[k] = 0;
                    });
                }
                return dehydrateRoom(room); // [DEHYDRATE]
            });
            console.log("GameContext: Transaction 1 Complete. Dealing Cards...");
            await dealInitialCards();
            console.log("GameContext: dealInitialCards Complete.");
        } catch (e) {
            console.error("GameContext Error:", e);
            // Alert.alert("Errore Start", e.message);
        }
    };

    const dealInitialCards = async () => {
        console.log("GameContext: dealInitialCards called");
        const rRef = ref(db, `stanze/${roomCode}`);
        await runTransaction(rRef, (rawRoom) => {
            if (!rawRoom) return rawRoom;
            const room = hydrateRoom(rawRoom); // [HYDRATE]
            room.blackDeck = shuffleArray([...GameDataService.getCarteNere()]);
            room.whiteDeck = shuffleArray([...GameDataService.getCarteBianche()]);

            Object.keys(room.giocatori || {}).forEach(pName => {
                const hand = [];
                for (let i = 0; i < 10; i++) {
                    if (room.whiteDeck.length) hand.push(room.whiteDeck.pop());
                }
                room.giocatori[pName].carte = hand;
            });

            room.cartaNera = room.blackDeck.pop();
            room.statoTurno = "WAITING_CARDS";
            room.statoPartita = "IN_GIOCO";
            return dehydrateRoom(room); // [DEHYDRATE]
        });
    };

    const playCards = async (selectedCards) => {
        if (!roomCode || !user) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                if (!room.giocatori || !room.giocatori[user.name]) return dehydrateRoom(room);

                room.carteGiocate = room.carteGiocate || {};
                room.carteGiocate[user.name] = selectedCards;

                const currentHand = room.giocatori[user.name].carte || [];
                room.giocatori[user.name].carte = currentHand.filter(c => {
                    // [FIX] Robust comparison for objects/strings
                    const cardText = typeof c === 'string' ? c : c?.testo;
                    return !selectedCards.some(sc => (typeof sc === 'string' ? sc : sc?.testo) === cardText);
                });

                const activePlayers = Object.entries(room.giocatori).filter(([name, p]) =>
                    name !== room.dominus
                ).length;
                const playedCount = Object.keys(room.carteGiocate || {}).length;

                if (playedCount >= activePlayers && activePlayers > 0) {
                    room.statoTurno = "DOMINUS_CHOOSING";
                }
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error(e); }
    };

    const confirmDominusSelection = async (winnerName) => {
        if (!roomCode) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                const newScore = (room.punti[winnerName] || 0) + 1;
                room.punti[winnerName] = newScore;
                room.vincitoreTurno = winnerName;
                if (newScore >= (room.puntiPerVincere || 7)) {
                    room.statoPartita = "GAME_OVER";
                    room.vincitorePartita = winnerName;
                }
                room.statoTurno = "SHOWING_WINNER";
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error(e); }
    };

    const nextRound = async () => {
        if (!roomCode) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                if (!room.blackDeck || room.blackDeck.length === 0) room.blackDeck = shuffleArray([...GameDataService.getCarteNere()]);

                // [FIX] Refill White Deck preventing duplicates
                if (!room.whiteDeck || room.whiteDeck.length < 10) {
                    const cardsInHand = new Set();
                    Object.values(room.giocatori || {}).forEach(p => {
                        (p.carte || []).forEach(c => {
                            const text = typeof c === 'string' ? c : c?.testo;
                            if (text) cardsInHand.add(text);
                        });
                    });

                    const availableCards = GameDataService.getCarteBianche().filter(c => !cardsInHand.has(c));
                    const newBatch = shuffleArray(availableCards);

                    room.whiteDeck = [...(room.whiteDeck || []), ...newBatch];
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
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error(e); }
    };

    const discardCard = async (cardText) => {
        if (!roomCode || !user) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                const player = room.giocatori[user.name];
                if (!player || player.hasDiscarded) return dehydrateRoom(room);

                const index = (player.carte || []).findIndex(c => {
                    const text = typeof c === 'string' ? c : c?.testo;
                    return (text || '').trim() === (cardText || '').trim();
                });
                if (index > -1) {
                    player.carte.splice(index, 1);
                    player.hasDiscarded = true;
                }
                if (!room.whiteDeck || room.whiteDeck.length === 0) {
                    // [FIX] Refill White Deck if empty (preventing duplicates)
                    const cardsInHand = new Set();
                    Object.values(room.giocatori || {}).forEach(p => {
                        (p.carte || []).forEach(c => {
                            const text = typeof c === 'string' ? c : c?.testo;
                            if (text) cardsInHand.add(text);
                        });
                    });

                    const availableCards = GameDataService.getCarteBianche().filter(c => !cardsInHand.has(c));
                    const newBatch = shuffleArray(availableCards);

                    room.whiteDeck = [...(room.whiteDeck || []), ...newBatch];
                }

                while ((player.carte || []).length < 10 && room.whiteDeck && room.whiteDeck.length > 0) {
                    if (!player.carte) player.carte = [];
                    player.carte.push(room.whiteDeck.pop());
                }
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error(e); subscribeToRoom(roomCode); }
    };

    const useAIJoker = async () => {
        if (!roomCode || !user || !roomData) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                const player = room.giocatori[user.name];
                if (!player || (player.jokers || 0) <= 0) return dehydrateRoom(room);

                if (player.carte && player.carte.length > 0) player.carte.shift();

                const blackCard = room.cartaNera;
                if (blackCard && blackCard.bestAnswers && blackCard.bestAnswers.length > 0) {
                    // [FIX] Ensure Joker doesn't create duplicate
                    const cardsInHand = new Set();
                    Object.values(room.giocatori || {}).forEach(p => {
                        (p.carte || []).forEach(c => {
                            const text = typeof c === 'string' ? c : c?.testo;
                            if (text) cardsInHand.add(text);
                        });
                    });

                    // filter best answers that are NOT in anyone's hand
                    const availableBestAnswers = blackCard.bestAnswers.filter(ans => !cardsInHand.has(ans));

                    let newCard;
                    if (availableBestAnswers.length > 0) {
                        newCard = availableBestAnswers[Math.floor(Math.random() * availableBestAnswers.length)];

                        // Remove from deck if exists to prevent future duplicate
                        if (room.whiteDeck) {
                            room.whiteDeck = room.whiteDeck.filter(c => {
                                const text = typeof c === 'string' ? c : c?.testo;
                                return text !== newCard;
                            });
                        }
                    }
                    if (!newCard && (!room.whiteDeck || room.whiteDeck.length === 0)) {
                        // [FIX] Emergency: Deck is empty and Best Answers taken. Find ANY valid card in DB.
                        const anyAvailable = GameDataService.getCarteBianche().filter(c => !cardsInHand.has(c));
                        if (anyAvailable.length > 0) {
                            newCard = anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
                        }
                    } else if (!newCard && room.whiteDeck && room.whiteDeck.length > 0) {
                        // Fallback: draw from deck if all best answers are taken
                        newCard = room.whiteDeck.pop();
                    }

                    if (newCard) {
                        player.carte.push(newCard);
                        player.jokers = (player.jokers || 0) - 1;
                    }
                } else {
                    // Black card has no best answers defined? Just pick random valid.
                    let fallbackCard;
                    if (room.whiteDeck && room.whiteDeck.length > 0) {
                        fallbackCard = room.whiteDeck.pop();
                    } else {
                        const cardsInHand = new Set();
                        Object.values(room.giocatori || {}).forEach(p => {
                            (p.carte || []).forEach(c => {
                                const text = typeof c === 'string' ? c : c?.testo;
                                if (text) cardsInHand.add(text);
                            });
                        });
                        const anyAvailable = GameDataService.getCarteBianche().filter(c => !cardsInHand.has(c));
                        if (anyAvailable.length > 0) {
                            fallbackCard = anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
                        }
                    }

                    if (fallbackCard) {
                        player.carte.push(fallbackCard);
                        player.jokers = (player.jokers || 0) - 1;
                    }
                }

                while ((player.carte || []).length < 10 && room.whiteDeck && room.whiteDeck.length > 0) {
                    if (!player.carte) player.carte = [];
                    player.carte.push(room.whiteDeck.pop());
                }
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error(e); }
    };

    const forceReveal = async () => {
        if (!roomCode) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                room.statoTurno = "DOMINUS_CHOOSING";
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error(e); }
    };

    const bribeHand = async () => {
        if (!roomCode || !user) return;
        try {
            await runTransaction(ref(db, `stanze/${roomCode}`), (rawRoom) => {
                if (!rawRoom) return rawRoom;
                const room = hydrateRoom(rawRoom); // [HYDRATE]
                const player = room.giocatori[user.name];
                if (!player) return dehydrateRoom(room);

                // Return current hand to deck and shuffle
                if (!room.whiteDeck) room.whiteDeck = [];
                if (player.carte && player.carte.length > 0) {
                    room.whiteDeck.push(...player.carte);
                }
                room.whiteDeck = shuffleArray(room.whiteDeck);

                // Draw new cards
                player.carte = [];
                while (player.carte.length < 10 && room.whiteDeck.length > 0) {
                    player.carte.push(room.whiteDeck.pop());
                }
                return dehydrateRoom(room); // [DEHYDRATE]
            });
        } catch (e) { console.error("Bribe error", e); }
    };

    const isCreator = useMemo(() => !!(user && roomData && roomData.creatore === user.name), [user, roomData?.creatore]);
    const isDominus = useMemo(() => !!(user && roomData && roomData.dominus === user.name), [user, roomData?.dominus]);
    const myHand = useMemo(() => (user && roomData && roomData.giocatori?.[user.name]?.carte) ? roomData.giocatori[user.name].carte : [], [user, roomData?.giocatori]);

    const contextValue = useMemo(() => ({
        user, roomCode, roomData, loading, error, availableRooms,
        playerName, setPlayerName, avatar, setAvatar, refreshRooms,
        login, createRoom, joinRoom, leaveRoom,
        kickPlayer,
        startGame, playCards, confirmDominusSelection, nextRound, discardCard, useAIJoker, forceReveal, bribeHand,
        isCreator, isDominus, myHand
    }), [
        user, roomCode, roomData, loading, error, availableRooms,
        playerName, avatar, isCreator, isDominus, myHand
    ]);

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};