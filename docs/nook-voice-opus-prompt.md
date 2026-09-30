# Prompt for a new Opus 5.5 session: give Nook his Northampton voice

Paste everything below the line into Claude Code, opened at `C:\hirednerds-portfolio`.

---

You are finishing a small, parked job: replacing Nook's voice in Little Patterns with a Gemini-designed voice that
the owner (Jof) has already signed off. Nook is the grandfather character in Little Patterns, the learning games
Jof builds for his son Arthur (5, autistic, plays on an iPad 5). It is live at kpopboom.party/little-patterns/.
Everything you need is already built and tested; your job is to render, check, and hand over for listening.

## Where things stand (25 to 27 September 2026)

- The current voice is Piper "Jenny" (a build-time TTS). See `public/fireworks/little-patterns/assets/voice/`
  (`manifest.json`, `NOTICE.txt`, `voice-library.js`, 255 WAV clips).
- The replacement tool is `tools/nook-voice-gemini.py` (Python standard library only). Read
  `docs/nook-voice-gemini.md` first: it explains the three commands, what gets sent, and the guard rails.
- On 25 September the audition ran. Jof listened and said of the Northampton design: "That Northampton voice is
  amazing. Absolutely signed off when the credits resolve themselves." That voice is:
  - name `northampton`, id `voice_l1goo4gqobvj`, model `gemini-3.8-flash-tts`
  - its description is cached in `.wrangler/voice-audition/voices.json`
  - the audition is at `.wrangler/voice-audition/index.html`
- The credits are resolved. The Google AI Studio project "NookVoice" is on Tier 1 prepay, billed to "My Billing
  Account", so the free-tier cap of 10 requests a day no longer applies. The key is in
  `.wrangler/voice-build/.env` as `GEMINI_API_KEY`; the folder is gitignored. Never print, echo, commit or copy
  the key anywhere else.
- **All 255 lines, including the 26 phonics sounds, must be the new Northampton voice** (Jof, 27 September). The
  tool's default keeps phonics on Piper, so every command below uses `--phonics`. The 26 phonics rows are the ones
  `docs/nook-voice-recordings.csv` marks `recording_type` = `phonics`: the vowel sounds and spellings such as
  "buh" and "kwuh". They are sent with `PHONICS_STYLE` from the tool: say only the short letter sound, never the
  letter's name.
- Cost: about 10 to 12p for all 255. The tool has a hard cap, `SPEND_CAP_USD = 1.30` (about £1), checked before
  every request.

## What to do

1. **Check before you spend.**
   - Read the doc and the tool.
   - Regenerate the review sheet with phonics included: `python tools/nook-voice-gemini.py script --phonics`.
     Confirm `docs/nook-voice-gemini-script.csv` now shows all 255 rows as Gemini, and read the 26 phonics rows'
     text and style note.
   - Confirm the key loads without printing it.
   - Run `python tools/nook-voice-gemini.py library northampton --phonics --dry-run` and report the request count
     (it should be 255 lines to render, 0 phonics clips kept) and the estimate. If anything is wrong (the voice id, the row count, a cost well over 20p), stop and tell Jof.
2. **Render.** Run `python tools/nook-voice-gemini.py library northampton --phonics`.
   - It backs up the current library to `.wrangler/voice-build/backup-<date>/` first, renders all 255 rows,
     trims and normalises them like the Piper build, and writes `assets/voice/*.wav`, `manifest.json` and
     `voice-library.js` in the format the game already reads.
   - If it is interrupted, re-run it: it never re-renders a clip it already has.
   - On Windows, set `PYTHONIOENCODING=utf-8` if printing fails on a "→" (this failed once, on 26 September).
3. **Verify.**
   - Run `node --test tools/test-little-patterns-voice.cjs`: every bank entry has a clip, 24 kHz mono 16-bit, the
     index matches.
   - Also run `node tools/test-little-patterns.cjs` and `node tools/test-little-patterns-feelings.cjs` if they
     exist and apply.
   - Check a sample of clips for silence, clipping, cut-off endings and wrong words. The known traps:
     - "Read" must rhyme with seed.
     - Gap sentences say "blank".
     - "Whoops! Try again" must sound kind, not sorry.
     - Numbers must be clear.
   - **The phonics sounds need the most care.** A text-to-speech model saying a single letter sound is the least
     reliable thing here, and Arthur is learning to read from these. Check every one of the 26:
     - short sound only, never the letter name ("a" as in apple, not "ay")
     - no added word, no trailing vowel beyond what the spelling asks for ("buh", not "buh-uh")
     - not whispered or cut off
   - Rebuild the phonics review page (`node tools/build-little-patterns-phonics-review.cjs`, if it applies) so Jof
     can hear all 26 side by side at `/little-patterns/phonics-review.html`.
   - A bad phonics clip is re-rendered on its own. Work out from the tool how it caches clips (it never re-renders
     one it already has): delete that one clip and re-run. If a style note needs a tweak for a particular sound, add
     it the way `STYLE_OVERRIDES`-type entries are done, and never change the voice. Report every re-render and
     its cost.
4. **Update `assets/voice/NOTICE.txt`**: voice Gemini 3.8 Flash TTS, designed voice `voice_l1goo4gqobvj`
   (a kind Northampton grandfather), for every clip including phonics; the output carries Google's inaudible
   SynthID watermark; Piper is no longer used.
5. **Hand over for listening. Stop here.**
   - Give Jof a local listening route: `node tools/serve-fireworks.cjs 8788`, then
     `http://localhost:8788/little-patterns/`, and the iPad route over the same Wi-Fi.
   - Give him a list of about eight lines worth hearing first, plus the phonics review page for all 26 sounds,
     and the cost actually spent.
   - Do not deploy.

## Rules

- **Do not deploy, commit or push** unless Jof says so in this session. When he says deploy:
  - run `bash tools/deploy-kpopboom.sh`
  - then verify the live voice files by hash against local
  - kpopboom.party is a direct upload; it does not deploy on push.
- **Rollback** is copying the backup folder back over `assets/voice/`. It holds the old Piper clips, phonics included.
- **Do not touch other folders.** The repo holds other uncommitted work (Mike the Mic, Messy Studio, Glow Girls).
- **Do not re-design the voice** or try other presets unless Jof asks: this voice is signed off.
- **Phonics are the Northampton voice too.** Always pass `--phonics`. Nothing stays on Piper.
- **Bash heredocs** containing apostrophes get mangled in this environment. Write multi-line files with the Write
  tool.
- Jof is not a developer. Explain what you did in plain words, and lead with what he should listen to.
