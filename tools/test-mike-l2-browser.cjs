// Level 2 in a real browser: a fresh, isolated headless Chrome (never a user's profile), the local server on 8788.
//   node tools/test-mike-l2-browser.cjs            every check and every capture
//   node tools/test-mike-l2-browser.cjs scenes     captures only (add scene names to limit them)
// Needs: node tools/serve-fireworks.cjs 8788
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const OUT = path.resolve(__dirname, '../docs/mike-platformer/l2-look'); fs.mkdirSync(OUT, { recursive:true });
const PORT = 9352, BASE = (process.env.MIKE_URL || 'http://localhost:8788/mike-game/') + 'level-2.html';
const args = process.argv.slice(2), ONLY_SCENES = args[0] === 'scenes', PICK = args.slice(1);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.resolve(__dirname, '../.wrangler/mike-l2-test')}`,
  '--no-first-run', '--autoplay-policy=no-user-gesture-required', '--window-size=960,540', 'about:blank'], { stdio:'ignore', windowsHide:true });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let ws;
(async () => {
  let tabs; for (let i = 0; i < 60; i++){ try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch {} await sleep(150); }
  if (!tabs) throw Error('The isolated test browser did not start');
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let next = 0; const pending = new Map(), errors = [], requests = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && pending.has(d.id)){ pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(x => x.value || x.description).join(' '));
    if (d.method === 'Network.responseReceived' && d.params.response.status >= 400) errors.push('HTTP ' + d.params.response.status + ' ' + d.params.response.url);
    if (d.method === 'Network.requestWillBeSent') requests.push(d.params.request.url); };
  const send = (method, params = {}) => new Promise((r, j) => { const id = ++next, timer = setTimeout(() => { pending.delete(id); j(Error('Timed out: ' + method)); }, 120000);
    pending.set(id, d => { clearTimeout(timer); if (d.error) j(Error(JSON.stringify(d.error))); else r(d.result); }); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  const open = async (query = '', width = 960, height = 540, mobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile }); await send('Emulation.setTouchEmulationEnabled', { enabled:mobile, maxTouchPoints:5 });
    await send('Page.navigate', { url:BASE + query });
    for (let i = 0; i < 200; i++){ await sleep(100); if (await ev('document.body && document.body.dataset.ready') === '1') return; }
    throw Error('Boot failed: ' + await ev('document.body.innerText') + ' ' + errors.join('\n'));
  };
  const shot = async name => { const d = await send('Page.captureScreenshot'); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(d.data, 'base64')); };
  const result = {};
  if (args[0] === 'boss-start'){
    await open('?test=1');
    const saved = await ev(`(() => { const keys=['mike-game.l2.v1.save','mike-game.l2.v1.progress']; const old=keys.map(k=>localStorage.getItem(k)); keys.forEach(k=>localStorage.setItem(k,'{}')); return old; })()`);
    try {
      await open('?room=boss&test=1');
      const start = await ev(`({snap:__l2.snapshot(),health:__l2.S.health,suit:__l2.S.suit,claimed:__l2.S.got.has('l6-1'),cards:__l2.S.inv.sdCard})`);
      assert.equal(start.snap.x,470); assert.equal(start.snap.checkpoint.x,470); assert.equal(start.snap.boss.on,false);
      assert.equal(start.health,3); assert.ok(start.suit); assert.equal(start.claimed,false); assert.equal(start.cards,4);
      await ev('__l2.S.health=2; __l2.step(26,{right:true})');
      assert.ok(await ev("__l2.S.got.has('l6-1') && __l2.S.health===3"), 'nearby health can be collected normally');
      await ev('__l2.save(); __l2.clearSave()');
      assert.equal(await ev("localStorage.getItem('mike-game.l2.v1.save')"),'{}', 'test start preserves the normal save');
      await open('?room=boss&test=1'); assert.equal(await ev("__l2.S.got.has('l6-1')"),false, 'refresh resets the pickup');
      assert.deepEqual(errors,[]); console.log('Boss test URL passed',JSON.stringify(start));
    } finally {
      await ev(`['mike-game.l2.v1.save','mike-game.l2.v1.progress'].forEach((k,i)=>{const v=${JSON.stringify(saved)}[i]; if(v===null)localStorage.removeItem(k); else localStorage.setItem(k,v);})`);
    }
    await send('Browser.close'); ws.close(); chrome.kill(); return;
  }

  // ---- captures: every still scene of the real level
  await open('?scene=title&test=1'); const scenes = await ev('__l2.scenes()');
  for (const s of scenes){ if (PICK.length && !PICK.includes(s)) continue; await open('?scene=' + s + '&test=1'); await sleep(120); await shot(s); }
  if (!PICK.length || PICK.includes('phone')){ await open('?scene=r2-under&test=1', 844, 390, true); await sleep(120); await shot('phone-r2-under'); await open('?scene=boss-idle&test=1', 1024, 768, true); await sleep(120); await shot('ipad-boss-idle'); }
  result.scenes = scenes;
  if (!ONLY_SCENES){
    // ---- the game itself, stepped by hand
    await open('?test=1'); await ev('__l2.clearSave(); __l2.reset()');
    let s = await ev('__l2.snapshot()'); assert.equal(s.mode, 'play'); assert.equal(s.suit, false); assert.ok(Math.abs(s.x - 3) < .01);
    // real keyboard events
    await ev('__l2.release()'); await send('Input.dispatchKeyEvent', { type:'keyDown', key:'ArrowRight', code:'ArrowRight' }); await sleep(900); await send('Input.dispatchKeyEvent', { type:'keyUp', key:'ArrowRight', code:'ArrowRight' });
    s = await ev('__l2.snapshot()'); assert.ok(s.x > 5, 'the keyboard moves Mike'); result.keyboard = { x:s.x };
    // the airlock: shut without the suit, open with it
    s = await ev('__l2.reset(); __l2.place(13, 12); __l2.step(90, { right:true })'); assert.ok(s.x < 15, 'the airlock holds');
    s = await ev('__l2.place(11.5, 12); __l2.step(40, {}); __l2.place(13, 12); __l2.step(90, { right:true })'); assert.ok(s.suit && s.x > 16, 'the suit opens the airlock');
    // the fluid: he floats with his helmet out and earthed; Down looks below on dry land and dives in the fluid
    s = await ev('__l2.place(32, 10); __l2.step(240, {})'); assert.ok(s.wet && !s.headWet && Math.abs(s.y - 14) < .01, 'he floats in the basin with his head out');
    const key = async (code, ms) => { await send('Input.dispatchKeyEvent', { type:'keyDown', key:code, code }); await sleep(ms); const r = await ev('__l2.snapshot()'); await send('Input.dispatchKeyEvent', { type:'keyUp', key:code, code }); await sleep(60); return r; };
    assert.equal(s.static, 0); await ev('__l2.release()');
    s = await key('ArrowDown', 700); assert.ok(s.y > 15 && s.headWet && s.static > 0 && s.lookDown, 'Down dives in the fluid, the view leads, and static builds');
    await ev('__l2.step(1, {})'); await ev('__l2.release()'); s = await key('KeyS', 500); assert.ok(s.y > 14.5, 'S dives too'); await ev('__l2.step(1, {})'); await ev('__l2.release()'); s = await key('KeyX', 500); assert.ok(s.y > 14.5, 'and so does X');
    await ev('__l2.place(21, 12); __l2.release()'); const cam0 = (await ev('__l2.snapshot()')).camY; s = await key('ArrowDown', 700); assert.ok(Math.abs(s.y - 12) < .01 && Math.abs(s.x - 21) < .01 && s.camY > cam0 + 60 && s.lookDown, 'Down looks below on dry land and moves nothing');
    result.downKey = { divesInFluid:true, looksOnLand:true }; await ev('__l2.step(1, {})');
    // the transfer valve, a save and a reload
    s = await ev('__l2.reset(4); __l2.place(282, 10); __l2.step(2, {}); __l2.step(1, { fix:true }); __l2.step(60, { fix:true })'); assert.equal(s.valves.transfer, 1); assert.ok(s.tanks.resA.level > 14.2 && s.tanks.resA.level < 14.4, 'the one wheel, on the divider, moves both tanks');
    await ev('__l2.reset(); __l2.place(19, 12, { suit:true }); __l2.step(5, {}); __l2.place(24, 12); __l2.step(5, {}); __l2.save()');
    await open('?test=1'); assert.ok(await ev('__l2.resume()'), 'a save is found after reloading'); s = await ev('__l2.snapshot()'); assert.ok(s.suit && s.checkpoint.x === 19 && s.got === 1, 'and restores the suit, the checkpoint and the pickup'); result.save = true;
    await ev('__l2.clearSave()');
    // Explicit repair guidance and real page save/reload during the new restoration sequence.
    await ev('__l2.reset(); __l2.place(481,24,{suit:true}); Object.assign(__l2.S.boss,{on:true,variant:0,step:0,t:0}); __l2.step(2,{dive:true})');
    assert.ok(await ev('__l2.S.boss.eligible'), 'desktop hold helper is at the active service point');
    await shot('repair-helper');
    await ev('Object.assign(__l2.S.boss,{done:true,step:6,pass:1,doneT:0,restoreT:0}); MIKE.L2.setTank(__l2.S,"sump","drain"); __l2.save(); __l2.step(360,{})');
    s = await ev('__l2.snapshot()'); assert.equal(s.won,false); assert.equal(s.tanks.sump.level,23.6);
    await shot('restoration-cut');
    await ev('__l2.step(100,{})'); await shot('restoration-exit');
    await open('?test=1'); assert.ok(await ev('__l2.resume()'));
    s = await ev('__l2.step(600,{})'); assert.ok(s.won && s.mode === 'results', 'the actual page resumes a completed save into results');
    result.completedSave = true;
    await ev('__l2.clearSave()');
    // touch: every control is there and big enough; Dive appears with the suit; a touch-cancel releases
    await open('?room=2&test=1', 844, 390, true); await ev('__l2.release()'); await sleep(200);
    result.touch = await ev(`Array.from(document.querySelectorAll('.tc')).map(b => { const r = b.getBoundingClientRect(); return { ctl:b.dataset.ctl, w:r.width, h:r.height, visible:getComputedStyle(b).display !== 'none' }; })`);
    for (const b of result.touch) if (b.ctl !== 'fix') assert.ok(b.visible && b.w >= 62 && b.h >= 62, 'touch control ' + b.ctl);
    const pt = await ev(`(() => { const r = document.querySelector('[data-ctl=right]').getBoundingClientRect(); return { id:1, x:r.x + r.width/2, y:r.y + r.height/2 }; })()`);
    const x0 = await ev('__l2.snapshot().x'); await send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[pt] }); await sleep(600); assert.ok(await ev('__l2.snapshot().x') > x0 + 1, 'touch Run moves him');
    await send('Input.dispatchTouchEvent', { type:'touchCancel', touchPoints:[] }); await sleep(400); const x1 = await ev('__l2.snapshot().x'); await sleep(300); assert.ok(Math.abs(await ev('__l2.snapshot().x') - x1) < .05, 'a cancelled touch lets go');
    await ev('__l2.place(481,24,{suit:true}); Object.assign(__l2.S.boss,{on:true,variant:0,step:0,t:0}); __l2.step(2,{dive:true})');
    assert.ok(await ev('__l2.S.boss.eligible'), 'touch hold helper is at the active service point');
    assert.ok(await ev('document.getElementById("tc-fix").getBoundingClientRect().width >= 62'), 'touch Fix appears at the service point');
    await shot('phone-repair-helper');
    // pause clears held input and stops the clock
    await ev(`document.getElementById('pause').click()`); await sleep(200); const t0 = await ev('__l2.snapshot().time'); await sleep(300); assert.equal(await ev('__l2.snapshot().time'), t0); assert.ok(await ev('__l2.snapshot().paused'));
    // speed: real frames for three seconds in the busiest room
    await open('?room=5&test=1'); await ev('__l2.release()'); await sleep(3200); result.perf = await ev('__l2.perf()');
    // nothing is fetched once the game is running
    const before = requests.length; await sleep(1500); result.requestsAfterLoad = requests.length - before; assert.equal(result.requestsAfterLoad, 0);
    // the recorded run, if there is one, wins through the page's own loop
    if (fs.existsSync(path.resolve(__dirname, '../public/fireworks/mike-game/demo-2.json'))){
      await open('?demo=1&test=1'); const r = await ev('__l2.runDemo()'); result.demo = { steps:r.steps, seconds:+(r.steps/60).toFixed(1), won:r.won, score:r.results && r.results.score, salvage:r.results && r.results.salvage };
      assert.ok(r.won, 'the recorded run wins in the browser'); await sleep(200); await shot('demo-end');
    }
  }
  assert.deepEqual(errors, [], 'no console or network errors'); result.errors = errors;
  fs.writeFileSync(path.join(OUT, ONLY_SCENES ? 'scene-captures.json' : 'browser.json'), JSON.stringify(result, null, 2)); console.log('Level 2 browser checks passed', JSON.stringify(result.perf || {}), result.demo || '');
  await send('Browser.close'); ws.close(); chrome.kill();
})().catch(e => { console.error(e); if (ws) ws.close(); chrome.kill(); process.exitCode = 1; });
