# Nook's Messy Studio: development brief

Updated 17 September 2026. Written for whoever builds the full game (Fable, Codex or
Sonnet) and for Jof to check decisions against. It records what has been decided, what
was tried and dropped, and what is still open. The playable lab is the reference for
feel; this brief is the reference for rules.

- Lab page: `public/fireworks/little-patterns/studio-lab.html` (drawing plus local sound/storage scripts)
- Live: https://kpopboom.party/little-patterns/studio-lab.html, reached from the **Paint**
  tab in Nook's Garden; the back arrow returns to the garden
- Lab read-out and Test picture button: add `?lab=1`
- Checks: `node tools/test-messy-studio-lab.cjs 1024x698 ipad` (touch) and
  `node tools/test-messy-studio-lab-mouse.cjs` (mouse); both need
  `node tools/serve-fireworks.cjs 8788`

## Aim

A fun, mucky, entirely digital painting game for Arthur, in the Little Patterns family.
A blank sheet, paint, and no right or wrong result. It must run smoothly on the iPad 5.
Four ways of making marks work on the same picture: **Paint**, **Flick**, **Stamps** and **Marbles**.

## Decisions so far

### Controls
- Every control is a simple picture, never a word. Words live only in `aria-label`.
- Only the chosen tool's own controls are shown (brush types for Brush, and so on).
- Up to 16 colours. One size slider for the current tool; each tool remembers its size.
- Undo is always visible. **New** is undoable, so it never asks "are you sure?".
- A back arrow returns to Nook's Garden.
- Controls act when the finger **lifts** on them (pointer up), not on the browser's click.
  Android Chrome drops the click of a tap made soon after a fast flick on the sheet, so tool
  buttons seemed dead straight after flicking paint or a marble. Keep this in the full game.

### Paint
- Four brushes that make visibly different marks: round, flat chisel (thick one way,
  thin the other), crayon (grain fixed to the paper, so going over it fills in) and
  sponge (blotchy stamp). Plus a rubber.

### Flick
- Splats are generated, not picked from a picture library: one irregular blob, necked
  lobes and droplets, filled once. This is cheap (a splat costs nothing after it lands)
  and never repeats. A bitmap library would cost more and look samey.
- The iPad 5 reports no finger pressure, so gestures use speed, direction and hold time:
  tap = small splodge; hold = growing puddle (with a preview); flick = paint thrown ahead
  of the finger, stretched along the throw; slow drag = a dribble trail.
- The flick bucket holds up to 8 colours. A ninth pushes the oldest out; there is never
  an error state. Colours stay separate in a splat rather than mixing to brown.

### Potato stamps (added 18 September 2026)
- A fifth tool: a library of cut-potato prints. Five shapes (star, circle, square, rectangle,
  triangle) and five animals (cat, dog, horse, crocodile, fish), each a silhouette.
- The size slider scales the print from 8% of the sheet's short side up to the whole of it,
  so a print can never be bigger than the sheet. Each print is turned a little at random.
- **How long the press lasts sets how much paint goes down**, like a real potato print:
  a tap gives a crisp, mottled print; holding adds a coat about every tenth of a second, so
  the fill goes solid, paint squeezes past the edge into a thicker and more ragged outline,
  and blotches appear. It stops building after about a second and a half.
- A print stays where it was pressed (moving the finger does not drag it). Each press is one
  Undo step. Every coat is composed off the sheet and laid on, so the texture never punches
  holes in paint already there and nothing is read back from the sheet.

### Marbles (current rules, 17 September 2026)
- Tapping the Marbles button drops **one** marble at a random place on the sheet.
- Up to **three** marbles. A fourth replaces the first, a fifth the second, and so on.
- Each marble is one of **ten kinds**, chosen at random as it lands, differing in size,
  weight, speed and bounce (tiny glass to cannonball, plus a light bouncy pearl and a big
  light wooden one). Heavy ones take less of the finger's speed, roll further and shove
  light ones aside. Their looks are neutral so no marble seems to "be" a paint colour.
- Marbles **start with no colour**. They only move paint already on the sheet, so on a
  blank sheet they leave nothing: the player has to add colour first.
- Marbles **stay on the sheet**. They never move by themselves. They move only when a
  finger (or mouse: click and drag) drags or flicks them, and they roll to a stop.
- Nothing is locked while marbles are out. Choosing any other tool **stops them dead**.
  Touching a marble switches back to Marbles and any that were rolling carry on.
- A **clear marbles** button (marbles with a red cross, shown in the Marbles row) removes them all
  at once; Jof asked for this on 17 September. **New** clears them too.
- Each grab-and-flick is one Undo step.
- Cost: the frame loop only runs while a marble is held or rolling. Marbles at rest cost
  nothing, which is why the earlier time limit is no longer needed.

### The sheet, turning and zooming (decided 17 September 2026)
- **One fixed sheet on every device: 1600 x 1200 pixels, for the whole life of a picture.**
  It is never re-made to suit a screen and never re-drawn on a resize. What dictates the
  size is the weakest target: the iPad 5 and Safari's cap on canvas memory (the sheet is
  7.7 MB; with four Undo copies it stays under 40 MB). Every mark, splat and marble is
  sized in sheet pixels, so a picture is the same picture on a phone, tablet or desktop.
- **The sheet turns with the device, like a real piece of paper.** Its long side stays
  along the device's long side, so it fills the space either way up and is never shrunk by
  a rotation. A picture made in portrait is sideways to the viewer in landscape, exactly as
  paper would be. The browser's orientation angle is used when it offers one; otherwise
  the shape of the space decides. There is no orientation lock.
- **Pinch to zoom, two fingers to carry the sheet. These are the only ways to move around
  it.** Zoom 1 shows the whole sheet (it cannot be zoomed out further or carried off
  screen); maximum zoom is 5. Pinching all the way out is always the way home, and a
  "show the whole sheet" button appears only while zoomed in. Mouse: wheel zooms about
  the cursor; a trackpad slide carries the sheet.
- One finger makes marks; a second finger means "look around". If the first finger had
  only just started a mark when the second landed, that mark is quietly taken back.
  Painting starts again once every finger has lifted. (This replaces the earlier rule
  that every finger paints independently.)
- Finger speed for flick gestures is judged on the glass, not on the sheet, so a flick
  feels the same whatever the zoom.
- On a short, wide screen (a phone on its side) the controls run down the left and the
  colours down the right, so the sheet gets the full height.
- **Device rule (Jof):** this is a browser game and the device or browser could be
  anything. Do not depend on features that may not exist everywhere: no orientation lock,
  no sensors, no full-screen tricks, no "install to home screen" behaviour. If a nicety
  is used where available (the orientation angle), it must degrade to something sensible.
- **New** clears the sheet (undoable) and returns to the whole-sheet view. The first lab
  re-drew the picture into a new canvas on every rotation, which shrank it each time, and
  a later version showed a tiny upright sheet on a phone turned sideways. Do not bring
  either back.

## Trialled and dropped: tilting the device to roll the marbles

Tried on 17 September 2026 on Jof's Android phone over several rounds. It worked, and the
paint-dragging looked good, but it was **too fiddly to deliver reliably**, so the
accelerometer is out for now. What went wrong:

1. **The screen turns when the device is tilted.** A web page cannot switch auto-rotate
   off. Safari on iPad and iPhone offers no lock at all. Android Chrome offers one only
   in full screen, and on Jof's phone it still rotated until he locked rotation in the
   phone's own settings. The best the page could do was a written warning for grown-ups.
2. **Permission and connection rules.** iOS only gives tilt data over HTTPS and after a
   system prompt that an adult has to answer, triggered by a tap.
3. **"Level" is hard to guess.** Nobody holds a tablet flat, so level had to be inferred
   from how it was held around the moment of pressing Go. Marbles sometimes sat still
   until pushed with a finger.
4. **Marbles moved in unison**, because tilt pulls them all the same way. They needed
   invented differences to look independent.
5. **Knock-on rules.** Tilt forced a timed run (10 then 20 seconds) with marbles rolling
   off at the end, a countdown, locked tools during the run, and extra sliders. All of
   that is gone with it.

If tilt is ever revisited, treat it as an optional extra on top of finger flicking, never
the only way to play, and test on the real iPad before building any interface around it.

## Performance: rules for anything that touches the sheet

Jof's iPad 5 test (17 September): everything was responsive **except the marbles, which
rendered slowly**. His yardstick is fair: Kai's Power Goo pushed pixels around on a 386,
and an iPad 5 is vastly stronger. The pixel work here is tiny. The cost was in how the
canvas was driven, and the same trap is waiting for every future "wet" tool.

**What was wrong.** The first marble engine read from the sheet and wrote to the sheet for
every step of every marble, seven draw calls a step. Safari keeps the sheet in one large
surface and may copy the whole of it each time it is read after being written. That
meant several full-sheet copies per frame.

**The pattern to use instead (now in the lab):**
1. Work out the physics for the whole frame first, noting where marks are due.
2. **One read of the sheet per moving thing per frame**: copy the box its track covers
   into that thing's own small scratch canvas. All reads happen before any write.
3. Then only writes. For a marble: one clip to the track (a chain of circles), one fill to
   thin the paint along it, and per step two small draws (scratch to load, load to sheet).
4. No mask compositing per step, no intermediate stamp canvas, **no `getImageData` in
   play**, positions rounded to whole sheet pixels so trails stay sharp.
5. Small canvases are never below 256 px (very small ones may not be accelerated in WebKit).
6. The frame loop runs only while something is moving or a held marble is approaching its target. Stationary holding sleeps until the finger moves again.
7. A self-adjusting quality level widens the spacing between steps if a device's frame
   time slips (95th percentile over 27 ms, or over 9 ms of script work). It never climbs
   back up mid-session. The lab read-out (`?lab=1`) shows the level and the timings.

Status: the user has now confirmed that Fable's latest deployed marble engine runs more
stably on the iPad. The repeated-patch appearance of the drag marks is visible but accepted.
Preserve that performance/quality balance as the baseline for future changes. This is a
real-device usability confirmation, not a new instrumented frame-time measurement.

- **Pixel budget**: the fixed 1600x1200 sheet (1.9 million pixels). Zoom and turn are a CSS
  transform of that one bitmap, so they cost nothing to paint.
- **Undo/Redo** share four history slots. Each stores the sheet and small copies of the
  marbles' carried paint, positions and kinds. Undo restores marbles at rest. New and
  marble removal are reversible; a stationary marble tap does not consume history.
  Four raw sheet copies plus the live sheet are about38.4MB; an Undo/Redo swap briefly
  needs a fifth history surface (about46.1MB before other surfaces). Released canvases
  are shrunk immediately. Changed-region history remains a future optimisation.

## Planned later: more materials, and sound

Jof wants, in time: **water, charcoal rubbing (including over a stencil), oil**, and
**soft, crisp, clear, ASMR-inspired material sounds**. Sound is an explicit part of the
mindfulness and creativity brief, including gentle marble clacks, brush strokes and paint
flecks landing; it should be included in the next revision, not left behind later materials.
See [the detailed sound direction](messy-studio-sound-direction.md).
All of it has to run on the slow end, so design them from the same cheap parts rather
than as separate engines:

- **Oil**: the marble engine driven by a finger, with the load topped up from the chosen
  colour (the "dipped" load that was tried and removed for marbles). Thick, opaque, drags.
- **Water**: the same engine with no colour of its own, strong pick-up and weak lay-down, so
  it pulls and thins what is there. Optionally a soft low-alpha halo stamp for a bleed.
- **Charcoal rubbing**: the crayon's page-fixed grain pattern with a coarser, darker
  grain, plus a light pass of the smudge engine when rubbed back and forth.
- **Smudge finger**: the engine as it is, under a finger instead of a marble.
- All of these obey the rules above: one read per frame, then writes; no per-pixel script
  loops on the sheet; nothing that needs a particular device or browser.
- **Sound**: material-specific, quiet and responsive, with the family's visible Sound
  button. “Muted” describes the subdued character; sound starts on by default after an
  enabling interaction. Use lightweight generation and reusable textures, assessing the
  actual sound before ruling out a small original/licensed recording library. No continuous
  music, harsh peaks or delay to drawing. Future viscosities and charcoal inherit the same
  contact-driven sound and lifecycle rules in the detailed sound direction.

## Measured so far

Desktop headless Chrome only: about 60 fps with three marbles on the 1600x1200 sheet,
0.3 ms of script work per frame. Jof's Android phone (S24 Ultra) showed 59.9 fps in an
earlier round. On the iPad 5 the first marble engine was visibly slow; the user now reports
that the rebuilt version is more stable and its slightly reduced visual quality is acceptable.
No new numerical iPad timing was supplied with this confirmation.

## Not built yet

- Art pass on the splats, marbles and icons; Nook's presence on the page.
- Sound is now built; physical-device listening remains necessary. See [sound build](messy-studio-sound-build.md).
- Device-only recovery and Save picture are now built. A single IndexedDB draft is saved
  after completed activity, not during marble animation. Browser storage may be unavailable
  or cleared; PNG export is the deliberate way to keep artwork. Recovery restores paint,
  without marble objects or Undo history. The export contains paper and paint only.
- Rectangle-based Undo (see above).
- A finger-smudge tool would be nearly free: it is the marble engine driven by a finger.
- Player profiles, as in the other Little Patterns games, if wanted.
- Rename the page from `studio-lab.html` once it stops being a lab, and update the
  Paint link in `garden.html` and the staging allow-list.

## Open questions for Jof

- Should marbles be included when a picture is saved, or always left out?
- Is the "show the whole sheet" button welcome, or should pinching out be the only way back?
- Two-handed painting was given up for pinch-zoom. If Arthur rests a palm on the glass it will
  read as a second finger; watch for this on the iPad.
