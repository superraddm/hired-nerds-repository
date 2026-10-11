# Little Patterns round 4: consolidated build brief

Frozen 11 October 2026 after Opus 5.5 passes 1 and 2, Fable 5.1 passes 1 to 3, Codex pass 1 and Jof's answers.
This is the one file a builder works from, together with `../little-patterns-review-round-4.md` section 4 (the
design), `nook-design-profile.md` (the character) and the scope rules in `../arthur-games-scope.md`. Where this file
and an earlier pass differ, this file wins. Nothing is built yet.

## 1. Jof's decisions (11 October)

| # | Decision |
|---|---|
| J1 | **The parent locks the device, not the game.** Guided Access, App pinning or Samsung Kids is the parent's job. The game removes its own in-page exits (section 4) and does nothing more: no attempt to trap the browser, no service worker, no fighting the OS. A web manifest is still added so the games can be launched full screen from the home screen if the parent chooses. |
| J2 | **No feelings colour scheme.** The ten feeling cards are one neutral colour. Matching a school scheme is a later Grown-ups option if ever asked for. |
| J3 | **Letter keys in ABC order.** |
| J4 | **This brief is the build brief**, presented with images (`build-brief.html`). |
| J5 | **Nook: Jof has signed off Codex's final expression sheet** (`codex-review/nook-expression-sheet-final.png`) as the character direction. The builder shows the traced stills and the ten face crops as images in its first build report; no separate approval round. |
| J6 | **Whole-sentence success clips: only after Jof has heard the joined samples** on the listening page. Two or three comparison recordings are rendered for that page; nothing else until he decides. |
| J7 | **Local only.** The build is served and tested locally (`node tools/serve-fireworks.cjs`, the phone and iPad on the same Wi-Fi). No kpopboom preview, no production deploy, no push, until Jof says so. |
| J8 | The round-4 documents, mockups and screenshots are committed to git. |
| J9 | (11 October, afternoon) The mockups now show the original Nook picture in every frame; the vector drawing appears nowhere. Card words are centred. |

Settled earlier in the round: nothing was built before the reviews completed; the Help! button keeps the hand sign
passed in round 3; the Friends stories stay with their four drawn children and existing recordings.

## 2. Rules that still bind (from the scope and rounds 2 and 3)

No timers, lost lives, rewards economy, badges, locked progression, automatic difficulty change, disappointed
mascot or speech gating. Every activity asks for an answer; nothing advances on its own (the one agreed exception:
the Feelings performance returns to its board when its clip ends). Levels are chosen, never promoted. Sound starts
on. Softer colours and reduced motion are respected. Players, drafts, settings, levels, round ids and positions
survive the migration. Nook is an original sprout, not a television character. Word pictures are Mulberry symbols
until Widgit is licensed. No runtime TTS, no network calls during play, no analytics.

## 3. The accepted items, by number

Numbering is continuous across the passes: Opus 1 to 34 (pass 1), Opus 35 to 53 (pass 2), Codex 54 to 68. Every
item is accepted as written in its pass file except where this table says otherwise.

| Items | Status | Notes and overrides |
|---|---|---|
| 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 25, 26, 28, 29, 30, 32, 33, 34 | Accepted | As in Opus pass 1 and Fable pass 1. |
| 5 | Accepted in part | Manifest and icons: yes. Device locking: the parent's job (J1). Setup note for Jof: yes, including that iOS home-screen apps keep separate storage. |
| 15 | Accepted as amended | No "diamond". Level 1 of Shapes: regular triangle, square, rectangle, circle, oval in varied orientation and proportion. Level 2 adds pentagon and hexagon, including irregular and rotated examples. A square is never offered with RECTANGLE as a distractor. |
| 22 | Deferred (J6) | Whole-sentence success clips only after the listening page. |
| 24 | Accepted; ABC (J3) | Narrow portrait keyboard changes under item 61. |
| 27 | Accepted in part | Progress line on Done: yes. Help glyph: the hand sign stays. |
| 31 | Deferred | Grid-matching symbols need the Widgit licence. Me uses a face crop of the original Nook patch with a neutral ring per the profile; the child's own symbols are a later design. |
| 35 to 43 | Accepted and already applied to the mockups | See Fable pass 2. |
| 44 to 53 | Accepted | 50 new voice lines plus two or three comparison recordings (item 66). |
| 54 | Accepted (J5) | Original Nook geometry traced into the rig; the vector body and face in `mockups/nook-art.js` are superseded. Build the rig untextured first, measure on the iPad 5, then add texture as a tiled pattern or pre-rendered stills, by measurement. |
| 55 | Accepted | The approved diagonal crossing-out in Take away stays exactly as live. |
| 56 | Accepted | Feelings performance is a cancellable sequence with a generation token: enter, perform, hold, settle (difficult feelings), return. Done always available; with sound off or blocked playback, require Done. |
| 57 | Accepted | Me privacy contract carried forward: fixed Blob bundle of all name and acknowledgement clips preloaded; nothing persisted or sent; cleared on leave, player change, pagehide and bfcache restore. |
| 58 | Accepted | Shape sides: pointer converted to SVG coordinates, 22 CSS-pixel radius, nearest side, deterministic corner tie, counted sides acknowledged silently, tap-order numbering. |
| 59 | Accepted | Circle and oval in Name only; Sides is polygons. |
| 60 | **Accepted first half only** | Two fixed action slots (Help left, Next right; Again small left after success); delete "Help turns into Next in the same place" from the motion table. **No quiet Next before success**: every activity asks for an answer. Me and the performance use Done; Friends keeps Next. |
| 61 | Accepted | Narrow portrait (under 400 px): seven key columns, rows of 7, 7, 7, 5 with Delete and Enter in the last row, keys at least 44 by 44. Landscape: ten by three. Touch-target report added to the harness. Device-keyboard preference preserved. |
| 62 | Accepted | Zoom stays on. If the device keyboard or large text shrinks the viewport, the task card scrolls inside the frame; Delete, Enter, Help and the shelf stay reachable. Frame height from `dvh` / `visualViewport`. |
| 63 | Accepted | Migration checklist in section 8. |
| 64 | **Accepted; overrides the Opus motion table in two places** | Add shows the whole picture at once; arrival and counting motion happen on Help. Wrong answers change only the bubble: no head tilt, no posture change. Travel at most 12 px, scale at most 1.06. Blocks' round-3 celebration untouched. |
| 65 | Accepted | Gate: 2,000 ms total, ring from 300 ms, cancel on release, move, pointer cancel or page hide, keyboard equivalent, focus restored. Breath after a difficult feeling is Nook's own, captioned when it happens, never after a Me report. |
| 66 | Accepted | Audition FIVE, SIX, plurals, sentence endings and phonics before trimming the library; phonics clips untouched unless auditioned; frozen CSV of new lines before rendering. |
| 67 | Accepted | Acceptance checks 1 to 6 in the profile gate the character work. |
| 68 | Accepted as amended by J1 | In-page exits removed; manifest only; no service worker; Android back opens the shelf through one pushed history entry. Device lock is the parent's. |

## 4. The frame (every game)

Top bar: shelf button (left); at most two mode chips (Add / Take away, Sides / Name); one level pill that opens the
existing level sheet. Nothing else. Nook with one bubble; the bubble is a button that replays the line (small
speaker glyph; the speaker means "hear it again" everywhere and nothing on a play screen mutes). Task card: objects
centred, answers in a fixed bottom row at least 96 px tall. Action bar: fixed height, two slots, Help left and Next
right, Again small on the left after success, 20 px clear of the bottom edge. The card never changes height on
success. The chosen digit fills the "?"; no separate total.

Layouts: phone portrait (Nook above the task), phone landscape under 520 px tall (Nook in a left column, task
centre, actions in a right column; Words folds the bubble into the card), tablet from 760 px (Nook larger beside the
task). Screens without the frame Nook (performance, Which feeling?) use the whole stage. Nothing scrolls at 360×740,
412×860, 740×360, 915×356 or 1024×698 at normal text size; see item 62 for the exceptions.

Shelf: Nook greeting and eight tile buttons (Count, Add, Words, Patterns, Shapes, Feelings, Paint, Blocks); the
foot holds only the Grown-ups button (press and hold, item 65). Inside a game the same shelf opens full height as an
overlay with the current tile marked. Grown-ups holds player switching, settings (mute, word pictures, Softer,
letters, keyboard, answer modes, familiar words and sentences), the content pages, credits and the K-Pop BOOM door.
A crossed-speaker badge shows on the shelf only while sound is off. Tiles are buttons; text selection, long-press
callouts, the context menu and pull-to-refresh are off.

## 5. Game by game

- **Count**: unchanged objects and levels; the question in the bubble; Help counts with the child then outlines the answer.
- **Add**: one augmentation picture: first group, plus sign, second group as real apples inside a dashed outline,
  the equation under it, three answers. Groups over five lay out as left-aligned rows of five. Help step 1 numbers
  every apple across both groups in one count (with arrival motion), step 2 outlines the answer. Levels 3 and 4: two
  ten-frames, the added frame dashed; Help fills the ten first ("Fill the ten first" is a Help line, not the prompt).
  Level 5 tens and level 6 missing part keep their approved pictures. Take away keeps the approved one-group
  crossing-out. Keypad answers, doubles and make ten, zero cases: all kept.
- **Words**: Missing word with the three picture cards from the start (Grown-ups: word pictures show / hide); the
  picture and word on each card are centred together (Jof, 11 October). Keys end in Delete and Enter, no Clear; ABC
  order; item 61 widths. Missing letter, Word order (drag with tap fallback)
  and Number words (spelling default) chosen from the pill.
- **Patterns**: the three families as approved; make-your-own in the pill; no tab row.
- **Shapes (new)**: Sides (polygons; tap each side, item 58; then three number answers) and Name (three word
  answers, faces or pictures only as Help). Levels per item 15: level 1 regular shapes, gently turned; level 2 adds
  pentagon and hexagon with irregular and rotated examples (the mock screens show level 2). Nook holds the shape up on success; "We did it! A
  pentagon has five sides."
- **Feelings**: *Nook feels...* (ten neutral cards, Nook face crop and word; tap one and Nook performs it full
  screen per item 56, says the word and "Nook feels happy."; difficult feelings take one breath back to calm; Nook
  returns to the board with a tick on that card; ticks reset each visit; no counter; quiet finish "We said all the
  feelings."). *Which feeling?* (Nook large as the task object, word-only answers, faces as Help, no look-alike pairs
  at level 1). *Friends* (unchanged). *Me* ("You feel sad. Thank you for telling me."; Something else and Not sure
  kept; item 57).
- **Paint and Blocks**: reached from the shelf with the new icons; Paint's home control returns to the shelf.

## 6. Nook

Geometry, colours, texture and the ten expressions per `nook-design-profile.md` and the signed-off sheet. Rig per
the profile's transform tree: position wrapper (placement, grow, hop), SVG (breathing only), feet on the ground,
pose group with one pivot convention, fixed patch and eye anchors, arm and leaf pivot groups. Idle: breath, a
scheduled blink, leaves still except follow-through; idle pauses after 45 s without input and on hidden pages;
Softer and reduced motion remove idle, travel and squash. Outside Feelings only calm, happy, excited, proud and
surprised, only in response to play; never to mistakes, leaving or absence; a tap on Nook gives one of three small
calm responses. Motion timings from Opus pass 1 section 4 as amended by items 60 and 64. One small pay-off per game
(munching in Take away, holding the shape, wearing the bead string).

## 7. Speech and voice

Offline, in the voice build: trim each clip against its own peak (30 and 50 ms padding, 10 ms fades); compress
in-clip pauses to about 150 ms; join success lines with phrase-aware gaps (about 30 ms inside a phrase, 150 ms after
the opener); rate 1.0 to 1.05; audition list per item 66; phonics untouched. A listening page for Jof with the
joined versions beside two or three whole-sentence comparison recordings (J6). New lines (50, frozen in a CSV
before rendering): shape names rectangle, pentagon, hexagon, star; "It's a {shape}!" (9); "A {shape} has {n}
sides." (6); "Which shape is this?", "How many sides?", "Tap each side.", "Fill the ten first."; "Nook feels {x}."
(10); "You feel {x}. Thank you for telling me." (10); "Nook takes a breath."; the Me replies for Something else and
Not sure; "How does Nook feel?", "How do you feel?", "We said all the feelings.", "We did it!". Rendering stays
under the 100-a-day cap (one to two days). No engine change.

## 8. Migration checklist (item 63)

Everything not shown in the 19 mock screens keeps its approved behaviour: Count to 100 and the apple rows for tens;
zero in take away; the missing-part level; keypad and demo answer modes; doubles and make ten; Missing letter; Word
order drag with tap fallback; Number words spelling default; Friends; Something else and Not sure; the chooser and
settings sheets; blocked-storage player switching; saved rounds, drafts, levels, round ids and positions; Blocks
unchanged; Paint unchanged except its home control. The 68 UI tests are rewritten against the new structure, not
dropped.

## 9. Tests and checks

- Logic tests unchanged where learning.js is unchanged; new rounds for Shapes (sides, names, levels, no square with
  RECTANGLE) and Feelings (board order, performance states, Me bundle).
- UI tests: the frame, the shelf overlay, the gate timing and cancel, hear-again, two action slots, the cancellable
  performance (sound on, off, blocked play, Done, replay, player change, pagehide), Me privacy (fixed bundle, nothing
  stored, cleared), Shapes hit-testing, keyboard widths, restoring old saved rounds.
- Voice test: manifest equals the spoken bank (so the new lines must be rendered before the suite passes).
- Layout harness in the suite: six viewports; fails on page overflow, content clipped in the card, truncated labels,
  answers over Nook, and any touch target under 44 by 44.
- Device pass on the S24 and the iPad 5 in both orientations, served locally (J7), before anything is called done.

## 10. Build order and reporting

1. Character: trace the original into the rig, untextured; run the profile's acceptance checks 1 to 4; measure on
   the iPad; add texture or stills. Report with images: the traced stills and the ten face crops.
2. Frame, shelf, gate, manifest; migrate Count, Add, Words and Patterns; rewrite the UI tests; layout harness in
   the suite.
3. Shapes.
4. Feelings (the cancellable sequence, Me contract) and Nook in the games.
5. Voice: freeze the CSV, render, trim, listening page; wait for Jof on J6.
6. Behaviour, privacy and viewport checks; S24 and iPad locally.
7. Report with screenshots from the real devices. Deploy only when Jof says so.

Deliverables stay on the deploy allow-list discipline (`tools/stage-little-patterns.cjs`): new runtime files are
added there, mockups and review files never are.
