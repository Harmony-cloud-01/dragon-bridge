# Release Build Checklist (Web + Android)

This checklist covers PWA static export and Android APK release.

## Web (GitHub Pages)
1) Update lessons and audio (optional)
   - Edit `scripts/lessons_source.csv`
   - Run `pnpm run lessons:build`
   - Commit `public/lessons.json`
2) Push to `main` — CI builds and deploys to Pages:
   - https://harmony-cloud-01.github.io/dragon-bridge/

## Android (Capacitor)
Prereqs: Node 18+, pnpm, JDK 17, Android SDK (platform-tools + build-tools), ANDROID_HOME set.

1) Install native deps
```
pnpm add -D @capacitor/android @capacitor-community/sqlite
```

2) Initialize Android project (first time only)
```
pnpm run cap:add:android
```

3) Build web and sync into Android
```
pnpm run build
pnpm run cap:copy   # or: pnpm run cap:sync
```

4) Inject mic permission (for voice visualizer)
```
pnpm run android:inject-perms
```

5) Configure signing (first time only)
- Create keystore:
```
keytool -genkeypair -v -keystore dragonbridge.keystore -alias dragonbridge \
  -keyalg RSA -keysize 2048 -validity 3650
```
- Reference keystore in `android/app/build.gradle` (signingConfigs.release) and `gradle.properties`.

6) Build Release APK (headless)
```
pnpm run android:assemble
# APK: android/app/build/outputs/apk/release/app-release.apk
```

7) Test on device
```
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

8) Publish
- Create a GitHub Release and upload the APK.
- Keep using the same keystore for future updates.

Notes
- The app runs fully offline; service worker is not required on native.
- `lib/base-path.ts` detects Capacitor native and uses relative paths.
- For CI-based APK builds, use a GitHub Actions workflow that installs the Android SDK and runs `./gradlew assembleRelease`.

