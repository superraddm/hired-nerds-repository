# Nook's Garden: Feelings

Date: 16 September 2026. Status: design draft awaiting the requested Fable 5.1 review.
Deliverable: implementation and publishing handoff for Anthropic Sonnet. This task changes documentation only; nothing is deployed.

## Purpose and scope

A quiet game for a five-year-old who enjoys words, matching patterns and copying expressions with his body. Practise noticing expressions, learning feeling words, and communicating a feeling without needing speech. Support autistic and nonspeaking children without assuming they all learn or express themselves alike. Recognising expressions and caring about people are different things.

Ship six words: **HAPPY, SAD, ANGRY, WORRIED, EXCITED, CALM**. All activities and words are immediately available. No levels to unlock, score, streak, timer, compulsory sequence or automatic next round. This is an educational play resource, not an assessment or a promise of therapeutic benefit. Matching a drawing is not evidence that a child can interpret a real person's feelings.

Three activities, selected on one small Feelings landing page:

| Child label | What happens | What counts as an answer |
| --- | --- | --- |
| Match | Find the same pictured expression; hear its feeling word. Optional pose copying follows. | A literal picture match can be right or different. |
| People | See a gentle everyday scene; ask the pictured person how they feel. | A possibility is not wrong; the character's own statement supplies the information. |
| Me | Choose a word, choose Not sure, or leave. | Every selection is accepted equally. Never graded. |

## Research and design decisions

These are adaptations of activities, not copies of programmes or evidence that this particular game works. Sources consulted 16 September 2026.

| Primary/practice source | Relevant finding/activity | Design consequence |
| --- | --- | --- |
| [National Autistic Society: four strategies for supporting autistic children to regulate emotions](https://www.autism.org.uk/learn/knowledge-hub/professional-practice/supporting-autistic-children-to-regulate-emotions) (2026 practitioner article) | Consistent visual communication and individual support; emotion cards can support children who do not use speech. | Repeat the same short words and visual conventions. Speech is optional. Do not assume a single strategy suits every child. |
| [NHS-hosted Schools Therapy Resource Pack, Speech, Language and Communication](https://sybhealthiertogether.nhs.uk/application/files/3715/7771/9040/Section_5_-_Speech_Language_and_Communication.pdf), printed pp. 208–209 | Paired emotion cards, matching another person's mime, facial/body poses, and optional mirror comparison. This is practice guidance, not a trial of this design. | A simple paired-picture game and an optional copy-the-pose activity. Remove group pressure, eye-contact demands and judging the child's performance. |
| [Autism Research Centre: The Transporters project](https://www.autismresearchcentre.com/projects/the-transporters-animation-dvd-teaching-emotion-recognition-to-preschoolers-with-autism/) | Predictable short stories, human expressions, repetition and quizzes were studied with autistic preschoolers; the project reports improved recognition-task performance. | Repeat a small vocabulary across different illustrated people and contexts. Borrow the teaching structure, not the characters, images or claims about empathy. Do not infer real-world transfer from picture matching. |
| [Oxford Health NHS: ASD pack for parents and carers](https://www.oxfordhealth.nhs.uk/wp-content/uploads/2020/03/OH-071.19-ASD-pack-for-parents-and-carers.pdf), section on difficulties using emotion cards, printed p. 6 | A child may pick a card to satisfy an adult without identifying their own internal feeling. | Me is optional; include Not sure and Something else. No right answer, reward, assumed diagnosis or saved emotion diary. The rest of this older pack is not adopted as a design framework. |
| [National Autistic Society: Autism and empathy](https://www.autism.org.uk/learn/knowledge-hub/professional-practice/autism-and-empathy) (2024, discussing qualitative adult research) | Autistic experiences of empathy vary; common deficit stereotypes miss that variation. This is not a preschool intervention study. | Teach useful vocabulary and reciprocal communication, not appearing less autistic or performing a socially expected expression. |

Design inference: pictures can introduce a vocabulary, but People must teach that expressions are clues rather than certainty. A real person may communicate their feelings using speech, writing, signing, AAC, or not share them at all. The child need not make eye contact, imitate, speak, explain or choose a feeling.

## Screen discipline

Follow the simplification in [the current spelling review](little-patterns-spelling-review.md), not its superseded button-heavy screen. No persistent Garden activity tabs inside the Feelings task. Use a separate `feelings.html` with the shared visual language, storage and audio utilities.

Every task screen has one small heading, one prompt/status region, one principal picture, and only the current actions. A quiet garden border and small Nook retain the playful style; no moving background, decorative audience, bouncing face or multiple speech bubbles. Original human figures carry the expressions, so the learning is not solely about a mascot's face.

Header: **Back** and **Menu**, each at least 48 × 48 CSS px. Back always permits leaving immediately. Menu replaces the task view and contains Sound, player selection, mode/puzzle choice and grown-up information; do not keep their controls on the task as well. Menu opens with a prominent Sound on/off control and returns to the same task. Reuse the current quiet-start preference and stop speech immediately when Menu opens. Main sound-triggering content is visibly labelled Hear where appropriate; never turn sound on merely by tapping a picture.

Match has at most seven interactive targets including header, two answer cards, target Hear, Clue and Next. People has at most seven. Me has at most seven. Menus are separate screens, not stacked over a still-interactive task. No modal inside another modal. Respect uppercase/lowercase and softer-colour preferences.

### 1. Match

Initial composition: small heading `Match`; prompt `Find the same picture.`; one large head-and-shoulders target; **two** equally styled picture cards beneath it; small `Clue` and `Next` actions. The answer cards depict the same person, clothing, background and crop as the target; only the expression differs. One is an exact duplicate. The target can be tapped to hear the word, with an accessible name and a small Hear label; that is intentionally a vocabulary support, not a hidden test.

The word appears below the target throughout. This uses the child's reading strength. It does not appear on the two answer cards until selected; screen-reader names nevertheless describe both cards fully. Equitable access matters more than preserving a visual test.

The matching card gets a steady outline. Prompt becomes `Same picture. Sad.` (substitute word). No confetti or points. A different card gets `A different picture. Look again.` in the same prompt region; retain both choices, never reshuffle after a tap. No alarm, shake, red cross or sad Nook. Clue places a steady outline around the exact matching card; does not submit it. Next is always available, including before success.

After a match, replace the answer row with `Try the pose` and `Next`; the image/word remain. Try the pose opens a simple full upper-body view: `Copy if you like. Or just look.` Only `Back` and `Next` are needed, with the normal Menu still available. No camera, microphone, scoring, movement detection, countdown or demand to hold a pose. There is no Done-to-prove-it button. Next works whether the child copies, watches or does neither.

Default mixed deck: 24 authored cards = four people × six expressions. Each target appears once per deck before repeats; next deck may reshuffle. Answer position is balanced over a deck and fixed within a round. The default is two choices; do not add a third-choice setting in v1. The puzzle picker can select any word/person directly; no completion gate. For an emotion-only selection, Next stays on that word and varies the person. `All feelings` restores the mixed deck.

### 2. People

One person and at most one prop. One short context sentence and `How might they feel?` in the same prompt area. Two word cards (with consistent small expression illustrations), `Not sure`, and a text-labelled `Ask` action. Ask is available immediately; guessing is never compulsory. Back provides immediate skip/exit. No right-answer flag exists for this activity.

Choosing either offered feeling puts `Maybe. Let's ask.` in the prompt and retains Ask. Choosing Not sure says `We can ask.` Ask reveals a **fictional character's explicit self-report**, in visible text and optional calm narration. Replace choices with that statement and `Next`. Do not tick one choice or cross out another. A selected possibility differing from the self-report never produces retry feedback. No extra explanation or mandatory acknowledgement is inserted between Ask and Next.

Six initial story cards, directly selectable. These scripts describe these fictional individuals, not universal rules. Contexts can be skipped and repeated freely.

| ID / person | Context shown | Two possibilities | Statement after Ask |
| --- | --- | --- | --- |
| puzzle-happy / Sam | Sam finishes a puzzle. | Happy / Calm | Sam says, “I feel happy.” |
| puzzle-calm / Jo | Jo finishes a puzzle. | Happy / Calm | Jo says, “I feel calm.” |
| puzzle-angry / Ali | Ali's puzzle piece will not fit. | Angry / Worried | Ali says, “I feel angry.” |
| turn-sad / Robin | Robin wanted another turn. | Sad / Angry | Robin says, “I feel sad.” |
| new-worried / Sam | Sam is trying a new puzzle. | Worried / Excited | Sam says, “I feel worried.” |
| new-excited / Jo | Jo is trying a new puzzle. | Worried / Excited | Jo says, “I feel excited.” |

The paired contexts deliberately lead to different self-reports. The excited person need not grin widely: a quiet outward expression can accompany excitement. Avoid artificial context-to-answer rules. After the sixth card, stay until Next is tapped; repeating the set is allowed, with no finish ceremony.

Grown-up note, outside play: occasionally join in if the child wants, modelling your own word or AAC symbol, e.g. `I feel happy. My shoulders feel loose today.` Say what is true for you, not what the child's body must mean. Copying is optional. Never deliberately upset someone to practise an emotion. A familiar person and voluntary communication provide a bridge beyond drawings; generalisation is not established by game completion.

### 3. Me

Prompt `A word for my feeling.` Three large choices per page, fixed order: Happy / Sad / Angry; then Calm / Worried / Excited; then Something else. `More feelings` cycles these pages without submitting. `Not sure` is present on every page. Back is always available. All words are accessible immediately through paging; no progress requirement. All cards have a visible word and the same small art used elsewhere.

Any selection, including Something else or Not sure, replaces the cards with the selected word and `You chose SAD.` / `You chose NOT SURE.` Then **Change** and **Done**. No checkmark, celebratory audio, correction, request to explain, wellbeing score or claim `You are sad`. Done returns to the Feelings landing page and clears the selection. Change allows another choice. Neither requires submitting information anywhere.

This is a small vocabulary tool, not a replacement for the child's AAC device. Something else does not ask for free text, record a private disclosure or trigger any server action. Grown-up guidance says these six words are not all possible feelings and that multiple feelings can coexist.

## Art and sensitive content

Use original, still, illustrated humans: four distinct people with a range of skin tones, hair, ages and body presentation. Each person has every expression; do not associate a skin tone, disability or character with anger/sadness. Keep the exact same outfit and background through each person's expression set. Do not use copyrighted TV characters, imitations, emoji, downloaded portrait photos or face-generating services at runtime.

Use the established Mulberry symbol set for any interface symbols, preserving its attribution/licence notice. Original human-expression illustrations are learning artwork, not a replacement AAC symbol vocabulary. Do not copy Widgit, Transporters or commercial emotion cards. Record origin/licence for every shipped asset. A licence-free claim would be inaccurate for third-party symbols; retain the project's existing attribution.

| Word | One possible mild drawing / optional pose | Avoid |
| --- | --- | --- |
| Happy | Small smile, loose shoulders, open hands. | Compulsory grin, eye contact or applause. |
| Sad | Slight downturned mouth, lower head/shoulders; hands resting. | Sobbing, tears falling, abandoned characters or bereavement. |
| Angry | Slightly drawn brows, closed mouth, hands resting firmly on thighs. | Red flashing face, clenched fists, threatening posture, yelling or destruction. |
| Worried | Slightly raised inner brows, hands held together loosely. | Threats, danger, shaking or instructions to tighten/breathe fast. |
| Excited | Small smile, forearms raised with open hands; also a quiet-expression story. | Jumping requirement, loud cheer or rapid motion. |
| Calm | Relaxed mouth, arms resting; comfortably seated option. | Suggesting stillness is morally better, or stimming incompatible with calm. |

These are examples of poses, not definitions or body-state diagnoses. Offer seated/upper-body illustrations and allow any comfortable movement. No prescribed breathing or compulsory calming exercise. Sad and angry remain available like other words, with equally gentle presentation. They do not have to become happy before the child can continue. Never label emotions good/bad or assign red/green moral categories. If an individual finds a picture upsetting, leave immediately and choose a different card; there is no compulsory exposure. No introductory montage of difficult expressions.

## Engineering handoff

Baseline: inspect current main and working tree first. At drafting, HEAD is `f89f030`, with untracked work belonging to other tasks. Respect it. The spelling review is a plan, not proof its proposed fixes are implemented. Do not rewrite Words or the other games as part of this feature.

Suggested new files under `public/fireworks/little-patterns/`: `feelings.html`, `feelings.css`, `feelings-data.js` (pure data/round selection), `feelings.js` (view/controller), and `assets/feelings/`. Add a Feelings entry to the Garden navigation with the existing interaction pattern. On narrow devices wrap/reflow entries; never compress five controls below 48 px. Keep the task on its own page so the four existing activity tabs do not crowd it. Share existing `shared.js` profile, audio, status and preferences; inspect actual exports before coding.

Data separates `expressionId`/literal matching from `reportedFeeling` in stories. Me has **no** `correctAnswer`, score or saved result. Use IDs, not rendered words, to compare exact-picture answers. Deterministic round construction supports tests. Validate complete expression coverage, asset existence, different distractor, exactly one identical match, and story IDs/scripts at build time. The content file is the authoritative place to edit all feeling words, pictures and People scripts.

Keep a small state machine per activity. Match: choosing → matched → optional pose. People: considering → revealed. Me: choosing → acknowledged → cleared. Menu may temporarily suspend any state, but leaving Me for another activity clears it. Save only chosen activity, matching/story position, shuffle seed and ordinary preferences to the existing per-player local store. Never save self-selected feelings, guesses about people, timestamps of feelings, failure counts or emotion history. Clear Me on player switch, pagehide and restored pageshow; do not insert it in URL, localStorage, sessionStorage, logs, analytics or network requests. Stop queued audio on exit/change/player switch so a previous player's private selection is not spoken later.

No accounts, backend, cloud inference, runtime LLM calls, speech recognition, camera, microphone, uploaded faces or remote sentiment analysis. Character names are invented content; player names remain local. A shared browser is not a private account: retain the current local-profile explanation.

Reuse the existing bundled local voice pipeline (`tools/build-little-patterns-voice.py`, `learning.js` `spokenBank()`, current audio manifest). Add a Feelings spoken-bank export and merge it into the authoritative build bank; do not create a second runtime speech engine or accidentally drop existing clips. All built-in labels, prompts and fictional statements should have bundled clips in the same voice across devices. Read emotional words evenly and warmly; no acted sobbing, shouting or sudden volume increase. Sound stays opt-in. Missing/broken audio never blocks play; visible text remains. Do not send player names or Me selections to an external voice service; the finite generic labels can be generated locally in advance.

Prefer lightweight SVG artwork and DOM layout, reusing components at authoring time and exporting static assets. No canvas loop, videos, external fonts or always-running animation. No preload of the entire voice bank. Initial Feelings-specific artwork target ≤300 KiB compressed; load further examples when needed. Respect reduced motion, zoom and existing iPad 5 constraints. Avoid re-rendering that loses focus or moves buttons when feedback appears. Reserve the prompt's height; don't shrink touch targets to avoid scrolling.

## Verification and Sonnet delivery order

1. Re-read scope, this spec, the Fable review and current source. Implement the data and a single Match screen first, then all states. Keep changes isolated; do not import unrelated untracked files into a commit or deployment.
2. Author the complete mild art set and six story scenes. Check at real display size that expressions differ in the face/pose, not accidental clothing/colour clues, and that anger/sadness look gentle. Do not mark placeholder face art as finished.
3. Integrate navigation, shared preferences/profiles and bundled voice. Verify mute, repeat taps, missing clip, interrupted playback, switching players and returning from background. No queued speech should outlive its screen.
4. Test meaningful behaviours: stable answer positions after errors/clues; correct literal duplicate only; every word/person selectable immediately; Next never gated; either People choice and Not sure can reach the statement without failure; Ask also works without guessing; Me accepts every option and never enters persistence/network data; private selection clears on lifecycle changes; no automatic advance. Test missing storage and new/returning local players.
5. Validate keyboard-only use, screen-reader names/live status, visible focus, 48 px minimum targets, 4.5:1 ordinary text contrast and 3:1 relevant control boundaries. Do not communicate selection solely through colour. Keep the status announcement single and polite, not repeated by multiple live regions.
6. Layout checks: 360 × 640 Android; iPad landscape 1024 × 698 and portrait 768 × 954 usable CSS viewport; zoomed text at 200%. At ordinary text size the whole task should fit those viewports with no scrolling between the picture and responses. At zoom, permit orderly vertical scrolling rather than clipping or reducing targets. Test actual iPad 5 Safari and an Android browser, especially audio initiation. Report actual-device tests as outstanding if devices are unavailable.
7. Run existing Little Patterns logic/UI tests and `node tools/stage-little-patterns.cjs --check`, updating the staging allowlist for required new files only. Discover current test entry points rather than inventing a package script. Include before/after Garden navigation checks so existing games still work.
8. Deliver source, exact content bank, art provenance, local screenshots of each state, test results and remaining limitations. Sonnet is the intended implementer/publisher. Use the established deployment workflow only after implementation and these checks, preserving other applications on the shared host; do not publish these design documents or review transcripts into the child-facing site. Codex's present task does not deploy anything.

Explicitly deferred: photo-based practice (requires consent/licensing and careful labels), cameras/mirrors on-device, parent emotion dashboards, cloud sync, intensity scales, body-sensation quizzes, complex social inference, and more emotion words. Do not add these to v1 merely because they are possible.
