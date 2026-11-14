#!/usr/bin/env bash
# Re-encodes heavy mp4 files in public/images for the web: H.264, no audio, Fast Start (moov first), capped width.
# Needs ffmpeg:  brew install ffmpeg
#
#   scripts/optimize-videos.sh            # list what would be done
#   scripts/optimize-videos.sh --write    # create <name>.web.mp4 next to each heavy file (originals are kept)
#
# After checking a result by eye, point the JSON in src/data at the .web.mp4 file (or rename it over the original).
set -euo pipefail
cd "$(dirname "$0")/.."
MIN_KB=${MIN_KB:-1500}     # only files bigger than this
MAX_W=${MAX_W:-1600}       # never wider than this (cards are shown much smaller than the page)
CRF=${CRF:-27}             # 23 = better, 30 = smaller

if ! command -v ffmpeg >/dev/null; then echo "ffmpeg is not installed (brew install ffmpeg)"; exit 1; fi

find public/images -type f -name '*.mp4' ! -name '*.web.mp4' -size +"${MIN_KB}"k | sort | while read -r f; do
  out="${f%.mp4}.web.mp4"
  size=$(du -k "$f" | cut -f1)
  if [[ "${1:-}" != "--write" ]]; then echo "would encode: $f (${size} KB)"; continue; fi
  ffmpeg -y -loglevel error -i "$f" -an \
    -vf "scale='min(${MAX_W},iw)':-2" \
    -c:v libx264 -preset slow -crf "$CRF" -profile:v high -pix_fmt yuv420p \
    -movflags +faststart "$out"
  echo "$f: ${size} KB -> $(du -k "$out" | cut -f1) KB"
done
