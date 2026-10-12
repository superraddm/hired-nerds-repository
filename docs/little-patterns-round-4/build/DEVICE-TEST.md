# Device test: the S24 and the iPad 5 (round 4, local only)

Everything below runs from this PC over your Wi-Fi. Nothing is deployed; kpopboom.party is unchanged. Allow about an
hour for both devices. Tick each line, and note anything odd with the device, the way round it was held and the screen.

## 1. Serve the build

1. PC, phone and iPad on the same Wi-Fi.
2. In a terminal in `C:\hirednerds-portfolio`:

   ```
   node tools/serve-fireworks.cjs 8787
   ```

   It prints two addresses, for example `fireworks: http://localhost:8787/  http://192.168.1.23:8787/`. The second one
   (your PC's LAN address) is the one for the devices. If Windows asks about the firewall, allow **Private networks**.
3. On the S24 (Chrome) and the iPad 5 (Safari) open `http://<that address>:8787/little-patterns/`.
4. Leave the terminal open while you test; Ctrl+C stops it. The server sends no caching headers, so a reload always
   shows the current build.

The same server also shows Nook's character sheet and texture bench for the iPad (section 4):
`http://<PC>:8787/_nook-character/sheet.html` and `http://<PC>:8787/_nook-character/texture-bench.html`.

## 2. The listening page (decision J6)

In a second terminal in `C:\hirednerds-portfolio`:

```
python -m http.server 8790 --directory docs/little-patterns-round-4/build/phase-5/listen
```

Open `http://localhost:8790/` on the PC, or `http://<PC>:8790/` on the iPad (it also tries the game's real joined
playback there). Compare **Today**, **Joined**, **Joined 1.05** and **Whole sentence** on the first rows. Your answer
decides J6: keep joining word clips, or record whole sentences for the most-played success lines (about 92 Gemini
requests for Add and Take away within ten, plus about 20 for Count). "then" and "more" were re-recorded in phase 6;
listen to the composed prompt "Three, then two more. How many?" for a breath after "more".

## 3. Locking the device is your choice (decision J1)

The game does not try to trap the browser. If you want Arthur kept inside it:

- **iPad (Guided Access):** Settings > Accessibility > Guided Access: on, and set a passcode. Open the game, then
  triple-click the Home button > Start. Triple-click again and enter the passcode to end.
- **S24 (App pinning):** Settings > Security and privacy > More security settings > Pin app: on. Open the game, open
  Recents, tap the Chrome icon above the window > Pin this app. Unpin by holding Back and Recents together (or swipe up
  and hold, with gestures). Samsung Kids is the other option. Menu names vary a little between One UI versions.
- **Home-screen app (optional):** Safari Share > Add to Home Screen, or Chrome menu > Add to home screen / Install. It
  opens full screen as "Nook". On the iPad a home-screen app keeps its **own storage**: players and settings made in
  Safari do not appear there, and the reverse.

## 4. The checklist (do each on both devices unless marked)

**Hold the device both ways for every section.** Portrait and landscape; turn it mid-screen at least once per game.

Shelf and Grown-ups
- [ ] The shelf fits without scrolling: Nook's greeting, eight tiles, the Grown-ups gear at the foot. Tap the bubble:
      "Hello! I'm Nook. Let's play."
- [ ] Grown-ups: a quick tap does nothing. Press and hold: a ring starts filling after a moment and the sheet opens at
      two seconds. Let go early, or slide your finger off: it cancels.
- [ ] Grown-ups > Settings > Sound: Off. A crossed speaker appears on the shelf; no game speaks. Turn it back On.
- [ ] Grown-ups > Privacy, devices and credits: the line about Me (never saved or sent) is there.
- [ ] In a game, the shelf button opens the shelf over the game with that game marked. **S24:** the Android Back
      button also opens it; Back again leaves.
- [ ] (Phase 8) Add, Words, Patterns, Shapes and Feelings carry a small stacked-cards badge in the corner and a dashed
      inner border; Count, Paint and Blocks have neither. A badge tile opens its list: the shelf button top-left (the
      same place as in a game), Nook's line ("Add or take away?"), big picture tiles; one tap starts that game. The
      shelf button, and on the S24 the Back button, come back to the tiles.
- [ ] (Phase 8) Play Take away, go back to the shelf (shelf button), tap Add: Take away is the marked tile. Inside a
      game, the shelf button then the game's own tile opens the same list; a tile there switches in place. No play
      screen has chips or a picker; the label at the top right only lights up when tapped.
- [ ] (Phase 8) Colour Blocks: the shelf button is top-left; there is no Player, Grown-ups, pace or Sound control on the play
      screen. Hold Grown-ups on the shelf: the sheet starts with Colour Blocks and **Pace** (Wait for me, Very slow,
      Steady); the board waits while the shelf is open.

Count, Add, Take away, Words, Patterns
- [ ] Count and Add: answer wrong once (only the bubble changes; Nook does not move), then right (green tick, Nook
      happy, proud or excited with one small hop, Again and Next appear). Help steps through the count. The card never changes height.
- [ ] Add at level 4 (Grown-ups > Levels and puzzles > level 4): Help says "Fill the ten first." and moves apples
      across.
- [ ] Take away: right answer, Nook munches.
- [ ] Words > Missing word with the A to Z keys (ABC order, Delete and Enter at the end).
- [ ] **The device keyboard:** Grown-ups > Settings > Typing keyboard > Device keyboard. In Missing word and in
      Number words, tap the gap in portrait and in landscape. With the keyboard up the card may scroll inside the
      frame, but Delete, Enter, Help and the shelf button must stay reachable and the page itself must not jump about.
      Set it back to Big A-Z keys afterwards.
- [ ] Word order: drag a word, and also tap-to-place.
- [ ] Patterns: right answer shows the bead string briefly under the bubble.

Shapes
- [ ] Sides: tap each side **near its corners** as well as in the middle: just outside a corner, just inside it. The
      side you meant lights, numbered in the order you tapped. Tapping a lit side again only bumps its number. A tap
      in the middle of the shape counts nothing.
- [ ] Sides: answer right: "We did it! A pentagon has five sides." (or the shape shown); Nook holds the shape up.
- [ ] Name: Help shows small pictures beside the words, then outlines the answer; right answer "We did it! It's a ...!".

Feelings
- [ ] Nook feels... **with sound on:** tap Happy, then Sad. Nook grows to fill the screen, says the word and "Nook feels
      sad.", makes one small movement; after Sad, Nook takes one breath (caption "Nook takes a breath." only while it
      happens) and goes back to the board, where the card gets a tick. The thin line on Done follows the voice.
- [ ] The same **with sound off** (Grown-ups > Settings): Nook shows the feeling and waits; nothing counts down; Done
      returns to the board.
- [ ] Done in the middle of a performance stops it at once. A tap on the big Nook says the word again.
- [ ] Which feeling?: a wrong word changes only the bubble; the right word turns green, the bubble says "Yes! Sad."
      (or similar) and **Nook keeps the sad face** (it does not turn happy).
- [ ] Friends: the story is read on arrival; Hear repeats it; Next moves on.
- [ ] Me: choose a feeling: its face with a grey ring, the word, "You feel ... Thank you for telling me." Nook does not
      change. Something else: tap the box, type, and in landscape check the keyboard does not hide the box for good.

Joined speech (listen closely)
- [ ] Answer an Add sum right twice in a row (Again, then answer again). The second "Yes! Three plus two equals five."
      plays as one joined clip. Listen for **a gap, a click or a glitch** between words. Also the prompt "Three, then
      two more. How many?".

**iPad 5 (Safari 16) specifics.** Headless Chrome cannot show these; each line says what "broken" would look like.
- [ ] Nook's face changes (any success): the eyes blink and the face swaps cleanly (`innerHTML` on SVG groups). Broken:
      Nook vanishes, or keeps the old face.
- [ ] Arms and leaves swing about the shoulders and the leaf joint (`transform-box`). Broken: arms fly off or swing
      about the corner of the picture.
- [ ] The Feelings performance grows from the small Nook and shrinks back (Web Animations). Broken: Nook jumps
      straight to full size, or never goes back.
- [ ] The big Nook in the performance and in Which feeling? keeps its shape (`aspect-ratio`). Broken: squashed or
      stretched Nook.
- [ ] Shapes: a counted side fills from corner to corner (`pathLength`); its number bumps from its own centre
      (`transform-box`). Broken: a dashed or partly drawn side, or a number that jumps sideways.
- [ ] The character sheet (`http://<PC>:8787/_nook-character/sheet.html`): press the grow button (this is the one place
      `var()` inside a keyframe animation is used). Broken: no grow, or a jump.
- [ ] Joined speech plays as one clip (the Blob playback). Broken: silence, or the first word only. The game falls back
      to word-by-word if the joined clip fails, so word-by-word with small gaps is "working, not joined".
- [ ] The Grown-ups hold works with a finger that wobbles slightly (pointer capture), and the shelf does not scroll or
      bounce when dragged (pull-to-refresh and callouts are off).
- [ ] **Texture bench** (`http://<PC>:8787/_nook-character/texture-bench.html`): press Run and photograph the table.
      It decides whether Nook gets the paper grain (item 54); it stays off unless the iPad shows no cost.

## 5. What to report back

For each problem: **device, which way up, screen, what you did, what happened** (a screenshot helps: S24 Power + Volume
down; iPad Home + Power). Also send:

1. The texture bench table from the iPad.
2. Your J6 answer from the listening page (keep joining, or whole-sentence clips), and whether "more" still breathes.
3. Any gap or glitch in joined speech, with the line it was in.
4. Whether the device keyboard ever hid Delete, Enter, Help or the shelf button.
5. Whether you want Guided Access / App pinning notes added to the Grown-ups sheet.
