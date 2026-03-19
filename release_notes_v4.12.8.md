# Changelog v4.12.8

## 🎨 UI & UX Enhancements
- **Leaderboard Overhaul**:
    - Added a **Sticky Rank Footer** in the Friends screen, allowing players to see their position at all times.
    - Implemented **Skeleton Loading** states for a smoother user experience during data fetching.
    - Optimized the `LeaderboardSection` component with improved list animations and responsive layouts.
- **Victory Screen (PC Adaptation)**:
    - Centered the main content for desktop users to avoid stretching on wide screens.
    - Optimized avatar scaling and layout for the Winner and Shame Award sections.
    - Refined typography and spacing for better readability on larger displays.
- **Text Centering & Layout**:
    - Performed a global audit and fix for text centering across multiple screens (Game, Victory, Settings, Bank).
    - Improved the alignment of info pills and status notifications in the game lobby.

## 🔤 Core Infrastructure & Fonts
- **Font Normalization**: Standardized font naming conventions (e.g., `Cinzel-Bold` -> `CinzelBold`) project-wide to resolve native Android crashes (`NoSuchMethodError`) and ensure cross-platform compatibility.
- **Animated Components**: Refined Reanimated worklets and layout transitions to prevent "Worklet" warnings on the web.

## 🔥 Theme & Visual Effects
- **Pulsar Theme**: Fixed the component mapping to use `PulsarRipple` correctly. Increased the interval to **6000ms** to avoid ripple overlap.
- **Matrix Theme**: Adjusted the code rain interval to **4000ms**.
- **Manicomio Theme**: Restored the "scratches" effect by fixing the conditional rendering logic in `ThemeBackground.js`.
- **Interval Optimization**: Eliminated the initial 2-second delay for interval-based themes.
- **Lobby Visibility**: Enabled theme particle effects in the game lobby.
- **Web Responsiveness**: Implemented `useWindowDimensions` in `ThemeBackground.js` for perfect scaling on browser resize.

## 🔍 SEO & Branding (Landing Page)
- **Metadata Fix**: Added `og:site_name` and `apple-mobile-web-app-title` meta tags to ensure the correct name ("Cards of Moral Decay") appears in search engines.
- **Authority**: Set the `canonical` URL to the official domain `https://carte-vs-umani.web.app/`.
- **Assets Localization**: Localized 7 gameplay screenshots into `assets/images/gallery/`, removing external GitHub dependencies.

## ⚙️ Versioning & Deployment
- **Version Bump**: Updated to **v4.12.8** (Android Build **60**).
- **Web**: Deployed the latest build to Firebase Hosting.
- **Android**: Generated a fresh local Release APK via `gradlew`.
- **Translations**: Added 20+ new keys for leaderboard, position tracking, and reporting features.
