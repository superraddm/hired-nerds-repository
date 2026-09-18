# Shared voice library

Implemented 15 September 2026; extended the same day for review round 2. The
built-in game speech now uses 255 bundled WAV clips, about 13.26 MiB in total, including the locally implemented Feelings activity. Every device receives the same audio, with no
runtime TTS model, LLM request, speech API or server language pack.

## Voice and rights record

The voice is **Jenny (Dioco)**, an English voice generated using Piper. It is an
adult voice with a mild fixed pitch lift and gentle pacing, not a recording of
a child. A genuine child voice has not been sourced. The
[dataset author's terms](https://github.com/dioco-group/jenny-tts-dataset) permit
commercial use and distribution of generated clips. Credit appears in settings
and the deployed `assets/voice/NOTICE.txt`.

Only finished speech is deployed. The engine, model, dataset documentation and
build intermediates stay under the ignored `.wrangler/voice-build/` directory.
Piper is a local speech synthesiser, not a language model service. No private
player data is used for generation.

## Contents and behaviour

- All suggested words and built-in picture words, including READ pronounced as
  the present-tense verb ("reed").
- Number words ZERO to TWENTY and the tens to ONE HUNDRED; compounds such as
  seventy-three are two clips in a row. Also "plus", "take away", "equals",
  "apples" and the five bead shapes for the make-your-own readback.
- Every blank sentence and completed sentence in both banks (picnic; bath and bed). Sentence playback continues to
  say "blank" while an answer is merely typed; it changes after a correct check.
- Gentle incorrect-answer feedback: "Whoops! Try again." It plays only when sound
  is already enabled, alongside visible feedback.
- Success lines are assembled from short clips played in order from the one player:
  an opener ("Yes!", "You found it.", "That’s the one.", "Spot on!", and
  "Lovely counting." for Count) plus the restated answer ("three", "apples";
  "two", "plus", "one", "equals", "three"; "The pattern fits."; the finished
  sentence). No equation needs a clip of its own. Automatic lines play only while
  sound is already on and never fall back to a device voice; a private familiar
  word gets the opener alone.
- A greeting sample: "Hello! I'm Nook. Let's play."
- A generated `voice-library.js` provides a normalised text-to-file lookup.
  Hash filenames contain no user names or writing.
- One reusable audio element. Ordinary clips load on a deliberate tap or an
  opted-in automatic prompt. Feelings' Me screen is the privacy exception: all
  twelve generic acknowledgement clips load as a fixed set before a choice, then
  play from local Blob URLs through the same player. Selecting a feeling does
  not request its individual file from the server. Failed clips stay silent;
  there is no selection-dependent fallback.
  Pause, mute, changing activity, changing player, and hiding the page cancel
  playback. A failed clip does not silently switch to another voice.
- Grown-up-supplied familiar words outside the library use an explicitly local
  English device voice. They never go to a speech server. This is the one case
  where the voice can differ between devices.
- Whole-word readback is available. Eight keyboard sounds now use explicit phoneme synthesis; the remaining eighteen retain their earlier spelling-based approximations.

## Rebuilding

Download these build inputs into `.wrangler/voice-build/`:

| File | Source |
| --- | --- |
| piper_windows_amd64.zip | https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip |
| jenny.onnx | https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx |
| jenny.onnx.json | https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx.json |

Extract the ZIP so the engine is at `.wrangler/voice-build/piper/piper.exe`.
The builder verifies the engine archive and model hashes before execution:

- Engine ZIP: `f3c58906402b24f3a96d92145f58acba6d86c9b5db896d207f78dc80811efcea`
- Model: `469c630d209e139dd392a66bf4abde4ab86390a0269c1e47b4e5d7ce81526b01`
- Config: `a9a7a93a317c9a3cb6563e37eb057df9ef09c06188a8a4341b0fcb58cba54dd4`

Run `python tools/build-little-patterns-voice.py` from the repository root.
Python's standard library, Node and the downloaded Piper executable suffice.
The phrase bank is `spokenBank()` in `learning.js`, shared with the voice test;
it also includes `feelings-data.js`'s spoken bank. It does not inspect browser storage.
Generation uses length scale 1.15, noise scale 0.4 and noise width 0.65. Output
is mono PCM16 at 24000 Hz (pitch raised from the original 22050 Hz), with silence
trimmed and volume balanced below clipping. These settings are baked into files.

Regenerate after editing spoken content. Existing raw clips are reused; pass
`--force` to regenerate them after changing the voice or generation settings. Then run the tests and
`node tools/stage-little-patterns.cjs --check`. The deployment allow-list follows
the manifest, excluding any old clips no longer referenced by it.

## Verification and limits

Automated checks cover complete phrase coverage, valid non-silent WAVs, clip
selection, no dependence on installed voices for built-ins, one-player reuse,
cancellation, and keeping private custom words local. The local preview server
serves WAV MIME types and byte ranges for media playback.

These checks do not establish perceived voice quality, phonics correctness or
real iPad audio behaviour. Audition the greeting, single words and sentences on
the target devices. The current preview is implemented locally, not published.


17 September, latest Me UI revision: selection and character replay now use the
existing bare feeling-name clips. The fixed twelve-name bundle preloads on page
entry; no selection-dependent request occurs. The old “You chose…” recordings
remain in the library but are no longer used by Me. No recordings were regenerated
or replaced for this change. Cadence improvements are discussed in the Feelings
build record and await a sample comparison.


## Typed text and corrected phonics (17 September)

Something else opens a 160-character text area. Tapping its text reads it through
`audio.speakPrivate`, which bypasses the bundled voice lookup entirely, uses only
an English `localService === true` voice, respects mute and cancels on edits or
navigation. Even typing a known word such as HAPPY makes no selected-clip request.
No typed feeling enters storage, logs, URLs, speech APIs or the server. If the
browser has no offline English voice, the UI says so and preserves the visible
text. This is a device voice, not the identical Jenny recording across devices.

In Words, clicking the input reads the current whole word/phrase: existing bundled
content uses Jenny; other text uses the existing offline device fallback. Merely
focusing the field while typing does not trigger readback. This is pronunciation,
not automatic grapheme segmentation or blending of arbitrary English words.

The eight reported keyboard sounds A/E/I/L/O/R/X/Z now use the explicit phonemes
in `tools/little-patterns-phonics.json`. A copied build-only model configuration
sets `phoneme_type` to `text`, retaining the original pinned phoneme ID map and
model. Thus an input such as kss is no longer interpreted as letter names. The
normal model configuration is untouched. Cache filenames include the phoneme
recipe so old files cannot mask corrections. All 203 shared keys retain byte
identical recordings. The build also repaired a stale corrupted-apostrophe key
for “That’s the one”, regenerating that existing line from the current source.
Nook's voice model, accent, pacing and pitch settings were not changed.

I is interpreted as the short vowel in “in”, since the reported “eye” was a letter
name. A is the short vowel in apple; O is the British short vowel in off/on. L,
R, X and Z follow the parent's requested Ul, sustained r, Kus and voiced zzzuh.
These examples are generated, not teacher-verified phonics recordings. A parent
listening page is available at `/little-patterns/phonics-review.html`; actual
pronunciation and older-device audio still require listening on target devices.

Rebuild the bank with `python tools/build-little-patterns-voice.py`, then rebuild
the listening page with `node tools/build-little-patterns-phonics-review.cjs`.
No live speech service or LLM was added, and nothing was deployed.


Match praise now uses six rotating approved openers and forty complete character/feeling statements, for example ?Good matching! Jo is disappointed.? Playback joins an opener with the complete statement using the existing single audio player. Four new opener clips and forty statements were generated locally using the same Jenny model and settings; the unused ?Same picture? entry leaves the manifest. No runtime speech service or deployment was added.
