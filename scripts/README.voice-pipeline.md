Voice Data Pipeline (Phase 4)
=================================

Goal: Prepare rural/standard Mandarin audio for offline playback.

See also: `docs/voice-corpora.md` (open corpora list + links)

Steps
1) Download datasets to `data/raw/` (outside the repo or gitignored).
2) Run the filter script to extract rural‑accent speakers (AISHELL‑3 example):
   - `python3 scripts/filter_rural.py AISHELL-3/metadata.tsv data/rural_speakers.csv`
3) Convert selected WAV files to 16 kHz, 32 kbps MP3 and place in `public/audio/<dialectCode>/`.
   - `ffmpeg -i input.wav -ar 16000 -ac 1 -b:a 32k output.mp3`
4) Generate `public/lessons.json` with entries mapped to the local audio:
   - `pnpm run lessons:scan` (append missing rows into `scripts/lessons_source.csv`)
   - Fill in text/pinyin columns as needed
   - `pnpm run lessons:build` (write `public/lessons.json`)

Schema: public/lessons.json
```
[
  {
    "id": "lesson-001",
    "text": "你好",
    "pinyin": "nǐ hǎo",
    "dialectCode": "zh-CN",
    "audio": "audio/zh-CN/nihao.mp3"
  }
]
```

Mapping in UI (planned)
- App already prefers local audio when offline (and optionally online if enabled in settings). TonePlayer demos analysis with local audio.

Notes
- Do not commit raw datasets. Keep only processed MP3s and the generated JSON in the repo.
