#!/usr/bin/env bash
# Publish kpopboom.party: the two-picture front door, the fireworks game (/boom/) and Little Patterns.
#
# kpopboom is a Cloudflare Pages project with NO git integration (direct upload),
# unlike jofdavies.com which deploys on push to main. So this has to be run by hand
# after a game change, or the two hosts drift apart.
#
#   bash tools/deploy-kpopboom.sh          # production
#   bash tools/deploy-kpopboom.sh ipad5    # PREVIEW at https://ipad5.kpopboom.pages.dev; production untouched
#
# Needs wrangler auth: `npx wrangler login` if `npx wrangler whoami` fails.
set -euo pipefail
BRANCH="${1:-main}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/public/fireworks"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# The site's front door is kpopboom.html (two pictures: one per game). The fireworks
# game lives under /boom/ (since 25 Sept 2026; it was the root before) and Little
# Patterns under /little-patterns/. Every path inside the game is relative, so it
# runs unchanged from the subfolder, exactly as it does at jofdavies.com/fireworks/.
# Built as an ALLOW-list, not a deny-list: assets/glowgirls/sol also holds the PSD,
# the patch sources and the dressed-* working files, none of which should ever be
# published, and a deny-list quietly ships whatever gets added next.
GAME="$STAGE/boom"
mkdir -p "$GAME/assets/glowgirls/sol"
cp "$SRC/kpopboom.html" "$STAGE/index.html"
cp "$SRC"/index.html "$SRC"/manifest.webmanifest "$SRC"/icon-*.png "$GAME/"
cp "$SRC/assets/glowgirls/sol/master.png" "$GAME/assets/glowgirls/sol/"
cp "$SRC/assets/glowgirls/sol/layers.json" "$GAME/assets/glowgirls/sol/"   # alpha-bounds manifest the compositor crops by
cp -r "$SRC/assets/glowgirls/sol/final" "$GAME/assets/glowgirls/sol/"

# The approved games share this host under their own path. Only runtime files
# are copied; visual drafts, old prototypes and source artwork remain local.
node "$ROOT/tools/stage-little-patterns.cjs" "$STAGE"

# Mike the Mic platformer, at /mike-game/ for now (it will move host later; nothing in it may depend on the path).
# Staged as a whole folder because it is its own small project; keep sources, docs and tests out of that folder.
if [ -d "$SRC/mike-game" ]; then mkdir -p "$STAGE/mike-game"; cp -r "$SRC/mike-game/." "$STAGE/mike-game/"; fi

# Anything index.html asks for must exist in the staged copy, or the game 404s live.
missing=0
while read -r ref; do
  [ -f "$GAME/$ref" ] || { echo "MISSING from deploy: $ref"; missing=1; }
done < <(grep -oE "assets/[A-Za-z0-9/._-]+\.(png|webp|jpg)" "$SRC/index.html" | sed "s/'.*//" | sort -u)
# and the front door's two pictures
for ref in boom/icon-512.png boom/icon-192.png little-patterns/assets/nook.png; do [ -f "$STAGE/$ref" ] || { echo "MISSING from deploy: $ref"; missing=1; }; done
[ -f "$GAME/assets/glowgirls/sol/layers.json" ] || { echo "MISSING from deploy: assets/glowgirls/sol/layers.json (run node tools/build-glowgirl-layers.cjs)"; missing=1; }
[ "$missing" -eq 0 ] || { echo "aborting: staged copy is incomplete"; exit 1; }

if [ -n "${DRY_RUN:-}" ]; then trap - EXIT; echo "DRY_RUN: staged copy left at $STAGE"; exit 0; fi   # DRY_RUN=1 keeps the stage for a local smoke test
echo "Publishing $(du -sh "$STAGE" | cut -f1) to kpopboom (branch $BRANCH)..."
cd "$ROOT"
npx --yes wrangler@latest pages deploy "$STAGE" \
  --project-name=kpopboom \
  --branch="$BRANCH" \
  --commit-dirty=true
