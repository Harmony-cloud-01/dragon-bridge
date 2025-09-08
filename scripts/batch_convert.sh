#!/usr/bin/env bash
set -euo pipefail

# Batch convert WAV to 16kHz mono 32kbps MP3 and append to lessons_source.csv
# Usage: scripts/batch_convert.sh <src_dir_with_wav> <dialectCode>

SRC_DIR=${1:-}
DIALECT=${2:-}

if [[ -z "$SRC_DIR" || -z "$DIALECT" ]]; then
  echo "Usage: $0 <src_dir_with_wav> <dialectCode>" >&2
  exit 1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT_DIR="$ROOT/public/audio/$DIALECT"
CSV="$ROOT/scripts/lessons_source.csv"

mkdir -p "$OUT_DIR"

if [[ ! -f "$CSV" ]]; then
  echo "id,text,pinyin,dialectCode,audio" > "$CSV"
fi

shopt -s nullglob
count=0
for f in "$SRC_DIR"/*.wav; do
  base=$(basename "$f" .wav)
  mp3="$OUT_DIR/$base.mp3"
  if [[ ! -f "$mp3" ]]; then
    ffmpeg -y -i "$f" -ar 16000 -ac 1 -b:a 32k "$mp3" >/dev/null 2>&1 || {
      echo "ffmpeg failed for $f" >&2
      continue
    }
  fi
  # Append row if not already present
  rel="audio/$DIALECT/$base.mp3"
  if ! grep -q "$rel" "$CSV"; then
    echo "${base},, ,${DIALECT},${rel}" >> "$CSV"
    count=$((count+1))
  fi
done

echo "Converted and indexed $count files for dialect $DIALECT → $CSV"

