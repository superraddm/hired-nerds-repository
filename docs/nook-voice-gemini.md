# Nook's voice from Gemini: the pound's-worth experiment

Prepared 25 September 2026. Tool: `tools/nook-voice-gemini.py` (Python, standard library only). Nothing is
deployed by it; it makes WAV files on this PC exactly as the Piper build does. Decision: Jof, 25 September, after
research into OpenRouter. OpenRouter is not needed: Google's own Gemini API is the only one that offers Voice
Design, and that is what gives Nook a kind English grandfather rather than a stock narrator. Words outside the
built-in script continue to be spoken by the device's own voice; that is accepted.

## One-off setup

1. Get a Google AI Studio key at https://aistudio.google.com/apikey (a Google account; a new user gets a default
   project and key on accepting the terms). Free-tier requests exist; the paid rate for Gemini 3.8 Flash TTS is
   $0.00225 per 10 seconds of audio until 31 December 2026, double from January.
2. Create `.wrangler/voice-build/.env` (the folder is gitignored, so the key never enters the repo):
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Keep the key out of chat, screenshots and the game folder.

## Step 1: audition (a few pence)

```
python tools/nook-voice-gemini.py audition --dry-run    # shows the 42 requests and the estimate, spends nothing
python tools/nook-voice-gemini.py audition              # renders them
```

It designs three grandfather voices from written descriptions and adds two of Google's mature presets (Gacrux,
Sulafat) as controls, then renders the same eleven lines with each: the greeting, "Whoops! Try again", "Lovely
counting", numbers, a story line, the READ verb, and a line built from accent shibboleths (bath, cup, water,
butter). The designs, in order of preference (Jof, 25 September):

1. **northampton**: a kind grandfather from Northampton. Not a famous accent, so the description spells out what it
   is made of: East Midlands, between southern and northern; short flat *a* in bath and grass; a slightly rounded
   *u* in bus and cup; a touch of London in day and go and the odd glottal stop; dropped g's like a countryman.
   Jof expects the model may not manage it.
2. **east-midlands**: the fallback, Northampton and Leicester way, the same features more loosely described.
3. **grandad-warm**: a lightly regional control, to judge whether chasing the accent costs warmth.

Designed voice ids are cached in `.wrangler/voice-audition/voices.json` so they are only paid for once. To try
another description, edit `DESIGNS` at the top of the tool and run the audition again; only the new voice renders.

Listen at `.wrangler/voice-audition/index.html`. For the iPad: from that folder run `python -m http.server 8790`
and open `http://<this PC>:8790/` on the same Wi-Fi. Listen for warmth without slowness, British vowels in
apple, bath and twenty, a kind rather than sorry "Whoops", and "Read" rhyming with seed.

To try a different description, edit `DESIGNS` at the top of the tool and run the audition again; only the new
voice is rendered.

## Step 2: check the script, then render it (about 10p)

```
python tools/nook-voice-gemini.py script
```

writes `docs/nook-voice-gemini-script.csv`: one row per line, in the game's own order, with the exact text and
style note that will be sent, whether it goes to Gemini or is kept from Piper, the recording sheet's wording and
the current clip. Open it in Excel and check it; it is the same 255 rows as `nook-voice-recordings.csv`, matched
by `lookup_key`. Things that are deliberate:

- Sentences with a gap say the word **blank** ("Nook eats an blank."), because that is what the game plays while
  a child is still typing; the finished sentence is a separate row.
- **Read** is sent as "Read." with a style note that it is the present-tense verb rhyming with seed. Piper was
  given "reed"; Gemini gets the note instead, so the spelling on the sheet stays honest.
- Lines are sentence-cased and a lone *i* becomes *I*, so the model reads sentences rather than lists of words.
- Success lines ("Yes!", "Spot on!", "Lovely counting") carry a "pleased" note; "Whoops! Try again" carries
  "kind and reassuring"; everything else uses the one gentle grandfather style.
- The **26 phonics rows** (the ones the recording sheet marks `phonics`, both the phoneme-based vowels and the
  "buh", "kwuh" spellings) are **kept from the Piper library** unless you pass `--phonics`, because a text model
  saying "the short a sound" is the least reliable thing here. `script --phonics` shows what would be sent.

Then:

```
python tools/nook-voice-gemini.py library northampton --dry-run
python tools/nook-voice-gemini.py library northampton
```

renders the 229 Gemini rows with the chosen voice (a design name, a Google preset, or a `voice_...` id), trims
and normalises each clip the same way as the Piper build, and writes `assets/voice/*.wav`, `manifest.json` and
`voice-library.js` in the format the game already reads. The previous library is copied to
`.wrangler/voice-build/backup-<date>/` first.

Then, before deploying: `node --test tools/test-little-patterns-voice.cjs` (checks every bank entry has a clip,
24 kHz mono 16-bit, index matches), update `assets/voice/NOTICE.txt` (voice: Gemini 3.8 Flash TTS, designed
voice; output carries Google's inaudible SynthID watermark), listen to a handful on the iPad, and deploy with
`bash tools/deploy-kpopboom.sh`. Rollback is copying the backup folder back.

## Guard rails in the tool

- A hard spend cap (`SPEND_CAP_USD`, about one pound) checked before every request; the run stops rather than
  crosses it. The real audio length is counted after each call and reported.
- Retries with a pause on rate limiting; existing clips are never re-rendered, so a second run costs nothing
  for what it already has.
- The game is untouched by the audition. Only `library` writes into `assets/voice`, and only after a backup.

## What happened on the real render (27 to 29 September 2026)

- All 255 rows, phonics included (`--phonics`), are the Northampton voice `voice_l1goo4gqobvj`. Cost: 265 requests,
  802 s of audio, $0.18. The library is 31 MiB against Piper's 14.5 MiB, because the grandfather is about half Piper's pace.
- **Tier 1 still caps this model at 100 requests a day, over a rolling 24 hours.** The render took three days. For
  anything bigger (a common-words pack), use the Batch API (`batchGenerateContent` is listed for this model) or
  plan on 100 a day.
- A Gemini listening pass (gemini-3.8-flash, fed each clip and asked for a transcript or phonics IPA) found real
  faults, each fixed with a per-line note and never a voice change:
  - phonics **l** came out "ool" and **o** came out "uh" (`PHONICS_NOTES`)
  - **Nook** was said "Nock" twice (notes on those lines; the name is now capitalised mid-sentence)
  - **six gap sentences** had the word blank "corrected" to blanket, plank, blanking or "blanketed in snow" (`BLANK_NOTE`).
    Where a real word fits the gap, the model will reach for it.
- The listener mishears accented single words ("dog", "calm", "sun") when it has no context. Ask it again with the
  intended text before treating that as a fault. gemini-3.5-flash hears "ah" for every vowel, so don't use it for phonics.
- `tools/test-little-patterns-voice.cjs` now allows clips up to 14 s: the Feelings stories run to about 11 s.

## Still to decide after listening

- Which voice, and whether the description needs another turn (slower, softer, more or less regional).
- Whether to try `--phonics` and compare against the Piper sounds.
