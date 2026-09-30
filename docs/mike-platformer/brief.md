# Mike the Mic: 2D platformer. The brief

From Jof, 26 September 2026. This is the source of truth for the design work; the design document must not contradict it.

## The idea

A 2D platform game in the style of Sonic and Mario. Level 1 first, designed with the scope for more levels to come.
Mike the Mic (MTDCNC's mascot, a microphone with arms and legs) is inside a **rogue machine shop**: the machines have
gone wrong and Mike has to go into them and fix them.

- **Enemies:** the machines themselves. They spit out crashed parts; multi-axis spindles try to grab him.
- **Collectibles:** spare parts, lubricants, control units. Mike gathers these through the level.
- **The boss:** at the end of the level Mike uses the collected parts to fix the machine while its massive spindle(s)
  work around him, trying to attack. Mike does not hit the spindles. He dodges them while he fixes the machine.
- **Movement:** jumping, pits, conveyor belts.
- **A special mechanic to design properly:** Mike uses his video camera to control time in order to avoid an
  obstacle. Jof has the idea but has not thought it through; the design must.
- **Extra lives:** a standard SD card.
- **Goal:** get to the end of the level avoiding the pitfalls and dangers, collect the parts, fix the machine at the end.

## What absolutely cannot happen

- **No actual branded machines.** Replicate the style of machine tools if useful, but no logos, no recognisable
  features, no model names, no colour schemes that identify a real manufacturer. These are rogue, broken machines;
  the game must never suggest that MTDCNC's customers or advertisers supply evil machinery. Every machine is a
  fictional, stylised, generic "machine".
- The MTDCNC branding itself (Mike, the lock-up, the colours) is used exactly and is not to be redrawn.

## Freedoms

- Stylised. It does not have to obey physical laws of size, scale, speed or shape.
- Mike is the signed-off 2D cartoon puppet in `reference/mike.svg` (jointed: head, arms, legs; no face or mouth,
  head nods and turns; see the comment block inside the SVG). His look is fixed; poses and animation are open.

## Where it will live

Hosted for now at **kpopboom.party/mike-game/** (a static Cloudflare Pages site, deployed by an allow-listed copy
script); it will move to another host later, so nothing may depend on the domain or absolute paths. The game is
plain browser HTML, CSS and JavaScript with no server and no network calls after load, in `public/fireworks/mike-game/`. It must run on an iPad 5 in
Safari as well as desktop browsers, with touch controls and keyboard. Sibling games on the same host are in
`public/fireworks/` of this repository; look at `public/fireworks/little-patterns/studio-lab.html` for the house
conventions on touch handling, fixed logical resolution and headless-Chrome test harnesses.

## Process

1. Codex designs Level 1 (this document's companion, `level-1-design.md`) with scope for more levels.
2. Jof reviews.
3. Opus 5.5 builds it from a prompt written against the approved design.
