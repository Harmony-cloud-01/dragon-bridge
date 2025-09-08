# 🐉 Dragon Bridge — Rural Mandarin Teacher

Open‑source, offline‑first Mandarin learning for low‑end Android and the web.

Live: https://harmony-cloud-01.github.io/dragon-bridge/

---

## Highlights

- PWA with offline cache and a service worker
- Lite Mode for low‑RAM/CPU devices (no animations/effects, system fonts)
- Dialect selector (Mandarin regional variants + minority extensions)
- SRS (Spaced Repetition) with pluggable storage (SQLite on native via Capacitor, localStorage on web)
- Lessons/audio pipeline: pre‑recorded audio in `public/audio/<dialect>/...` + `public/lessons.json`
- Tone visualization demo (canvas) with basic WebAudio pitch analysis

---

## How To Use

- See docs/how_to_use.md for quick steps on Lessons, SRS, Tone Drills, AI Teacher, and Android packaging.

---

## Install & Run (local)

```bash
git clone https://github.com/Harmony-cloud-01/dragon-bridge.git
cd dragon-bridge
pnpm install
pnpm run dev
```

Build static export (Next 15 output: 'export'):

```bash
pnpm run build
```

---

## Deploy (GitHub Pages)

- Pages is wired via `.github/workflows/gh-pages.yml`
- Push to `main` → builds static export and publishes `out/`
- Base path: `/dragon-bridge` is set in `next.config.mjs`

---

## Android (Capacitor)

Docs: `docs/android-capacitor.md` and `docs/release-build-checklist.md`

Quick start:

```bash
pnpm add -D @capacitor/android @capacitor-community/sqlite
pnpm run cap:add:android
pnpm run build
pnpm run cap:copy
pnpm run android:inject-perms   # RECORD_AUDIO
cd android && ./gradlew assembleDebug
```

- Optional CI release: tag `v*` → `.github/workflows/android-release.yml` builds APK and attaches to the release (debug by default; supports signing via secrets for release APK).

---

## Lessons & Audio

- Put audio under `public/audio/<dialectCode>/*.mp3`
- Define entries in `public/lessons.json` (or generate it):
  - `pnpm run lessons:scan` to append missing rows into `scripts/lessons_source.csv`
  - `pnpm run lessons:build` to write `public/lessons.json`
- When offline (or when “Prefer pre‑recorded audio” is enabled), playback will use local audio if present.

---

## Storage

- Web: localStorage fallback
- Native (Android): Capacitor Community SQLite
- Engine is pluggable; SRS + activity logs + profiles mirror into SQLite on native

---

## Accessibility & Performance

- Lite Mode (auto / manual toggle) reduces effects and uses system fonts
- Respect `prefers-reduced-motion`
- ARIA labels on audio controls; canvas visuals have text equivalents

---

## License

MIT © 2025 HarmonyOnline.org / Harmony-cloud-01

See [LICENSE](./LICENSE) for full terms.
