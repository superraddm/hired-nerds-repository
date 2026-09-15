# Shared voice library

Implemented 15 September 2026; encouragement added later the same day. The built-in
game speech now uses 70 bundled WAV clips, about 2.39 MiB in total. Every device receives the same audio, with no
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
- Number words ONE to TEN.
- Every blank sentence and completed sentence. Sentence playback continues to
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
- One reusable audio element; clips load on a deliberate tap, never in bulk.
  Pause, mute, changing activity, changing player, and hiding the page cancel
  playback. A failed clip does not silently switch to another voice.
- Grown-up-supplied familiar words outside the library use an explicitly local
  English device voice. They never go to a speech server. This is the one case
  where the voice can differ between devices.
- Whole-word pronunciation is implemented. This is not a phonics library.

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
The phrase bank is `spokenBank()` in `learning.js`, shared with the voice test; it does not inspect browser storage.
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
