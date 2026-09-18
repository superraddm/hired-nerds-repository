# Nook's Garden: Feelings

> **Latest Me correction:** Show all ten feelings together; taps speak the name,
> character taps repeat it, and header Back returns. Sound is visible on the page.
> No More feelings, Change, Done or “Hear my words”. Voice recordings unchanged.
>
> **17 September expansion:** The current build now offers ten feelings, twenty
> stories and four small Me pages. See the current build record below.
>
> **17 September correction:** The parent clarified that reading comprehension
> is uncertain. The original People guessing/Ask flow and seven puzzle stories
> below are superseded by the [current build record](nook-feelings-build.md#current-design-correction):
> twelve varied illustrated stories, an explicit feeling from the start, local
> narration and only Hear/Next task controls. Match distractors now have equal
> exposure, with no pair of two difficult feelings. The earlier Fable review and
> preview are historical design records, not the current interface.


Date: 16 September 2026. Status: Fable 5.1 review complete; now implemented locally following the user's subsequent request to build with Astra instead of Sonnet.
The specification below records the approved design and original handoff. See the [current build record](nook-feelings-build.md) for implemented behaviour, verification and remaining device/art review. Pain/hurt remains out of scope. This build has not been deployed by this task.

Start here; the [visual design sheet](nook-feelings-preview.html) and [rendered preview](nook-feelings-preview.png) illustrate the initial screens. The [verbatim Fable review](nook-feelings-fable-review.md) records the independent critique. This revised document supersedes the [reviewed draft](nook-feelings-reviewed-draft.md). The preview is a static composition study, not a working game or the final art bank.

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

Header: **Back** and **Menu**, each at least 48 × 48 CSS px. Back leaves the task for the Feelings landing page without confirmation, except that Back from the optional pose returns to the matched card. Menu replaces the task view and contains Sound, player selection, mode/puzzle choice and grown-up information; do not keep their controls on the task as well. Menu opens with a prominent Sound on/off control and returns to the same task. Reuse the current quiet-start preference and stop speech immediately when Menu opens. Main sound-triggering content is visibly labelled Hear where appropriate; never turn sound on merely by tapping a picture. Menu also offers Hear again for the current instruction/context when Sound is on.

Match has at most six interactive targets including header, two answer cards, target Hear and Next. People has at most seven. Me has seven on its first page and eight on its second: the one extra feeling card removes an unnecessary third page. Keep a fixed-height response area; that exception must still pass the small-screen fit checks. Menus are separate screens, not stacked over a still-interactive task. No modal inside another modal. Respect uppercase/lowercase and softer-colour preferences.

### 1. Match

Initial composition: small heading `Match`; prompt `Find the same picture.`; one large head-and-shoulders target; **two** equally styled picture cards beneath it; a `Next` action. The answer cards depict the same person, clothing, background and crop as the target; only the expression differs. One is an exact duplicate. The target can be tapped to hear the word, with an accessible name and a small Hear label; that is intentionally a vocabulary support, not a hidden test. No separate Clue button in this two-choice activity.

The word appears below the target throughout. This uses the child's reading strength. It does not appear on the two answer cards until selected; screen-reader names nevertheless describe both cards fully. Equitable access matters more than preserving a visual test.

The matching card gets a steady outline. Prompt becomes `Same picture.`; the target's word remains visible and can be heard again. No confetti or points. A different card reveals its own word in a reserved label slot and gets `A different picture. Look again.` in the same prompt region; retain both choices, never reshuffle after a tap. Speak its own word first when Sound is on. A wrong tap stays in the choosing state and increments no counter. No alarm, shake, red cross or sad Nook. Next is always available, including before success.

After a match, replace the answer row with `Try the pose` and `Next`; the image/word remain. Try the pose opens a simple full upper-body view: `Copy if you like. Or just look.` Only `Back` and `Next` are needed, with the normal Menu still available. No camera, microphone, scoring, movement detection, countdown or demand to hold a pose. There is no Done-to-prove-it button. Next works whether the child copies, watches or does neither.

Default mixed deck: 24 authored cards = four people × six expressions. Each target appears once per deck before repeats; next deck may reshuffle. Answer position is balanced over a deck and fixed within a round. The default is two choices; do not add a third-choice setting in v1. The picker contains the six words and `All feelings`, not a second 24-item person selector. Choosing a word goes directly to it; Next stays on that word and varies the person. All words/people remain available without completion gates. `All feelings` restores the mixed deck. Author explicit, visibly distinct distractor pairs; avoid Happy–Excited and Happy–Calm in the default deck. Literal matching must not depend on minute differences.

### 2. People

One person and at most one prop. One short context sentence and `How might they feel?` in the same prompt area. Two plain word cards, `Not sure`, a text-labelled `Ask [name]` action, and `Next`. There are no expression thumbnails on these answers: do not turn this into another face-matching task. Ask and Next are available immediately; guessing is never compulsory. Next advances without asking; Back exits. No right-answer flag exists for this activity. On entry, narrate the short context and prompt once only if Sound is already on; otherwise remain silent. Menu's Hear again replays it, without adding another task-screen control.

Choosing either offered feeling puts `Maybe. Let's ask.` in the prompt and retains Ask and Next. Choosing Not sure says `We can ask.` Ask reveals a **fictional character's explicit self-report**, in visible text and optional calm narration. Replace choices/Ask with that statement and keep `Next` in the same position. The statement is a Hear button for replay when Sound is on. Do not tick one choice or cross out another. A selected possibility differing from the self-report never produces retry feedback. No extra explanation or mandatory acknowledgement is inserted between Ask and Next.

Seven initial story cards, directly selectable. These scripts describe these fictional individuals, not universal rules. Most use a familiar puzzle context to keep the first release small. Contexts can be skipped and repeated freely.

| ID / person | Context shown | Two possibilities | Statement after Ask |
| --- | --- | --- | --- |
| puzzle-happy / Sam | Sam finishes a puzzle. | Happy / Calm | Sam says, “I feel happy.” |
| puzzle-calm / Jo | Jo finishes a puzzle. | Happy / Calm | Jo says, “I feel calm.” |
| puzzle-angry / Ali | Ali's puzzle piece will not fit. | Angry / Worried | Ali says, “I feel angry.” |
| turn-sad / Robin | Robin wanted another turn. | Sad / Angry | Robin says, “I feel sad.” |
| new-worried / Sam | Sam is trying a new puzzle. | Worried / Excited | Sam says, “I feel worried.” |
| new-excited / Jo | Jo is trying a new puzzle. | Worried / Excited | Jo says, “I feel excited.” |
| choosing-unsure / Robin | Robin is choosing a game. | Happy / Worried | Robin says, “I'm not sure how I feel.” |

The paired contexts deliberately lead to different self-reports. The excited person need not grin widely: a quiet outward expression can accompany excitement. This quieter story drawing is separate from the canonical excited Match drawing. Avoid artificial context-to-answer rules. The unsure story models a valid answer from another person, not just an escape button for the player. After the seventh card, stay until Next is tapped; repeating the set is allowed, with no finish ceremony.

Grown-up note, outside play: occasionally join in if the child wants, modelling your own word or AAC symbol, e.g. `I feel happy. My shoulders feel loose today.` Say what is true for you, not what the child's body must mean. Copying is optional. Never deliberately upset someone to practise an emotion. Use Next to skip an uncomfortable card, or Menu to choose a word to stay with. A familiar person and voluntary communication provide a bridge beyond drawings; generalisation is not established by game completion. These seven stories do not teach the whole range of mixed feelings or choosing not to disclose; do not claim they do.

### 3. Me

Prompt `A word for my feeling.` Two pages only: Happy / Sad / Angry; then Calm / Worried / Excited / Something else. `More feelings` toggles pages without submitting. `Not sure` is present on both. Keep its position and More feelings stable. First-page cards may use three rows; second-page cards use a two-by-two grid in the same reserved response area. Back is always available. All words are accessible immediately through paging; no progress requirement. Each feeling card has a visible word and one consistent small example portrait, independent of the People story's actor. Something else and Not sure use text with a neutral interface symbol if needed, never invented diagnostic faces.

Any selection, including Something else or Not sure, replaces the cards with the selected word and `You chose SAD.` / `You chose NOT SURE.` Then **Change** and **Done**. The acknowledgement is also a Hear button and speaks once on selection only if Sound is on and its local clip is ready. Supply eight complete acknowledgement clips, including Something else and Not sure. No checkmark, celebratory audio, correction, request to explain, wellbeing score or claim `You are sad`. Done or header Back returns to the Feelings landing page and clears the selection. Change returns to the page containing the chosen word; Not sure returns to the page where it was chosen. Neither action submits information anywhere.

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

Baseline: inspect current main and working tree first. HEAD was `f89f030` when drafting and `4df2d41` when finalising; other work is actively changing this repository. Untracked files also belong to other tasks. Respect them. The spelling review is a plan, not proof its proposed fixes are implemented; re-read the actual source. Do not rewrite Words or the other games as part of this feature.

Suggested new files under `public/fireworks/little-patterns/`: `feelings.html`, `feelings.css`, `feelings-data.js` (pure data/round selection), `feelings.js` (view/controller), and `assets/feelings/`. Add a Feelings entry to the Garden navigation with the existing interaction pattern. On narrow devices wrap/reflow entries; never compress five controls below 48 px. Keep the task on its own page so the four existing activity tabs do not crowd it. Share existing `shared.js` profile, audio, status and preferences; inspect actual exports before coding.

Data separates `expressionId`/literal matching from `reportedFeeling` in stories. Me has **no** `correctAnswer`, score or saved result. Use IDs, not rendered words, to compare exact-picture answers. Deterministic round construction supports tests. Validate complete expression coverage, asset existence, different distractor, exactly one identical match, and story IDs/scripts at build time. The content file is the authoritative place to edit all feeling words, pictures and People scripts.

Keep a small state machine per activity. Match: choosing → matched → optional pose. People: considering → revealed. Me: choosing → acknowledged → cleared. Menu may temporarily suspend any state, but leaving Me for another activity clears it. Save only chosen activity, matching/story position, shuffle seed and ordinary preferences to the existing per-player local store. A saved Match word filter is a practice preference, never a self-report. Never save self-selected feelings, guesses about people, timestamps of feelings, failure counts or emotion history. Clear Me on player switch, pagehide and restored pageshow; do not insert it in URL, localStorage, sessionStorage, logs, analytics or selection-dependent network requests. A visibility change alone stops speech but may retain the in-memory card so the child can show it to someone; no resume should automatically replay it. Navigation/back-forward restoration clears it even for the same profile. Stop queued audio and clear live-region text on exit/change/player switch so a previous player's private selection is not spoken later.

No accounts, backend, cloud inference, runtime LLM calls, speech recognition, camera, microphone, uploaded faces or remote sentiment analysis. Character names are invented content; player names remain local. A shared browser is not a private account: retain the current local-profile explanation.

Reuse the existing bundled local voice pipeline (`tools/build-little-patterns-voice.py`, `learning.js` `spokenBank()`, current audio manifest). Add a Feelings spoken-bank export and merge it into the authoritative build bank; do not create a second runtime speech engine or accidentally drop existing clips. All built-in labels, prompts and fictional statements should have bundled clips in the same voice across devices. Read emotional words evenly and warmly; no acted sobbing, shouting or sudden volume increase. Sound stays opt-in. Missing/broken audio never blocks play; visible text remains. Do not send player names or Me selections to an external voice service; the finite generic labels can be generated locally in advance.

Privacy also applies to static assets: fetching only the chosen Me clip/image would expose a choice through ordinary server access logs. Before any Me selection, load the **same fixed small bundle** containing all eight acknowledgements and all its portraits, regardless of which page or feeling is chosen. Retain audio as in-memory Blob URLs/buffers and artwork as a shared local sprite. Never lazily fetch an individual asset in response to a Me selection, including retries. Extend the shared playback helper to consume these local sources; do not introduce another competing player. If a clip is unavailable, keep the text and remain silent; no selection-triggered remote fallback. Assert with network interception that selecting/replaying/changing every Me option causes zero requests. Normal page loads and fixed, choice-independent asset downloads still contact the static host.

Prefer lightweight SVG artwork and DOM layout, reusing components at authoring time and exporting static assets. No canvas loop, videos, external fonts or always-running animation. No preload of the entire site voice bank; Me's small fixed privacy bundle is an explicit exception to loading only the current clip. Initial Feelings-specific artwork target ≤300 KiB compressed; load further Match/People examples when needed. Respect reduced motion, zoom and existing iPad 5 constraints. Avoid re-rendering that loses focus or moves buttons when feedback appears. Reserve the prompt's height and the answer-label slots; don't shrink touch targets to avoid scrolling.

## Verification and Sonnet delivery order

1. Re-read scope, this spec, the Fable review and current source. Implement the data and a single Match screen first, then all states. Keep changes isolated; do not import unrelated untracked files into a commit or deployment.
2. Author the complete mild art set and seven story scenes. For Match, manually check at real display size that expressions differ clearly in the face/pose, not accidental clothing/colour clues; story art may intentionally show a quieter expression. Before final publication, show Jof the eight sad/angry portraits and their pose variants at target-device size as one review sheet, and incorporate any discomfort concerns. The current illustrative preview is not approval of the eventual art. Do not mark placeholder art as finished or ask a child to endure an upsetting image to test it.
3. Integrate navigation, shared preferences/profiles and bundled voice. Verify mute, repeat taps, missing clip, interrupted playback, switching players and returning from background. No queued speech should outlive its screen.
4. Test meaningful behaviours: stable answer positions after errors; wrong Match tap reveals its word without completing; correct literal duplicate only; all six words available immediately and all four people reachable without completion; pose Back restores the matched card; Next never gated, including before People Ask; either People choice and Not sure can reach the statement without failure; Ask also works without guessing; the seventh story models uncertainty; Me has two pages, accepts every option, returns Change to the right page and never enters persistence/selection-dependent network data; all eight acknowledgement clips exist; private selection and live-region/audio content clear on lifecycle changes; no automatic advance. Test missing storage, failed fixed-bundle loading and new/returning local players.
5. Validate keyboard-only use, screen-reader names/live status, visible focus, 48 px minimum targets, 4.5:1 ordinary text contrast and 3:1 relevant control boundaries. Do not communicate selection solely through colour. Keep the status announcement single and polite, not repeated by multiple live regions.
6. Layout checks: 360 × 640 Android; iPad landscape 1024 × 698 and portrait 768 × 954 usable CSS viewport; zoomed text at 200%. At ordinary text size the whole task should fit those viewports with no scrolling between the picture and responses. At zoom, permit orderly vertical scrolling rather than clipping or reducing targets. Test actual iPad 5 Safari and an Android browser, especially audio initiation. Report actual-device tests as outstanding if devices are unavailable.
7. Run `node --test tools/test-little-patterns.cjs tools/test-little-patterns-ui.cjs tools/test-little-patterns-voice.cjs`, new meaningful Feelings tests, and `node tools/stage-little-patterns.cjs --check`, updating the staging allowlist for required new files only. Re-check these entry points against the current checkout. Include before/after Garden navigation checks so existing games still work.
8. Deliver source, exact content bank, art provenance, local screenshots of each state, test results and remaining limitations. Sonnet is the intended implementer/publisher. Use the established deployment workflow only after implementation and these checks, preserving other applications on the shared host; do not publish these design documents or review transcripts into the child-facing site. Codex's present task does not deploy anything.

Explicitly deferred: photo-based practice (requires consent/licensing and careful labels), cameras/mirrors on-device, parent emotion dashboards, cloud sync, intensity scales, body-sensation quizzes, complex social inference, and more emotion words. Do not add these to v1 merely because they are possible.

## Decisions after Fable 5.1 review

Fable's verdict was **ready with listed changes**. Its full text and model provenance are linked above. The changes are incorporated into the normative sections, not left as separate suggestions for Sonnet to reconcile.

- Adopted: explicit distractor-tap behaviour; People Next before answering; entry narration; a seventh unsure story; distinct canonical Match art versus quieter story art; two Me pages; exact pose Back/Me Change semantics; eight acknowledgement clips; parent review of mild difficult-emotion artwork; added behavioural/lifecycle checks. Removed the redundant Match Clue and the person-level picker to reduce controls.
- Adapted: People uses plain word responses rather than the proposed independent face glyphs. This avoids another face-matching shortcut and keeps the screen lighter. Me retains a consistent illustrated vocabulary; it never infers the child's state from their face.
- Deliberate exception: Me page two may have eight targets. Four feeling cards fit a stable two-by-two area; this is simpler than a third page with one item. Fit and touch-size checks are mandatory, including zoom without clipping; do not solve layout by hiding Not sure or Something else.
- Did not adopt the suggestion to retain Me across back-forward restoration. Memory-only data can still reappear to another person. Keep strict navigation/player clearing, while ordinary visibility changes can retain the card without replaying speech. Added a stricter fixed-bundle requirement so selected clips cannot reveal choices in host access logs.
- Did not add a prompt telling the child to show a grown-up after Something else: that would add a disclosure demand. The child can use their usual AAC or choose Done.
- Independently checked repository state: HEAD changed during this task. A text-only reviewer cannot verify the current checkout; the dated hashes are observations, not instructions to reset to either revision. Sonnet must inspect what is current.
- Kept this document's authorship/deployment distinction: the user requested Codex design, Fable review and Sonnet implementation/publication. No game implementation or deployment occurred during this design task.

Handoff limitation: Fable reviewed the written design, not the rendered sheet or research pages. The static sheet has been rendered and visually inspected in desktop Chrome; no implemented game, child usability session or actual iPad/Android validation has occurred yet. Those remain implementation acceptance work for Sonnet.
