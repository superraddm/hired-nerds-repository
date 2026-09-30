# Review of CODEX-HANDOVER.md

**30 September update:** Both findings below are fixed and verified. See [the current handover](CODEX-HANDOVER.md) for implementation, timing bounds and playthrough evidence. The original audit is retained below.

29 September 2026. Read-only gameplay review against the original EDM design, the completed refinement pass and the newer owner decisions recorded in `CODEX-HANDOVER.md`. No game files changed in this review.

## Verdict

The earlier refinement plan is implemented and preserved. The newer shared camera design is implemented, but the requirement that the bosses need slow motion is not fully satisfied. The handover is candid about that gap. It should be classified as unfinished work against its recorded owner requirement, not an unrequested optional enhancement.

## Findings

1. **Boss 2 still needs no camera.** Fresh measurement gives normal-speed safe windows of 3.78s at flush, 3.87s at tension and 9.9s at align, versus a 2.2s repair. The original recorded input run still wins with zero camera use and zero hits. Boss 1's measurement finds only six of the 27 order/repair combinations with a window shorter than its hold. Those fixed-position window measurements are useful tuning evidence, not a proof that every possible no-camera strategy fails. Tune readable hazard windows, then verify camera-assisted completion for every order and with no optional cards.

2. **Both filming HUDs undercount spare clips.** `js/game.js:580` and `js/l2-game.js:325` display `clipsLeft(camera) - 1`. As soon as footage is consumed, flooring the total already drops the partly used current clip, so subtracting again loses another clip. Reproduced with the real shared camera: after one filming frame, a 9s card shows one more clip but actually retains two full spare clips. A 6s card shows zero but retains one. Derive spare clips from total footage minus the current clip's remaining footage; test at start, mid-clip and expiry. The footage is not lost; the display is wrong.

## What matches

- The six-room layout, 56 salvage, supports, hidden-life clue, expanded boss machinery and staged restoration remain in the build.
- Final-save recovery and growing-jet fairness remain fixed: fresh `review-mike-l2.cjs` passes. Default recorded run:274.75s,36/56,zero hits,deaths or camera use; results wait for a drained sump and open exit.
- Fresh `test-mike-l2-boss.cjs` passes all three orders, final-save recovery and restoration-before-results.
- Fresh `test-mike-clips.cjs` passes: one shared rule,3s clips,0.6s loading,one regenerating clip at0.2s footage/sec,unchanged non-boss camera,2.2s repairs fitting within3s clips.
- Both bosses now repair on real time. This intentionally supersedes the earlier machine-time proposal according to the owner's decisions recorded in the handover. Do not revert it merely to match the old brief.
- The changes in Level 1 `game.js` against the pre-clips copy are limited to enabling the shared boss rule and drawing its clip HUD. Shared `world.js` adds the clip implementation; `demo.js` adapts the autopilot. These are documented intentional changes, not accidental loss of the Level 1 baseline.
- `l2-art.js`, `level-2.json` and the level builder have not acquired later edits since the refinement/layout timestamps. This review does not claim a fresh visual or physical-device playtest.

## Remaining validation and scope

The chosen3s/0.6s/15s timings need player feedback. Boss difficulty comparison and real iPad performance remain unverified. Campaign navigation, prototype cleanup and deployment remain separate; the live site has not received these local changes according to the handover.

The handover's suggestion that the hold helper might conflict with sparse UI should not lead to removing it: the owner explicitly requested “Hold E to Fix”. Decorative fixture text can be assessed separately.

Priorities: correct the spare-clip display, finish the camera-dependent boss encounters using the shared rule, then playtest the chosen timings. Preserve the completed artwork and traversal work.
