#!/usr/bin/env bash
# Download the pinned upstream web release, verify it, apply the patch, and compare
# the result with the published digests. Requires: curl, unzip, node >= 18, sha256sum (or shasum).
set -euo pipefail
VERSION="${1:-0.9.0}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPEC="$ROOT/patches/v$VERSION/patch.json"
WORK="$ROOT/work/$VERSION"
URL=$(node -e "console.log(require('$SPEC').upstream.archiveUrl)")
SUM=$(node -e "console.log(require('$SPEC').upstream.archiveSha256)")
ZIPROOT=$(node -e "console.log(require('$SPEC').upstream.archiveRoot)")
mkdir -p "$WORK"
curl -fSL --retry 3 -o "$WORK/release.zip" "$URL"
if command -v sha256sum >/dev/null; then GOT=$(sha256sum "$WORK/release.zip" | cut -d' ' -f1); else GOT=$(shasum -a 256 "$WORK/release.zip" | cut -d' ' -f1); fi
[ "$GOT" = "$SUM" ] || { echo "Upstream archive checksum mismatch: $GOT" >&2; exit 1; }
echo "OK   upstream archive $GOT"
rm -rf "$WORK/extract" "$WORK/out"
unzip -q "$WORK/release.zip" -d "$WORK/extract"
node "$ROOT/scripts/apply-patch.mjs" "$VERSION" "$WORK/extract/$ZIPROOT" "$WORK/out"
echo "Patched files are in $WORK/out"
