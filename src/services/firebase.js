import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
    initializeAuth,
    getReactNativePersistence,
    getAuth,
    inMemoryPersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// [CRITICAL] Il motore a vapore è necessario: Forza la registrazione dei componenti
// Questo risolve l'errore "Component auth has not been registered yet"
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
    apiKey: "AIzaSyBuHQR3RmMdgcNvy3GxOzT_koHcN39dfpU",
    authDomain: "carte-vs-umani.firebaseapp.com",
    databaseURL: "https://carte-vs-umani-default-rtdb.firebaseio.com",
    projectId: "carte-vs-umani",
    storageBucket: "carte-vs-umani.firebasestorage.app",
    messagingSenderId: "1041474968600",
    appId: "1:1041474968600:web:466bd4b116fa93d778376d"
};

// 1. Singleton App (Modular)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Auth Singleton (Modular)
// Usiamo AsyncStorage per la persistenza reale della sessione
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (e) {
    auth = getAuth(app);
}

// 3. Database Singleton (Modular)
const db = getDatabase(app);

export { app, auth, db };
