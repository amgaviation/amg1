#!/usr/bin/env bash
# Render each generated HTML creative to a PNG at 2x for crisp retina output.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
HTML="$DIR/html"
OUT="$(cd "$DIR/.." && pwd)/images"
CHROME="/opt/pw-browsers/chromium"
mkdir -p "$OUT"
while read -r id w h; do
  [ -z "$id" ] && continue
  "$CHROME" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --hide-scrollbars --allow-file-access-from-files --no-default-browser-check \
    --force-device-scale-factor=2 --run-all-compositor-stages-before-draw \
    --virtual-time-budget=3000 --window-size="$w,$h" \
    --screenshot="$OUT/$id.png" "file://$HTML/$id.html" >/dev/null 2>&1
  echo "rendered $id (${w}x${h} @2x)"
done < "$DIR/sizes.txt"
