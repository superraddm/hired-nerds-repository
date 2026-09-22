# Recording Nook's voice and speaking new words

Prepared 18 September 2026. Assessment only: no voices replaced, models installed, training started or website changes deployed.

## Recording sheet

`nook-voice-recordings.csv` contains all **255 entries in the current bundled speech manifest**, including **26 phonics sounds**. The existing clips total **4 minutes 49 seconds**. Actual recording time, pauses and retakes will be longer.

The first three columns are the script or sound, the current recording's full local path and filename, and an empty replacement path and filename for you to fill in. Additional columns preserve the internal lookup key, stable recording identifier, duration, category, instructions and expected public audio URL. Public URLs are derived from the deployed directory structure; this export checked local file existence, not each URL over the network.

The sheet is UTF-8 with a BOM and Windows line endings for Excel. The first 26 rows are alphabet sounds in order. Their instructions are **not words to read aloud**: record the sound described. Machine keys such as `phonics-a` and `buh` are identifiers, not recording scripts. The eight explicitly corrected sounds retain the current requested directions. The other eighteen are flagged as earlier approximations rather than presenting their synthetic pronunciation as a teaching standard.

Other rows preserve the actual spoken words, with source punctuation where available. Say “blank” in the incomplete sentences. READ is the present-tense verb, pronounced “reed”. Some near-duplicates are separate internal entries; they can point to the same replacement recording where the intended speech is identical. Retained acknowledgement clips are included even where the current screen no longer uses them.

These are reusable speech clips, not every combination the game can assemble: number phrases, arithmetic and some success messages join existing clips. There is no finite inventory of everything a player might type. The 35 Messy Studio sound-effect regions are not spoken lines and are excluded.

Record one clean take per row if convenient, using the same microphone and room, without background music or added reverb. Keep your comfortable natural accent and cadence. Mono WAV is a useful master format. Preserve the originals; volume matching and trimming can be done later without applying the existing synthetic voice's pitch lift to your voice. Put each replacement's accessible full path, including its filename, in the blank column. Filling the sheet does not import or publish anything; an importer and playback checks would be a later step.

## Recommended first step

Use your real recordings for built-in speech and phonics. Keep the current **explicitly local device voice** for new typed text. This is the smallest change, avoids model download or inference on the older iPad, and preserves the existing rule that private writing and player names stay on the device. The trade-off is that novel text will use a different voice, and an English local voice must be available on that device.

The browser exposes installed voices and whether they use a local service. The game already filters for local English voices; it does not silently use a remote speech service. Browser speech synthesis does not provide a standard API for installing a custom voice model supplied by the website. See [available browser voices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices) and [localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).

For more natural built-in feedback, record complete commonly used sentences where cadence matters. Joining “Correct!” and “Ali is sad.” is workable, but separately recorded fragments cannot share the timing and intonation of a single take. Keep reusable number clips for the much larger set of arithmetic combinations.

## Speaking arbitrary text in your voice without an LLM

A custom **Piper/VITS** voice is a plausible route. This is neural text-to-speech, not a chat LLM: text is converted to phonemes and speech is synthesized by an acoustic model. Piper runs locally and supports training a voice from paired recordings and transcripts, then exporting it for inference. See the [Piper project](https://github.com/OHF-Voice/piper1-gpl), [training documentation](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/TRAINING.md), and [VITS architecture paper](https://arxiv.org/abs/2106.06103).

Training and inference are different jobs. Training should happen on user-controlled hardware, normally with a suitable GPU, and can take substantial experimentation. The resulting voice can run on user-controlled compute for speech generation. The existing project already uses Piper on this Windows machine to generate static clips; it does not currently host a runtime speech endpoint.

Five minutes of short, repetitive game clips should not be treated as sufficient to train a reliable general-purpose voice. I would budget **30–60 minutes of varied, accurately transcribed speech for an initial fine-tuning pilot**, then evaluate it before promising a finished voice. That range is a planning estimate, not a documented Piper minimum or a guarantee. The needed amount depends on the starting model, recording consistency, sound coverage and desired resemblance. A separate balanced reading script would be better training material than repeating game phrases alone. Keep the 26 teaching sounds as direct recordings even after a model exists.

Evaluate familiar and unseen sentences, short words, names, numbers, questions, pauses and ambiguous spellings. A model can sound convincing on its training phrases but perform poorly on new writing. Do not replace the current voice until you have heard and approved samples.

The current maintained Piper engine is GPL-3.0, and model/dataset terms must be checked separately before choosing a training starting point or distributing a model. Your recordings do not override those terms. Alternatives advertised as quick voice cloning are not automatically suitable: some use language-model backbones or restrictive pretrained-weight terms. For example, [F5-TTS documents a non-commercial licence for its pretrained models](https://github.com/SWivid/F5-TTS). Do not substitute an external voice-cloning API.

## Where it would run

**On your own server:** a small speech service could receive permitted text, generate audio using your custom voice and return it to the browser. The iPad would only play audio. The current Cloudflare Pages deployment serves static game files; a dedicated user-controlled machine/service is still needed for this proposed Piper runtime. The local development machine could be used for a prototype, but a production service would need reliable availability. Cloudflare Pages Functions run on the [Workers runtime](https://developers.cloudflare.com/pages/functions/), rather than being an ordinary Python host for the existing Piper installation.

A server service is compatible with “no third-party speech or LLM calls”, but **it still receives the typed text**. It must not silently receive children's names or private feelings: those currently have the stricter device-only requirement. Keep those paths on local device speech unless that policy is explicitly changed. For allowed server synthesis, avoid recording request bodies, retaining generated personal speech or sharing a cache of user-entered text; constrain request size and concurrency so the service remains responsive.

**Entirely on the device:** a custom model would need its own browser inference engine, not just the existing browser voice API. This avoids sending text anywhere, but adds a model download, memory use and inference cost. Performance and compatibility on the iPad 5 would need a real-device prototype; I would not promise it for this hardware. A native app is another possibility, but changes the browser-only scope.

**Pre-generated audio:** generating all known game lines on your own machine and serving the finished files is already the proven approach. It gives identical speech on every device at low runtime cost, but cannot cover unlimited new text.

## Suggested sequence

1. Record a short sample set first: a greeting, feedback, a longer story, several individual words and the trickier phonics sounds. Agree on pacing and loudness before recording everything.
2. Record the remaining sheet and fill in replacement paths. Import and validate separately when requested; retain the current library for rollback.
3. Keep private typed-text readback on a device-local voice.
4. If hearing new sentences in your own voice remains important, prepare a separate balanced training script and run a local Piper fine-tuning pilot. Review unseen-text samples and real hardware latency before deciding on runtime deployment.

The important distinction is between a complete library of **known lines**, which is straightforward, and a voice capable of reading **new writing**, which is a separate speech-model project. Neither requires an LLM call in a game.
