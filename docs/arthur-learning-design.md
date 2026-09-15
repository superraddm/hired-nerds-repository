# Nook's Garden: learning design and visual revision

Updated 14 September 2026. Nook's Garden is now playable locally, including
Fable's subsequent literacy, addition and pattern revisions. This document records
its teaching rationale and original visual direction; [the current scope and status](arthur-games-scope.md)
records implemented behaviour and outstanding device checks. Learning outcomes
have not been evaluated with Arthur.

## What the programme review suggests

Sources are the programmes' own sites and NCETM's teaching resources, reviewed
on 14 September 2026. The game choices below are our adaptations for Arthur;
these programmes do not endorse this project.

| Programme | Documented teaching approach | Adaptation for Arthur |
| --- | --- | --- |
| [Yakka Dee](https://www.yakkadee.com/) | Early series focus an episode on one word, showing it in different visual contexts with repetition; the later Sounds series introduces letter sounds. | Keep a familiar picnic theme across activities. Repeat APPLE in pictures, written words and optional whole-word audio. Use deliberate replay and later vary examples. Tapping, choosing and typing are complete responses; never ask Arthur to say a word to continue. |
| [Hey Duggee](https://www.heyduggee.com/products/hey-duggee-the-be-careful-badge-other-stories/) and [official counting app](https://www.heyduggee.com/applications/hey-duggee-the-counting-badge/) | Stories turn activities into practical adventures. The counting app uses different early-years counting tasks and variations with several difficulty levels. | Give each activity an understandable purpose: pack a picnic, add another apple, finish a bead string. A friendly companion invites participation. Keep difficulty parent-selected and omit daily rewards, pressure and automatic progression. |
| [Numberblocks: NCETM Series 1 resources](https://www.ncetm.org.uk/classroom-resources/ey-numberblocks-series-1/) | One-to-one counting, linking the last count to a group's quantity, recognising small groups without counting, number composition, and the same total in different arrangements. | Start with actual objects in a five-space tray. Connect three objects to 3; then show two objects and one more joining into three. Later rearrange the same three objects to explore what stays the same. Number sequencing alone is not evidence of quantity understanding. |
| [Alphablocks: How it works](https://www.blocksuniverse.tv/alphablocks/how-it-works) | Systematic phonics connects letters and letter teams to sounds, including blending and segmenting. Two or more written letters may represent one sound. | Build on Arthur's independent spelling with meaningful sentence, word-picture and number-word puzzles. Optional later sound exploration must group real graphemes correctly and use checked phoneme recordings; a device voice reading letter names is not a phonics implementation. Do not force him through beginner spelling lessons. |

NCETM's [composition guidance](https://www.ncetm.org.uk/classroom-resources/ey-composition/)
also supports showing a whole alongside its smaller groups. The two coloured
group containers in the addition activity express the two parts. Objects keep
their identity when joined: the third apple is outlined rather than transformed
into a different kind of object.

## Current learning design

- A predictable cycle: look, try by tapping or typing, receive a result, choose Again
  or Next. Speech is never required. No puzzle advances on a timer.
- Quantities begin at 1-5, with 1-10 and any individual number available directly.
  Tapping an apple marks it once; Count with me supports one-to-one correspondence
  and the final total. Different arrangements are a later extension.
- Addition presents both groups and their combined quantity immediately. The child
  chooses one of three totals or uses a number keypad. Demonstration is an optional
  grown-up setting, replacing the earlier staged-joining plan. Objects remain apples;
  the additional group is outlined as well as coloured.
- Arthur already writes freely on Grid. Missing-word, missing-letter and sentence-order
  puzzles now provide meaningful reading and spelling tasks instead of a free typing
  pad. Missing words are typed from a visible bank; optional whole-word/sentence speech
  is deliberate. Number words connect spelling to numerals and quantities.
- Patterns progress through seven repeating units and gap positions at the child's
  pace. Every level is open. Hints mark the repeating group, including units longer
  than two. Incorrect choices receive a neutral prompt and another attempt.
- No disappointed mascot, lost lives, badges to earn, timed rewards, forced speed-ups
  or voice gating. Sound is opt-in; softer colours and keyboard choice are available.
- Remembering a player resumes their place and preferences. It never restricts content
  or measures ability. Players can revisit or skip any activity.

## Visual direction

Nook is an original purple sprout creature with a soft asymmetric outline,
mint leaves, cream face and turquoise hands. It is not a number, a letter, a
stacked-block character, a uniformed animal guide or a human child.

The garden has a turquoise sky, buttery yellow play area, grassy edges, large
rounded controls and mint, lilac and coral accents. A clear central task area
keeps decorative details outside the objects being counted. Shapes and outlines
carry meaning in addition to colour. No television artwork, fonts, logos, music
or character assets are included. The shared preschool qualities are broad
colour areas, simple silhouettes, friendly expressions and story-led activities.

One generated transparent PNG is reused across all four screens. After approval it
was downscaled in place from 1145 × 1374 pixels (883 KiB, about 6 MiB decoded) to
560 × 672 pixels (212 KiB, about 1.5 MiB decoded), three times its largest CSS
display size; the full-size source remains in the generation folder. The layout
and task objects use HTML/CSS, no animation loop or additional illustration
requests. The iPad 5 still needs an actual device pass; these previews do not
establish performance.

## Historical preview files

- `public/fireworks/little-patterns/workshop-preview-quantities.html`
- `public/fireworks/little-patterns/workshop-preview-addition.html`
- `public/fireworks/little-patterns/workshop-preview-words.html`
- `public/fireworks/little-patterns/workshop-preview-patterns.html`
- Shared new stylesheet: `public/fireworks/little-patterns/garden-preview.css`
- Character: `public/fireworks/little-patterns/assets/nook.png`

These files preserve the approved visual direction. Their controls are illustrations.
The playable game is now `garden.html`, using `garden.js`, `learning.js`, the base
`garden-preview.css` and `garden-live.css`. The old words preview shows an earlier
typing concept and is not the current learning design.

## Character generation record

Built-in image generation, one request, no retries. The source image remains in
the generation folder; a copy is included in the project. Prompt:

> Create ONE original preschool game mascot asset, full body centred, transparent
> background. A friendly imaginary pebble-and-sprout creature named Nook:
> asymmetrical soft pear-shaped deep lavender body, two small mint-green leaf
> sprouts growing from the head (leaves not ears), broad warm cream face patch,
> two small navy oval eyes, a tiny curved smile, three coral freckles, two short
> turquoise mitten-like arms and two stubby dark-purple feet. One arm raised in
> a gentle greeting; the other rests at its side. Personality curious, kind and
> quietly silly, appealing to a five-year-old. Bold flat 2D cut-paper children's
> animation aesthetic, rounded organic silhouette, clean large colour regions,
> subtle paper texture at most, crisp edges, minimal shading, no thick black
> outline. High-quality polished character design with a distinctive silhouette
> readable at 120px tall. Entire body and leaves inside the frame with modest
> transparent margins. No props, text, letters, numerals, logo, badge, uniform,
> hat, scenery, glow or motion effects. Do not resemble any existing television
> character: no human child, dog scout leader, cube-shaped or stacked-block
> creature, letter-headed figure, or rainbow number coding. This is a reusable
> transparent PNG illustration for a lightweight children's browser game.

## Review decisions retained

Jof's additions remain: immediate unanswered sums, equally styled addition choices,
typed missing words with a word bank, missing-letter and word-order puzzles, seven
directly selectable pattern levels, and the activity pill opening the puzzle chooser.
The old stored addition value `show` migrates to the new default `choose`; an
explicitly chosen show-answer demonstration uses `demo`.
