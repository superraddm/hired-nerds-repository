# Fireworks: iPad 5 / iPadOS 16.7.16 optimisation handoff

**Status (2026-09-06).** Gates 0-3 are implemented and pass the headless regression harness at both quality tiers. Gate 4 was run as a first pass by Jof on the iPad 5 in Safari with the overlay (no Web Inspector): dressing room 30 fps / p95 34 ms / 27 MiB; stage in a boss fight 30 fps / p95 34 ms / 6-7 ms JS / 8 ms input-to-frame / 20 MiB; tier legacy chosen from the first frame. **Accepted by Jof and shipped to production on 2026-09-06.** Not yet exercised on the device: Add to Home Screen, browser-bar collapse during a level, the keyboard, two rotations, and the 10-minute endurance loop; run those from the list below when convenient and report any overlay line that misses. Nothing here changes saves, names, the wardrobe art, the tinter maths, or the registered 1024 x 1536 puppet contract; the outfit deal is now fixed (see the device-pass notes). Source-art defects found along the way are in `HEADS-HAIR-WARDROBE-TASK.md`.

## Objective

Make the existing game reliably playable in Safari on a fifth-generation iPad running iPadOS 16.7.16, in both orientations and when launched from the Home Screen.

The dressing room was slow but usable. The fireworks stage was not. Some whole-screen and DOM/canvas elements moved out of alignment. Preserve the game's current appearance, saved progress, character naming, outfit unlocks, randomisation, and registered-puppet asset contract.

Do not compensate for a misregistered hair or clothing image with an iPad-only offset. Whole-scene drift is a viewport/layout bug; a single character layer that is wrong relative to the face/body is source-art registration debt and remains a separate task.

## Review of the original handoff

The measured causes in the original document were checked against the code and all held: 113 eagerly loaded 1024 x 1536 PNGs, full-canvas tint/skin/base/erase/composite caches capped by entry count only, DPR 2 at 1024 x 768 sneaking under the pixel cap, a permanent animation loop, 2,600 particles each stroked individually, blurred glows everywhere, a 40 ms music timer while muted, and layout read from the DOM at different moments. The headless harness turned the theoretical memory figure into a measurement: after one dressing-room sweep the old tint cache alone held about 72 full-size canvases, roughly 450 MB of backing store. On iOS that is not merely slow; WebKit caps total canvas memory per page and, past the cap, new canvases are created blank. That is the "blank canvas" symptom in the objective.

Where the plan was changed, and why:

- **Cheaper Gate 1.** Cropping the PNGs on disk, shipping a second asset set and a pixel verifier is not needed to get the memory win. The layers stay untouched; an offline manifest of alpha bounds (`layers.json`) lets every runtime canvas be allocated at crop size and drawn back at its registered offset. Same pixels, one small JSON file, no change to the art contract. Download size is unchanged (transparent PNG regions compress to almost nothing anyway).
- **No canonical 1024 x 768 letterboxed stage.** The game already lays out per viewport, including phone portrait at 390 x 844, and letterboxing or a "rotate your device" screen would change what a four-year-old sees. The real bug was mixed measurement moments. It is fixed by giving geometry a single owner (`syncLayout`) and a single per-frame snapshot (`LAY`), which is what the doc was really asking for.
- **iPad detection.** iPadOS Safari reports itself as a Mac in its user agent, so UA sniffing cannot find the target at all. The tier guess uses touch points plus reported cores (an A9 reports two), and the adaptive step-down covers a wrong guess within seconds.
- **On-demand loading without eviction.** True per-category load/unload adds pop-in to a kids' game and the browser already manages decoded image bitmaps. Instead the three current looks load first (so PLAY unblocks early) and the rest trickles in behind at low priority; empty layers are never requested. Caches, not images, are the deterministic memory hog, and those are now byte-budgeted.
- **Particle pooling dropped.** With the per-tier particle caps and batched stroking, allocation is no longer measurable; pooling would add complexity for nothing.
- **Tint at display resolution, from permanent small crops.** A swatch tap recolours the worn item and every thumbnail in the category. Profiling the tap showed the tint maths was not the cost: it was the first-use PNG decode of every layer drawn (15-25 ms each on a desktop, and Safari re-decodes after dropping bitmaps under pressure). Each layer is now decoded off the main thread as it loads and a quarter-size crop is kept for good (about 3 MiB for the whole wardrobe). Thumbnails and stage puppets are built from those; only the full-size dressing preview reads the source image. A swatch tap went from 150-370 ms to 5-10 ms on the desktop. The per-pixel maths and `TINT_MIX` are unchanged.

## What was built

All code is in `public/fireworks/index.html` unless stated. Each block is commented in place.

### Gate 0 — diagnostics

- `?perf=1` shows an overlay; `window.__kbPerf` is always present. Fields: `tier`, `auto` (adaptive step-down fired), `dpr`, `fps`, `p50`/`p95` (frame interval), `workP95` (JS time per frame), `longFrames` (> 50 ms), `frames`/`skipped`/`idle`, `particles`/`particlesPeak`, `sources {loaded,total,manifest}`, `canvases {count,bytes,tint,skin,base,comp}`, `rects {viewport,stage,ctl,left,right,cauldron,dress}`, `inputLatencyMs` (pointerdown to next rendered frame), `reset()`, `setTier()`.
- `?layoutDebug=1` overlays the measured viewport, playfield, control top, rails, cauldron and dressing canvas with their CSS-pixel coordinates.

### Gate 1 — memory

- `tools/build-glowgirl-layers.cjs` writes `assets/glowgirls/sol/layers.json` (alpha bounds per layer, `null` for empty; `--check` verifies the file against the PNGs, exit 1 on drift). 116 layers, 27 empty; 534 MiB of full canvases become 45 MiB of crops. It also lints art whose bounds touch the canvas edge.
- Runtime compositor: every tint, skin repaint, character base and composite is a cropped canvas drawn at its registered `(dx, dy)`. Composites cover only the union of their layers and are built at the scale that will be shown (quarter steps). Without the manifest the bounds are scanned once from the decoded image, so an old deploy still works.
- Byte-budgeted LRU caches (`BUDGET`: tint 24 MiB, skin 10, base 10, composite 24) with a 96-entry cap each, since every canvas is a GPU surface on iOS. A dropped canvas is shrunk to 1 x 1 before release. The separate shoe-erase cache is gone; the erase is applied inline.
- Permanent quarter-size crops (`GG.small`, CPU-backed) of every loaded layer, made after an off-thread `decode()`; anything drawn at a quarter scale or less (thumbnails, stage puppets, the head mask) reads from them.
- Loading: manifest, then master/blink/mask/heads plus the layers of the three current looks, then the rest at low priority, four in flight. A composite with a layer still loading is drawn but not cached; the girl keeps her last complete look until it lands, and thumbnails refresh when it does.
- Leaving the dressing room drops the full-size composites and the preview canvas's backing store.
- Thumbnails never allocate a full-size canvas.

### Gate 2 — render tiers

- `TIERS` (full / medium / legacy) and the live `Q` object are the single source of every budget: DPR cap, fixed render rate, live and per-burst particle caps, finale interval, star/crowd/weather counts, canvas shadows on/off, rocket-trail rate, crackle node cap, glitter spawn rate. Legacy starts at exactly the values the handoff specified (DPR 1, 30 Hz, 700 / 120 particles, finale 650-800 ms, 50 stars, 28 crowd, 24 weather).
- Selection: `?quality=` for a load, `localStorage kb_quality` to pin, else the capability guess; adaptive step-down when rolling p95 exceeds 40 ms for 3 s (one tier, never back up mid-play, remembered in `sessionStorage` only).
- Canvas shadows are disabled for legacy in one place: a `shadowBlur` setter on the context prototype writes 0 while `Q.shadows` is off, so forty call sites did not need touching.
- `html.q-legacy` CSS removes `backdrop-filter`, bottle drop-shadows and looping decorative animations.
- The loop renders nothing on static screens: splash, map, photo, modals, pause, hidden tab. Fixed-rate tiers skip animation-frame ticks.
- Cached scenery: sky gradient + horizon + moon (per theme/size), skyline strip, truss strip, and the sign/platform/speaker-cabinet strip (the blurred sign text was the single most expensive draw). Animated parts stay live and are drawn in the original order between the strips.
- Particles are batched into one path and one stroke per colour/alpha/width bucket (alpha in sixteen steps, width in half pixels).
- The vanity bulbs in the dressing room use one prerendered glow sprite instead of thirty blurred fills per frame.
- Muting stops the music scheduler; crackle audio nodes are capped per tier.

### Gate 3 — layout

- `syncLayout()` is the only code that measures the viewport or the DOM. It runs at most once per frame, when something asked for it: window resize, orientation change (plus three follow-up frames and two timers for late Safari layout), `visualViewport` resize and scroll, `ResizeObserver` on the top bar, rails, controls, cauldron and dressing canvas, and explicit requests when bottles appear or a screen opens.
- The canvas, the game UI, the dressing room and the map are pinned to the visual viewport through `--app-x/y/w/h`, so pointer `clientX/Y` and drawing share one offset.
- `LAY` holds the snapshot: viewport, control top, playfield, rail/control/cauldron/dressing rectangles. The cannon, the dressing room, drag hit-testing and the debug overlay all read it. Nothing calls `getBoundingClientRect()` inside the draw loop any more.

### First device pass (2026-09-06, iPad 5, Safari, preview deployment)

Jof ran the preview on the device with `?perf=1`. What the overlay showed, and what changed as a result:

- **The tier guess was wrong.** The iPad reported more than two cores, so the game started on `full`, stepped to `medium` (60 fps idle in the dressing room, 24 fps when tapping), then to `legacy`. Fixes: the guess also treats the 1024 x 768 CSS-pixel panel (iPad 5 / Air 2 / mini 4 / Pro 9.7 generation) as legacy; an Apple touch device that misses the gate now steps straight to legacy rather than via medium; and the tier the step-down settles on is remembered in `localStorage` (`kb_quality_auto`) so the next launch starts there.
- **Dressing room at legacy: 30 fps, p95 34 ms, 1 ms of JS work per frame, 27 MiB of canvases, 24 ms input-to-frame.** Meets the gates.
- **Stage at legacy: 30 fps nominal but p95 71 ms, dropping to 14-24 fps in play, with only 6 ms of JS work per frame.** The time is GPU raster of the additive gradient fills, not game logic. Fix: on legacy, the flashes, the lightstick halo, the cannon muzzle glow and the three spotlight cones are prerendered sprites blitted with alpha (`Q.cheapGlow`), bubbles are a flat fill, the five screen-sized disco-ball rays are skipped, and the cauldron's CSS swirl and bubble animations are off. Still to be confirmed on the device.
- **Round icon buttons drew their emoji off-centre to the right.** iOS native button styling; buttons now have `appearance:none`, no padding, and flex centring.
- **Outfits differed between devices.** The eight-look schedule per girl was dealt at random per device and stored locally. Jof's intent was one deal, fixed forever. The schedule dealt on 2026-09-06 is now a constant in the code and a locally saved deal is ignored; `buildSchedule()` remains for a deliberate re-deal.
- **"White background on Sol's clothes."** The layers render clean on a dark background (checked offline), so this is most likely a white swatch applied to the bottoms in that device's saved look. Confirm with the reset swatch; if the skort stays white with the reset, it is a device-only rendering fault and needs a screenshot rather than a photo.

## Measured results

Headless Edge on a desktop CPU with software GL, 1024 x 768. Frame rates here are relative comparisons only; they say nothing about the iPad. Baseline is `main` at d5ed9d0.

| Scenario | Baseline | After, tier full | After, tier legacy |
|---|---|---|---|
| Finale, level 5, 15 s, DPR 1: fps / p95 ms / peak particles | 25.9 / 83.3 / 2549 | 33.1 / 50.0 / 2579 | 30.0 (locked) / 33.4 / 688 |
| Free play, 71 launches in 20 s, DPR 1: fps / p95 | 26.4 / 66.6 | 30.0 / 50.1 | 30.0 (locked) / 33.6 / 700 |
| JS work per rendered frame, p95 (stage) | not measured | 5-9 ms | 2-3 ms |
| Slowest colour change, dressing room | 372 ms | 16 ms | 17 ms |
| Slowest single item change, dressing room | 19 ms | 53 ms (first full-size decode of a new outfit) | 50 ms |
| Surprise (random outfit), slowest of five | 117 ms | 3 ms | 4 ms |
| Frame p95 during the colour loops | 284 ms | 100 ms | 183 ms |
| Canvas backing store after a full dressing sweep (post-GC) | 448 MB | 88 MB | 47 MB |
| Canvas backing store after one girl's categories | 114 MB | 63 MB | 21 MB |
| Rotation matrix (4 steps, geometry inside viewport) | pass | pass | pass |
| Uncaught exceptions / console errors, all scenarios | 0 | 0 | 0 |

Full tier at DPR 2 is omitted from the table on purpose: on headless software GL the 2048 x 1536 raster dominates (interval 50-100 ms against 8 ms of JS), so those rows swing by a vsync step between identical builds and say nothing about the iPad's GPU. The legacy frame numbers are the fixed 30 Hz cadence with a comfortable margin under it. The remaining full-tier bytes are mostly the DPR 2 sky cache and stage strip, which are 4x smaller on legacy. The 89 permanent quarter-size crops account for the higher canvas count (about 3 MiB).

## Running the harness

The harness lives outside the repo (Node 22, headless Microsoft Edge over the DevTools protocol, no packages):
`%LOCALAPPDATA%\Temp\claude\c--hirednerds-portfolio\769df0b0-3828-450d-b569-3572d8ada45b\scratchpad\kb\` (see its README).

```
node harness.mjs --dir C:\hirednerds-portfolio\public\fireworks --out reports\x --quality full
node harness.mjs --dir C:\hirednerds-portfolio\public\fireworks --out reports\y --quality legacy
node make-baseline.mjs --repo C:\hirednerds-portfolio --out baseline   # then --dir baseline
```

Always pass `--quality`: on headless software GL the adaptive step-down fires within five seconds and the DPR assertions drift. Scenarios: `dressing`, `stage-free`, `stage-free-dpr1`, `stage-finale`, `stage-finale-dpr1`, `rotation`, `screenshot-export`, `memory-probe` (`--only a,b` to subset). Each is a fresh browser profile.

For hand testing: `?auto=1` skips the splash and exposes `window.__kb`; `&dress=1` stays in the dressing room; `&level=N`; `&finale=1`; `&perf=1`; `&layoutDebug=1`; `&quality=legacy`.

## Gate 4 — physical-device validation (outstanding)

Connect the iPad to Safari Web Inspector on a Mac and record CPU and rendering timelines. Do not rely on `performance.memory`; it is not available there.

1. Confirm the tier: open with `?perf=1`; the overlay must read `tier legacy` without `(auto)` on the iPad 5. If it reads `full`, note `navigator.hardwareConcurrency` and `maxTouchPoints` and fix `guessTier()` rather than pinning.
2. Safari portrait and landscape; Add to Home Screen portrait and landscape.
3. Browser bars expanded, collapsed, and changed during a level. With `?layoutDebug=1`, the viewport box must hug the visible area and the cauldron box must sit on the cauldron.
4. Rotate portrait-landscape-portrait twice; open the name editor so the keyboard shows, then dismiss it.
5. Visit every wardrobe category, select every visible item, change every colour; the overlay's `canvases` line must stay under 120 MiB and no tile or puppet may go blank.
6. Complete enough levels to exercise outfit unlocks and all three performers.
7. Maximum-input stage and the full finale: sustained 30 fps, interval p95 at or under 40 ms, input-to-frame at or under 100 ms.
8. A 10-minute loop covering dressing, stage, map, pause/resume, mute/unmute, background/foreground and screenshot export: no reload, no blank canvas, no tab death.
9. Every interactive control inside the safe area with a 44 x 44 CSS-pixel target.

Attach the overlay readings and Web Inspector captures to this file. Tune `TIERS.legacy` only from these measurements; the adaptive step-down is a safety net, not a tuning tool. If the stage still misses 30 fps at legacy, the next levers in order are: `perBurst` and `maxP` down, `crowd` and `stars` down, then a 24 Hz `hz`.

## Trade-offs to know about

- Legacy tier is allowed to look simpler: no blurred glows, no blur behind panels, fewer crowd members and stars, no pulsing buttons. Full tier is visually unchanged apart from two things too small to see: particles fade in sixteen alpha steps, and the screen flash now sits over the moon rather than under it.
- Adaptive step-down changes DPR mid-level (the canvas is reallocated once). It never steps up.
- If `layers.json` is missing, bounds are scanned at runtime with a transient full-size canvas per layer; slower first paint, same result.
- Composites are cached per look, blink state and scale; a partial composite (layer still downloading) is rebuilt each frame until complete, which only happens for a garment picked before its file arrived.

## Deploy notes

`tools/deploy-kpopboom.sh` now copies `layers.json` and refuses to publish without it. Rebuild it (`node tools/build-glowgirl-layers.cjs`) whenever a layer PNG changes; `--check` is a cheap pre-deploy guard. `GG_V` was bumped to `20260905a`.

## Source-art defects noticed, not fixed here

Recorded with reproduction and a trial fix in `HEADS-HAIR-WARDROBE-TASK.md`: four Hana/Jia hair rear layers clipped at the top canvas edge, the empty `face-moondrops-front`, and the opaque black outline baked into `bottom-pixelpetals-front` and `top-bloomruffle-front` (the "black on Sol's clothes" report; identical in the old build). Jof chose to leave the art untouched for now.

## Brief for whoever runs Gate 4

> Check out `ipad5-optimisation`, serve `public/fireworks` over HTTP to the iPad (or deploy the branch to a preview), and run the Gate 4 list above with `?perf=1` and `?layoutDebug=1`. Record the overlay readings per step and the Web Inspector timelines for the finale and the 10-minute run. Do not edit source art, add character-specific offsets, or tune `TIERS` from desktop numbers. If a gate fails, report the overlay line and the step; if all pass, this branch is ready to merge and to deploy with `bash tools/deploy-kpopboom.sh`.

## Primary references

- Apple, iPad (5th generation) technical specifications: https://support.apple.com/en-us/111960
- Apple, Inspecting iOS and iPadOS: https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios
- Apple, Optimizing your website for Safari: https://developer.apple.com/documentation/webkit/optimizing-your-website-for-safari
- WebKit, Safari 15.4 viewport units: https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/
- WebKit, Safari 16.4 OffscreenCanvas 2D support: https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- WebKit issue 242758, dynamic viewport regression history: https://bugs.webkit.org/show_bug.cgi?id=242758
