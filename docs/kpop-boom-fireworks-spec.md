# K-Pop BOOM! — Firework Stage
### Game spec · for a 4-year-old · hosted at https://jofdavies.com/fireworks/

## 1. The one-line brief
> "I want to make fireworks."

You mix glowing potions in a cauldron, then launch them into the night sky over a K-pop concert stage. Every firework you make lights up the crowd. Nothing can go wrong, nothing needs reading, and every tap does something bright and loud.

## 2. Who it's for and what that means
A 4-year-old, on a phone or tablet, probably holding it herself.

| Design rule | Why |
|---|---|
| Every button is huge (≥ 72 px), round, glowing, and has a picture, not a word | She can't read yet; fingers are imprecise |
| Tapping anywhere useful *always* does something | No dead taps, no "wrong" moves, no fail state |
| Zero menus, zero pop-ups, zero navigation out of the game | Accidental exits ruin the fun and worry parents |
| Sound and animation react instantly to every tap | Cause-and-effect is the whole game at 4 |
| Works portrait *and* landscape, no scrolling, no pinch-zoom | Tablets get turned every which way |
| Loads instantly, one file, no login, no ads | Attention span measured in seconds |
| Visual style: bright, bold, neon on a dark stage | K-pop lightstick aesthetic, and fireworks pop on black |

## 3. Theme — K-pop concert, with artistic licence
She loves *K-Pop Demon Hunters*. We don't use its characters, names, logos or songs. We borrow the *vibe*: a three-girl idol group, neon pink / violet / cyan, lightsticks, a giant stage, and mischievous shadow creatures that light-magic turns friendly.

Our original cast and the story:
- **The Glow Girls** — three tall, slim Korean idols (Sol, Hana, Jia — see 3b) on the stage, unmistakably a girl group, wearing whatever she dressed them in. They cycle through dance poses every two beats (arms in a V, singing into a handheld mic, pointing to the sky, hands on hips), kick on the beat, and jump when a firework bursts. They are the good guys.
- **The stage** — a neon **GLOW GIRLS** sign (with 글로우 걸즈 · WORLD TOUR underneath) on a lighting truss with par cans chasing to the beat, an LED wall with a rainbow equaliser, speaker stacks with pumping woofers, footlights, sweeping spotlights and a crowd of lightsticks.
- **The Giant Lightstick** — the thing they protect. A huge glowing idol lightstick planted centre-stage behind them, with a golden star in its head. It lights the whole concert. Its brightness is the only "health" in the game, and it is always visible, never a number.
- **The Boo-Bops** — the "demons". Round, bouncy, bubblegum-coloured blobs with tiny pastel nub horns, huge sparkly eyes, rosy cheeks and an enormous grin, waving their little arms as they float in. They are silly, not scary — their only crime is wanting to *borrow* the Giant Lightstick's glow for their own party. They float down from the sky towards the lightstick, hover next to it giggling, pinch a little ball of glow (the lightstick dims a step), then drift off carrying it.
- **How you stop them** — fireworks. A firework bursting near a Boo-Bop (or a rocket flying straight through one) pops it, and it turns into either a cloud of soap bubbles that float up and pip away, or a mini firework of its own. If it was carrying stolen glow, the glow flies back to the lightstick with a bonus. Every pop earns a star. No blood, no hurt faces, no "dead" anything — it's a pop, a giggle, and bubbles.
- **What if the lightstick goes dark?** It can't stay dark. When the last bit of glow is taken, the Glow Girls do a **POWER UP**: the sky goes rainbow, three giant fireworks launch on their own, every Boo-Bop on screen pops into bubbles at once, and the lightstick relights to full. The worst case is the best show. There is no game over.
- **The crowd** — silhouettes waving lightsticks in the potion colours. They cheer harder for bigger fireworks and when Boo-Bops get close.

## 3b. The Dressing Room (before the show)
After TAP TO PLAY she lands in the dressing room — a vanity mirror with bulbs and one girl at a time, big.

- **The three Glow Girls** are all Korean idols, drawn tall and slim in the glamorous style of *K-Pop Demon Hunters*' HUNTR/X (small heads, long legs, sharp winged eyeliner, glossy lips, stage outfits) but as original characters. They're told apart by face shape and skin tone: **Sol** — heart-shaped face with a pointed chin and cat-eye liner, cool porcelain tone, sleek high ponytail; **Hana** — rounder, softer face with big eyes, warm light tone, long wavy pink hair; **Jia** — longer face with a defined jaw and narrow eyes, warm tan, twin buns with long tails. Skin, eyes and face shape are fixed per girl; everything else is hers to change. Swipe the mirror or use ◀ ▶ to move between them; dots show which of the three you're on.
- **Five categories** as big icon tabs: 💇 Hair (10 styles: ponytail, space buns, bob, long straight, long wavy, big braid, afro puffs, high bun, pigtails, pixie) · 😎 Face (sunglasses, heart glasses, star sticker tattoo, heart sticker, lollipop, cat ears, crown, headphones, hair bow, earrings — several at once, but only one pair of glasses and one headpiece) · 👚 Top (crop top, T-shirt, jacket, hoodie, sparkle blazer, tank top) · 👖 Bottoms (pleated skirt, shorts, cargo pants, tutu, plaid skirt, leggings) · 👟 Shoes (boots, sneakers, platform boots, Mary Janes, high tops).
- **Item tiles are live previews** — each tile is the current girl wearing that item, zoomed to the relevant body part, so a 4-year-old doesn't need to read.
- **Tap or drag.** Tapping a tile puts it on. Dragging lifts a ghost of the tile; dropping it on the mirror puts it on (the mirror glows green when you're over it); dropping it anywhere else just snaps back. Both paths make sparkles and a glug sound.
- **Colour swatches** (12: black, brown, blonde, white, pink, baby pink, purple, cyan, gold, lime, orange, red) recolour whatever category is open — hair colour on the Hair tab, top colour on the Top tab, and the accent colour of face accessories on the Face tab.
- **🎲 SURPRISE!** randomises the current girl's whole outfit.
- **TO THE STAGE! 🎤** is the one big green button. It closes the room and starts the show (the opening three fireworks fire on the first visit). A 👗 button in the game's top bar brings her back any time — Boo-Bops freeze while the room is open, so nothing is stolen behind her back.
- Looks are saved on the device (`localStorage`) and drive the very same drawing code used on stage, so what she dresses is exactly what dances.

## 3c. Show Mode — the game proper (6 levels)
After the dressing room comes the **show map**: six level buttons (locked ones show 🔒, cleared ones show 1–3 ⭐) plus **✨ FREE PLAY** (the original sandbox, unchanged) and **👗 DRESS UP**. Progress persists on the device.

**The loop** (Space Invaders × Guitar Hero, tuned for age 4):
- Smiley demons float down from the sky toward the stage. The sky playfield sits strictly **between the two potion rails** in both orientations — nothing spawns or flies behind the UI.
- **The cannon is empty after EVERY shot** — tap a potion to reload, then tap the sky (or GO!) to fire.
- **Colour potions are unlimited**; any single shot pops a basic demon. **Magic potions are ammo** (a gold badge on the bottle shows how many you hold, starting at 2 each); more falls from the sky as ✨ potion bubbles you shoot to collect (+2).
- **Special demons can only be popped by the exact combo shown in the bubble above their head** (e.g. 💗+💖) — the Guitar-Hero bit: read the recipe, build it, fire. Recipes are **random per demon**, never fixed per type. A wrong shot just bounces off with a boing and a "MATCH THE POTIONS! 👀" — no penalty.
- **The girls are the lives.** Each has an energy bar (🎤 chips in the top bar). A demon that reaches the stage tickles the nearest girl for a few seconds (draining her) and then floats off giggling. At zero energy a girl sits down asleep with a 💤 — she never dies. All three asleep = the show ends ("The girls fell asleep! Try again!") and the map returns.
- **Junk-food power-ups** parachute in periodically — shoot them to collect: 🥤 slushie (+45% energy to the sleepiest girl), 🌭 hot dog (fully wakes one girl), 🍿 popcorn (pops every basic demon on screen), 🍩 donut (slow motion for 7 s). They get rarer each level.

**The demon family (7):** Boo-Bop (basic) · Zoomie (small, fast, zigzags on wings) · Bloomp (big softie, two pops) · Grump (sunglasses, needs its 2-potion combo) · Twirlie (spins, needs its combo) · Mega (huge, needs a 3-potion combo) · and one **boss per level**.

**Bosses are learnable:** always exactly **8 hits**, and each boss uses the **same fixed recipe sequence every time** (🧪 = any basic shot): The Yawn King, DJ Grumbles, Disco Dozer, Puddle Prince, Balloonzilla, The Snooze Moon. The current requirement shows above the boss's crown; 8 pips under it track progress. Bosses hover and occasionally invite a couple of basic demons down. Beating the boss ends the level with a firework salute and 1–3 stars (one per girl still awake).

**Difficulty curve:** waves 8 → 16, demon speed ×0.75 → ×1.3, spawn gaps 5–6.8 s → 2.8–4.4 s, more special types each level, power-ups spaced further apart. Level 1 is deliberately gentle: only Boo-Bops, no ammo pressure.

**Six stage designs:** 🌅 *Sunset Soundcheck* (dusk sky, low sun, birds) · 🌃 *Neon Night* (the classic) · 🪩 *Moonlight Ball* (big moon, giant disco ball with sweeping beams) · ☔ *Rainy Encore* (teal rain streaks) · 🎡 *Sunrise Festival* (dawn sky, turning ferris wheel, rising balloons) · 🪐 *Galaxy Finale* (ringed planet, aurora ribbons). Show mode also adds two backup-dancer silhouettes grooving beside the girls.

## 4. Core loop (what she actually does)
1. **Tap a potion.** It glugs into the cauldron. The cauldron liquid swirls to the new colour and bubbles. The bottle shows a count badge (1, 2, 3).
2. **Tap more potions** (up to 3 in the mix, **repeats allowed** — three golds makes one big gold). Little bubble icons above the cauldron show what's in it.
3. **Aim and fire the potion cannon.** A glowing cannon sits in the cauldron and swings to follow the mouse (hover) or the last finger. **Tap anywhere in the sky** and it fires to that exact spot (a dotted arc shows the aim briefly); the giant GO! button fires at the last aim point. Multi-touch works: three fingers, three fireworks.
4. **The cannon refuses to fire when the cauldron is empty** — it shakes, says "ADD A POTION!", and all the bottles hop to show what to do. No random freebies.
5. **Watch** it whistle up, burst, sparkle, and slowly fade (4–8 s, longer for glitter). Crowd cheers, Glow Girls dance.
6. **Repeat.** The mix stays in the cauldron so she can spam the same firework. A 4th potion pushes out the oldest. A small 🗑 button empties the cauldron.

## 5. Potions
Two shelves. **Colour potions** on the left / bottom-left, **Magic potions** on the right / bottom-right. Each bottle is a fat rounded flask with a big icon on the label and blinking eyes (bottles have faces — kids adore this).

### Colour potions (8)
| Icon | Name (for parents) | Effect |
|---|---|---|
| 💗 | Pink Bias | Hot pink |
| 💜 | Violet Encore | Electric violet |
| 💙 | Lightstick Blue | Cyan / sky blue |
| 💛 | Gold Debut | Gold / yellow |
| 💚 | Lime Fan Chant | Neon green |
| 🧡 | Sunset Stage | Orange-red |
| 🤍 | Silver Sparkle | White with a silver twinkle |
| 🌈 | Rainbow Fandom | Every particle a different hue |

Every colour potion also has a personality, so every combination fires differently: Pink = wide and full · Violet = slow and floaty (low gravity, long life) · Blue = fast and tall · Gold = crackly twinkle · Lime = lots of tiny sparks · Orange = short punchy pop · Silver = strobe · Rainbow = every hue. Personalities multiply when stacked, and three of a kind gets a size bonus.

Multiple colours in the mix → the burst shows them as clear **bands** (concentric rings for round bursts, alternating segments around hearts/stars) so both colours read at a glance. A magic potion with no colour → a random colour is picked.

### Magic potions (8)
| Icon | Name | Effect |
|---|---|---|
| 💖 | Heart Beat | Heart-shaped burst |
| ⭐ | Star Debut | Five-point star burst |
| ✨ | Glitter Comeback | Crackling twinkles that linger twice as long |
| 💥 | Bass Drop | Double size, slow, deep boom |
| 🚀 | High Note | Flies faster and higher, high whistle |
| 🌊 | Ballad Willow | Long drooping golden-willow trails |
| 🌀 | Spin Dance | Spiral burst that rotates |
| 🎵 | Chorus | Burst of music notes + a pentatonic chime chord |

Magics stack: Heart + Glitter + Bass Drop = a giant crackling heart. Default with no magic is a classic peony burst.

## 6. Extra fun (things a 4-year-old will find by poking)
- **Tap the cauldron** — it sloshes and the colours swirl. Purely tactile.
- **🎆 FINALE button** — launches a 10-second show of random fireworks using every potion. Crowd goes wild. She *will* press this constantly, and that's fine.
- **Stars bar** — a row at the top fills with stars for each Boo-Bop you pop and every 10 fireworks launched. At every 10 stars the whole sky flashes rainbow and the Glow Girls do a big jump. Never resets during a session.
- **Idle attract** — if nothing is touched for 20 s, a small firework launches on its own to remind her it's alive.
- **Bottles blink** and the cauldron bubbles even when idle.

## 7. Screenshot / save
- **📸 button** freezes the current frame and shows it big in a photo-frame overlay with two giant buttons: **💾 Save** and **✕ Back**.
- Save uses, in order: Web Share API with a file (on iPhone/iPad/Android this opens the share sheet where "Save Image" goes straight to Photos), then an `<a download>` PNG fallback, and the preview image itself is a real `<img>` so "press and hold → Save to Photos" also works on iOS.
- The screenshot is the *game canvas only* (sky, fireworks, stage, crowd, Glow Girls) — no buttons. File name: `kpop-boom-fireworks-YYYYMMDD-HHMMSS.png`.
- Fireworks render with a long-exposure trail effect, so screenshots look like real firework photography.

## 8. Sound (all synthesised in Web Audio — no audio files)
- Potion pour: bubbly descending *glug-glug* plus a bright chime.
- Launch: noise whoosh + rising whistle (higher pitch for High Note).
- Burst: low thump + filtered noise decay (deeper for Bass Drop); glitter adds rapid crackle pops; Chorus adds a pentatonic chord.
- Gloomie poof: giggly upward arpeggio.
- Background music: a cheerful original synth-pop loop (~128 BPM, C-major pentatonic, kick / hat / bass / arpeggio) with a 🔊 toggle. Starts on first tap (browser autoplay rules). Volume kept under the firework sounds.

## 9. Technical
- **Single file**: `public/fireworks/index.html` (HTML + CSS + JS inline, ~1,500 lines). Plus `manifest.webmanifest` and PNG icons so "Add to Home Screen" makes it a full-screen app on iPad/iPhone/Android. Nothing external to load.
- **Rendering**: one `<canvas>` (2D, additive blending, DPR capped at 2, particle cap ~2,500) behind a DOM overlay for buttons. 60 fps target on a 2019 iPad; degrades gracefully.
- **Input**: Pointer Events, `touch-action: none`, `user-select: none`, double-tap zoom disabled, context menu disabled. Screen Wake Lock requested so the screen doesn't dim mid-play.
- **Layout**: CSS grid that flips — landscape: potion rails left and right, controls bottom-centre; portrait: two potion rows under the sky, controls in between. `100dvh`, safe-area insets respected.
- **Persistence**: none needed. Star count kept in `localStorage` for bragging rights only.
- **Privacy**: no analytics, no network calls, no cookies. Safe for a child.
- **URL**: `https://jofdavies.com/fireworks/` (Cloudflare Pages serves `public/` from `main`; git push deploys). Not linked from the portfolio nav — it's a private page for family, reachable by URL / home-screen icon.

## 10. Out of scope (deliberately)
- Accounts, saving mixes, sharing to social, leaderboards, in-game text tutorials, licensed music or characters.

## 11. Execution decision
Built end-to-end by Fable in this session: it's one self-contained HTML file, testable headlessly, with a known deploy path. No handoff required.
