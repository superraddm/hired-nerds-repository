# Messy Studio — independent design brief

**Status:** Proposed design only. No implementation or deployment authorised by this document.

**Prepared:** 17 September 2026.

**Design boundary:** This brief is developed from the conversation's requirements. No existing painting implementation, deployed painting game, portfolio source, or portfolio design documents were inspected to prepare it. It specifies an independent activity, not changes to an existing implementation. No external design review has been commissioned for this brief.

## 1. Purpose and experience

Create a digital place to make a satisfying mess: paint with a finger, flick bright splashes onto the paper, and roll marbles through the paint. The child directs the activity. Nothing needs to be completed, copied correctly, named, or explained.

The central promise is **“Your movement makes a mark.”** A slow movement, a quick flick, a repeated dot and a still finger should each produce a clear, understandable result. The activity should support energetic experimentation and quiet repetition without assessing either as better.

The audience includes very young children, children who cannot yet read, nonspeaking children, and children with varied motor control and sensory preferences. Spelling or reading ability is not a prerequisite. There are no spoken-answer requirements, camera features, emotion judgements, lessons to pass, locked tools, scores, streaks, or reward currencies.

Target devices are an older fifth-generation iPad using Safari, an Android phone using its browser, and a desktop browser for testing and mouse access. Older-device performance is a primary design constraint, not a later reduced-quality mode.

### What a successful first minute looks like

1. The child arrives at an empty piece of paper with a medium round brush and a clearly selected colour.
2. Touching the paper immediately paints. No account, tutorial or setup interrupts that first action.
3. Another colour and a visibly different brush produce an understandable change.
4. Tapping the illustrated flick bucket exposes the bucket colours. A tap makes a splodge; a swipe makes a directional splash.
5. Selecting marbles reveals a large release button. The child releases them, watches or steers them, and their trails remain after the marbles roll away.

The child can remain at any of these steps indefinitely.

## 2. Product principles

- **Immediate effect:** Touch produces a visible response without waiting for a network request.
- **Legible cause and effect:** Similar gestures produce recognisably similar results. Variation enriches a mark without changing the basic rule.
- **Picture-led controls:** Every essential action is understandable from an icon, a visible sample or a short demonstration. Text and speech support those cues.
- **One relevant control set:** Show only the settings for the active tool. Do not surround the paper with every available option.
- **Permission to experiment:** Undo is prominent. A surprising effect can be removed in one action.
- **No urgency:** Only a marble release is time-limited, to bound its effect and processing. There is no overall play timer or demand to act before time runs out.
- **Calm is available, not required:** Do not force breathing exercises, stillness, prescribed movements or copying.
- **No hidden loss:** Layout changes, menus, device sleep and accidental navigation should not silently erase a picture.
- **Local creation:** Pictures and any remembered preferences stay on the device unless an adult explicitly exports a picture.

## 3. Overall structure and screen layout

One studio, one shared picture, four main tools: **Paint, Flick, Marbles, Eraser**. Switching tools does not create a new canvas or flatten the undo history unexpectedly.

### Persistent interface

The top edge contains a familiar Back control, Undo, a visible Sound toggle and a small menu button. Redo can appear alongside Undo when available. The main paper occupies the largest part of the screen. A bottom rail contains four large illustrated tool buttons.

The active tool has a strong outline and a visible selected state that does not depend on colour alone. Selected colours similarly have an outline and check mark. Avoid tiny toolbar symbols, floating advertisements, badges, animated scenery and decorative characters that compete with the artwork.

On an iPad, keep the relevant settings in a shallow bottom tray or narrow side tray, chosen according to orientation. On a phone, use a shallow bottom tray, with expanded settings temporarily covering part of the paper rather than permanently shrinking it. Closing the tray preserves the selection. Its surface must intercept touches so adjusting a control cannot also paint beneath it.

Aim for a paper area of roughly two thirds of the usable screen with ordinary controls open, and more with settings collapsed. This is a layout target, not a reason to make controls too small. Essential buttons should aim for at least 56 CSS pixels in each dimension, with clear spacing; no essential target may be smaller than 48 CSS pixels.

### Paper and framing

Use plain white paper inside a warm, quiet frame. A slight border distinguishes the paper from controls. Shadows should be modest; avoid a visually noisy wood table or patterned background.

The painting has a stable aspect ratio for its lifetime. Rotating the device fits the same paper into the new screen; it must not stretch, crop or erase the artwork. New pictures can use a landscape paper by default. A different paper orientation is an optional grown-up setting for the next picture, not a control the child must understand.

No scrolling or browser text selection should interrupt a stroke on the paper. Browser navigation outside the drawing surface should retain normal accessibility behaviour.

## 4. Paint tool

### Palette

Provide a fixed maximum palette of **16 colours**: red, orange, yellow, lime, green, teal, sky blue, dark blue, violet, purple, pink, peach, brown, grey, black and white. Final display values require visual checks for clear distinctions; the names specify the intended palette rather than exact colour codes.

Show eight generously sized swatches in the ordinary tray. A pictorial palette button opens all 16 without any unlocking. On a sufficiently wide screen, all 16 can be shown if touch targets remain large. Palette positions stay stable, supporting familiarity and repeated patterns.

White is genuine white paint, not the eraser. It can cover a coloured mark. The eraser removes pigment to expose the paper. The white swatch needs a dark outline so it remains visible.

### Four brushes

| Brush | Gesture and visible result | Purpose |
|---|---|---|
| Round paintbrush | Smooth, rounded, solid stroke with rounded ends | Reliable first tool; dots, lines, spirals and filled shapes |
| Flat paintbrush | Broad stroke with a small amount of visible bristle texture | Big sweeping marks and bands of colour |
| Crayon | Broken, grainy stroke with limited texture variation | A visibly dry alternative, useful for rubbing and layering |
| Sponge | Soft irregular dabs; dragging lays overlapping dabs | Stamping, dots and repeated patterns |

Brush buttons include a sample mark. Avoid expecting the child to infer the result from a detailed drawing of a real brush alone. The round brush starts selected.

### Size and touch handling

Each brush remembers its own size. One large slider controls the selected brush. A small mark at one end and a large mark at the other explain it without numbers. A preview updates as the slider moves. Tapping a position on the track also sets the size, so precise dragging is not required.

Sizes scale with the paper, rather than device pixels. Suggested initial range is approximately 0.5% to 8% of the shorter paper dimension, with usable limits tuned through touch testing. Default to a middle size that gives an obvious result from a small movement.

Join touch samples into continuous strokes so fast drawing does not leave accidental gaps. Apply light smoothing without making the mark noticeably lag behind the finger. A tap always leaves a dot. A held finger produces a stable dab; it must not endlessly deposit marks or consume resources when nothing changes.

For the initial build, one finger owns a paint gesture. Extra fingers do not reset, erase or create unexpected lines. Multi-finger painting is a later possibility, not a requirement for a satisfying first release.

## 5. Eraser

The eraser is a main tool with a recognisable eraser icon and its own remembered size. Its tray contains the same large size slider and live preview used for brushes.

Erasing follows the finger, with rounded edges and continuous coverage. It removes paint from all painting tools, including marble trails. One continuous erase gesture is one Undo action.

Do not add an “erase everything” action beside the ordinary eraser slider. New picture belongs in the menu and must preserve or confirm the current work first.

## 6. Flick bucket

### Choosing colours

The flick bucket holds **one to eight colours**. Its illustration shows the actual selected colours as visible paint portions. Opening the bucket presents the palette with selected swatches marked. Tapping a selected colour removes it, except that the last colour remains selected so the tool cannot unexpectedly become empty.

A full bucket shows eight visible colour portions. Attempting to add a ninth should leave the current selection unchanged and gently highlight the filled bucket, with the optional spoken cue “Choose a colour to take out.” Do not play an error buzzer or silently replace a colour.

Start the bucket with three bright, distinct colours. Colour choice remains independent of the ordinary paintbrush colour. The bucket remembers its selection during the session.

### Gesture rules

The child performs flick gestures directly on the paper. Every gesture works even if it does not meet a precise speed threshold.

| Input | Expected mark |
|---|---|
| Tap and release | Compact irregular splodge with a few nearby droplets |
| Hold briefly and release | Larger pooled splodge, growing only to a capped size |
| Short swipe | Directional splash with a central blob and a few short tails |
| Long or fast swipe | Longer streaks and more spread along the gesture direction |

Measure movement in paper-relative distances and speeds. Use a short smoothed sample history, so a single noisy event cannot create a huge splash. Cap spread, droplet count and holding time. A slow swipe should still produce a useful mark.

While touching, show a small paint bead beneath the finger as immediate feedback. Holding can enlarge this bead gently until the cap. On release, the bead becomes the final splat; it must not remain as an unrelated extra mark.

Pressure is an optional enhancement on hardware that provides a meaningful signal. It is never required, never presented as “press harder”, and never substituted with an invented pressure reading. The baseline experience relies on movement and duration.

### How a splat is made

Use a hybrid procedural system: a small reusable set of blob and droplet shapes, transformed and arranged from the gesture. Construct each splat from an irregular main body, several directional streaks, and a bounded number of satellite droplets.

Gesture direction sets the dominant direction. Speed affects elongation and travel distance. Hold duration affects the amount of paint. Size remains bounded so one gesture cannot accidentally cover the whole picture. Variations in rotation, proportions and droplet positions prevent obvious repeated stamps.

For a multicolour bucket, distribute selected colours between coherent blobs and droplets. Cycle the main colour through the selected colours from one flick to the next, with other selected colours appearing as secondary marks. This gives repeatable colour patterns while keeping each splash varied. Do not blend all bucket colours into a single average colour before drawing.

Limit any landing animation to a short, gentle movement of at most roughly 200 milliseconds. The lasting paint must appear promptly; never require a long airborne particle show before the mark appears. Reduced-motion settings remove the travel animation while keeping the same painted result.

### Undo and boundaries

One finger-down to finger-up flick is one Undo action. Paint falling beyond the paper is clipped. A gesture leaving the paper can finish at the edge; returning should not draw a line across unrelated controls. A cancelled gesture removes its temporary bead cleanly.

## 7. Marbles: ten-second paint rolling

### Entry and release

Selecting Marbles shows three large pictorial quantity choices: one marble, two marbles and three marbles. Default to one. The selected quantity is obvious without reading a numeral.

A large release button drops the selected marbles gently onto the paper. Choosing a quantity alone does not start movement. At most three marbles are active, and tapping release repeatedly during a run does not queue or multiply them.

**A complete run lasts ten seconds of active play, including its exit.** The first eight seconds permit ordinary rolling. During the final two seconds, each marble moves towards an edge and rolls out of view. The motion should look intentional rather than like an object vanishing. Paint trails remain.

A small ring around the release button empties during the run. There is no numerical countdown, alarm or instruction to hurry. During the run, that same large control becomes a clearly illustrated Stop button. After the marbles leave, it returns to Release. Another run is always available immediately.

### Steering

Support two steering methods without requiring both:

- **Tilt:** the paper behaves like a shallow tray. Tilting applies gentle acceleration. Friction, a speed cap and soft edge bounces prevent frantic motion.
- **Touch:** dragging a marble guides it across the paper. A dragged marble follows the finger with slight smoothing; releasing it allows a short, friction-limited roll.

Touch steering must always work, including when tilt is unsupported, permission is refused, or the device is on a table. Do not make a denied permission dialog a dead end.

Offer a clearly labelled, illustrated “Use tilt” control. Request sensor permission only from that action where required. Keep sensor handling capability-based because browser and operating-system support varies. Calibrate the neutral angle at the start of each run to the device's current comfortable position. Apply a dead zone and filter jitter. Map tilt correctly in portrait and landscape.

Dragging a marble temporarily overrides tilt for that marble. Other marbles may continue moving. Do not require two-handed holding or vigorous shaking. No shake gesture is included.

### Paint pickup and dragging

Marbles begin clean. On blank paper they roll without leaving a coloured line. On paint they pick up some of its colour, drag a small amount from their contact area, and deposit a trail as they roll onward. The carried paint gradually thins until another painted area replenishes it.

The desired effect is a **short local smear plus a carried trail**. Merely drawing a coloured line behind the marble is insufficient: some nearby pigment should visibly stretch or redistribute as the marble passes. However, the system is an artistic approximation, not a physical fluid simulation.

Crossing different colours gradually changes the marble's carried paint. Preserve visible ribbons and variations where feasible instead of averaging a whole painted region into flat mud. Blank paper contributes no white pigment; deliberately applied white paint does contribute white. Erased areas contain no pigment.

Paint remains available for marble pickup throughout the session. There is no invisible drying timer and no need to repaint an area because the child paused. A drying mechanic would undermine predictable experimentation.

If the paper is blank, the marbles still work. Show one small picture-led suggestion outside the canvas — a brush making a mark, then a marble passing through it — rather than preventing play or automatically adding paint to the child's picture.

### Physics and exit behaviour

Treat the marble as a circle moving in a rectangle. Use damped edge reflection, limited acceleration and capped speed. Basic marble-to-marble separation and soft collisions make three marbles readable without requiring complex rigid-body physics.

At eight seconds, steer each marble towards a nearby edge. During this exit phase, exit movement overrides new dragging and gently overrides tilt; do not allow the child to accidentally keep the run alive indefinitely. Choose an exit speed that clears the edge by ten seconds, then clip and remove the marble. Avoid an abrupt acceleration.

Stop ends interaction immediately and removes the marble overlays with a brief fade if motion is enabled. Do not force the child to wait through an exit after explicitly asking to stop.

Switching to another tool ends the run and keeps its trails. Undo while rolling first stops the run, then restores the picture to just before release. One whole marble run is one Undo action, regardless of the number of marbles or collisions.

### Backgrounding and pauses

Hiding the page, opening a menu, losing the active drawing context, or rotating through a layout transition pauses the run immediately: no simulation, smearing, sound or sensor processing continues.

On return, display the paused marbles with one large Resume control. Resume uses the remaining portion of the ten seconds and recalibrates tilt. Stop is still available. Do not replay missed frames, teleport marbles across the picture or automatically resume movement behind a menu.

At normal completion or Stop, detach active sensor listeners and stop the marble animation loop. An existing browser permission can remain granted; the application should not keep processing sensor readings between runs.

## 8. Calm, mindfulness and creative appeal

The ordinary experience should already allow quiet repetition. A child can make a row of sponge dots, follow a slow spiral, cover a patch in one colour, or watch a marble carry a ribbon across the paper. There should be no interruption because the child repeats a movement or ignores other tools.

Use natural, short sounds with restrained volume: a soft brush sound, a gentle splat and a light rolling texture. Avoid constant music, rising pitches that encourage faster interaction, loud impact sounds and applause. Sound is on by default to match the requested game behaviour, with the visible toggle available at all times. Audio starts only through permitted user interaction; there is no sound on an unattended loading screen.

An optional **quiet invitation** can be available from the menu. It displays one simple illustrated suggestion and, if requested, speaks it once. Examples:

- “Make a slow line.”
- “Try little dots.”
- “Choose a colour you like.”
- “Watch the marble.”

The invitation has no completion detector, timer, judgement or reward. It can be dismissed or ignored. It must not prescribe how the child should feel, tell them to calm down, require controlled breathing, or imply that vigorous painting is wrong. Free painting remains the default.

Appeal should come from tactile-looking results, immediate control, colour layering and discovery. Character appearances, if used, belong outside the paper and should be occasional, small and still. Never cover a painting with a celebration.

## 9. Replayability without progression

The combinations provide the replay value: brush texture, size, colour, stroke rhythm, bucket composition, flick direction and marble paths. All are available from the beginning.

Specific repeatable discoveries include:

- Painting three colour patches, then rolling a marble through them in a different order.
- Making long flicks across small sponge dots.
- Erasing paths through a painted area, then using those paths with marbles.
- Creating repeating colour sequences with successive bucket flicks.
- Comparing one marble with three on the same starting picture, using Undo between runs.
- Working entirely in a favourite colour or repeatedly drawing one familiar shape.

Do not add daily challenges, limited supplies, random locked tools, streaks, or scarcity. The bucket never runs out. Repetition is a valid use, not a behaviour that needs a prompt to change activities.

## 10. Undo, saving and recovery

### Editing history

Define one action as a continuous paint stroke, continuous erase stroke, complete flick or complete marble run. Undo reverses that action; Redo restores it. Starting a new action after Undo discards the redo branch in the familiar way.

Support at least ten recent actions within the agreed memory budget. Do not keep an unlimited stack of full-size canvas snapshots. Store changed regions or another bounded representation. If older undo history must be discarded, preserve the current artwork; ordinary continued painting must never fail because history is full.

Undo and Redo also restore any paint information used by marbles, so the next run sees the same pigment as the visible picture. Procedural flicks and marble results must not change randomly during Redo.

### Saving

Keep a recoverable current picture locally where browser storage permits. Save after completed actions using a short idle delay, not on every movement event. Do not depend solely on page-exit events to save. Tell the adult if persistent storage is unavailable; the child can still paint for the current visit.

The menu offers Save picture, New picture and optional local saved pictures. Export a PNG of the paper only, without controls, selection outlines, guidance or marble overlays. Preserve its aspect ratio. Use device sharing or downloading only after explicit action and according to available browser capabilities; provide a preview fallback where appropriate.

A new picture should first preserve the old picture locally if possible. If preservation fails, require a clear adult-readable confirmation before discarding it. Do not silently replace an existing saved picture to make space. A local gallery needs an explicit capacity policy and deletion control before it is included in the first release.

Player names are unnecessary. If integration later uses existing local profiles, keep both profile labels and artwork local. No automatic uploads, public gallery, analytics attached to a picture, or server processing of the child's marks are required.

## 11. Technical architecture requirements

### Runtime and rendering

Use a lightweight browser application with no runtime LLM or live image-generation dependency. Prefer a two-dimensional canvas renderer for the first implementation, subject to the marble prototype proving adequate performance.

Separate the stable paint surface from temporary overlays: the in-progress flick bead, active marbles and transient input feedback. The frame and controls can use ordinary accessible HTML. Do not redraw all interface elements into the paint canvas.

The painting is maintained at a bounded internal resolution independent of the display's full pixel density. Begin performance evaluation around a 1024-pixel longest side, with a lower-resolution option if actual iPad testing requires it. Retain the same logical paper coordinates at every rendering resolution. Increasing device pixel ratio must not multiply work without a cap.

Painting and erasing update only while input changes. Finished splats are rasterised into the stable surface. Marbles require continuous frames only during an active run or brief exit. A completely idle studio must have no perpetual rendering loop.

### Marble paint representation

Prototype a small auxiliary pigment map storing paint coverage and colour at a lower resolution than the visible canvas. Update it when painting, erasing, flicking and undoing. Transparent paper and opaque white pigment must remain distinguishable.

At each bounded movement step, sample the nearby pigment to update the marble's load. For the visible smear, copy a small affected patch into a reusable scratch surface and redeposit it slightly along the path, with controlled removal or attenuation at the source. Do not read back the entire display canvas for each marble on each frame.

This is the highest-risk technical requirement. Evaluate whether the approximation produces recognisable dragging and colour pickup on the target iPad before completing the rest of the product. If it cannot, revise the approximation or its working resolution; do not quietly replace dragging with an unrelated decorative trail.

### Input and physics

Use one central input controller that converts screen coordinates into logical paper coordinates, owns the active gesture and handles cancellation. Use Pointer Events where supported, with a narrowly scoped touch fallback if needed by the actual target browser. Prevent duplicate synthetic events from creating duplicate marks.

Use bounded gesture sampling and stroke interpolation. Do not retain raw touch traces indefinitely. Keep one random seed per procedural action so undo/redo or recovery does not change its appearance.

Use a fixed physics step, initially targeting 30 updates per second, with limited catch-up steps. Rendering may use the display's animation scheduling. On a long delay or hidden page, pause rather than simulating a large accumulated time interval. Sensor events update a small latest-orientation state; rendering and physics consume that state at the bounded update rate.

### Initial performance budgets

These are proposed acceptance targets to measure on the actual iPad, not claims of proven performance:

- Visible mark feedback within approximately 50 milliseconds during ordinary drawing.
- At least 30 frames per second through a three-marble run on a heavily painted canvas, with no sustained freezes.
- No full-frame pixel readback in the per-marble update loop.
- No animation frames or motion processing while idle or backgrounded.
- A cap of roughly 48 MiB for application-owned pixel buffers and undo data on the older-device path; browser overhead must also be measured separately.
- Reuse scratch canvases and particle records; avoid allocating large images during each frame.
- At most three marbles, one active flick gesture, and a capped number of visible droplets per flick. Start evaluation at no more than about 32 droplets and a handful of larger streaks per flick.
- Load the initial studio without fetching a large gallery, every historical picture, or a large library of splat images.

If a device cannot meet the frame target, reduce droplet detail, texture density and working resolution while preserving gesture direction, colour choice and the ten-second run. Do not compensate by making the finger response noticeably delayed.

### Lifecycle and failure handling

Handle pointer cancellation, missed releases, browser resize, orientation changes, page visibility, bfcache restoration and storage failure explicitly. Release pointer ownership and stop audio when an activity ends. Keep the latest stable picture recoverable when a sensor or sound operation fails.

Device motion requires feature detection and, where applicable, a user-triggered permission request on a secure origin. No permission request occurs merely because the page loaded. Tilt failure should leave touch steering ready immediately.

All controls need accessible names, visible keyboard focus and mouse/keyboard equivalents where practical. Sliders must be actual accessible controls rather than touch-only canvas drawings. Honour reduced-motion preferences for decorative motion; preserve the functional movement needed to understand marble rolling, with touch steering and Stop available.

Do not introduce third-party trackers or remote speech for child-created content. Short fixed labels can be bundled audio. No spoken narration needs access to the drawing or to personal information.

## 12. Behaviour acceptance checks

### First use and clarity

- A new visitor can paint immediately with a clearly selected brush and colour.
- A non-reading user can distinguish the four main tools from their illustrations and sample marks.
- Tool changes keep the picture and expose only relevant controls.
- Selecting colour or moving a slider never draws behind the controls.

### Paint and flicks

- All four brushes produce recognisably different results at both small and large sizes.
- A tap makes a visible mark; a fast stroke remains continuous.
- Erasing white paint is distinguishable from painting white over another colour.
- Flicks respond to tap, hold, short swipe and long swipe without requiring pressure.
- Similar gesture directions give similar splash directions at different screen sizes.
- A bucket cannot contain zero or more than eight colours; selected colours remain obvious.
- Repeated multicolour flicks have consistent main-colour sequencing and no unbounded particle accumulation.

### Marbles

- One, two or three marbles can be selected without starting a run.
- A release lasts ten active seconds, including the exit; no marbles remain afterward.
- Tilt and touch both steer, and denial of tilt access does not prevent play.
- Marbles bounce within the paper before the exit phase and never become trapped in control areas.
- A clean marble leaves no paint on blank paper; crossing paint produces both local dragging and a fading carried trail.
- White paint is picked up; blank paper is not treated as white paint.
- Stop works immediately. Switching tools leaves no active sensor processing behind.
- One Undo restores the exact pre-run picture and pigment state.
- Backgrounding does not consume active run time or resume movement unexpectedly.

### Comfort and recovery

- Sound can be muted without leaving the paper; there is no continuous background music.
- Reduced-motion mode removes unnecessary travel and decoration.
- Invitations are optional, spoken only as requested, and never assessed.
- Rotation preserves the entire picture and correct touch alignment.
- Undo/Redo remains bounded after a long session; saving does not interrupt drawing.
- A failed save, denied permission or unavailable audio never blocks painting.
- Export contains only the artwork, and no artwork or personal labels are uploaded automatically.

## 13. Proposed delivery sequence, subject to approval

1. **Design review:** independently review this brief for control overload, ambiguous gesture rules, marble timing, motor accessibility, calmness and privacy. Resolve changes in the brief before implementation.
2. **Technical proof:** on a small disposable canvas, validate directional splats and three marbles dragging existing paint. Measure the old iPad. This is the gate for the proposed rendering approach.
3. **Core studio:** implement blank paper, four brushes, palette, eraser, size control, undo and basic recovery. Verify that first use requires no explanation.
4. **Messy tools:** add the flick bucket and the ten-second marble activity, including touch fallback, exit, Stop and whole-run Undo.
5. **Finish and review:** add export, optional quiet invitations, sound treatment and final responsive layout. Test with an adult observing actual child use before any broader rollout.

Do not expand the initial scope to stickers, colouring pages, photographs, shape templates, glitter, collaborative painting, camera capture, public sharing, pressure-dependent features, full fluid dynamics, or progression systems. These would compete with the simple creative activity and its older-device budget.

## 14. Questions for a later independent reviewer

- Can a child understand the tool results from the pictures without having the labels read aloud?
- Is the bucket editor understandable, particularly removing colours and recognising a full bucket?
- Does the ten-second marble run feel complete without feeling like a task that must be rushed?
- Is the transition from steering to rolling off clear and gentle?
- Does the proposed smear visibly move existing paint, and is the approximation worth its processing cost?
- Are Stop, Undo and Back distinct and predictable in every state?
- Does a quiet invitation remain an invitation, or has it become an instruction the child feels expected to obey?
- Does the save/recovery approach preserve trust without exposing artwork belonging to another local player unexpectedly?

The review should identify concrete problems and the smallest useful fixes. It should not add modes or features merely to make the product larger.
