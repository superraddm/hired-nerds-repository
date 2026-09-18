# Messy Studio: comparison of the deployed game and independent design

## Verdict

Keep and improve the deployed implementation. The central painting, flicking and paint-carrying marble mechanics are sound foundations. The next work should improve preservation of artwork, consistency of Undo, interruption handling and clarity of controls before adding more materials.

The independent brief is not an acceptance checklist for decisions subsequently changed by the user. Fable's records explicitly describe the user's move away from tilt and timed marbles. Those later decisions supersede the earlier ten-second proposal for this implementation. This review does not recommend reinstating tilt or the countdown.

No game source was changed and nothing was deployed during this review. No external model was asked to review it.

## Evidence and limits

Read both design briefs, the shorter development rules, the complete studio source and both existing browser harnesses. The deployed `studio-lab.html` returned HTTP 200 and matched the local 50,356-byte file exactly. Its SHA-256 was `599e9d52bde95047ebf3f29a3ae715568658e9adb96792d0e2f0fba038bbaefb`.

Ran the existing touch harness in isolated desktop Chrome with an emulated 768 × 954 touch viewport. Its reported checks confirmed rotation preserves bitmap dimensions, pinch navigation does not leave paint, drawing remains aligned after zoom, fourth-marble replacement, stopping on another tool, resuming via marble touch, eventual rest and removal. No page errors were reported. These are desktop browser behaviour checks, not an iPad performance measurement.

Additional isolated event checks reproduced the Undo/pigment issue, cancellation creating a splat, and missing stroke endpoints. Measured the small-screen buttons at 40 × 40 CSS pixels. Temporary results and screenshots are in `.wrangler/studio-review/`. `undo-confirmation.json` is the definitive Undo reproduction; it repeats that check after allowing the toolbar's startup click-suppression interval to pass.

The actual fifth-generation iPad remains necessary to assess the revised marble engine's frame times and responsiveness. Neither desktop timing nor viewport emulation establishes that result.

## What agrees, and what should be retained

| Area | Independent brief | Current game | Assessment |
|---|---|---|---|
| Core activity | One blank picture; Paint, Flick, Marbles and Eraser | All four work on the same picture | Strong agreement; preserve it |
| Brushes | Round, flat, crayon and sponge | Four visibly distinct implementations and sample-stroke icons | Keep; the chisel brush is an effective interpretation |
| Colour | Up to 16 colours; bucket of 1–8 | 16 swatches; bucket of 1–8 | Matches the essential scope |
| Splats | Gesture-driven generated arrangements with bounded complexity | Procedural blobs, lobes and droplets, batched by colour | Keep the procedural approach; no bitmap-library rewrite is justified |
| Paint pickup | Local smear and carried paint; blank paper is not white pigment | Separate carried-load canvas per marble; transparent paper does not replace its load | Good, compact implementation of the intended effect |
| Persistence of paint | No drying deadline | Paint remains available for pickup | Keep; supports unhurried play |
| Page geometry | Stable logical paper, resizing only changes its view | Fixed 1600 × 1200 sheet with CSS rotation, zoom and pan | Keep the fixed-sheet architecture and approved rotation behaviour |
| Idle work | Stop animation when inactive | Marble animation sleeps when released marbles stop | Addresses the original reason for the time limit |
| Marbles | Ten-second tilt/touch releases | Touch-driven marbles remain available until removed | Deliberate later user decision; keep the current interaction |
| Preservation | Local recovery, export, longer Undo and Redo | No storage/export; four canvas snapshots; no Redo | Largest product gap |
| Calm support | Visible sound toggle, quiet effects, optional invitations | Entirely silent; no invitations | Silence is coherent, but does not provide the planned audio cues |

The canvas-load marble technique is simpler than the separate auxiliary pigment map proposed in the independent brief. Retain it unless real-device measurements identify a reason to change. A more elaborate representation is not automatically better.

## Confirmed functional problems

### 1. Undo restores the picture but leaves paint inside a marble

Source: `studio-lab.html:206`, `studio-lab.html:207`, and the marble load established around `studio-lab.html:411`.

Reproduction: paint a red stroke, drag a marble through it, Undo the marble movement, then Undo the original stroke. The sampled canvas is empty, but the marble's load remains coloured. Dragging that marble over the blank paper deposits red again.

The isolated check reported 270 sampled painted pixels after the original stroke, 441 after smearing, 270 after the first Undo and zero after the second. The retained load had alpha 218; moving the marble again produced 153 sampled painted pixels. These figures are diagnostic samples, not total area counts.

Recommendation: define and restore the complete action state. At minimum include the affected canvas, marble load and the marble state needed for consistent continuation. Clearing all carried paint on Undo would avoid this particular ghost-paint symptom but would not provide an exact reversal of a previously loaded marble action. New-picture Undo should also have an explicit policy for removed marbles.

### 2. A cancelled flick can become a completed splat

Source: `studio-lab.html:315` and `studio-lab.html:325`.

`pointerup` and `pointercancel` share a handler. The fast-flick branch requires `pointerup`, but the stationary/held branch does not. A synthetic down/cancel sequence on an empty sheet produced paint.

Recommendation: handle cancellation separately. Remove the temporary preview and release input ownership without adding a final splat or launching a held marble. Decide explicitly whether already drawn dribble marks remain or the unfinished flick is rolled back. Browser cancellation can accompany rotation, application switching and other interrupted input; it is not equivalent to an intentional release. See [MDN pointercancel](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event).

### 3. Smoothed strokes can stop before the final finger location

Source: `studio-lab.html:315` and `studio-lab.html:347`.

Round/crayon smoothing draws towards the midpoint between samples, but release does not finish the remaining segment. In a sparse-event check from paper x=300 to x=500, the midpoint was painted and the endpoint was transparent. Slow, densely sampled movement makes this less obvious; a quick short stroke can expose it.

Recommendation: finish the pending stroke on intentional release. Also interpolate sponge stamps by distance rather than stamping only once per movement event, so a busy frame does not produce a large unintended gap.

## Missing protections and reliability work

### Saving is the highest-value addition

There is no local save or recovery path. Reloading creates an empty paper. The Back link leaves the page without preserving the artwork, although a browser may sometimes retain a previous page in memory. That temporary behaviour is not a saving feature.

Add local recovery after completed actions and a deliberate Save picture action. Use idle/debounced storage work; do not rely on a last-second page-exit save. Default exports should contain paper and paint, leaving controls and transient marble objects out. A deliberate option could include marbles later if desired.

Do not silently remove export just because one sharing API is absent. A picture preview/download fallback is preferable. When persistent storage is unavailable, retain painting for the current visit and provide an understandable adult-facing notice.

### Interruption and idle behaviour are incomplete

There are no application visibility/pagehide handlers. The browser may suspend animation automatically, but the game does not explicitly freeze and clear input state when hidden. A marble held without moving still keeps the animation loop active because `moving()` treats any held marble as moving. A debug readout also updates twice per second in the ordinary player page even when hidden by CSS (`studio-lab.html:500`).

Recommendation: explicitly stop simulation and clear interrupted gestures on backgrounding; make return behaviour deliberate. Keep diagnostics confined to lab mode or update them on demand. Stop scheduling frames for a held marble that has reached its unchanged target, restarting on movement or another active marble. Browser background throttling is helpful but does not define the game's intended pause behaviour: [MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

### The harnesses are diagnostics, not yet pass/fail regression tests

The existing scripts log booleans and errors, then exit successfully unless the script itself throws. They do not assert that `paperUnchanged`, `strokeLandsUnderFinger`, or the other reported outcomes are true, nor fail simply because the collected page-error list is nonempty.

Keep the useful browser checks, but make failures fail. Add focused checks for cancellation, complete Undo state, palette limits and rotation transforms. Pure physics tests can cover stopping, edge constraints and collision behaviour without depending on browser timing.

## Interaction choices to review with the child

### Pictures alone are not necessarily self-explanatory

The sample-stroke brush icons work well, but plus-page, crossed marbles, flick and fit-to-page icons remain learned symbols. Fable's brief also assumes reading ability more strongly than the parent's earlier description supports. Continue designing without relying on comprehension of labels.

Prefer a small contextual picture cue and optional quiet spoken help. Avoid a permanent tutorial, a busy character or repeated unsolicited narration. There is no evidence yet that a separate mindfulness mode is needed: predictable control, easy repetition and reliable recovery contribute more directly to calm play.

### Palette visibility should follow usefulness

All 16 swatches are still visible during Marbles in the ordinary page. Choosing one changes the future brush colour; it does not colour a marble. That is a misleading affordance and occupies useful space. Eraser has a similar issue. Hide or clearly de-emphasise irrelevant controls.

For Flick, there is no separate bucket illustration showing its contents; the numbered swatches carry that responsibility. An illustrated bucket summary could make the single-colour/multi-colour distinction clearer without extra text. The ninth-colour replacement rule is a deliberate current choice, but it changes an existing selection automatically. Watch whether that surprises the child before changing it.

### Small controls and pinch need observation

Phone buttons and swatches shrink to 40 CSS pixels, below the independent brief's 48 minimum and 56 target. Reflowing or collapsing settings would be preferable to shrinking every target. The slider has no live-size sample, and all four brushes share one remembered brush size rather than a separate size each.

A second touch initiates navigation and may undo a recently started mark. A resting palm can therefore change from painting to zooming and remove a mark. Keep the user's requested zoom capability, but watch for this specific failure in real use. An optional explicit navigation state may be a better fallback than progressively complicated palm heuristics.

### Marble surprises are design trade-offs, not automatically defects

Returning via the marble toolbar adds another marble; at three it replaces the oldest. Touching a marble is the alternative that selects without adding. This is documented as the user's chosen rule, so it should not be silently redesigned.

The ten randomly selected marble kinds also make an identical flick produce very different movement. That can be enjoyable experimentation, but “heavy” must be visually understandable enough that a barely moving cannonball does not appear broken. Observe this before expanding the material system.

Painting near a resting marble can select it because the hit region is deliberately larger than the visible ball. Check whether generous grabbing helps more than it interrupts intended painting. Again, observation should guide the adjustment.

## Performance assessment

The revised engine reads bounded patches before writing the frame's trails. That is a sensible reduction in repeated read/write alternation and should be preserved while measuring. The claim that full-sheet copies inside WebKit caused the original slowness remains a hypothesis, not an established diagnosis. The 256-pixel minimum for scratch surfaces is also an implementation assumption worth measuring rather than a universal rule.

Likewise, moving paint using `drawImage` is not automatically faster on every device than a carefully bounded pixel operation. Neither approach should become a project-wide prohibition without representative measurements.

The current sheet and four raw RGBA undo images account for about 38.4 MB before scratch surfaces, browser compositor allocations and other overhead. That arithmetic does not prove memory safety on the target device. Four full-sheet copies also happen at gesture starts, where a pause is particularly noticeable.

Before increasing resolution or adding oil/water/smudge, measure actual iPad input latency, frame-time spikes and repeated Undo/grab behaviour. Compare the present renderer with smaller working patches or reduced resolution only if needed. Changed-region history should have a memory budget and a full-snapshot fallback for actions that modify most of the paper; “rectangles” alone do not guarantee a large saving.

## Recommended next order

**Subsequent user feedback:** the latest deployed marbles are now confirmed more stable
on the real iPad. The repeated-patch trail appearance is accepted. Treat that as the
current baseline, not a blocker requiring a renderer rewrite. Sound has also been elevated
to an explicit requirement for the next revision: soft, crisp, clear material sounds,
carried forward into future liquid viscosities and charcoal over stencils. See
[the sound direction](messy-studio-sound-direction.md). The initial ordering below records
the review before this feedback; sound should now be planned alongside the reliability
work and before additional materials, with an on-device performance comparison.

1. Fix full-state Undo, cancellation and unfinished strokes; make automated failures visible.
2. Add local picture recovery and export, plus explicit background/interruption behaviour.
3. Measure the revised marble engine on the actual iPad and address the measured bottleneck.
4. Improve target sizes, contextual palette visibility and a small number of picture-led cues.
5. Observe the child's use of pinch, marble replacement and varied weights before changing those approved rules.
6. Add optional gentle sound and a restrained art pass. Then consider the already requested extra materials.

Preserve a reproducible record of the current release before editing it. The studio and its test scripts are untracked in the working tree; deployment matching verifies what was reviewed, but does not replace a durable source snapshot. Committing or publishing remains outside this review task.
