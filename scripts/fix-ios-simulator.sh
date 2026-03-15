#!/usr/bin/env bash
# Fix "Can't determine id of Simulator app" for Expo run:ios
# Run in Terminal: ./scripts/fix-ios-simulator.sh (enter password when prompted)

set -e

echo "1. Setting Xcode developer path (use path from Expo error message)..."
sudo xcode-select -s /Applications/Xcode.app

echo "2. Verifying path..."
xcode-select -p

echo "3. Accepting Xcode license (if needed)..."
sudo xcodebuild -license accept 2>/dev/null || true

echo "4. Listing available simulators..."
if xcrun simctl list devices 2>/dev/null | head -20; then
  echo "(Simulators listed above)"
else
  echo "Could not list simulators. Install iOS Simulator: Xcode -> Settings -> Platforms -> add iOS."
fi

echo ""
echo "Done. Run from project root: npx expo run:ios"
echo "If you see 'database is locked' or 'two concurrent builds': npm run ios:clean"
echo "If Simulator not opening: open -a Simulator, then npx expo run:ios"
