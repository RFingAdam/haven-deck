#!/bin/bash
# Open Haven Deck in a Chromium/Chrome kiosk window.
# Default URL is the local kiosk server.
set -euo pipefail

URL="${1:-${HAVEN_DECK_URL:-http://127.0.0.1:4173}}"
CHROME=""
for candidate in chromium-browser chromium google-chrome-stable google-chrome; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME="$candidate"
    break
  fi
done
if [ -z "$CHROME" ]; then
  echo "No Chromium or Chrome found." >&2
  exit 1
fi

exec "$CHROME" \
  --kiosk \
  --app="$URL" \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  --user-data-dir="${HOME}/.config/haven-deck-kiosk"
