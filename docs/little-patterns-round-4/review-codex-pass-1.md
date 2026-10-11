# Little Patterns round 4: Codex spec review and Nook redraw

11 October 2026. Review and design handoff for Opus 5.5; no game build or deployment.

## Verdict

Keep the Nook frame, shelf, single addition picture, shape exploration, replay bubble, and calmer Feelings structure. These address the phone play-testing findings. The proposal's vector Nook changes the established character too much. Jof has now explicitly chosen the original artwork and asked for expressions in that style. That decision supersedes the proposed character proportions and the presentation's recommendation to approve them.

The frame is ready to implement once the ambiguities below are incorporated. Static layouts passing is useful evidence, but it does not establish that the flow, speech, privacy or teaching works on the target devices.

## What was reviewed

Read the round-4 README, brief, all four passes, mock.html, frame.css, nook-art.js and shoot.cjs; also the scope, learning design, round 3, Feelings build history and Gemini voice notes. Opened proposal.html in local headless Chrome and inspected its rendered introduction, character sheet and decisions. The connected Browser plugin reported no available browsers, so the supplied local Chrome screenshot workflow was used with an isolated profile.

Re-ran all 19 static screens at six viewports: 360×740, 412×860, 740×360, 915×356, 1024×698 and 1280×800. **114 cases, zero reported layout findings** with the supplied harness's checks. Results and new screenshots: [verification.json](codex-review/verified-shots/verification.json). Visually checked representative phone Words/Take, landscape Match, tablet board and presentation views. This is desktop Chromium rendering, not Safari, physical-device or audio testing.

## New findings and proposed amendments

Numbering continues after Opus's item 53. These are Codex recommendations except 54's character direction, which Jof has explicitly requested. Existing approvals stay in force where these recommendations do not change them.

### 54 — MUST: preserve the approved character identity

The original has a tall asymmetric pear silhouette, offset crown, uneven cream patch, diagonally arranged navy oval eyes, large unequal leaves, coral freckles, organic turquoise mittens and visible paper texture. The mock redraw substitutes a symmetric egg, a rounder patch, near-level eyes, little leaves and flatter fills. This is a change of character, not simply vectorisation.

Use [the Nook profile](nook-design-profile.md) and its expression sheet. Trace the original geometry once; expressions modify features and pose. Do not use the proposed nook-art.js body or face paths as the starting geometry. The original PNG remains the identity reference. Jof accepted the new sheet's fidelity to the original but flagged repeated Hello/Calm/Happy/Proud faces; the revised profile requires visibly different faces even with arms hidden.

### 55 — MUST: restore the crossed-out subtraction picture

The Take mock renders the removed apples with opacity and greyscale only (`.apple.gone` in frame.css). The phone screenshot has two faded apples and **no crossing-out strokes**, although section 4.4 says the approved reduction picture is retained.

Draw one clear diagonal across each removed apple before answering. After success remove those apples and strokes; survivors keep their positions. Include 3−3, 3−0, 14−6 and tens examples in visual review. Do not depend on pale colour to distinguish what was removed.

### 56 — MUST: define the Feelings performance as a cancellable sequence

Use `enter → perform → hold → settle, when specified → return`. Auto-return is the explicitly allowed exception for this activity only; it must never advance a puzzle, a Friends story or a Me report.

With sound on, hold until the final phrase actually finishes, then the specified 600 ms pause. Done cancels speech and scheduled work and starts the short calm return. A tap on Nook replays the word and cancels any pending return until that replay ends. A new selection, shelf open, player change or page exit cancels the whole previous sequence. Keep a generation token so late playback callbacks cannot finish a different performance.

With mute on, blocked playback, missing audio or a failed clip, keep the expression and Done available; require Done rather than inventing an automatic countdown. The progress line appears only during actual playback and follows actual playback progress. Never strand the child waiting for an `ended` event that cannot occur. `play()` can reject when playback is blocked; this is documented browser behaviour, not just a theoretical case. [MDN: play()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

### 57 — MUST: carry the existing Me privacy contract into the rebuild

Section 4.4 describes the response but omits the existing privacy guarantees. Preserve them explicitly: Me selections, typed feelings, retries and emotional history are not saved, logged, put in URLs or sent to a server. Preload a fixed bundle of **all** name and acknowledgement clips before selection; replay uses the in-memory bundle. Do not fetch `you-feel-sad.wav` only after SAD is chosen.

Clear the report on leaving Me, player change, pagehide and back/forward restoration. Merely hiding the page may keep its display, as the existing build does, but cancels speech without replay on return. Something else retains local-only typed speech and Not sure remains a complete valid response. Nook acknowledges calmly; it never mirrors, assesses or corrects the child's report.

### 58 — MUST: resolve shape counting and target size in CSS pixels

The motion table both says to choose the nearest *uncounted* side and to replay the tag on an already counted side. Choose the nearest **geometric side first**, within the hit distance. If already counted, leave the count unchanged and acknowledge that same side silently. Only then decide whether to add a tag. Otherwise a repeated tap can accidentally count a neighbouring side.

`stroke-width:44` in a 240-unit SVG viewBox is not a 44 CSS-pixel target: at 210 px display width it is 38.5 px. Convert pointer positions to shape coordinates and evaluate a 22 CSS-pixel radius around the displayed segment, with deterministic tie-breaking at corners. Count each side once and label it in tap order. Test rotated and irregular shapes, repeated taps and a small landscape render.

### 59 — MUST: settle the circle/oval content rule before recording

Both are in level 1, but “How many sides?” does not define straight versus curved boundaries. My recommendation: include circle and oval in Name only; Sides initially uses polygons. This retains all requested shapes without introducing an unspoken convention or a zero-side counting interaction. If round shapes later join Sides, explicitly ask “How many straight sides?” and record matching text. Do not silently mix definitions.

Keep varied triangles and rectangles, including non-upright examples. This fits NCETM's recommendation to vary orientation and examples, and to explore properties rather than only memorise a typical picture. [NCETM: Shape and Space](https://www.ncetm.org.uk/classroom-resources/ey-shape-and-space/).

### 60 — MUST: make the two action slots authoritative

Section 4.1 says Help left / Next right, but the pass-1 correct-answer motion says “Help turns into Next in the same place.” Delete that motion-table sentence. After success, small Again is left and Next is right; target positions and card height stay fixed. Never move the forward action to the previous help location.

Specify Next availability per activity. I recommend a quiet Next on practice screens before success too, so a child can skip a question deliberately. If adopting that suggestion, Next does not mark a success, change level or trigger a reward. Me uses Done; Friends keeps deliberate Next; the performance uses Done. This availability suggestion is new, not a claim that the static mockups already show it.

### 61 — MUST: distinguish illustration size from touch-target size

The 360 px portrait keyboard has nine narrow columns: at approximately 296 px inner width and eight 5 px gaps, keys are about 28 px wide despite their 52 px height. Landscape's ten columns are also narrow. Labels fitting does not verify comfortable touch targets.

Keep the default ABC order until told otherwise. Add a separate target-size report to the harness. For an adequately wide display use the proposed layout; on a narrow phone evaluate a wider-key arrangement, such as seven columns over four letter rows with Delete and Enter below, against the available height. Prototype it before choosing a tradeoff. Preserve the device-keyboard option and never silently switch Arthur's saved preference.

### 62 — MUST: preserve access when zoom or the device keyboard reduces space

“Nothing scrolls” is a normal-size viewport requirement. It must not become a blanket `overflow:hidden` policy at enlarged text or while a native keyboard covers the screen. Keep zoom enabled. Reflow or allow local vertical scrolling in the exceptional layout; retain the entry, Delete/Enter, help and deliberate exit. Re-check safe-area clearance against the visible viewport, including the 740×360 landscape action column. The static harness does not test any of this.

### 63 — MUST: protect the features the phone redesign does not depict

The mock set does not include Count 100, zero subtraction, missing-part Add, alternate typed answers, doubles/make-ten, Missing letter, Word order, Number words, Friends, Something else, Not sure, chooser/settings sheets or blocked-storage player switching. They need explicit build coverage, not an inference from the 19 screens.

Keep the approved one-row Patterns families and tap fallback for the approved dragging Word order. Do not revive the abandoned fourteen-level strip or replace the accepted Help! hand sign. Keep Number words spelling as the default, actual apple rows for tens, local players and accessible direct puzzle selection. Preserve drafts, explicit settings and round IDs during migration. New layout is not permission to discard these behaviours.

### 64 — SHOULD: simplify motion where the tables conflict

The table says 12 px travel maximum, then uses 14 px Add drops and 16 px shelf travel. It bans scale beyond 1.06, then uses 1.08 tag bumps. It says the task moves only on child input, while Add arrival accompanies entry speech. Normalize task travel to 12 px and scale to 1.06 or less; write any intended exceptions explicitly.

My preference is to show all Add apples immediately and put arrival/counting motion behind Help, consistent with the earlier approved immediate question. If retaining arrival on entry, make the complete picture and answers usable immediately; no wait for narration. Wrong answers keep Nook's settled face, with a neutral prompt. Omit the prescribed wrong-answer head tilt so a mistake never controls Nook's mood or posture.

Retain the frame's reduced-motion/Softer handling for new Nook motion, idle stop after inactivity and hidden-page cancellation. Do not apply it globally to undo the separate, user-approved Blocks celebration decisions in round 3.

### 65 — SHOULD: make the gate and return to calm precise

The grown-up hold is **2,000 ms total**, with the ring appearing at 300 ms and completing at 2,000 ms, not an additional two seconds after the delay. Cancel on release, moving off, pointer cancellation or page hiding. Provide an equivalent deliberate keyboard interaction and focus restoration.

Keep the approved breath for difficult Nook performances as Nook's own settling gesture. Show its caption when it happens. Never tell the child they must breathe, become calm or make Nook happy, and never run this sequence after a Me self-report. Different feelings are vocabulary, not a progress ladder towards “good” feelings.

### 66 — SHOULD: preserve speech consonants and shorten only unwanted silence

Retain Northampton's voice and the offline build. Peak-relative trimming alone does not guarantee quiet final consonants survive; audition FIVE, SIX, plurals, sentence endings and phonics before using it on the whole library. Preserve phonics unless separately auditioned. Do not compress every internal gap blindly: phrase boundaries and quiet sounds need different treatment.

The listed new line categories do sum to 50, but the two/three whole-sentence comparison recordings are additional. Freeze a CSV of exact text, lookup key, reused/new status and intended use, then budget requests including comparison clips and retakes. The 100-request limit is the observed build limit recorded in the local notes, not a fresh provider guarantee. This review does not change engines or render voice clips.

### 67 — SHOULD: test the redraw where the expression is actually used

Full-body proud/frustrated poses cannot rescue identical **face-only** board icons. Test the ten expressions as cropped faces at the actual phone card size, and as whole bodies at 112–132 px. Hello, Calm, Happy and Proud must differ by eyes and mouth before adding arms or labels. Keep body posture as an additional cue, especially for disappointed/frustrated, and offer Help when word-only answers are difficult. Spelling or remembered labels do not establish reading comprehension; the existing Feelings build history explicitly records this correction.

### 68 — SHOULD: describe browser containment accurately

The new controls remove accidental page exits; they cannot lock operating-system/browser exits. Standalone launch and device pinning remain separate device setup. Android back should reveal the shelf without duplicating history entries on every render; while the shelf is already open, handle back consistently and test actual hardware.

Do not add a service worker simply because a manifest exists. If offline caching is added later, separately design versioned cache updates and deletion. The Me fixed-bundle privacy contract still applies. Verify home-screen profile behaviour on the actual target iPad rather than promising that every iOS/browser version shares or separates storage the same way.

## Defaults and handoff

The character decision is settled: original identity, new expressions. Keep neutral feeling cards, ABC keys and the already-approved Help! sign as the proposal's defaults. Matching school colours or changing keyboard layout remains optional later information; it need not block this review or the character design.

Build in this order: reconcile this brief; approve the character geometry and face-only sheet; implement frame/chooser and migration; build Shapes and cancellable Feelings; audition speech; run behaviour/privacy/viewport checks; test the S24 and actual iPad; then prepare the preview release under the existing staging allow-list. Jof has requested a review and redraw here; Opus will do the game build.

My strongest additional design suggestion is to make Nook a reliable calm presence, with animation as a short response to a tap. The familiar character and predictable controls will carry more of the relationship than constant motion or a different pose on every answer.
