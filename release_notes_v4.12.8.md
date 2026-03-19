# Changelog v4.12.8

## 🏆 Leaderboard & Social Revamp
- **Nuova Classifica Globale**:
    - Introdotto un **Footer Sticky per il proprio Rank**: Ora puoi vedere la tua posizione in tempo reale anche mentre scorri la classifica dei top 50.
    - **Colorazione per Grado**: Il podio è ora evidenziato con colori dedicati (#1 Oro, #2 Argento, #3 Bronzo).
    - **Skeleton Loading**: Aggiunti caricamenti animati professionali per la transizione dei dati.
    - **Sistema di Report**: Integrata la possibilità di segnalare giocatori direttamente dalla classifica con una nuova interfaccia dedicata.
- **Gestione Amici**:
    - Aggiunta la protezione per impedire l'auto-invio di richieste di amicizia.
    - Layout delle righe ottimizzato con badge "TU" per identificarsi facilmente nelle liste.

## 🎨 UI & UX Optimizations
- **Adattamento Desktop (Vetrina & Gioco)**:
    - Centramento e responsive design per schermi PC nella schermata di Vittoria e nel sito ufficiale.
    - Ottimizzazione degli avatar e dei badge di rango per display più grandi.
- **Correzione Font**: Normalizzati i nomi dei font (`CinzelBold`, `OutfitBold`) per eliminare i crash nativi su Android e garantire la coerenza tra Web e Mobile.
- **Centramento Globale**: Revisione di testi, info-pill e pulsanti in tutte le schermate principali per un allineamento perfetto.

## 🔥 Temi & Effetti Grafici
- **Pulsar Theme**: Corretto il mapping delle onde e aumentato l'intervallo a **6s** per evitare sovrapposizioni.
- **Matrix Theme**: Intervallo del codice rain portato a **4s** per una resa più cinematografica.
- **Manicomio Theme**: Ripristinato l'effetto "graffi" (scratches) che non veniva renderizzato correttamente.
- **Zero Delay**: Rimosso il ritardo iniziale di 2 secondi; gli effetti partono all'istante al cambio tema.
- **Lobby Particles**: Gli effetti particellari del tema attivo sono ora visibili anche nella lobby pre-partita.
- **Web Responsiveness**: Integrazione di `useWindowDimensions` per il ridimensionamento dinamico degli sfondi su browser.

## ⚙️ Versione & Deployment
- **Aggiornamento Versione**: Portata alla **v4.12.8** (Android Build **60**).
- **SEO Landing Page**: Aggiunti tag `og:site_name` e `apple-mobile-web-app-title` per mostrare correttamente il nome "Cards of Moral Decay" su Google.
- **Immagini Locali**: Screenshot caricati direttamente nel progetto (`assets/images/gallery/`) per eliminare la dipendenza da GitHub.
- **Deployment**: Nuova build ufficiale pubblicata su Firebase Hosting e APK Android generato.
