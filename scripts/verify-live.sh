#!/usr/bin/env bash
# Compare the files served by photocraft.digital with manifests/v<version>.sha256.
set -euo pipefail
VERSION="${1:-0.9.0}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="https://photocraft.digital/vendor/photocraft/$VERSION"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
hash() { if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
fail=0
while read -r want file; do
  [ -z "$want" ] && continue
  remote="$BASE/$file"; [ "$file" = "index.html" ] && remote="$BASE/"
  curl -fsSL -o "$TMP/f" "$remote"
  got=$(hash "$TMP/f")
  if [ "$got" = "$want" ]; then echo "OK   $file"; else echo "DIFF $file $got (expected $want)"; fail=1; fi
done < "$ROOT/manifests/v$VERSION.served.sha256"
exit $fail
