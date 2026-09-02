#!/usr/bin/env bash
# Publish the fireworks game to kpopboom.party.
#
# kpopboom is a Cloudflare Pages project with NO git integration (direct upload),
# unlike jofdavies.com which deploys on push to main. So this has to be run by hand
# after a game change, or the two hosts drift apart.
#
#   bash tools/deploy-kpopboom.sh
#
# Needs wrangler auth: `npx wrangler login` if `npx wrangler whoami` fails.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/public/fireworks"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# The game is the whole site at this domain, so the folder is deployed as the root.
# Built as an ALLOW-list, not a deny-list: assets/glowgirls/sol also holds the PSD,
# the patch sources and the dressed-* working files, none of which should ever be
# published, and a deny-list quietly ships whatever gets added next.
mkdir -p "$STAGE/assets/glowgirls/sol"
cp "$SRC"/index.html "$SRC"/manifest.webmanifest "$SRC"/icon-*.png "$STAGE/"
cp "$SRC/assets/glowgirls/sol/master.png" "$STAGE/assets/glowgirls/sol/"
cp -r "$SRC/assets/glowgirls/sol/final" "$STAGE/assets/glowgirls/sol/"

# Anything index.html asks for must exist in the staged copy, or the game 404s live.
missing=0
while read -r ref; do
  [ -f "$STAGE/$ref" ] || { echo "MISSING from deploy: $ref"; missing=1; }
done < <(grep -oE "assets/[A-Za-z0-9/._-]+\.(png|webp|jpg)" "$SRC/index.html" | sed "s/'.*//" | sort -u)
[ "$missing" -eq 0 ] || { echo "aborting: staged copy is incomplete"; exit 1; }

echo "Publishing $(du -sh "$STAGE" | cut -f1) to kpopboom..."
cd "$ROOT"
npx --yes wrangler@latest pages deploy "$STAGE" \
  --project-name=kpopboom \
  --branch=main \
  --commit-dirty=true
