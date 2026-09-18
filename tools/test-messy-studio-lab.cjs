// CDP harness for little-patterns/studio-lab.html: real-time run, touch gestures, screenshots, console errors.
// Marbles: no tilt (dropped 17 Sept 2026); see docs/messy-studio-brief.md.
// Needs the preview server on 8788 (node tools/serve-fireworks.cjs 8788). Usage: node tools/test-messy-studio-lab.cjs 1024x698 ipad
// Screenshots go to LAB_OUT or the system temp folder.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path');
const assert = require('node:assert/strict');
const SP = process.env.LAB_OUT || require('os').tmpdir(), PORT = 9333, [W, H] = (process.argv[2] || '1024x698').split('x').map(Number), tag = process.argv[3] || 'ipad';
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(SP, 'prof-' + tag)}`,
  '--no-first-run', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ver; for (let i = 0; i < 40; i++){ try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (ver.length) break; } catch(e){} await sleep(250); }
  const ws = new WebSocket(ver.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const wait = new Map(), errors = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)){ wait.get(d.id)(d); wait.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value).join(' ')); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => {const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.result?.exceptionDetails){const loc=await send('Runtime.evaluate',{expression:'location.href',returnByValue:true});throw Error(JSON.stringify({url:loc.result?.result?.value,detail:r.result.exceptionDetails}));}return r.result?.result?.value;};
  const shot = async n => fs.writeFileSync(path.join(SP, `lab-${tag}-${n}.png`), Buffer.from((await send('Page.captureScreenshot')).result.data, 'base64'));
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: 'http://localhost:8788/little-patterns/studio-lab.html?lab=1&seed=11' }); await sleep(800);
  // Gestures are given in SHEET pixels (the sheet is 1600x1200 on every device) and mapped to the glass through the page's own view.
  let G = null; const geo = async () => { G = JSON.parse(await ev('JSON.stringify({g:window.__lab.GEO,v:window.__lab.VIEW,p:window.__lab.paper})')); };
  const scr = (x, y) => { const a = G.v.r * Math.PI / 180, c = Math.cos(a), n = Math.sin(a), qx = (x - G.p.W / 2) * G.g.s, qy = (y - G.p.H / 2) * G.g.s; return { x: G.g.cx + G.v.tx + qx * c - qy * n, y: G.g.cy + G.v.ty + qx * n + qy * c }; };
  const raw = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const touch = (type, x, y) => raw(type, type === 'touchEnd' ? [] : [scr(x, y)]);
  const click = async sel => { const p = await ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(120); };
  const gesture = async (x, y, dx, dy, ms, holdMs = 0) => { await geo(); const p = scr(x, y); if(process.env.LAB_DEBUG)console.log('gesture',p,dx,dy,await ev(`document.elementFromPoint(${p.x},${p.y})?.id`));await raw('touchStart', [p]); if (holdMs) await sleep(holdMs);      // dx, dy are pixels on the glass
    const n = Math.max(1, Math.round(ms / 16)); for (let i = 1; i <= n; i++){ await raw('touchMove', [{ x: p.x + dx * i / n, y: p.y + dy * i / n }]); await sleep(16); } await raw('touchEnd', []); await sleep(80); };
  await geo();
  // 0. the four brushes, one wavy line each
  const gw = G.p.W, gh = G.p.H;
  const wave = async (y) => { await geo(); await touch('touchStart', gw * .06, y); for (let i = 1; i <= 40; i++){ await touch('touchMove', gw * (.06 + .4 * i / 40), y + Math.sin(i / 40 * 6.283) * gh * .05); await sleep(8); } await touch('touchEnd'); await sleep(60); };
  let row = 0; for (const b of ['round', 'flat', 'crayon', 'sponge']){ await click(`[data-brush="${b}"]`); await click(`.sw[data-c="${['#e5383b', '#2a9d4a', '#2f5fd0', '#c9379d'][row]}"]`); await wave(gh * (.12 + row * .12)); row++; }
  await shot('0-brushes');
  // 0b. the phone is turned on its side: the viewport rotates, the paper must not move, shrink or lose its bitmap
  const before = await ev('JSON.stringify(window.__lab.paper)');
  await send('Emulation.setDeviceMetricsOverride', { width: H, height: W, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } }); await sleep(700); await shot('0b-turned');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } }); await sleep(700);
  await send('Emulation.setDeviceMetricsOverride', { width: H, height: W, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } }); await sleep(700);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } }); await sleep(700); await shot('0c-back');
  const after = await ev('JSON.stringify(window.__lab.paper)');
  const rotation = { paperUnchanged: before === after, paper: JSON.parse(after) };
  await click('#new');
  // 0e. two fingers: the second lands 40 ms after the first, they spread, and nothing must be painted; then one finger paints where it points
  await geo(); const cx = G.g.cx, cy = G.g.cy, P = (id, x, y) => ({ id, x, y });
  await raw('touchStart', [P(1, cx - 40, cy)]); await sleep(40); await raw('touchStart', [P(1, cx - 40, cy), P(2, cx + 40, cy)]);
  for (let i = 1; i <= 14; i++){ await raw('touchMove', [P(1, cx - 40 - i * 8, cy - i * 3), P(2, cx + 40 + i * 8, cy + i * 3)]); await sleep(16); }
  await raw('touchEnd', []); await sleep(120);
  const pinch = { zoom: await ev('window.__lab.VIEW.z'), inkAfterPinch: await ev('window.__lab.inked()'), fitButtonShown: await ev('!document.querySelector("#fit").hidden') };
  await click('[data-tool="brush"]'); await geo(); const target = await ev('JSON.stringify(window.__lab.toSheet(' + cx + ',' + (cy + 30) + '))');
  await raw('touchStart', [{ x: cx, y: cy + 30 }]); for (let i = 1; i <= 10; i++){ await raw('touchMove', [{ x: cx + i * 6, y: cy + 30 }]); await sleep(16); } await raw('touchEnd', []); await sleep(80);
  const t = JSON.parse(target); pinch.strokeLandsUnderFinger = await ev(`(()=>{const c=document.querySelector('#paint');return c.getContext('2d').getImageData(${Math.round(t.x)},${Math.round(t.y)},1,1).data[3]>0})()`);
  await shot('0e-zoomed'); await click('#fit'); pinch.zoomAfterFit = await ev('window.__lab.VIEW.z'); await click('#new');
  assert.equal(pinch.zoomAfterFit,1,'Fit must reset zoom before testing gestures');
  // 0f. potato stamps: a tap prints a mottled shape; a held press of the same shape lays more paint (thicker, messier edge); Undo takes a press back
  await click('#new'); await click('[data-tool="stamp"]'); await click('[data-stamp="star"]'); await geo();
  let sp = scr(450, 600); await raw('touchStart', [sp]); await sleep(30); await raw('touchEnd', []); await sleep(150); const inkTap = await ev('window.__lab.inked()');
  sp = scr(1150, 600); await raw('touchStart', [sp]); await sleep(1300); await raw('touchEnd', []); await sleep(150); const inkHold = await ev('window.__lab.inked()');
  await shot('0f-stamps'); await click('#undo'); await sleep(200);
  const stamps = { inkTap, inkAdded: inkHold - inkTap, holdLaysMoreThanTap: inkHold - inkTap > inkTap * 1.25, undoRemovesPress: Math.abs(await ev('window.__lab.inked()') - inkTap) <= 2, stampButtons: await ev('document.querySelectorAll("[data-stamp]").length') };
  // 1. gesture vocabulary, one row each, several colours in the bucket
  await click('[data-tool="flick"]'); for (const c of ['#f9c74f', '#2a9d4a', '#c9379d']) await click(`.sw[data-c="${c}"]`);
  await gesture(gw * .08, gh * .2, 0, 0, 0, 40);            // quick tap
  await gesture(gw * .08, gh * .5, 0, 0, 0, 600);           // half hold
  await gesture(gw * .08, gh * .8, 0, 0, 0, 1300);          // full hold
  await gesture(gw * .25, gh * .2, 40, 0, 60);              // short flick
  await gesture(gw * .25, gh * .5, 110, -20, 80);           // medium flick
  await gesture(gw * .25, gh * .8, 220, -60, 90);           // fast flick
  await gesture(gw * .6, gh * .85, 300, -40, 900);          // slow drag = dribble
  await shot('1-flicks'); const splatInfo = await ev('document.querySelector("#perf").textContent');
  // 2. marbles: one per tap up to three, a fourth replaces the first, still until flicked, frozen by another tool, woken by a touch
  const M = x => ev('JSON.stringify(window.__lab.M.list.map(m=>' + x + '))'), where = () => M('[Math.round(m.x),Math.round(m.y)]'), running = () => ev('!!window.__lab.M.raf');
  await click('#new'); await click('#test');
  const marbles = {};
  for (let i = 0; i < 3; i++) await click('[data-tool="marbles"]');
  marbles.three = await M('m.kind.name'); const first = JSON.parse(marbles.three)[0];
  await click('[data-tool="marbles"]'); marbles.afterFourth = await M('m.kind.name');
  marbles.fourthReplacedFirst = JSON.parse(marbles.afterFourth).length === 3 && !JSON.parse(marbles.afterFourth).includes(first) && JSON.parse(marbles.afterFourth)[0] === JSON.parse(marbles.three)[1];
  const p0 = await where(); await sleep(1200); marbles.stillUntilFlicked = p0 === await where() && !(await running());
  const a = JSON.parse(p0)[0]; await geo(); const as = scr(a[0], a[1]); await gesture(a[0], a[1], 220 * (as.x > G.g.cx ? -1 : 1), 130 * (as.y > G.g.cy ? -1 : 1), 110);      // drag and let go: a flick towards the middle
  await sleep(150); marbles.movingAfterFlick = await running(); await shot('2-marble-flicked');
  await click('[data-tool="brush"]'); marbles.toolAfterBrushTap = await ev('window.__lab.S.tool'); const f0 = await where(); await sleep(600); marbles.frozenByOtherTool = f0 === await where() && !(await running());
  marbles.speedKeptWhileFrozen = await ev('window.__lab.M.list.some(m => m.vx || m.vy)');
  const b = JSON.parse(f0)[1]; await geo(); await touch('touchStart', b[0], b[1]); await sleep(60); await touch('touchEnd'); await sleep(250);             // touch a different marble while Brush is the tool
  marbles.toolAfterTouchingMarble = await ev('window.__lab.S.tool'); marbles.othersCarryOn = f0 !== await where();
  await sleep(7000); marbles.cameToRest = !(await running()); await shot('3-marbles-rest');
  const run = await ev('JSON.stringify(window.__lab.lastRun)');
  await click('#away'); const left = await ev('document.querySelectorAll(".marble").length');
  console.log(JSON.stringify({ view: G, rotation, pinch, stamps, splatInfo, marbles, run: JSON.parse(run || 'null'), marblesLeftOnScreen: left, errors }, null, 1));
  assert.ok(stamps.inkTap>0&&stamps.holdLaysMoreThanTap,'a held press must lay down clearly more paint than a tap');assert.ok(stamps.undoRemovesPress,'Undo must take back the whole press');assert.equal(stamps.stampButtons,11);
  assert.deepEqual(errors,[]);assert.equal(rotation.paperUnchanged,true);assert.equal(pinch.inkAfterPinch,0);assert.ok(pinch.zoom>1);assert.equal(pinch.strokeLandsUnderFinger,true);assert.equal(pinch.zoomAfterFit,1);
  for(const name of ['fourthReplacedFirst','stillUntilFlicked','movingAfterFlick','frozenByOtherTool','speedKeptWhileFrozen','othersCarryOn','cameToRest'])assert.equal(marbles[name],true,name);
  assert.equal(marbles.toolAfterBrushTap,'brush');assert.equal(marbles.toolAfterTouchingMarble,'marbles');assert.equal(left,0);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
