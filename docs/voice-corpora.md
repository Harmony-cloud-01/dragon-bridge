## Open Voice Corpora (Rural‑accent friendly)

These datasets are open‑licensed (CC‑BY/Apache/MIT) and have CN mirrors for faster rural pulls.

| Corpus | Hours | Speakers | Dialects | License | Mirror/Link |
| --- | ---: | ---: | --- | --- | --- |
| KeSpeech | ~1500 h | ~27k | 8 sub‑dialects (东北, 四川, 河南…) | CC‑BY 4.0 | https://openslr.org/119/ (Tsinghua) |
| AISHELL‑3 | ~85 h | 218 | Meta: gender, age, native accent | Apache‑2.0 | https://openslr.org/93/ |
| MagicData‑RAMC | ~180 h | 60 | Mobile recordings, real‑world noise | CC‑BY 4.0 | https://www.magicdatatech.com/datasets |
| OpenSLR‑33 (AISHELL‑1) | ~178 h | 400 | Clean read speech baseline | CC‑BY 4.0 | https://openslr.org/33/ |
| Emilia‑ZH subset | ~1000 h | ~5k | Web‑crawled, high variance | Apache‑2.0 | https://huggingface.co/datasets/amphion/Emilia |

### Rural‑accent filter (AISHELL‑3 example)

```bash
python3 scripts/filter_rural.py AISHELL-3/metadata.tsv data/rural_speakers.csv
```

The filter searches common rural/region tags: 东北, 河南, 四川, 山东, 陕西 (and English equivalents). Adjust the pattern in `scripts/filter_rural.py` if needed.

### Convert to 32 kbps MP3 (offline‑friendly)

```bash
ffmpeg -i input.wav -ar 16000 -ac 1 -b:a 32k output.mp3
```

Place files under `public/audio/<dialectCode>/...` and generate `public/lessons.json` via:

```bash
pnpm run lessons:scan   # append missing entries to scripts/lessons_source.csv
pnpm run lessons:build  # write public/lessons.json
```

With “Prefer pre‑recorded audio” enabled (Settings or Tone demo), the app plays local audio before TTS, and works offline.

