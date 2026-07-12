#!/bin/bash
# Local backup of dragonbrosy.github.io — since the site is becoming the
# authoritative flight log, this keeps a full standalone copy of the repo's
# history on this Mac, independent of GitHub being reachable.
#
# Run manually any time: ./scripts/backup.sh
# Or schedule it (see scripts/com.dragonbrosy.backup.plist).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$HOME/Backups/dragonbrosy-github-io"
STAMP="$(date +%Y-%m-%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
cd "$REPO_DIR"

# Pull the latest so the bundle reflects what's on GitHub, not just this
# machine's last checkout. Skipped silently if offline.
git fetch --all --quiet || echo "Warning: couldn't reach GitHub, backing up local state only."

# A git bundle is a single-file, fully self-contained copy of the repo
# (all branches, all history) — restorable with `git clone backup.bundle`.
git bundle create "$BACKUP_DIR/dragonbrosy-github-io_${STAMP}.bundle" --all

# Keep the 20 most recent bundles, prune older ones.
ls -t "$BACKUP_DIR"/dragonbrosy-github-io_*.bundle 2>/dev/null | tail -n +21 | xargs -r rm --

echo "Backed up to $BACKUP_DIR/dragonbrosy-github-io_${STAMP}.bundle"
