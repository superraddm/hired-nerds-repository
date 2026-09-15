# Little Patterns: approved scope and implementation status

Updated 15 September 2026 after reviewing Fable's playable build and Jof's additions.
Both games are implemented locally. This document replaces the preview-only plan.
The current baseline includes Fable's revisions through commit 301eb0c.

## Design brief

Arthur is five, non-verbal and autistic. His strengths are spelling, remembered
words, number sequences, jigsaws and patterns. Quantity and arithmetic are the main
learning opportunities. His Grid device already provides independent writing;
this project complements it with puzzles. No spoken response is required.

Target devices are Android phones and iPad 5 / Safari on iPadOS 16.7.16, using the
constraints in [the fireworks handoff](../public/fireworks/IPAD5-OPTIMISATION-HANDOFF.md).
The games share the existing Kpopboom host under /little-patterns/.

## Implemented games

| Area | Current behaviour |
| --- | --- |
| Colour Blocks | Ten-column, twenty-row board; seven four-square shapes; every square is 1. Left, right, turn, down, place, landing outline, next piece and one-placement undo. |
| Block arithmetic | Every affected landing row has its own prospective sum. Movement and rotation immediately recalculate it. Row totals align with the board. The most recent completed row retains its worked example; simultaneous clears use the lowest completed row. |
| Block pace and audio | Manual movement by default; optional very slow or steady descent; hold Down for faster movement. Pause, mute, deliberate restart, and a full board that waits for undo or restart. Optional newly synthesised folk melody; no copied soundtrack. |
| Count | Apples in a five- or ten-space tray. Tap the numeral; tap apples or Count with me to mark each object once. Choose any number from 1 to 10 directly. |
| Add | Both groups and the joined group appear immediately with an unanswered equation. Choose among three equally styled number buttons by default. Optional number keypad or show-answer demonstration. Totals start within 5; choose quantities up to 10. |
| Missing word | Read or play a sentence with blank in the gap, then type the missing word. Always three tappable words; taps pronounce the word. The sentence picture stays visible. Show pictures / Hide pictures toggles the candidate word pictures (Mulberry Symbols), which start hidden. Includes nouns, doing words and describing words. |
| Missing letter | Choose a missing letter in a picture word or a grown-up's familiar word. Repeated letters can be hidden at different positions. |
| Word order | Tap scrambled sentence tiles first to last. Placed tiles remain in their original positions, disabled, while the sentence fills. |
| Number words | Connect quantities, numerals and ONE through TEN; show, choose or type the word. |
| Patterns | Seven levels: AB end gap, AB middle gap, AAB/ABB, ABC, AABB, mixed four-item units, four distinct shapes. Next advances manually; every level is directly available. |

Nook's Garden uses the approved playful garden and original sprout mascot. Colour
Blocks retains its approved quieter visual style. See [learning design](arthur-learning-design.md)
for the programme research and distinctions from those characters.

## Access, players and privacy

- Every game, activity, puzzle and pattern level is open immediately. Remembering a
  player never unlocks or restricts content. The activity pill also opens the picker.
- Up to twelve local player slots: optional nickname and avatar, individual settings,
  current rounds, typed drafts, block board and undo state. Switch using the player
  button; delete through a confirmation. This limit concerns saved profiles only.
- Names, writing, preferences and IDs stay in this browser's storage. There is no
  player database, account, server sync, tracking or game network API.
- Other people sharing this browser can see local profiles. These are not private
  password-protected accounts. Another device or browser has separate profiles.
  Clearing browser data removes saved progress.
- If persistence is blocked, separate players work in memory for the current page
  visit. Navigation or closing that page may lose them; saving reports the limitation.
- Any future cross-device system needs a separate design. An opaque ID is not
  authentication. Names must remain local; remote identifiers are not needed now.

## Accessibility and performance choices

Quiet start; no flashing, time limits, lost lives, rewards economy, required speech
or automatic puzzle transitions. Incorrect answers get neutral prompts and another
attempt. Clues and optional speech are deliberate actions. Upper/lowercase, two/three
choices, device/A-Z keyboard and softer colours are player preferences. Addition
always has three choices in its default answer mode. Missing-word sentences always
show three words, independent of the support setting.

Game logic paints on input, with a scheduled step only for automatic block descent.
The board canvas is fixed at 300 x 600; there is no high-DPR full-screen canvas,
permanent animation loop or particle system. Nook is a reused 560 x 672 PNG, about
212 KiB compressed / 1.5 MiB decoded. Native fonts and CSS task objects avoid font
or illustration downloads beyond that local asset. Accessibility zoom stays enabled.

## Cleanup after Fable's handoff

- Corrected restored typing caret position and immediate typed-number feedback.
  Editing a completed answer removes the previous success display.
- Preserved player separation when browser storage is blocked; deletion clears the
  in-memory copy too. Fixed focus trapping around hidden forms.
- Kept word-order tiles stable and keyboard focus on counted apples.
- Chosen quantities continue in sequence (7 then 8), rather than jumping to 2.
- Reject punctuation-only familiar words and avoid duplicate answer options. Tightened
  distractors that previously admitted reasonable alternative answers.
- Prevented queued voice from starting after mute. Restored blocks stay paused,
  including music; malformed saved undo data is discarded safely.
- Added wrapping for large apple groups, long writing and small-screen choices.
- Added a runtime allow-list to Kpopboom publication. Static mockups, abandoned
  prototypes and source artwork are excluded from it.

## Validation and release

Dependency-free logic checks:

~~~sh
node --test tools/test-little-patterns.cjs
~~~

For DOM interaction checks, install the isolated development dependency once:

~~~sh
npm install --prefix .wrangler/test-runtime --no-save --package-lock=false --ignore-scripts jsdom@26.1.0
node --test tools/test-little-patterns.cjs tools/test-little-patterns-ui.cjs tools/test-little-patterns-voice.cjs
node tools/stage-little-patterns.cjs --check
~~~

Current result: 50 passing checks covering arithmetic, rotation, clearing, undo,
puzzle solvability, typing, settings, player switching/deletion, mute and restoration.
DOM checks do not render a browser or validate real speech output. Browser automation
was unavailable during this cleanup; CSS changes still require visual/device review.

Local preview: run `node tools/serve-fireworks.cjs`, then open
http://localhost:8788/little-patterns/ on this computer. Use this computer's LAN
address with port 8788 for a phone/tablet on the same network, if firewall rules allow.

Publication has not been performed in this cleanup. The direct-upload script is
`bash tools/deploy-kpopboom.sh`; its optional branch argument creates a preview.
Wrangler authentication is required. A git push is not the Kpopboom publishing step.
The staged games contain 81 runtime files, including the content reference and 61 voice clips.

Before calling iPad performance verified, check both orientations, browser bars,
device keyboard open/close, two rotations, background/foreground, sound off/on,
player switching and ten minutes of play on the actual iPad. Also inspect large
sums, long familiar words and all seven pattern levels on a narrow Android phone.

## Deliberately deferred

Variable square values, whole-board totals, subtraction, rearranged counting
examples, verified phonics recordings and cross-device syncing are future options.
No Grid/YouTube integration, microphone, speech recognition, ability assessment,
learning dashboard, locked progression or reward economy is part of this release.
Old preview files remain design records, not the current playable specification.

## Content reference and speech direction (15 September)

All built-in sentences, candidate words and picture symbols, 45 Garden sums, 30 distinct
patterns, number words and block-row equations are listed in
[little-patterns-content.md](little-patterns-content.md). The same reference is
available in the browser at /little-patterns/content.html and from the hub privacy
section. Regenerate it with `node tools/build-little-patterns-content.cjs`.

Suggested words currently use whole-word pronunciation, not segmented phonics.
For private familiar words outside the bundled library, the fallback permits only installed local English voices,
with a mild pitch lift and unhurried pace. It does not fall back to remote voices.
Voice age and quality vary between devices; a true child voice is not guaranteed.
Reference: [localService specification documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).

The shared library is now implemented: 61 bundled Jenny (Dioco) clips, about
2.11 MiB, generated entirely offline. See [voice implementation and rebuild notes](little-patterns-voice.md).
Built-in speech is identical across devices; private custom words retain the
local-device fallback. No runtime LLM, TTS API, model download or server language
pack is needed. The underlying voice is adult, with a gentle pace and mild pitch
lift; a genuine child voice has not been sourced. Phonics remains separate from
the implemented whole-word pronunciation.

Incorrect answers now show "Whoops! Try again" in Nook's bubble. Typed-word
feedback also appears immediately beneath Enter and marks the input gently;
the draft stays editable. The matching shared voice clip plays only with sound
enabled. No penalty, reset, flash or forced progression is added.

## Picture symbols (15 September, evening)

Word pictures now use Mulberry Symbols (Steve Lee, CC BY-SA 4.0) instead of emoji,
chosen because they are the closest freely licensed match to the Widgit symbols on
Arthur's Grid device and at school; Widgit itself needs a licence and is still the
preferred end state. Twenty-four SVGs live in `assets/symbols/` with the licence and
the original Mulberry names in `NOTICE.txt`; the full Mulberry release and its
categories page stay local and untracked. FLY and COLD (no Mulberry verb or plain
adjective) became JUMP and DRY, with voice clips regenerated. The allow-list adds
every symbol named in learning.js automatically.
