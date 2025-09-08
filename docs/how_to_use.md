# How To Use — Dragon Bridge (PWA + Android)

This guide shows the fastest way to try the app, learn with lessons, practice tones, and review with SRS. It also covers AI Teacher setup, offline use, and Android packaging.

## Try the App (PWA)
- Live: https://harmony-cloud-01.github.io/dragon-bridge/
- Install to Home Screen for better offline use.
- First launch: allow the app to cache; an “Offline” banner will appear if you disconnect.

## Quick Tour
- Home (Village): large tiles route to common areas (Lessons, Tone Drills, Review, Settings).
- Bottom tabs: Home • Lessons • AI Teacher • Progress • Settings.
- Settings → Dialects: choose dialects and playback speed.
- Settings → App: Lite Mode, consent, prefer pre‑recorded audio, diagnostics, and caches.

## Lessons
1) Open Lessons tab.
2) Filter by tag (e.g., market, farm, greetings). Reset filters anytime.
3) Use the importer at the top to load your own lesson library (URL or file).
4) Each lesson card shows:
   - tags, in‑SRS/total, and due count for that set
   - chips for words (select to “Add selected” to SRS)
   - buttons: Add all to SRS • Practice • Practice all • Practice selected

### SRS
- Add words via lesson cards; a toast confirms counts.
- Review tab shows due items immediately (new items are due now).
- SRS viewer lives in Settings (for debugging and progress visibility).

### Practice (Tone Drills)
- Practice adds the lesson and a practice word for Tone Drills.
- Tone Drills shows a “Practice” panel with the word and play options:
  - Play (TTS or local audio)
  - Play + Visualize (tone display)
- Practice all/selected creates a queue in Tone Drills with Start (Play) and Start (Visualize).

## AI Teacher
- Chat demo is offline‑safe (gives local tips).
- To use a local model (Ollama):
  - Install: https://ollama.com
  - Run a small model: `ollama run qwen2:0.5b`
  - In AI Teacher: set Endpoint (default http://localhost:11434) and model name.
- The chat includes current lesson context if you came from a lesson’s Practice button.

## Prefer Local Audio (optional)
- Toggle in Settings or in Tone Drills.
- If enabled and audio files exist in `public/audio/<dialect>/`, the app plays them before TTS.
- Offline: the app always prefers local audio when available.

## Admin: Lesson Library
- Default library file: `public/lessons.library.json` (pre‑seeded).
- Import/override via Lessons importer (URL or file).
- Clear override/cache via Settings → Library & Cache.

## Offline & Lite Mode
- Lite Mode (auto or toggle) reduces animations, effects, and uses system fonts for low‑end phones.
- The service worker pre‑caches core assets; lessons libraries are cached after first load.

## Android (Capacitor) — Optional
1) `pnpm add -D @capacitor/android @capacitor-community/sqlite`
2) `pnpm run cap:add:android`
3) Build web: `pnpm run build`
4) Copy assets: `pnpm run cap:copy`
5) Inject mic permission: `pnpm run android:inject-perms`
6) Build debug APK: `cd android && ./gradlew assembleDebug`
7) Install: `adb install -r app/build/outputs/apk/debug/app-debug.apk`

## Troubleshooting
- Lessons are empty: reset tag filter; Settings → Library & Cache → “Use default library”.
- SRS not updating: try adding again; Review shows due now. Settings → SRS viewer should reflect changes live.
- No audio on mobile: tap a Play button (mobile browsers require interaction). Consider enabling local audio.
- Cache issues: Settings → Library & Cache → Clear override and loader cache; hard refresh the PWA.

