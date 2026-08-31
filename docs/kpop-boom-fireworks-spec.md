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
- **The Glow Girls** — three chibi idols (pink, violet, cyan) on the stage. They are the good guys. They bounce to the beat and throw their arms up every time a firework bursts. Drawn from simple shapes; no faces to fall into uncanny territory.
- **The Giant Lightstick** — the thing they protect. A huge glowing idol lightstick planted centre-stage behind them, with a golden star in its head. It lights the whole concert. Its brightness is the only "health" in the game, and it is always visible, never a number.
- **The Boo-Bops** — the "demons". Round, bouncy, bubblegum-coloured blobs with tiny pastel nub horns, huge sparkly eyes, rosy cheeks and an enormous grin, waving their little arms as they float in. They are silly, not scary — their only crime is wanting to *borrow* the Giant Lightstick's glow for their own party. They float down from the sky towards the lightstick, hover next to it giggling, pinch a little ball of glow (the lightstick dims a step), then drift off carrying it.
- **How you stop them** — fireworks. A firework bursting near a Boo-Bop (or a rocket flying straight through one) pops it, and it turns into either a cloud of soap bubbles that float up and pip away, or a mini firework of its own. If it was carrying stolen glow, the glow flies back to the lightstick with a bonus. Every pop earns a star. No blood, no hurt faces, no "dead" anything — it's a pop, a giggle, and bubbles.
- **What if the lightstick goes dark?** It can't stay dark. When the last bit of glow is taken, the Glow Girls do a **POWER UP**: the sky goes rainbow, three giant fireworks launch on their own, every Boo-Bop on screen pops into bubbles at once, and the lightstick relights to full. The worst case is the best show. There is no game over.
- **The crowd** — silhouettes waving lightsticks in the potion colours. They cheer harder for bigger fireworks and when Boo-Bops get close.

## 4. Core loop (what she actually does)
1. **Tap a potion.** It glugs into the cauldron. The cauldron liquid swirls to the new colour and bubbles.
2. **Tap more potions** (up to 3 in the mix). Little bubble icons above the cauldron show what's in it.
3. **Launch** — either tap the giant GO! button, or **tap anywhere in the sky** and the firework flies to that exact spot. Multi-touch works: three fingers, three fireworks.
4. **Watch** it whistle up, burst, sparkle, and slowly fade (4–8 s, longer for glitter). Crowd cheers, Glow Girls jump.
5. **Repeat.** The mix stays in the cauldron so she can spam the same firework. A 4th potion pushes out the oldest. A small 🗑 button empties the cauldron.

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

Multiple colours in the mix → the burst alternates particles between them (a 2- or 3-tone firework). No colour at all → a random one is picked, so an empty cauldron still launches something.

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
