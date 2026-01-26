# Cards of Moral Decay - React Native App

## Setup

1. **Impostare l'ambiente**: Assicurati di avere Node.js installato.
2. **Dipendenze**:
    Apri un terminale nella cartella `native_app`:

    ```bash
    cd native_app
    npm install
    ```

    *Nota: Se non hai `npx` o `expo-cli` installato globalmente, potresti doverlo installare.*

3. **Avvio**:

    ```bash
    npm start
    ```

    Questo avvierà Metro Bundler.
    - Premi `a` per Android (se hai un emulatore o dispositivo collegato).
    - Premi `w` per Web (se vuoi testare nel browser velocemente).
    - Usa l'app **Expo Go** sul tuo telefono per scansionare il QR code.

## Struttura del Progetto

- `App.js`: Punto di ingresso. Gestisce la navigazione condizionale (Lobby vs Gioco).
- `src/context/GameContext.js`: Contiene tutta la logica di gioco e la connessione a Firebase.
- `src/screens/`:
  - `LobbyScreen.js`: Schermata iniziale per inserire nome e creare/unirsi alle stanze.
  - `GameScreen.js`: Schermata di gioco principale (Table, Hand, Black Card).
- `src/components/Card.js`: Componente riutilizzabile per le carte.
- `src/styles/theme.js`: Colori e font centralizzati.
- `src/utils/data.js`: Dati di gioco (Carte) migrati dal progetto web.

## Note sulla Migrazione

- Le animazioni complesse (confetti, carte volanti) NON sono state portate 1:1 in quanto richiedono librerie specifiche React Native (es. `react-native-reanimated`). Il gioco è comunque funzionale.
- L'autenticazione è anonima/basata sul dispositivo (AsyncStorage), come nella web app.
- La configurazione Firebase è la stessa della web app.
