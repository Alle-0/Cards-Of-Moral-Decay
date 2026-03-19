# Changelog v4.12.8

## 🎨 Theme & UI Optimizations
- **Pulsar Theme**: Fixed the component mapping to use `PulsarRipple` correctly. Increased the interval to **6000ms** to avoid ripple overlap and create a more polished visual effect.
- **Matrix Theme**: Adjusted the code rain interval to **4000ms** to improve readability and visual pacing.
- **Manicomio Theme**: Restored the "scratches" effect by fixing the conditional rendering logic in `ThemeBackground.js`.
- **Interval Fix**: Eliminated the initial 2-second delay for interval-based themes. Effects now appear immediately upon theme selection.
- **Lobby Particles**: Enabled theme particle effects in the game lobby (previously restricted to active game states).
- **Web Responsiveness**: Refactored `ThemeBackground.js` using `useWindowDimensions` to ensure animations and particles scale correctly during browser window resizing.

## 🔍 SEO & Branding (Landing Page)
- **Site Name Fix**: Added `og:site_name` and `apple-mobile-web-app-title` meta tags to `index.html` to ensure "Cards of Moral Decay" appears correctly in Google search results instead of generic hosting documentation.
- **Domain Authority**: Set the `canonical` URL and all social graph (Open Graph) links to the official domain `https://carte-vs-umani.web.app/`.
- **Assets Localization**: Imported 7 gameplay screenshots to the local project folder (`assets/images/gallery/`) and updated the gallery to use these relative paths. This removes the dependency on external GitHub attachments.

## ⚙️ Versioning & Deployment
- **Version Bump**: Updated project version to **4.12.8** and Android `versionCode` to **60**.
- **Synched Files**: Updated `package.json`, `app.json`, `android/app/build.gradle`, `src/constants/Config.js`, and `src/services/GameDataService.js`.
- **Deploy**: Successfully performed Web build and deployment to Firebase Hosting.
- **Android**: Generated a fresh Release APK via `gradlew`.
