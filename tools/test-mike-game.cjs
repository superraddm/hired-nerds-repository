// CDP harness for mike-game (Mike the Mic, Level 1): the design's section 11 test list, captures of every scene, gate,
// boss phase and the results at desktop, iPad and phone sizes, then the contact sheet docs/mike-platformer/look/index.html.
// Needs the preview server: node tools/serve-fireworks.cjs 8788.
// Usage: node tools/test-mike-game.cjs [physics|machines|level|demo|captures|all]
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'docs', 'mike-platformer', 'look');
const BASE = process.env.MIKE_URL || 'http://localhost:8788/mike-game/';
const MODE = process.argv[2] || 'all', PORT = 9335, run = k => MODE === 'all' || MODE === k;
fs.mkdirSync(OUT, { recursive:true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(os.tmpdir(), 'mike-game-prof')}`, '--no-first-run', '--window-size=960,540', 'about:blank'], { stdio:'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SCENES = ['title', 's1-start', 's2-belts', 's3-camera-alley', 's4-stores', 's5-arm-gate', 's6-coolant-loft', 's7-belt-run', 's8-clappers',
  's9-bench', 's10-boss-idle', 's10-boss-repair', 'results', 'poses', 'hazards'];
const DEVICES = { ipad:{ w:1024, h:768, label:'iPad landscape' }, phone:{ w:844, h:390, label:'phone landscape' } };
const near = (a, b, e, what) => assert.ok(Math.abs(a - b) <= e, `${what}: ${a} is not ${b} ± ${e}`);

(async () => {
  let list; for (let i = 0; i < 40; i++){ try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch(e){} await sleep(250); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const wait = new Map(), errors = [], requests = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)){ wait.get(d.id)(d); wait.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    if (d.method === 'Network.requestWillBeSent') requests.push({ url:d.params.request.url, at:Date.now() }); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id:i, method, params })); });
  const ev = async x => { const r = await send('Runtime.evaluate', { expression:x, returnByValue:true, awaitPromise:true });
    if (r.result?.exceptionDetails) throw Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800)); return r.result?.result?.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  const size = async (w, h, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', { width:w, height:h, deviceScaleFactor:1, mobile:!!mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled:!!mobile, maxTouchPoints:mobile ? 5 : 0 });
  };
  const open = async (q, w = 960, h = 540, mobile = false) => {
    await size(w, h, mobile);
    await send('Page.navigate', { url:BASE + q });
    for (let i = 0; i < 200; i++){ await sleep(100); try { if (await ev('document.body.dataset.ready') === '1') return; } catch(_){} }
    throw Error('page never became ready: ' + q);
  };
  const shot = async name => { const f = path.join(OUT, name + '.png'); fs.writeFileSync(f, Buffer.from((await send('Page.captureScreenshot')).result.data, 'base64')); return f; };
  const savePng = (name, dataUrl) => fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));
  const prevPath = path.join(OUT, 'measurements.json');
  const results = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')) : {};
  // the in-page helper every test block starts with
  const H = `const m = window.__mike, R = {}; let s, n;
    const until = (fn, max) => { for (let k = 0; k < (max || 3000); k++){ if (fn()) return true; m.step(1); } return false; };`;

  // ---------- physics: the design's movement numbers (section 3) and the camera's footage ----------
  if (run('physics')){
    await open('?section=1&test=1');
    const p = results.physics = JSON.parse(await ev(`(() => { ${H} const FPS = 60;
      const air = (setup) => { m.reset(); setup(); let n = 0, peak = 99, apex = 0;
        for (; n < 400; n++){ s = m.step(1); if (s.y < peak){ peak = s.y; apex = n + 1; } if (n > 2 && s.ground) break; } return { n:n + 1, peak, apex }; };
      let r = air(() => { m.place(4, 12); m.input({ jump:true }); });
      R.heldJump = { height:+(12 - r.peak).toFixed(3), apexSeconds:+(r.apex/FPS).toFixed(3), flightSeconds:+(r.n/FPS).toFixed(3) };
      m.reset(); m.place(4, 12); m.input({ jump:true }); m.step(1); m.input({}); let peak = 12; n = 1;
      for (; n < 200; n++){ s = m.step(1); peak = Math.min(peak, s.y); if (s.ground) break; }
      R.tapJump = { height:+(12 - peak).toFixed(3), flightSeconds:+((n + 1)/FPS).toFixed(3) };
      m.reset(); m.place(3, 12); m.input({ right:true }); let k = 0; for (; k < 120; k++){ s = m.step(1); if (s.vx >= 7 - 1e-9) break; }
      R.run = { topSpeed:+s.vx.toFixed(3), secondsToTop:+((k + 1)/FPS).toFixed(3) };
      m.reset(); m.place(3, 12); m.input({ right:true }); m.step(20); let x0 = m.snapshot().x; m.input({ right:true, jump:true });
      for (n = 0; n < 200; n++){ s = m.step(1); if (n > 2 && s.ground) break; }
      R.fullSpeedRange = +(s.x - x0).toFixed(3);
      m.reset(); m.place(3, 12); m.input({ right:true }); for (n = 0; n < 200; n++){ s = m.step(1); if (s.x >= 6) break; }
      x0 = s.x; m.input({ right:true, jump:true }); for (n = 0; n < 200; n++){ s = m.step(1); if (n > 2 && s.ground) break; }
      R.rangeAfter3TRunUp = +(s.x - x0).toFixed(3);
      m.reset(); m.place(3, 12); m.input({ right:true }); m.step(30); x0 = m.snapshot().x; m.input({}); for (n = 0; n < 60; n++){ s = m.step(1); if (s.vx === 0) break; }
      R.brake = { seconds:+((n + 1)/FPS).toFixed(3), distance:+(s.x - x0).toFixed(3) };
      const coyote = late => { m.reset(); m.place(17.2, 10); m.input({ right:true });
        for (let t = 0; t < 60; t++){ s = m.step(1); if (!s.ground) break; }
        if (late > 1) m.step(late - 1); m.input({ right:true, jump:true }); s = m.step(1); return s.vy < -10; };
      R.coyote = { at0_10s:coyote(6), at0_117s:coyote(7), at0_15s:coyote(9) };
      const land = () => { m.reset(); m.place(4, 12); m.input({ jump:true }); let t = 0; for (; t < 200; t++){ s = m.step(1); if (t > 2 && s.ground) break; } return t; };
      const N = land();
      const buffer = early => { m.reset(); m.place(4, 12); m.input({ jump:true }); let t = 0;
        for (; t < N - early; t++){ s = m.step(1); if (t === 34) m.input({}); }
        m.input({ jump:true }); for (; t < N + 3; t++){ s = m.step(1); if (s.vy < -10) return true; } return false; };
      R.buffer = { pressed0_10sEarly:buffer(6), pressed0_13sEarly:buffer(8), pressed0_20sEarly:buffer(12) };
      m.reset(0); m.place(39.5, 12); m.input({ right:true }); m.step(20); const onBelt = m.snapshot(); m.input({ right:true, jump:true }); s = m.step(2);
      R.belt = { groundSpeed:+(onBelt.vx + onBelt.beltV).toFixed(3), takeOffVx:+s.vx.toFixed(3) };
      // the camera: 3 s of footage on the card, used second for second; 1 s pause after, then 0.5 s back per second
      m.reset(); m.place(4, 12); m.input({ camera:true }); s = m.step(1); m.input({}); s = m.step(59);
      const after1 = s.left; for (n = 0; n < 600; n++){ s = m.step(1); if (!s.cameraOn) break; }
      const emptyAt = (n + 61)/FPS; m.input({ camera:true }); s = m.step(1); const refusedDuringPause = !s.cameraOn; m.input({});
      s = m.step(59); const afterPause = s.left; s = m.step(60); const oneSecLater = s.left;
      m.input({ camera:true }); s = m.step(1); const acceptsAtHalfSecond = s.cameraOn; m.input({});
      R.camera = { cardSeconds:3, leftAfter1s:+after1.toFixed(2), emptiesAtSeconds:+emptyAt.toFixed(3), refusedDuringPause,
        leftAfterPause:+afterPause.toFixed(2), leftOneSecondLater:+oneSecLater.toFixed(2), acceptsAtHalfSecond };
      // an SD card adds 1.5 s of footage
      m.reset(); m.place(29.3, 12); s = m.step(2); R.sdCard = { got:s.got.includes('sd-1'), cap:+s.cap.toFixed(2) };
      m.reset(); m.place(4, 12); m.input({ right:true }); s = m.step(90);
      R.view = { mikeScreenX:+s.sx.toFixed(1), tilesAheadOnScreen:+((s.camX + s.viewW)/32 - s.x).toFixed(2), zoom:s.zoom };
      m.reset(); m.input({ right:true }); for (n = 0; n < 200; n++){ s = m.step(1); if (s.x >= 11.6) break; }
      m.input({ right:true, jump:true }); m.step(30); m.input({ right:true }); m.step(300); s = m.snapshot();
      R.pickups = { got:s.got.slice().sort(), score:s.score };
      return JSON.stringify(R); })()`));
    console.log('physics', JSON.stringify(p));
    near(p.heldJump.height, 3, 0.02, 'held jump height'); near(p.heldJump.apexSeconds, 0.5, 0.02, 'time to apex'); near(p.heldJump.flightSeconds, 1, 0.034, 'same-height flight');
    assert.ok(p.tapJump.height >= 0.7 && p.tapJump.height <= 1.0, 'tap height ' + p.tapJump.height);
    near(p.run.topSpeed, 7, 1e-6, 'top speed'); near(p.run.secondsToTop, 0.25, 0.02, 'time to top speed');
    assert.ok(p.rangeAfter3TRunUp >= 6, 'a 3T run-up must clear a 4T gap plus a 2T landing');
    assert.equal(p.coyote.at0_10s, true); assert.equal(p.coyote.at0_15s, false);
    assert.equal(p.buffer.pressed0_10sEarly, true); assert.equal(p.buffer.pressed0_20sEarly, false);
    near(p.belt.takeOffVx, 10, 1e-6, 'belt take-off capped at 10T/s');
    near(p.camera.leftAfter1s, 2, 0.02, 'footage used second for second'); near(p.camera.emptiesAtSeconds, 3, 0.05, 'the card holds 3 s');
    assert.equal(p.camera.refusedDuringPause, true); near(p.camera.leftAfterPause, 0, 1e-6, 'no refill during the pause');
    near(p.camera.leftOneSecondLater, 0.5, 0.02, 'refill rate'); assert.equal(p.camera.acceptsAtHalfSecond, true);
    assert.equal(p.sdCard.got, true); near(p.sdCard.cap, 4.5, 1e-6, 'an SD card adds 1.5 s');
    assert.ok(p.view.tilesAheadOnScreen >= 8, 'at least 8T visible ahead');
    assert.deepEqual(p.pickups.got, ['bearing-1', 'lube-1', 'sd-1', 'seal-1']); assert.equal(p.pickups.score, 350);
  }

  // ---------- machines: every hazard and all three camera crossings ----------
  if (run('machines')){
    await open('?test=1');
    const mc = results.machines = JSON.parse(await ev(`(() => { ${H}
      const gate = (id, pad, camera) => { m.reset('full'); m.place(pad, 12); until(() => m.gateState(id) === 'green');
        m.input({ right:true, camera:!!camera }); m.step(1); m.input({ right:true }); s = m.step(120); return { x:+s.x.toFixed(2), health:s.health }; };
      R.gallery = { noCamera:gate('gallery', 79.2), camera:gate('gallery', 79.2, true) };
      R.armGate = { noCamera:gate('arm-gate', 147.3), camera:gate('arm-gate', 147.3, true) };
      R.jaws = { noCamera:gate('jaws', 251.3), camera:gate('jaws', 251.3, true) };
      // lathe: standing in the lane Mike takes one hit per burst (the second part finds him protected); the shelf is cover
      m.reset('full'); m.place(58.9, 12); s = m.step(180); R.latheFloor = s.health;
      m.reset('full'); m.place(56, 10); s = m.step(240); R.latheShelf = s.health;
      // grinder at the end of the belt run fires the same way
      m.reset('full'); m.place(236.5, 12); s = m.step(180); R.grinderFloor = s.health;
      // coolant: standing in the jet
      m.reset('full'); m.place(179.9, 12); s = m.step(150); R.coolantJet = s.health;
      // belts: speed, slowing before reversal, reversed, and slowed by the camera
      m.reset('full'); m.step(60); const b1 = m.beltSpeed('belt-2a'); m.step(156); const b2 = m.beltSpeed('belt-2a'); m.step(84); const b3 = m.beltSpeed('belt-2a');
      m.reset('full'); m.place(41, 12); m.input({ camera:true }); m.step(1); m.input({}); s = m.step(4);
      R.belt = { at1s:+b1.toFixed(2), at3_6s:+b2.toFixed(2), at5s:+b3.toFixed(2), underFootWhileSlow:+s.beltV.toFixed(2) };
      // a pit: a life, back at the checkpoint, protected
      m.reset('full'); m.place(46, 12); s = m.step(150); R.pit = { x:+s.x.toFixed(2), lives:s.lives, protectedFor:+(1.5 - s.hitT).toFixed(2) };
      return JSON.stringify(R); })()`));
    console.log('machines', JSON.stringify(mc));
    for (const [k, end] of [['gallery', 83], ['armGate', 152], ['jaws', 255]]){
      assert.ok(mc[k].noCamera.x < end - 3 && mc[k].noCamera.health === 2, `${k}: without the camera the gate sends Mike back`);
      assert.ok(mc[k].camera.x > end + 0.5 && mc[k].camera.health === 3, `${k}: with the camera Mike crosses`);
    }
    assert.equal(mc.latheFloor, 2); assert.equal(mc.latheShelf, 3); assert.equal(mc.grinderFloor, 2); assert.equal(mc.coolantJet, 2);
    near(mc.belt.at1s, 3, 1e-6, 'belt'); near(mc.belt.at3_6s, 1.5, 0.05, 'belt slowing'); near(mc.belt.at5s, -3, 1e-6, 'belt reversed'); near(mc.belt.underFootWhileSlow, 0.6, 0.01, 'slow belts');
    assert.ok(Math.abs(mc.pit.x - 2) < 0.1 && mc.pit.lives === 2, 'pit respawn');
  }

  // ---------- level rules: recovery, scoring, continues, the boss, save ----------
  if (run('level')){
    await open('?test=1');
    const lv = results.level = JSON.parse(await ev(`(() => { ${H}
      m.clearSave();
      // missing parts: walking past the free-spares machine with nothing supplies the whole recipe, for no score
      m.reset('full'); m.place(288.6, 12); s = m.step(30); R.recovery = { rec:s.rec, score:s.score };
      // no duplicate scoring: collect, die, come back past it
      m.reset('full'); m.place(8.2, 12); m.step(2); const s1 = m.snapshot().score; m.place(46, 12); m.step(150); m.input({ right:true }); m.step(90); m.input({});
      R.noDuplicate = { first:s1, after:m.snapshot().score };
      // zero lives: continue from the checkpoint with three, counted
      // zero lives (owner, 30 Sept): with a continue banked the level starts again with three lives; with none the game is over
      localStorage.setItem('mike-game.campaign.v1', JSON.stringify({ continues:1, cleared:[] })); m.reset('full'); m.G.lives = 1; m.place(46, 12); s = m.step(150); R.continue = { lives:s.lives, continues:s.continues, x:+s.x.toFixed(2), left:window.MIKE.campaign.continues };
      m.reset('full'); m.G.lives = 1; m.place(46, 12); m.step(150); R.gameOver = { mode:m.G.mode, save:!!localStorage.getItem('mike-game.v3.save') }; localStorage.removeItem('mike-game.campaign.v1');
      // extra life: the mini Mike
      m.reset('full'); m.place(182, 8); s = m.step(3); R.miniMike = { lives:s.lives, got:s.got.includes('mini-mike') };
      // the boss: a fitting cancelled by moving consumes nothing; a full hold fits one bearing
      m.reset('full'); m.grant('bearing', 2); m.grant('seal', 2); m.grant('coupling', 2); m.grant('controlUnit', 2);
      m.place(300.2, 12); until(() => m.snapshot().boss.on); until(() => { const b = m.snapshot().boss; return b.t >= 4.0 && b.t < 4.2; });
      m.place(301, 12); m.input({ fix:true }); m.step(36); const mid = m.snapshot(); m.input({ right:true }); m.step(1); m.input({}); s = m.step(1);
      R.cancel = { progressMid:+mid.boss.fix.toFixed(2), after:s.boss.fix, used:s.used.bearing, fitted:s.boss.fitted.bearing };
      until(() => { const b = m.snapshot().boss; return b.t >= 4.0 && b.t < 4.2; }); m.place(301, 12); m.input({ fix:true }); s = m.step(80); m.input({});
      R.fit = { fitted:s.boss.fitted.bearing, used:s.used.bearing };
      // the sweeping tip hurts: stand in its lane during the sweep
      m.place(304, 12); until(() => { const b = m.snapshot().boss; return b.t >= 1.4 && b.t < 1.5; }); s = m.step(60); R.sweepHit = s.health < 3;
      // save: collect, reach a checkpoint; then the page reloads and Continue restores it
      m.reset('full'); m.place(8.2, 12); m.step(2); m.place(102.2, 12); m.step(3);
      return JSON.stringify(R); })()`));
    await send('Page.reload'); for (let i = 0; i < 100; i++){ await sleep(100); if (await ev('document.body.dataset.ready') === '1') break; }
    lv.saveReload = JSON.parse(await ev(`(() => { const ok = __mike.resume(); const s = __mike.snapshot(); return JSON.stringify({ ok, x:+s.x.toFixed(2), got:s.got, score:s.score }); })()`));
    await ev('__mike.clearSave()');
    console.log('level', JSON.stringify(lv));
    assert.deepEqual([lv.recovery.rec.bearing, lv.recovery.rec.seal, lv.recovery.rec.coupling, lv.recovery.rec.controlUnit], [2, 2, 2, 2]); assert.equal(lv.recovery.score, 0);
    assert.equal(lv.noDuplicate.first, 100); assert.equal(lv.noDuplicate.after, 100);
    assert.equal(lv.continue.lives, 3); assert.equal(lv.continue.continues, 1); assert.ok(lv.continue.x < 3, 'the level starts again from the beginning'); assert.equal(lv.continue.left, 0);
    assert.equal(lv.gameOver.mode, 'title'); assert.equal(lv.gameOver.save, false, 'no checkpoint save survives the last life');
    assert.equal(lv.miniMike.lives, 4);
    assert.ok(lv.cancel.progressMid > 0.4 && lv.cancel.after === 0 && lv.cancel.used === 0 && lv.cancel.fitted === 0, 'a cancelled fitting uses nothing');
    assert.equal(lv.fit.fitted, 1); assert.equal(lv.fit.used, 1); assert.equal(lv.sweepHit, true);
    assert.ok(lv.saveReload.ok && Math.abs(lv.saveReload.x - 102) < .1 && lv.saveReload.got.includes('bearing-1'), 'save and reload');
  }

  // ---------- the deterministic demo wins, and its frames become the gate and boss captures ----------
  const caps = [];
  if (run('demo') || run('captures')){
    await open('?demo=1&test=1');
    const d = JSON.parse(await ev(`(async () => { const m = window.__mike, want = {}, out = {};
      const a = () => m.api(), grab = k => { if (!out[k]) out[k] = m.frame(); };
      m.reset('full'); let n = 0;
      while (m.G.mode === 'play' && n < 60*60*6){
        m.step(1); n++; const x = a().P.x, cam = a().CAMR.on, B = a().B;
        if (n === 150) grab('start');
        if (cam && x > 80 && x < 82) grab('gate-gallery'); if (cam && x > 149 && x < 151) grab('gate-arm'); if (cam && x > 252.5 && x < 254) grab('gate-press');
        if (x > 172 && x < 174 && a().P.ground) grab('coolant');
        if (B.on && B.step === 0 && B.fix > .5) grab('boss-1-bearings'); if (B.on && B.step === 3 && B.fix > .5) grab('boss-2-seals');
        if (B.on && B.step === 6 && B.fix > .5) grab('boss-3-couplings'); if (B.done && B.doneT > 1.2) grab('boss-restored');
      }
      m.step(1); grab('results');
      const s = m.snapshot();
      return JSON.stringify({ frames:out, steps:n, seconds:+(n/60).toFixed(1), won:s.won, done:document.body.dataset.done || null, lost:s.livesLost, results:m.G.results }); })()`));
    results.demo = { seconds:d.seconds, won:d.won, done:d.done, livesLost:d.lost, results:d.results };
    console.log('demo', JSON.stringify(results.demo));
    assert.equal(d.won, true, 'the demo wins'); assert.equal(d.done, '1', 'body[data-done] only after winning');
    const names = { start:'the level card at the start', 'gate-gallery':'section 3: crossing the turning-centre gallery on camera',
      'gate-arm':'section 5: under the spindle head on camera', coolant:'section 6: the coolant loft', 'gate-press':'section 8: through the press on camera',
      'boss-1-bearings':'boss phase 1: fitting a bearing', 'boss-2-seals':'boss phase 2: fitting a seal', 'boss-3-couplings':'boss phase 3: fitting a coupling',
      'boss-restored':'the Turner restored', results:'results, from the real run' };
    for (const [k, label] of Object.entries(names)) if (d.frames[k]){ savePng('run-' + k, d.frames[k]); caps.push({ file:'run-' + k + '.png', name:label, w:960, h:540, note:'the ?demo=1 run, the real loop at 60 Hz', group:'Played through' }); }
  }

  // ---------- captures ----------
  if (run('captures')){
    for (const s of SCENES){ await open('?scene=' + s); await sleep(150); caps.push({ file:path.basename(await shot('scene-' + s)), name:s, w:960, h:540, note:'960×540 still', group:'Scenes' }); }
    for (const [k, dv] of Object.entries(DEVICES)) for (const s of ['s1-start', 's3-camera-alley', 's10-boss-idle', 'results']){
      await open('?scene=' + s, dv.w, dv.h, true); await sleep(200);
      caps.push({ file:path.basename(await shot(`device-${k}-${s}`)), name:`${s} (${dv.label})`, w:dv.w, h:dv.h, note:`${dv.w}×${dv.h}, touch controls shown`, group:'Device sizes' });
    }
    // run-and-jump strip in section 1
    await open('?section=1&test=1');
    const strip = await ev(`(async () => {
      const m = window.__mike, frames = []; let s;
      const grab = async label => { const im = new Image(); im.src = m.frame(); await im.decode(); const s = m.snapshot();
        const cx = Math.max(240, Math.min(720, s.sx)), cy = Math.max(135, Math.min(405, s.sy - 70));
        frames.push({ im, label, sx:cx - 240, sy:cy - 135 }); };
      m.reset(); await grab('0.00 s  at the clock'); m.input({ right:true });
      s = m.step(12); await grab('0.20 s  away'); s = m.step(18); await grab('0.50 s  full speed');
      for (let i = 0; i < 120 && s.x < 11.6; i++) s = m.step(1);
      m.input({ right:true, jump:true }); s = m.step(8); await grab('take-off'); s = m.step(12); await grab('top of the arc');
      for (let i = 0; i < 60 && !s.ground; i++) s = m.step(1); await grab('landed on the shelf');
      m.input({ right:true }); s = m.step(20); await grab('off the far end'); m.input({ right:true, camera:true }); s = m.step(1); m.input({ right:true }); s = m.step(20); await grab('camera on: slow motion');
      const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 600; const c = cv.getContext('2d');
      c.fillStyle = '#06213F'; c.fillRect(0, 0, cv.width, cv.height);
      frames.forEach((f, i) => { const x = (i % 4)*480, y = Math.floor(i/4)*300; c.drawImage(f.im, f.sx, f.sy, 480, 270, x, y, 480, 270);
        c.fillStyle = '#fff'; c.font = '600 16px Helvetica, Arial, sans-serif'; c.fillText((i + 1) + '. ' + f.label, x + 10, y + 290); });
      return cv.toDataURL('image/png'); })()`);
    savePng('strip-section1-run-jump', strip);
    caps.push({ file:'strip-section1-run-jump.png', name:'section 1: eight frames of running, jumping and filming', w:1920, h:600, note:'1:1 crops around Mike from the real loop', group:'Played through' });
    // real time: keyboard play, no network after load, and the frame budget on this machine
    await open('?section=1-3');
    const t0 = Date.now(); requests.length = 0;
    const key = (type, code, keyName) => send('Input.dispatchKeyEvent', { type, code, key:keyName, windowsVirtualKeyCode:{ ArrowRight:39, Space:32 }[code] });
    const x0 = await ev('__mike.snapshot().x');
    await key('keyDown', 'ArrowRight', 'ArrowRight'); await sleep(900); await key('keyDown', 'Space', ' '); await sleep(120);
    const midAir = await ev('!__mike.snapshot().ground'); await key('keyUp', 'Space', ' '); await sleep(900); await key('keyUp', 'ArrowRight', 'ArrowRight'); await sleep(400);
    const x1 = await ev('__mike.snapshot().x'); const t1 = Date.now();
    const afterLoad = requests.filter(r => r.at >= t0 && r.at < t1).map(r => r.url);
    await open('?demo=1&lab=1'); await sleep(15000);
    const perf = JSON.parse(await ev('JSON.stringify(__mike.perf())'));
    await shot('play-lab-readout');
    caps.push({ file:'play-lab-readout.png', name:'?demo=1&lab=1 in real time, with the lab read-out', w:960, h:540, note:'frame and work percentiles on this PC', group:'Played through' });
    results.realtime = { movedTiles:+(x1 - x0).toFixed(2), jumpedWithSpace:midAir, requestsAfterLoad:afterLoad.filter(u => !u.startsWith('data:') && !u.startsWith('blob:')), perf };
    console.log('realtime', JSON.stringify(results.realtime));
    assert.ok(results.realtime.movedTiles > 8, 'keyboard run'); assert.equal(midAir, true, 'Space jumps');
    assert.deepEqual(results.realtime.requestsAfterLoad, [], 'no network after load');
    results.captures = caps;
    writeSheet(caps, results);
  }
  results.errors = errors; results.when = new Date().toISOString();
  fs.writeFileSync(prevPath, JSON.stringify(results, null, 1));
  console.log(JSON.stringify({ errors }, null, 1));
  assert.deepEqual(errors, [], 'console errors');
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });

// The contact sheet: every capture with its name, one file for the owner to open.
function writeSheet(caps, r){
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const p = r.physics, mc = r.machines, lv = r.level, dm = r.demo;
  const rows = [];
  if (p) rows.push(['Held jump height / time to top / flight', `${p.heldJump.height}T / ${p.heldJump.apexSeconds} s / ${p.heldJump.flightSeconds} s`, '3T / 0.5 s / 1 s'],
    ['Top speed; from rest', `${p.run.topSpeed}T/s; ${p.run.secondsToTop} s`, '7T/s; 0.25 s'], ['Range from a 3T run-up', p.rangeAfter3TRunUp + 'T', '≥ 6T'],
    ['Camera footage', `3 s card, empties at ${p.camera.emptiesAtSeconds} s; SD card → ${p.sdCard.cap} s`, 'owner: seconds on the card, SD cards add more']);
  if (mc) rows.push(['Gallery / spindle / press without camera', `sent back, health ${mc.gallery.noCamera.health} / ${mc.armGate.noCamera.health} / ${mc.jaws.noCamera.health}`, 'the camera is needed'],
    ['… with camera', `through to x ${mc.gallery.camera.x} / ${mc.armGate.camera.x} / ${mc.jaws.camera.x}, no damage`, 'crossed']);
  if (lv) rows.push(['Free spares with nothing collected', JSON.stringify([lv.recovery.rec.bearing, lv.recovery.rec.seal, lv.recovery.rec.coupling, lv.recovery.rec.controlUnit]) + ', score ' + lv.recovery.score, '[2,2,2,2], 0'],
    ['Save, reload, Continue', lv.saveReload.ok ? 'restored at x ' + lv.saveReload.x : 'failed', 'restored']);
  if (dm) rows.push(['Demo run', `${dm.won ? 'won' : 'did not win'} in ${dm.seconds} s, lives lost ${dm.livesLost}, score ${dm.results && dm.results.score}`, 'wins; data-done set']);
  if (r.realtime && r.realtime.perf) rows.push(['Frame work on this PC (p50 / p95)', `${r.realtime.perf.workP50.toFixed(1)} / ${r.realtime.perf.workP95.toFixed(1)} ms`, 'iPad 5 budget: p95 ≤ 12 ms (measure on the iPad)']);
  const groups = ['Played through', 'Scenes', 'Device sizes'];
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mike the Mic: Level 1 look</title>
<style>body{margin:0;background:#06213F;color:#fff;font:16px/1.4 Helvetica,Arial,sans-serif;padding:24px}h1{margin:0 0 4px;font-size:28px}h2{margin:36px 0 0;font-size:22px}
p{max-width:75ch;opacity:.9}figure{margin:24px 0}img{display:block;max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.4)}
figcaption{margin-top:8px;font-weight:700}figcaption span{font-weight:400;opacity:.75;margin-left:8px}table{border-collapse:collapse;margin:12px 0}
td,th{padding:4px 14px 4px 0;text-align:left;vertical-align:top}th{opacity:.7;font-weight:400}a{color:#9fd0ff}</style>
<h1>Mike the Mic: Level 1</h1>
<p>Every image is from the real game (<code>public/fireworks/mike-game/</code>). To play: run <code>node tools/serve-fireworks.cjs 8788</code> and open
<a href="http://localhost:8788/mike-game/">localhost:8788/mike-game/</a>. <code>?demo=1</code> watches the autopilot play it through.</p>
<table><tr><th>Checked</th><th>Result</th><th>Wanted</th></tr>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
${groups.map(g => `<h2>${g}</h2>` + caps.filter(c => c.group === g).map(c => `<figure><img src="${c.file}" width="${c.w}" height="${c.h}" alt="${esc(c.name)}" loading="lazy"><figcaption>${esc(c.name)}<span>${esc(c.note)} · ${c.file}</span></figcaption></figure>`).join('\n')).join('\n')}
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
}
