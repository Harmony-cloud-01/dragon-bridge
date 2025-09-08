Voice Data Pipeline (Phase 4)
=================================

Goal: Prepare rural/standard Mandarin audio for offline playback.

Sources (mirrors)
- KeSpeech (Mandarin speech corpus)
- AISHELL-3 (multi-speaker Mandarin TTS corpus)

Steps
1) Download datasets to `data/raw/` (outside the repo or gitignored).
2) Run the filter script to extract rural speakers list:
   - `python3 scripts/filter_rural.py data/raw/metadata.csv > data/rural_speakers.csv`
3) Convert selected WAV files to 16 kHz, 32 kbps MP3 and place in `public/audio/<dialect>/`.
   - Example ffmpeg:
     - `ffmpeg -i input.wav -ar 16000 -ac 1 -b:a 32k output.mp3`
4) Generate `public/lessons.json` with a list of lessons and a `dialectCode` field, and optional `audio` URLs pointing into `public/audio/...`.

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
- Add a utility that, when offline, attempts to play `audio` if present in lessons.json for the requested `text` and `dialectCode`; otherwise falls back to TTS when online.

Notes
- Do not commit raw datasets. Keep only processed MP3s and the generated JSON in the repo.

