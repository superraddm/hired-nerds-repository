# Nook's Garden Feelings: Fable 5.1 review

Requested by the user; completed 2026-09-16T16:55:01.105439+00:00 through the installed Claude Code 2.1.273 client. Anonymised brief sent after the user's explicit confirmation. No child name, photos, recordings or saved player data were supplied.

- Requested and returned review model: `claude-fable-5-1` (result metadata confirms the canonical model).
- Mode: noninteractive, restricted, no tools, no MCP tools, no session persistence. Reviewer received the full draft as text and was told not to browse or implement.
- Result: success. Reported total cost: $0.827. Metadata also reports a small Haiku auxiliary call; the review was produced by Fable 5.1.
- Reviewed draft SHA-256: `774d2d01bd8901029491a0566675fecfad93a812ff3b65d049036b8511447b14`. Draft snapshot preserved as [reviewed draft](nook-feelings-reviewed-draft.md).
- Review scope: text design only. Fable did not inspect the repository, independently verify research, review the visual sheet or test a game. Its factual claims about current HEAD and browser lifecycle require independent checking.
- Final decisions are in [the Sonnet specification](nook-feelings-sonnet-spec.md). The text below is preserved verbatim, including recommendations not adopted.

---

I'll review the design as written, without tools, and return a critical assessment under 1800 words.

## Review of "Nook's Garden: Feelings"

**Overall:** the design is coherent, appropriately modest, and mostly consistent with its own stated principles. The defects below are concrete and fixable with small edits. None requires new scope.

### 1. What it teaches, ambiguity and masking

- **Match attaches the word to the act of matching, not to the picture.** The success prompt "Same picture. Sad." can be read as "same equals sad". The word is already under the target, so the prompt can stay short but should name the picture: "Same picture. This one is Sad." Optional.
- **Tapping the distractor is underspecified and wastes a vocabulary moment.** "Words do not appear on answer cards until selected" but "selected" is not defined. If a tapped distractor reveals its own word, the child learns two contrasted words per round, which is the strongest teaching event in the activity. Specify: the tapped distractor shows its word and gets a neutral marker; the prompt says "That one is Angry. Look again." Must-fix for clarity, wording optional.
- **The People answer cards risk collapsing People into Match.** Word cards carry "consistent small expression illustrations". If those are the story character's own face, the child compares faces again and the stated lesson that expressions are only clues disappears. Use one fixed glyph set independent of the pictured person, the same set as Me. Must-fix.
- **Contradiction on quiet excitement.** People says the excited person need not grin, while acceptance check 2 requires expressions to differ visibly in face or pose. State explicitly that each person has one canonical drawing per word used in Match, and that a quieter excited scene is a People-only illustration. Must-fix.
- **The design inference promises two things it never models.** It says a real person may "not share them at all", and the grown-up note says feelings can coexist, yet all six stories end with a single clean self-report. Add one card where the character says "I'm not sure how I feel" so Not sure is modelled as a legitimate answer, not only a child's escape hatch. A coexisting-feelings card is optional. The unsure card is must-fix because the design's own claim about what People teaches is otherwise false.
- **Masking:** the pose copy is opt-in, has no Done-to-prove-it, and the grown-up guidance is sound. One gap: Try the pose appears after every match, so sad and angry poses are offered as often as any other. That is acceptable, but the pose screen prompt should never use "Show me" phrasing. Already fine as written.

### 2. Are three activities, matching and self-report appropriate?

Three activities is the ceiling for this site given the recent over-accumulation. Each is simple enough individually. Two simplifications are worth taking:

- **Clue is redundant with two cards.** Outlining the correct card of two is answering. Remove Clue; six targets, one fewer state to test. Optional but recommended. If kept, specify that Clue disappears after a match.
- **The puzzle picker should select word only, not word and person.** Any word/person combination is up to 25 options in Menu. The spec already describes emotion-only selection behaviour, so restrict to that. Optional.

Self-report is appropriate only because it is ungraded and unstored. The Oxford Health caveat about compliance is handled by Not sure and Something else. The remaining weakness is the third page, covered next.

### 3. Safeguards for sad and angry, and body imitation

Safeguards are adequate. Presentation is even, exit is immediate, no exposure montage, no moral colouring. Three gaps:

- **No acceptance check names who approves the art.** "Anger/sadness look gentle" is subjective. Add: the parent reviews all eight sad and angry drawings plus poses at real device size before the art is marked finished. Must-fix as a checklist line.
- **The mixed deck cannot avoid a word.** A child upset by Angry must open Menu and use the picker. That is acceptable given Next is always available, but the grown-up note should say so in one sentence. Optional.
- **Pose Back is ambiguous.** Header Back "always permits leaving immediately", but in the pose view it is unclear whether Back returns to the matched card or exits Match. Specify: Back from pose returns to the matched state; Back from matched returns to landing. Must-fix.

### 4. Control counts and state transitions

Counts as written:

| Screen | Targets | Problem |
| --- | --- | --- |
| Match choosing | 7 | At the limit; no room for a prompt Hear |
| Match matched | 6 or 7 | Whether Clue persists is unspecified |
| People considering | 6 | No Next; no way to hear the context sentence |
| People revealed | 3 or 4 | Fine |
| Me pages 1 and 2 | 7 | Fine |
| Me page 3 | 5 | One choice on a near-empty page |
| Me acknowledged | 4 | Whether the acknowledgement is spoken is unspecified |

- **People has no Next before Ask.** The spec says contexts can be skipped, but the only skip is Back to landing and re-entering, which resumes the saved story position and may return the same card. This contradicts "Next never gated". Add Next in the considering state. Must-fix.
- **People then has no Hear for the sentence.** Sound-triggering content is supposed to be labelled Hear, but adding Hear makes eight. Resolve by narrating the context sentence and prompt automatically on card entry when Sound is already on, matching the existing quiet-start behaviour. This is not "turning sound on by tapping a picture". State this explicitly.
- **Me third page.** A page whose only choice is Something else reads as a broken screen and doubles the paging state. Smallest fix that keeps both Not sure and Something else: two pages only. Page one is Happy, Sad, Angry. Page two is Calm, Worried, Excited, Something else. Not sure stays on both pages, and More feelings becomes a simple toggle. Page two has eight targets. Accept that, because it adds one card to an existing grid rather than a new control type, and it removes a state. Must-fix. If eight is unacceptable, the fallback is a single page of all six words plus Not sure and Something else with no paging at all, which is ten targets but zero state; for a word-reading child that may in fact be simpler. Do not merge Not sure with Something else; they mean different things and the source explicitly motivates both.
- **Change and Done.** Specify that Change returns to the page containing the chosen word. Done and Back both leave and both clear; that is fine, but write it down. Optional.
- **Distractor tap state.** Selecting the wrong card must not change the state machine; add "choosing stays choosing, no counter increments" to the state list. Optional.

### 5. Content gaps and false rules

- Five of six stories are about puzzles. That is fine for consistency, but the spec calls them "everyday scenes". Either change the wording or vary one scene. Optional.
- Distractor selection can pair Happy with Excited or Calm with Happy for the same person. Literal matching stays valid, but "Look again" on near-identical cards will frustrate. Optional rule: default deck avoids those two pairs as distractors. Keep it in feelings-data with a test.
- Me cards use "the same small art used elsewhere". Specify which person's face, or better, a fixed glyph. A child who reads faces may match his own face rather than his feeling. Same fix as the People cards.
- "Something else" is never explained to the child. Add one spoken and written line on selection: "You chose Something else. You can show a grown-up." Optional.

### 6. Privacy, audio lifecycle, technical handoff

- **Acknowledgement speech is undefined.** "You chose SAD" is the communicative payoff for a nonspeaking child and an adult across the room, but nothing says whether it is spoken, and "You chose" plus a word needs either eight bundled clips or concatenation. Specify eight whole clips, spoken only via the existing Hear or on entry when Sound is on. Must-fix for the handoff.
- **Pagehide clearing may erase the selection when it is most useful.** iPad Safari fires pagehide when the child switches app or the device sleeps. A child who chooses Sad and carries the tablet to an adult may arrive with a cleared screen. The state is in memory only, so persistence risk is nil. The real privacy risk is a later player seeing it, which player switch and Back already cover. Decide deliberately: I recommend clearing on player switch, Back, Done and activity change, and on pageshow only when restored from bfcache into a different player. Optional, but write the decision down either way.
- **Picker choice is stored.** Choosing Sad in the puzzle picker is a saved preference. That is not a self-report and is acceptable, but note it so nobody later treats stored picker choices as history.
- **Baseline hash is stale.** The document cites HEAD f89f030, but the spelling-review commit it refers to has since been accepted on main. Sonnet must re-inspect main and the working tree rather than trusting the hash. Must-fix as a one-line edit.
- **Naming inconsistency.** The final delivery step says "Codex's present task does not deploy anything" in a document addressed to Sonnet. Fix the name so nobody assumes a third implementer exists.
- **Missing acceptance checks:** Back semantics from the pose view; distractor tap reveals word and does not change state; People Next works before Ask; Me page two fits 360 × 640 at 200 percent zoom with eight targets; the unsure story card reaches its statement; acknowledgement clip exists for all eight choices; no live region announces a previous player's Me choice after player switch; build-time validation cannot check art, so a manual same-outfit-same-crop checklist is required.

### Verdict

**Ready with listed changes.** Must-fix before Sonnet starts: define distractor tap behaviour; fix People card art to a person-independent glyph; resolve the quiet-excited contradiction; add an "I'm not sure" story card; add Next to People considering and define sentence narration; replace the third Me page with the two-page layout keeping Not sure on both; define Back from the pose view; specify acknowledgement clips; add parent art sign-off and the missing acceptance checks; correct the baseline hash and the Codex reference. Everything else is optional. The design does not need another full pass, but these edits must land in the spec itself, not only in this review.
