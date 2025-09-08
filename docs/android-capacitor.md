## Android (Capacitor) Bundle

This packages the static export (`out/`) into a native Android WebView app via Capacitor.

### Prerequisites
- Node 18+ and pnpm
- Android Studio + SDKs (for build)

### Install Capacitor deps

```
pnpm add @capacitor/core
pnpm add -D @capacitor/cli @capacitor/android
```

### Initialize Capacitor (first time)

```
pnpm run cap:init
# or manually: npx cap init "Dragon Bridge" "org.harmony.dragonbridge"
```

This repo already includes `capacitor.config.ts` with `webDir: 'out'` and `androidScheme: 'https'`.

### Add Android platform

```
pnpm run cap:add:android
```

### Build web assets (static export)

```
pnpm run build
```

### Copy web assets into Android

```
pnpm run cap:copy
# or: pnpm run cap:sync
```

### Open and build in Android Studio

```
pnpm run cap:open:android
# Then Build > Build Bundle(s) / APK(s) in Android Studio
```

Notes
- Base path: In native (Capacitor) runtime, `getBasePath()` returns empty so assets resolve relatively from the bundle (handled in `lib/base-path.ts`).
- Service worker: not required on native, but harmless; registration only helps when running as PWA.
- For low-end devices, enable Lite Mode (auto-detects save-data/low-memory/low-cpu) for best performance.

