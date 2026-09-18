# Feelings: local implementation

Updated 17 September 2026. Initially built following the approved design and Fable 5.1 review. The
user chose to have the game built here instead of handed off to Sonnet. Pain/hurt
is parked and is not part of this implementation. No deployment was run for this
work.

Open the running preview at
[localhost:8788/little-patterns/feelings.html](http://localhost:8788/little-patterns/feelings.html).
There is also a Feelings link in the existing Garden activity navigation.
On the same Wi-Fi, the current machine is reachable at
[192.168.1.54:8788/little-patterns/feelings.html](http://192.168.1.54:8788/little-patterns/feelings.html).
That address can change when the local network changes.

## Current Me interaction and sound controls

Latest correction: Something else now presents Nook beside an ABC keyboard cue,
the entry field, a downward arrow, and one large speaker button labelled “Say it”.
The button changes from lilac to green when text exists, but the speaker icon
and arrow communicate the action without relying on colour or reading. The
former sentence “Tap your words to hear them” is removed. Existing text-box
tap-to-read still works as a secondary action.

With sound already on and an offline English voice available, entry says “Type
your words. Then tap the speaker.” It uses the existing local-device speech path;
no new recordings or voice model were generated. Opening the screen focuses the
guide, so a native keyboard does not cover it before it can be seen. The keyboard
cue is a label for the entry. Pressing the speaker with empty text focuses typing
and repeats the guide. With populated text it speaks the private words. Explicit
mute stays respected and directs focus to Sound if the speaker is pressed.

Eighteen Feelings tests pass, including the new guidance, empty/filled speaker,
focus, mute and private-request checks. Browser checks cover 360×640, 768×954,
1024×698 and enlarged text. The normal layouts fit without scrolling and the
speaker is at least 86px high. This validates mechanics and rendering, not that
a child understands the cues; no child usability trial has been performed.
Phone previews: [empty](nook-feelings-360-cues-empty.png) and
[typed](nook-feelings-360-cues-typed.png). This change has not been deployed.

The parent subsequently requested every feeling on one board. Me now shows all
ten names and illustrations together, plus Something else and Not sure. A first
tap selects the feeling and plays its existing bare-name clip, such as “Worried”.
Tapping the enlarged character repeats the same name. The header Back returns
to all choices and focuses the previous card; Back from the board exits Me.
Something else now opens a private typed-feeling field; tapping its text uses an
offline device voice. Text clears on Back, player change and page lifecycle exit.
More feelings, Change, Done, “You chose…” and “Hear my words” are removed from
the interaction. The Sound toggle stays visible below the header in every mode.
Sound starts off and explicit mute is respected. No recording has changed.

The fixed set of twelve public name clips preloads when Feelings opens, before
any personal selection. Selected-name playback uses the existing private Blob
bundle and causes no selection-dependent HTTP request. A late/failed clip shows
a retry message, never queues an old choice for later speech.

## Ten-feeling expansion

Happy, sad, angry, calm, worried, excited, proud, surprised, frustrated and
disappointed are available immediately in all three activities. Not sure and
Something else remain additional self-expression options, not part of the count
of ten. All feelings are directly visible without paging. The same twelve name clips
are preloaded, maintaining the existing privacy behaviour.

## Current design correction

The parent clarified that copying and spelling words do not establish reading
comprehension. The previous People screen was ambiguous even to an adult, too
wordy, and repetitive. This correction supersedes the original People guessing
flow in the reviewed brief. It is still a local preview, not a deployment.

People now introduces a feeling explicitly: one illustrated situation, one short
caption, “I feel HAPPY” (or the other feeling), and two task controls: Hear and
Next. Back and Menu remain in the header. No guessing, answer options, Ask or
duplicated Not sure button. With sound enabled, entry/Next narrates the context
and the person's statement together; Hear repeats the same bundled recording.
Sound still starts off, with a visible Sound toggle below the header. The parent can
enable it before play. Me retains Not sure and Something else for self-expression.

There are twenty everyday scenes, two per feeling. The original twelve are: bubbles, rain, a book, building a
tower, music, swimming, flowers, a song ending, resting, a stuck zip, a picnic
and a new slide. The added scenes cover drawing, planting, a butterfly, a new shoot, a knot,
threading beads, an empty paint pot and closed swings. Each feeling appears
twice. Difficult experiences alternate with pleasant, settled or surprised
examples; surprise is not inherently positive or negative. The drawings contain no injury, threat, tears or sudden
effects. These are individual fictional self-reports, not rules that a situation
always causes one feeling. Reading, speaking and copying are not prerequisites.

Match now balances distractors as well as targets: each of the ten feelings
appears eight times across the answer cards in every mixed 40-round deck. Each
pair includes one of happy/calm/excited/proud/surprised and one of
sad/angry/worried/frustrated/disappointed. No pair
contains two difficult feelings; none labels emotions as good or bad.

## Implemented

- Match: four original illustrated people × ten words, balanced two-choice
  picture matching, neutral retry feedback that reveals the other word, optional
  seated poses, and an always-available Next. Choose any feeling or the mixed
  deck; no unlocks or automatic promotion.
- People: twenty narrated, illustrated stories with explicit feeling words,
  replay and free Next. Every story is also directly available in Menu.
- Me: one board containing the ten words, Something else and Not sure; tap a
  card or enlarged character to hear the name, Back to return. Every report is
  accepted without assessment, scoring or saving it.
- Quiet start and the existing shared Jenny voice. The combined library now has
  255 clips (13.26 MiB). No runtime model or online speech service.
- The same local profiles, uppercase/lowercase and softer colours. Settings and
  profile controls live in Menu; Sound is directly on the page.
- A generated [complete content reference](../public/fireworks/little-patterns/feelings-content.html)
  and an [art review sheet](nook-feelings-art-review.html), with a
  [rendered view of the new everyday scenes](nook-feelings-art-review.png).

## Privacy behaviour

Only an explicit allow-list of ordinary practice state is saved: mode, deck
position, story index, word filter and shuffle seed. Me reports, answers,
retry counts and emotional histories are never persisted or included in a URL.

All Me portraits are already in the local vector-art module. All twelve
feeling-name clips are fetched as a fixed set when Feelings opens, regardless of
sound state or eventual selection. Playback uses in-memory Blob URLs through the
shared audio player. A selection, replay or missing clip does not request an
individual voice file or invoke a speech service. An empty local favicon prevents
browser icon requests from appearing on first interaction, too.

Leaving Me, switching players, pagehide and back-forward cache restoration clear
the report and the feedback region. Merely hiding the tab may retain the card so
it can be shown to someone, but shared audio immediately mutes and cancels;
returning does not replay it. The current screen is visible to anyone holding
the same device; these remain ordinary local profiles, not private accounts.

## Verification

121 automated tests pass across the existing logic, DOM, voice and new Feelings
tests. The seventeen Feelings tests include:

- Whole-deck coverage, balanced answer position and deterministic practice restore.
- Wrong-picture vocabulary feedback without reshuffling or completing a round.
- Optional pose/back navigation and direct access to every word.
- Every story names its feeling immediately, has only Hear/Next task buttons,
  can be skipped or picked freely, and replays the complete local narration.
- Every Me choice, fixed-bundle requests, one shared audio player, failed/late
  downloads, cancellation, player switching, blocked storage and lifecycle clearing.
- Single live status region and focus restoration after changing screens.

Run:

```powershell
node --test tools/test-little-patterns.cjs tools/test-little-patterns-ui.cjs tools/test-little-patterns-voice.cjs tools/test-little-patterns-feelings.cjs
node tools/stage-little-patterns.cjs --check
```

The runtime staging check passes for 309 files. The allow-list includes the new
runtime files and voice manifest entries, and excludes design/review documents,
voice models, generators and local test output.

An isolated headless Chrome session checked Match, pose, People across successive stories,
the full Me board and each selected character at 360 × 640, 1024 × 698 and 768 × 954.
Normal-size task screens fit without scrolling; controls are at least 48 × 48
CSS pixels. At 200% root text size, Match, People, Me and Menu reflow without
clipped button text or horizontal scrolling; vertical scrolling is allowed.
Me uses a responsive grid; long labels wrap with enlarged text. A real-browser
sound-enabled selection/replay check observed no HTTP requests. No runtime
exceptions were recorded. Screenshots were inspected visually.

The revised twenty People stories were each checked at all three viewport sizes
(60 scene checks), with no scrolling at normal text size or browser errors.
Earlier People phone renders: [bubbles](nook-feelings-bubbles.png),
[reading](nook-feelings-book.png), and [resting](nook-feelings-rest.png).

The pre-existing local server was still running an older version that served SVG
as application/octet-stream. Its command line was verified before restarting only
that workspace preview process on port 8788. It now serves image/svg+xml and the
existing Words pictures render correctly. This was a local process restart, not a
server deployment or an unrelated application change.

This is viewport and Chromium verification, not a claim of testing physical
Android or iPad hardware, Safari audio permissions, an actual screen reader, or
learning outcomes. Check those on the target devices. Review the mild sad/angry
art with the parent before publication; never require a child to remain on an
uncomfortable picture.

## Files and maintenance

- `feelings-data.js`: authoritative ten-word vocabulary, twenty stories, practice
  deck, accepted self-report labels and speech text. No I/O.
- `feelings-art.js`: original lightweight SVG artwork for all portraits, poses and
  props. The same person keeps the same clothing, hair and background across
  expressions; no face recognition or expression inference.
- `feelings.html`, `feelings.css`, `feelings.js`: standalone page and controller.
- `shared.js`: adds the fixed local voice bundle helper while retaining the one
  existing audio player. Existing game speech behaviour is unchanged.
- `tools/build-little-patterns-feelings.cjs`: rebuilds the content and art review
  sheets. `tools/build-little-patterns-content.cjs` links the master answer reference
  to the Feelings reference.
- `python tools/build-little-patterns-voice.py`: regenerates the combined speech
  library from finite built-in content using the already installed, pinned local
  Piper engine. No player data enters the builder.

The repository changed concurrently during this build (the existing Words game
received further changes). Those changes were retained. This build was tested
against the current working tree; no unrelated work was staged, committed,
removed or deployed by this task.

## Voice cadence review (no audio changes)

The generator currently uses Jenny with length_scale 1.15, noise_scale 0.4,
noise_w 0.65, and writes 22050 Hz samples at 24000 Hz for a fixed pitch/speed lift.
Every utterance uses the same settings. Sentence structure also includes formal
phrasing such as “Jo says, I feel…”. These are plausible contributors to the
parent's report of robotic cadence; this review did not include auditory listening.

A future comparison should keep Jenny and test conversational scripts, natural
phrase boundaries and modest per-line pacing, including a version without the
fixed sample-rate lift. Generate only a few separate review clips first. Do not
replace the library or change engine without the parent's decision. No new clips,
voice settings or generator changes were made in this UI revision.


Latest verification: 118 tests across game logic, UI, private typed speech and
voice assets. Tests cover local-only selection even with a bundled-word collision,
no server requests or stored typed feelings, mute, cancellation of delayed voice
loading after edits, refusal of remote voices, Back/pagehide clearing, and Words
input replay without changing the caret. All eight phonics clips are non-silent
mono WAVs. Their perceptual accuracy is not established by automated checks.


## Approved positive Match feedback

?Same picture? is replaced by Yes!, Correct!, Good matching!, That's right!, You found it!, and Well done!, rotating by round independently of the target feeling. Each is followed by the actual pictured person and feeling, such as ?Ali is disappointed.? The displayed response and two-part bundled audio share the same source. Back from the pose retains the response; Menu Hear again repeats it. Next cancels pending speech. Mute remains respected.

All 121 logic, UI, voice and privacy tests pass. All six openers were rendered with the longest feeling name at 360?640, 768?954 and 1024?698, with no overflow or browser errors. Phone screenshot: [Match feedback](nook-feelings-360-praise.png). Voice generation was local; no deployment was run.

## Sound default update ? 17 September 2026

Sound now starts on in Colour Blocks, every Garden activity/level, and Feelings, superseding the earlier quiet-start requirement. The visible Sound button still mutes the current game. Changing levels or players preserves that choice. Hiding/leaving a page stops audio without changing the sound setting or replaying speech on return. Blocks keeps its existing background pause and starts its melody/percussion on the first tap or keypress, respecting browser audio permissions.

Validation: all 125 automated checks pass; 309 runtime files pass staging validation. An isolated Chrome check confirmed a running Blocks audio context and successful Garden/Feelings clip playback on the first interaction, plus working mute controls in all three games. No new voice assets or deployment.

## Published for iPad review - 17 September 2026

At the user's request, published the full validated game release to https://kpopboom.party/little-patterns/ (Cloudflare deployment https://0a77e439.kpopboom.pages.dev). All four entry pages use asset version 20260917h. The release uses the existing deployment allow-list and preserves the host homepage and its assets. Verified 12 live game files byte-for-byte, including all entry pages, updated logic, voice index/manifest and two voice clips; the host homepage also matches. The local release and verification record are under .wrangler/releases/ipad-20260917h and .wrangler/feelings-check/deployment-20260917h.json. Physical iPad testing remains with the user.
