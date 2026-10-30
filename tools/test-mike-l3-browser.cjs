// Level 3 in a real browser: a fresh, isolated headless Chrome (never a user's profile), the local server on 8788.
//   node tools/test-mike-l3-browser.cjs            every check and every capture
//   node tools/test-mike-l3-browser.cjs scenes     captures only (add scene names to limit them)
// Needs: node tools/serve-fireworks.cjs 8788. Writes docs/mike-platformer/l3-look/*.png and browser.json.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const OUT = path.resolve(__dirname, '../docs/mike-platformer/l3-look'); fs.mkdirSync(OUT, { recursive:true });
const PORT = 9353, BASE = (process.env.MIKE_URL || 'http://localhost:8788/mike-game/') + 'level-3.html';
const args = process.argv.slice(2), ONLY_SCENES = args[0] === 'scenes', PICK = args.slice(1);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.resolve(__dirname, '../.wrangler/mike-l3-test')}`,
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
  const key = async (code, ms) => { await send('Input.dispatchKeyEvent', { type:'keyDown', key:code, code }); await sleep(ms); await send('Input.dispatchKeyEvent', { type:'keyUp', key:code, code }); await sleep(60); };
  const result = {};

  // ---- captures: every still scene of the real level
  await open('?scene=title&test=1'); const scenes = await ev('__l3.scenes()');
  for (const s of scenes){ if (PICK.length && !PICK.includes(s)) continue; await open('?scene=' + s + '&test=1'); await sleep(150); await shot(s); }
  if (!PICK.length || PICK.includes('phone')){ await open('?scene=cell-row&test=1', 844, 390, true); await sleep(150); await shot('phone-cell-row'); await open('?scene=boss-break&test=1', 1024, 768, true); await sleep(150); await shot('ipad-boss-break'); }
  result.scenes = scenes;
  if (!ONLY_SCENES){
    // ---- the game itself
    await open('?test=1'); await ev('__l3.clearSave(); __l3.reset()');
    let s = await ev('__l3.snapshot()'); assert.equal(s.mode, 'play'); assert.ok(Math.abs(s.x - 3) < .01);
    await ev('__l3.release()'); await key('ArrowRight', 500);
    s = await ev('__l3.snapshot()'); assert.ok(s.x > 4.5, 'the keyboard moves Mike'); result.keyboard = { x:s.x };
    // the first ride, stepped: stand on the mint pad and wait
    s = await ev('__l3.place(8.5, 12); __l3.step(25, { right:true })'); assert.ok(s.ride === 'c1', 'walking into the first cobot gets him picked up'); await shot('play-first-ride');
    s = await ev('__l3.step(120, {})'); assert.ok(!s.ride && Math.abs(s.y - 4) < .01 && Math.abs(s.x - 17) < .05, 'and sets him down on the mezzanine');
    // a real Space press grabs the hook, another lets go
    await ev(`__l3.place(25.4, 4); (() => { const h = __l3.L.hooks.find(h => h.id === 'h1'); let n = 0; while (MIKE.L3.hookPose(h, __l3.S.mt).f === 0 && n++ < 900) __l3.step(1, {}); while (MIKE.L3.hookPose(h, __l3.S.mt).f > 0 && n++ < 1800) __l3.step(1, {}); })(); __l3.release()`); await key('Space', 120);
    s = await ev('__l3.snapshot()'); assert.equal(s.hang, 'h1', 'a real Space press grabs the hook'); await sleep(900); await shot('play-hook');
    await key('Space', 80); await ev('__l3.step(1, {})'); s = await ev('__l3.snapshot()'); assert.equal(s.hang, null, 'another lets go');
    // Down looks below and moves nothing
    await ev('__l3.place(20, 4); __l3.step(2, {}); __l3.release()'); const cam0 = await ev('__l3.snapshot().camY');
    await send('Input.dispatchKeyEvent', { type:'keyDown', key:'ArrowDown', code:'ArrowDown' }); await sleep(700); s = await ev('__l3.snapshot()'); await send('Input.dispatchKeyEvent', { type:'keyUp', key:'ArrowDown', code:'ArrowDown' });
    assert.ok(s.lookDown && s.camY > cam0 + 60 && Math.abs(s.x - 20) < .01, 'Down looks below'); result.lookDown = s.camY - cam0; await ev('__l3.step(1, {})');
    // a save and a reload
    await ev('__l3.reset(); __l3.place(120.2, 12); __l3.step(3, {}); __l3.place(121, 12); __l3.step(3, {}); __l3.save()');
    await open('?test=1'); assert.ok(await ev('__l3.resume()'), 'a save is found after reloading'); s = await ev('__l3.snapshot()'); assert.ok(s.checkpoint.x === 121, 'and restores the checkpoint'); result.save = true;
    await ev('__l3.clearSave()');
    // the Teach Cell, in the page: the arm drops its crate where the route breaks; holding E at that dial re-teaches it
    await open('?room=boss&test=1'); s = await ev('__l3.step(2, {})'); assert.equal(s.checkpoint.x, 349);
    s = await ev('__l3.place(354.4, 12); __l3.step(3, {})'); assert.ok(s.boss.on, 'the Teach Cell wakes');
    const brk = await ev(`MIKE.L3.routeFor(__l3.S, __l3.L.boss.rounds[0].sources[0]).end`); await ev('__l3.step(150, {})'); await shot('play-boss-route');
    const stand = await ev(`__l3.L.boss.nodes['${brk}'].stand`), d0 = await ev(`__l3.S.boss.dials['${brk}']`);
    await ev(`__l3.place(${stand[0]}, ${stand[1]}); __l3.step(2, {}); __l3.step(60, { fix:true })`); await shot('play-boss-reteach');
    // the page's wiring, not his survival (the run test proves that): kept out of harm's way, still allowed to hold
    await ev(`(() => { __l3.place(${stand[0]}, ${stand[1]}); __l3.step(2, {}); let n = 0; while (__l3.S.boss.dials['${brk}'] === ${d0} && n++ < 200){ __l3.S.P.hitT = .5; __l3.step(1, { fix:true }); } })()`);
    assert.notEqual(await ev(`__l3.S.boss.dials['${brk}']`), d0, 'holding E at the broken dial re-taught it');
    result.boss = { brokeAt:brk, reTaught:true };
    // touch: every control is there and big enough; Use appears at a key
    await open('?room=boss&test=1', 844, 390, true); await ev('__l3.release()'); await sleep(200);
    result.touch = await ev(`Array.from(document.querySelectorAll('.tc')).map(b => { const r = b.getBoundingClientRect(); return { ctl:b.dataset.ctl, w:r.width, h:r.height, visible:getComputedStyle(b).display !== 'none' }; })`);
    for (const b of result.touch) if (b.ctl !== 'fix') assert.ok(b.visible && b.w >= 62 && b.h >= 62, 'touch control ' + b.ctl);
    const pt = await ev(`(() => { const r = document.querySelector('[data-ctl=right]').getBoundingClientRect(); return { id:1, x:r.x + r.width/2, y:r.y + r.height/2 }; })()`);
    const x0 = await ev('__l3.snapshot().x'); await send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[pt] }); await sleep(600); assert.ok(await ev('__l3.snapshot().x') > x0 + 1, 'touch Run moves him');
    await send('Input.dispatchTouchEvent', { type:'touchCancel', touchPoints:[] }); await sleep(300);
    await ev('__l3.place(354.4, 12); __l3.step(3, {}); __l3.place(357.2, 12); __l3.step(2, {})');
    assert.ok(await ev('document.getElementById("tc-fix").getBoundingClientRect().width >= 62'), 'touch Use appears at a dial'); await shot('phone-boss-dial');
    // pause stops the clock
    await ev('__l3.release()'); await ev(`document.getElementById('pause').click()`); await sleep(200); const t0 = await ev('__l3.snapshot().time'); await sleep(300); assert.equal(await ev('__l3.snapshot().time'), t0); assert.ok(await ev('__l3.snapshot().paused'));
    // speed: real frames for three seconds in the busiest stretch, and nothing fetched once running
    await open('?room=3&test=1'); await ev('__l3.place(84, 4); __l3.release()'); await sleep(3200); result.perf = await ev('__l3.perf()');
    const before = requests.length; await sleep(1500); result.requestsAfterLoad = requests.length - before; assert.equal(result.requestsAfterLoad, 0);
    // the locked screen off the local network is covered by the gate function; here, the title
    await open('?test=1'); await sleep(200); await shot('play-title');
  }
  assert.deepEqual(errors, [], 'no console or network errors'); result.errors = errors;
  fs.writeFileSync(path.join(OUT, ONLY_SCENES ? 'scene-captures.json' : 'browser.json'), JSON.stringify(result, null, 2)); console.log('Level 3 browser checks passed', JSON.stringify(result.perf || {}));
  await send('Browser.close'); ws.close(); chrome.kill();
})().catch(e => { console.error(e); if (ws) ws.close(); chrome.kill(); process.exitCode = 1; });
