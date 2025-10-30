#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="client/public/vendor/dotlottie"
DEST_FILE="$DEST_DIR/dotlottie-player.wasm"
URL_JSDELIVR="https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.55.0/dist/dotlottie-player.wasm"

mkdir -p "$DEST_DIR"

if [ -f "$DEST_FILE" ]; then
  echo "dotlottie-player.wasm already exists at $DEST_FILE — skipping download"
  exit 0
fi

echo "Downloading dotlottie-player.wasm to $DEST_FILE"
if command -v curl >/dev/null 2>&1; then
  curl -L -o "$DEST_FILE" "$URL_JSDELIVR"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$DEST_FILE" "$URL_JSDELIVR"
else
  echo "Neither curl nor wget is available. Please place the file manually at $DEST_FILE" >&2
  exit 1
fi

if [ ! -s "$DEST_FILE" ]; then
  echo "Download failed or empty file at $DEST_FILE" >&2
  exit 1
fi

echo "dotlottie-player.wasm fetched successfully."


