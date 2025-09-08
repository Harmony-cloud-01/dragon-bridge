# Changelog

## 2.0.0 – Dragon Bridge (PWA + Android)

Major release focused on offline‑first learning, rural device guards, lesson library, and Android packaging.

- PWA + Offline
  - Service worker with precache + JSON stale‑while‑revalidate
  - Lite Mode (auto/manual) for low‑RAM/CPU devices
  - Offline banners and base‑path helpers for GH Pages

- Dialects & Audio
  - Expanded dialect list (regional + minority variants)
  - Enhanced voice selection fallback
  - Local audio mapping (lessons.json) with offline preference

- Lessons
  - Lesson library (JSON) + importer (URL/file) and tag filters
  - Lesson cards: add all/selected to SRS, in‑SRS/due counts
  - Practice flows: single word, practice all/selected, auto‑queue in Tone Drills

- SRS
  - New items due immediately (visible in Review)
  - Global SRS event sync; SRS viewer in Settings

- Tone Drills
  - Tone visualizer + WebAudio pitch analysis
  - Queue playback with Play/Visualize options

- AI Teacher
  - Configurable Ollama endpoint + streaming replies
  - Lesson‑aware prompts (uses current lesson context)

- Android (Capacitor)
  - Capacitor scaffold, mic permission injector
  - CI workflow for tag builds (debug or signed release via secrets)

- Docs
  - How To Use guide; voice corpora list; voice pipeline steps

## 1.x – Initial PWA skeleton (internal)
- Baseline Next.js app (app router), components, minimal flows

