#!/usr/bin/env bash
# Render the game art drawn as SVG (scripts/art/*.svg) to PNGs in assets/images/game/.
#   bash scripts/make-art.sh          (needs rsvg-convert: `sudo apt install librsvg2-bin` or `brew install librsvg`)
# SVGs may use the game's existing pictures by plain file name (e.g. <image href="shop.png">);
# they are rendered in a temporary folder next to copies of those pictures.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cp assets/images/game/*.png "$tmp"/
# Sweets first: the thumbnails use them.
for name in $(ls scripts/art/*.svg | xargs -n1 basename | sed 's/\.svg$//' | sort -t- -k1,1 | awk '/thumb/ {t[++n]=$0; next} {print} END {for (i=1;i<=n;i++) print t[i]}'); do
  cp "scripts/art/$name.svg" "$tmp/"
  rsvg-convert -o "$tmp/$name.png" "$tmp/$name.svg"
  cp "$tmp/$name.png" "assets/images/game/$name.png"
  echo "assets/images/game/$name.png"
done
