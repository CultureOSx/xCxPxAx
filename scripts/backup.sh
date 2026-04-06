#!/usr/bin/env bash
# backup — snapshot CulturePass AU project
# Usage: backup [label]
# Creates: git snapshot commit + timestamped tar.gz archive

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${HOME}/backups/culturepass"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LABEL="${1:-snapshot}"
ARCHIVE_NAME="culturepass_${TIMESTAMP}_${LABEL}.tar.gz"

cd "$PROJECT_DIR"

echo "==> CulturePass Backup — $(date)"
echo "    Project : $PROJECT_DIR"
echo "    Store   : $BACKUP_DIR"
echo ""

# ── 1. Git snapshot ──────────────────────────────────────────────────────────
echo "[1/3] Git snapshot..."

# Stage all changes (including deletions)
git add -A

# Only commit if there's something staged
if git diff --cached --quiet; then
  echo "      Nothing to commit — working tree clean."
else
  git commit -m "chore: backup snapshot — ${TIMESTAMP} ${LABEL}"
  echo "      Committed: $(git log -1 --oneline)"
fi

# ── 2. Create archive ────────────────────────────────────────────────────────
echo "[2/3] Creating archive..."

mkdir -p "$BACKUP_DIR"

tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='functions/node_modules' \
  --exclude='server/node_modules' \
  --exclude='.expo' \
  --exclude='dist' \
  --exclude='ios/build' \
  --exclude='android/build' \
  --exclude='android/.gradle' \
  --exclude='*.log' \
  -C "$(dirname "$PROJECT_DIR")" \
  "$(basename "$PROJECT_DIR")"

ARCHIVE_SIZE="$(du -sh "${BACKUP_DIR}/${ARCHIVE_NAME}" | cut -f1)"
echo "      Saved : ${BACKUP_DIR}/${ARCHIVE_NAME} (${ARCHIVE_SIZE})"

# ── 3. Housekeeping — keep last 10 archives ──────────────────────────────────
echo "[3/3] Pruning old backups (keeping last 10)..."
ls -t "${BACKUP_DIR}"/culturepass_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm --
KEPT="$(ls "${BACKUP_DIR}"/culturepass_*.tar.gz 2>/dev/null | wc -l | tr -d ' ')"
echo "      Archives on disk: ${KEPT}"

echo ""
echo "==> Done."
