// The camera in a boss shoots in clips (owner, 29 September). One rule, in js/world.js, used by both levels, so the
// two bosses can never differ. This suite measures the rule itself and checks both levels switch it on.
//   1. Slow motion must be worth using on a boss.
//   2. A repair fits inside one clip.
//   3. No amount of footage makes the boss a walk: cards are spare clips, never a longer clip; the player loads each
//      clip by pressing; and the one clip that comes back by itself comes back far slower than a clip loads.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const { M, E, levelData, step, place } = require('./mike-l2-lib.cjs');
const base = path.resolve(__dirname, '../public/fireworks/mike-game'), DT = 1/60, CLIP = M.CLIP, CAM = M.CAMERA, result = {};
const run = (C, secs, press) => { let filmed = 0; for (let i = 0; i < Math.round(secs*60); i++){ const ts = M.stepCamera(C, !!press && i === 0, DT); if (ts < 1) filmed += DT; } return filmed; };
const near = (a, b, tol) => Math.abs(a - b) < (tol || .03);
const L1 = JSON.parse(fs.readFileSync(path.join(base, 'level-1.json'), 'utf8')), L2 = levelData();
const cards = L => L.sections.reduce((n, s) => n + (s.pickups || []).filter(p => p.type === 'sdCard').length, 0);

// The partially used current take must not hide a full spare in either HUD.
{ for (const count of [0, 1, 2, 3, 4, 5, 6]){
    const C = M.newCamera(count); C.boss = true;
    const spare = Math.floor((C.cap - CLIP.cost + 1e-6)/CLIP.cost);
    M.stepCamera(C, true, DT); assert.equal(M.spareClips(C), spare, 'first filming frame');
    run(C, 1.4); assert.equal(M.spareClips(C), spare, 'middle of take');
    run(C, CLIP.length - 1.45); assert.equal(M.spareClips(C), spare, 'last frames');
    run(C, .1); assert.ok(!C.on); assert.equal(M.spareClips(C), M.clipsLeft(C), 'expired take');
  } result.spareClipDisplay = true; }

// Outside a boss nothing has changed: one press films until the card is empty, and the card refills as it did.
{ const C = M.newCamera(6); assert.equal(C.cap, 12); assert.ok(near(run(C, 14, true), 12), 'twelve seconds in one take'); assert.equal(C.on, false);
  run(C, 1); const l0 = C.left; run(C, 4); assert.ok(near(C.left - l0, 4*CAM.refill, .05), 'refills at half a second per second');
  const B = M.newCamera(0); assert.ok(near(run(B, 5, true), 3)); result.outsideABossUnchanged = true; }

// In a boss: a clip is five seconds, then the camera stops by itself and waits to be pressed.
{ const C = M.newCamera(6); C.boss = true;
  assert.ok(near(run(C, CLIP.length + .1, true), CLIP.length), 'one press, one clip'); assert.equal(C.on, false); assert.ok(near(C.left, 12 - CLIP.cost, .05), 'the rest of the card is untouched');
  assert.ok(near(run(C, 6), 0), 'and it does not start again by itself'); result.clipSeconds = CLIP.length; }

// Loading the next clip: quick, and the player's job. Pressed too soon it refuses.
{ const C = M.newCamera(6); C.boss = true; run(C, CLIP.length + .02, true);
  assert.equal(M.stepCamera(C, true, DT), 1, 'still loading'); assert.ok(C.refused > 0);
  run(C, CLIP.load + .05); assert.equal(M.stepCamera(C, true, DT), CAM.scale, 'loaded: the next clip runs'); result.loadSeconds = CLIP.load; }

// Every card collected: spare clips, pressed one after another, and then no more until one comes back.
{ for (const [name, L] of [['Boss 1', L1], ['Boss 2', L2]]){
    const C = M.newCamera(cards(L)); C.boss = true; const clips = M.clipsLeft(C); let filmed = 0, n = 0;
    for (let k = 0; k < clips + 1; k++){ const f = run(C, CLIP.length + CLIP.load + .1, true); if (f > .4){ n++; filmed += f; } }
    assert.equal(n, clips, name + ': as many clips as the card holds'); assert.ok(near(filmed, clips*CLIP.length, .1)); assert.ok(C.left < CLIP.cost, 'and no whole clip is left');
    result[name] = { sdCards:cards(L), footage:M.cameraSeconds(C, C.cap), clips, repairs:(L.boss.orders[0].flat ? L.boss.orders[0].flat() : L.boss.orders[0]).length };
    assert.ok(clips < result[name].repairs, name + ': every card collected still films fewer repairs than the boss needs'); } }

// Recharge: only one clip comes back by itself, and far slower than a clip loads.
{ const C = M.newCamera(6); C.boss = true; C.left = 0; C.cool = 0;
  run(C, 10); assert.ok(near(C.left, 10*CLIP.recharge, .05), 'one fifth of a storage unit per second'); assert.ok(C.left < CLIP.cost);
  run(C, 60); assert.ok(near(C.left, CLIP.cost), 'one clip comes back, and only one, whatever the card holds');
  const seconds = CLIP.cost/CLIP.recharge; assert.ok(seconds >= 10*CLIP.load, 'recharging is at least ten times slower than loading');
  result.rechargeSecondsPerClip = seconds; result.timesSlowerThanLoading = +(seconds/CLIP.load).toFixed(0); }

// A bare card: one clip on arrival, the same clip again after the wait. Nobody is ever left without the camera.
{ const C = M.newCamera(0); C.boss = true; assert.equal(M.clipsLeft(C), 1); assert.ok(near(run(C, CLIP.length + 1, true), CLIP.length)); assert.ok(near(run(C, 2, true), 0, .05), 'nothing to film with yet');
  run(C, CLIP.cost/CLIP.recharge + 1); assert.ok(near(run(C, CLIP.length + 1, true), CLIP.length), 'and then a whole clip again'); result.bareCard = { clips:1 }; }

// Stopping a clip early keeps what is left of it.
{ const C = M.newCamera(2); C.boss = true; run(C, 1, true); M.stepCamera(C, true, DT); assert.equal(C.on, false); assert.ok(near(C.left, 6 - CLIP.cost/CLIP.length, .06)); assert.equal(M.clipsLeft(C), 1);
  // but a clip is always a whole clip: with two seconds on the card the camera waits for the third
  const D = M.newCamera(0); D.boss = true; D.left = 2; assert.equal(M.stepCamera(D, true, DT), 1); assert.ok(D.refused > 0); result.stopEarlyKeepsFootage = true; result.wholeClipsOnly = true; }

// A repair fits inside one clip in both bosses, and takes the same time in both.
{ assert.equal(L1.boss.hold, L2.boss.hold); assert.ok(L1.boss.hold < CLIP.length); result.repairSeconds = L1.boss.hold; result.spareInAClip = +(CLIP.length - L1.boss.hold).toFixed(1); }

// Both levels switch the rule on while their boss is awake, and off when it is fixed.
{ const g = fs.readFileSync(path.join(base, 'js/game.js'), 'utf8'); assert.ok(/CAMR\.boss = B\.on && !B\.done;[^\n]*\n\s*G\.ts = M\.stepCamera\(CAMR/.test(g), 'Level 1 sets the flag just before it steps the camera');
  assert.ok(/B\.fix \+= dt\/L\.boss\.hold/.test(g), 'Level 1 repairs on Mike\'s own time');
  const L = E.load(L2), S = E.create(L); S.suit = true; place(S, 470, 12); step(S, 3); assert.ok(!S.cam.boss);
  place(S, 477.4, 14.3); step(S, 2); assert.ok(S.boss.on && S.cam.boss, 'Level 2 sets it as the fault wakes');
  S.cam.left = S.cam.cap = 9; step(S, 1, { camera:true }); step(S, Math.ceil(CLIP.length*60) + 3); assert.equal(S.cam.on, false); assert.ok(near(S.cam.left, 6, .06), 'one clip, by the game\'s own step');
  S.boss.done = true; step(S, 1); assert.ok(!S.cam.boss); result.bothLevelsUseIt = true; }

fs.writeFileSync(path.resolve(__dirname, '../docs/mike-platformer/l2-look/clips.json'), JSON.stringify(result, null, 2));
console.log('Camera clips passed', JSON.stringify(result, null, 1));
