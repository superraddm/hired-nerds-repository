# Velvet: Messy Studio sound build

Built 18 September 2026. Original generated sounds plus a small material-driven Web Audio player, integrated into the existing studio. The separate `studio-sound-review.html` page allows listening to gestures, material pairs, weight and speed without drawing.

## Sound and interaction

35 regions in one32kHz mono PCM16 WAV: eight stroke textures, five rolling textures, ten impact variations and twelve paint-contact variations. Current tools use round, flat, crayon, sponge, eraser, paint taps/puddles/flicks/dribbles and glass/smoky/steel/pearl/wood marble sounds. Water, oil and charcoal textures are included for listening and later work; those new painting tools are not implemented.

Material hardness and damping, both bodies' weights, restitution and normal contact speed shape each collision. Dissimilar marbles can contribute two damped sound layers. Motion adjusts texture gain, speed and filtering. This is practical real-time Foley, not a general acoustic simulation or a system that physically combines arbitrary recordings.

This follows the material/physics principle described in [the original Trespasser developer postmortem](https://www.gamedeveloper.com/programming/postmortem-dreamworks-interactive-s-i-trespasser-i-), without using that game's sounds or code. Audio lifecycle follows [Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) and [touch activation rules](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/User_activation).

Sound is on by default, enabled by an accepted gesture, with a visible speaker button. There is no music, speech, recording or external audio service. Fast gestures retain a restrained gain ceiling. Contact latches suppress sustained collision chatter. There are at most four transient voices and two continuous textures; stationary scenes have no running texture sources. Loops get a scheduled fade on the audio thread as well as a main-thread watchdog. Mute fades before suspension; page hiding stops immediately so stale tails cannot restart.

## Size and provenance

The WAV is1,854,764bytes. Runtime, bank metadata, licence notice and listening page bring the sound package to about1.89MB, under the strict2,000,000-byte test ceiling. At48kHz browser output, decoded mono float data occupies5,564,160bytes (about5.3MiB); the download budget is not a browser-memory budget.

`node tools/build-studio-sounds.cjs` deterministically generates the original bank and stamps its digest into the page references. Byte length and, where Web Crypto is available, SHA-256 are checked before decoding. Recordings are mathematically synthesised, with no sampled game content, and dedicated toCC0; see the asset `NOTICE.txt`.

## Review and verification

Fable5.1 reviewed the code independently. Its review led to touch-release unlocking, contact latches, displacement-based roll sound, stable roll slots, independent clip variation counters, equal-power loop seams, interrupted-context retry, scheduled loop silence and immediate cleanup of suspended sources. Reviews and browser diagnostics are retained locally in `.wrangler/studio-sound-review/`.

Eleven focused sound tests cover profile bounds, material symmetry, voice caps, mute/background state, delayed/corrupt bank loading, hanging/rejected resume, missing audio capability, missing ended callbacks and changing roll ranks. Native Chrome audio probes confirm nonzero output for all auditioned categories, sampled peaks below0.18, no browser exceptions and no residual sources at idle/mute. Those are waveform and lifecycle checks, not a subjective assessment of pleasantness.

The full suite has136 passing tests. Touch, mouse, rotation and pinch checks run in isolated browser profiles. The final implementation still needs the user's physical iPad listening and responsiveness check. Desktop60fps and emulated viewports do not establish real-iPad performance.

Publication and remaining work are tracked in [the current build status](messy-studio-build-status.md).
