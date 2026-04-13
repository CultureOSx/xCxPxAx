#!/bin/bash
set -euo pipefail

echo "==> Installing JavaScript dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

echo "==> Installing iOS CocoaPods dependencies"
cd ios
pod install --repo-update
