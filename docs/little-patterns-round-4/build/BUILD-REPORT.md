# Little Patterns round 4: build report

Built by Opus 5.5 on 11 October 2026 from `../BUILD-BRIEF.md`, in six phases. **Local only: nothing is deployed or
pushed.** The next step is Jof's device test on the S24 and the iPad 5 (`DEVICE-TEST.md`).

## What was built

| Phase | What | Commit |
|---|---|---|
| 1 Character | Nook traced from the original picture into an SVG rig (`nook-art.js`, `nook.css`): ten feelings plus greet and rest, one pivot convention, breath, blinks, expression changes behind a blink. Untextured; a grain option waits for the iPad bench. | 0beec8e |
| 2 Frame | The shelf (eight tiles, Grown-ups behind a two-second hold), the frame for every game (`frame.*`, `shelf.js`), manifest and icons, Android Back opens the shelf. Count, Add (one picture; Help counts across both groups; ten-frames from level 3), Words (picture cards, ABC keys, seven columns on portrait phones) and Patterns moved into it. Six-viewport layout harness. | 78f1b94 |
| 3 Shapes | Sides (tap each side, 22 px band, counted once) and Name, two levels, 33 examples. Near answers for Add and Take away levels 1 to 4. Nook's resting look. | a08d24e |
| 4 Feelings | Nook feels... with a cancellable full-screen performance, Which feeling?, Friends (unchanged stories), Me (private: one fixed bundle, nothing saved or sent). Pay-offs: munch, held shape, bead string. | 0fbf2bf |
| 5 Voice | 76 new clips and 3 comparison recordings; the library trimmed; joined speech in `shared.js`; the listening page for J6. | eacd635 |
| 6 Checks | The fixes below, full verification, final screenshots, `DEVICE-TEST.md`, this report. | 71fa007 |

Each phase also has a one-line commit recording its hash (e5bcd45, 8932918, 4f09efd, 6470e25, cda5f79); the builder
notes are 54776b0.

## Phase 6 fixes

1. **Which feeling?** A right answer turns only the chosen word green and the bubble says the opener and the word; Nook
   keeps the feeling the child named (no change to happy or proud, no hop). Other games keep their success feelings.
2. **Shapes** success lines open with "We did it!": "We did it! A pentagon has five sides.", "We did it! It's a hexagon!".
3. **Grown-ups privacy sheet**: one line saying a Me report is never saved or sent and clears on leaving Me.
4. **Content pages regenerated**: `content.html` (new Shapes section, the round-4 Add picture and Help, the one-group
   take away, answers offered per sum) and `feelings-content.html` (rewritten for Nook feels..., Which feeling?,
   Friends and Me, with Nook's faces and Me's privacy). Both generators fixed; both stay on the deploy list.
5. **"then" and "more" re-recorded** (dry run showed exactly 2 requests; $0.001). "then" 0.93 to 0.61 s with a clean
   end; "more" 1.31 to 1.16 s, still with a short breath (about 0.25 s) for Jof's ear. Polish re-run (only those two
   clips changed); listening page rebuilt.
6. **Two landscape layout bugs found by the final screenshots and a stricter harness**: in Me at 740x360 the word
   DISAPPOINTED spilled out of its card (the card now keeps its width and the line beside it wraps); and the big
   performing Nook filled the card's height in landscape and on tablets, so the in-breath, the surprised rise and the
   excited hops pushed its box past the card top (16 px of headroom reserved). Neither showed in phases 2 to 5
   because no check or shot caught those moments.
7. **Harness and tools**: the layout harness now fails on any uncaught exception or unhandled rejection and checks
   the Me card's label; the sad "mid-breath" scenario had drifted to mid-speech after phase 5 and now waits for the
   breath (shot at the top of the in-breath), with two new checks at the top of the rise and of a hop.
   `serve-fireworks.cjs` serves the phase-1 character sheet and texture bench read-only at `/_nook-character/` for the
   iPad; the four frame pages' cache key is `r4p6`. A test now guards the content pages.

## Verification (final)

| Check | Result |
|---|---|
| Node suites: logic 42, UI 79, voice 6, Feelings 33, Nook 16, Shapes 22 | **198 pass, 0 fail** (128 before round 4) |
| Layout harness, headless Chrome: 65 scenarios at 412x860, 360x740, 915x356, 740x360, 1024x698, 1280x800 | **7 pass** (6 viewports + joined speech): no overflow, clipping, truncation, overlap with Nook, target under 44 px or uncaught error |
| `node tools/stage-little-patterns.cjs --check` | passes, 397 runtime files |
| jsdom load of index, Garden (Count, Add, Take away, the four Words modes, Patterns, Make your own), Shapes (Sides, Name), Feelings (all four), Blocks, Paint | 18 loads, 0 uncaught errors |
| Final screenshots, `final/`: 23 screens at six viewports, from the final harness run | 138 PNGs; every phone, land and land2 one looked at |

## Voice

323 clips, 33.4 MiB, 12.1 minutes (297 trimmed; the 26 phonics sounds untouched). Round 4 Gemini spend: 81 requests,
about $0.056 (phase 5: 79 requests, $0.055; phase 6: 2 requests, $0.001).

## Decisions Jof still owns

1. **Device pass on the S24 and the iPad 5**, both orientations (`DEVICE-TEST.md`). Nothing is called done before it.
2. **J6**: whole-sentence success clips or keep joining, after the listening page (about 92 requests for Add and Take
   away within ten, about 20 for Count). Also whether "more" still breathes.
3. **Nook's texture** (item 54): the iPad texture bench decides; it stays off until then.
4. **J5 follow-up**: the proud, frustrated and worried arms are the nearest honest versions of the sheet (phase 1).
5. **Deploy** (J7): only when Jof says so.

Left deliberately, as judgement calls rather than bugs: a tap on the resting Nook says "Nook feels happy."; Sides Help
counts one side per press; landscape Words shows the prompt as text in the card (no hear-again there); Add 60 + 30 on
a 360 px phone draws small apples; sentence breaks keep 300 ms; the narrow landscape bubble wraps long lines;
`docs/nook-voice-recordings.csv` is stale (`phase-5/new-lines.csv` is round 4's record); `blocks.html` still loads
`shared.js` and `learning.js` with its September cache key (Blocks unchanged by the brief; bump at deploy if wanted).

## Deploy allow-list: new or changed since 9d6e563 (before the build)

- **New (14 files and 76 clips):** `hub.js`, `frame.css`, `frame.js`, `shelf.js`, `icons.js`, `nook-art.js`,
  `nook.css`, `garden.css`, `shapes.html`, `shapes.js`, `shapes.css`, `manifest.webmanifest`, `assets/icon-192.png`,
  `assets/icon-512.png`; 76 new `assets/voice/*.wav`.
- **Changed (15 files and 221 clips):** `index.html`, `garden.html`, `garden.js`, `shared.js`, `learning.js`,
  `feelings.html`, `feelings.css`, `feelings.js`, `feelings-data.js`, `content.html`, `feelings-content.html`,
  `studio-lab.html`, `voice-library.js`, `assets/voice/manifest.json`, `assets/voice/NOTICE.txt`; 221 trimmed clips.
- **Removed:** `home.css`, `garden-live.css`, `garden-preview.css` (no longer loaded; `garden-preview.css` stays on
  disk for the unshipped workshop previews) and the 12 "You chose {x}." clips.
- Unchanged: 71 files (Blocks, the symbols, phonics and studio sounds among them). 397 in all.

Commit: 71fa007 (71fa007a0427de8eec93539f466426bd1d3a67dd), with this line added in the commit that follows it.
