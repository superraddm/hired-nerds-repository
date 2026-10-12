# Navigation proposal 2 (12 October 2026): for Jof's approval before Opus builds

Written by Fable after Jof's second proofing. Phases 7 and 8 were built on my reading of the rule, without showing
Jof first; that was wrong, and the result moved the problem rather than solving it. Nothing more is built until
this is approved. Mock screens: `../nav-2/` (phone, landscape, iPad), made from `../mockups/mock.html?screen=
shelf-v2 | submenu-add | submenu-feelings | submenu-patterns | ingame-caption`.

## What Jof found wrong with phase 8

1. The tiles with sub-options are mixed in with the single-option ones. They should sit together first, then the
   single ones.
2. The dashed border and corner badge do not tell a user there is more underneath.
3. The level pill cannot be tapped, yet it looks like a button and animates when tapped. Keep the fact, lose the
   control.
4. The child still cannot change the things a child should change: Add or take away, how many numbers, how many
   shapes in a pattern.
5. The sub-menu needs a back button, and the top-left button inside a game should go to all games, not to the
   sub-menu.

## What the research supports

Little of the published work is specific to pre-readers, but what there is agrees: use the conventions children
already meet (home and back arrows), pair every icon with a label, keep steps to a minimum, make targets large and
well separated, and signal clearly what can be tapped
([Google, Designing engaging apps for kids](https://developers.google.com/building-for-kids/designing-engaging-apps);
[NN/g, Designing for children](https://www.nngroup.com/videos/designing-children/);
[UXmatters, Kids-first design](https://www.uxmatters.com/mt/archives/2020/01/ux-design-for-kids-key-design-considerations.php);
a 5-to-8 study on minimal-step navigation, [Child-centred UI for early language apps](https://journals.um.ac.id/index.php/jpp/article/view/1406);
[Smashing Magazine, a dad's plea](https://www.smashingmagazine.com/2012/03/dads-plea-developers-ipad-apps-children)).
For "there is more inside", the one convention that needs no reading is the folder preview: the container shows
small pictures of its contents (every iPad and Android home screen does this with app folders, and children see it
daily). A badge or a border is a symbol that has to be learned; a preview is the thing itself.

## The proposal

### A. The shelf
- Order: the six games with choices first (Count, Add, Words, Patterns, Shapes, Feelings), a thin rule, then Paint
  and Blocks. Count joins the first group because its levels are a child choice (how many apples).
- Folder preview instead of badge and border: each tile in the first group shows a small 2x2 (or 2x1) grid of
  simple glyphs, one per activity or level inside, drawn in the tile's own ink and in the same flat style as the
  Paint and Blocks icons (Jof, 12 October: the first version with tiny copies of the pictures was too busy). Add:
  a plus and a minus. Count: one, two, three dots and two bars. Words: A, a dashed box, two word blocks, a 3.
  Patterns: two beads, three beads, a plus. Shapes: a pentagon and a hexagon outline. Feelings: four round faces.
  The sub-menu tiles then show the full pictures.
- Paint and Blocks keep their single icon. No dashed borders, no corner badges.

### B. The sub-menu screen (one per game in the first group)
- Top-left: a back arrow in the same spot as every other top-left control. It goes to all games.
- The game's icon and name, then Nook's one-line question ("Add or take away?"), text only.
- Activity tiles: large, picture plus one word, two columns on a phone. The last-played one is marked. One tap
  starts it at the current level.
- Level tiles directly under the activities, picture first, short label, current one marked, all visible (they wrap;
  nothing scrolls off): Count six, Add six, Take away five, Patterns three (2, 3, 4 shapes), Shapes two. One tap
  starts the current activity at that level. Words and Feelings have activities only; their levels (number-words
  range, look-alike pairs) stay with the parent.
- No prose, no title text beyond the game name, no close button.

### C. In the game
- Top-left: the shelf button, which goes to all games (not to the sub-menu). From there the child taps the game's
  tile to reach the sub-menu, two taps in all. The in-game overlay from phases 2 to 8 is retired: the shelf button
  simply navigates. (The old overlay was itself a pop-up a child had to understand.)
- The pill becomes a caption: small icon, "Add · Up to 5", plain text in the top bar, no border, no background, no
  press effect, not a button in the markup. It states a fact.
- Everything else on the play screen stays as built.

### D. Grown-ups (behind the hold)
- Keeps what cannot be a child's choice: direct number and sum choosers, Doubles and Make ten, the fourteen old
  pattern levels, Number words range, Feelings look-alike level and story chooser, answer modes, word pictures,
  familiar words and sentences, sound, Softer, letters, keyboard, players. The level choosers duplicated for the
  child (Up to 5 and so on) can stay there too, so a parent can set them before handing over.

### E. Sizes
- Phone portrait: activity tiles at least 120 px tall; level tiles about 110 by 80 px, three per row.
- Phone landscape: activity tiles in one row of two to four; level tiles in one wrapped row underneath; Nook and
  the question hidden to make room.
- iPad: three shelf columns; two sub-menu columns centred.

## What this costs

Phase 8's `menus.js`, the marker CSS and the in-game list overlay are replaced; the sub-menu screen, the level row
and the caption are new; the tests written in phases 7 and 8 for the picker, the marker and the overlay are
rewritten. About one Opus phase, with the eight-viewport harness covering every sub-menu and the caption.

## Decisions for Jof

1. Approve the folder preview as the "more inside" signal (section A), or ask for another treatment.
2. Approve the child-level tiles on the sub-menu (section B) and the list of what stays with the parent (section D).
3. Approve the shelf button going to all games and the caption replacing the pill (section C).
4. Anything in the mock screens to change before the build.
