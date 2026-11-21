#!/bin/bash
# Install Haven Deck as a local kiosk on Debian-family Raspberry Pi OS.
# Run from a clone of this repo: sudo bash pi-setup/setup-kiosk.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash pi-setup/setup-kiosk.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_DIR="${INSTALL_DIR:-/opt/haven-deck}"
KIOSK_USER="${SUDO_USER:-$USER}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 20 or later, then re-run." >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"
# Copy the built app and the server. Do not copy node_modules from a foreign arch.
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  "$REPO_DIR/" "$INSTALL_DIR/"

if [ ! -f "$INSTALL_DIR/config.json" ]; then
  cp "$INSTALL_DIR/config.example.json" "$INSTALL_DIR/config.json"
fi

cd "$INSTALL_DIR"
if [ ! -f dist/index.html ]; then
  npm ci
  npm run build
fi

install -m 0755 "$REPO_DIR/pi-setup/kiosk.sh" /usr/local/bin/haven-deck-kiosk
install -m 0644 "$REPO_DIR/pi-setup/haven-deck.service" /etc/systemd/system/haven-deck.service
install -m 0644 "$REPO_DIR/pi-setup/kiosk.service" /etc/systemd/system/haven-deck-kiosk.service

systemctl daemon-reload
systemctl enable --now haven-deck.service

echo "Haven Deck server is enabled on http://127.0.0.1:4173"
echo "To start the browser kiosk as $KIOSK_USER:"
echo "  sudo systemctl enable --now haven-deck-kiosk.service"
echo "Edit $INSTALL_DIR/config.json before you turn Demo mode off."
