#!/usr/bin/env bash
# Run Capacitor CLI with Node 22 (required by @capacitor/cli >=8).
# Usage: scripts/cap-with-node22.sh <cap-args...>
# Example: scripts/cap-with-node22.sh sync ios
set -e
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 22 2>/dev/null || nvm use
fi
exec npx cap "$@"
