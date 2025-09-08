# Harmony Mandarin – v3 Roadmap (Notes)

This document outlines proposed v3 upgrades aligned with Harmony concepts.

## SP‑Driven Guidance (HarmonyAgent)
- Instantiate SPs (Teo, Echoverse5, Audrey, Luma) with Shen/Eightfold Path attributes.
- Use to generate guidance in Market Quest or Teacher Mode.
- Example (pseudo‑Python):
```
Teo [Reflective Shen, Hexagram: TAI Peace]
Eightfold Path: Right Speech
Harmony Law: Co‑Negotiated Reality
Guidance: Act in alignment with Right Speech…
Task: Guide Mandarin tone practice.
```

## Market Quest Enhancements
- Link locations to lessons (JSON mapping).
- Gamification: hexagram‑themed badges (local persistence), surfaced in Progress.

## Progress Dashboard
- Add bar chart for learner distribution across Shen levels.
- Data source: local progress; render with a lightweight chart for PWA.

## AI Chat (Teacher)
- Wire to Ollama (local/offline) with SP prompts.
- Voice input/output (Web Speech/AV) for pronunciation feedback.

## Dialect Selector Enhancements
- Audio previews per dialect; JSON dataset 
  (e.g., Standard vs. Sichuanese greetings) with local audio paths.

## Offline Optimization
- Cache lessons/audio/SP guidance via Workbox or IndexedDB.
- Validate on low‑end hardware (≤2 GB RAM).

## Security & Future Crypto
- Secure exports/profiles (AES‑256/TLS 1.3), modular to swap post‑quantum later.

