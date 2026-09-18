# Messy Studio development handoff — 18 September 2026

## Authority and scope

The user authorised finishing tactile sound, applying the earlier comparative review's improvements, Fable review, testing and production deployment for morning testing, within a maximum five-hour work window. They explicitly approved sending the game source and an anonymised technical brief to Anthropic. No individual child's information, credentials or saved artwork is part of the reviews.

## Current work

- Original 35-region material sound bank and runtime: under 2,000,000 bytes including the sound review page. Physics inputs shape material-pair contacts; no copied recordings or runtime audio service.
- Sound integrated with existing brush, flick and marble events. Default on with visible mute. Touch gesture unlocking, contact latches, bounded voices, stable rolling slots, watchdog fades and background stopping.
- Complete-state four-slot Undo/Redo, including marble pigment; New is reversible. Stationary marble taps do not use history slots.
- Finished brush endpoints, captured stroke size/colour, bounded distance-spaced sponge stamps.
- One IndexedDB draft per browser/device, saved when drawing stops; graceful denial/failure. No names or server storage. Recovery restores artwork, not transient marbles or history.
- Explicit PNG export with paper colour, two-tap sharing, download and image fallback.
- 48px controls, size sample, irrelevant palette hidden without moving the paper, stable landscape tray. No production diagnostics interval. Stationary held marbles no longer need a frame loop.
- Existing marble trail rendering, persistent three-marble rules, fixed paper geometry and pinch/rotation retained.

## Review and verification

Fable 5.1's first review completed successfully. Its high/medium findings were acted on; the review was based on code, not subjective listening. A follow-up review is in progress. Files are in `.wrangler/studio-sound-review/fable-review.json` and `fable-final.json`.

136 automated tests pass. The existing touch and mouse harnesses now assert results; touch checks pass at 768×954. Native audio probes confirm nonzero output, bounded peaks and quiet idle/mute. `tools/test-studio-reliability.cjs` checks complete history, endpoints, sponge spacing, cancellation, local recovery, blank recovery, denied storage, export and phone/iPad control sizes. Desktop performance is about 60fps; this is not proof of physical iPad performance or pleasing sound.

## Release work still pending at this checkpoint

1. Read Fable's follow-up and fix substantiated blockers; rerun affected tests.
2. Recheck the final landscape layout and native audio after any changes.
3. Finish a release stage preserving public versions of every other game. `.wrangler/studio-release/prepare-release.cjs` downloads public runtime files from the existing host and overlays only eight Messy Studio files. The baseline is retained for rollback; docs, source artwork and local drafts are excluded.
4. Publish the checked stage to the existing Cloudflare Pages `kpopboom` main branch, then verify served hashes and run a clean live-browser smoke check. User has already authorised publishing; do not ask again.
5. Update this record with the deployment result and give the user the live studio and sound-table links. Do not claim actual-iPad listening or testing.

## Continuation routes

Installed Fable client: `C:/Users/joffa/.vscode/extensions/anthropic.claude-code-2.1.273-win32-x64/resources/native-binary/claude.exe`. It supports `--model fable --print`; observed canonical model was `claude-fable-5-1`. `.wrangler/studio-sound-review/run-fable.cjs` runs read-only reviews with a fifteen-minute cap. No usage-limit warning API is available, and a prepared handoff is not an automatically running fallback implementation.

Local game server: port8788. Existing deployment helper: `tools/deploy-kpopboom.sh`; for this release use the prepared restricted stage rather than publishing unrelated working-tree changes. Do not overwrite the user's many unrelated modified/untracked files. `.git` is read-only in this environment; no commit has been made.
