# Nook's Messy Studio: Fable's brief, for review

Written 18 September 2026 by Claude Fable 5.1, who built everything described here.
It is addressed to the developer who will review it. I have not read
`docs/messy-studio-independent-design-brief.md`; I assume that is your version, and I
kept away from it on purpose so that this one is mine.

What I am asking of you: tell me where I was right and where I was wrong. I have tried
to make that easy by separating what is measured from what is reasoned, by saying where
I changed my mind, and by listing what I would do differently. Where I think a decision
was good I say so and give the reason. Where I am unsure I say that too.

The short rule book is `docs/messy-studio-brief.md`. This document is the long form: the
goal, the audience, the history, how the thing works, and my case for it.

---

## 1. What is deployed, exactly

| Thing | Where |
|---|---|
| The game (one file, about 50 KB, 520 lines) | `public/fireworks/little-patterns/studio-lab.html` |
| Live | https://kpopboom.party/little-patterns/studio-lab.html |
| How a player reaches it | the **Paint** tab in Nook's Garden (`garden.html`); a back arrow returns |
| Developer read-out and Test picture button | add `?lab=1` |
| Touch test harness | `tools/test-messy-studio-lab.cjs` |
| Mouse test harness | `tools/test-messy-studio-lab-mouse.cjs` |
| Rule book | `docs/messy-studio-brief.md` |
| Screenshots | `docs/messy-studio-lab-*.png` |

Changes made to existing files so the game could ship and be reached:

- `garden.html`: one extra link in the activity tabs, `<a class="feelings-link paint-link" href="studio-lab.html">Paint</a>`.
- `garden-live.css`: the tab grid went from five to six columns at 700 px and wider; below
  that the Feelings and Paint links share a row (`grid-column: span 2`).
- `tools/stage-little-patterns.cjs`: `studio-lab.html` added to the deploy allow-list.
- `index.html`, `garden.html`, `blocks.html`, `feelings.html`: asset version string bumped
  from `20260917h` to `20260917i` so devices would not serve the old tab styles from cache.

**State of source control, stated plainly: none of this is committed.** The live site is
ahead of `main`. That was already true before I started (the Feelings game was deployed
from an uncommitted tree by an earlier session) and I made it worse. I raised it with
Jof several times and did not resolve it, because he never asked for a commit and the
project's rule is to commit only when asked. I still count it as a process failure. A
reviewer should treat "commit what is live, in reviewable pieces" as the first job.

How it gets deployed: `bash tools/deploy-kpopboom.sh` stages an allow-listed copy of
`public/fireworks` and uploads it to Cloudflare Pages with `wrangler` (direct upload, no
git integration). Before the first deploy of this work I compared 36 live files with the
working tree, byte for byte, so that deploying from a dirty tree would change nothing
except the new page. After every deploy I re-fetched the changed files and a sample of
untouched ones and compared hashes. I am confident the deploys did only what I intended.

---

## 2. The goal and who it is for

**The player is Arthur.** He is five, autistic and non-verbal. He reads and spells well
and types fluently; he speaks through a Grid AAC device. He plays on an **iPad 5** (2017,
A9, iPadOS 16, Safari), which is the slow end of what we must support. The game belongs
to the *Little Patterns* family his father Jof has been building for him: quiet browser
games with no timers, no lost lives, no rewards, no locked progression, no accounts and
nothing sent to a server.

**The goal, in Jof's words:** "a fun mucky creative painting game that's entirely
digital." A blank sheet, paint, and no right or wrong result. Where the other Little
Patterns games teach something (counting, missing words, feelings), this one is for
making a mess and enjoying it.

**Jof is the second audience.** He is not a developer. He describes how a child is likely
to behave and judges by feel on real hardware (a Samsung S24 Ultra and the iPad 5). He
has asked, in writing, to be told when his suggestion is impractical and then to have
something delivered anyway, and to be impressed when possible. That shaped how I worked:
I argued with the brief in a few places (section 4) and built quickly so he could hold
things rather than read about them.

**Nobody in the target audience has used it yet.** Every judgement about playability in
this document comes from Jof's hands, my reasoning, or automated checks. No child has
touched it. Treat all claims about what Arthur will understand as hypotheses.

---

## 3. The game as a player meets it

A cream sheet of paper fills most of the screen. Controls are pictures only; there is no
text anywhere in the player's view.

- **Top row:** back arrow, brush, rubber, flick, marbles (with a small green plus), then
  undo, new sheet, and (only while zoomed in) "show the whole sheet".
- **Second row:** controls for the chosen tool only. Brush shows four brush types and a
  size slider. Rubber and flick show the size slider. Marbles shows one button: marbles
  with a red cross, which clears them.
- **Bottom:** sixteen round colour swatches.
- On a short, wide screen (a phone on its side) the rows become columns down the left and
  the colours go down the right, so the sheet gets the full height.

**Paint.** One finger draws. Four brushes make clearly different marks: a smooth round
line; a flat chisel held at 45 degrees, fat one way and thin the other; a crayon with a
paper grain; a sponge that dabs blotches. The rubber wipes back to bare paper.

**Flick.** The colour bar becomes a multi-select "bucket" of up to eight colours, each
swatch numbered in the order chosen. Then:

| What the finger does | What lands on the sheet |
|---|---|
| Quick tap | a small splodge with a few drops round it |
| Hold, then lift | a bigger puddle; a translucent circle grows under the finger to show it coming |
| Flick | a blob thrown *ahead* of the finger, stretched along the throw, with lobes and a spray of droplets fanning forward |
| Slow drag | a dribble trail of small drops |

Colours stay separate within a splat. The main blob cycles through the bucket; droplets
pick from it at random.

**Marbles.** Each tap on the marbles button drops one marble at a random spot. Up to
three; a fourth replaces the first. Each is one of ten kinds (tiny glass up to a steel
cannonball, plus a light bouncy pearl and a big light wooden one). They sit still until
a finger drags or flicks one. A rolling marble picks up the wet paint it crosses and
lays it back down as a ribbon that shifts colour as it goes, thinning the paint slightly
along its track. Marbles bounce off the edges and off each other; heavy ones shove light
ones. They carry no paint of their own, so on a blank sheet they leave nothing. Choosing
any other tool stops them dead. Touching a marble at any time switches back to marbles
and anything that was rolling carries on.

**Looking around.** Two fingers pinch to zoom (up to five times) and carry the sheet.
Zoomed all the way out is the whole sheet; it cannot be pushed off screen. Turning the
device turns the sheet with it, like real paper lying on the glass.

**Undo** steps back up to four actions. **New** clears the sheet, and is itself undoable,
which is why it never asks "are you sure?".

What is *not* there, and is felt: no sound, no saving, no autosave (a reload loses the
picture), no Nook on the page, no player profiles. Section 9 ranks these.

---

## 4. How we got here

I think the history matters for review, because about a third of the work was thrown
away, and the reasons it was thrown away are the most useful thing I learned.

### 4.1 The starting brief
Jof began with another model, which ran out of credit after a good first reply. His
brief: blank canvas; up to 16 colours; three or four brushes with size sliders; eraser;
a paint "flicker" with a bucket of up to eight colours where "different pressures and
strokes create different paint splatters"; and up to three marbles that roll when the
device is tilted, dragging existing paint. He assumed a library of pre-drawn splats was
the easy route and that generating them would be "compute expensive". He had already
agreed with the other model that marbles should run as a timed session so they did not
cost frames forever.

### 4.2 Where I disagreed with the brief
- **Generated splats are the cheap option, not the expensive one.** A splat is 20 to 50
  vector shapes filled once; after it lands it is pixels and costs nothing. A bitmap
  library needs assets, per-colour tinting (an offscreen composite per splat) and repeats
  visibly. I said so and built it generated. I would make the same call again.
- **Pressure does not exist on the target.** The iPad 5 has no pressure-sensitive touch
  and does not support the Pencil. Gestures had to be built from speed, direction and
  hold time. (The earlier model had said the same.)
- **A web page cannot lock screen rotation on iOS.** I said this at the very start, as a
  caveat to the tilt idea. I did not give it the weight it deserved. See 4.4.

### 4.3 I built a lab instead of writing a plan
Jof's words to the first model were "think this over before doing anything". I gave my
thoughts and built a single-file feasibility page in the same turn. My reasoning: the
two real unknowns (does the paint-dragging look convincing, and does it run on an iPad
5) could only be answered by running something on the device, and a page he could hold
was worth more to him than a document. I still think that was right. What I did not
manage well is what came after: the lab was never rebuilt as a proper game. It was
extended, round after round, until it was linked from the Garden and became the game,
still called `studio-lab.html`, still one file. That is scope creep with my name on it.

### 4.4 The tilt rounds (built, tuned four times, then removed)
Round by round, on Jof's S24 Ultra:
1. Tilt worked and ran at 59.9 fps. But rotating the phone "mega zoomed out" the picture.
   That was my bug: on every resize the lab re-drew the picture, scaled to fit, into a new
   canvas, so each rotation shrank it a little more. He also wanted marbles five times
   heavier, real brush types, and pictures instead of words on every button.
2. I built a fake orientation lock (counter-rotating the whole app against
   `screen.orientation.angle`), a rotate button, a weight slider, and the four brushes.
3. His phone still rotated. I added the one true lock the web has (Android Chrome, only
   in full screen), a 20 second run, and gave the three marbles different sizes because
   tilt moves identical marbles in formation. He also reported marbles not moving on a
   first run.
4. Still rotating; he had to use the phone's own rotation lock. Marbles sometimes needed
   a finger push before tilt took over. I traced that to two things I had got wrong:
   "level" was sampled just *after* pressing Go, which swallowed the tilt of anyone who
   pressed and tipped in one movement; and a heavy marble under a linear response barely
   moved at small angles. I fixed both, added a note for grown-ups about rotation lock,
   and added a time slider because he had read my weight slider as a time control.

Then Jof killed the accelerometer: "trialled and too fiddly to execute". He was right,
and I should have got there sooner. The honest account is that I knew from the first
message that iOS gives a page no rotation lock, and I spent three rounds building
workarounds I could not test (the counter-rotation, the full-screen lock) for a feature
whose central interaction, tipping the device, fights the operating system on the very
tablet it was for. The tuning work itself was sound. The judgement to keep going was not.

Two ideas of mine were also rejected in these rounds, both fairly:
- **Dipped marbles.** I started each marble loaded with a bucket colour so marbles would
  do something on a blank sheet. Jof wanted clean marbles: a blank sheet means "add paint
  first". His reading keeps marbles as a tool for *moving* paint, which is cleaner. The
  mechanism survives in the plan as the future oil brush.
- **Marbles that wander or follow a finger when there is no tilt.** He ruled that marbles
  never move by themselves. Again cleaner than mine.

### 4.5 Marbles without tilt
His replacement rules are the ones in section 3. Removing tilt also removed everything
tilt had forced on us: the timed run, the roll-off, the countdown ring, the tool lock,
the extra sliders, the permission prompt, the grown-ups note. His original worry, that
marbles left on screen cost frames forever, is answered differently: the frame loop only
runs while a marble is held or rolling. At rest they cost nothing.

### 4.6 The sheet: three attempts
1. **Canvas sized to the screen, re-drawn on resize.** Shrank the picture. Bad.
2. **Fixed bitmap per picture, shown upright, scaled to fit.** Correct but useless on a
   phone turned sideways: his S24 screenshot shows a postage stamp, because the toolbars
   took most of the height and a tall sheet was being fitted into what was left.
3. **What is live.** I offered options and recommended two together; Jof chose "sheet
   turns with the phone, like rotating a real piece of paper", added pinch zoom, and laid
   down the rule that settles most arguments in this project: *it is a browser game, the
   device could be anything, do not rely on features that may not exist everywhere.*

### 4.7 The iPad 5
"Everything works except the balls are slow to render. Kai's Power Goo would run on a
386." He was right to be unimpressed and the comparison is fair. Section 6.3 covers what
I believe was wrong and what I changed. **I have not yet seen a measurement from the iPad
with the new engine.** That is the most important open item in this document.

---

## 5. Technology

- **Plain HTML, CSS and JavaScript in one file.** No framework, no build step, no
  dependencies, no network requests after load, no storage. It matches the rest of Little
  Patterns and means the page works from any static host and can be read top to bottom.
- **Canvas 2D** for the sheet: `Path2D`, `createPattern`, `drawImage` between canvases,
  compositing modes (`destination-out`, `source-over`), clipping.
- **Pointer Events** for all input, with pointer capture on the stage; `wheel` for mouse
  and trackpad zoom.
- **CSS transforms** for the whole view (turn, zoom, pan), so looking around never
  repaints the sheet.
- **Inline SVG** for every icon, generated from a small table in the script.
- **Optional:** `screen.orientation.angle` (or `window.orientation`) to know which way the
  device was turned. If absent, the shape of the available space decides.
- **Testing:** two Node scripts drive headless Chrome over the DevTools protocol using
  Node 22's built-in `WebSocket` (no test dependencies): real touch gestures, a pinch, an
  emulated device rotation, mouse drags, screenshots, and collection of page errors.
  They need the local static server (`node tools/serve-fireworks.cjs 8788`).
- **Hosting:** Cloudflare Pages, direct upload with `wrangler`, through an allow-list.

Deliberately not used: WebGL, workers, OffscreenCanvas, the Fullscreen API, device
sensors, install-to-home-screen behaviour, audio files, any library.

---

## 6. How it works

### 6.1 The sheet and the view
The picture is one canvas of **1600 x 1200 pixels, the same on every device, for the
whole life of the picture**. The paper colour is CSS behind it, so bare paper is
transparent pixels; the rubber and the marble's thinning both work with
`destination-out`.

Every size in the game is in sheet pixels, scaled by `unit = min(W, H) / 700`. A brush
width, a splat, a marble: all the same fraction of the sheet on a phone, a tablet and a
desktop. A picture is therefore the same picture everywhere.

The view is a CSS transform on the sheet's wrapper:
`translate(-50%,-50%) translate(tx,ty) rotate(r) scale(fit * zoom)`.

- `fit` makes the whole sheet just fit the space. `zoom` runs from 1 to 5. `tx, ty` are
  clamped so the sheet can never leave the screen.
- `r` is the turn. When the page first lays the sheet out, the sheet's long side goes
  along the long side of the space. After that, if the browser reports an orientation
  angle, `r` moves opposite to it, so the sheet stays where it is *on the glass* while the
  controls re-flow around it. If the browser reports nothing, the shape of the space
  decides.
- `toSheet()` and `toScreen()` invert and apply that transform. Every pointer position
  goes through `toSheet()`, so painting is correct at any turn and zoom. The test suite
  checks this: after a pinch, a one-finger stroke must colour the exact sheet pixel under
  the finger.

**Why 1600 x 1200.** The size is set by the weakest target. The sheet is 7.7 MB; with
four undo copies it stays under 40 MB, well inside what old iPad Safari allows for
canvases. **What it costs:** on a modern phone the sheet is coarser than the screen once
you zoom past about 1.3, so zoomed-in paint is soft. I chose predictability and the
iPad's memory over sharpness. If undo moved to changed rectangles only, 2048 x 1536
would be affordable and I would take it.

**Why I believe in this design.** A fixed bitmap plus a CSS view made a whole class of
bugs impossible (the shrinking picture, lost undo on rotation) and made rotation and
zoom free. It took me three attempts to get there and the third should have been the
first.

### 6.2 Input: one finger marks, two fingers look
- A touch lands: if it is the only touch, the current tool starts. An undo snapshot is
  taken first.
- A second touch lands: navigation starts. If the first finger's mark is young (under
  350 ms old, or moved less than 18 px on the glass) it is taken back by popping that
  snapshot, because it was the start of a pinch, not a mark. Painting does not resume
  until every finger has lifted, so the finger left behind after a pinch cannot scribble.
- Mouse and pen never enter navigation; the wheel zooms about the cursor and a trackpad
  slide carries the sheet.
- **Buttons act on pointer-up, not on `click`.** I found that Android Chrome discards the
  click of a tap made shortly after a fast flick on the page (it treats the tap as
  "stop the fling"). Since flicking is what this game is for, the next tap on a tool
  often did nothing. It first showed up as an intermittent failure in my own test, and I
  am pleased I chased it instead of adding a retry. A genuine `click` with no preceding
  pointer-up (keyboard, assistive technology) still works.

**What I gave up.** The first lab let every finger paint independently: two hands, and a
resting palm blocked nothing. Pinch zoom and that cannot both exist, and Jof chose pinch.
A palm resting on the glass will now read as a second finger. For a five-year-old this is
a real risk and it is untested.

### 6.3 Marbles: the engine I am proudest of, and the one that failed first
**The idea.** I did not want a fluid simulation and I did not want a coloured pen that
follows a ball. Each marble owns a small square canvas, its **load**. As it rolls:

1. *Pick up:* the patch of the sheet ahead of the marble is drawn into the load with
   ordinary `source-over` at a low alpha. This one line does a surprising amount. Where
   there is paint, the load drifts towards that paint's colour. Where there is bare paper
   the patch is transparent, so `source-over` adds nothing and **the load keeps what it
   was carrying**. That asymmetry is exactly how a wet marble behaves, and it fell out of
   the compositing rule for free.
2. *Run dry:* the load is faded slightly by distance travelled (`destination-out`).
3. *Thin the track:* a little paint is wiped from the track.
4. *Lay down:* the load is drawn back onto the sheet.

All positions are rounded to whole sheet pixels, because repeated resampling at
fractional offsets blurs the trail into fog. The result is ribbons that change colour as
they cross stripes and fade out over bare paper. Jof's verdict on his phone was that the
marbles "interact correctly". I think it looks good, and it costs a fraction of a
millisecond of script.

**Where I was wrong.** My first version did all four steps *for every step of every
marble*: seven draw calls a step, each step reading from the sheet and then writing to
it. On desktop Chrome and a flagship Android phone this was invisible. On the iPad 5 it
was the one slow thing in the game. My belief, which I must label as reasoning and not
measurement, is that Safari keeps the sheet in one large surface and may copy the whole
of it whenever it is read after being written, so I was causing several 7.7 MB copies
per frame. I had also written "never use `getImageData`, it stalls the iPad" into the
brief as if I knew it. I did not know it. It was an assumption, and the confident
"GPU copies are cheap" claim in my first report was tested only on hardware where
everything is cheap.

**What is live now.** Per frame:
1. physics for every marble, noting where marks are due;
2. **one read of the sheet per moving marble**: the box its track covers is copied into
   that marble's scratch canvas, and all reads happen before any write;
3. then writes only: one clip to the track (a chain of circles), one fill to thin the
   paint there, and per step two small draws (scratch to load, load to sheet).

Seven calls a step became two, plus about four per marble per frame, and reads never
follow writes within a frame. A quality level widens the spacing between steps by itself
if frame time slips (95th percentile frame over 27 ms or script over 9 ms across the last
90 frames); it never climbs back mid-session. The trail looks the same.

**My confidence.** High that this is a better structure. Moderate that it cures the iPad.
If it does not, the next suspects, in the order I would test them: the full-sheet undo
copy taken every time a marble is grabbed; the marbles being page elements inside a
scaled, rotated layer holding a large canvas (draw them on a small overlay canvas
instead); and the sheet size. If a reviewer knows WebKit's canvas internals better than
I do, this is where I most want to be corrected.

**Physics.** Deliberately simple and hand-tuned. Each kind has a size factor `f`, a
density `d` and a bounce; weight is `f*f*d`. On release a marble keeps
`0.95 / sqrt(1 + 1.2 * weight)` of the finger's speed (clamped 0.22 to 0.9), so a
cannonball barely moves and a pearl flies. Friction is exponential and gentler for heavy
marbles; a constant rolling resistance brings everything to a definite stop. Walls
reflect with the kind's bounce. Collisions are impulse-based with unequal masses; a
marble under a finger counts as immovable. None of this is unit-tested. It should be: it
is pure arithmetic and would be easy to cover.

**A doubt about the rules.** The marbles button both selects the tool and adds a marble.
So returning to marbles from the brush always drops another, and with three out it
removes the oldest. That is Jof's specification and I built it faithfully; touching a
marble is the way back that does not add one. I suspect a child will lose a marble they
liked this way. I would watch for it.

### 6.4 Flick
A splat is generated from a seeded random stream (`?seed=` makes a run repeatable):
- one main blob: 12 to 16 points round a circle with random radii, occasionally pushed out
  into a lobe, joined by quadratic curves through the midpoints so it is always smooth;
  stretched along the throw by up to 2.5 times;
- a second smaller blob overlapping it, so the outline is never a single tidy shape;
- lobes: a wide base inside the blob, a pinched neck, a round bead at the end;
- droplets: ellipses, stretched along their direction of travel, shrinking with distance;
- one highlight ellipse for a wet look.

Everything of one colour goes into one `Path2D` and is filled once. All shapes are wound
the same way so overlaps never punch holes under the non-zero rule.

The gesture sets two numbers. `e`, flick energy, is finger speed **on the glass** mapped
from 150 to 2350 px/s onto 0 to 1. `h` is hold time up to 1.2 s. Blob radius, stretch,
throw distance, lobe count, droplet count and spread all come from `e` and `h`, so the
same gesture gives the same *kind* of splat with different details. Speed is measured on
the glass and not on the sheet so that a flick feels the same at any zoom.

**Honest assessment.** The mechanism is right and cheap. The art is only adequate. My
first lobes looked like sticks; the second pass is better, but a splat still reads as a
blob with bits, not as thrown paint. The thresholds have been tried by one adult. And
"paint lands ahead of the finger" is a choice I like (it is what flicking a loaded brush
does) that may simply confuse a five-year-old, who might expect paint where he touched.

### 6.5 Brushes
- **Round:** quadratic smoothing through midpoints, round caps.
- **Flat:** for each segment, a filled quadrilateral between the chisel edge at the last
  point and at this one, plus the edge itself stroked with butt caps so a stroke *along*
  the chisel still shows. Cheap and convincingly calligraphic.
- **Crayon:** the round stroke, but its ink is a repeating pattern: a 128 px tile of the
  colour with about 1500 random specks knocked out. The pattern is anchored to the page,
  so within a stroke the grain belongs to the paper and not to the brush. Each new stroke
  shifts the pattern at random, so going over an area fills it in, as wax does. (The rule
  book says "grain fixed to the paper, so going over it fills in", which blurs these two
  facts. This is the accurate version.)
- **Sponge:** a pre-rendered blotchy tip (random blobs, then random pores knocked out),
  stamped every 0.55 of a width with a random turn and a little jitter. Tips are cached by
  colour and size.
- Width is `(6 + 74 * size^2) * unit`: the square gives fine control at the thin end.

### 6.6 Undo
Four whole-sheet copies in a ring, with a pool so canvases are reused. A snapshot is
taken at the start of every stroke, every flick gesture, every marble grab, New and Test
picture. It is simple and it is the weakest engineering in the game: about 30 MB, a
full-sheet copy at the start of every action (a hitch a slow device may feel, and on my
own theory in 6.3 a trigger for a second full copy in Safari), no redo, and it does not
restore where the marbles were. It should become changed-rectangle undo.

### 6.7 Layout
Flexbox rows; one media query, `(orientation: landscape) and (max-height: 560px)`, turns
the rows into side columns; a `narrow` class shrinks buttons when the shorter screen side
is under 560 px. Touch targets are 40 px on small phones. That is below the 44 to 48 px
usually recommended; I accepted it to fit eight or nine controls across a 360 px screen, and I am
not comfortable with it for a child.

---

## 7. Decisions I would defend

1. **Generated splats, not a library.** Cheaper, endlessly varied, any colour, no assets.
2. **Paint-dragging by canvas compositing, not pixel loops or a fluid model.** It is the
   reason the effect is affordable at all, and the `source-over` pick-up is the best idea
   in the project.
3. **A fixed sheet with a CSS view.** Same picture everywhere; rotation and zoom cost
   nothing; whole classes of bug removed.
4. **The sheet turns with the device.** Jof's call, and the right one for a toy with no
   "up". It does mean a drawing of a house is sideways after a turn, exactly as paper
   would be.
5. **No dead ends and no error states.** New is undoable instead of confirmed. The ninth
   bucket colour pushes out the oldest instead of being refused. Marbles on a blank sheet
   do nothing instead of complaining.
6. **The frame loop sleeps.** Nothing animates unless a marble is moving or held. On an
   old tablet, and for a child who leaves the game open, this matters.
7. **Pictures, not words, with words kept for assistive technology.** Arthur can read, but
   the family convention is that nothing should depend on it.
8. **Pointer-up buttons.** A real, reproducible Android fault, found through a flaky test.
9. **Jof's device rule.** I resisted it in practice for three rounds (the fake lock, the
   full-screen lock) and I was wrong each time. Everything got simpler once I obeyed it.
10. **Checking every deploy against the working tree.** Dull, and it let me deploy from a
    dirty tree a dozen times without a single unintended change.

---

## 8. Where I was wrong, or am not sure

1. **I kept building tilt after I knew iOS could not lock rotation.** Three rounds. The
   right move was to say after round one: this cannot be made reliable in a browser;
   let us make flicking the way marbles move.
2. **I reported performance from the wrong devices.** Desktop figures and a flagship
   phone told me nothing about the iPad 5, and I let "60 fps" stand in my reports as if
   they did. Every number in this document except Jof's 59.9 fps is from desktop Chrome.
3. **I stated guesses as facts** ("never `getImageData`", "canvas copies are cheap on the
   GPU"). The current explanation for the iPad slowness is also a guess. A better one may
   exist.
4. **The lab became the product.** One 520-line file in a dense one-statement-per-line
   style I copied from the fireworks page. It should be modules: view, input, brushes,
   splats, marbles, undo, UI. The pure parts (view maths, splat geometry, physics) should
   have unit tests in the repo's `node --test` style. The 125 existing tests do not touch
   this page at all.
5. **I edited that file with search-and-replace scripts.** Twice this deleted something I
   did not intend (the Test picture handler; half a line swallowed by a comment). I caught
   both because I re-ran the harness each time, but the method was fragile and I would not
   use it on a larger codebase.
6. **The test harnesses are timing-based** (fixed sleeps), need Chrome and a local server,
   and are not part of any automated run. They found real bugs. They are still scaffolding.
7. **Accessibility is thin.** Controls have labels, pressed states and focus; good. But
   swatches are labelled by hex code ("Colour #e5383b") where they need names; the pop-in
   animation ignores `prefers-reduced-motion`; there is no keyboard way to make a mark and
   no description of the picture; small-phone targets are 40 px.
8. **Two palettes in one.** The same swatches are single-select for the brush and
   multi-select with numbers for flick. I think a child will cope. I have no evidence.
9. **Nothing is saved.** Safari discards background tabs, and a five-year-old presses the
   home button. Losing a picture to a reload is, to my mind, the biggest gap between this
   and something a family would keep using.
10. **Leftovers.** A `DPR` variable that is now always 1, two transform helpers that are
    now identical, a file named "lab". Small, but signs of a prototype that kept growing.
11. **Source control** (section 1).

---

## 9. What I would do next, in order

1. **Get the iPad 5 read-out** (`?lab=1`, flick three marbles for ten seconds, photograph
   the panel). Everything about performance waits on that.
2. **Commit what is live**, in reviewable pieces.
3. **Autosave and save.** Autosave the sheet to IndexedDB after each action settles and on
   `pagehide`; export by compositing the paper colour and the paint to a PNG and handing
   it to the share sheet where there is one, with a plain download otherwise. Jof to
   decide whether marbles appear in saved pictures. This obeys the device rule: it
   degrades to "no save button" and nothing else changes.
4. **Changed-rectangle undo.** Frees memory, removes the per-action full-sheet copy, and
   would allow a sharper sheet.
5. **Split the file and add unit tests** before adding any material.
6. **A finger-smudge tool**, because it is the marble engine under a finger and is the
   most "mucky" thing the game could have for almost no new code. It also proves the
   engine generalises before water and oil depend on it.
7. **Materials Jof has asked for,** all from existing parts and all obeying the
   read-once, write-after rule: **oil** (the engine with the load topped up from the
   chosen colour: my rejected dipped marble, in its right place); **water** (the engine
   with no colour of its own, strong pick-up and weak lay-down, perhaps a soft halo);
   **charcoal rubbing** (a coarser, darker grain pattern plus a light smudge pass).
8. **Muted sound, generated with Web Audio,** not files: short filtered-noise bursts for
   splats, a soft rumble scaled by marble speed, a faint brush hiss. Quiet, no sudden
   peaks, behind the family's visible Sound button, started from a tap as browsers
   require, never allowed to delay drawing.
9. **An art pass** on splats, marbles and icons, and Nook somewhere on the page.
10. **Watch Arthur use it.** Specifically: does a resting palm trigger zoom; does "paint
    lands ahead of the finger" make sense to him; does the add-a-marble button cost him
    marbles he liked; can he find his way back from being zoomed in.

---

## 10. Questions I would put to the reviewer

1. Is my explanation of the iPad slowness plausible, and is read-once, write-after the
   right cure? Would you have reached for `getImageData` and a typed-array loop on a
   small region instead, Power Goo style, and would that beat canvas compositing on an
   A9 without hurting Chrome, where reading a GPU canvas back is the expensive thing?
2. Is 1600 x 1200 the right sheet, or should the iPad's limits be met another way (tiles,
   a larger sheet with rectangle undo)?
3. Is giving up two-handed painting for pinch zoom the right trade for this child?
4. Should the marbles button add a marble every time it is pressed?
5. Is one file defensible for a game this size in this family of games, or is it already
   past the point where that is a liability?
6. What have I not thought of?
