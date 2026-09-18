# Messy Studio: design brief, aligned with the deployed game

**Status:** Working specification. Originally an independent proposal (17 September 2026); aligned
on 18 September 2026 with the game that is actually deployed and with the decisions Jof made
while testing it. This document authorises nothing by itself: build and deploy only on request.

**How to read it.** Every requirement carries one of these marks:

- **[Live]** built and deployed, behaves as written here.
- **[Partly]** deployed, but short of what is written here. The gap is stated.
- **[Not built]** still a requirement; nothing deployed yet.
- **[Open]** needs a decision from Jof before anyone builds it.

**Provenance.** The first version of this brief was written from the conversation's requirements
alone, without sight of any implementation. It is preserved unchanged as
`messy-studio-independent-design-brief.original.md`. This aligned version was prepared by Claude
Fable 5.1, who built the deployed game, with the code in front of it. Where the original proposed
something better than what was built, this version keeps the original's requirement and marks the
build as falling short, rather than lowering the bar to match the build.

**Companion documents.** `messy-studio-brief.md` is the short rule book. `messy-studio-fable-brief.md`
is the builder's long account of the history, the mechanisms and its own mistakes.

**Where the game is.** `public/fireworks/little-patterns/studio-lab.html`, live at
https://kpopboom.party/little-patterns/studio-lab.html, reached from the **Paint** tab in Nook's
Garden. Add `?lab=1` for the developer read-out and a Test picture button.

## 0. What changed in this alignment

| Original brief | Now | Why |
|---|---|---|
| Marbles are a ten-second run: choose 1 to 3, press Release, steer by tilt or touch, they roll off at the end | **Replaced.** Marbles stay on the paper. Each tap on the Marbles button adds one (up to three; a fourth replaces the first). They move only when dragged or flicked. | Jof trialled tilt over several rounds on a real phone and dropped it as "too fiddly to execute". The timer, exit, countdown ring, Stop, and quantity chooser existed only to serve tilt. |
| Tilt steering with permission handling, calibration, dead zone | **Removed.** No sensors at all. | A web page cannot stop the screen auto-rotating (not at all on iPad or iPhone), so tilting fought the operating system. Also see the device rule below. |
| Rotation fits the same upright paper into the new screen | **Replaced.** The paper turns with the device, like real paper on the glass, and its long side stays along the device's long side. | Upright fitting left a postage-stamp sheet on a phone turned sideways. Jof chose turning. |
| Paper resolution bounded, starting around a 1024-pixel longest side | **One fixed sheet, 1600 x 1200, on every device.** | Jof: canvases have a fixed size that never changes. The size is set by the iPad 5's canvas memory. |
| No way to move around the paper | **Pinch to zoom and two fingers to carry the sheet. These are the only navigation.** | Jof's decision. |
| Extra fingers are ignored during a paint gesture | **A second finger means "look around".** | Follows from pinch zoom. |
| Pigment map: a low-resolution auxiliary record of paint for marbles | **Not used.** The sheet itself is the pigment. Marbles read it once per frame into a small scratch canvas. | Simpler, and white paint versus bare paper falls out naturally because bare paper is transparent. |
| Splats built from a small reusable set of shapes | **Every shape is generated.** | Cheaper than it sounds (filled once, then just pixels) and never repeats. |
| Text and speech support the picture cues | **No words at all in the player's view.** Words live only in accessible names. | Jof's decision: tool buttons are "simple images". |
| Full bucket refuses a ninth colour and highlights | Deployed build **pushes the oldest colour out**. | The builder's choice, never ruled on by Jof. **[Open]**, see 6. |
| New picture lives in a menu and must preserve or confirm | Deployed: New is in the top bar, **never asks, and is undoable**. | Accepted by Jof in play. Preservation is still required once saving exists. |

**A rule Jof added that governs everything below (18 September):** *this is a browser game and the
device or browser could be anything. Do not depend on features that may not exist everywhere.* No
orientation lock, no sensors, no full-screen tricks, no install-to-home-screen behaviour. Anything
optional must degrade to something sensible. Several ideas in the original brief and several things
the builder tried were removed by this rule.

## 1. Purpose and experience

Create a digital place to make a satisfying mess: paint with a finger, flick bright splashes onto
the paper, and roll marbles through the paint. The child directs the activity. Nothing needs to be
completed, copied correctly, named, or explained.

The central promise is **"Your movement makes a mark."** A slow movement, a quick flick, a repeated
dot and a still finger should each produce a clear, understandable result. The activity should
support energetic experimentation and quiet repetition without assessing either as better.

The first player is Arthur: five, autistic, non-verbal, a fluent reader and typist, on an iPad 5.
The wider audience includes very young children, children who cannot yet read, nonspeaking
children, and children with varied motor control and sensory preferences. Reading is never a
prerequisite. There are no spoken-answer requirements, camera features, emotion judgements, lessons
to pass, locked tools, scores, streaks, or reward currencies. **[Live]**

Target devices are an older fifth-generation iPad using Safari, an Android phone using its browser,
and a desktop browser for testing and mouse access. Older-device performance is a primary design
constraint, not a later reduced-quality mode. Tested so far by Jof on a Samsung S24 Ultra and the
iPad 5. **No child has used it yet.**

### What a successful first minute looks like

1. The child arrives at an empty piece of paper with a medium round brush and a clearly selected
   colour. **[Live]**
2. Touching the paper immediately paints. No account, tutorial or setup interrupts. **[Live]**
3. Another colour and a visibly different brush produce an understandable change. **[Live]**
4. Choosing Flick turns the colours into a bucket. A tap makes a splodge; a swipe makes a
   directional splash. **[Live]**
5. Tapping Marbles drops a marble on the paper. The child pushes it through the paint and it leaves
   a ribbon of colour. Tapping again adds another. **[Live]** (replaces the original release-and-steer step)

The child can remain at any of these steps indefinitely.

## 2. Product principles

- **Immediate effect:** touch produces a visible response with no network request. **[Live]**
- **Legible cause and effect:** similar gestures produce recognisably similar results. Variation
  enriches a mark without changing the basic rule. **[Live]** (splats are seeded; the gesture sets the kind of splat, randomness only the details)
- **Picture-only controls:** every control is an image. There is no visible text in the player's
  view; words exist only as accessible names. **[Live]** Sample marks on the brush buttons **[Live]**.
- **One relevant control set:** show only the settings for the active tool. **[Live]**
- **Permission to experiment:** Undo is always visible. A surprising effect can be removed in one
  action. **[Partly]**: four steps deep, no Redo; see 10.
- **No urgency:** nothing in the game is timed. **[Live]** (the original's one exception, the marble run, no longer exists)
- **Nothing is ever locked or refused:** no tool is disabled while another is in use; no action
  produces an error state. **[Live]** (added; Jof removed the tool lock that tilt had required)
- **Calm is available, not required:** no breathing exercises, stillness, prescribed movements or
  copying. **[Live]** by omission.
- **No hidden loss:** layout changes, rotation, menus, device sleep and accidental navigation should
  not silently erase a picture. **[Partly]**: rotation and resizing are safe and Undo survives them,
  but **a reload or a discarded tab loses the picture**. This is the most important gap; see 10.
- **Local creation:** pictures and preferences stay on the device unless an adult exports one.
  **[Live]** in the trivial sense that nothing is stored or sent anywhere.
- **Any device, any browser:** see the rule in section 0. **[Live]**

## 3. Overall structure and screen layout

One studio, one shared picture, five main tools: **Paint, Eraser (rubber), Flick, Stamps, Marbles**.
Switching tools never creates a new canvas or flattens undo history. **[Live]**

### Persistent interface **[Live, differs from the original proposal]**

As deployed:

- **Top row:** Back to Nook's Garden, then the four tools, then Undo and New picture. A "show the
  whole sheet" button appears here only while zoomed in.
- **Second row:** the active tool's settings only. Paint: four brush types and a size slider.
  Rubber and Flick: the size slider. Marbles: a single "clear the marbles" button.
- **Bottom:** all sixteen colours, always visible, positions fixed.
- **On a short, wide screen** (a phone on its side) the rows become columns down the left, and the
  colours run down the right, so the paper gets the full height.

The original proposed a bottom tool rail, a top bar with Sound and a menu, and collapsible settings
trays. None of that was built, and the deployed arrangement has been accepted in play. What should
still be taken from the original:

- A visible **Sound toggle** and, when there is anything to put in it, a small **menu** (Save,
  saved pictures, grown-up settings). **[Not built]**
- The active tool and the selected colour must be shown by more than colour alone. **[Partly]**:
  tools have a heavy outline and inset ring; the selected swatch has a dark ring but no check mark.
- The paper should get roughly two thirds of the usable screen. **[Partly]**: true on tablets and
  in phone landscape; about 60% on a small portrait phone.
- **Touch targets: aim for 56 CSS pixels, never below 48.** **[Partly, and failing]**: buttons are
  52 px on tablets but **40 px on small phones**, and swatches 40 to 44 px. This was a deliberate
  squeeze by the builder to fit a 360 px screen and it does not meet this requirement. Fixing it
  probably means the original's idea of fewer visible swatches on phones, or a second tool row.
- Controls must intercept touches so adjusting one never paints beneath it. **[Live]**
- **Controls act when the finger lifts on them (pointer up), not on the browser's click.**
  **[Live]** (added) Android Chrome discards the click of a tap made soon after a fast flick on the
  page, so tools seemed dead straight after flicking paint or a marble. A true click with no
  pointer (keyboard, assistive technology) must still work, and does.

### Paper and framing

A warm, quiet frame with a slight border and a modest shadow. **[Live]** The original asked for
plain white paper; the deployed paper is a **warm cream with a very faint dot grain**, which has
the practical advantage that white paint shows up on it. Keep cream unless Jof prefers white.

**The sheet. [Live]**

- One sheet size on every device and for the whole life of a picture: **1600 x 1200 pixels**, never
  re-made for a screen and never re-drawn on a resize. The size is dictated by the weakest target:
  the iPad 5 and Safari's cap on canvas memory (7.7 MB per copy).
- Every brush, splat and marble is sized in sheet pixels, so a picture is the same picture on a
  phone, a tablet and a desktop.
- **The sheet turns with the device, like a real piece of paper.** Its long side lies along the
  device's long side. Turning the device re-flows the controls around the sheet; the sheet itself
  stays where it is on the glass and is never shrunk by a rotation. A picture made one way up is
  sideways to the viewer after a turn, exactly as paper would be. The browser's orientation angle
  is used where it exists; where it does not, the shape of the available space decides.
- **Pinch to zoom; two fingers carry the sheet. These are the only ways to move around it.**
  Zoom 1 shows the whole sheet, which can never be zoomed out further or carried off screen;
  maximum zoom is 5. Mouse: the wheel zooms about the cursor; a trackpad slide carries the sheet.
- There is no orientation lock and no grown-up paper-orientation setting (both in the original;
  both removed by the device rule and by the turning sheet).

No scrolling, browser zoom or text selection interrupts a stroke. **[Live]**

## 4. Paint tool

### Palette **[Live]**

Sixteen colours, all visible at once, positions fixed: red, orange, yellow, lime, green, teal, sky
blue, blue, violet, magenta, pink, brown, near-black, grey, white and peach. (The original listed
violet and purple; the build has violet and magenta.) Final values still deserve a visual check for
clear distinctions, including for colour-blind viewers. **[Not built]**: that check.

The original's "eight swatches plus a palette button" was not needed on tablets and was not built.
It may be the answer to the touch-target failure on phones (section 3).

White is genuine white paint, not the eraser. The eraser exposes the paper. **[Live]** The white
swatch has a visible ring. **[Live]**

Accessible names for swatches are currently hex codes. They must be colour names. **[Not built]**

### Four brushes **[Live, one differs]**

| Brush | As deployed | Note against the original |
|---|---|---|
| Round | Smooth rounded solid stroke, rounded ends | As proposed |
| Flat | A chisel held at 45 degrees: fat in one direction, thin in the other | The original asked for a broad stroke with bristle texture. The chisel gives a more obviously different mark. Bristle texture remains a candidate for the art pass. |
| Crayon | The round stroke drawn through a speckled grain. The grain belongs to the paper within a stroke and shifts between strokes, so going over an area fills it in | As proposed |
| Sponge | A blotchy tip stamped with a random turn; dragging lays overlapping dabs | As proposed |

Brush buttons show a sample mark, not a picture of a brush. **[Live]** Round starts selected. **[Live]**

### Size and touch handling

- One slider for the selected tool, a small dot at one end and a big one at the other, no numbers.
  **[Live]** It is a real range input, so tapping the track sets the size. **[Live]**
- **A live preview of the mark as the slider moves. [Not built]**
- Each **tool** remembers its size. **[Partly]**: the original asks for each *brush* to remember its
  own size; at present the four brushes share one.
- Sizes scale with the paper, not device pixels. **[Live]** The deployed range is about 0.9% to
  11% of the sheet's shorter side, on a squared curve for finer control at the thin end. The
  original suggested 0.5% to 8%; tune by touch testing.
- Strokes are joined and lightly smoothed; a tap always leaves a dot. **[Live]**
- A held finger makes one stable dab and deposits nothing further. **[Live]**
- **One finger makes marks. A second finger means "look around".** **[Live, replaces the
  original]** If the first finger's mark is very young when the second lands (under about a third
  of a second, or barely moved) it is quietly taken back, because it was the start of a pinch.
  Painting resumes only when every finger has lifted. **Risk:** a palm resting on the glass reads
  as a second finger. Untested with a child. **[Open]**

## 4b. Potato stamps **[Live]** (added 18 September 2026 at Jof's request; not in the original)

A fifth main tool. Ten silhouettes cut as potato prints: star, circle, square, rectangle,
triangle, cat, dog, horse, crocodile, fish. The size slider scales a print from 8% of the
sheet's short side to the whole of it, never larger than the sheet; each print is turned a
little at random. **Press duration sets the amount of paint:** a tap prints crisp and
mottled; a held press adds a coat every tenth of a second, filling solid, squeezing paint
past the edge into a thicker ragged outline and throwing blotches, capped at about 1.5 s. A
print does not follow a moving finger. One press is one Undo step. Coats are composed off
the sheet, so texture never damages paint beneath and nothing is read back.

**[Open]** whether prints should be filled silhouettes (as built) or line outlines; Jof's
wording ("thicker lines, messier outline") could be read either way.

## 5. Eraser **[Live]**

A main tool with a recognisable rubber icon and its own remembered size, using the same slider.
Erasing follows the finger with rounded edges and continuous coverage, removes paint laid by any
tool including marble trails, and is one Undo action per gesture.

There is no "erase everything" beside it. **[Live]** New picture is the way to clear the sheet. As
deployed it sits in the top bar, never asks for confirmation, and **is itself undoable**, which is
how it avoids being a trap. When saving exists (section 10) New must also preserve the old picture
first. **[Not built]**: the preservation.

## 6. Flick bucket

### Choosing colours

- The bucket holds **one to eight colours**. **[Live]** While Flick is the tool, the ordinary colour
  bar becomes the bucket editor: selected swatches are ringed and numbered in the order chosen.
  Tapping a selected colour removes it; the last colour cannot be removed. **[Live]**
- **A bucket illustration showing the chosen colours as paint. [Not built]** The original is right
  that the numbers on swatches are a weaker cue than a visible bucket.
- **The ninth colour. [Open]** The original says: leave the selection unchanged and gently
  highlight the full bucket, never silently replace. The deployed build does the opposite: the
  ninth colour goes in and the **oldest drops out**, on the principle that nothing should ever be
  refused. The builder's case: no dead end, no spoken cue needed. The original's case: a colour
  vanishing without being touched is its own kind of surprise. Jof has not ruled. Whoever builds
  the bucket illustration should settle this with him, because a visible bucket makes either
  behaviour easier to understand.
- Starts with three bright distinct colours, independent of the brush colour, remembered for the
  session. **[Live]**

### Gesture rules **[Live]**

| Input | Mark |
|---|---|
| Tap and release | Compact irregular splodge with a few nearby droplets |
| Hold and release | Larger pooled splodge, growing to a cap at about 1.2 seconds |
| Flick | A blob thrown **ahead of the finger**, stretched along the throw, with lobes and a fan of droplets |
| Slow drag | A dribble trail of small drops (added; not in the original) |

- Every gesture makes a useful mark whether or not it crosses a speed threshold. **[Live]**
- **Finger speed is measured on the glass, not on the paper.** **[Live, replaces the original's
  "paper-relative speeds"]** Now that the sheet can be zoomed, paper-relative speed would make the
  same flick feel five times stronger when zoomed out. Distances and sizes of the *result* remain
  paper-relative.
- A short smoothed sample history (about the last 100 ms) sets speed and direction; spread, droplet
  count and hold time are capped. **[Live]**
- While holding, a translucent bead grows under the finger and disappears cleanly if the gesture
  becomes a drag or is cancelled. **[Live]**
- "Paint lands ahead of the finger" is how a flicked brush behaves, and is the builder's choice.
  Whether a five-year-old expects paint where he touched instead is **[Open]** until watched.
- Pressure is never required and never invented. **[Live]**: not used at all. The iPad 5 reports no
  finger pressure.

### How a splat is made **[Live, replaces the original's hybrid]**

Every shape is generated per gesture from a seeded random stream: an irregular main body (12 to 16
points joined by smooth curves, stretched up to 2.5 times along the throw), a second overlapping
body so the outline is never tidy, necked lobes ending in beads, elongated droplets that shrink with
distance, and one highlight. Everything of one colour is filled in a single operation. After it
lands a splat is pixels and costs nothing. There is no library of splat images.

Multicolour buckets: the main body cycles through the bucket from one flick to the next; droplets
pick from it at random; colours are never averaged. **[Live]**

Landing is immediate, with no travel animation, so there is nothing for reduced-motion to remove.
**[Live]** The original's bound of about 32 droplets is exceeded slightly at full energy (up to
about 45 droplets and 11 lobes). That is a handful of path fills once per gesture and has not shown
any cost on the iPad 5.

**Art quality [Partly]:** the mechanism is sound; the look is adequate, not yet delightful.

### Undo and boundaries **[Live]**

One finger-down to finger-up flick, including its dribbles, is one Undo action. Paint beyond the
sheet is clipped. A cancelled gesture removes its bead.

## 7. Marbles: they stay, and they move when pushed **[Live, replaces the original section entirely]**

The original specified a ten-second run steered by tilt or touch. That design was built, tuned over
four rounds on Jof's phone, and removed. The record of why is in `messy-studio-brief.md`
("Trialled and dropped"). In short: a page cannot stop the screen rotating when the device is
tipped; permission prompts need an adult; "level" had to be guessed; identical marbles moved in
formation; and tilt dragged a timer, an exit, a countdown, a Stop button and a tool lock in with it.

### Rules

- Tapping the **Marbles** button (three marbles with a small green plus) selects the tool **and
  drops one marble** at a random clear spot on the sheet, with a small pop.
- **Up to three.** A fourth replaces the first, a fifth the second, and so on.
- Each marble is **one of ten kinds, chosen at random as it lands** (never a kind already out):
  tiny, small, ordinary, big and giant glass; small steel, steel and a cannonball; a light bouncy
  pearl; a big light wooden ball. They differ in size, weight, how much of a flick they keep, how
  far they roll and how they bounce. Looks are neutral so no marble seems to be a paint colour.
- **Marbles never move by themselves.** A finger (or mouse: click and drag) drags one, and letting
  go while moving is a flick. Heavy marbles keep less of the finger's speed and roll further; all
  roll to a definite stop. They bounce off the sheet's edges and knock each other, the heavy one
  shoving the light one.
- **Nothing is locked while marbles are out.** Choosing any other tool stops them dead, and they
  stay on the sheet. **Touching a marble at any time switches back to Marbles**, and anything that
  was rolling carries on. While another tool is active the touch has to land on the marble itself,
  so painting right next to one still paints.
- A **clear marbles** button (marbles with a red cross) removes them all. New picture removes them
  too.
- Each grab-and-flick is one Undo action. Undo halts any rolling marbles. **[Partly]**: Undo
  restores the paint but not where the marbles were.

**[Open]** The Marbles button both selects the tool and adds a marble, so coming back to marbles
from the brush always drops another, and with three out it removes the oldest. This is as Jof
specified. The builder suspects a child will lose a marble they liked this way; touching a marble
is the way back that adds nothing. Watch for it.

### Paint pickup and dragging **[Live]** (the original's description stands)

Marbles begin clean. On blank paper they leave nothing. On paint they pick up its colour, thin the
paint slightly along their track, and lay a ribbon down as they roll on. The carried paint fades
with distance until more paint replenishes it. Crossing different colours changes what is carried
gradually, so ribbons shift colour instead of turning to mud. Bare paper contributes nothing; white
paint contributes white; erased areas contain no pigment. Paint never "dries": it is always
available to a marble.

**[Not built]** The original's blank-paper hint is still wanted: one small picture-led suggestion
outside the sheet (a brush making a mark, then a marble passing through it) when marbles are added
to an empty sheet. Never block play and never add paint for the child.

### Pauses and lifecycle

Nothing animates unless a marble is held or rolling; at rest they cost nothing. **[Live]** When the
page is hidden the browser stops the animation and on return the time step is capped, so marbles do
not teleport. **[Partly]**: this relies on the browser's behaviour; an explicit pause on page hide,
as the original asked, is still worth adding. There are no sensors to detach.

## 8. Calm, mindfulness and creative appeal

The ordinary experience already allows quiet repetition: a row of sponge dots, a slow spiral, a
patch of one colour, a marble carrying a ribbon across the paper. Nothing interrupts a child who
repeats a movement or ignores the other tools. **[Live]**

**Sound [Not built; wanted by Jof].** Simple, muted effects: a soft brush sound, a gentle splat, a
light rolling texture scaled by marble speed. No music, no rising pitches that push pace, no loud
impacts, no applause. On by default to match the rest of Little Patterns, with a visible toggle at
all times. Start audio only from a tap, as browsers require. Generate the sounds in the browser
rather than shipping audio files, and never let audio delay drawing.

**Quiet invitations [Not built; not requested].** The original's optional, unassessed suggestions
("Make a slow line", "Watch the marble") are a reasonable idea but Jof has not asked for them and
they would be the first visible or spoken words in the game. Park until he asks.

Appeal should come from tactile-looking results, immediate control, colour layering and discovery.
A character, if used, belongs outside the paper and should be small and still. Never cover a
painting with a celebration. **[Live]** by omission; Nook does not yet appear on the page at all.

**More materials [Not built; wanted by Jof]:** water, charcoal rubbing, oil. Build them from the
parts that exist: oil and water are the marble's paint-dragging engine driven by a finger (oil with
the load topped up from the chosen colour, water with no colour of its own, strong pick-up and weak
lay-down); charcoal is a coarser, darker version of the crayon grain with a light smudge. A plain
finger-smudge tool is the cheapest first step and proves the engine generalises.

## 9. Replayability without progression **[Live]**

The combinations provide the replay value: brush, size, colour, stroke rhythm, bucket composition,
flick direction, and which marbles happen to land. Everything is available from the start.

Repeatable discoveries include:

- Painting three colour patches, then pushing a marble through them in a different order.
- Making long flicks across small sponge dots.
- Erasing paths through a painted area, then sending marbles along them.
- Repeating colour sequences with successive bucket flicks.
- Knocking a pearl about with a cannonball.
- Zooming in to make something small, then zooming out to see it in the whole picture.
- Working entirely in a favourite colour or repeatedly drawing one familiar shape.

No daily challenges, limited supplies, locked tools, streaks or scarcity. The bucket never runs out.

## 10. Undo, saving and recovery

### Editing history **[Partly]**

One action is a continuous paint stroke, a continuous erase, a complete flick, a marble grab-and-
flick, New picture, or (in the lab) Test picture. Undo reverses it. **[Live]**

Short of the original, and the original is right:

- **At least ten actions.** Deployed: **four**, each a copy of the whole sheet (about 31 MB).
- **Changed regions, not whole-sheet copies.** A full copy at the start of every action is a hitch
  a slow device can feel, and would have to go before the sheet could be made sharper.
- **Redo.** Not built.
- History filling up must never stop painting. **[Live]**: the oldest copy is dropped.

Because Undo stores pixels, procedural marks cannot change on Undo or Redo; the original's
per-action seed is only needed if history ever stores instructions instead.

### Saving **[Not built]** (the original's requirements stand in full)

Keep a recoverable current picture locally where the browser allows. Save after completed actions
with a short idle delay and on page hide, not on every movement. If storage is unavailable, say so
to the adult and let the child paint anyway. Offer Save picture: a PNG of the paper only (paper
colour and paint composited; no controls, no outlines). Use the device's share sheet where it
exists and a plain download where it does not; this degrades cleanly and so obeys the device rule.
New picture should preserve the old one first once a gallery exists; a gallery needs a capacity
policy and a delete control before it ships. **[Open]** whether marbles appear in a saved picture.

No names, no uploads, no public gallery, no analytics, no server processing of a child's marks.
**[Live]** by omission.

## 11. Technical architecture requirements

### Runtime and rendering **[Live]**

A plain browser page: HTML, CSS and JavaScript, no framework, no build step, no dependencies, no
network after load, no runtime model of any kind. Two-dimensional canvas for the paint.

The stable paint surface is separate from temporary overlays. Marbles and the flick bead are
ordinary page elements positioned over the sheet; controls are ordinary accessible HTML. Nothing
from the interface is drawn into the paint canvas.

The sheet is a fixed 1600 x 1200 bitmap (replacing the original's 1024-pixel starting point). Zoom,
pan and turn are a CSS transform of that one bitmap, so looking around costs no painting.
Increasing device pixel ratio does not increase work. On very sharp phones the sheet is softer than
the screen once zoomed in past about 1.3; that is the accepted price of one size for every device.

Painting and erasing do work only when input changes. Splats are rasterised once. There is no
rendering loop unless a marble is held or rolling.

**Structure [Partly]:** the deployed game is one 520-line file that grew out of a feasibility page
and is still named `studio-lab.html`. Before more tools are added it should be split into modules
(view, input, brushes, splats, marbles, undo, interface) with unit tests for the pure parts (view
mathematics, splat geometry, marble physics).

### Marble paint representation **[Live, differs from the original]**

There is no auxiliary pigment map. The sheet is the pigment: bare paper is transparent, so white
paint and no paint are already distinct.

Each marble owns a small **load** canvas and a **scratch** canvas. Per frame:

1. Physics for every marble first, noting where marks are due.
2. **One read of the sheet per moving marble:** the box its track covers this frame is copied into
   its scratch canvas. All reads happen before any write.
3. Then writes only: one clip to the track (a chain of circles), one fill that thins the paint
   there, and per step two small draws: scratch into load at low opacity (which takes colour from
   paint and leaves the load alone over bare paper), then load onto the sheet.

Positions are rounded to whole sheet pixels so trails stay sharp. Small canvases are never below
256 pixels. No `getImageData` in play.

**This was, as the original predicted, the highest-risk requirement.** The first engine read from
and wrote to the sheet on every step of every marble and was the one slow thing on the iPad 5. The
builder's explanation (Safari copying the whole sheet on each read-after-write) is reasoning, not
measurement. The engine above replaced it on 18 September. **Whether it cured the iPad is not yet
known**; if not, the next suspects are the whole-sheet Undo copy taken at each grab, the marbles
being page elements inside a scaled layer, and the sheet size. The original's rule stands: if the
effect cannot be afforded, change the approximation or its resolution; do not quietly swap
paint-dragging for a decorative trail.

### Input and physics

One input path converts screen positions to sheet positions through the current turn, zoom and pan,
owns the active gesture and handles cancellation, using Pointer Events with pointer capture. **[Live]**
A test checks that after a pinch a one-finger stroke colours the exact sheet pixel under the finger.

Gesture sampling is bounded; raw traces are not kept. **[Live]**

Physics uses the display's frame timing with a capped time step and sub-steps spaced by a fraction
of the marble's radius, which widens by itself on a device that cannot keep up. **[Live]** The
original's fixed 30-per-second step was not adopted; nothing so far needs the determinism it buys.
Marble physics has no unit tests yet. **[Not built]**

### Performance budgets

Targets to measure on the actual iPad, not claims:

- Visible mark feedback within about 50 ms in ordinary drawing. Jof reports all paint functions
  "very responsive" on the iPad 5. **[Live, by report; not instrumented]**
- At least 30 frames per second with three marbles rolling on a heavily painted sheet, no sustained
  freezes. **[Open]**: the first engine failed this by feel; the second is unmeasured there.
  The `?lab=1` read-out shows frame rate, frame time, script time and the spacing level.
- No full-frame pixel read-back in the marble loop. **[Live]**
- No animation or processing while idle or backgrounded. **[Live]**
- About 48 MiB for the game's own pixel buffers and undo data. **[Live]**: roughly 40 MiB.
- Scratch canvases are reused; nothing large is allocated per frame. **[Live]**
- At most three marbles and one flick gesture at a time. **[Live]**
- No large downloads at start. **[Live]**: one 50 KB file.

If a device cannot keep up, reduce droplet detail, texture density and step spacing before
anything else, and never make the finger feel delayed.

### Lifecycle and failure handling

Pointer cancellation, missed releases, resize and rotation are handled. **[Live]** Page visibility,
back-forward cache restoration and storage failure need explicit handling once there is anything
to save or any sound to stop. **[Not built]**

All controls have accessible names, pressed states and keyboard focus; sliders are real controls.
**[Live]** Still missing: colour names on swatches, a check mark on the selected colour, a
reduced-motion rule for the one decorative animation (the marble's pop), any keyboard way to make a
mark, and target sizes on phones. **[Not built]**

No trackers, no remote speech, nothing that reads the drawing. **[Live]**

## 12. Behaviour acceptance checks

Marks: ✔ verified by the automated harness or by Jof on a device; ◐ true by construction (read from the code) but not exercised by any test; ✘ known not to pass; ○ not yet checked.

### First use and clarity
- ✔ A new visitor can paint immediately with a clearly selected brush and colour.
- ○ A non-reading user can tell the four tools apart from their pictures and sample marks.
- ✔ Tool changes keep the picture and show only relevant controls.
- ◐ Choosing a colour or moving a slider never draws behind the controls.
- ✔ A tap on a tool straight after a fast flick still works (Android Chrome).
- ✘ No essential target is smaller than 48 CSS pixels (40 px on small phones).

### Paint and flicks
- ✔ Four brushes give recognisably different marks at small and large sizes.
- ✔ A tap makes a mark; a fast stroke stays continuous.
- ◐ Erasing white paint differs from painting white over a colour.
- ✔ Flicks respond to tap, hold, short flick, long flick and slow drag with no pressure.
- ◐ The same flick feels the same at any zoom.
- ◐ A bucket cannot hold zero or more than eight colours; selected colours are marked.
- ◐ Main colour cycles predictably from flick to flick; nothing accumulates.

### Marbles
- ✔ Each tap adds one marble; never more than three; the fourth replaces the first.
- ✔ Marbles are still until dragged or flicked, and come to rest.
- ✔ Choosing another tool freezes them at once; their speed is remembered.
- ✔ Touching a marble while another tool is active returns to Marbles and the rest carry on.
- ✔ No tool is ever disabled.
- ✔ A clean marble leaves nothing on blank paper; crossing paint gives dragging and a fading ribbon.
- ✔ Mouse: click and drag moves and flicks a marble; hand cursor over a marble.
- ✔ Clear marbles removes them all. New removes them.
- ✔ One Undo restores the paint from before a flick. ✘ It does not restore marble positions.
- ○ Thirty frames per second with three marbles on the iPad 5.

### Looking around
- ✔ Turning the device never shrinks, crops or erases the picture, and Undo survives it.
- ✔ A two-finger pinch zooms and leaves no paint; the young first-finger mark is taken back.
- ✔ After zooming, a stroke lands exactly under the finger.
- ◐ The sheet cannot be zoomed out past whole-sheet or carried off screen.
- ✔ A phone on its side gives the sheet the full height, with controls at the sides.
- ○ A resting palm does not make painting impossible for a child.

### Comfort and recovery
- ✘ Sound can be muted without leaving the paper (no sound yet).
- ✘ A reload or a discarded tab keeps the picture (nothing is saved).
- ✘ Undo and Redo stay bounded at ten or more steps (four steps, no Redo).
- ✘ Export contains only the artwork (no export yet).
- ◐ Nothing is uploaded, stored or tracked.

Automated checks: `node tools/test-messy-studio-lab.cjs 1024x698 ipad` (touch, pinch, emulated
rotation, marbles) and `node tools/test-messy-studio-lab-mouse.cjs`, both against
`node tools/serve-fireworks.cjs 8788`. They drive headless Chrome and are not yet part of any
routine test run. The 125 existing Little Patterns tests do not cover this page.

## 13. Delivery sequence, as it actually stands

Done:

1. Technical proof of generated splats and paint-dragging marbles. (Done first, as the original
   advised, and it paid off: it is what exposed both the tilt problems and the iPad slowness.)
2. Core studio: paper, four brushes, palette, rubber, size, Undo.
3. Messy tools: flick bucket; marbles (tilt version built and removed; push-and-flick version live).
4. Fixed sheet, turning, pinch zoom, side controls on short screens.
5. Linked from Nook's Garden; deployed.

Next, in order, subject to Jof's approval:

1. **Read the iPad 5's figures** for the rebuilt marble engine (`?lab=1`).
2. **Commit what is live.** At present nothing in this game, nor the Garden link, is in git.
3. **Autosave, then Save picture.**
4. **Undo by changed regions, ten steps, with Redo.**
5. **Touch targets to 48 px on phones;** colour names; selected-colour check mark; reduced motion.
6. **Split the file into modules and unit-test the pure parts.**
7. **Finger smudge,** then oil, water and charcoal on the same engine.
8. **Muted sound** with a visible toggle.
9. Bucket illustration (and settle the ninth-colour rule); blank-paper marble hint; art pass; Nook.
10. **Watch Arthur use it** before anything wider.

Still out of scope: stickers, colouring pages, photographs, shape templates, glitter, collaborative
painting, camera capture, public sharing, pressure-dependent features, device sensors, orientation
locks, full fluid dynamics, progression systems.

## 14. Questions for the next reviewer

- Can a child understand the tools from the pictures alone?
- Is the bucket understandable without a visible bucket, and which ninth-colour rule is kinder?
- Should the Marbles button add a marble every time it is pressed?
- Does "paint lands ahead of the finger" make sense to a five-year-old?
- Does a resting palm turn painting into zooming often enough to matter, and if so what is the
  smallest fix (a larger movement threshold, a zoom toggle, palm-size rejection where reported)?
- Does the smear visibly move existing paint, and is it worth its cost on the iPad 5?
- Is one fixed 1600 x 1200 sheet right, or should sharper devices get a sharper sheet once Undo
  stops copying the whole thing?
- Are Undo, New, Clear marbles and Back distinct and predictable in every state?
- Is the picture sideways after a turn acceptable in practice, for a toy with no "up"?

The review should identify concrete problems and the smallest useful fixes. It should not add modes
or features merely to make the product larger.
