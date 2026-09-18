# Messy Studio: tactile sound direction

Status: implemented locally on 18 September 2026; see [the build record](messy-studio-sound-build.md). The requirements below remain the listening criteria.

## User confirmation and priority

The user has now tested Fable's latest deployment on the iPad and confirmed that marble motion is more stable. The visible repeated-patch appearance of the trails is an acceptable compromise, although a continuous smear would look better. Preserve this accepted performance baseline; do not reopen or increase the cost of the paint renderer merely to add sound.

Sound is a requested part of the creative and mindfulness experience, not incidental polish to defer until after new materials. The requested character is **muted, crisp, clear, close and tactile**: gentle marble clacks, brushes moving over paper and small flecks of paint landing. Here, “muted” means subdued in volume and texture, not switched off by default.

Use sound on by default, following the user's family-wide game preference, with a visible Sound toggle. The first permitted interaction enables playback. An explicit mute must remain respected through tool changes. No sound should interrupt or delay the first painted mark.

## Creative direction

Aim for the sound of handling the materials at a quiet table. “Crisp” means the contact is easy to recognise, not that it has a sharp or loud transient. A soft attack, a clean brief body and a restrained decay should make contact distinct without producing clicks caused by the audio engine itself.

Quiet gaps are part of the experience. Paint that has landed is silent. A stationary brush or marble is silent. Menus and untouched controls do not produce a constant sound bed. Idyllic and calming does not require music, bird calls, water ambience, whispering, applause or periodic narration. Keep the child's action as the cause of the sound.

This is an ASMR-inspired material sound direction, not a promise that every listener will find the same sounds pleasant. Make muting immediate and easy. Test through the iPad's own speakers as well as ordinary headphones; headphones are optional.

## Current tools

| Action | Sound | What changes with the action |
|---|---|---|
| Round brush | A close, soft brush swish with a little paper contact | Movement speed changes texture gently; brush width adds a little body |
| Flat brush | A broader, slightly more bristly sweep | Direction changes and wider strokes affect texture without increasing loudness dramatically |
| Crayon | Fine, dry grain with a rounded rubbing sound | Faster movement produces a slightly denser grain; no shrill squeak |
| Sponge | A soft, small damp dab; light texture while dragging | Separate dabs remain recognisable; overlapping dabs merge instead of sounding like a machine gun |
| Eraser | A quiet, rounded paper rub | Exists only while erasing; no success chime or negative sound |
| Small paint tap | A tiny soft plip | A small amount of variation prevents obvious repetition |
| Held paint puddle | A fuller but restrained plop on intentional release | More paint adds body, with a firm loudness cap |
| Flick | One short wet splat, with a few delicate fleck contacts | Gesture energy changes spread and texture more than volume |
| Marble rolling | A faint textured roll, softer over paint | Speed changes the texture and fades it in/out; settled marbles are silent |
| Marble touches an edge | A small rounded tick against the tray | Strength follows the new contact's impact, with very quiet contacts suppressed |
| Marble hits another marble | A gentle, clear clack | Material and relative impact provide modest variation; no metallic crash or sharp glass ring |
| Marble placed on paper | A small soft contact | One contact per placement, without a falling or bouncing sound sequence that the image does not show |

Preserve the basic sound identity of a material. Vary a small number of texture, pitch or timing details within that identity; do not choose unrelated sounds at random. A large or heavy marble can sound slightly fuller, while a small one sounds lighter, but all remain within the same comfortable loudness envelope.

Do not give every visible droplet its own independent sound. Treat a flick as one small auditory event with a bounded few flecks. Similarly, a marble resting against an edge must not repeatedly clack on each physics frame. A new collision, not persistent contact, is the trigger.

## Future materials

The same sound system must support future liquids of different viscosities and charcoal used over a stencil. These are sound requirements for those future tools, not authorisation to implement the materials now.

- **Thin liquid/water:** a light, smooth wet swish and occasional tiny drops. Avoid a continuous running-tap effect. Sound follows the local stroke or movement of liquid, rather than filling the whole session.
- **Thicker liquid/oil:** a fuller, slower rubbing or pulling texture, with a subtle sense of resistance. Higher viscosity changes the character of the sound, not simply its loudness. Avoid exaggerated sticky popping or cartoon squelches.
- **Charcoal over a stencil:** a crisp but soft granular scratch as the hand rubs across the paper. Repeated movement can change the grain slightly. Sound follows rubbing; the stencil being revealed does not trigger a reward or musical flourish. Lift the finger and the scratch stops.
- **Finger smudging:** a soft friction texture that changes between dry pigment and wet paint. Reuse the common movement/contact controls rather than adding an independent engine.

Audio should agree with the visible material and gesture. Do not infer the child's mood or attempt to enforce a calmer pace by making energetic gestures unpleasant.

## Interaction and sound controls

Keep one obvious Sound on/off control on the studio screen. Put a simple master-volume adjustment in secondary settings if needed; individual frequencies, mixer channels and material sliders do not belong in the child's tool tray.

Stopping movement, switching tools, Undo, New picture, navigation and interrupted input must end the relevant sound promptly, using a brief fade where possible. Cancellation must not trigger the intentional-release splat. Undo changes the picture without replaying the original paint sound backwards or narrating it.

When the page is hidden, stop contact sounds and suspend active audio work. Returning must not replay old impacts or start rolling sound until the current interaction actually resumes. Handle unavailable or blocked audio without blocking painting. New material sounds inherit all these rules automatically.

## Implementation requirements

- Keep sound independent of the canvas drawing code. The renderer supplies material/contact events and a small current-motion state; the sound layer does not read pixels, create paint marks or determine physics.
- Provide reusable operations for starting/updating/ending a material stroke, a paint landing, a marble impact and a rolling state. Material descriptions supply their own texture and response parameters.
- Start with lightweight generated contact sounds and reusable short texture buffers. If these cannot produce the requested natural quality, review a small number of original or appropriately licensed recorded textures instead of accepting a harsh synthetic hiss. No live audio service or LLM is needed.
- Use a shared audio context, master gain and conservative output ceiling. Avoid overlapping contacts accumulating into a loud burst. As an initial budget, limit the mix to two continuous texture layers and four brief contact voices; confirm the result by listening on the target device.
- Smooth parameter changes and volume envelopes. Do not allocate a new sound generator for every pointer sample or every droplet. Do not route the visual animation through an audio timer.
- Rate-limit repeated collision contacts and distinguish first contact from continued contact. Derive impact strength from bounded relative movement rather than raw noisy input spikes.
- Reuse buffers and retire transient sound nodes after their short decay. Stationary scenes must not retain silent running texture loops. The existing marble frame loop must still sleep when nothing moves.
- Treat the current accepted iPad performance as the comparison baseline. Measure sound enabled and disabled with the same painting and three-marble workload. If audio makes drawing less responsive, simplify sound density or processing before changing the paint renderer.

## Acceptance and review

1. Listen to each tool individually on iPad speakers at an ordinary device volume. Contacts are recognisable, clear and soft; no sudden peaks, harsh hiss or persistent ringing.
2. Paint slowly, quickly and with repeated dots. Sound follows the action without conspicuous stepping or lag.
3. Flick repeatedly using eight colours. Sound remains a small sequence of paint contacts, not an escalating wall of noise.
4. Roll three marbles, including repeated collisions and corner contacts. Clacks stay gentle; resting contact is silent; the mixed output remains restrained.
5. Stop, mute, switch tools, undo, cancel a gesture and leave/return to the page. No sound gets stuck and no old contact is replayed.
6. Confirm that the studio remains fully usable with sound muted or unavailable, and that sound on/off does not change paint results.
7. Compare actual iPad interaction performance with the accepted silent release. Preserve its responsiveness and accepted trail quality.
8. Obtain a short listening review before deployment. Sound quality cannot be established from code inspection, waveform checks or a claim that the synthesis is technically correct.

The original direction was documentation-only. The subsequent build adds original assets, runtime integration and a listening table; its verification and publication status are recorded separately.
